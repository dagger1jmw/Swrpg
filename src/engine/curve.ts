// The progression curve (progression-numbers §1-2): XP(L) = K * L^1.75; levels are derived from
// XP and never stored. Pure.
import { CURVE_EXP, K, TIERS, TIER_THRESHOLDS, type TierName } from '../data/progression.config';

export function xpForLevel(level: number, k = K): number {
  return k * Math.pow(Math.max(0, level), CURVE_EXP);
}

/** The exact (fractional) level; the engine uses it for gaps, capacities and ceilings. */
export function levelExact(xp: number, k = K): number {
  return Math.pow(Math.max(0, xp) / k, 1 / CURVE_EXP);
}

/** The displayed level: L = floor((XP / K)^(1/1.75)). A small epsilon keeps exact levels whole. */
export function levelFloor(xp: number, k = K): number {
  return Math.floor(levelExact(xp, k) + 1e-9);
}

/** Level from trained XP plus a natural baseline level N (progression-numbers §11a). */
export function levelWithNatural(trainedXp: number, natural: number, k = K): number {
  return levelExact(xpForLevel(natural, k) + Math.max(0, trainedXp), k);
}

export function tierOf(level: number): TierName {
  for (const [min, name] of TIERS) if (level >= min) return name;
  return 'Untrained';
}

/** Tier thresholds crossed going from level a to level b (a < b). */
export function thresholdsCrossed(before: number, after: number): number[] {
  return TIER_THRESHOLDS.filter((t) => before < t && after >= t);
}

