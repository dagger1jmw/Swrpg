// Ranks slice (architecture §2 "ranks"; ranks.md; M7 §15, D-424). v1 (M3) held only the rank fixed at creation; v2 adds
// the rank's start day, the master, the trial records, the Service Corps assignment and the Padawans trained.
import { z } from 'zod';
import { SERVICE_CORPS } from '../../data/ranks.config';

const trialRecordSchema = z.object({ passed: z.boolean(), fails: z.number().int().min(0), lastDay: z.number().int().nullable() });

export const ranksSliceSchema = z.object({
  rank: z.string().min(1),
  /** The day the rank was granted; null when it came with the character (creation). */
  since: z.number().int().nullable(),
  /** The master (an NPC ref), set by the player or the engine; never by the AI (rank-gating, D-33). */
  masterId: z.string().nullable(),
  /** Trial records by trial id ('initiate' and the five Knight Trials). */
  trials: z.record(z.string(), trialRecordSchema),
  /** The Council of Reassignment's assignment (ranks.md §1), or null. */
  corps: z.enum(SERVICE_CORPS).nullable(),
  /** Padawans the character has trained to Knighthood (a Master requirement). */
  padawansKnighted: z.number().int().min(0),
  /** A third failed trial awaits the player's choice (ranks.md §1). */
  pendingChoice: z.boolean(),
});
export type RanksSlice = z.infer<typeof ranksSliceSchema>;

/** v1 -> v2 (M7): no history; the rank came with the character. */
export function migrateRanksV1(old: unknown): RanksSlice {
  const o = old as { rank: string };
  return { rank: o.rank, since: null, masterId: null, trials: {}, corps: null, padawansKnighted: 0, pendingChoice: false };
}
