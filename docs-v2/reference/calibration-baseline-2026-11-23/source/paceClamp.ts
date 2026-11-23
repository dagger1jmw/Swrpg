// The 4.0x pace clamp (progression-numbers §5, D-48, D-104): per skill, over a rolling 365-day window,
// credited XP cannot exceed 4.0 * Y_avg(age) * (share / 0.5). Pure.
import { AVERAGE_MAIN_SHARE, PACE_CAP, PACE_WINDOW_DAYS, Y_AVG } from '../data/progression.config';
import { interp } from './interp';

/** One day's credited XP and training hours for a skill. */
export interface WindowEntry {
  day: number;
  xp: number;
  hours: number;
}

export function yAvg(age: number): number {
  return interp(Y_AVG, age);
}

/** Entries still inside the window that ends on `today` (inclusive). */
export function inWindow(entries: readonly WindowEntry[], today: number): WindowEntry[] {
  return entries.filter((e) => e.day > today - PACE_WINDOW_DAYS && e.day <= today);
}

/**
 * The share for the cap (D-104): max(focus-weight share, the skill's share of the character's
 * training hours in the window, this session included).
 */
export function clampShare(focusShare: number, skillHours: number, totalHours: number): number {
  return Math.max(focusShare, totalHours > 0 ? skillHours / totalHours : 0);
}

/** cap = 4.0 * Y_avg(age at the window start) * share / 0.5. */
export function paceCap(ageAtWindowStart: number, share: number): number {
  return (PACE_CAP * yAvg(ageAtWindowStart) * share) / AVERAGE_MAIN_SHARE;
}

/** How much of `wanted` may be credited, given what the window already holds. */
export function clampCredit(wanted: number, windowXp: number, cap: number): { credited: number; discarded: number } {
  const room = Math.max(0, cap - windowXp);
  const credited = Math.min(Math.max(0, wanted), room);
  return { credited, discarded: Math.max(0, wanted) - credited };
}
