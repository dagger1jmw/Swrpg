// What combat pass 4 could not reach in the browser, covered here (D-250): the summary fallback on a double factual
// contradiction, a failed saber recall in the narration check, a hold passing a typed chain on, and Gemini overload on
// demand (/simulate 503 n): the busy note, the move to the next model, and the same dice after the retries.
import { describe, expect, it } from 'vitest';
import { CLONE_WARS_DATE } from '../support/dates';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { withSimulatedOverload } from '../../src/ai/simulateOverload';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import type { DuelState } from '../../src/engine/duel';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { combatDraft } from '../../src/turn/combatTurn';
import { describeCombat } from '../../src/turn/context';
import { runDevCommand, SIMULATE_503_MAX } from '../../src/turn/devCommands';
import { checkNarration } from '../../src/turn/narrationCheck';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import type { CombatActionInput, TurnInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { testStartInput } from '../../src/turn/testStart';

const reply = (narrative = 'You hold your guard as the droids fan out among the trees, blasters levelled.') => ({ narrative, choices: [{ label: 'Press on', intent: { actionType: 'fight' } }, { label: 'Fall back', intent: { actionType: 'fight' } }], scene: { moodTags: ['tense'] }, events: [] });
const said = (narrative?: string): FixtureStep => ({ callType: 'narrative', data: reply(narrative) });
const beat = (action: string, extra: Record<string, unknown> = {}): TurnInput => ({ kind: 'beat', label: action, action: { action, ...extra } as never });

function setup(steps: FixtureStep[]) {
  const inner = createFixtureProvider(steps);
  const provider = withSimulatedOverload(inner);
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const status: (string | null)[] = [];
  const metered: string[] = [];
  let ms = Date.UTC(2026, 10, 20);
  const deps: TurnDeps = {
    registry: REGISTRY, provider, storage: createMemoryStorage(), getSettings,
    router: createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => ms }),
    wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }),
    recordCall: (m) => metered.push(m), sleep: async () => {}, jitter: () => 0.5, onStatus: (t) => void status.push(t),
  };
  return { inner, provider, deps, status, metered };
}
/** A dev Knight at 50 in a forest fight with 6 B1s, begun by the narrator's event and opened with one narrated beat. */
async function knightVsB1(deps: TurnDeps, seed: string): Promise<Session> {
  const input = testStartInput({ name: 'Test knight', rank: 'knight', age: 50, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
  const c = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed);
  const pending = applyEvents(REGISTRY, c.state, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'battleDroid', count: 6 }], stakes: 'lethal', terrainTags: ['fallenTimber'] }], { source: 'ai' }).state;
  return (await playTurn(deps, { state: pending, history: [], campaign: c.campaign }, beat('narrate'))).session;
}
const dice = (s: { draft: { combat: { records: { rollA?: { d20: number } | null; rollB?: { d20: number } | null }[] } | null } }): string => (s.draft.combat?.records ?? []).map((r) => `${r.rollA?.d20 ?? '-'}/${r.rollB?.d20 ?? '-'}`).join(',');

describe('the summary fallback on a double factual contradiction (D-209, D-236)', () => {
  it('both replies invent a severed arm: the code-written summary is shown, carries the turn\'s facts and passes the check', async () => {
    const BAD = 'You spring forward and your blade catches the nearest droid cleanly, and you sever its arm at the shoulder.';
    const { deps, inner } = setup([said(), said(BAD), said(BAD)]);
    const s = await knightVsB1(deps, 'sum');
    const before = inner.calls.length;
    const t = await playTurn(deps, s, beat('narrate'));
    expect(inner.calls.slice(before).map((c) => c.opts.callType)).toEqual(['narrative', 'narrative']);
    expect(t.record.draft.report.join('\n')).toMatch(/still contradicting RESOLVED \(.*\): ".+"; code-written summary used instead/);
    expect(t.record.narrative).not.toMatch(/sever its arm/);
    // The summary says how the fight stands and has nothing the check refuses.
    expect(t.record.narrative).toMatch(/The fight (goes on|is over)/);
    const factual = checkNarration(t.record.narrative, t.record.draft as never, false).filter((i) => i.kind !== 'mechanicalTerms');
    expect(factual).toEqual([]);
  });
});

/** Saber throws at Telekinesis 15 until one drops the saber (seeded search); null if none in the tries. */
function droppedSaber(base: GameState): GameState | null {
  let s = base;
  for (let i = 0; i < 40; i++) {
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'force', force: { kind: 'saberThrow' } } as CombatActionInput }).state;
    if (!r.combat.active) return null;
    if ((r.combat.active.duel as DuelState).a.saberLost) return r;
    s = r;
  }
  return null;
}

describe('a failed saber recall in the narration check (D-208, D-237 rule 14)', () => {
  it('the block says it failed; "the saber leaps back to your hand" is flagged, the failure told is not', async () => {
    const input = testStartInput({ name: 'Sela Dorn', rank: 'knight', age: 30, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
    for (let k = 0; k < 40; k++) {
      const camp = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-rc${k}`, branchId: 'b' }, `rc${k}`)).state;
      let s = runDevCommand(REGISTRY, camp, '/set telekinesis 15').state;
      s = runDevCommand(REGISTRY, s, `/fight ${1 + (k % 3)} b1`).state;
      const dropped = droppedSaber(s);
      if (!dropped) continue;
      // A weak Telekinesis for the recall itself (the roll reads the live level), so it fails.
      const weak = runDevCommand(REGISTRY, dropped, '/set telekinesis 1').state;
      const after = resolveTurn(REGISTRY, weak, null, { beat: { action: 'force', force: { kind: 'recall' } } as CombatActionInput });
      const c = combatDraft(weak, after.state, false, after.draft.combat?.notes ?? [])!;
      if (!c.notes.some((n) => /saber recall: FAILED/.test(n))) continue;
      const narrated = { ...c, quiet: false };
      const block = describeCombat(narrated).join('\n');
      expect(block).toMatch(/saber recall: FAILED/);
      const d = { ...after.draft, combat: narrated } as never;
      const kinds = (t: string) => checkNarration(t, d, false).map((i) => i.kind);
      expect(kinds('You stretch out a hand and the saber leaps back into your grip.')).toContain('stepFailed');
      expect(kinds('You stretch out a hand, but your focus falters and the hilt stays on the leaf litter.')).not.toContain('stepFailed');
      return;
    }
    throw new Error('no failed recall found in the seeded tries');
  });
});

describe('a hold passes a typed chain on, in the game (D-219)', () => {
  it('a strike that holds is DONE and the next step is rolled; the block tells both', async () => {
    const input = testStartInput({ name: 'Kael Dorran', rank: 'knight', age: 30, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
    for (let k = 0; k < 60; k++) {
      const camp = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-h${k}`, branchId: 'b' }, `hold${k}`)).state;
      const s = runDevCommand(REGISTRY, camp, '/fight 1 duelist at 0').state;
      const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'sequence', steps: [{ kind: 'strike' }, { kind: 'strike' }] } as CombatActionInput });
      const notes = r.draft.combat?.notes ?? [];
      const held = notes.find((n) => /^step 1 strike.*: DONE \(holds; no ground gained, no hit; the chain goes on\)/.test(n));
      if (!held) continue;
      expect(notes.find((n) => n.startsWith('step 2 '))).not.toMatch(/NOT REACHED \(an earlier step failed\)/);
      const block = describeCombat({ ...combatDraft(s, r.state, false, notes)!, quiet: false }).join('\n');
      expect(block).toMatch(/step 1 strike.*: DONE \(holds; no ground gained, no hit; the chain goes on\)/);
      return;
    }
    throw new Error('no held first step in 60 seeded campaigns');
  });
});

describe('/simulate 503 n (D-250)', () => {
  it('the dev command: a count from 0 to the cap; a test campaign only', async () => {
    const input = testStartInput({ name: 'X', rank: 'knight', age: 30, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
    const s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c-sim', branchId: 'b' }, 'sim')).state;
    expect(runDevCommand(REGISTRY, s, '/simulate 503 2')).toMatchObject({ ok: true, simulate503: 2 });
    expect(runDevCommand(REGISTRY, s, '/simulate 503 0')).toMatchObject({ ok: true, simulate503: 0 });
    expect(runDevCommand(REGISTRY, s, `/simulate 503 ${SIMULATE_503_MAX + 1}`).ok).toBe(false);
    expect(runDevCommand(REGISTRY, s, '/simulate 500 2').ok).toBe(false);
    // Nothing in the save changes.
    expect(runDevCommand(REGISTRY, s, '/simulate 503 2').state).toBe(s);
  });
  it('two simulated 503s in a fight turn: the busy note twice, the reply on the third try, nothing on the meter for them, and the same dice as with none', async () => {
    const plain = setup([said(), said(), said()]);
    const a = await knightVsB1(plain.deps, 'dice');
    const ta = await playTurn(plain.deps, a, beat('fightOn'));

    const busy = setup([said(), said(), said()]);
    const b = await knightVsB1(busy.deps, 'dice');
    const meteredBefore = busy.metered.length;
    busy.provider.arm(2);
    const tb = await playTurn(busy.deps, b, beat('fightOn'));
    // m8-fixes E2: the first busy reply switches to the next model at once; the next model retries once and answers.
    expect(busy.status.filter((x) => x !== null)).toEqual([expect.stringMatching(/^Gemini is busy, trying /), 'Gemini is busy, retrying… (1 of 3)']);
    expect(busy.metered.length - meteredBefore).toBe(1);
    expect(tb.record.calls.map((c) => c.outcome)).toEqual(['http', 'http', 'ok']);
    expect(tb.record.draft.report.join('\n')).toMatch(/busy \(503\); switching to .* at once/);
    // The draft is resolved once before any call (D-240): identical dice, exchanges and state.
    expect(dice(tb.record as never)).toBe(dice(ta.record as never));
    expect(dice(tb.record as never).length).toBeGreaterThan(0);
    expect((tb.session.state.combat.active?.duel as DuelState | undefined)?.exchange).toBe((ta.session.state.combat.active?.duel as DuelState | undefined)?.exchange);
    expect(tb.session.state.meta.rngState).toEqual(ta.session.state.meta.rngState);
  });
  it('four simulated 503s: one on the first model, then the next model at once, which answers after its retries (m8-fixes E2)', async () => {
    const { deps, provider, inner } = setup([said(), said()]);
    const s = await knightVsB1(deps, 'next');
    const first = inner.calls[inner.calls.length - 1]!.opts.model;
    provider.arm(4);
    const t = await playTurn(deps, s, beat('narrate'));
    expect(t.record.calls.map((c) => c.outcome)).toEqual(['http', 'http', 'http', 'http', 'ok']);
    const models = t.record.calls.map((c) => c.model);
    expect(models[0]).toBe(first);
    expect(new Set(models.slice(1))).toEqual(new Set([models[1]]));
    expect(models[1]).not.toBe(first);
    expect(t.record.draft.report.join('\n')).toMatch(/switching to .* at once/);
    expect(provider.pending).toBe(0);
  });
});
