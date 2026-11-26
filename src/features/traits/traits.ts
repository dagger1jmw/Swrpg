import { z } from 'zod';

// Traits slice (M8 checklist item 16; spec/traits.md section 6). The character's traits with how each came, the counts that
// change them in play (fears faced, temperament moments), the formative quiz's state and what it gave that the alignment
// system and the factions read (alignment and dark-pressure nudges, standing). An old save loads with no traits and the quiz
// 'never' (neither is offered later).

export const holdingSchema = z.object({
  id: z.string().min(1),
  since: z.number().int(),
  source: z.enum(['creation', 'quiz', 'event']),
  tieName: z.string().max(60).optional(),
  field: z.string().max(40).optional(),
  overcome: z.literal(true).optional(),
});

export const quizStateSchema = z.object({
  /**
   * never: an old save (no quiz, ever). pending: a youngling start, waiting for the first long skip. due: the skip came; the
   * quiz covers fromAge-toAge. taken: done (answered or declined), never again.
   */
  status: z.enum(['never', 'pending', 'due', 'taken']),
  seed: z.string(),
  /** A youngling's unbroken jump so far (absolute days), while pending. */
  jumpFrom: z.number().int().optional(),
  jumpTo: z.number().int().optional(),
  /** The years the due quiz covers (real ages). */
  fromAge: z.number().optional(),
  toAge: z.number().optional(),
});

export const traitsSliceSchema = z.object({
  held: z.array(holdingSchema),
  /** The homeworld named at creation (the gates and the Sacking read it). */
  homeworld: z.string().max(60).optional(),
  /** Fears faced per scar, and temperament moments per "from>to" pair (the code changes a trait at the threshold). */
  counts: z.record(z.string(), z.number().int().min(0)),
  /** The rival's spur runs to this day (after the rival outdoes the character). */
  rivalSpurUntil: z.number().int().optional(),
  quiz: quizStateSchema,
  /** The quiz's nudges, read by the alignment system (M6) and the factions: alignment, dark pressure, standing per group. */
  alignmentNudge: z.number().min(-10).max(10),
  darkPressureNudge: z.number().min(-10).max(10),
  standing: z.record(z.string(), z.number().min(-10).max(10)),
  /** The quiz's leanings, kept for the trait step's suggestions. */
  leans: z.record(z.string(), z.number()),
  /** Every change after creation (recorded events only). */
  history: z.array(z.object({ day: z.number().int(), change: z.enum(['added', 'removed', 'overcome', 'replaced']), id: z.string(), why: z.string().max(160) })),
});

export type TraitsSlice = z.infer<typeof traitsSliceSchema>;
export type QuizState = z.infer<typeof quizStateSchema>;

/** The slice of a save from before traits (or a start made without them): nothing held, no quiz offered. */
export const emptyTraits = (): TraitsSlice => ({ held: [], counts: {}, quiz: { status: 'never', seed: '' }, alignmentNudge: 0, darkPressureNudge: 0, standing: {}, leans: {}, history: [] });
