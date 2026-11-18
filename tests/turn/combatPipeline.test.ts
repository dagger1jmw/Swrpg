// M5 step 6: combat through the pipeline (architecture §3-4; D-29, D-30, D-145, D-146): a deferred combatStarted
// resolves the next turn; quiet beats make no call; a 150-exchange duel with default play uses 12 calls or fewer; a
// typed sequence uses one narration call plus the intent call; truncation retries keep the same dice; wounds end a
// fight without combatEnded; the AI cannot set deceased.
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { DUEL_CALL_BUDGET } from '../../src/data/combat.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import type { DuelState } from '../../src/engine/duel';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { narrateTurn, playTurn, prepareTurn, TurnError, type Session, type TurnDeps } from '../../src/turn/pipeline';
import type { TurnInput } from '../../src/turn/record';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const reply = (events: unknown[] = []) => ({
  narrative: 'Blades meet in a shower of sparks.',
  choices: [
    { label: 'Press the attack', intent: { actionType: 'fight' } },
    { label: 'Give ground', intent: { actionType: 'fight' } },
  ],
  scene: { moodTags: ['tense'] },
  events,
});

function setup(steps: FixtureStep[]) {
  const provider = createFixtureProvider(steps);
  const storage = createMemoryStorage();
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
  let ms = Date.UTC(2026, 10, 17);
  const deps: TurnDeps = { registry: REGISTRY, provider, router, storage, getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) };
  return { provider, deps };
}

const many = (n: number): FixtureStep[] => Array.from({ length: n }, () => ({ callType: 'narrative' as const, data: reply() }));

function session(level = 70, seed = 'duel'): Session {
  let state = createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed,
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - 35 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(level), forceSense: xpForLevel(level), endurance: xpForLevel(60), strength: xpForLevel(50), willpower: xpForLevel(60), forcePush: xpForLevel(50) },
    startingE: { soresu: { E: 50, eSpar: 15 } },
    rank: 'master',
  });
  state = applyEvents(REGISTRY, state, [{ type: 'npcIntroduced', name: 'Darth Vek', species: 'human', faction: 'sithEmpire', role: 'sithLord', ageApprox: 45, description: '' }], { source: 'ai' }).state;
  return { state, history: [], campaign: { campaignId: 'c1', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } };
}
const vek = (s: Session) => Object.values(s.state.npcs.byId).find((n) => n.name === 'Darth Vek')!.id;
const beat = (action: string, extra: Record<string, unknown> = {}): TurnInput => ({ kind: 'beat', label: action, action: { action, ...extra } as never });

/** A session with the fight already begun (pending -> fightBegun at the next step b). */
async function inFight(deps: TurnDeps, s: Session): Promise<Session> {
  const pending = applyEvents(REGISTRY, s.state, [{ type: 'combatStarted', opponentRefs: [vek(s)], stakes: 'lethal', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
  return (await playTurn(deps, { ...s, state: pending }, beat('narrate'))).session;
}

describe('deferred start (D-29)', () => {
  it('combatStarted in a reply is stored and resolved at the next turn’s step b', async () => {
    const s0 = session();
    const { deps } = setup([{ callType: 'narrative', data: reply([{ type: 'combatStarted', opponentRefs: [vek(s0)], stakes: 'serious', terrainTags: ['open'] }]) }, ...many(2)]);
    const t1 = await playTurn(deps, s0, { kind: 'choice', choice: { label: 'Draw your saber', intent: { actionType: 'other' } } });
    expect(t1.session.state.combat.pending).not.toBeNull();
    expect(t1.session.state.combat.active).toBeNull();
    const t2 = await playTurn(deps, t1.session, beat('continue'));
    expect(t2.record.draft.applied.some((a) => a.event.type === 'fightBegun')).toBe(true);
    expect(t2.record.draft.combat?.started).toBe(true);
    expect(t2.session.state.pacing.level).toBe('moment');
  });
});

describe('the call budget (D-145)', () => {
  it('quiet beats make no AI call', async () => {
    const { deps, provider } = setup(many(40));
    let s = await inFight(deps, session());
    const before = provider.calls.length;
    let quiet = 0;
    for (let i = 0; i < 20 && s.state.combat.active; i++) {
      const t = await playTurn(deps, s, beat('continue'));
      s = t.session;
      if (t.record.draft.combat?.quiet) {
        quiet++;
        expect(t.record.calls).toHaveLength(0);
        expect(t.record.narrative.length).toBeGreaterThan(0);
      }
    }
    expect(quiet).toBeGreaterThan(0);
    expect(provider.calls.length - before).toBeLessThan(20);
  });
  it(`a ${DUEL_CALL_BUDGET.exchanges}-exchange duel with default play uses ${DUEL_CALL_BUDGET.maxCalls} calls or fewer`, async () => {
    // Two evenly matched masters with strong precognition make a long duel; default play presses Continue each beat.
    let longest = 0;
    for (const seed of ['long1', 'long2', 'long3', 'long4', 'long5', 'long6']) {
      const { deps, provider } = setup(many(200));
      let s = await inFight(deps, session(70, seed));
      const start = provider.calls.length;
      let exchanges = 0;
      for (let i = 0; i < 400 && s.state.combat.active && exchanges < DUEL_CALL_BUDGET.exchanges; i++) {
        s = (await playTurn(deps, s, beat('continue'))).session;
        exchanges = s.state.combat.active ? (s.state.combat.active.duel as DuelState).exchange : DUEL_CALL_BUDGET.exchanges;
      }
      const calls = provider.calls.length - start;
      longest = Math.max(longest, calls);
      expect(calls, `seed ${seed}`).toBeLessThanOrEqual(DUEL_CALL_BUDGET.maxCalls);
    }
    expect(longest).toBeGreaterThan(0);
  });
});

describe('typed sequences (D-146)', () => {
  it('a typed sequence uses one narration call (plus the intent call)', async () => {
    const s0 = session();
    const { deps, provider } = setup([...many(1), { callType: 'intent', data: { actionType: 'fight', targets: [], references: [], unknownNames: [], sequence: [{ kind: 'stance', stance: 'aggressive' }, { kind: 'forceAction', action: 'push' }, { kind: 'strike' }] } }, ...many(1)]);
    const s1 = await inFight(deps, s0);
    const before = provider.calls.length;
    const t = await playTurn(deps, s1, { kind: 'typed', text: 'I go aggressive, Force-push him off balance and strike' });
    expect(provider.calls.slice(before).map((c) => c.opts.callType)).toEqual(['intent', 'narrative']);
    expect(t.record.draft.combat?.beat).toBe('sequence');
    expect(t.record.draft.combat?.records.some((r) => r.step !== undefined)).toBe(true);
  });
});

describe('dice and rules in the pipeline', () => {
  it('a truncation retry keeps the same duel dice', async () => {
    const s0 = session();
    const { deps } = setup([...many(1), { callType: 'narrative', error: { kind: 'truncated' } }, ...many(1)]);
    const s1 = await inFight(deps, s0);
    const pending = await prepareTurn(deps, s1, beat('fightOn'));
    const first = pending.resolution.draft.combat;
    const r = await narrateTurn(deps, s1, pending).catch((e: unknown) => {
      if (e instanceof TurnError && e.pending) return narrateTurn(deps, s1, e.pending);
      throw e;
    });
    expect(r.record.draft.combat).toEqual(first);
  });
  it('a fight that ends on wounds needs no combatEnded; the AI cannot set deceased', async () => {
    const s0 = session(90);
    const { deps } = setup(many(10));
    const s1 = await inFight(deps, s0);
    const t = await playTurn(deps, s1, beat('resolve'));
    expect(t.session.state.combat.active).toBeNull();
    expect(t.record.draft.combat?.ended).not.toBeNull();
    const ai = applyEvents(REGISTRY, t.session.state, [{ type: 'npcDied', npcRef: vek(s0), cause: 'x' }], { source: 'ai' });
    expect(ai.rejected).toHaveLength(1);
  });
  it('combatStarted is not in the schema during a fight (one entry point, D-29)', async () => {
    const s0 = session();
    const { deps } = setup([...many(1), { callType: 'narrative', data: reply([{ type: 'combatStarted', opponentRefs: [vek(s0)], stakes: 'lethal', terrainTags: [] }]) }]);
    const s1 = await inFight(deps, s0);
    if (!s1.state.combat.active) return;
    const t = await playTurn(deps, s1, beat('narrate'));
    expect(t.record.rejected.some((r) => r.reason.includes('combatStarted'))).toBe(true);
  });
});
