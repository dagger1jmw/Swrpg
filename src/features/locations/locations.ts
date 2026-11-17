import { z } from 'zod';
import { LIMITS, LOCATION_KINDS } from '../../data/entities.config';

// "major" is derived from kind via CHAPTER_PLACE_KINDS (a selector), never stored (D-84).
export const locationSchema = z.object({
  id: z.string().regex(/^loc:/),
  name: z.string().min(1).max(LIMITS.name),
  aliases: z.array(z.string().max(LIMITS.name)),
  kind: z.enum(LOCATION_KINDS),
  region: z.string().max(LIMITS.region),
  parentId: z.string().nullable(),
  description: z.string().max(LIMITS.description),
  /** First day the character was there; null for places only mentioned. */
  firstVisitDay: z.number().int().nullable(),
  introducedTurn: z.number().int().min(0),
});

export const locationsSliceSchema = z.object({
  byId: z.record(z.string(), locationSchema),
  currentId: z.string().nullable(),
  /** Day the character arrived at the current place (staleness, architecture §8; M4, v2). */
  currentSinceDay: z.number().int().nullable(),
});

export type Location = z.infer<typeof locationSchema>;
export type LocationsSlice = z.infer<typeof locationsSliceSchema>;
