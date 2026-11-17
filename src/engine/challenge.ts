// Challenge factor and drill choice (progression-numbers §4, training-routines §3). Pure.
import { DRILL_RATINGS } from '../data/activities';
import { CHALLENGE_ANCHORS, DRILL_GAP } from '../data/progression.config';
import { interp } from './interp';

/** gap = drill rating - skill level; continuous, flat outside the anchors. */
export function challengeFactor(gap: number): number {
  return interp(CHALLENGE_ANCHORS, gap);
}

export type Effort = 'easy' | 'standard' | 'push';

/**
 * Picks the drill rating (training-routines §3): among the available ratings, those with a gap
 * in the effort's band (standard / easy -10..+10, push +10..+20), the one with the highest
 * challenge factor (the higher rating on a tie). With none in the band, the best factor overall.
 */
export function pickDrillRating(level: number, effort: Effort, available: readonly number[] = DRILL_RATINGS): number {
  const [lo, hi] = DRILL_GAP[effort];
  const pool = available.length ? available : [DRILL_RATINGS[0]];
  const best = (ratings: readonly number[]): number | null => {
    let pick: number | null = null;
    let f = -1;
    for (const r of ratings) {
      const c = challengeFactor(r - level);
      if (c > f || (c === f && pick !== null && r > pick)) {
        f = c;
        pick = r;
      }
    }
    return pick;
  };
  const inBand = pool.filter((r) => r - level >= lo && r - level <= hi);
  return best(inBand) ?? best(pool) ?? DRILL_RATINGS[0];
}
