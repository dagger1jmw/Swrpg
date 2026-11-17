import { z } from 'zod';
import { RELATIONSHIP_RANGE } from '../../data/entities.config';

export const relationshipSchema = z.object({
  value: z.number().min(-RELATIONSHIP_RANGE).max(RELATIONSHIP_RANGE),
  lastDay: z.number().int(),
  /** The AI's latest reason, verbatim (shown in the People tab). */
  lastReason: z.string(),
});
export const relationshipsSliceSchema = z.object({ byNpcId: z.record(z.string(), relationshipSchema) });

export type Relationship = z.infer<typeof relationshipSchema>;
export type RelationshipsSlice = z.infer<typeof relationshipsSliceSchema>;
