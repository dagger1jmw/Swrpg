// Rust (progression-numbers §13): a temporary penalty on unused skills; XP is never lost.
// Effective level = level * (1 - R). Pure.
import { RUST, RUST_REMOVAL_PER_HOUR, type RustRule } from '../data/progression.config';
import type { RustRow } from '../data/skills';

/** Rate per 30 days and cap for a row at a level (technique / Force scale from level 40 to 80+). */
export function rustRule(row: RustRow, level: number): { graceDays: number; rate: number; cap: number } {
  const r: RustRule = RUST[row];
  if (!r.deep) return { graceDays: r.graceDays, rate: r.rate, cap: r.cap };
  const t = Math.min(1, Math.max(0, (level - r.deep.fromLevel) / (r.deep.toLevel - r.deep.fromLevel)));
  return { graceDays: r.graceDays, rate: r.rate + (r.deep.rate - r.rate) * t, cap: r.cap + (r.deep.cap - r.cap) * t };
}

/** One more day unused: rust grows by rate/30 once the day count is past the grace period. */
export function rustAfterDay(current: number, row: RustRow, level: number, daysUnused: number): number {
  const rule = rustRule(row, level);
  if (daysUnused <= rule.graceDays) return current;
  return Math.min(rule.cap, current + rule.rate / 30);
}

/** Rust after N days unused from zero (reference values, §13). */
export function rustAfterUnused(row: RustRow, level: number, days: number): number {
  const rule = rustRule(row, level);
  return Math.min(rule.cap, (rule.rate * Math.max(0, days - rule.graceDays)) / 30);
}

/** Each effective hour of practice removes 0.5 percentage points. */
export function removeRust(current: number, effectiveHours: number): number {
  return Math.max(0, current - RUST_REMOVAL_PER_HOUR * effectiveHours);
}
