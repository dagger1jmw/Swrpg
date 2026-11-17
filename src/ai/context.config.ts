// Request sections and token caps (architecture §5). Montage and timeSkip change them in M4.

export type SectionName = 'gmRules' | 'state' | 'recentTurns' | 'memory' | 'lore' | 'arc';

export const CONTEXT_CAPS: Record<SectionName, number> = {
  gmRules: 5000,
  state: 1500,
  recentTurns: 8000,
  memory: 4000,
  lore: 3000,
  arc: 1000,
};

/** "The newest 10-15 raw turns that fit" (architecture §5, §7). */
export const MAX_RAW_TURNS = 15;

/** Starting characters-per-token ratio before calibration (D-26). */
export const DEFAULT_CHARS_PER_TOKEN = 4;

/** Calibration (D-86): new ratio = old x (1 - weight) + observed x weight, clamped to the range. */
export const RATIO_CALIBRATION = { weight: 0.3, min: 2, max: 8 } as const;

/** Summary call input: the chapter's turns, clipped evenly to fit (light model). */
export const SUMMARY_INPUT_CAP_TOKENS = 16_000;

/** Full request texts kept in memory for the debug view (not saved, D-87). */
export const DEBUG_REQUESTS_KEPT = 10;
