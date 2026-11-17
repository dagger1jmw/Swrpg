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
  /** Created with the talent limit ignored (D-116): shown on the sheet; balance is not promised. */
  unbalanced: z.boolean(),
});

export type CharacterSlice = z.infer<typeof characterSliceSchema>;
export type CharacterPathId = (typeof PATHS)[number];

/** v2 -> v3: the unbalanced flag (D-116), false for every earlier character. */
export function migrateCharacterV2(old: unknown): CharacterSlice {
  return { ...(old as Omit<CharacterSlice, 'unbalanced'>), unbalanced: false };
}

/** v1 (M1/M2) -> v2: a Human outsider with no training (M3 plan; D-107). */
export function migrateCharacterV1(old: unknown): Omit<CharacterSlice, 'unbalanced'> {
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
