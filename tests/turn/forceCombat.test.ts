// iPad combat test bugs (D-191, D-192): the dev Knight's Force skills, no silent step drops, attack verbs as strikes,
// and the narrator told the engine's reason for a Force failure. Fixture AI; the dev test start (D-178).
import { TEST_START_DATE, CLONE_WARS_DATE } from '../support/dates';
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
  // B1 droids exist only in their era (D-213): the Clone Wars.
  const input = testStartInput({ name: 'Test knight', rank: 'knight', age: 50, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
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
      expect(notes).toMatch(/step 1 stance \(aggressive\): DONE \(aggressive stance set\)/);
      // A strike roll: a real hit says hits with the location and severity; a miss says misses. Never "lands".
      expect(notes).toMatch(/step 2 strike: (DONE \(hits B1 battle droid \d+: .+\)|FAILED \(misses.+\))/);
      expect(notes).not.toMatch(/lands/);
      expect(notes).toMatch(/step 3 Force push: (DONE|FAILED|NOT REACHED) \(.+\)/);
      const forceAt = c.records.findIndex((r) => r.kind === 'force');
      if (forceAt >= 0) expect(forceAt).toBeGreaterThan(0);
      // The narrator's block lists every step too (resolved and failed, not only dropped ones).
      const block = describeCombat(c).join('\n');
      expect(block).toMatch(/Steps the player asked for: step 1 stance \(aggressive\): DONE/);
      expect(block).toMatch(/step 2 strike: (DONE|FAILED)/);
      expect(block).toMatch(/Weapons \(the only ones in this fight\): Test knight: a lightsaber.*B1 battle droid 1: a blaster rifle/);
      expect(block).toMatch(/Hits in this passage: /);
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

describe('the narration check in the pipeline (D-197)', () => {
  const said = (narrative: string): FixtureStep => ({ callType: 'narrative', data: { ...reply(), narrative } });
  const BAD = 'You spring forward and your blade catches the nearest droid cleanly, and you sever its arm at the shoulder.';
  const GOOD = 'You hold your guard as the droids fan out among the trees, blasters levelled.';
  it('a contradicting narration is retried once with the same draft and the contradictions listed', async () => {
    const { deps, provider } = setup([...many(1), said(BAD), said(GOOD)]);
    const s = await knightVsB1(deps, 'nc1');
    const before = provider.calls.length;
    const t = await playTurn(deps, s, beat('narrate'));
    const made = provider.calls.slice(before);
    expect(made.map((c) => c.opts.callType)).toEqual(['narrative', 'narrative']);
    expect(JSON.stringify(made[1]!.messages)).toMatch(/CORRECTION: your last narration of this turn contradicted RESOLVED/);
    expect(JSON.stringify(made[0]!.messages)).not.toMatch(/CORRECTION/);
    expect(t.record.narrative).toBe(GOOD);
    expect(t.record.draft.report.join('\n')).toMatch(/narration check: \d contradiction\(s\) with RESOLVED \(.*hitNotInLog.*\).*retrying once/);
    expect(t.record.draft.report.join('\n')).toMatch(/narration check: the retry is consistent/);
    // The same dice: the retry changed nothing in the fight.
    expect((t.session.state.combat.active!.duel as DuelState).exchange).toBe((s.state.combat.active!.duel as DuelState).exchange);
  });
  it('when the retry still contradicts the block, code-written lines are used and it is logged', async () => {
    const { deps, provider } = setup([...many(1), said(BAD), said(BAD)]);
    const s = await knightVsB1(deps, 'nc2');
    const before = provider.calls.length;
    const t = await playTurn(deps, s, beat('narrate'));
    expect(provider.calls.slice(before)).toHaveLength(2);
    expect(t.record.narrative).not.toMatch(/sever|catches the nearest droid/);
    expect(t.record.draft.report.join('\n')).toMatch(/still contradicting RESOLVED \(.*\); code-written summary used instead/);
  });
  it('an engine term that a swap of words settles is reworded in code with no retry call (D-236)', async () => {
    const { deps, provider } = setup([...many(1), said('You hold your guard, wary of a severe blow, as the droids fan out among the trees.')]);
    const s = await knightVsB1(deps, 'nc4');
    const before = provider.calls.length;
    const t = await playTurn(deps, s, beat('narrate'));
    expect(provider.calls.slice(before)).toHaveLength(1);
    expect(t.record.narrative).toBe('You hold your guard, wary of a grievous blow, as the droids fan out among the trees.');
    expect(t.record.draft.report.join('\n')).toMatch(/narration check: 1 engine term\(s\) in the prose .*reworded in code, no retry/);
  });
  it('when the retry call fails, an invented slip gets the summary: no sentence is cut out of the narration (D-236)', async () => {
    const slip = 'You hold your guard among the trees. Your footing slips on the wet leaves as the droids fan out.';
    const { deps, provider } = setup([...many(1), said(slip), { callType: 'narrative', error: { kind: 'http', status: 503, message: 'Gemini error 503: high demand' } }]);
    const s = await knightVsB1(deps, 'nc5');
    const before = provider.calls.length;
    const t = await playTurn(deps, s, beat('narrate'));
    expect(provider.calls.slice(before)).toHaveLength(2);
    const report = t.record.draft.report.join('\n');
    expect(report).toMatch(/narration check: the retry failed/);
    expect(report).toMatch(/the first reply stands and contradicts RESOLVED \(slipNoHazard\); code-written summary used instead/);
    // The summary, not the first reply with a sentence missing.
    expect(t.record.narrative).not.toBe('You hold your guard among the trees.');
    expect(t.record.narrative).toMatch(/The fight goes on: \d+ opponents? still standing\./);
  });
  it('a consistent narration makes no second call', async () => {
    const { deps, provider } = setup([...many(1), said(GOOD)]);
    const s = await knightVsB1(deps, 'nc3');
    const before = provider.calls.length;
    await playTurn(deps, s, beat('narrate'));
    expect(provider.calls.slice(before)).toHaveLength(1);
  });
});
