// Intent call schema (architecture §3). M1 fields plus `activity` (M3); M5 adds tactic, forceAbility, effort,
// healing, risk and the typed combat `sequence` (D-146).
import { z } from 'zod';
import { INTENSITIES } from '../../data/activities';
import { ACTION_TYPES, DIFFICULTIES } from '../../data/checks.config';
import { BLOCKADE_ACTIONS } from '../../data/blockades';
import { PACING_LEVELS } from '../../data/pacing.config';
import { MANEUVERS, STANCES, TACTICS } from '../../data/combat.config';
import { BODY_PARTS, HAZARD_TYPES } from '../../data/health.config';
import { SEQUENCE_SCHEMA_MAX, SEQUENCE_STEP_KINDS } from '../../data/sequence.config';

/** One step of a typed combat sequence (D-146): a stance, a feint or taunt, a maneuver, a Force action, or a strike. */
export const sequenceStepSchema = z.object({
  kind: z.enum(SEQUENCE_STEP_KINDS),
  stance: z.enum(STANCES).optional(),
  tactic: z.enum(['feint', 'taunt']).optional(),
  maneuver: z.enum(MANEUVERS).optional(),
  action: z.enum(['push', 'choke', 'lightning', 'throw', 'mindTrick', 'saberThrow', 'recall']).optional().describe('forceAction: push, choke, lightning, throw an object, mindTrick, saberThrow (throw the lightsaber and guide it back), recall (call a dropped saber back)'),
  objectTag: z.string().max(40).optional().describe('throw: a terrain tag holding throwable objects (loose rock, debris, crates, machinery)'),
  aim: z.enum(BODY_PARTS).optional().describe('strike: only when the player names where the strike goes (head, torso, an arm, a leg, a hand)'),
});

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
  tactic: z.enum(TACTICS).optional().describe('Only for a combat tactic the player states'),
  forceAbility: z.string().max(40).optional().describe('The Force ability used (forcePush, forceChoke, forceLightning, telekinesis, forceHealSelf, ...)'),
  effort: z.enum(['light', 'standard', 'heavy', 'allOut']).optional(),
  healing: z.object({ source: z.enum(['medical', 'bacta', 'forceHealer']), healerRef: z.string().max(80).optional() }).optional().describe('Only for heal'),
  risk: z.object({ type: z.enum(HAZARD_TYPES), severityHint: z.number().int().min(1).max(3) }).optional().describe('A hazard the player\'s own action causes'),
  sequence: z.array(sequenceStepSchema).max(SEQUENCE_SCHEMA_MAX).optional().describe('Combat only: the steps the player chains in order (at most 5)'),
  blockade: z.enum(BLOCKADE_ACTIONS).optional().describe('Only when the player says how they mean to get past a blockade (ride, undercover, smuggle, sneak, aroundClose, aroundOnFoot, force) or that they watch it (observe)'),
  aim: z.enum(BODY_PARTS).optional().describe('Combat only: the body part the player says the next strike goes for ("go for his head": head)'),
});

export type Intent = z.infer<typeof intentSchema>;
export type RequestedSpan = z.infer<typeof requestedSpanSchema>;
export type ActivityIntent = z.infer<typeof activityIntentSchema>;
export type SequenceStepIntent = z.infer<typeof sequenceStepSchema>;

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
  const { skillId, activity, forceAbility, ...rest } = intent;
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
    ...opt('forceAbility', forceAbility),
    ...(act ? { activity: act } : {}),
  };
}
