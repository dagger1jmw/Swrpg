// How much of a full training day an NPC still keeps, by Human-equivalent age (Jared, 2026-11-25; D-497): office, teaching,
// councils and a slower life take the rest from about 50 on. Natural Willpower grows on it too (D-498).
// NPCs only; the player's hours are the player's. Every number is invented, set against the canon sheets past 55 (docs-v2/reports/m8-calibration-fix4.md).
export const NPC_TRAINING_HOURS: readonly (readonly [number, number])[] = [[50, 1], [60, 0.5], [70, 0.25], [80, 0.15]];
/**
 * NPCs without a sheet (Jared, D-506): every trained skill follows the same day by years trained, read from the NPC's own start
 * (its Human-equivalent age then, plus the real years since), and stops by 90 (invented). A Human is where it was until 80; the
 * long-lived no longer bank decades at their slow Human-equivalent age.
 */
export const NPC_TRAINING_HOURS_UNSHEETED: readonly (readonly [number, number])[] = [...NPC_TRAINING_HOURS, [90, 0]];

/**
 * Long life counts for the mind (Jared, D-507): past the stop, a long-lived NPC without a sheet keeps gaining experience in its
 * mental and social stats only, by real years. Each drifts toward `target` (the middle of Master, 61-80), `tau` years to cover
 * about 63% of the way, never more than `cap` in all and never down. Only a skill it already has at `from` or more, so nothing
 * never practised appears. Long-lived: a lifespan over `lifespan` (the Human's is 100). Every number invented.
 */
export const LIFE_EXPERIENCE = {
  skills: ['intelligence', 'charisma', 'profession', 'investigation', 'tactics', 'medicine'] as readonly string[],
  target: 75,
  tau: 150,
  cap: 30,
  from: 20,
  lifespan: 150,
  /** The training age at which the training day ends (the curve's last point). */
  stopAt: 90,
} as const;

/**
 * Willpower's training gains stop for an NPC without a sheet once it has trained as many years as a Human of its path has
 * by this age (Jared, D-499, D-500: years trained, whatever the species; a sheet's Willpower is its own).
 */
export const NPC_WILLPOWER_STOP_AGE = 50;

/**
 * An NPC's Willpower training pace against its path's measured one, for NPCs without a sheet (Jared, D-500; invented): the
 * sheeted Inquisitors are far above their generated line.
 */
export const NPC_WILLPOWER_PACE: Readonly<Record<string, number>> = { sithInquisitor: 1.4 };
