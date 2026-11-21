// The M6 precognition trial (harness only; docs-v2/testing/precog-m6-trial.md): off by default, and its math matches the
// reserve spec's worked examples (force-reserve.md §4 strain table, §11 ceilings, §12 tiers).
import { describe, expect, it } from 'vitest';
import { PRECOG_TRIAL, depthMult, poolCeiling, precogUpkeep, rateMult, trialPool, trialTier } from '../../src/engine/precogTrial';

describe('precognition trial', () => {
  it('is off in the game', () => {
    expect(PRECOG_TRIAL.enabled).toBe(false);
  });

  it('pool ceilings follow 500 x (count / 10,000)^1.5 (reserve §11)', () => {
    expect(poolCeiling(10_000)).toBeCloseTo(500, 6);
    expect(poolCeiling(27_700)).toBeCloseTo(2305, 0);
    expect(poolCeiling(17_300)).toBeCloseTo(1138, 0);
    expect(poolCeiling(27_700) / poolCeiling(17_300)).toBeCloseTo(2.03, 2);
  });

  it('reproduces the §4 worked example: a 10% draw at twice the usual rate, comfort line at 40%', () => {
    const strain = (poolShare: number): number => 0.1 * Math.min(8, depthMult(poolShare, 0.4) * rateMult(0.1, 0.05));
    expect(strain(0.9)).toBeCloseTo(0.05, 3);
    expect(strain(0.4)).toBeCloseTo(0.05, 3);
    expect(strain(0.25)).toBeCloseTo(0.18, 2);
    expect(strain(0.11)).toBeCloseTo(0.62, 2);
    expect(strain(0)).toBeCloseTo(0.8, 6);
  });

  it('the rate multiplier is 1 at or under the usual rate and caps at 4', () => {
    expect(rateMult(5, 5)).toBe(1);
    expect(rateMult(10, 5)).toBe(2);
    expect(rateMult(100, 5)).toBe(4);
  });

  it('tiers take the worse of pool and strain (§12)', () => {
    const t = { pool: 80, poolMax: 100, comfort: 40 };
    expect(trialTier(t, 0.1)).toBe(0);
    expect(trialTier(t, 0.5)).toBe(2);
    expect(trialTier({ ...t, pool: 30 }, 0.1)).toBe(2);
    expect(trialTier({ ...t, pool: 0 }, 0.1)).toBe(4);
    expect(trialTier(t, 1.01)).toBe(4);
  });

  it('a Knight holds precognition inside the comfort range; the senses go dark when the pool runs out', () => {
    const knight = trialPool('k', 50, 50);
    expect(knight.poolMax).toBeCloseTo(350, 6);
    const one = precogUpkeep(knight, { strain: 0, forceSense: 50, centered: false, fearful: false, worstWound: null, exchange: 0 });
    // Base 5 / efficiency 2.5 = 2 pool a round; strain 2 / 350 x 0.25 + 0.001.
    expect(knight.pool - one.t.pool).toBeCloseTo(2, 6);
    expect(one.strainGain).toBeCloseTo((2 / 350) * 0.25 + 0.001, 9);
    const empty = precogUpkeep({ ...knight, pool: 1 }, { strain: 0.2, forceSense: 50, centered: false, fearful: false, worstWound: null, exchange: 7 });
    expect(empty.t.dark).toBe(true);
    expect(empty.t.darkAt).toBe(7);
    const after = precogUpkeep(empty.t, { strain: 0.2, forceSense: 50, centered: false, fearful: false, worstWound: null, exchange: 8 });
    expect(after.strainGain).toBe(0);
  });

  it('strain above 1.0 darkens the senses before any draw', () => {
    const r = precogUpkeep(trialPool('m', 80, 80), { strain: 1.05, forceSense: 80, centered: true, fearful: false, worstWound: null, exchange: 3 });
    expect(r.t.dark).toBe(true);
    expect(r.strainGain).toBe(0);
  });
});
