// Shared lifetime assertions (progression-targets §6 tests 1, 2 and 5; progression-numbers §20 test 1).
import { expect } from 'vitest';
import type { LifeResult } from '../support/lifetime';
import { TARGETS } from './profiles';

export const TIERS = [21, 41, 61, 81, 101] as const;

/** Every milestone within +/-20% of its target. */
export function expectMilestones(r: LifeResult, targets: Record<number, number>): void {
  for (const t of TIERS) {
    const got = r.milestones[t];
    expect(got, `tier ${t} reached`).toBeDefined();
    expect(Math.abs(got! / targets[t]! - 1), `tier ${t}: ${got!.toFixed(2)} y vs target ${targets[t]}`).toBeLessThanOrEqual(0.2);
  }
}

/**
 * Test 2, first half: no profile beats the max (Anakin) profile's pace at any tier. Anakin's own test keeps
 * each of his milestones at or before 1.2 x his target, so a profile that needs at least that long is
 * never faster than Anakin.
 */
export function expectNotFasterThanAnakin(r: LifeResult): void {
  for (const t of TIERS) expect(r.milestones[t]!, `tier ${t}`).toBeGreaterThanOrEqual(TARGETS.anakin[t] * 1.2);
}

/** Test 2, second half: no tier is reached faster than 4.0x the Average pace (the D-48 clamp holds it). */
export function expectWithin4x(r: LifeResult): void {
  for (const t of TIERS) expect(r.milestones[t]!, `tier ${t}`).toBeGreaterThanOrEqual(TARGETS.average[t] / 4.0);
}

/** Combat share of the main specialty's XP per training year (index = years since the start). */
export const combatShare = (r: LifeResult, i: number): number => (r.yearMain[i]! > 0 ? r.yearCombat[i]! / r.yearMain[i]! : 0);
