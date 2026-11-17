// Intent call schema (architecture §3). M1 fields plus `activity` (M3): tactic, forceAbility,
// healing and risk are added by their features' milestones (D-71).
import { z } from 'zod';
import { INTENSITIES } from '../../data/activities';
import { ACTION_TYPES, DIFFICULTIES } from '../../data/checks.config';
import { PACING_LEVELS } from '../../data/pacing.config';

export const SPAN_UNITS = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'] as const;

export const requestedSpanSchema = z.object({
  amount: z.number().positive().describe('How long the action takes, in the given unit'),
  unit: z.enum(SPAN_UNITS),
});

/** train / study: the activity from the VALID ACTIVITIES list (skills-and-activities.md). */
export const activityIntentSchema = z.object({
  activityId: z.string().max(60).describe('An id from the VALID ACTIVITIES list'),
  intensity: z.enum(INTENSITIES).optional().describe('Only when the player states how hard they push'),
  partnerRef: z.string().max(80).optional().describe('ID of a training partner who is present'),
  teacherRef: z.string().max(80).optional().describe('ID of a teacher or master who is instructing'),
});

export const intentSchema = z.object({
  actionType: z.enum(ACTION_TYPES),
  targets: z.array(z.string().max(80)).max(5).describe('IDs from the valid IDs list that the action is aimed at'),
  references: z.array(z.string().max(80)).max(10).describe('Other valid IDs the action mentions'),
  unknownNames: z.array(z.string().max(60)).max(10).describe('Names the player used that are not in the valid IDs list'),
  skillId: z.string().max(60).optional(),
  proposedDifficulty: z.enum(DIFFICULTIES).optional(),
  requestedPacing: z.enum(PACING_LEVELS).optional(),
  requestedSpan: requestedSpanSchema.optional().describe('Only when the player states or clearly implies a duration'),
  activity: activityIntentSchema.optional().describe('Only for train or study'),
});

export type Intent = z.infer<typeof intentSchema>;
export type RequestedSpan = z.infer<typeof requestedSpanSchema>;
export type ActivityIntent = z.infer<typeof activityIntentSchema>;

// A month is a twelfth of the 368-day year (D-38), a year 368 days (M4: montage and time-skip spans).
const UNIT_SECONDS: Record<(typeof SPAN_UNITS)[number], number> = { seconds: 1, minutes: 60, hours: 3600, days: 86_400, weeks: 7 * 86_400, months: (368 / 12) * 86_400, years: 368 * 86_400 };

export function spanToSeconds(span: RequestedSpan): number {
  return Math.round(span.amount * UNIT_SECONDS[span.unit]);
}

/**
 * Models sometimes fill optional string fields with "" instead of leaving them out (seen live with
 * gemini-3.5-flash-lite: skillId ""). An empty optional value means absent; drop it and blank
 * list entries so "" never reaches the resolver as an ID.
 */
export function normalizeIntent(intent: Intent): Intent {
  const clean = (xs: string[]): string[] => xs.map((x) => x.trim()).filter(Boolean);
  const { skillId, activity, ...rest } = intent;
  const opt = (k: string, v: string | undefined): Record<string, string> => (v !== undefined && v.trim() ? { [k]: v.trim() } : {});
  const act: ActivityIntent | null =
    activity && activity.activityId.trim()
      ? {
          activityId: activity.activityId.trim(),
          ...(activity.intensity ? { intensity: activity.intensity } : {}),
          ...opt('partnerRef', activity.partnerRef),
          ...opt('teacherRef', activity.teacherRef),
        }
      : null;
  return {
    ...rest,
    targets: clean(intent.targets),
    references: clean(intent.references),
    unknownNames: clean(intent.unknownNames),
    ...opt('skillId', skillId),
    ...(act ? { activity: act } : {}),
  };
}
