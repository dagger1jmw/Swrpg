// Intent call schema (architecture §3). M1 fields only (D-71): activity, tactic, forceAbility,
// healing and risk are added by their features' milestones.
import { z } from 'zod';
import { ACTION_TYPES, DIFFICULTIES } from '../../data/checks.config';
import { PACING_LEVELS } from '../../data/pacing.config';

export const SPAN_UNITS = ['seconds', 'minutes', 'hours', 'days'] as const;

export const requestedSpanSchema = z.object({
  amount: z.number().positive().describe('How long the action takes, in the given unit'),
  unit: z.enum(SPAN_UNITS),
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
});

export type Intent = z.infer<typeof intentSchema>;
export type RequestedSpan = z.infer<typeof requestedSpanSchema>;

const UNIT_SECONDS: Record<(typeof SPAN_UNITS)[number], number> = { seconds: 1, minutes: 60, hours: 3600, days: 86_400 };

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
  const { skillId, ...rest } = intent;
  return {
    ...rest,
    targets: clean(intent.targets),
    references: clean(intent.references),
    unknownNames: clean(intent.unknownNames),
    ...(skillId !== undefined && skillId.trim() ? { skillId: skillId.trim() } : {}),
  };
}
