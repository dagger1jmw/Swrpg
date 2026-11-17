// Named stubs (architecture §15, D-56). Each holds a fixed value until the named milestone
// replaces it. tests/data/stubs.test.ts asserts each value until then.

/** Wound penalty in the effective-level formula (rolls.md §1). Replaced in M5 (health). */
export function stubWoundPenalty(): number {
  return 0;
}

/** Whether Vitality is spent (x0.9 in rolls.md §1). Replaced in M5 (health). */
export function stubVitalitySpent(): boolean {
  return false;
}

/**
 * D-70: until duels exist (M5), a fight intent resolves as one engine check against the
 * clamped difficulty. Replaced in M5 by rolls.md §3 duels.
 */
export const STUB_FIGHT_AS_SINGLE_CHECK = true;

/**
 * Teacher levels (architecture §15, D-56): the Average profile's closed-form level at the teacher's
 * age, with no per-NPC variance. The computation is in src/features/progression/training.ts
 * (stubTeacherLevel); these are its inputs. Replaced in M5 (NPC generation).
 */
export const STUB_TEACHER_ARCHETYPE = 'jediGuardian';
export const STUB_TEACHER_START_AGE = 4;

/** Alignment multiplier in M (D-56). Replaced in M6. */
export const STUB_ALIGNMENT_MULT = 1.0;

/** Dark pressure for state-of-mind effects (D-56: D = 0). Replaced in M6. */
export const STUB_DARK_PRESSURE = 0;
