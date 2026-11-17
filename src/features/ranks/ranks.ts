// Ranks slice, minimal for M3 (architecture §2 "ranks"; D-56 stub "rank fixed at creation"). Trials,
// standing, master and apprentices arrive in M7.
import { z } from 'zod';

export const ranksSliceSchema = z.object({ rank: z.string().min(1) });
export type RanksSlice = z.infer<typeof ranksSliceSchema>;
