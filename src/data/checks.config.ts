// Engine-decided checks (D-37). Whether a check is required comes from the intent's actionType
// and targets, never from the AI. The AI may only propose a difficulty, clamped per action type.

export const DIFFICULTIES = ['trivial', 'easy', 'moderate', 'hard', 'extreme'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** architecture §3: trivial / easy / moderate / hard / extreme -> rating 10 / 30 / 50 / 70 / 90. */
export const DIFFICULTY_RATING: Record<Difficulty, number> = {
  trivial: 10,
  easy: 30,
  moderate: 50,
  hard: 70,
  extreme: 90,
};

export const ACTION_TYPES = [
  'dialogue',
  'move',
  'travel',
  'train',
  'study',
  'fight',
  'forceUse',
  'investigate',
  'heal',
  'rest',
  'sleep',
  'other',
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

/**
 * never: no check. always: one check. withTargets: a check only when the intent targets a known
 * entity (M1 has no entity IDs yet, so dialogue never rolls until M2).
 */
export type CheckRequirement = 'never' | 'always' | 'withTargets';

export interface CheckRule {
  required: CheckRequirement;
  min: Difficulty;
  max: Difficulty;
  default: Difficulty;
  /** Stub or milestone note this rule depends on, shown on the roll card. */
  note?: string;
}

export const CHECK_RULES: Record<ActionType, CheckRule> = {
  dialogue: { required: 'withTargets', min: 'trivial', max: 'hard', default: 'easy' },
  move: { required: 'never', min: 'trivial', max: 'hard', default: 'easy' },
  travel: { required: 'never', min: 'trivial', max: 'hard', default: 'easy' },
  // Activities resolve through computeXp in M3, not a check.
  train: { required: 'never', min: 'trivial', max: 'extreme', default: 'moderate' },
  study: { required: 'never', min: 'trivial', max: 'extreme', default: 'moderate' },
  // M5: fights are duels (rolls.md §3), not a check; the D-70 single-check stub is gone.
  fight: { required: 'never', min: 'easy', max: 'extreme', default: 'moderate' },
  forceUse: { required: 'always', min: 'easy', max: 'extreme', default: 'moderate' },
  investigate: { required: 'always', min: 'trivial', max: 'extreme', default: 'moderate' },
  // Healing resolves with the health rules in M5.
  heal: { required: 'never', min: 'easy', max: 'extreme', default: 'moderate' },
  rest: { required: 'never', min: 'trivial', max: 'trivial', default: 'trivial' },
  sleep: { required: 'never', min: 'trivial', max: 'trivial', default: 'trivial' },
  other: { required: 'never', min: 'trivial', max: 'hard', default: 'easy' },
};

/**
 * D-69: check grades. rolls.md §2 says margins grade the result like §3; the success bands reuse
 * the §3 strike bands (4 / 8 / 12 / 16); failures mirror them on the shortfall (-1..-3 narrow,
 * -4..-7 clear, -8 or worse bad). [minimum |margin|, grade], highest first.
 */
export const SUCCESS_GRADES = [
  [16, 'exceptional success'],
  [12, 'decisive success'],
  [8, 'strong success'],
  [4, 'clear success'],
  [0, 'narrow success'],
] as const;
export const FAILURE_GRADES = [
  [8, 'bad failure'],
  [4, 'clear failure'],
  [0, 'narrow failure'],
] as const;
export type CheckGrade = (typeof SUCCESS_GRADES)[number][1] | (typeof FAILURE_GRADES)[number][1];
