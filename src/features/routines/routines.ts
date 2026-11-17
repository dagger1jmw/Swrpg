// Routines slice (architecture §2 "routines"; training-routines.md §1). The player's routine decides
// (D-41); with no priorities the scheduler uses the archetype default template. The fill credit carries
// the 0.5 h rounding of the fill from day to day, so every share gets its hours on average.
import { z } from 'zod';
import { INTENSITIES } from '../../data/activities';

export const EFFORTS = ['easy', 'standard', 'push'] as const;
export type RoutineEffort = (typeof EFFORTS)[number];

/** focus 3 | regular 2 | light 1 (training-routines §1). */
export const PRIORITY_WEIGHTS = { focus: 3, regular: 2, light: 1 } as const;

export const trainingSourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('npc'), id: z.string() }),
  z.object({ kind: z.literal('partner'), id: z.string() }),
  z.object({ kind: z.literal('record'), id: z.string() }),
  z.object({ kind: z.literal('instructor') }),
  z.object({ kind: z.literal('master') }),
  z.object({ kind: z.literal('peers') }),
  z.object({ kind: z.literal('solo') }),
]);

export const prioritySchema = z.object({
  skillId: z.string().min(1),
  weight: z.number().int().min(1).max(3),
  /** The activity to train it with (default: the skill's default activity). */
  activityId: z.string().optional(),
  source: trainingSourceSchema.optional(),
  intensity: z.enum(INTENSITIES).optional(),
});
export type Priority = z.infer<typeof prioritySchema>;

export const lockedBlockSchema = z.object({
  activityId: z.string().min(1),
  skillId: z.string().optional(),
  /** Start time, seconds of the day. */
  startSecond: z.number().int().min(0).max(86_399),
  hours: z.number().min(0.5).max(12),
  source: trainingSourceSchema.optional(),
  intensity: z.enum(INTENSITIES).optional(),
});
export type LockedBlock = z.infer<typeof lockedBlockSchema>;

export const routineSchema = z.object({
  /** Null = the archetype's default template (D-40, D-41). */
  priorities: z.array(prioritySchema).max(20).nullable(),
  effort: z.enum(EFFORTS),
  /** Training days per week; fractional values spread evenly (the profiles' 300 of 368, D-40). */
  daysPerWeek: z.number().min(0).max(7),
  wakeSecond: z.number().int().min(0).max(86_399),
  sleepHours: z.number().min(4).max(12),
  lockedBlocks: z.array(lockedBlockSchema).max(12),
  /** The Padawan's master for the Order blocks (an NPC); null = the master stub (D-124). */
  masterRef: z.string().nullable(),
  /** Who the fill trains with; null = the path default (peers, or solo for outsiders, D-128). */
  fillSource: trainingSourceSchema.nullable(),
});
export type Routine = z.infer<typeof routineSchema>;

export const suggestionSchema = z.object({
  priorities: z.array(prioritySchema),
  effort: z.enum(EFFORTS),
  spanHint: z.string().max(120),
  day: z.number().int(),
});

export const routinesSliceSchema = z.object({
  active: routineSchema,
  templates: z.array(z.object({ id: z.string(), name: z.string().min(1).max(60), routine: routineSchema })).max(30),
  /** The AI's routineRequested, waiting for the player (never applied by itself). */
  suggested: suggestionSchema.nullable(),
  /** Fill hours owed per skill (the 0.5 h rounding carried across days). */
  fillCredit: z.record(z.string(), z.number()),
  nextSeq: z.number().int().min(1),
});
export type RoutinesSlice = z.infer<typeof routinesSliceSchema>;

export const DEFAULT_ROUTINE: Routine = {
  priorities: null,
  effort: 'standard',
  daysPerWeek: 6,
  wakeSecond: 6 * 3600,
  sleepHours: 8,
  lockedBlocks: [],
  masterRef: null,
  fillSource: null,
};

export const emptyRoutines = (): RoutinesSlice => ({ active: DEFAULT_ROUTINE, templates: [], suggested: null, fillCredit: {}, nextSeq: 1 });
