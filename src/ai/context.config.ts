// Request sections and token caps (architecture §5). Montage and timeSkip change them in M4.

export type SectionName = 'gmRules' | 'world' | 'state' | 'recentTurns' | 'memory' | 'lore' | 'arc';

export const CONTEXT_CAPS: Record<SectionName, number> = {
  gmRules: 5000,
  /**
   * The WORLD block (opt-1 C1, D-530): the day-stable lines that left the state block (the Order's seat, rank names, leaders and
   * control, canon figures here, the era rules of the character's side, closed worlds). Reported, never cut; invented.
   */
  world: 1000,
  state: 1500,
  recentTurns: 8000,
  memory: 4000,
  lore: 3000,
  arc: 1000,
};

/** "The newest 10-15 raw turns that fit" (architecture §5, §7). */
export const MAX_RAW_TURNS = 15;

/**
 * One turn's narration in the recent-turns history is clipped to this many characters (D-209): a code-written fallback
 * is a short summary now, but saves from before D-209 hold the full engine log there (39,541 characters in combat
 * pass 2), and no single turn should crowd the story out of the prompt.
 */
export const HISTORY_NARRATIVE_MAX_CHARS = 2400;

/** Starting characters-per-token ratio before calibration (D-26). */
export const DEFAULT_CHARS_PER_TOKEN = 4;

/** Calibration (D-86): new ratio = old x (1 - weight) + observed x weight, clamped to the range. */
export const RATIO_CALIBRATION = { weight: 0.3, min: 2, max: 8 } as const;

/** Summary call input: the chapter's turns, clipped evenly to fit (light model). */
export const SUMMARY_INPUT_CAP_TOKENS = 16_000;

/** Full request texts kept in memory for the debug view (not saved, D-87). */
export const DEBUG_REQUESTS_KEPT = 10;

/**
 * Caps for a montage or time-skip narration (architecture §5: jumps shrink recentTurns to 4,000 and raise
 * memory). The report itself goes in the uncapped resolved block, clipped to JUMP_REPORT_MAX_EVENTS.
 */
export const JUMP_CAPS: Record<SectionName, number> = { ...CONTEXT_CAPS, recentTurns: 4000, memory: 6000 };
export const JUMP_REPORT_MAX_EVENTS = 20;
export const JUMP_REPORT_MAX_SKILLS = 12;

/**
 * The history slides in steps (opt-1 C2, D-530): the oldest turn kept is always one whose number is 1 more than a multiple of this,
 * so the same turns open the history for several calls in a row (Gemini's implicit cache discounts a repeated start of the request).
 * The cost is up to STEP - 1 fewer turns than fit. Measured (reports/opt-1.md C2): step 2 keeps the same start on 50% of calls for
 * about 270 history tokens (3.5%), step 4 on 75% for about 840 (11%). 2 while Jared plays on the free tier, where Flash-Lite has no
 * cache discount; 4 is the choice on a paid tier. Invented.
 */
export const HISTORY_STEP = 2;
