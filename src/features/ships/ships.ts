// The ships slice (m8-ship-life, M8 checklist item 13 part 2; D-519; docs-v2/spec/ship-life.md section 2): the character's
// individual ships. Each is a copy of its class (data/ships.ts) plus its own history: name, owner, how it is held, transponder,
// mods, wear, cargo, crew aboard, where it is docked, renown and the search flag. Hull, systems, burnt projectors and warheads
// stay in the battles slice under the same id (one owner per field): selectShipCondition reads them.
import { z } from 'zod';
import { CREW_ROLES, CUSTOMS_OUTCOMES, SHIP_HOLDS, SHIP_HOW, TRANSPONDERS } from '../../data/shipLife.config';

export const crewMemberSchema = z.object({
  id: z.string(),
  name: z.string().max(60),
  /** A named NPC serving aboard, or a hand with a generic level. */
  npcId: z.string().nullable(),
  role: z.enum(CREW_ROLES),
  /** Wages on the calendar, a share of the character's earnings, or loyalty alone (a companion). */
  pay: z.enum(['wage', 'share', 'loyalty']),
  loyalty: z.number().int().min(0).max(5),
  hiredDay: z.number().int(),
  unpaidMonths: z.number().int().min(0),
});
export type CrewMember = z.infer<typeof crewMemberSchema>;

export const cargoSchema = z.object({
  what: z.string().max(60),
  units: z.number().int().min(1),
  contraband: z.boolean(),
  hidden: z.boolean(),
});
export type Cargo = z.infer<typeof cargoSchema>;

export const ownedShipSchema = z.object({
  id: z.string(),
  classId: z.string(),
  name: z.string().max(60),
  /** Who holds title: the character, the Order, the Navy, the Empire. */
  owner: z.string().max(60),
  hold: z.enum(SHIP_HOLDS),
  how: z.enum(SHIP_HOW),
  /** The issuer of an issued ship (the Jedi Order, the Republic Navy, the Sith Empire, Imperial Intelligence). */
  issuer: z.string().max(60).nullable(),
  transponder: z.enum(TRANSPONDERS),
  /** Who it was taken from (a stolen ship); they may hunt it while the old transponder still reads. */
  formerOwner: z.string().max(60).nullable(),
  reportedStolen: z.boolean(),
  mods: z.array(z.string()).max(30),
  /** 0 new or just overhauled, 1 worn out (engine/shipLife wearAfter). */
  wear: z.number().min(0).max(1),
  /** Systems a field patch holds together (they may give way when the ship is pushed). */
  patched: z.array(z.string()).max(20),
  cargo: z.array(cargoSchema).max(30),
  crew: z.array(crewMemberSchema).max(40),
  /** The map world where it is docked; null in transit or unknown. */
  dockedAt: z.string().max(80).nullable(),
  /** Days of supplies aboard for the crew it carries. */
  supplies: z.number().min(0),
  renown: z.number().min(0).max(100),
  /** Caught once by customs: searched more often until its ID changes. */
  flagged: z.boolean(),
  impounded: z.boolean(),
  /** In a shipyard until this day (repairs, an overhaul, a big mod). */
  yardUntil: z.number().int().nullable(),
  acquiredDay: z.number().int(),
  lastOverhaulDay: z.number().int(),
  /** Its price new, for repairs and mods (the economy's, at the time it was had). */
  priceNew: z.number().min(0),
});
export type OwnedShip = z.infer<typeof ownedShipSchema>;

export const shipsSliceSchema = z.object({
  ships: z.record(z.string(), ownedShipSchema),
  /** The ship the character flies or travels in (the last one used). */
  activeId: z.string().nullable(),
  nextId: z.number().int().min(1),
  nextCrewId: z.number().int().min(1),
  /** Ships gone (sold, destroyed, abandoned, taken), kept for the panel and the narrator. */
  gone: z.array(z.object({ id: z.string(), name: z.string().max(60), classId: z.string(), day: z.number().int(), how: z.string().max(40) })).max(30),
  /** The last customs check, for the narrator (told once). */
  lastCustoms: z.object({ day: z.number().int(), world: z.string().max(80), outcome: z.enum(CUSTOMS_OUTCOMES), found: z.array(z.string()).max(12), told: z.boolean() }).nullable(),
  /** Lines for the narrator not yet told (wages missed, crew leaving, a hunter on the trail, a breakdown). */
  news: z.array(z.object({ day: z.number().int(), text: z.string().max(240), told: z.boolean() })).max(30),
});
export type ShipsSlice = z.infer<typeof shipsSliceSchema>;

export const emptyShips = (): ShipsSlice => ({ ships: {}, activeId: null, nextId: 1, nextCrewId: 1, gone: [], lastCustoms: null, news: [] });
