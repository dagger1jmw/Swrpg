// The tactics slice (m8-ship-life part G; D-519; docs-v2/spec/ship-life.md section 10): the tactics the character knows (usable,
// offered in the battle menu) and has seen (recognised when used against them: the +1 of a known enemy formation; not usable),
// each with how it came.
import { z } from 'zod';

export const tacticsSliceSchema = z.object({
  known: z.record(z.string(), z.object({ source: z.string().max(80), day: z.number().int() })),
  seen: z.record(z.string(), z.object({ source: z.string().max(80), day: z.number().int(), count: z.number().int().min(1) })),
  /** Practice of a seen tactic: at PRACTICE_TO_KNOW it is known. */
  practice: z.record(z.string(), z.number().int().min(0)),
});
export type TacticsSlice = z.infer<typeof tacticsSliceSchema>;
export const emptyTactics = (): TacticsSlice => ({ known: {}, seen: {}, practice: {} });
