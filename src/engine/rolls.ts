// Basic roll, checks and the roll card (rolls.md §1, §2, §7; D-34). Pure; randomness from the
// seeded RNG. There is no tier-gap bonus anywhere: 1 modifier point = 10 levels.
import {
  CHECK_RULES,
  DIFFICULTIES,
  DIFFICULTY_RATING,
  FAILURE_GRADES,
  SUCCESS_GRADES,
  type ActionType,
  type CheckGrade,
  type Difficulty,
} from '../data/checks.config';
import { rollD20, type RngState } from './rng';

export interface Modifier {
  source: string;
  value: number;
}

/** Inputs to the effective-level formula (rolls.md §1). */
export interface LevelInputs {
  level: number;
  woundPenalty: number;
  rust: number;
  vitalitySpent: boolean;
  /** e(f_phys) from the progression spec §3; 1 = rested. */
  fatigueEfficiency: number;
}

export function effectiveLevel(i: LevelInputs): number {
  return (
    i.level *
    (1 - i.woundPenalty) *
    (1 - i.rust) *
    (i.vitalitySpent ? 0.9 : 1) *
    (1 - 0.25 * (1 - i.fatigueEfficiency))
  );
}

export const NATURAL_BONUS = 5;

export interface BasicRoll {
  d20: number;
  natural: 'nat20' | 'nat1' | null;
  naturalBonus: number;
  effectiveLevel: number;
  levelBonus: number;
  modifiers: Modifier[];
  total: number;
}

/** Total = d20 + effective level / 10 + modifiers; natural 20 +5, natural 1 -5. */
export function basicRoll(rng: RngState, effLevel: number, modifiers: readonly Modifier[]): [BasicRoll, RngState] {
  const [d20, next] = rollD20(rng);
  const natural = d20 === 20 ? 'nat20' : d20 === 1 ? 'nat1' : null;
  const naturalBonus = natural === 'nat20' ? NATURAL_BONUS : natural === 'nat1' ? -NATURAL_BONUS : 0;
  const levelBonus = effLevel / 10;
  const modSum = modifiers.reduce((a, m) => a + m.value, 0);
  return [
    {
      d20,
      natural,
      naturalBonus,
      effectiveLevel: effLevel,
      levelBonus,
      modifiers: [...modifiers],
      total: d20 + naturalBonus + levelBonus + modSum,
    },
    next,
  ];
}

/** DC = 10 + difficulty rating / 10 (rating 40 -> 14; 80 -> 18). */
export function dcForRating(rating: number): number {
  return 10 + rating / 10;
}

export function gradeMargin(margin: number): CheckGrade {
  if (margin >= 0) {
    for (const [min, grade] of SUCCESS_GRADES) if (margin >= min) return grade;
    return 'narrow success';
  }
  for (const [min, grade] of FAILURE_GRADES) if (-margin >= min) return grade;
  return 'narrow failure';
}

/** The roll card (rolls.md §7): dice, bonuses, each modifier with its source, margin, outcome. */
export interface CheckCard extends BasicRoll {
  kind: 'check';
  label: string;
  skillId: string | null;
  difficulty: Difficulty;
  rating: number;
  dc: number;
  margin: number;
  success: boolean;
  grade: CheckGrade;
  notes: string[];
}

export interface CheckInput {
  label: string;
  skillId: string | null;
  levelInputs: LevelInputs;
  modifiers: readonly Modifier[];
  difficulty: Difficulty;
  notes?: readonly string[];
}

export function check(rng: RngState, input: CheckInput): [CheckCard, RngState] {
  return checkRating(rng, { ...input, rating: DIFFICULTY_RATING[input.difficulty] });
}

/** A check against any rating (a blockade's own, D-469); the card names the nearest difficulty. */
export function checkRating(rng: RngState, input: Omit<CheckInput, 'difficulty'> & { rating: number; difficulty?: Difficulty }): [CheckCard, RngState] {
  const eff = effectiveLevel(input.levelInputs);
  const [roll, next] = basicRoll(rng, eff, input.modifiers);
  const { rating } = input;
  const nearest = [...DIFFICULTIES].sort((a, b) => Math.abs(DIFFICULTY_RATING[a] - rating) - Math.abs(DIFFICULTY_RATING[b] - rating))[0]!;
  const dc = dcForRating(rating);
  const margin = roll.total - dc;
  return [
    {
      ...roll,
      kind: 'check',
      label: input.label,
      skillId: input.skillId,
      difficulty: input.difficulty ?? nearest,
      rating,
      dc,
      margin,
      success: margin >= 0,
      grade: gradeMargin(margin),
      notes: [...(input.notes ?? [])],
    },
    next,
  ];
}

// ---- Engine-decided checks (D-37) ----

export function isCheckRequired(actionType: ActionType, targetCount: number): boolean {
  const rule = CHECK_RULES[actionType].required;
  return rule === 'always' || (rule === 'withTargets' && targetCount > 0);
}

/** Clamps the AI's proposal to the action type's range; a missing proposal uses the default. */
export function clampDifficulty(
  actionType: ActionType,
  proposed: Difficulty | undefined,
): { difficulty: Difficulty; clampedFrom?: Difficulty } {
  const rule = CHECK_RULES[actionType];
  if (proposed === undefined) return { difficulty: rule.default };
  const idx = DIFFICULTIES.indexOf(proposed);
  const lo = DIFFICULTIES.indexOf(rule.min);
  const hi = DIFFICULTIES.indexOf(rule.max);
  const clamped = DIFFICULTIES[Math.min(hi, Math.max(lo, idx))] ?? rule.default;
  return clamped === proposed ? { difficulty: clamped } : { difficulty: clamped, clampedFrom: proposed };
}
