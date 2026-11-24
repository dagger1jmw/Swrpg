// Blockades (M8 item 4; D-469; m8-design-notes.md, "Running a blockade"): one general system for any blockade at any date.
// Each blockade is a single dated record; what changes while it stands is a list of dated states. Lore facts carry their
// source; every number is `invented` (Legends gives no sizes, distances or odds). The rules are in src/engine/blockade.ts,
// the numbers of the system in blockade.config.ts.
import type { FactionId, NpcRole } from './entities.config';
import type { ControlSide } from './worldControl';
import type { WorldDate } from './worldNetwork';

/**
 * The six approaches. Going around has two endings: slipping in close by ship, or landing outside patrol range and going in
 * on foot.
 */
export const BLOCKADE_APPROACHES = ['ride', 'talk', 'smuggle', 'sneak', 'aroundClose', 'aroundOnFoot', 'force'] as const;
export type BlockadeApproach = (typeof BLOCKADE_APPROACHES)[number];
/** What a player can ask for at a blockade: an approach, or watching it. */
export const BLOCKADE_ACTIONS = [...BLOCKADE_APPROACHES, 'observe'] as const;
export type BlockadeAction = (typeof BLOCKADE_ACTIONS)[number];

/** 1 trade: stops commercial shipping. 2 enforced: ships stopped and searched. 3 military: a full cordon. */
export type BlockadeLevel = 1 | 2 | 3;

/** What the blockaders do with a ship they catch, mildest first. */
export const BLOCKADE_RESPONSES = ['turnedBack', 'boarded', 'firedOn', 'captured'] as const;
export type BlockadeResponse = (typeof BLOCKADE_RESPONSES)[number];

export interface BlockadeState {
  from: WorldDate;
  level: BlockadeLevel;
  /** 1-5: how many ships hold the line, and how sharp they are. */
  strength: number;
  alertness: number;
  /** Patrol coverage outside the city, in km. */
  patrolKm: number;
  /** Patrols on foot and in the air below, 0-5. */
  groundPatrols: number;
  /** How far the pickets can be bought, 0-5. */
  corruptibility: number;
  /** The worst they do to a caught ship, by how badly it goes. */
  response: readonly BlockadeResponse[];
}

export interface BlockadeZone {
  /** Closes this route inside the grid strip (and a trip along it through the strip). */
  route?: string;
  columns?: readonly string[];
  rowFrom?: number;
  rowTo?: number;
  /** Or closes these worlds. */
  worlds?: readonly string[];
}

export interface BlockadeDef {
  id: string;
  name: string;
  /** For the narrator: who runs it, and what is closed. */
  runBy: string;
  side: ControlSide;
  closes: string;
  zone: BlockadeZone;
  start: WorldDate;
  end?: WorldDate;
  /** World-event outcomes that begin and end it (D-466): a blockade never broken goes on. */
  startsWith?: string;
  endsWith?: string;
  /** Counted as this many days old on its first day (a standing state the campaign opens on). */
  ageOnFirstDay?: number;
  /** A trained military leaves no holes in its first days. */
  disciplined: boolean;
  /** Sensor coverage in km: at first, in full, and the days over which most of it grows. */
  sensors: { startKm: number; fullKm: number; growthDays: number };
  states: readonly BlockadeState[];
  /** Factions that pass freely. */
  passes: readonly FactionId[];
  /** Traffic the blockaders leave alone, and whom to know to ride with it. */
  protectedTraffic: readonly { label: string; factions: readonly FactionId[]; roles: readonly NpcRole[] }[];
  /** Other worlds in the strip are reachable by a detour. */
  detourFactor: number;
  zoneNote: string;
  source: string;
}

export const BLOCKADES: readonly BlockadeDef[] = [
  {
    id: 'hydian-way-3661',
    name: 'the Mandalorian blockade of the Hydian Way',
    runBy: 'Mandalore the Lesser\'s cruisers, for the Sith Empire',
    side: 'mandalorians',
    closes: 'the Mandalorian blockade closes the Hydian Way between Devaron and the Minos Cluster',
    // "Between Devaron and the Minos Cluster" read as the grid strip L-N, rows 14-21 (D-402 [16], D-406; an invented reading).
    zone: { route: 'Hydian Way', columns: ['L', 'M', 'N'], rowFrom: 14, rowTo: 21 },
    start: { year: -3661 },
    startsWith: 'O.blockade_active',
    endsWith: 'O.blockade_broken',
    // The 3,661 start opens with it standing and Coruscant already hungry (D-400).
    ageOnFirstDay: 60,
    disciplined: false,
    sensors: { startKm: 60, fullKm: 160, growthDays: 120 },
    states: [{ from: { year: -3661 }, level: 3, strength: 3, alertness: 3, patrolKm: 110, groundPatrols: 2, corruptibility: 1, response: ['turnedBack', 'boarded', 'firedOn', 'captured'] }],
    passes: ['mandalorians', 'sithEmpire', 'sith'],
    protectedTraffic: [{ label: 'Hutt-backed shipping', factions: ['underworld'], roles: ['merchant', 'smuggler', 'criminal'] }],
    detourFactor: 1.5,
    zoneNote: 'blockade zone: patrols, shortages, scarce passage',
    source:
      'SW_Mandalorians_GGW_Part1, entry D (the picket line hails, demands a ship turn back, moves to intercept; "a small armada of war cruisers"; the southern Hydian Way between Devaron and the Minos Cluster); SW_NarShaddaa_HuttSpace_GGW_Part1 (Hutt neutrality and money); design notes (Hutt-backed shipping). Numbers invented.',
  },
];
