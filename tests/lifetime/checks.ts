// Shared lifetime assertions (progression-targets §6 tests 1, 2 and 5; progression-numbers §20 test 1).
import { expect } from 'vitest';
import { PACE_CAP } from '../../src/data/progression.config';
import { xpForLevel } from '../../src/engine/curve';
import { yAvg } from '../../src/engine/paceClamp';
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

/**
 * The fastest a tier can be reached at 4.0x the Average (Jared, D-235): XP at PACE_CAP x Y_avg(age) a year from the
 * profile's start age, integrated day by day until the tier's XP. Years since the start. Since D-457 the clamp caps XP per
 * hour of a skill; this yearly floor stays the lifetime check of the 4.0x ceiling.
 */
export function paceFloorYears(startAge: number, tier: number): number {
  const need = xpForLevel(tier);
  let xp = 0;
  for (let d = 0; d < 200 * 365; d++) {
    xp += (PACE_CAP * yAvg(startAge + d / 365)) / 365;
    if (xp >= need) return (d + 1) / 365;
  }
  return Infinity;
}

/**
 * Test 2, second half: no tier is reached faster than 4.0x the Average pace (the D-48 clamp holds it). Since D-235 the
 * floor is the clamp's own reference (paceFloorYears from the profile's start age), not the Average's target / 4.
 */
export const within4xFloor = (r: LifeResult): Record<number, number> => Object.fromEntries(TIERS.map((t) => [t, paceFloorYears(r.startAge, t)]));
export function expectWithin4x(r: LifeResult): void {
  const floor = within4xFloor(r);
  for (const t of TIERS) expect(r.milestones[t]!, `tier ${t}`).toBeGreaterThanOrEqual(floor[t]!);
}

/**
 * Luke's two late-life gates (Jared, D-474), from the years' tracked levels (index i = age startAge + i + 1). The body: his
 * Strength, Agility and Endurance (the stat as his body holds it, without the Force boost) have each peaked by 68 and are
 * falling, slowly (at most 5% off the peak at 75). The Force: every Force skill he trains is still rising at his last
 * appearance (63, Fate of the Jedi); no upper bound. "Peaked by 68 and falling" is read with a tolerance (Jared, 27 Nov 2026,
 * m9-tune3 item 4, D-577): no level after 68 more than `peakTolerance` above the level at 68 (his late body curve is flat to a few
 * hundredths of a level, so the peak's year alone moves with noise). A stat that peaked earlier (Strength at 53) passes as before.
 */
export const LUKE_BODY = ['body:strength', 'body:agility', 'body:endurance'] as const;
export const LUKE_FORCE = ['forceControl', 'forceSense', 'forceSpeed'] as const;
export const LUKE_AGES = { bodyBy: 68, force: 63, slowAt: 75, slowLoss: 0.05, peakTolerance: 0.05 } as const;
export function lukeLateLife(levelsByYear: readonly Readonly<Record<string, number>>[], startAge: number): { peaks: Record<string, number>; body: boolean; force: boolean } {
  const at = (k: string, age: number): number => levelsByYear[age - startAge - 1]![k]!;
  const peaks: Record<string, number> = {};
  let body = true;
  for (const k of LUKE_BODY) {
    const row = levelsByYear.map((o) => o[k]!);
    const peak = Math.max(...row);
    peaks[k] = startAge + row.indexOf(peak) + 1;
    const by = at(k, LUKE_AGES.bodyBy);
    const later = Math.max(...row.slice(LUKE_AGES.bodyBy - startAge));
    if (later > by + LUKE_AGES.peakTolerance || at(k, LUKE_AGES.slowAt) < peak * (1 - LUKE_AGES.slowLoss)) body = false;
  }
  const force = LUKE_FORCE.every((k) => at(k, LUKE_AGES.force) > at(k, LUKE_AGES.force - 1));
  return { peaks, body, force };
}

/** Combat share of the main specialty's XP per training year (index = years since the start). */
export const combatShare = (r: LifeResult, i: number): number => (r.yearMain[i]! > 0 ? r.yearCombat[i]! / r.yearMain[i]! : 0);
