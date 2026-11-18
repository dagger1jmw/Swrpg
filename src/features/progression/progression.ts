// Progression slice (architecture §2 "progression"; progression-numbers §2-17). XP is stored;
// levels, tiers, capacities and effective levels are derived by selectors. M3 fields only: E, CI,
// bank, combat counters and the review buff arrive with combat (M5).
import { z } from 'zod';
import { EASE_DAYS, GRIEF_MULT, STATES_OF_MIND, STATE_MULT, type StateOfMind } from '../../data/progression.config';
import { FORM_IDS } from '../../data/skills';

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
  /** Lightsaber forms whose fundamentals transfer has happened (once per form, D-119). */
  formsStarted: z.array(z.string()),
  /** Forms started by self-study and not yet taught (D-126): their solo sessions drill one rating lower. */
  selfTaught: z.array(z.string()),
  /** Fights each skill was used in today (D-47; the third and later are halved). Reset at midnight. */
  fightsToday: z.record(z.string(), z.number().int().min(0)),
  /** Combat XP before M credited today per skill, for the 12 XP daily cap (D-47). Reset at midnight. */
  combatXpToday: z.record(z.string(), z.number().min(0)),
  /** Applied experience E per lightsaber form group, with its sparring part (progression-numbers §7; M5). */
  E: z.record(z.string(), z.object({ E: z.number().min(0).max(100), eSpar: z.number().min(0) })),
  /** Combat integration CI per combat Force ability, with its sparring part (§8; M5). */
  CI: z.record(z.string(), z.object({ CI: z.number().min(0).max(100), ciSpar: z.number().min(0) })),
  /** Banked drill XP per lightsaber form (§7; capped at 15 levels of XP). */
  bank: z.record(z.string(), z.number().min(0)),
  /** The last day of the current 60-day bank release, or null (D-45). */
  bankReleaseUntil: z.number().int().nullable(),
  /** Recording review (§19): +5% XP to one skill until untilDay; at most once per 7 days. */
  reviewBuff: z.object({ skillId: z.string(), untilDay: z.number().int() }).nullable(),
  lastReviewDay: z.number().int().nullable(),
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
    // Every form a created character starts with has had its transfer (creation applies it, D-119).
    formsStarted: Object.keys(skills).filter((id) => FORM_IDS.includes(id)),
    selfTaught: [],
    fightsToday: {},
    combatXpToday: {},
    E: {},
    CI: {},
    bank: {},
    bankReleaseUntil: null,
    reviewBuff: null,
    lastReviewDay: null,
  };
}

export type M5Fields = 'E' | 'CI' | 'bank' | 'bankReleaseUntil' | 'reviewBuff' | 'lastReviewDay';

/** v3 -> v4 (M5): applied experience, combat integration, the bank and the review buff start empty. */
export function migrateProgressionV3(old: unknown): ProgressionSlice {
  return { ...(old as Omit<ProgressionSlice, M5Fields>), E: {}, CI: {}, bank: {}, bankReleaseUntil: null, reviewBuff: null, lastReviewDay: null };
}

/** v2 -> v3 (M4): self-taught forms (D-126) and the daily combat counters (D-47). */
export function migrateProgressionV2(old: unknown): Omit<ProgressionSlice, M5Fields> {
  return { ...(old as Omit<ProgressionSlice, 'selfTaught' | 'fightsToday' | 'combatXpToday' | M5Fields>), selfTaught: [], fightsToday: {}, combatXpToday: {} };
}

/** v1 -> v2 (D-119): forms already holding XP count as started (no transfer later). */
export function migrateProgressionV1(old: unknown): Omit<ProgressionSlice, 'selfTaught' | 'fightsToday' | 'combatXpToday' | M5Fields> {
  const o = old as Omit<ProgressionSlice, 'formsStarted' | 'selfTaught' | 'fightsToday' | 'combatXpToday' | M5Fields>;
  return { ...o, formsStarted: Object.entries(o.skills).filter(([id, st]) => FORM_IDS.includes(id) && st.xp > 0).map(([id]) => id) };
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
