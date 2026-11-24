// World slice (architecture §2 "world"): the log of rolled world events (M4, D-136) and the state of the world-event tag
// network (M8 Phase A, D-466). Factions and renown arrive later in M8.
import { z } from 'zod';
import { WORLD_EVENT_STATUSES } from '../../data/worldNetwork';
import { CONTROL_SIDES } from '../../data/worldControl';

export const worldEventSchema = z.object({
  id: z.string(),
  day: z.number().int(),
  kind: z.string(),
  significant: z.boolean(),
  /** Entity IDs involved (an NPC or a thread). */
  refs: z.array(z.string()),
  summary: z.string().max(200),
  /** The turn whose narration told it (null = not narrated yet). */
  narratedTurn: z.number().int().nullable(),
});
export type WorldEvent = z.infer<typeof worldEventSchema>;

const told = z.number().int().nullable();

/** Who stands in for a lost replaceable role; no ids = somebody of similar standing the lore does not name. */
export const substituteSchema = z.object({ role: z.string(), canonId: z.string().nullable(), npcId: z.string().nullable(), name: z.string().nullable() });
export type Substitute = z.infer<typeof substituteSchema>;

export const eventRecordSchema = z.object({
  status: z.enum(WORLD_EVENT_STATUSES),
  /** The day it started (or, for one that never started, the day it diverged). */
  day: z.number().int(),
  endedDay: z.number().int().nullable(),
  /** The event's own broken tags and broken inputs when it was settled. */
  broken: z.array(z.string()),
  substitutes: z.array(substituteSchema),
  toldTurn: told,
});
export type EventRecord = z.infer<typeof eventRecordSchema>;

export const progressSchema = z.object({
  points: z.number().int().min(0),
  /** Facts already counted: test indexes, or a test index and a fight id. */
  counted: z.array(z.string()),
  /** The prerequisite was met (it stays known). */
  prepared: z.boolean(),
  actionDay: z.number().int().nullable(),
  actionsThatDay: z.number().int().min(0),
});
export type Progress = z.infer<typeof progressSchema>;

export const networkStateSchema = z.object({
  /** Everything dated on or before this day has been dealt with; null = not opened yet (an older save). */
  cursorDay: z.number().int().nullable(),
  /** By event id; absent = not due yet. */
  events: z.record(z.string(), eventRecordSchema),
  /** Broken tags by "<event>#<tag>". One-way: nothing removes an entry. */
  tags: z.record(z.string(), z.object({ day: z.number().int(), cause: z.string().max(200), toldTurn: told })),
  /** Work against a condition's guard, by "<event>#<condition>". */
  progress: z.record(z.string(), progressSchema),
  /** Settled outcomes. 'broken' is final. */
  outcomes: z.record(z.string(), z.object({ state: z.enum(['produced', 'broken']), day: z.number().int() })),
  /** The alternative chosen per plot point, once. */
  plotPoints: z.record(z.string(), z.object({ alternative: z.string(), day: z.number().int(), toldTurn: told })),
  /** Days an event was moved by a plot point's alternative. */
  shifts: z.record(z.string(), z.number().int()),
  /** Places whose control this campaign changed (engine events and alternatives), newest last. */
  control: z.array(z.object({ place: z.string(), side: z.enum(CONTROL_SIDES), day: z.number().int(), note: z.string().max(300) })),
});
export type NetworkState = z.infer<typeof networkStateSchema>;

export const emptyNetworkState = (cursorDay: number | null = null): NetworkState => ({ cursorDay, events: {}, tags: {}, progress: {}, outcomes: {}, plotPoints: {}, shifts: {}, control: [] });

export const worldSliceSchema = z.object({
  log: z.array(worldEventSchema),
  nextSeq: z.number().int().min(1),
  network: networkStateSchema,
});
export type WorldSlice = z.infer<typeof worldSliceSchema>;

export const emptyWorld = (startDay: number | null = null): WorldSlice => ({ log: [], nextSeq: 1, network: emptyNetworkState(startDay) });

/** v1 -> v2 (M8 Phase A): no network state; it opens at the save's date, and everything before stands as recorded. */
export function migrateWorldV1(old: unknown): WorldSlice {
  return { ...(old as Omit<WorldSlice, 'network'>), network: emptyNetworkState() };
}
