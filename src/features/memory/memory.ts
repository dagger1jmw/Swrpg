import { z } from 'zod';
import { MEMORY_LIMITS } from '../../data/memory.config';

export const factSchema = z.object({
  id: z.string().regex(/^fact:/),
  aboutRef: z.string(),
  text: z.string().max(MEMORY_LIMITS.fact),
  turn: z.number().int().min(0),
  day: z.number().int(),
  importance: z.enum(['minor', 'major']),
});

const range = z.tuple([z.number().int(), z.number().int()]);

export const chapterSchema = z.object({
  id: z.string().regex(/^chapter:/),
  /** Turn IDs (inclusive), never array slices (legacy story-memory bug 1). */
  turnRange: range,
  dayRange: range,
  locationIds: z.array(z.string()),
  entityIds: z.array(z.string()),
  threadIds: z.array(z.string()),
  closeReason: z.string(),
  summary: z.string().max(MEMORY_LIMITS.chapterSummary).nullable(),
  status: z.enum(['closed', 'summaryPending']),
});

export const reviewItemSchema = z.object({
  id: z.string().regex(/^review:/),
  name: z.string(),
  turn: z.number().int().min(0),
  context: z.string().max(MEMORY_LIMITS.reviewContext),
  status: z.enum(['open', 'mapped', 'created', 'dismissed']),
  entityId: z.string().nullable(),
});

export const memorySliceSchema = z.object({
  facts: z.array(factSchema),
  /** Only player pins are stored; engine pins are derived (D-46). */
  playerPins: z.array(z.string()),
  chapters: z.array(chapterSchema),
  arc: z.object({ text: z.string().max(MEMORY_LIMITS.arc), atChapter: z.string() }).nullable(),
  current: z.object({
    startTurn: z.number().int().min(0),
    startDay: z.number().int(),
    signals: z.array(z.object({ kind: z.literal('sceneEnded'), turn: z.number().int(), reason: z.string() })),
  }),
  review: z.array(reviewItemSchema),
  /** Counter for fact / chapter / review IDs. */
  nextSeq: z.number().int().min(1),
});

export type Fact = z.infer<typeof factSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type ReviewItem = z.infer<typeof reviewItemSchema>;
export type MemorySlice = z.infer<typeof memorySliceSchema>;
