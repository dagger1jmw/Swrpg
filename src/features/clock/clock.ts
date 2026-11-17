// Clock slice (architecture §2, §10; D-23, D-30). The only writer of in-game time.
import { z } from 'zod';
import type { Instant } from '../../engine/calendar';

export const instantSchema = z.object({
  day: z.number().int(),
  second: z.number().int().min(0).max(86_399),
});

export const lastAdvanceSchema = z.object({
  seconds: z.number().int().min(0),
  reason: z.string(),
  source: z.enum(['turnDraft', 'timeElapsed']),
  requested: z.number().int().min(0).optional(),
  clampedFrom: z.number().int().min(0).optional(),
  /** Set when an interruption stopped the advance early (architecture §9). */
  interruptedBy: z.string().optional(),
});

export const clockSliceSchema = z.object({
  now: instantSchema,
  lastAdvance: lastAdvanceSchema.nullable(),
});

export type ClockSlice = z.infer<typeof clockSliceSchema>;
export type LastAdvance = z.infer<typeof lastAdvanceSchema>;

/** The single setter for clock.now, used only by state/advanceTime. */
export function setClockNow(slice: ClockSlice, now: Instant): ClockSlice {
  return { ...slice, now: { day: now.day, second: now.second } };
}

export function setLastAdvance(slice: ClockSlice, lastAdvance: LastAdvance): ClockSlice {
  return { ...slice, lastAdvance };
}
