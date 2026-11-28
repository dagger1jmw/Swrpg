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
  /** The character's own Padawan or apprentice (an NPC), from Knight at 25 with the Council's approval (D-427). */
  apprenticeId: z.string().nullable().optional(),
  /** Pace-for-age milestones reached (ranks.md §4), each once. */
  milestones: z.array(z.string()).optional(),
  /** A seat on the High Council (ranks.md §1; D-430): granted on a story vacancy when the engine's checks hold. */
  councilSeat: z.boolean().optional(),
  /** Forbidden powers (D-346) a Master has permitted the character to learn (D-436). */
  powerPermissions: z.array(z.string()).optional(),
  /** Order standing lost to discovered covert learning (D-436), fading over time. */
  reputationPenalty: z.number().min(0).optional(),
  /** Covert learning the Order discovered: the power and the day (D-436). */
  covertDiscoveries: z.array(z.object({ abilityId: z.string(), day: z.number().int() })).optional(),
  /**
   * A non-Force career's service (m8-skills, D-513; ranks.md section 3a): the ladder (data/serviceRanks.ts), the rung held,
   * the day it was reached and the deeds recorded since joining. `enlisted` (m9-tune2 item 3): serving in the ranks below the ladder's
   * first (officer) rung, as a trooper or rating; a commission (servicePromotionProposed) takes the first rung. Absent = an officer.
   */
  service: z.object({ ladderId: z.string(), rung: z.number().int().min(0), since: z.number().int(), deeds: z.number().int().min(0), enlisted: z.boolean().optional() }).optional(),
  /** A training programme the character is enrolled in (m8-skills, D-513; data/trainingProgrammes.ts), to its end day. */
  programme: z.object({ id: z.string(), startDay: z.number().int(), endDay: z.number().int() }).optional(),
});
export type RanksSlice = z.infer<typeof ranksSliceSchema>;

/** v1 -> v2 (M7): no history; the rank came with the character. */
export function migrateRanksV1(old: unknown): RanksSlice {
  const o = old as { rank: string };
  return { rank: o.rank, since: null, masterId: null, trials: {}, corps: null, padawansKnighted: 0, pendingChoice: false };
}
