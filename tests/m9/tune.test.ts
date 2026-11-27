// m9-tune (Jared, 27 Nov 2026): the missions' training gap, the Consular's Force approaches, the slow-call cap. Field practice on a
// mission's working days (A2), field fights teach more (A3), stage rolls teach the skill they used (A4), influence and reading
// people on the social and investigation stages (B1), the stronger model capped at 25 s with the main model taking over (C).
import { describe, expect, it } from 'vitest';
import { REGISTRY } from '../../src/state/registry';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider } from '../../src/ai/fixtureProvider';
import { FLASH_ROUTING, PREMIUM_WAIT } from '../../src/ai/models.config';
import type { CallOptions, ModelProvider } from '../../src/ai/provider';
import { intentSchema } from '../../src/ai/schemas/intent';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { withSimulatedOverload } from '../../src/ai/simulateOverload';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { FIELD_FIGHT, COMBAT_XP } from '../../src/data/progression.config';
import { FIELD_PRACTICE, MISSION_TYPES } from '../../src/data/missions.config';
import { computeCombatXp } from '../../src/engine/combatXp';
import type { Wound } from '../../src/engine/wounds';
import { approachFor } from '../../src/features/duty/missions';
import { currentStage } from '../../src/features/duty/selectors';
import type { PlannedBlock } from '../../src/features/routines/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import { fieldPracticeBlocked, practiceShares } from '../../src/state/fieldPractice';
import type { GameState } from '../../src/state/gameState';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import { missionChoices } from '../../src/turn/missionTurn';
import { playTurn, type TurnDeps } from '../../src/turn/pipeline';
import { resolveTurn } from '../../src/turn/resolve';
import { base } from '../support/schemaSituations';
import { LORE_TEST_DATE, LORE_TEST_YEAR } from '../support/dates';
import openingM2 from '../fixtures/ai/opening-m2.json';

const testChar = (s: GameState): GameState => ({ ...s, character: { ...s.character, testCharacter: true } });
const intent = (o: object) => intentSchema.parse({ actionType: 'other', targets: [], references: [], unknownNames: [], ...o });
const wound = (severity: Wound['severity']): Wound => ({ id: `w-${severity}`, part: 'leftArm', severity, W: 20, stabilized: true, healProgress: 0, day: 0, source: 'test' }) as Wound;
const hurt = (s: GameState, w: Wound): GameState => ({ ...s, health: { ...s.health, wounds: [...s.health.wounds, w] as GameState['health']['wounds'] } });

/** A 500 BBY (peace) Jedi Knight at the Temple, on a mission of `type` on Coruscant (on site at once: the base's own world). */
function onMission(type: string, rank = 'knight'): GameState {
  const s0 = base({ rank });
  const day = s0.clock.now.day + Math.round((3661 - 500) * 368);
  let s = testChar({ ...s0, clock: { ...s0.clock, now: { ...s0.clock.now, day } }, duty: { ...s0.duty, since: day } });
  s = runDevCommand(REGISTRY, s, '/home').state;
  const r = runDevCommand(REGISTRY, s, `/mission start ${type} Coruscant`);
  expect(r.ok, r.line).toBe(true);
  expect(r.state.duty.mission?.phase).toBe('onSite');
  return r.state;
}
const attempt = (s: GameState, approach: string) => resolveTurn(REGISTRY, s, intent({ actionType: 'other' }), { mission: approach });

describe('B1: the Consular\'s Force approaches', () => {
  it('diplomacy, negotiation, interrogation and investigation stages take influence (Willpower) and reading people (Force Sense)', () => {
    const stages = (t: string) => MISSION_TYPES[t]!.stages.filter((x) => x.kind === 'check');
    for (const st of stages('diplomacy')) expect(st.approaches, st.label).toContain('influence');
    expect(stages('diplomacy').filter((st) => st.approaches!.includes('read')).map((st) => st.id)).toEqual(['talks', 'accord']);
    expect(stages('investigation').find((st) => st.id === 'lead2')!.approaches).toEqual(expect.arrayContaining(['influence', 'read']));
    expect(stages('manhunt').find((st) => st.id === 'trail')!.approaches).toContain('influence');
    expect(stages('rescue').find((st) => st.id === 'locate')!.approaches).toContain('influence');
  });

  it('a Force user sees them after up to four ordinary approaches; the narrator\'s Willpower choice or a mind trick reads as influence', () => {
    const s = onMission('diplomacy');
    const labels = missionChoices(s).map((c) => c.label);
    expect(labels).toEqual(['The audience: talk your way through', 'The audience: think it through', 'The audience: reach out with the force', 'The audience: influence them through the force']);
    const stage = currentStage(s.duty.mission)!;
    expect(approachFor(stage, { actionType: 'other', skillId: 'willpower' }, null, true)).toBe('influence');
    expect(approachFor(stage, { actionType: 'forceUse', forceAbility: 'mindTrick' }, null, true)).toBe('influence');
    // Not for someone outside the Force: Willpower is holding one's nerve (a poor fit here).
    expect(approachFor(stage, { actionType: 'other', skillId: 'willpower' }, null, false)).toBe('endure');
    expect(approachFor(stage, null, 'influence', false)).toBeNull();
  });
});

describe('A4: a stage\'s roll teaches the skill it used', () => {
  it('influence: Willpower from field use and a social line (Charisma); talk: Charisma by persuasion; reading the scene: Investigation', () => {
    const s = onMission('diplomacy');
    const xpOf = (st: GameState, k: string) => st.progression.skills[k]?.xp ?? 0;
    const inf = attempt(s, 'influence');
    const sources = inf.draft.applied.filter((a) => a.event.type === 'playXpEarned').map((a) => `${String(a.event['source'])}:${String(a.event['skillId'] ?? '')}`);
    expect(sources).toEqual(['fieldCheck:willpower', 'socialLine:']);
    expect(xpOf(inf.state, 'willpower')).toBeGreaterThan(xpOf(s, 'willpower'));
    expect(xpOf(inf.state, 'charisma')).toBeGreaterThan(xpOf(s, 'charisma'));
    const talk = attempt(s, 'persuade');
    expect(talk.draft.applied.filter((a) => a.event.type === 'playXpEarned').map((a) => a.event['source'])).toEqual(['persuasion']);
    expect(xpOf(talk.state, 'charisma')).toBeGreaterThan(xpOf(s, 'charisma'));
    const inv = onMission('investigation');
    const look = attempt(inv, 'investigate');
    expect(look.draft.applied.filter((a) => a.event.type === 'playXpEarned').map((a) => a.event['skillId'])).toEqual(['investigation']);
    expect(xpOf(look.state, 'investigation')).toBeGreaterThan(xpOf(inv, 'investigation'));
  });
});

describe('A2: field practice on a mission\'s working days', () => {
  const block = (activityId: string, skillId: string, hours: number): PlannedBlock => ({ kind: 'train', activityId, skillId, hours, planned: hours, source: 'self', intensity: 'standard', fixed: false, locked: false, fill: true, startSecond: 0 }) as unknown as PlannedBlock;

  it('the plan\'s blocks share the practice in half-hour steps, the biggest first, repeats merged', () => {
    const shares = practiceShares([block('a', 'soresu', 2), block('b', 'forceKnowledge', 1), block('a', 'soresu', 1), block('c', 'willpower', 0.5)], FIELD_PRACTICE.hours);
    expect(shares.map((x) => [x.block.activityId, x.hours])).toEqual([['a', 1], ['b', 0.5]]);
    expect(shares.reduce((t, x) => t + x.hours, 0)).toBe(FIELD_PRACTICE.hours);
    expect(practiceShares([block('a', 'soresu', 0.5)], FIELD_PRACTICE.hours).map((x) => x.hours)).toEqual([0.5]);
  });

  it('after a stage\'s work, a short session on the routine\'s plan, shown in the turn\'s log; one a day', () => {
    const s = onMission('diplomacy');
    const r = attempt(s, 'influence');
    const line = r.draft.report.find((l) => l.includes('field practice'));
    expect(line).toMatch(/^mission: field practice after the day's work \(1\.5 h\): /);
    expect(r.state.progression.today.trainingHours).toBeGreaterThan(0);
    expect(fieldPracticeBlocked(r.state)).toBe('already trained today');
  });

  it('none past a minor wound, after a fight today, or off a mission', () => {
    const s = onMission('diplomacy');
    expect(fieldPracticeBlocked(s)).toBeNull();
    expect(fieldPracticeBlocked(hurt(s, wound('moderate')))).toBe('a moderate wound');
    expect(fieldPracticeBlocked(hurt(s, wound('minor')))).toBeNull();
    expect(fieldPracticeBlocked({ ...s, progression: { ...s.progression, fightsToday: { soresu: 1 } } })).toBe('a fight today');
    expect(fieldPracticeBlocked({ ...s, duty: { ...s.duty, status: 'home' } })).toBe('not on a mission');
    const r = attempt(hurt(s, wound('moderate')), 'influence');
    expect(r.draft.report.some((l) => l.includes('field practice'))).toBe(false);
  });
});

describe('A3: field fights teach more than the same fight elsewhere', () => {
  const session = (stakes: 'serious' | 'spar', n: number) => ({ stakes, outcome: 'won' as const, exchanges: Array.from({ length: n }, () => ({ skillId: 'soresu', gap: 0 })), forceUses: [] });
  const xp = (n: number, field: boolean) =>
    computeCombatXp({ session: session('serious', n), m: () => 1, physicalWeights: () => ({}), todayBeforeM: () => 0, fightsToday: () => 0, clamp: (_k, w) => ({ credited: w, discarded: 0 }), ...(field ? { fieldMult: FIELD_FIGHT.mult } : {}) }).credited['soresu'] ?? 0;

  it(`x${FIELD_FIGHT.mult} on the exchanges, under the same daily cap`, () => {
    expect(xp(10, true) / xp(10, false)).toBeCloseTo(FIELD_FIGHT.mult, 6);
    expect(xp(400, true)).toBeCloseTo(COMBAT_XP.dailyCap, 6);
    expect(xp(400, false)).toBeCloseTo(COMBAT_XP.dailyCap, 6);
  });

  it('a fight begun on a mission is a field fight; a spar or a dev command\'s fight is not, nor one at home', () => {
    const s = onMission('diplomacy');
    const begin = (st: GameState, extra: object) => applyEvents(REGISTRY, st, [{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind: 'thug', count: 2 }], stakes: 'serious', terrainTags: [], ...extra }], { source: 'engine' }).state.combat.active;
    expect(begin(s, {})?.field).toBe(true);
    expect(begin(s, { dev: true })?.field).toBeUndefined();
    expect(begin({ ...s, duty: { ...s.duty, status: 'home' } }, {})?.field).toBeUndefined();
    const end = resolveTurn(REGISTRY, applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind: 'thug', count: 2 }], stakes: 'serious', terrainTags: [] }], { source: 'engine' }).state, null, { beat: { action: 'resolve' } as never });
    const fr = end.draft.applied.find((a) => a.event.type === 'fightResolved');
    expect(fr?.event['field']).toBe(true);
    expect(fr?.notes.some((n) => n.includes(`a field fight: x${FIELD_FIGHT.mult}`))).toBe(true);
  });
});

describe('C: the slow-call cap', () => {
  function setup(slow: number) {
    const inner = createFixtureProvider([{ callType: 'narrative', data: openingM2 }, { callType: 'narrative', data: openingM2 }]);
    const sim = withSimulatedOverload(inner, async () => {});
    sim.armSlow(slow);
    const seen: CallOptions[] = [];
    const provider: ModelProvider = { generateStructured: (schema, messages, opts) => (seen.push(opts), sim.generateStructured(schema, messages, opts)) };
    const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
    const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
    let ms = Date.UTC(2026, 10, 27);
    const waits: string[] = [];
    const deps: TurnDeps = {
      registry: REGISTRY, provider, storage: createMemoryStorage(), getSettings,
      router: createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => ms, getRouting: () => ({ on: true, model: FLASH_ROUTING.model }) }),
      wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }),
      sleep: async () => {}, jitter: () => 0.5, onCall: (c) => void waits.push(c.model),
    };
    return { seen, deps, waits, inner };
  }
  const opening = async (deps: TurnDeps) => {
    const c = await createCampaign(REGISTRY, deps.storage, { name: 'Kael Varn', birthDate: { year: LORE_TEST_YEAR - 14, month: 3, day: 4 }, startDate: LORE_TEST_DATE, startSecond: DEFAULT_START_SECOND }, { campaignId: 'c-tune', branchId: 'b' }, '2026-11-27T00:00:00.000Z');
    return playTurn(deps, c, { kind: 'opening', premise: '' });
  };

  it('the stronger model gets one try of 25 s on a big moment; no reply, and the main model takes the call (the counter names it)', async () => {
    const { seen, deps, waits, inner } = setup(1);
    const t = await opening(deps);
    expect(seen.map((o) => [o.model, o.timeoutMs])).toEqual([[FLASH_ROUTING.model, PREMIUM_WAIT.timeoutMs], ['gemini-3.5-flash-lite', undefined]]);
    expect(waits).toEqual([FLASH_ROUTING.model, 'gemini-3.5-flash-lite']);
    expect(inner.calls.map((c) => c.opts.model)).toEqual(['gemini-3.5-flash-lite']);
    expect(t.record.draft.report.join('\n')).toContain(`${FLASH_ROUTING.model} gave no reply in 25 s (the slow-call cap); the main model gemini-3.5-flash-lite instead`);
    expect(t.record.calls.map((c) => [c.model, c.outcome])).toEqual([[FLASH_ROUTING.model, 'timeout'], ['gemini-3.5-flash-lite', 'ok']]);
  });

  it('a reply in time is the stronger model\'s, as before', async () => {
    const { seen, deps } = setup(0);
    await opening(deps);
    expect(seen.map((o) => o.model)).toEqual([FLASH_ROUTING.model]);
  });

  it('a narration check\'s retry uses the main model', async () => {
    const summoned = { ...openingM2, narrative: `${(openingM2 as { narrative: string }).narrative} Then a runner arrives: the Council has summoned you.` };
    const inner = createFixtureProvider([{ callType: 'narrative', data: summoned }, { callType: 'narrative', data: openingM2 }]);
    const { deps } = setup(0);
    const t = await opening({ ...deps, provider: inner });
    expect(t.record.draft.report.join('\n')).toMatch(/narration check: .*retrying once/);
    expect(inner.calls.map((c) => c.opts.model)).toEqual([FLASH_ROUTING.model, 'gemini-3.5-flash-lite']);
  });

  it('/simulate slow n arms the stall (a dev command; nothing in the save)', () => {
    const s = testChar(base({ rank: 'knight' }));
    expect(runDevCommand(REGISTRY, s, '/simulate slow 2')).toMatchObject({ ok: true, simulateSlow: 2 });
    expect(runDevCommand(REGISTRY, s, '/simulate slow x').ok).toBe(false);
  });
});
