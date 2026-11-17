// Pacing levels and time ranges (architecture §8, D-19). Starting defaults approved by Jared.

export const PACING_LEVELS = ['moment', 'scene', 'montage', 'timeSkip'] as const;
export type PacingLevel = (typeof PACING_LEVELS)[number];

/** Story-turn levels (moment and scene); montage and timeSkip run the routine day loop (M4). */
export const M1_PACING_LEVELS = ['moment', 'scene'] as const satisfies readonly PacingLevel[];
export const JUMP_LEVELS = ['montage', 'timeSkip'] as const satisfies readonly PacingLevel[];
export type JumpLevel = (typeof JUMP_LEVELS)[number];

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

/**
 * Settling-in and staleness (architecture §8, D-19; derived by selectors, D-138). Settling-in: the first
 * `settlingInDays` after arriving at a major place for the first time (campaign start counts): moment is
 * favored and no jump is suggested. Staleness: `staleDays` at one place with no new NPC, thread or place.
 */
export const SETTLING = { settlingInDays: 14, staleDays: 21 } as const;

/** The code-appended "Skip ahead" choice (D-18, D-138): this many days, or up to the day before the nearest deadline. */
export const SKIP_AHEAD = { days: 14, minDays: 1 } as const;
