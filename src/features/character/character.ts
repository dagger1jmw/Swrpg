import { z } from 'zod';
import { TALENT_LEVELS } from '../../data/progression.config';
import { TALENT_DOMAINS } from '../../data/skills';

// Character (architecture §2 "character"; character-creation.md §1). v2 (M3) adds species, path,
// archetype, focus, training start age, talents and the dominant hand. Age is derived.
export const PATHS = ['jedi', 'sith', 'outsider', 'career'] as const;

export const characterSliceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  birthDay: z.number().int(),
  speciesId: z.string().min(1),
  path: z.enum(PATHS),
  archetype: z.string().min(1),
  /** Focus shares by skill id (sum to 1, D-44); the tokens $mainForm / $secondForm are resolved. */
  focusWeights: z.record(z.string(), z.number().min(0).max(1)),
  mainFormId: z.string().nullable(),
  secondFormId: z.string().nullable(),
  /** Null = never trained (an M1/M2 character migrated to an outsider with natural baselines only). */
  trainingStartAge: z.number().min(0).nullable(),
  talents: z.partialRecord(z.enum(TALENT_DOMAINS), z.enum(TALENT_LEVELS)),
  dominantHand: z.enum(['left', 'right']),
  /** The hand before a loss switched it (Q39), so restoring the limb restores it (pass 4 issue 10). Absent when never switched. */
  naturalHand: z.enum(['left', 'right']).optional(),
  /** Created with the talent limit ignored (D-116): shown on the sheet; balance is not promised. */
  unbalanced: z.boolean(),
  /**
   * Form plans (D-118): Padawan (hours of the 2 h master session + 1 h solo) and Knight+ (proportions).
   * Null for characters without lightsaber training. mainFormId / secondFormId are the plan in force.
   */
  formPlan: z.object({ padawan: z.record(z.string(), z.number().min(0)), knight: z.record(z.string(), z.number().min(0)) }).nullable(),
  /** A dev-only test start (D-178): rank and age chosen, levels from the closed form. Never set by normal creation. */
  testCharacter: z.boolean(),
  /** The start option taken (D-401 [2]): its side, and whether the character is Imperial-born. Absent for a free start. */
  start: z.object({ optionId: z.string().min(1), faction: z.string().min(1), imperialBorn: z.boolean() }).optional(),
});

export type CharacterSlice = z.infer<typeof characterSliceSchema>;
export type CharacterPathId = (typeof PATHS)[number];

/** v4 -> v5: the test-character mark (D-178), false for every earlier character. */
export function migrateCharacterV4(old: unknown): CharacterSlice {
  return { ...(old as Omit<CharacterSlice, 'testCharacter'>), testCharacter: false };
}

/** v3 -> v4: the form plan (D-118), from the old main / second form (main 2 h, second 1 h). */
export function migrateCharacterV3(old: unknown): Omit<CharacterSlice, 'testCharacter'> {
  const o = old as Omit<CharacterSlice, 'formPlan' | 'testCharacter'>;
  const plan: Record<string, number> = {};
  if (o.mainFormId) plan[o.mainFormId] = o.secondFormId ? 2 : 3;
  if (o.secondFormId) plan[o.secondFormId] = 1;
  return { ...o, formPlan: o.mainFormId ? { padawan: plan, knight: { ...plan } } : null };
}

/** v2 -> v3: the unbalanced flag (D-116), false for every earlier character. */
export function migrateCharacterV2(old: unknown): Omit<CharacterSlice, 'formPlan' | 'testCharacter'> {
  return { ...(old as Omit<CharacterSlice, 'unbalanced' | 'formPlan' | 'testCharacter'>), unbalanced: false };
}

/** v1 (M1/M2) -> v2: a Human outsider with no training (M3 plan; D-107). */
export function migrateCharacterV1(old: unknown): Omit<CharacterSlice, 'unbalanced' | 'formPlan' | 'testCharacter'> {
  const o = old as { id: string; name: string; birthDay: number };
  return {
    id: o.id,
    name: o.name,
    birthDay: o.birthDay,
    speciesId: 'human',
    path: 'outsider',
    archetype: 'jediGuardian',
    focusWeights: {},
    mainFormId: null,
    secondFormId: null,
    trainingStartAge: null,
    talents: {},
    dominantHand: 'right',
  };
}
