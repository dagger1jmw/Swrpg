// Anakin lifetime test (70 years; the max profile; progression-targets §2, §6 tests 1, 2, 5; combat-xp §5).
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { TIERS, combatShare, expectMilestones, expectWithin4x } from './checks';
import { ANAKIN, TARGETS, gated } from './profiles';

let r: LifeResult;
beforeAll(() => {
  r = runLifetime(gated(ANAKIN), 70);
  console.info(`[report ${'anakin'}] milestones ${JSON.stringify(r.milestones)} E@41/61 ${JSON.stringify(r.eAtMilestone)} bank share ${(r.bankShare * 100).toFixed(1)}% wounded days by age ${JSON.stringify(r.woundedDaysByAge)} combat share by year ${JSON.stringify(r.yearCombat.map((c, i) => Math.round((c / Math.max(1, r.yearMain[i]!)) * 100)))}`);
}, 600_000);

describe('Anakin lifetime (70 years)', () => {
  it('every milestone within +/-20%', () => expectMilestones(r, TARGETS.anakin));
  it('the max profile: every milestone at or before 1.2 x its target (the bound the others are held to)', () => {
    for (const t of TIERS) expect(r.milestones[t]!).toBeLessThanOrEqual(TARGETS.anakin[t] * 1.2);
  });
  it('never beyond 4.0x the Average pace', () => expectWithin4x(r));
  // The mean over the war years (Jared, D-159 amended): the per-year shares are reported, not gated.
  it('Clone Wars years (ages 19-22): combat is 25-35% of the main-form XP, on average over the war years', () => {
    const war = [10, 11, 12].map((i) => combatShare(r, i));
    console.info(`[report anakin] war-year shares ${war.map((x) => (x * 100).toFixed(1)).join(' / ')}%`);
    const mean = war.reduce((a, b) => a + b, 0) / war.length;
    expect(mean, 'war-year mean').toBeGreaterThanOrEqual(0.25);
    expect(mean, 'war-year mean').toBeLessThanOrEqual(0.35);
  });
});
