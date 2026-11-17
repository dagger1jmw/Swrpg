// World slice (architecture §2 "world"), M4 part: the log of rolled world events (D-136). Timeline
// events, factions and renown arrive in M8.
import { z } from 'zod';

export const worldEventSchema = z.object({
  id: z.string(),
  day: z.number().int(),
  kind: z.string(),
  significant: z.boolean(),
  /** Entity IDs involved (an NPC or a thread). */
  refs: z.array(z.string()),
  summary: z.string().max(200),
  /** The turn whose narration told it (null = not narrated yet). */
  narratedTurn: z.number().int().nullable(),
});
export type WorldEvent = z.infer<typeof worldEventSchema>;

export const worldSliceSchema = z.object({
  log: z.array(worldEventSchema),
  nextSeq: z.number().int().min(1),
});
export type WorldSlice = z.infer<typeof worldSliceSchema>;

export const emptyWorld = (): WorldSlice => ({ log: [], nextSeq: 1 });
