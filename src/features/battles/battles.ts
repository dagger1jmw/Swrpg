import { z } from 'zod';

// Battles slice (m8-ship-battles, D-517; docs-v2/spec/ship-battles.md section 8). The battle in progress (saved whole, so a game
// saved mid-battle loads into the same turn), the record of battles fought (the world reads the last), the condition of the
// player's ships (damage carries over), and what a crew remembers of a commander who left them.

const sideLists = z.object({ player: z.array(z.string().max(80)).max(200), enemy: z.array(z.string().max(80)).max(200) });

export const battleRecordSchema = z.object({
  id: z.string(),
  day: z.number().int(),
  kind: z.enum(['dogfight', 'fleet']),
  role: z.string(),
  trigger: z.string(),
  placeName: z.string().max(80),
  placeId: z.string().nullable(),
  against: z.string().max(80),
  factions: z.object({ player: z.string(), enemy: z.string() }),
  outcome: z.enum(['won', 'drawn', 'lost']),
  reason: z.string(),
  /** A major battle for the world events engine (a fleet battle with capital ships on both sides, or a standing force). */
  major: z.boolean(),
  destroyed: sideLists,
  captured: sideLists,
  evacuated: sideLists,
  fighters: z.object({ player: z.number().int().min(0), enemy: z.number().int().min(0) }),
  casualties: z.object({ player: z.number().int().min(0), enemy: z.number().int().min(0) }),
  morale: z.number(),
  leftCrew: z.boolean(),
  blockadeId: z.string().optional(),
  forceId: z.string().optional(),
});
export type BattleRecord = z.infer<typeof battleRecordSchema>;

/** The player's ship as the last battle left it (shields recover; hull, systems, burnt projectors and warheads do not). */
export const shipConditionSchema = z.object({
  id: z.string(),
  classId: z.string(),
  name: z.string().max(80),
  hull: z.number(),
  systems: z.record(z.string(), z.enum(['working', 'damaged', 'disabled', 'destroyed'])),
  burnt: z.record(z.string(), z.number()),
  ammo: z.record(z.string(), z.number()),
  day: z.number().int(),
});
export type ShipCondition = z.infer<typeof shipConditionSchema>;

export const battlesSliceSchema = z.object({
  /** The battle in progress (engine JSON: features/battles/rules.ts Battle), or none. */
  active: z.any().nullable(),
  /** The battle that ended last (its wrap-up for the panel), or none. */
  last: z.any().nullable(),
  /** What the last step did: its lines, its big moments, the wrap-up, and the seconds it took (the turn reads it). */
  step: z.object({ lines: z.array(z.string()), big: z.array(z.string()), wrap: z.string().nullable(), seconds: z.number().min(0) }).nullable(),
  seq: z.number().int().min(0),
  history: z.array(battleRecordSchema).max(30),
  /** The player's ships by id: the last one flown or commanded is the one a blockade run takes. */
  ships: z.record(z.string(), shipConditionSchema),
  lastShipId: z.string().nullable(),
  /** Crews that remember being left (Jared: reputation with that crew). */
  reputation: z.array(z.object({ day: z.number().int(), crew: z.string().max(80), side: z.string(), kind: z.literal('abandonedCrew') })).max(50),
  /** Dark-side choices stored for the alignment system (M6), as the economy keeps theft. */
  darkChoices: z.array(z.object({ day: z.number().int(), kind: z.literal('abandonedCrew'), ship: z.string().max(80) })).max(50),
});
export type BattlesSlice = z.infer<typeof battlesSliceSchema>;

export const emptyBattles = (): BattlesSlice => ({ active: null, last: null, step: null, seq: 0, history: [], ships: {}, lastShipId: null, reputation: [], darkChoices: [] });
