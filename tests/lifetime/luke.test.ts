// Luke lifetime test (70 years; progression-targets §2, §6 tests 1-3; progression-numbers §20 test 3).
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { LUKE_BODY, LUKE_FORCE, expectMilestones, expectNotFasterThanAnakin, expectWithin4x, lukeLateLife } from './checks';
import { LUKE, TARGETS, gated } from './profiles';

let r: LifeResult;
beforeAll(() => {
  r = runLifetime(gated(LUKE), 70, { track: [...LUKE_FORCE, ...LUKE_BODY] });
  console.info(`[report ${'luke'}] milestones ${JSON.stringify(r.milestones)} E@41/61 ${JSON.stringify(r.eAtMilestone)} bank share ${(r.bankShare * 100).toFixed(1)}% wounded days by age ${JSON.stringify(r.woundedDaysByAge)} combat share by year ${JSON.stringify(r.yearCombat.map((c, i) => Math.round((c / Math.max(1, r.yearMain[i]!)) * 100)))}`);
}, 600_000);

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
  // D-474 (Jared): two gates in place of "effective physical performance peaks at 58-68". Fate of the Jedi is his last
  // appearance, so nothing caps his growth in the Force, but his body declines.
  it('the body: Strength, Agility and Endurance have each peaked by 68 and are slowly declining', () => {
    const l = lukeLateLife(r.levelsByYear, r.startAge);
    expect(l.body, JSON.stringify(l.peaks)).toBe(true);
  });
  it('the Force: every Force skill he trains is still rising at his last appearance (63), with no upper bound', () => {
    expect(lukeLateLife(r.levelsByYear, r.startAge).force).toBe(true);
  });
});
