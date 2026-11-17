// Progression slice (architecture §2 "progression"; progression-numbers §2-17). XP is stored;
// levels, tiers, capacities and effective levels are derived by selectors. M3 fields only: E, CI,
// bank, combat counters and the review buff arrive with combat (M5).
import { z } from 'zod';
import { EASE_DAYS, GRIEF_MULT, STATES_OF_MIND, STATE_MULT, type StateOfMind } from '../../data/progression.config';

export const skillStateSchema = z.object({
  /** Trained XP (effective practice hours); the natural baseline is added by selectors. */
  xp: z.number().min(0),
  rust: z.number().min(0).max(0.2),
  lastPracticedDay: z.number().int().nullable(),
});
export type SkillState = z.infer<typeof skillStateSchema>;

export const windowEntrySchema = z.object({ day: z.number().int(), xp: z.number().min(0), hours: z.number().min(0) });

export const stateOfMindSchema = z.object({
  kind: z.enum(STATES_OF_MIND),
  intensity: z.number().int().min(1).max(3),
  sinceDay: z.number().int(),
  /** Day the state ends (passion, centered) or has fully eased (despair); null for neutral. */
  untilDay: z.number().int().nullable(),
});
export type StateOfMindRecord = z.infer<typeof stateOfMindSchema>;

export const griefSchema = z.object({ intensity: z.number().int().min(1).max(3), sinceDay: z.number().int(), easesByDay: z.number().int() });
export type Grief = z.infer<typeof griefSchema>;

export const dayTrainingSchema = z.object({
  hoursByActivity: z.record(z.string(), z.number().min(0)),
  postWindow: z.number().min(0),
  lastPhysicalHeavy: z.boolean(),
  /** Meditation hours today (centered after 30+ minutes). */
  meditationHours: z.number().min(0),
  /** Training hours today (a day with none is a rest day for the overtraining streak). */
  trainingHours: z.number().min(0),
});
export type DayTrainingState = z.infer<typeof dayTrainingSchema>;

export const tierBeatSchema = z.object({ id: z.string(), skillId: z.string(), tier: z.number().int(), day: z.number().int() });
export type TierBeat = z.infer<typeof tierBeatSchema>;

export const progressionSliceSchema = z.object({
  skills: z.record(z.string(), skillStateSchema),
  stateOfMind: stateOfMindSchema,
  grief: griefSchema.nullable(),
  /** Per skill: daily credited XP and training hours in the rolling 365-day window (D-48, D-104). */
  paceWindow: z.record(z.string(), z.array(windowEntrySchema)),
  overtrainStreak: z.number().int().min(0),
  /** Fatigue Willpower credited today (cap 3.0). */
  willpowerToday: z.number().min(0).max(3),
  today: dayTrainingSchema,
  tierBeatsPending: z.array(tierBeatSchema),
  nextSeq: z.number().int().min(1),
});
export type ProgressionSlice = z.infer<typeof progressionSliceSchema>;

export const EMPTY_TODAY: DayTrainingState = { hoursByActivity: {}, postWindow: 0, lastPhysicalHeavy: false, meditationHours: 0, trainingHours: 0 };

export function emptyProgression(day: number, startingXp: Readonly<Record<string, number>> = {}): ProgressionSlice {
  const skills: Record<string, SkillState> = {};
  for (const [id, xp] of Object.entries(startingXp)) if (xp > 0) skills[id] = { xp, rust: 0, lastPracticedDay: day };
  return {
    skills,
    stateOfMind: { kind: 'neutral', intensity: 1, sinceDay: day, untilDay: null },
    grief: null,
    paceWindow: {},
    overtrainStreak: 0,
    willpowerToday: 0,
    today: EMPTY_TODAY,
    tierBeatsPending: [],
    nextSeq: 1,
  };
}

/** Grief eases linearly from x0.80 back to x1.00 by easesByDay (progression-numbers §17). */
export function griefMult(grief: Grief | null, day: number): number {
  if (!grief) return 1;
  const span = Math.max(1, grief.easesByDay - grief.sinceDay);
  const t = Math.min(1, Math.max(0, (day - grief.sinceDay) / span));
  return GRIEF_MULT + (1 - GRIEF_MULT) * t;
}

/** Despair eases the same way, but only while despair is the active state. */
export function despairMult(s: StateOfMindRecord, day: number): number {
  if (s.kind !== 'despair' || s.untilDay === null) return STATE_MULT.despair;
  const span = Math.max(1, s.untilDay - s.sinceDay);
  const t = Math.min(1, Math.max(0, (day - s.sinceDay) / span));
  return STATE_MULT.despair + (1 - STATE_MULT.despair) * t;
}

export const easeDays = (intensity: number): number => EASE_DAYS[Math.min(3, Math.max(1, Math.round(intensity))) as 1 | 2 | 3];

/** The state in force on a day (an expired state falls back to neutral). */
export function activeState(s: StateOfMindRecord, day: number): StateOfMind {
  if (s.untilDay !== null && day > s.untilDay) return 'neutral';
  return s.kind;
}
