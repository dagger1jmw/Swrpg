// M7 §15 ranks and milestones (ranks.md §5 tests; flag-registry §7; D-424).
import { describe, expect, it } from 'vitest';
import { TRIALS } from '../../src/data/ranks.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { nextFloat, seedRng } from '../../src/engine/rng';
import { NO_RECORD, knightTrialsDone, percentileOf, rollTrial, selectionChance, standing, trialBlock } from '../../src/features/ranks/rules';
import { initiatePopulation, selectPromotionCheck, selectTrialBlock, selectUnmetFor } from '../../src/features/ranks/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import { advanceTime } from '../../src/state/advanceTime';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const at = (year: number, month = 1, day = 1) => absDayFromDate({ year, month, day });
const make = (o: { age: number; rank: string; xp?: Record<string, number>; year?: number; path?: 'jedi' | 'sith' }): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'ranks',
    start: { day: at(o.year ?? -3661), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(o.year ?? -3661) - Math.round(o.age * 368), path: o.path ?? 'jedi', archetype: o.path === 'sith' ? 'sithWarrior' : 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: o.xp ?? {},
    rank: o.rank,
  });
const xp = (levels: Record<string, number>) => Object.fromEntries(Object.entries(levels).map(([k, v]) => [k, xpForLevel(v)]));
const KNIGHT_READY = xp({ soresu: 50, forceControl: 44, forceSense: 40, willpower: 62, endurance: 45 });

describe('rules (pure)', () => {
  it('standing weights: 50% percentile, 30% deeds, 20% relationships; selection is S / 940', () => {
    expect(standing({ percentile: 0.5, deeds: 0, relationships: 0 })).toBeCloseTo(25);
    expect(standing({ percentile: 1, deeds: 5, relationships: 100 })).toBeCloseTo(100);
    expect(selectionChance(50)).toBeCloseTo(50 / 940);
    expect(percentileOf(5, [1, 2, 3, 10])).toBe(0.75);
  });
  it('test 2: about 14% (+/-3) of average-standing Initiates (S 50) are never chosen over the 36-roll window', () => {
    let rng = seedRng('selection');
    let never = 0;
    for (let i = 0; i < 10000; i++) {
      let chosen = false;
      for (let m = 0; m < 36 && !chosen; m++) {
        let u: number;
        [u, rng] = nextFloat(rng);
        if (u < selectionChance(50)) chosen = true;
      }
      if (!chosen) never++;
    }
    expect(never / 10000).toBeGreaterThan(0.11);
    expect(never / 10000).toBeLessThan(0.17);
  });
  it('test 4: retakes wait a year; a third failure ends the attempts', () => {
    const c = { rank: 'padawan', age: 25, padawanYears: 12, masterApproval: true, unmetKnight: [], unmetInitiate: [], corps: false };
    expect(trialBlock('courage', c, NO_RECORD, 1000)).toBeNull();
    expect(trialBlock('courage', c, { passed: false, fails: 1, lastDay: 900 }, 1000)).toMatch(/waits a year/);
    expect(trialBlock('courage', c, { passed: false, fails: 1, lastDay: 600 }, 1000)).toBeNull();
    expect(trialBlock('courage', c, { passed: false, fails: 3, lastDay: 0 }, 1000)).toMatch(/no more attempts/);
    expect(trialBlock('courage', { ...c, masterApproval: false }, NO_RECORD, 1000)).toMatch(/approval/);
    expect(trialBlock('courage', { ...c, padawanYears: 9 }, NO_RECORD, 1000)).toMatch(/10 years/);
  });
  it('test 4: each trial uses its stated checks (Skill: 3 of 4 at rating 45; Spirit reads the dark pressure)', () => {
    expect(TRIALS.skill.checks).toHaveLength(4);
    expect(TRIALS.skill.need).toBe(3);
    const strong = rollTrial(seedRng('t'), TRIALS.insight, () => 200, 0);
    expect(strong.passed).toBe(true);
    const spirit = rollTrial(seedRng('t'), TRIALS.spirit, () => 0, 100);
    expect(spirit.rolls[0]!.dc).toBeCloseTo(34);
  });
  it('test 5: a wartime heroic act counts for Courage and Flesh only', () => {
    const passed = { skill: { passed: true, fails: 0, lastDay: 1 }, spirit: { passed: true, fails: 0, lastDay: 1 }, insight: { passed: true, fails: 0, lastDay: 1 } };
    expect(knightTrialsDone(passed, true).done).toBe(true);
    expect(knightTrialsDone(passed, false).missing).toEqual(['the Trial of Courage', 'the Trial of the Flesh']);
    expect(knightTrialsDone({ courage: { passed: true, fails: 0, lastDay: 1 } }, true).done).toBe(false);
  });
  it('test 9: the skill percentile uses a seeded population of NPC Initiates of the same age', () => {
    const a = initiatePopulation('seed-a', 11, 200);
    expect(a).toHaveLength(200);
    expect(initiatePopulation('seed-a', 11, 200)).toBe(a);
    expect(initiatePopulation('seed-b', 11, 200)).not.toEqual(a);
  });
});

describe('the ranks feature', () => {
  it('test 6/7: the AI cannot promote with requirements unmet; the refusal names them', () => {
    const s = make({ age: 16, rank: 'padawan', xp: xp({ soresu: 30 }) });
    const r = applyEvents(REGISTRY, s, [{ type: 'promotionProposed', rank: 'knight', reason: 'the story says so' }], { source: 'ai' });
    expect(r.state.ranks.rank).toBe('padawan');
    expect(r.rejected.map((x) => x.reason).join(' ')).toMatch(/refused: .*highest form/);
    expect(applyEvents(REGISTRY, s, [{ type: 'promotionProposed', rank: 'padawan' }], { source: 'ai' }).state.ranks.rank).toBe('padawan');
  });
  it('a Knight needs the five trials (or the bypass); with them and the minimums the proposal applies', () => {
    let s = make({ age: 25, rank: 'padawan', xp: KNIGHT_READY });
    expect(selectUnmetFor(s, 'knight')).toEqual([]);
    expect(selectPromotionCheck(s, 'knight').reasons.join(' ')).toMatch(/trials not passed/);
    s = { ...s, ranks: { ...s.ranks, trials: Object.fromEntries(['skill', 'courage', 'flesh', 'spirit', 'insight'].map((t) => [t, { passed: true, fails: 0, lastDay: 0 }])) } };
    const r = applyEvents(REGISTRY, s, [{ type: 'promotionProposed', rank: 'knight' }], { source: 'ai' });
    expect(r.state.ranks.rank).toBe('knight');
    expect(r.state.ranks.since).toBe(s.clock.now.day);
  });
  it('test 8: rank-gating flags cannot be set by the AI', () => {
    const s = make({ age: 25, rank: 'padawan' });
    for (const f of ['masterApproval', 'councilBypassGranted', 'trialPassed:courage', 'initiateTrialsPassed', 'heroicAct:x', 'deed:x']) {
      expect(applyEvents(REGISTRY, s, [{ type: 'flagSet', flag: f }], { source: 'ai' }).state.flags.set, f).not.toContain(f);
    }
  });
  it('a trial attempt rolls its checks, records the result and its flag; the master must approve first', () => {
    let s = make({ age: 25, rank: 'padawan', xp: KNIGHT_READY });
    s = { ...s, ranks: { ...s.ranks, since: s.clock.now.day - 368 * 12 } };
    expect(selectTrialBlock(s, 'insight')).toMatch(/approval/);
    s = applyEvents(REGISTRY, s, [{ type: 'flagSet', flag: 'masterApproval' }], { source: 'engine' }).state;
    expect(selectTrialBlock(s, 'insight')).toBeNull();
    const r = applyEvents(REGISTRY, s, [{ type: 'trialAttempted', trial: 'insight' }], { source: 'player' }).state;
    const rec = r.ranks.trials['insight']!;
    expect(rec.lastDay).toBe(s.clock.now.day);
    expect(r.flags.set.some((f) => f === 'trialPassed:insight' || f === 'trialFailed:insight')).toBe(true);
  });
  it('test 3: an Initiate not chosen by 13 is sent to the Service Corps by the Council of Reassignment', () => {
    const s = make({ age: 12.99, rank: 'initiate', year: -3661 });
    const later = advanceTime(REGISTRY, s, { seconds: 40 * 86400, reason: "test", source: "timeElapsed" }).state;
    expect(later.ranks.corps).not.toBeNull();
  });
  it('the master\'s approval: set by the monthly hook only once every condition holds', () => {
    let s = make({ age: 25, rank: 'padawan', xp: KNIGHT_READY });
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Master Orvan', species: 'human', faction: 'jediOrder', role: 'jediMaster', ageApprox: 60, description: '' }], { source: 'ai' }).state;
    const m = Object.keys(s.npcs.byId)[0]!;
    s = applyEvents(REGISTRY, s, [{ type: 'masterSet', npcRef: m }], { source: 'player' }).state;
    s = { ...s, ranks: { ...s.ranks, since: s.clock.now.day - 368 * 12 }, relationships: { byNpcId: { [m]: { value: 50, lastDay: 0, lastReason: "test" } } } } as GameState;
    const later = advanceTime(REGISTRY, s, { seconds: 40 * 86400, reason: "test", source: "timeElapsed" }).state;
    expect(later.flags.set).toContain('masterApproval');
  });
});
