// Typed multi-step sequences in combat (Jared, D-143). The intent returns `sequence: [step]`; the engine
// resolves the steps in order as exchanges with the opponent rolling every step, then one narration call
// covers the whole sequence. Every number here is tunable.

export const SEQUENCE_STEP_KINDS = ['stance', 'tactic', 'maneuver', 'forceAction', 'strike'] as const;

/** The intent schema accepts at most this many steps; the engine truncates to the character's cap. */
export const SEQUENCE_SCHEMA_MAX = 5;

/** Length cap, applied in this order: rank and skill base, then stealth, then fatigue; never below `min`. */
export const SEQUENCE_CAP = {
  /**
   * Base by rank (Jared: Padawan 2, Knight 3, Master 4). Initiates and acolytes get 1 (a single action).
   * Careers and outsiders have no ladder; they get 2 (D-143 design default).
   */
  byRank: { initiate: 1, acolyte: 1, padawan: 2, apprentice: 2, knight: 3, lord: 3, master: 4, none: 2, career: 2 } as Readonly<Record<string, number>>,
  /** 5 when the main form and the Force skill used are both at least this level. */
  masteryLevel: 80,
  masteryCap: 5,
  /** Starting while hidden (a won perception contest or surprise). */
  stealthBonus: 1,
  /** High mental fatigue: f_mental at or above this. */
  highMentalFraction: 0.8,
  highMentalPenalty: 1,
  /** Exhausted / past the limit: Spent, or a fatigue or Force meter above 1.0. */
  exhaustedPenalty: 2,
  min: 1,
} as const;

/** Chain bonuses (to the next step's roll, d20 points). */
export const SEQUENCE_CHAIN = {
  /** Building pressure: +1 per successful step, up to this for the whole chain. */
  pressurePerStep: 1,
  pressureMax: 3,
  /** A Force-thrown object and a strike landing together split the defense. */
  splitDefense: 2,
  /** Fairness: no single step may succeed more than this often against an equal opponent at the max stacked bonus. */
  maxStepSuccess: 0.9,
} as const;

/** Opponent adaptation: +1 defense per earlier use of the same pattern (Force ability + maneuver) this fight. */
export const SEQUENCE_ADAPTATION = { perUse: 1, max: 3 } as const;
