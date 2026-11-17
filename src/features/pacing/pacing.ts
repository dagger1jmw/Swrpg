import { z } from 'zod';
import { PACING_LEVELS } from '../../data/pacing.config';

export const pacingLevelSchema = z.enum(PACING_LEVELS);

export const moodTagsSchema = z.array(z.string().max(30)).max(5);

// M1 slice: level and scene mood. settlingIn and lastNoveltyDay arrive in M4, presentNpcIds in M2.
export const pacingSliceSchema = z.object({
  level: pacingLevelSchema,
  scene: z.object({ moodTags: moodTagsSchema }),
});

export type PacingSlice = z.infer<typeof pacingSliceSchema>;
