// Travel numbers (lore batch 22, D-402 [3]; approved with changes by Jared, D-405). Every number here is `invented`:
// Legends gives no point-to-point trip times for the era. The shape is lore (lanes, class as a multiplier, climb-out,
// plotting takes hours, hazards). Source: SW_Planets_Travel_OldRepublic_Part5, Part C.

export interface RegionRate {
  /** The hop's minimum hours at Class 1 (the region table value). */
  minHours: number;
  /** Hours per grid square crossed beyond the first. */
  perSquareHours: number;
}

/** By region, slowest last. A hop across regions uses the slower rate (D-405). */
export const REGION_RATES: readonly { match: RegExp; label: string; rate: RegionRate }[] = [
  { match: /^core worlds/i, label: 'Core Worlds', rate: { minHours: 4, perSquareHours: 3 } },
  { match: /^(colonies|inner rim)/i, label: 'Colonies / Inner Rim', rate: { minHours: 6, perSquareHours: 4 } },
  { match: /^(expansion region|mid rim)/i, label: 'Expansion Region / Mid Rim', rate: { minHours: 10, perSquareHours: 6 } },
  { match: /^(outer rim|hutt space)/i, label: 'Outer Rim / Hutt Space', rate: { minHours: 16, perSquareHours: 8 } },
  { match: /^(wild space|unknown regions)/i, label: 'Wild Space / Unknown Regions', rate: { minHours: 30, perSquareHours: 15 } },
];

/** The Deep Core: its gravity wells slow every hop (Core rates × 3). */
export const DEEP_CORE = { match: /^deep core/i, factor: 3 } as const;
/** Off the charted lanes: × 4, plus hours to plot a destination never travelled to (lore: "a few hours"). */
export const OFF_LANE = { factor: 4, plotHours: 3 } as const;
/** Climbing out of (and down into) a gravity well, at each end; not multiplied by class. */
export const CLIMB_OUT_HOURS = { planet: 1, station: 0.25 } as const;
/** An asteroid field at either end lengthens the trip. */
export const ASTEROID_FACTOR = 1.5;
/** The Maelstrom Nebula forces sublight travel (about 3 days to cross). */
export const MAELSTROM_SUBLIGHT_HOURS = 72;

/** Hyperdrive classes (D-402 [4], D-405): lore, game stat (KOTOR Campaign Guide) or house default. */
export const HYPERDRIVE_CLASSES: Readonly<Record<string, { name: string; class: number; source: 'lore' | 'game stat' | 'house default' }>> = {
  ascendantSpear: { name: 'Ascendant Spear', class: 0.5, source: 'lore' },
  hammerhead: { name: 'Hammerhead-class cruiser', class: 2, source: 'game stat' },
  aurek: { name: 'Aurek-class tactical strikefighter', class: 2, source: 'game stat' },
  foray: { name: 'Foray-class blockade runner', class: 2, source: 'game stat' },
  kandosii: { name: 'Kandosii-type dreadnaught', class: 2, source: 'game stat' },
  valor: { name: 'Valor-class cruiser', class: 2, source: 'house default' },
  harrower: { name: 'Harrower-class dreadnought', class: 2, source: 'house default' },
  terminus: { name: 'Terminus-class destroyer', class: 1.5, source: 'house default' },
  thranta: { name: 'Thranta-class corvette', class: 1.5, source: 'house default' },
  fury: { name: 'Fury-class interceptor', class: 1, source: 'house default' },
  defender: { name: 'Defender-class corvette', class: 1.5, source: 'house default' },
  commonFreighter: { name: 'a common freighter', class: 2, source: 'house default' },
  smugglerShip: { name: 'a modified smuggler ship', class: 1.5, source: 'house default' },
  civilianTransport: { name: 'a civilian transport', class: 3, source: 'house default' },
};

/** The ship a character travels in until ships are data (M8): a smuggler start flies its own modified ship. */
export const DEFAULT_SHIP = 'commonFreighter';
export const START_SHIPS: Readonly<Record<string, string>> = { 'underworld-smuggler': 'smugglerShip' };

/**
 * The Hydian Way blockade (D-402 [3], [16]; narrowed in D-406). "Between Devaron and the Minos Cluster" is read as the
 * grid strip from Devaron's square (M-13) south to the Minos Cluster (M-20): columns L-N, rows 14-21 (an invented
 * reading of a stretch of space). In 3,661 (open from the start of 3,660, as the control table has it; D-411 [2]), for anyone but Mandalorians and Imperials:
 * - refused: a routine trip with an end on the Hydian Way inside the strip, or a trip along the Hydian Way through it
 *   (both ends Hydian Way worlds, with the strip's rows between them);
 * - other worlds in the strip are reachable, with the hop time × `detourFactor` (invented) for the detour.
 * Anyone with an end in the strip gets the narrator's `zoneNote`. Running the blockade is a story event (M8 item 4).
 */
export const BLOCKADE = {
  fromBby: 3661,
  toBby: 3661,
  route: 'Hydian Way',
  columns: ['L', 'M', 'N'],
  rowFrom: 14,
  rowTo: 21,
  passes: ['mandalorians', 'sithEmpire', 'sith'],
  detourFactor: 1.5,
  zoneNote: 'blockade zone: patrols, shortages, scarce passage',
} as const;
