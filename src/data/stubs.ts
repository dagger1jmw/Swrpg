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

/** Skill rust 0..0.20 (rolls.md §1). Replaced in M3 (progression). */
export function stubRust(_skillId: string | undefined): number {
  return 0;
}

/** Fatigue efficiency e(f_phys) (progression-numbers §3). Replaced in M3. */
export function stubFatigueEfficiency(): number {
  return 1;
}

/** Skill level for M1-M2 checks: the minimal character has no computed skills. Replaced in M3. */
export function stubSkillLevel(_skillId: string | undefined): number {
  return 0;
}

/**
 * D-70: until duels exist (M5), a fight intent resolves as one engine check against the
 * clamped difficulty. Replaced in M5 by rolls.md §3 duels.
 */
export const STUB_FIGHT_AS_SINGLE_CHECK = true;
