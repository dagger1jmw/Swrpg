// The duty slice (opt-2 D; m9-missions B; spec/duty.md, spec/missions.md): at home or on a mission, the mission itself, a posting
// and its leave, and the record of missions. Owned by the code: set only by the engine's events (never the narrator).
import { z } from 'zod';

export const missionStageSchema = z.object({
  id: z.string().max(40),
  label: z.string().max(80),
  kind: z.enum(['check', 'fight', 'battle', 'travel']),
  /** Check stages: the approaches that fit. */
  approaches: z.array(z.string().max(20)).max(12),
  need: z.number().int().min(1),
  progress: z.number().int().min(0),
  rating: z.number(),
  hours: z.tuple([z.number(), z.number()]),
  /** Complications on this stage (each makes it harder). */
  harder: z.number().int().min(0),
  foes: z.object({ grade: z.number().int(), count: z.tuple([z.number().int(), z.number().int()]) }).nullable(),
  battle: z.enum(['ground', 'ship']).nullable(),
  /** Travel stages: the world the stage is decided at. */
  world: z.string().max(80).nullable(),
  /** A fight or battle under way for this stage: its id (a fight) or the day it began (a battle). */
  fightId: z.string().nullable(),
  battleFrom: z.number().int().nullable(),
  status: z.enum(['pending', 'active', 'done', 'failed']),
  /** Why the stage was added (a complication stage), or null. */
  addedBy: z.string().max(120).nullable(),
});
export type MissionStage = z.infer<typeof missionStageSchema>;

export const missionSchema = z.object({
  id: z.string().max(40),
  type: z.string().max(40),
  title: z.string().max(80),
  objective: z.string().max(160),
  /** The mission's story thread (opened by the engine with it); a follow-up continues the same one. */
  threadTitle: z.string().max(80),
  targetWorld: z.string().max(80),
  targetPlace: z.string().max(80).nullable(),
  /** Where it was launched from and comes home to: the Temple (or the path's home), or the forward base while posted. */
  base: z.object({ name: z.string().max(80), planet: z.string().max(80).nullable() }),
  deadlineDay: z.number().int().nullable(),
  stages: z.array(missionStageSchema).max(12),
  current: z.number().int().min(0),
  complications: z.array(z.string().max(120)).max(12),
  /** outbound: travelling to the target; onSite: the stages; return: coming home; the code moves it on. */
  phase: z.enum(['outbound', 'onSite', 'return']),
  /** Set when the work is done or has failed; the mission ends on arrival at base (or at once when cut short). */
  outcome: z.enum(['success', 'failure', 'cutShort']).nullable(),
  assignedDay: z.number().int(),
  /** Who is on it besides the character (B1, B7): the master or Padawan, and allies. */
  party: z.object({ masterId: z.string().nullable(), padawanId: z.string().nullable(), allyIds: z.array(z.string()).max(6) }),
  /** A chained mission (B6): the one it followed and how many links so far. */
  chainOf: z.string().max(40).nullable(),
  chainLength: z.number().int().min(0),
  /** The character has left base since the assignment (opt-2's rule, kept). */
  leftHome: z.boolean(),
});
export type Mission = z.infer<typeof missionSchema>;

export const postingSchema = z.object({
  frontId: z.string().max(40),
  front: z.string().max(80),
  warId: z.string().max(40),
  /** The forward base or flagship: the home base while posted. */
  base: z.object({ name: z.string().max(80), planet: z.string().max(80) }),
  sinceDay: z.number().int(),
  nextLeaveDay: z.number().int(),
});
export type Posting = z.infer<typeof postingSchema>;

export const dutySliceSchema = z.object({
  status: z.enum(['home', 'mission']),
  /** The day the status began: home since the last mission ended (or the campaign began), on a mission since its assignment. */
  since: z.number().int(),
  mission: missionSchema.nullable(),
  /** The day after a mission's end: a home day whatever the setting (opt-2 D5b). */
  homeDay: z.number().int().nullable(),
  /** A skip stopped before its end (a home day, an assignment, news): the day it was going to, for "Resume the skip". */
  resume: z.object({ targetDay: z.number().int() }).nullable(),
  /** A home base recorded when duty first saw the character (not for a Jedi: the Order's seat of the year is theirs). */
  home: z.object({ name: z.string().max(80), planet: z.string().max(80).nullable() }).nullable(),
  log: z.array(z.object({ day: z.number().int(), what: z.string().max(160) })),
  /** A posting to a front in a total war (B5b), or null. */
  posting: postingSchema.nullable(),
  /** Leave home from a posting (B5c): until this day the home base is the Temple again. */
  leave: z.object({ fromDay: z.number().int(), untilDay: z.number().int() }).nullable(),
  /** The record of missions (B9; the Council's test reads it) and the standing they earned. */
  record: z.object({ missions: z.number().int().min(0), successes: z.number().int().min(0), failures: z.number().int().min(0), cutShort: z.number().int().min(0), chains: z.number().int().min(0), standing: z.number() }),
  history: z.array(z.object({ id: z.string().max(40), type: z.string().max(40), title: z.string().max(80), world: z.string().max(80), outcome: z.string().max(20), startDay: z.number().int(), endDay: z.number().int() })),
  /** The next mission's number (mission ids). */
  seq: z.number().int().min(0),
  /** A narrator's proposal accepted on this day (B10: at most one a week). */
  proposalDay: z.number().int().nullable(),
  /** A narrator's proposal the code accepted, assigned at the next passage of time (B10). */
  proposal: z.object({ type: z.string().max(40), world: z.string().max(80), why: z.string().max(160) }).nullable(),
  /** /allhands on|off (m9-missions A6, dev only): all hands on deck for the character's side, whatever the timeline says. */
  devAllHands: z.boolean().optional(),
  /** Duty switched off: a harness that measures the training routine alone (the lifetime runs). Never set in play. */
  off: z.boolean().optional(),
});
export type DutySlice = z.infer<typeof dutySliceSchema>;

export const emptyRecord = (): DutySlice['record'] => ({ missions: 0, successes: 0, failures: 0, cutShort: 0, chains: 0, standing: 0 });
