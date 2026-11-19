// Obi-Wan lifetime test (70 years; progression-targets §2, §6 tests 1, 2, 5; combat-xp §5).
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { combatShare, expectMilestones, expectNotFasterThanAnakin, expectWithin4x } from './checks';
import { OBIWAN, TARGETS, gated } from './profiles';

let r: LifeResult;
beforeAll(() => {
  r = runLifetime(gated(OBIWAN), 70);
  console.info(`[report ${'obiwan'}] milestones ${JSON.stringify(r.milestones)} E@41/61 ${JSON.stringify(r.eAtMilestone)} bank share ${(r.bankShare * 100).toFixed(1)}% wounded days by age ${JSON.stringify(r.woundedDaysByAge)} combat share by year ${JSON.stringify(r.yearCombat.map((c, i) => Math.round((c / Math.max(1, r.yearMain[i]!)) * 100)))}`);
}, 600_000);

describe('Obi-Wan lifetime (70 years)', () => {
  it('every milestone within +/-20%', () => expectMilestones(r, TARGETS.obiwan));
  it('never faster than Anakin, never beyond 4.0x', () => {
    expectNotFasterThanAnakin(r);
    expectWithin4x(r);
  });
  // The mean over the war years (Jared, D-159 amended): the per-year shares are reported, not gated.
  it('Clone Wars years (ages 35-38): combat is 20-30% of the main-form XP, on average over the war years', () => {
    const war = [32, 33, 34].map((i) => combatShare(r, i));
    console.info(`[report obiwan] war-year shares ${war.map((x) => (x * 100).toFixed(1)).join(' / ')}%`);
    const mean = war.reduce((a, b) => a + b, 0) / war.length;
    expect(mean, 'war-year mean').toBeGreaterThanOrEqual(0.2);
    expect(mean, 'war-year mean').toBeLessThanOrEqual(0.3);
  });
  it('peacetime: combat under 10%', () => {
    for (let i = 0; i < r.yearMain.length; i++) if (i < 32 || i > 34) expect(combatShare(r, i), `age ${3 + i}`).toBeLessThan(0.1);
  });
});
