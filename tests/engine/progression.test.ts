// progression-numbers §20 engine tests 4, 5, 6, 7, 13, 15, 16, 17, 18, 19, 20, 24 (M3 step 3).
import { describe, expect, it } from 'vitest';
import { LOADS } from '../../src/data/activities';
import { K, M_CAP } from '../../src/data/progression.config';
import { ageFactor } from '../../src/engine/ageFactor';
import { challengeFactor, pickDrillRating } from '../../src/engine/challenge';
import { levelExact, levelFloor, levelWithNatural, thresholdsCrossed, tierOf, xpForLevel } from '../../src/engine/curve';
import { EMPTY_DAY, ZERO_METERS, capacities, capacity, efficiency, stepBlock, type BlockInput, type DayTraining, type Meters } from '../../src/engine/fatigue';
import { instructionFactor, teacherFactor } from '../../src/engine/instruction';
import { OUTCOME_MEAN, rollOutcome } from '../../src/engine/outcome';
import { clampCredit, paceCap, yAvg } from '../../src/engine/paceClamp';
import { seedRng } from '../../src/engine/rng';
import { removeRust, rustAfterDay, rustAfterUnused } from '../../src/engine/rust';
import { crossTalentMult, speedM, stateMult, talentMult } from '../../src/engine/speed';
import { spillover } from '../../src/engine/synergy';

const drills = (hours: number): BlockInput => ({ activityId: 'drills', load: LOADS.saberDrill, physical: true, meditation: false, hours, intensity: 'standard' });
const study = (hours: number): BlockInput => ({ activityId: 'study', load: LOADS.study, physical: false, meditation: false, hours, intensity: 'standard' });

/** A day of blocks from fresh meters; returns effective hours per block and fatigue Willpower (capped at 3.0). */
function day(blocks: BlockInput[], end: number, will = end) {
  const caps = capacities(end, will, 0);
  let meters: Meters = ZERO_METERS;
  let d: DayTraining = EMPTY_DAY;
  const eff: number[] = [];
  let w = 0;
  for (const b of blocks) {
    const r = stepBlock(meters, caps, d, b);
    meters = r.meters;
    d = r.day;
    eff.push(r.effectiveHours);
    w += r.fatigueWillpower;
  }
  return { eff, will: Math.min(3, w), fP: meters.p / caps.p };
}

describe('curve and tiers (§1-2)', () => {
  it('XP(L) = K * L^1.75 with K = 11.683 (D-118 / D-119); levels are derived', () => {
    expect(xpForLevel(41)).toBeCloseTo(11.683 * Math.pow(41, 1.75), 6);
    expect(Math.round(xpForLevel(41))).toBe(7761);
    expect(levelFloor(xpForLevel(41))).toBe(41);
    expect(levelFloor(xpForLevel(41) - 1)).toBe(40);
    expect(levelExact(xpForLevel(33.3))).toBeCloseTo(33.3, 9);
    expect(tierOf(20)).toBe('Untrained');
    expect(tierOf(21)).toBe('Apprentice');
    expect(tierOf(101)).toBe('Legendary');
    expect(thresholdsCrossed(20.5, 41.2)).toEqual([21, 41]);
    expect(K).toBe(11.683);
  });

  it('the natural baseline adds in XP terms (§11a)', () => {
    expect(levelWithNatural(0, 25)).toBeCloseTo(25, 9);
    expect(levelWithNatural(xpForLevel(30), 0)).toBeCloseTo(30, 9);
    const both = levelWithNatural(xpForLevel(30), 25);
    expect(both).toBeCloseTo(Math.pow(Math.pow(30, 1.75) + Math.pow(25, 1.75), 1 / 1.75), 9);
  });
});

describe('fatigue (§3, §9)', () => {
  it('capacity reference values', () => {
    expect(capacity(30)).toBeCloseTo(4.2, 9);
    expect(capacity(90)).toBeCloseTo(6.6, 9);
    expect(capacity(150)).toBeCloseTo(8.0, 9);
    expect(efficiency(0.4)).toBe(1);
    expect(efficiency(1.0)).toBeCloseTo(0.3, 9);
    expect(efficiency(1.01)).toBe(0.1);
  });

  it('test 4: fatigue reference days within +/-0.05 (single-stat cases at Willpower 30, D-39)', () => {
    const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(0.05);
    near(day([drills(3)], 30, 30).eff[0]!, 2.67);
    near(day([drills(6)], 30, 30).eff[0]!, 3.39);
    near(day([drills(6)], 90, 30).eff[0]!, 4.52);
    near(day([drills(8)], 90, 30).eff[0]!, 4.88);
    near(0.3 * day([drills(6)], 90, 30).eff[0]!, 1.36);
    let d = day([study(2), drills(3)], 50);
    near(d.eff[0]!, 1.99);
    near(d.eff[1]!, 2.57);
    d = day([drills(3), study(2)], 50);
    near(d.eff[0]!, 2.76);
    near(d.eff[1]!, 1.87);
    d = day([drills(3), study(3)], 50);
    near(d.eff[0]!, 2.76);
    near(d.eff[1]!, 2.26);
  });

  it('§9 Willpower references', () => {
    expect(day([drills(3)], 30).will).toBeCloseTo(0, 2);
    expect(day([drills(6)], 90).will).toBeCloseTo(1.42, 2);
    expect(day([drills(4), study(3)], 60, 40).will).toBeCloseTo(2.88, 2);
    expect(day([drills(8)], 60).will).toBe(3);
  });

  it('test 5: End 90, 8 h gives < 10% more XP than 6 h and ends with f_phys > 1.0', () => {
    const six = day([drills(6)], 90, 30);
    const eight = day([drills(8)], 90, 30);
    expect(eight.eff[0]! / six.eff[0]! - 1).toBeLessThan(0.1);
    expect(eight.fP).toBeGreaterThan(1.0);
  });

  it('test 7: post-workout first mental hour x1.25; the third hour is lower than the same hour done fresh', () => {
    const caps = capacities(50, 50, 0);
    const afterDrills = stepBlock(ZERO_METERS, caps, EMPTY_DAY, drills(1));
    const firstHour = stepBlock(afterDrills.meters, caps, afterDrills.day, study(1));
    const fresh = stepBlock(ZERO_METERS, caps, EMPTY_DAY, study(1));
    // Fresh, the first mental hour is 1.0 (meters near 0); right after drills it is 1.25.
    expect(fresh.effectiveHours).toBeLessThanOrEqual(1);
    expect(firstHour.effectiveHours).toBeCloseTo(1.25, 9);
    const threeAfter = stepBlock(afterDrills.meters, caps, afterDrills.day, study(3));
    const threeFresh = stepBlock(ZERO_METERS, caps, EMPTY_DAY, study(3));
    const thirdAfter = threeAfter.effectiveHours - stepBlock(afterDrills.meters, caps, afterDrills.day, study(2)).effectiveHours;
    const thirdFresh = threeFresh.effectiveHours - stepBlock(ZERO_METERS, caps, EMPTY_DAY, study(2)).effectiveHours;
    expect(thirdAfter).toBeLessThan(thirdFresh);
  });

  it('the same activity beyond 2 h in one day counts x0.85', () => {
    const caps = { p: 1000, m: 1000, f: 1000 };
    const r = stepBlock(ZERO_METERS, caps, EMPTY_DAY, drills(3));
    expect(r.effectiveHours).toBeCloseTo(2 + 0.85, 3);
  });
});

describe('challenge (§4)', () => {
  it('test 6: continuous; gap <= -25 x0.3, -20 x0.45, peak x1.25 over +12..+18, no step larger than 0.08 per point', () => {
    expect(challengeFactor(-40)).toBe(0.3);
    expect(challengeFactor(-25)).toBe(0.3);
    expect(challengeFactor(-20)).toBeCloseTo(0.45, 9);
    for (const g of [12, 14, 16, 18]) expect(challengeFactor(g)).toBe(1.25);
    for (let g = -40; g < 45; g += 0.25) expect(Math.abs(challengeFactor(g + 1) - challengeFactor(g))).toBeLessThanOrEqual(0.08 + 1e-12);
  });

  it('drill choice follows training-routines §3', () => {
    expect(pickDrillRating(5, 'standard')).toBe(10);
    expect(pickDrillRating(25, 'standard')).toBe(30);
    expect(pickDrillRating(15, 'push')).toBe(30);
    expect(pickDrillRating(45, 'standard', [10, 30])).toBe(30);
  });
});

describe('outcome roll (§5)', () => {
  it('test 13: mean over 10,000 seeded sessions = 1.0 +/- 0.02', () => {
    let rng = seedRng('outcome-test');
    let sum = 0;
    let breakthroughs = 0;
    for (let i = 0; i < 10_000; i++) {
      const [o, next] = rollOutcome(rng);
      rng = next;
      sum += o.mult;
      if (o.name === 'breakthrough') breakthroughs++;
    }
    expect(Math.abs(sum / 10_000 - 1)).toBeLessThanOrEqual(0.02);
    expect(OUTCOME_MEAN).toBeCloseTo(0.996, 3);
    expect(breakthroughs / 10_000).toBeGreaterThan(0.03);
    expect(breakthroughs / 10_000).toBeLessThan(0.05);
  });
});

describe('rust (§13)', () => {
  const months = (n: number) => n * 30;
  it('test 15: reference values reproduce exactly', () => {
    expect(rustAfterUnused('technique', 30, months(6))).toBeCloseTo(0.05, 9);
    expect(rustAfterUnused('technique', 30, months(12))).toBeCloseTo(0.11, 9);
    expect(rustAfterUnused('technique', 30, months(36))).toBeCloseTo(0.15, 9);
    expect(rustAfterUnused('technique', 70, months(12))).toBeCloseTo(0.06875, 9);
    expect(rustAfterUnused('technique', 70, months(36))).toBeCloseTo(0.1125, 9);
    expect(rustAfterUnused('technique', 85, months(12))).toBeCloseTo(0.055, 9);
    expect(rustAfterUnused('technique', 85, months(36))).toBeCloseTo(0.1, 9);
    expect(rustAfterUnused('physical', 30, 14)).toBe(0);
    expect(rustAfterUnused('knowledge', 30, months(36))).toBeCloseTo(0.05, 9);
  });

  it('the daily step matches the closed reference', () => {
    let r = 0;
    for (let d = 1; d <= months(6); d++) r = rustAfterDay(r, 'technique', 30, d);
    expect(r).toBeCloseTo(0.05, 9);
  });

  it('test 16: 30 effective hours of practice clear 15% rust', () => {
    expect(removeRust(0.15, 30)).toBeCloseTo(0, 9);
    expect(removeRust(0.15, 29)).toBeGreaterThan(0);
  });
});

describe('synergy (§14)', () => {
  it('test 17: spillover never passes the ceiling; with only a 0.25 coefficient the target settles near 0.45x the source', () => {
    let src = 0;
    let tgt = 0;
    const session = 30;
    for (let i = 0; i < 2000; i++) {
      src += session;
      const spill = spillover({
        credited: { shien: session },
        levelOf: (s) => levelExact(s === 'shien' ? src : tgt),
        xpOf: (s) => (s === 'djemSo' ? tgt : 0),
        naturalOf: () => 0,
        links: [{ source: 'shien', target: 'djemSo', relation: 'variant' }],
      });
      tgt += spill['djemSo'] ?? 0;
      expect(levelExact(tgt)).toBeLessThanOrEqual(0.6 * levelExact(src) + 1e-9);
    }
    expect(Math.abs(levelExact(tgt) / levelExact(src) - 0.45)).toBeLessThanOrEqual(0.05);
  });

  it('total spillover from one session never exceeds 25% of its credited XP', () => {
    const spill = spillover({ credited: { strength: 10, agility: 10, endurance: 10 }, levelOf: () => 60, xpOf: () => 0, naturalOf: () => 0 });
    const total = Object.values(spill).reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(0.25 * 30 + 1e-9);
  });

  it('spillover reaches only Force abilities the character knows (level 1+; combat pass 1: a Guardian gaining Barrier XP)', () => {
    const levels: Record<string, number> = { forceControl: 50, telekinesis: 45, forceBarrier: 0, forceAbsorb: 0.6 };
    const spill = spillover({ credited: { forceControl: 10 }, levelOf: (s) => levels[s] ?? 0, xpOf: () => 0, naturalOf: () => 0 });
    expect(spill['telekinesis'] ?? 0).toBeGreaterThan(0);
    expect(spill['forceBarrier']).toBeUndefined();
    expect(spill['forceAbsorb']).toBeUndefined();
    expect(spill['battleMeditation']).toBeUndefined();
  });
});

describe('instruction (§15, §19)', () => {
  it('test 18: the teacher factor uses the teacher level in that skill', () => {
    // A Soresu master (80) teaching Djem So at 35 to a student at 30.
    expect(teacherFactor(35, 30)).toBeCloseTo(1.025, 9);
    expect(teacherFactor(80, 30)).toBeCloseTo(1.15, 9);
    expect(instructionFactor({ studentLevel: 30, teacher: { level: 35 } }).factor).toBeCloseTo(1.025, 9);
  });

  it('test 19: a student who passes the teacher stops getting a teaching bonus', () => {
    expect(teacherFactor(40, 40)).toBe(1);
    expect(teacherFactor(40, 45)!).toBeLessThan(1);
    expect(teacherFactor(40, 51)).toBeNull();
    const r = instructionFactor({ studentLevel: 51, teacher: { level: 40 } });
    expect(r.mode).toBe('solo');
    expect(r.factor).toBe(0.9);
  });

  it('partner and solo factors', () => {
    expect(instructionFactor({ studentLevel: 30 }).factor).toBe(0.9);
    expect(instructionFactor({ studentLevel: 30, partner: { level: 40 } }).factor).toBe(1);
    expect(instructionFactor({ studentLevel: 50, partner: { level: 30 } }).factor).toBe(0.95);
    expect(instructionFactor({ studentLevel: 30, partner: { level: 30, bond: true } }).factor).toBeCloseTo(1.03, 9);
  });
});

describe('age bands (§16)', () => {
  it('test 20: age bands apply per category; a late start (19) gets no child bonus', () => {
    expect(ageFactor('technique', 6)).toBe(1.25);
    expect(ageFactor('wisdom', 6)).toBe(0.85);
    expect(ageFactor('physical', 15)).toBe(1.1);
    expect(ageFactor('academic', 6)).toBe(1);
    for (let a = 19; a <= 24; a += 0.5) expect(ageFactor('technique', a)).toBeLessThanOrEqual(1.05 - ((a - 15) * 0.05) / 9 + 1e-9);
    expect(ageFactor('technique', 19)).toBeLessThan(1.05);
    expect(ageFactor('technique', 24)).toBe(1);
  });
});

describe('M and the pace clamp (§5, test 24)', () => {
  it('talent domains and cross-talent', () => {
    expect(talentMult({ combat: 'prodigy' }, 'shiiCho')).toBe(1.5);
    expect(talentMult({ combat: 'prodigy' }, 'forceControl')).toBe(1);
    expect(talentMult({ mind: 'gifted' }, 'forceKnowledge')).toBe(1.25);
    expect(crossTalentMult({ force: 'prodigy' }, 'shiiCho')).toBe(1.1);
    expect(crossTalentMult({ force: 'gifted' }, 'shiiCho')).toBe(1);
    expect(crossTalentMult({ force: 'exceptional' }, 'forceControl')).toBe(1);
  });

  it('test 24: every multiplier at its maximum still respects the 2.8 cap', () => {
    const max = speedM({ talent: 1.8, crossTalent: 1.1, instruction: 1.23, age: 1.25, state: 1.3, alignment: 1.3, species: 1.1 });
    expect(max.m).toBe(M_CAP);
    expect(max.capped).toBe(true);
    const plain = speedM({ talent: 1, crossTalent: 1, instruction: 1, age: 1, state: 1, alignment: 1, species: 1 });
    expect(plain.m).toBe(1);
  });

  it('test 24: the clamp holds 4.0x the Average at the same share', () => {
    const cap = paceCap(20, 0.5);
    expect(cap).toBeCloseTo(4 * yAvg(20), 9);
    expect(yAvg(20)).toBe(551);
    const r = clampCredit(500, cap - 100, cap);
    expect(r.credited).toBeCloseTo(100, 9);
    expect(r.discarded).toBeCloseTo(400, 9);
    expect(clampCredit(50, 0, cap).credited).toBe(50);
  });

  it('state of mind: grief x0.80 multiplies; anger channels x1.20 into eligible skills and x0.80 on light skills', () => {
    expect(stateMult('neutral', 'shiiCho', { grief: 0.8 })).toBeCloseTo(0.8, 9);
    expect(stateMult('centered', 'shiiCho', { grief: 0.8 })).toBeCloseTo(1.05 * 0.8, 9);
    expect(stateMult('anger', 'djemSo')).toBe(1.2);
    expect(stateMult('anger', 'forceOutput')).toBe(1.2);
    expect(stateMult('anger', 'meditation')).toBe(0.8);
    expect(stateMult('anger', 'forceHealOthers')).toBe(0.8);
    expect(stateMult('anger', 'shiiCho')).toBe(1);
    expect(stateMult('hatred', 'forceLightning', { darkPressure: 60 })).toBe(1.3);
  });
});
