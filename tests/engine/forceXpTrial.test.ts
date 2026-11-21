// The Force XP rework prototype (harness only; docs-v2/testing/force-xp-trial.md): off by default, and its exercise and
// reserve math follow force-xp-rework.md and the reserve spec.
import { describe, expect, it } from 'vitest';
import { FORCE_XP_TRIAL, buildExercise, demandRating, drillHours, gapForChallenge, recoverHours, reshapeReserve } from '../../src/engine/forceXpTrial';
import { challengeFactor } from '../../src/engine/challenge';

describe('Force XP trial', () => {
  it('is off in the game', () => {
    expect(FORCE_XP_TRIAL.enabled).toBe(false);
    expect(FORCE_XP_TRIAL.collect).toBe(false);
  });

  it('demand rating: Basic 20, Complex about 60, Advanced 80, +30 per doubling (proposal §1)', () => {
    expect(demandRating(10, 1, 1)).toBeCloseTo(20, 9);
    expect(demandRating(25, 1, 1)).toBeCloseTo(59.66, 2);
    expect(demandRating(40, 1, 1)).toBeCloseTo(80, 9);
    expect(demandRating(20, 1, 1) - demandRating(10, 1, 1)).toBeCloseTo(30, 9);
  });

  it('the neutral gap hits the target challenge factor', () => {
    expect(challengeFactor(gapForChallenge(1.0, 'standard'))).toBeCloseTo(1.0, 3);
    expect(challengeFactor(gapForChallenge(1.25, 'push'))).toBeCloseTo(1.25, 3);
    const g = gapForChallenge(1.1, 'standard');
    expect(challengeFactor(g)).toBeCloseTo(1.1, 2);
  });

  it('a control exercise reaches any rating through finesse without more draw', () => {
    const a = buildExercise('forceControl', { level: 50, forceControl: 50, poolMax: 350, targetRating: 55 });
    const b = buildExercise('forceControl', { level: 50, forceControl: 50, poolMax: 350, targetRating: 75 });
    expect(a.rating).toBeCloseTo(55, 6);
    expect(b.rating).toBeCloseTo(75, 6);
    expect(a.drawPerUnit).toBeCloseTo(b.drawPerUnit, 9);
    // Moderate at normal effort, efficiency 1 + 50/50 + 50/100 = 2.5.
    expect(a.drawPerUnit).toBeCloseTo(15 / 2.5, 9);
  });

  it('an exercise with little finesse at a free tier and level is free (trickle)', () => {
    const ex = buildExercise('telekinesis', { level: 45, forceControl: 45, poolMax: 350, targetRating: 25 });
    expect(ex.free).toBe(true);
    expect(ex.drawPerUnit).toBe(0);
  });

  it('pool max gates output scale; effort makes up part of it', () => {
    const small = buildExercise('forceOutput', { level: 80, forceControl: 80, poolMax: 120, targetRating: 95 });
    const big = buildExercise('forceOutput', { level: 80, forceControl: 80, poolMax: 1000, targetRating: 95 });
    expect(small.scale).toBeLessThanOrEqual(2.25);
    expect(big.rating).toBeCloseTo(95, 6);
    expect(small.rating).toBeLessThanOrEqual(big.rating + 1e-9);
  });

  it('sense exercises draw the catalog sustained cost: Force Sight 2, precognition 5 from level 60', () => {
    const sight = buildExercise('forceSense', { level: 30, forceControl: 30, poolMax: 200, targetRating: 35 });
    const pre = buildExercise('forceSense', { level: 70, forceControl: 70, poolMax: 450, targetRating: 75 });
    expect(sight.base).toBe(2);
    expect(pre.base).toBe(5);
    expect(sight.sustained && pre.sustained).toBe(true);
  });

  it('drilling draws the pool and builds strain; sleep clears it', () => {
    const r = reshapeReserve(null, 10_000, 20, 20);
    expect(r.poolMax).toBeCloseTo(150, 6);
    const ex = buildExercise('forceControl', { level: 20, forceControl: 20, poolMax: r.poolMax, targetRating: 35 });
    const after = drillHours(r, ex, 2);
    expect(after.pool).toBeLessThan(r.pool);
    expect(after.strain).toBeGreaterThan(0.1);
    const slept = recoverHours(after, 8, 'sleep');
    expect(slept.strain).toBeLessThan(after.strain);
    expect(slept.pool).toBeGreaterThan(after.pool);
  });
});
