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

/**
 * Order instruction without a named NPC (D-124; architecture §15). Temple instructors teach as a
 * teacher this many levels ahead of the student in that skill (teacher factor x1.05, the D-40
 * calibration value); a Padawan's master with no NPC named in the routine teaches 30 levels ahead
 * (x1.15). Temple peers are an even partner (x1.00, the D-40 "fill"). Teacher aptitude is 0. Replaced
 * by NPC generation (M5) and masters (M7).
 */
export const STUB_INSTRUCTOR_LEAD = 10;
export const STUB_MASTER_LEAD = 30;
export const STUB_TEACHER_APTITUDE = 0;

/** Combat in the lifetime test (architecture §15): scripted fights through computeCombatXp until duels (M5). */
export const STUB_SCRIPTED_COMBAT = true;

// ---- Stubs added in M5 (D-143) ----

/** Weapons and armor come from path, archetype and role (src/data/weapons.ts) until the equipment spec. Replaced in M8. */
export const STUB_WEAPONS = true;

/** Dual blades for Jar'Kai (D-122): nobody has two sabers until items exist, so Jar'Kai cannot be picked in a duel. Replaced in M8. */
export const STUB_DUAL_BLADES = false;

/** The player's ShatterSense talent pick and the shatterpoint skill come with the Force catalog. Replaced in M6. */
export const STUB_PLAYER_SHATTERSENSE = false;

/** Light-side philosophy for Force insight's +0.10 (rolls §6): read from the path (Jedi = light) until alignment. Replaced in M6. */
export function stubLightPhilosophy(path: string): boolean {
  return path === 'jedi';
}

/**
 * Prosthetic quality after a severed limb until items (D-143): a quality cybernetic for the Jedi, the Sith and
 * Republic or Imperial soldiers (the archetypes the Order, the Empire or the military would fit), a basic
 * prosthetic for everyone else. NPCs use their faction. Replaced in M8.
 */
export function stubProsthetic(input: { path?: string; archetype?: string; faction?: string }): 'qualityCybernetic' | 'basicProsthetic' {
  if (input.path === 'jedi' || input.path === 'sith') return 'qualityCybernetic';
  if (input.archetype === 'soldier') return 'qualityCybernetic';
  if (input.faction !== undefined && ['jediOrder', 'sith', 'sithEmpire', 'republic'].includes(input.faction)) return 'qualityCybernetic';
  return 'basicProsthetic';
}
