// M5 step 5b: the health feature (health.md §10 tests 2 and 13 at the feature level; dying, death, stabilizing, care,
// day-by-day healing and lasting rolls, severed limbs and the hand switch, adaptation, the v1 -> v2 migration).
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { dyingMinutes, type Wound } from '../../src/engine/wounds';
import { seedRng } from '../../src/engine/rng';
import { selectPerformance } from '../../src/features/progression/selectors';
import { migrateHealthV1 } from '../../src/features/health/health';
import { selectIsDying, selectMaxVitality, selectStatusLabel, selectVitality, selectWoundPenalty } from '../../src/features/health/selectors';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const fresh = (): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: START, second: 8 * 3600 },
    character: { name: 'Kael', birthDay: START - 30 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4, dominantHand: 'right' },
    startingXp: { soresu: xpForLevel(50), endurance: xpForLevel(50), strength: xpForLevel(45), willpower: xpForLevel(40) },
    rank: 'knight',
  });
const wound = (over: Partial<Wound>): Wound => ({ id: 'x', part: 'torso', severity: 'moderate', W: 12, stabilized: false, healProgress: 0, day: START, source: 'test', ...over });
const sync = (s: GameState, addWounds: Wound[], vitalityLost = 0) => applyEvents(REGISTRY, s, [{ type: 'healthSynced', vitalityLost, addWounds, cause: 'duel' }], { source: 'engine' });
const pass = (s: GameState, seconds: number, occupation: 'rest' | 'activity' | 'sleep' | 'combat' = 'rest') => advanceTime(REGISTRY, s, { seconds, reason: 't', source: 'turnDraft', occupation }).state;

describe('Vitality in play (health §3)', () => {
  it('rest recovers 50% of max per hour; combat recovers nothing; sleep 7h+ restores it in full', () => {
    const s = sync(fresh(), [], 40).state;
    const max = selectMaxVitality(s);
    expect(selectVitality(s)).toBeCloseTo(max - 40);
    expect(selectVitality(pass(s, 600, 'combat'))).toBeCloseTo(max - 40);
    expect(selectVitality(pass(s, 1800))).toBeCloseTo(Math.min(max, max - 40 + 0.25 * max));
    const slept = applyEvents(REGISTRY, s, [{ type: 'sleepCompleted', hours: 8 }], { source: 'engine' }).state;
    expect(selectVitality(slept)).toBeCloseTo(max);
  });
});

describe('wounds, dying and death (health §6)', () => {
  it('test 2: status is identical before and after save / load (never stored)', () => {
    const s = sync(fresh(), [wound({ severity: 'severe', W: 25 }), wound({ severity: 'moderate', W: 12, part: 'rightArm' })]).state;
    const env = makeEnvelope(REGISTRY, s, 'now');
    const loaded = loadEnvelope<GameState>(REGISTRY, JSON.parse(JSON.stringify(env)));
    if (!loaded.ok) throw new Error('load failed');
    expect(selectStatusLabel(loaded.state)).toBe(selectStatusLabel(s));
    expect(selectWoundPenalty(loaded.state, 'soresu')).toBe(selectWoundPenalty(s, 'soresu'));
    expect(JSON.stringify(loaded.state.health)).not.toMatch(/status/i);
  });
  it('a mortal wound starts the dying timer (moment pacing); expiry sets death', () => {
    const r = sync(fresh(), [wound({ severity: 'mortal', W: 60 })]);
    expect(selectIsDying(r.state)).toBe(true);
    expect(r.state.pacing.level).toBe('moment');
    const dyingFor = r.state.health.dying!.untilAbs - (r.state.clock.now.day * 86_400 + r.state.clock.now.second);
    expect(dyingFor / 60).toBeCloseTo(dyingMinutes(selectPerformance(r.state, 'endurance')), 6);
    const dead = pass(r.state, 20 * 60, 'combat');
    expect(dead.health.death).not.toBeNull();
    expect(selectStatusLabel(dead)).toBe('Dead');
  });
  it('stabilizing converts mortal to critical and stops the timer; a second mortal while dying kills', () => {
    const r = sync(fresh(), [wound({ severity: 'mortal', W: 60 })]);
    const st = applyEvents(REGISTRY, r.state, [{ type: 'woundsStabilized', by: 'a medpac' }], { source: 'engine' }).state;
    expect(st.health.dying).toBeNull();
    expect(st.health.wounds[0]!.stabilized).toBe(true);
    expect(pass(st, 3600).health.death).toBeNull();
    const second = sync(r.state, [wound({ severity: 'mortal', W: 55, part: 'leftLeg' })]).state;
    expect(second.health.death).not.toBeNull();
  });
  it('a severed dominant hand is a lasting injury at once; its prosthetic is fitted at once, so the hand stays (Q39 as amended by D-253)', () => {
    const r = sync(fresh(), [wound({ severity: 'severe', W: 34, part: 'rightHand', severed: true })]);
    expect(r.state.health.lasting).toHaveLength(1);
    expect(r.state.health.lasting[0]!.kind).toBe('lostHand');
    expect(r.state.health.lasting[0]!.aid).toBe('qualityCybernetic');
    expect(r.state.character.dominantHand).toBe('right');
  });
  it('a hazard (D-149) wounds by its severity', () => {
    const r = applyEvents(REGISTRY, fresh(), [{ type: 'hazardResolved', hazard: 'fall', severity: 2, cause: 'slipped from a ledge' }], { source: 'engine' });
    expect(r.rejected).toEqual([]);
    expect(r.state.health.wounds[0]?.severity).toBe('moderate');
  });
});

describe('healing (health §7, D-150)', () => {
  it('heals day by day; medical care doubles the rate; bacta applies at once', () => {
    const s = sync(fresh(), [wound({ severity: 'moderate', W: 12, part: 'leftLeg' })]).state;
    let rest = s;
    for (let d = 0; d < 7; d++) rest = pass(rest, 86_400);
    expect(rest.health.wounds).toHaveLength(0);
    let med = applyEvents(REGISTRY, s, [{ type: 'careStarted', kind: 'medical', hours: 24 * 10 }], { source: 'engine' }).state;
    for (let d = 0; d < 4; d++) med = pass(med, 86_400);
    expect(med.health.wounds).toHaveLength(0);
    const bacta = applyEvents(REGISTRY, s, [{ type: 'careStarted', kind: 'bacta', hours: 42 }], { source: 'engine' }).state;
    expect(bacta.health.wounds).toHaveLength(0);
  });
  it('healed critical wounds roll for a lasting injury (35%) over many seeds', () => {
    let lasting = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      let s = sync(fresh(), [wound({ severity: 'critical', W: 40, part: 'leftLeg', healProgress: 0.99 })]).state;
      s = { ...s, meta: { ...s.meta, rngState: seedRng(`lasting${i}`) } };
      s = pass(s, 86_400);
      if (s.health.lasting.length) lasting++;
    }
    expect(lasting / n).toBeGreaterThan(0.2);
    expect(lasting / n).toBeLessThan(0.5);
  });
  it('test 13: a turn with no activity recovers meters at the rest rates; only sleep of 7h+ resets them', () => {
    const s = { ...fresh(), health: { ...fresh().health, meters: { p: 3, m: 2, f: 1 } } };
    const rested = pass(s, 3600);
    expect(rested.health.meters.p).toBeLessThan(3);
    expect(rested.health.meters.p).toBeGreaterThan(0);
    const six = applyEvents(REGISTRY, s, [{ type: 'sleepCompleted', hours: 6 }], { source: 'engine' }).state;
    expect(six.health.meters.p).toBeGreaterThan(0);
    const eight = applyEvents(REGISTRY, s, [{ type: 'sleepCompleted', hours: 8 }], { source: 'engine' }).state;
    expect(eight.health.meters).toEqual({ p: 0, m: 0, f: 0 });
  });
});

describe('adaptation and migration', () => {
  it('training an affected skill adapts a lasting injury (at most 3% a day)', () => {
    const s = sync(fresh(), [wound({ severity: 'severe', W: 34, part: 'leftHand', severed: true })]).state;
    const r = applyEvents(REGISTRY, s, [{ type: 'adaptationTrained', hours: { soresu: 2 } }], { source: 'engine' }).state;
    expect(r.health.lasting[0]!.adaptation).toBeCloseTo(0.02);
    const r2 = applyEvents(REGISTRY, r, [{ type: 'adaptationTrained', hours: { soresu: 5 } }], { source: 'engine' }).state;
    expect(r2.health.lasting[0]!.adaptation).toBeCloseTo(0.03);
  });
  it('v1 -> v2 keeps the meters and starts with full Vitality and no wounds', () => {
    const m = migrateHealthV1({ meters: { p: 1, m: 2, f: 0 }, sleepCarry: 0.3 });
    expect(m).toMatchObject({ meters: { p: 1, m: 2, f: 0 }, sleepCarry: 0.3, vitalityLost: 0, wounds: [], lasting: [], dying: null, death: null });
  });
});
