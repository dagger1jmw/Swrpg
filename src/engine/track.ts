// The core roll at every scale (D-505; docs-v2/spec/combat-scales.md section A): the rolls.md §1 roll, opposed, and the
// duel's advantage track. Pure; seeded RNG. The duel itself keeps its own code (engine/duel.ts).
import { ADVANTAGE_MAX, BUILD_UP, STRIKE_AT, STRIKE_MIN_MARGIN, STRIKE_QUALITY, type HitQuality } from '../data/combat.config';
import { SCALE_MISSED_STRIKE_STEP } from '../data/shipCombat.config';
import { clamp } from './interp';
import { basicRoll, type BasicRoll, type Modifier } from './rolls';
import type { RngState } from './rng';

/** One side of an opposed roll: an effective level (already past wounds and fatigue) and its modifiers. */
export interface Contestant {
  level: number;
  modifiers: readonly Modifier[];
}

export interface Contest {
  a: BasicRoll;
  b: BasicRoll;
  /** A's total less B's, to the nearest whole point (D-156: a fraction of a level never tips a band edge). */
  margin: number;
}

export function contest(rng: RngState, a: Contestant, b: Contestant): [Contest, RngState] {
  const [ra, r1] = basicRoll(rng, a.level, a.modifiers);
  const [rb, r2] = basicRoll(r1, b.level, b.modifiers);
  return [{ a: ra, b: rb, margin: Math.round(ra.total - rb.total) }, r2];
}

export const clampTrack = (t: number): number => clamp(t, -ADVANTAGE_MAX, ADVANTAGE_MAX);

/** A build-up roll: |m| <= 1 drifts to 0; 2-5 one step, 6-9 two, 10+ three, toward the winner (positive: A). */
export function moveTrack(track: number, margin: number): number {
  const size = Math.abs(margin);
  if (size <= BUILD_UP.tieWithin) return track === 0 ? 0 : track - Math.sign(track);
  const step = BUILD_UP.steps.find(([min]) => size >= min)?.[1] ?? 0;
  return clampTrack(track + Math.sign(margin) * step);
}

/** The side with the strike. */
export const striker = (track: number): 'A' | 'B' | null => (track >= STRIKE_AT ? 'A' : track <= -STRIKE_AT ? 'B' : null);

/** A strike's margin, from the striker's side of an A-B margin. */
export const strikeMargin = (side: 'A' | 'B', margin: number): number => (side === 'A' ? margin : -margin);

export const strikeLands = (margin: number): boolean => margin >= STRIKE_MIN_MARGIN;

/** Where the track goes after a strike: back to 0 when it landed, a few steps toward it when it did not. */
export function afterStrike(track: number, landed: boolean): number {
  if (landed) return 0;
  return track - Math.sign(track) * Math.min(Math.abs(track), SCALE_MISSED_STRIKE_STEP);
}

/** 4-7 graze, 8-11 solid, 12-15 clean, 16+ critical; null below 4. */
export const hitQuality = (margin: number): HitQuality | null => STRIKE_QUALITY.find(([min]) => margin >= min)?.[1] ?? null;
