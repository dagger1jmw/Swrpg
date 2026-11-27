import { z } from 'zod';
import { LIMITS } from '../../data/entities.config';

export const threadSchema = z.object({
  id: z.string().regex(/^thread:/),
  title: z.string().min(1).max(LIMITS.threadTitle),
  stakes: z.string().max(LIMITS.threadStakes),
  status: z.enum(['open', 'resolved', 'failed']),
  /** Engine-mapped from the AI's deadlineHint; never an AI date. */
  deadlineDay: z.number().int().nullable(),
  /** Engine-owned (threadEscalated arrives with the thread day hook in M4). */
  escalation: z.number().int().min(0).max(3),
  notes: z.array(z.string().max(LIMITS.note)),
  entityRefs: z.array(z.string()),
  openedDay: z.number().int(),
  openedTurn: z.number().int().min(0),
  closedDay: z.number().int().nullable(),
  /** The AI's last progress or outcome note turn (recency in retrieval). */
  lastTurn: z.number().int().min(0),
});

export const threadsSliceSchema = z.object({
  byId: z.record(z.string(), threadSchema),
  /** The cold store (opt-2 H2): older notes of threads closed a year, by thread id. Absent = none. Never sent to the narrator. */
  cold: z.record(z.string(), z.array(z.string().max(LIMITS.note))).optional(),
});

export type Thread = z.infer<typeof threadSchema>;
export type ThreadsSlice = z.infer<typeof threadsSliceSchema>;
