// Pacing levels and time ranges (architecture §8, D-19). Starting defaults approved by Jared.

export const PACING_LEVELS = ['moment', 'scene', 'montage', 'timeSkip'] as const;
export type PacingLevel = (typeof PACING_LEVELS)[number];

/** Levels playable before M4 (montage and timeSkip need the day loop and routines). */
export const M1_PACING_LEVELS = ['moment', 'scene'] as const satisfies readonly PacingLevel[];

const MIN = 60;
const HOUR = 3600;
const DAY = 86_400;
const YEAR = 368 * DAY;

/** Time per turn, in seconds, per level. */
export const PACING_RANGES: Record<PacingLevel, { min: number; max: number }> = {
  moment: { min: 5, max: 15 * MIN },
  scene: { min: 15 * MIN, max: 12 * HOUR },
  montage: { min: 1 * DAY, max: 120 * DAY },
  timeSkip: { min: 7 * DAY, max: 10 * YEAR },
};

/** Narrative output cap per level, in tokens (architecture §8). */
export const PACING_OUTPUT_CAPS: Record<PacingLevel, number> = {
  moment: 700,
  scene: 1000,
  montage: 1200,
  timeSkip: 1200,
};

export const DEFAULT_PACING: PacingLevel = 'moment';
