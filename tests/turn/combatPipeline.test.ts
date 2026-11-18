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

describe('sparring sessions (D-168)', () => {
  const sparPending = (s: Session): Session => ({ ...s, state: applyEvents(REGISTRY, s.state, [{ type: 'combatStarted', opponentRefs: [vek(s)], stakes: 'spar', terrainTags: ['flatFloor'] }], { source: 'ai' }).state });
  it('a default sparring session resolves in code with one narration call for the whole session', async () => {
    const { deps, provider } = setup(many(3));
    const s = sparPending(session());
    const before = provider.calls.length;
    const t = await playTurn(deps, s, beat('continue'));
    expect(provider.calls.slice(before).map((c) => c.opts.callType)).toEqual(['narrative']);
    expect(t.session.state.combat.active).toBeNull();
    const last = t.session.state.combat.last!;
    expect(last.stakes).toBe('spar');
    expect(last.session?.ended).not.toBeNull();
    expect(last.session!.bouts.length).toBeGreaterThan(0);
    expect(last.exchanges).toBeLessThanOrEqual(34);
    expect(t.record.draft.combat?.session).not.toBeNull();
    expect(t.record.draft.combat?.ended).not.toBeNull();
    // The narration gets the highlights only (hits, points, maneuvers), not every exchange.
    expect(t.record.draft.combat!.narrate.every((r) => r.hit !== null || r.maneuver !== null)).toBe(true);
  });
  it('a bout can be played out beat by beat; afterwards the rest of the session resolves at once', async () => {
    const { deps } = setup(many(60));
    let s = (await playTurn(deps, sparPending(session(70, 'bout')), beat('playBout'))).session;
    const active = s.state.combat.active;
    if (active) {
      expect(active.session?.playing).toBe(true);
      // Beats until the bout ends (the next bout starts with play-out off) or the session ends.
      for (let i = 0; i < 40 && s.state.combat.active?.session?.playing; i++) s = (await playTurn(deps, s, beat('continue'))).session;
      if (s.state.combat.active) {
        expect(s.state.combat.active.session?.bouts.length).toBeGreaterThan(0);
        s = (await playTurn(deps, s, beat('continue'))).session;
      }
    }
    expect(s.state.combat.active).toBeNull();
    expect(s.state.combat.last?.session?.ended).not.toBeNull();
  });
  it('Stop sparring ends the session with the bouts so far', async () => {
    const { deps } = setup(many(4));
    let s = (await playTurn(deps, sparPending(session(70, 'stop')), beat('playBout'))).session;
    if (s.state.combat.active) s = (await playTurn(deps, s, beat('stopSession'))).session;
    expect(s.state.combat.active).toBeNull();
    expect(['stopped', 'exchanges', 'injury', 'spent']).toContain(s.state.combat.last?.session?.ended);
  });
});

describe('typed input in a sparring session (D-177)', () => {
  const sparPending = (s: Session): Session => ({ ...s, state: applyEvents(REGISTRY, s.state, [{ type: 'combatStarted', opponentRefs: [vek(s)], stakes: 'spar', terrainTags: ['flatFloor'] }], { source: 'ai' }).state });
  const intent = (data: Record<string, unknown>): FixtureStep => ({ callType: 'intent', data: { targets: [], references: [], unknownNames: [], ...data } });
  it('a typed specific action ("parry the strike using Shii-Cho fundamentals") opens the duel panel and does not auto-resolve', async () => {
    const { deps, provider } = setup([intent({ actionType: 'fight' }), ...many(2)]);
    const before = provider.calls.length;
    const t = await playTurn(deps, sparPending(session()), { kind: 'typed', text: 'parry the strike using Shii-Cho fundamentals' });
    const active = t.session.state.combat.active;
    expect(active).not.toBeNull();
    expect(active!.session?.playing).toBe(true);
    expect(t.record.draft.combat?.ended).toBeNull();
    expect(t.record.draft.combat?.started).toBe(true);
    // The intent call and at most one narration for the fight's start: no session summary was resolved.
    expect(provider.calls.slice(before).map((c) => c.opts.callType)[0]).toBe('intent');
    expect((active!.duel as DuelState).exchange).toBeLessThan(34);
  });
  it('sparring asked for as an activity resolves like a montage, and "Play the next bout" steps back in', async () => {
    const { deps } = setup([intent({ actionType: 'train', activity: { activityId: 'sparring' } }), ...many(4)]);
    const t = await playTurn(deps, sparPending(session()), { kind: 'typed', text: 'spar with him for an hour' });
    expect(t.session.state.combat.active).toBeNull();
    const last = t.session.state.combat.last!;
    expect(last.session?.ended).not.toBeNull();
    expect(last.rematch?.opponentRefs).toEqual([vek(t.session)]);
    const next = await playTurn(deps, t.session, beat('playNextBout'));
    expect(next.session.state.combat.active?.stakes).toBe('spar');
    expect(next.session.state.combat.active?.session?.playing).toBe(true);
  });
});

describe('natural combat words (D-179)', () => {
  const fightIntent = (): FixtureStep => ({ callType: 'intent', data: { actionType: 'fight', targets: [], references: [], unknownNames: [] } });
  /** A typed line in a fight where the intent call named no move: the word list decides. */
  async function typedInFight(text: string, s0 = session()) {
    const { deps, provider } = setup([...many(1), fightIntent(), ...many(3)]);
    const s = await inFight(deps, s0);
    const before = provider.calls.length;
    const t = await playTurn(deps, s, { kind: 'typed', text });
    return { t, calls: provider.calls.slice(before).map((c) => c.opts.callType) };
  }
  const notes = (t: Awaited<ReturnType<typeof typedInFight>>['t']) => t.record.draft.combat!.notes.join(' ');
  for (const [text, stance] of [['I parry his strike', 'defensive'], ['block and hold my ground', 'defensive'], ['I guard', 'defensive']] as const) {
    it(`defend words: "${text}" -> ${stance} stance`, async () => {
      const { t } = await typedInFight(text);
      expect(notes(t)).toMatch(new RegExp(`posture: ${stance} stance`));
    });
  }
  for (const text of ['press the attack', 'I attack', 'push forward and overwhelm him']) {
    it(`attack words: "${text}" -> aggressive stance`, async () => {
      const { t } = await typedInFight(text);
      expect(notes(t)).toMatch(/posture: aggressive stance/);
    });
  }
  for (const text of ['I dodge', 'sidestep the blow', 'roll away']) {
    it(`evade words: "${text}" -> defensive stance and a take-position attempt`, async () => {
      const { t } = await typedInFight(text);
      expect(notes(t)).toMatch(/posture: defensive stance, taking position/);
    });
  }
  for (const text of ['circle him', 'take the high ground', 'get behind him']) {
    it(`reposition words: "${text}" -> take position`, async () => {
      const { t } = await typedInFight(text);
      expect(notes(t)).toMatch(/posture: taking position/);
    });
  }
  it('"use Soresu fundamentals" stays in the form; "use Makashi" switches when it is known', async () => {
    const { t } = await typedInFight('use Soresu fundamentals');
    expect(notes(t)).toMatch(/posture: in soresu/);
    expect(notes(t)).not.toMatch(/form change/);
    const known = session();
    const s1 = { ...known, state: { ...known.state, progression: { ...known.state.progression, skills: { ...known.state.progression.skills, makashi: { xp: xpForLevel(40), rust: 0, lastPracticedDay: null } } } } };
    const sw = await typedInFight('switch to Makashi', s1);
    expect(notes(sw.t)).toMatch(/form change to makashi/);
  });
  it('words with no move ask back through the beat buttons: no exchange, no narration call', async () => {
    const { t, calls } = await typedInFight('I stare at him silently');
    expect(t.record.draft.combat?.beat).toBe('clarify');
    expect(t.record.draft.combat?.records).toHaveLength(0);
    expect(t.record.draft.combat?.quiet).toBe(true);
    expect(calls).toEqual(['intent']);
    expect(t.session.state.combat.active).not.toBeNull();
  });
  it('"keep fighting" still continues', async () => {
    const { t } = await typedInFight('keep fighting');
    expect(t.record.draft.combat?.beat).not.toBe('clarify');
  });
});
