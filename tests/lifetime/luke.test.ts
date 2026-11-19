// Luke lifetime test (70 years; progression-targets §2, §6 tests 1-3; progression-numbers §20 test 3).
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { expectMilestones, expectNotFasterThanAnakin, expectWithin4x } from './checks';
import { LUKE, TARGETS, gated } from './profiles';

let r: LifeResult;
const PHYS = ['perf:strength', 'perf:agility', 'perf:endurance'];
beforeAll(() => {
  r = runLifetime(gated(LUKE), 70, { track: ['forceControl', ...PHYS] });
  console.info(`[report ${'luke'}] milestones ${JSON.stringify(r.milestones)} E@41/61 ${JSON.stringify(r.eAtMilestone)} bank share ${(r.bankShare * 100).toFixed(1)}% wounded days by age ${JSON.stringify(r.woundedDaysByAge)} combat share by year ${JSON.stringify(r.yearCombat.map((c, i) => Math.round((c / Math.max(1, r.yearMain[i]!)) * 100)))}`);
}, 600_000);

/** Age at the end of training year i (Luke starts at 19). */
const ageAt = (i: number): number => 19 + i + 1;

describe('Luke lifetime (70 years)', () => {
  it('every milestone of Force Control within +/-20%', () => expectMilestones(r, TARGETS.luke));
  it('never faster than Anakin, never beyond 4.0x', () => {
    expectNotFasterThanAnakin(r);
    expectWithin4x(r);
  });
  it('still gaining Force levels after 40 years of training and at 60 (targets test 3, numbers test 3)', () => {
    const fc = r.levelsByYear.map((o) => o['forceControl']!);
    expect(fc[40]!).toBeGreaterThan(fc[39]!);
    expect(fc[41]!).toBeGreaterThan(fc[40]!);
    // progression-numbers §12 reference: Force ~116 at 62 (a reference, not a tolerance band).
    expect(fc[42]!).toBeGreaterThan(100);
  });
  it('effective physical performance peaks at ages 58-68 (Force augmentation, §11)', () => {
    const mean = r.levelsByYear.map((o) => PHYS.reduce((a, k) => a + o[k]!, 0) / PHYS.length);
    const peak = mean.indexOf(Math.max(...mean));
    expect(ageAt(peak)).toBeGreaterThanOrEqual(58);
    expect(ageAt(peak)).toBeLessThanOrEqual(68);
  });
});
