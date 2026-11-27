// The duty slice (opt-2 D; spec/duty.md): on a mission or at home, owned by the code. Set only by the engine's missionAssigned
// and missionEnded events (never the narrator).
import { z } from 'zod';

export const missionSchema = z.object({
  title: z.string().max(80),
  /** The mission's thread (opened by the engine with it): its end is one way the mission ends. */
  threadTitle: z.string().max(80),
  assignedDay: z.number().int(),
  /** The character has left home since the assignment: coming back ends the mission. */
  leftHome: z.boolean(),
});
export type Mission = z.infer<typeof missionSchema>;

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
});
export type DutySlice = z.infer<typeof dutySliceSchema>;
