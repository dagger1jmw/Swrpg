// Summary call schema (architecture §7, D-57). The reply becomes a chapterSummarized event.
import { z } from 'zod';
import { MEMORY_LIMITS } from '../../data/memory.config';

export const summaryReplySchema = z.object({
  chapterSummary: z.string().min(1).max(MEMORY_LIMITS.chapterSummary).describe('What happened in this chapter, 4 to 8 sentences'),
  arcSummary: z.string().min(1).max(MEMORY_LIMITS.arc).describe('The whole campaign so far, at most 500 words'),
});

