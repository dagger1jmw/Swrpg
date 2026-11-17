import { z } from 'zod';

// Minimal M1 character (architecture §15). Species, path, archetype, talents and the rest arrive
// with computed creation in M3, through a migration.
export const characterSliceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  birthDay: z.number().int(),
});

export type CharacterSlice = z.infer<typeof characterSliceSchema>;
