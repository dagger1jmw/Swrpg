// The 4.0x pace clamp (progression-numbers §5, D-48; D-457 replaces D-104's share rule): per skill, over a rolling
// 365-day window, credited XP cannot exceed 4.0 x the Average's XP per hour in that skill at that age x the character's
// hours in that skill in the window. The ceiling limits prodigy speed, never focus: hours in other skills never change a
// skill's cap. Pure.
import { PACE_CAP, PACE_WINDOW_DAYS, Y_AVG } from '../data/progression.config';
import { R_AVG, R_AVG_ALL, R_AVG_FORM, type RateRow } from '../data/paceRates';
import { SKILL_BY_ID } from '../data/skills';
import { interp } from './interp';

/** One day's credited XP and training hours for a skill. */
export interface WindowEntry {
  day: number;
  xp: number;
  hours: number;
}

/**
 * Y_avg(age): the Average's most-trained form XP for the 365 days starting at that age. Since D-457 it is no longer the
 * clamp's cap; it stays the reference of the "within 4.0x" lifetime floor (D-235) and the Average's table gate.
 */
export function yAvg(age: number): number {
  return interp(Y_AVG, age);
}

/** Entries still inside the window that ends on `today` (inclusive). */
export function inWindow(entries: readonly WindowEntry[], today: number): WindowEntry[] {
  return entries.filter((e) => e.day > today - PACE_WINDOW_DAYS && e.day <= today);
}

/**
 * Which row of the Average's per-hour table a skill reads (D-457): its own when the Average trains it; a lightsaber form
 * the Average does not train reads the Average's most-trained form; any other skill the Average's whole-training rate.
 */
export function rateRowFor(skillId: string): RateRow {
  const own = R_AVG[skillId];
  if (own) return own;
  return SKILL_BY_ID.get(skillId)?.kind === 'form' ? R_AVG_FORM : R_AVG_ALL;
}

/** The Average's XP per hour of training in a skill, for the 365 days starting at that age (interpolated). */
export function rateAvg(skillId: string, age: number): number {
  return interp(rateRowFor(skillId), age);
}

/** cap = 4.0 x the Average's XP per hour (skill, age at the window start) x the skill's hours in the window. */
export function paceCap(skillId: string, ageAtWindowStart: number, skillHours: number): number {
  return PACE_CAP * rateAvg(skillId, ageAtWindowStart) * Math.max(0, skillHours);
}

/** How much of `wanted` may be credited, given what the window already holds. */
export function clampCredit(wanted: number, windowXp: number, cap: number): { credited: number; discarded: number } {
  const room = Math.max(0, cap - windowXp);
  const credited = Math.min(Math.max(0, wanted), room);
  return { credited, discarded: Math.max(0, wanted) - credited };
}
