// Health slice, minimal for M3 (architecture §2 "health"; health.md §2): the physical, mental and
// Force meters and the last sleep carry. Vitality, wounds, lasting injuries and dying arrive in M5.
import { z } from 'zod';

export const metersSchema = z.object({ p: z.number().min(0), m: z.number().min(0), f: z.number().min(0) });

export const healthSliceSchema = z.object({
  /** Loads (load-hours); the fraction f = meter / capacity is derived. */
  meters: metersSchema,
  /** Fraction of the meters the last sleep carried over (0, 0.3 or 0.6). */
  sleepCarry: z.number().min(0).max(0.6),
});

export type HealthSlice = z.infer<typeof healthSliceSchema>;

export const emptyHealth = (): HealthSlice => ({ meters: { p: 0, m: 0, f: 0 }, sleepCarry: 0 });
