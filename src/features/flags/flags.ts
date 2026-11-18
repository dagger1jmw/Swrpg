import { z } from 'zod';

/** The set flags (spec/flag-registry.md): registered ids, param flags as `<id>:<param>`. */
export const flagsSliceSchema = z.object({ set: z.array(z.string().max(120)) });
export type FlagsSlice = z.infer<typeof flagsSliceSchema>;
