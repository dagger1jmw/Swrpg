// The droids slice (M8 checklist item 7; docs-v2/spec/droids.md section 8): the droids the character owns. Each is a model
// plus its own history (engine/droids.ts DroidUnit); everything else (skills, personality, status) is derived from the date.
import { z } from 'zod';
import { DROID_LOCATIONS, DROID_SKILLS, PAST_YEARS, SYSTEM_STATES } from '../../data/droids.config';

const skill = z.enum(DROID_SKILLS);

export const droidUnitSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  name: z.string().max(40),
  seed: z.string(),
  how: z.enum(['bought', ...(Object.keys(PAST_YEARS) as [keyof typeof PAST_YEARS, ...(keyof typeof PAST_YEARS)[]])]),
  acquiredDay: z.number().int(),
  wipedDay: z.number().int(),
  modules: z.array(z.object({ skill, gain: z.number() })),
  reprogrammed: z.array(skill),
  systems: z.partialRecord(z.enum(DROID_LOCATIONS), z.enum(SYSTEM_STATES)),
  disabledUntil: z.number().nullable(),
  shieldStops: z.number().int().min(0),
  bolt: z.boolean(),
  regard: z.number().int(),
  impounded: z.boolean(),
  stolen: z.boolean(),
});

export const droidsSliceSchema = z.object({
  units: z.array(droidUnitSchema),
  nextId: z.number().int().min(1),
});
export type DroidsSlice = z.infer<typeof droidsSliceSchema>;
