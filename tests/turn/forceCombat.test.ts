// iPad combat test bugs (D-191, D-192): the dev Knight's Force skills, no silent step drops, attack verbs as strikes,
// and the narrator told the engine's reason for a Force failure. Fixture AI; the dev test start (D-178).
import { TEST_START_DATE } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { PROMPTS } from '../../src/ai/prompts';
import type { DuelState } from '../../src/engine/duel';
import { selectCI, selectLevelExact } from '../../src/features/progression/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { reconcileSteps } from '../../src/turn/combatTurn';
import { describeCombat } from '../../src/turn/context';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import { testStartInput } from '../../src/turn/testStart';
import type { TurnInput } from '../../src/turn/record';

const reply = () => ({ narrative: 'Blaster bolts hiss past.', choices: [{ label: 'Press on', intent: { actionType: 'fight' } }, { label: 'Fall back', intent: { actionType: 'fight' } }], scene: { moodTags: ['tense'] }, events: [] });
const many = (n: number): FixtureStep[] => Array.from({ length: n }, () => ({ callType: 'narrative' as const, data: reply() }));
const beat = (action: string, extra: Record<string, unknown> = {}): TurnInput => ({ kind: 'beat', label: action, action: { action, ...extra } as never });

function setup(steps: FixtureStep[]) {
  const provider = createFixtureProvider(steps);
  const storage = createMemoryStorage();
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
  let ms = Date.UTC(2026, 10, 18);
  const deps: TurnDeps = { registry: REGISTRY, provider, router, storage, getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) };
  return { provider, deps };
}

/** The dev Knight at 50 (D-178) in a forest fight with 6 B1s that has already begun. */
async function knightVsB1(deps: TurnDeps, seed: string): Promise<Session> {
  const input = testStartInput({ name: 'Test knight', rank: 'knight', age: 50, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
  const c = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed);
  const pending = applyEvents(REGISTRY, c.state, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'battleDroid', count: 6 }], stakes: 'lethal', terrainTags: ['fallenTimber'] }], { source: 'ai' }).state;
  const s: Session = { state: pending, history: [], campaign: c.campaign };
  return (await playTurn(deps, s, beat('narrate'))).session;
}

const EXACT = 'I push forward with aggressive momentum, driving heavy strikes against the nearest battle droid, then Force-push it into the others.';

describe('the dev Knight has every skill of the rank (D-191)', () => {
  it('Force abilities at closed-form levels and the rank CI', async () => {
    const { deps } = setup(many(2));
    const s = await knightVsB1(deps, 'k1');
    for (const id of ['telekinesis', 'forcePush', 'forceJump', 'forceSpeed', 'mindTrick']) expect(selectLevelExact(s.state, id), id).toBeGreaterThan(20);
    expect(selectCI(s.state, 'forcePush')).toBe(20);
    expect(selectCI(s.state, 'telekinesis')).toBe(20);
  });
  it('normal creation gives the same Force abilities (no test mark needed)', async () => {
    const input = testStartInput({ name: 'Ned', rank: 'knight', age: 50, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
    delete (input as { test?: unknown }).test;
    const c = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c-n', branchId: 'b' }, 'x');
    expect(selectLevelExact(c.state, 'telekinesis')).toBeGreaterThan(40);
    expect(selectLevelExact(c.state, 'forcePush')).toBeGreaterThan(30);
  });
});

describe('no silent step drops (D-191)', () => {
  // The intent call folded "driving heavy strikes" into the aggressive stance: stance + push, no strike.
  const foldedIntent: FixtureStep = { callType: 'intent', data: { actionType: 'fight', targets: [], references: [], unknownNames: [], sequence: [{ kind: 'stance', stance: 'aggressive' }, { kind: 'forceAction', action: 'push' }] } };
  for (const seed of ['s1', 's2', 's3', 's4', 's5']) {
    it(`the exact input rolls a strike against a B1 before the Force step (${seed})`, async () => {
      const { deps } = setup([...many(1), foldedIntent, ...many(2)]);
      const s = await knightVsB1(deps, seed);
      const t = await playTurn(deps, s, { kind: 'typed', text: EXACT });
      const c = t.record.draft.combat!;
      const first = c.records[0]!;
      expect(first.kind).toBe('strike');
      expect(first.striker).toBe('A');
      expect(first.targetId).toMatch(/battleDroid/);
      expect(first.rollA).not.toBeNull();
      const notes = c.notes.join('\n');
      // Every step the sequence had appears: resolved, failed, or dropped with a reason.
      expect(notes).toMatch(/step 1 stance: aggressive/);
      expect(notes).toMatch(/step 2 strike: (lands|fails)/);
      expect(notes).toMatch(/step 3 Force push: (success|fails|dropped \(.+\))/);
      const forceAt = c.records.findIndex((r) => r.kind === 'force');
      if (forceAt >= 0) expect(forceAt).toBeGreaterThan(0);
      // The narrator's block lists every step too (resolved and failed, not only dropped ones).
      const block = describeCombat(c).join('\n');
      expect(block).toMatch(/Sequence: step 1 stance: aggressive/);
      expect(block).toMatch(/Sequence: step 2 strike: (lands|fails)/);
    });
  }
  it('the reconciler: attack verbs are strike steps in the text order, nouns and parries are not', () => {
    expect(reconcileSteps(EXACT, [{ kind: 'stance', stance: 'aggressive' }, { kind: 'forceAction', action: 'push' }], 5).map((x) => x.kind)).toEqual(['stance', 'strike', 'forceAction']);
    expect(reconcileSteps('I carve through the droids, then cut down the next one', [], 5).map((x) => x.kind)).toEqual(['strike', 'strike']);
    expect(reconcileSteps('I parry his strike', [], 5)).toEqual([]);
    expect(reconcileSteps('I push them back', [], 5)).toEqual([]);
    expect(reconcileSteps('I throw my saber at the droids', [], 5)).toEqual([{ kind: 'forceAction', action: 'saberThrow' }]);
  });
});

describe('a Force failure reaches the narrator with its engine reason (D-192)', () => {
  it('a failed Force push on a droid: the reason line and the no-invention rule are in the narration request', async () => {
    let checked = false;
    for (let i = 0; i < 40 && !checked; i++) {
      const { deps, provider } = setup([...many(3)]);
      const s = await knightVsB1(deps, `fail${i}`);
      const before = provider.calls.length;
      const t = await playTurn(deps, s, beat('force', { force: { kind: 'push' } }));
      const rec = (t.session.state.combat.active?.duel as DuelState | undefined)?.log.find((r) => r.kind === 'force');
      if (!rec || rec.force!.success) continue;
      // Droids never resist the Force: a failure is the user's roll or a dodge, never Willpower or Force resistance.
      expect(['skillTooLow', 'natural1', 'dodged']).toContain(rec.force!.outcome);
      const sent = JSON.stringify(provider.calls.slice(before).map((c) => c.messages));
      expect(sent).toMatch(/Explain the failure only with this reason/);
      expect(sent).toMatch(/fails: (the roll fell short|a natural 1|the target saw it coming)/);
      expect(sent).not.toMatch(/willResisted|forceResisted/);
      checked = true;
    }
    expect(checked).toBe(true);
    expect(PROMPTS.combatNarration).toMatch(/no Force-blocking fields, dampeners/);
  });
});

describe('mind trick out of a fight (D-192)', () => {
  async function trick(species: 'droid' | 'human' | 'hutt') {
    const input = testStartInput({ name: 'Test knight', rank: 'knight', age: 50, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
    const c = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${species}`, branchId: 'b' }, species);
    const st = applyEvents(REGISTRY, c.state, [{ type: 'npcIntroduced', name: 'Guard', species, faction: 'republic', role: 'soldier', ageApprox: 30, description: '' }], { source: 'ai' }).state;
    const id = Object.values(st.npcs.byId).find((n) => n.name === 'Guard')!.id;
    const { deps } = setup([{ callType: 'intent', data: { actionType: 'forceUse', targets: [id], references: [], unknownNames: [], forceAbility: 'mindTrick', skillId: 'mindTrick' } }, ...many(1)]);
    const t = await playTurn(deps, { state: st, history: [], campaign: c.campaign }, { kind: 'typed', text: 'I wave my hand: you will let us pass.' });
    return t.record.draft.checks[0]!;
  }
  it('a droid is immune: no roll, the reason given', async () => {
    const card = await trick('droid');
    expect(card.success).toBe(false);
    expect(card.notes.join(' ')).toMatch(/immune/);
  });
  it('a Hutt is immune (lore)', async () => {
    expect((await trick('hutt')).notes.join(' ')).toMatch(/immune/);
  });
  it('a human soldier rolls Willpower against it', async () => {
    expect((await trick('human')).notes.join(' ')).toMatch(/Willpower roll/);
  });
});

describe('a typed mind trick on a droid (D-194)', () => {
  it('a quiet line, no exchange, no narration call', async () => {
    const intent: FixtureStep = { callType: 'intent', data: { actionType: 'fight', targets: [], references: [], unknownNames: [], forceAbility: 'mindTrick' } };
    const { deps, provider } = setup([...many(1), intent, ...many(2)]);
    const s = await knightVsB1(deps, 'mt1');
    const before = provider.calls.length;
    const t = await playTurn(deps, s, { kind: 'typed', text: 'I wave my hand: you will lower your blasters.' });
    const c = t.record.draft.combat!;
    expect(c.records).toHaveLength(0);
    expect(c.quiet).toBe(true);
    expect(c.beat).toBe('noEffect');
    expect(c.quietLine).toBe("Droids can't be mind-tricked.");
    expect(provider.calls.slice(before).map((x) => x.opts.callType)).toEqual(['intent']);
    expect(t.session.state.health.meters.f).toBe(s.state.health.meters.f);
  });
});
