import { z } from 'zod';
import { PACING_LEVELS } from '../../data/pacing.config';

export const pacingLevelSchema = z.enum(PACING_LEVELS);

export const moodTagsSchema = z.array(z.string().max(30)).max(5);

// Level and scene (mood, who is present; M2). settlingIn and lastNoveltyDay arrive in M4.
export const pacingSliceSchema = z.object({
  level: pacingLevelSchema,
  scene: z.object({ moodTags: moodTagsSchema, presentNpcIds: z.array(z.string()) }),
});

export type PacingSlice = z.infer<typeof pacingSliceSchema>;
