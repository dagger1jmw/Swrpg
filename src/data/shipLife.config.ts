// Ship life (m8-ship-life, M8 checklist item 13 part 2; D-519; docs-v2/spec/ship-life.md). Owning and running ships: what each
// class carries beyond its guns (hyperdrive, cargo, consumables, crew, modification capacity), the modifications, travel off
// the charted routes, customs and scans, shipyard repairs, wear and breakdowns, crew wages, passage. Lore:
// SW_Starships_Classes.md (classes, the hyperdrive ruling, modifications, transponders); prices and running costs through the
// economy (shipPrices.ts). Every number marked `invented` has no source; spec section 12 lists them all.
import type { ShipKind } from './ships';

// ---- hyperdrives (ruling 1, Jared, 23 Nov 2026) ----

/**
 * Drives improved by the Mandalorian Wars (3,976-3,960 BBY): after that ordinary ships are Class 2-3 and exceptional ones
 * Class 1; older designs still flying keep their slow drives unless refitted. A class whose service began before the wars'
 * end and whose drive no source gives keeps OLD_DESIGN_DRIVE (invented, inside WEG's Class 7-15 for c. 4,000 BBY ships).
 */
export const MANDALORIAN_WARS_END = -3960;
export const OLD_DESIGN_DRIVE = 8;
/** A class with no drive on record, by kind (invented: the ruling's ordinary Class 2; fighters as listed below). */
export const DRIVE_BY_KIND: Readonly<Record<ShipKind, number | null>> = { fighter: null, freighter: 2, corvette: 2, frigate: 2, heavyCruiser: 2, starDestroyer: 2, battleship: 2, battlecruiser: 2, dreadnought: 2 };

export type Tier = 'lore' | 'game stat' | 'ruling' | 'house default' | 'invented';

/** What a class carries beyond the combat data (data/ships.ts): each field with its source. */
export interface ClassLife {
  /** Hyperdrive class (lower is faster; Class 1 is the travel base); null = no hyperdrive. */
  drive: number | null;
  driveTier: Tier;
  cargoT?: number;
  consumablesDays?: number;
  crew?: number;
  passengers?: number;
  /** Modification capacity points (invented throughout; the Dynamic-class high, military ships low). */
  capacity?: number;
  /** Hidden compartments built in (the XS's "many hidden compartments as standard"), as a compartment quality. */
  builtInCompartments?: CompartmentQuality;
  note?: string;
}

const G = 'game stat';
/** By class id (data/ships.ts). Absent fields come from the kind's defaults (CLASS_LIFE_BY_KIND, invented). */
export const CLASS_LIFE: Readonly<Record<string, ClassLife>> = {
  aurek: { drive: 2, driveTier: G, crew: 1, note: 'Class 2 (KOTOR CG)' },
  sithFighter: { drive: null, driveTier: 'invented', consumablesDays: 1, crew: 1, note: 'one day of provisions (lore)' },
  davaab: { drive: 2, driveTier: G, crew: 1 },
  liberator: { drive: 2, driveTier: 'invented', crew: 1, note: 'the Republic fighter of the era, after the Aurek' },
  supremacy: { drive: null, driveTier: 'invented', crew: 1, note: 'a carrier-borne interceptor' },
  extinction: { drive: null, driveTier: 'invented', crew: 2 },
  vulture: { drive: null, driveTier: 'invented', crew: 0 },
  arc170: { drive: 1.5, driveTier: G, crew: 3 },
  vwing: { drive: null, driveTier: 'lore', crew: 1, note: 'no hyperdrive: a booster ring (lore)' },
  xwing: { drive: 1, driveTier: G, crew: 1 },
  ywing: { drive: 1, driveTier: G, crew: 2 },
  awing: { drive: 1, driveTier: G, crew: 1 },
  bwing: { drive: 2, driveTier: G, crew: 1 },
  tieln: { drive: null, driveTier: 'lore', crew: 1 },
  tiein: { drive: null, driveTier: 'lore', crew: 1 },
  tiesa: { drive: null, driveTier: 'lore', crew: 1 },
  tied: { drive: 2, driveTier: G, crew: 1 },
  dynamic: { drive: 3, driveTier: G, cargoT: 60, crew: 2, passengers: 6, capacity: 10, note: 'built to accept modifications (lore); 80,000 new, 30,000 used (game stat)' },
  xsFreighter: { drive: 2, driveTier: 'ruling', cargoT: 120, crew: 2, passengers: 6, capacity: 8, builtInCompartments: 'good', note: 'many hidden compartments as standard; powerful engines (lore)' },
  lethisk: { drive: 2, driveTier: G, cargoT: 60, crew: 3, capacity: 5 },
  ebonHawk: { drive: 1, driveTier: 'lore', cargoT: 60, crew: 2, passengers: 6, capacity: 10, builtInCompartments: 'good', note: 'Class 1 replacing the stock Class 3; code-locked compartments (lore)' },
  hammerhead: { drive: 2, driveTier: G, cargoT: 4000, crew: 300, passengers: 400 },
  derriphan: { drive: 4, driveTier: G, crew: 25, passengers: 850 },
  interdictorCruiser: { drive: 2, driveTier: G, cargoT: 11000, crew: 5224, passengers: 3600 },
  centurion: { drive: 2, driveTier: 'invented', crew: 31452 },
  inexpugnable: { drive: 2, driveTier: G, cargoT: 50000, crew: 4300 },
  kandosii: { drive: 2, driveTier: G, crew: 10000 },
  thranta: { drive: 1.5, driveTier: 'house default', crew: 300 },
  defender: { drive: 1.5, driveTier: 'house default', crew: 5, passengers: 8, cargoT: 80, capacity: 5, note: 'built for Jedi missions on a consumer corvette (lore)' },
  fury: { drive: 1, driveTier: 'house default', crew: 4, passengers: 15, capacity: 3, note: 'interceptor and personal transport (lore)' },
  valor: { drive: 2, driveTier: 'house default', crew: 1900, passengers: 5000 },
  harrower: { drive: 2, driveTier: 'house default', crew: 2400, passengers: 7300 },
  terminus: { drive: 1.5, driveTier: 'house default', crew: 520, passengers: 285 },
  dreadnaught: { drive: 2, driveTier: G, crew: 16113 },
  acclamator: { drive: 0.6, driveTier: G, crew: 700 },
  venator: { drive: 1, driveTier: G, crew: 7400 },
  victory1: { drive: 1, driveTier: G, crew: 5200 },
  victory2: { drive: 1, driveTier: G, crew: 5200 },
  isd1: { drive: 2, driveTier: G, crew: 37000 },
  isd2: { drive: 2, driveTier: G, crew: 37000 },
  executor: { drive: 2, driveTier: G, crew: 280000 },
  lancer: { drive: 2, driveTier: G, crew: 850 },
  nebulonB: { drive: 2, driveTier: G, crew: 850 },
  cr90: { drive: 2, driveTier: G, crew: 46, passengers: 600, capacity: 4 },
  mc80Liberty: { drive: 1, driveTier: G, crew: 5400 },
  mc80a: { drive: 1, driveTier: G, crew: 5400 },
};

/** Defaults by kind where a class gives none (invented). Military ships (role not freighter) halve the capacity. */
export const CLASS_LIFE_BY_KIND: Readonly<Record<ShipKind, { cargoT: number; consumablesDays: number; crew: number; passengers: number; capacity: number }>> = {
  fighter: { cargoT: 0.1, consumablesDays: 2, crew: 1, passengers: 0, capacity: 2 },
  freighter: { cargoT: 50, consumablesDays: 60, crew: 2, passengers: 4, capacity: 6 },
  corvette: { cargoT: 300, consumablesDays: 180, crew: 40, passengers: 50, capacity: 4 },
  frigate: { cargoT: 3000, consumablesDays: 365, crew: 400, passengers: 200, capacity: 3 },
  heavyCruiser: { cargoT: 8000, consumablesDays: 730, crew: 2000, passengers: 1000, capacity: 2 },
  starDestroyer: { cargoT: 30000, consumablesDays: 730, crew: 7000, passengers: 3000, capacity: 2 },
  battleship: { cargoT: 50000, consumablesDays: 730, crew: 10000, passengers: 5000, capacity: 2 },
  battlecruiser: { cargoT: 50000, consumablesDays: 730, crew: 10000, passengers: 5000, capacity: 2 },
  dreadnought: { cargoT: 200000, consumablesDays: 1460, crew: 50000, passengers: 30000, capacity: 1 },
};
/** A military ship's capacity factor (invented: "low for military ships"). */
export const MILITARY_CAPACITY_X = 0.5;

// ---- modifications ----

export const MOD_TYPES = ['engines', 'weapons', 'defence', 'sensors', 'cargo', 'illegal'] as const;
export type ModType = (typeof MOD_TYPES)[number];
/** Legal anywhere; military-grade (illegal for civilians in Republic or Imperial space); ID-altering or masking (illegal). */
export type ModLegality = 'legal' | 'military' | 'illegal';
export const COMPARTMENT_QUALITIES = ['basic', 'good', 'shielded'] as const;
export type CompartmentQuality = (typeof COMPARTMENT_QUALITIES)[number];

export interface ModDef {
  id: string;
  name: string;
  type: ModType;
  /** Capacity points it uses. */
  points: number;
  /** Price: a share of the ship's new price, or flat credits; whichever is larger. */
  share: number;
  flat: number;
  /** Needs a shipyard (big), or a crew member's Repair roll will do (small). */
  big: boolean;
  legality: ModLegality;
  /** What it does (read by engine/shipLife.ts). */
  effect: { driveStep?: number; speed?: number; handling?: number; shieldX?: number; hullX?: number; weapons?: number; scan?: number; astrogation?: number; cargoX?: number; compartment?: CompartmentQuality; mask?: number; transponderMask?: boolean; jammer?: number };
  /** In service from (campaign year); absent = always. */
  from?: number;
  note: string;
}

/** The mods (all prices, points and effects invented; the kinds are the lore's and the design notes'). */
export const SHIP_MODS: readonly ModDef[] = [
  { id: 'hyperdrive', name: 'hyperdrive upgrade', type: 'engines', points: 3, share: 0.15, flat: 15000, big: true, legality: 'legal', effect: { driveStep: 1 }, note: 'one class faster (the Ebon Hawk: Class 3 to 1 took two)' },
  { id: 'engines', name: 'sublight engine boost', type: 'engines', points: 2, share: 0.08, flat: 6000, big: false, legality: 'legal', effect: { speed: 2, handling: 1 }, note: 'faster and nimbler; the Ebon Hawk ran at twice the class speed' },
  { id: 'weapons', name: 'upgraded guns', type: 'weapons', points: 2, share: 0.1, flat: 8000, big: true, legality: 'legal', effect: { weapons: 1 }, note: 'heavier civilian-grade cannons' },
  { id: 'militaryWeapons', name: 'military-grade weapons', type: 'weapons', points: 3, share: 0.25, flat: 25000, big: true, legality: 'military', effect: { weapons: 2 }, note: 'turbolaser turrets, warhead launchers; illegal for civilians in Republic or Imperial space' },
  { id: 'shields', name: 'shield generator upgrade', type: 'defence', points: 2, share: 0.1, flat: 8000, big: true, legality: 'legal', effect: { shieldX: 1.25 }, note: '+25% shields' },
  { id: 'armour', name: 'armour plating', type: 'defence', points: 2, share: 0.08, flat: 6000, big: true, legality: 'legal', effect: { hullX: 1.2, handling: -1 }, note: '+20% hull, a little heavier' },
  { id: 'sensors', name: 'sensor suite', type: 'sensors', points: 1, share: 0.04, flat: 3000, big: false, legality: 'legal', effect: { scan: 3 }, note: 'better scans (spots trouble, reads a customs cutter first)' },
  { id: 'jammer', name: 'sensor jammer', type: 'sensors', points: 1, share: 0.05, flat: 4000, big: false, legality: 'legal', effect: { jammer: 1 }, note: 'confuses warhead locks' },
  { id: 'navCharts', name: 'navicomputer charts', type: 'sensors', points: 1, share: 0, flat: 1500, big: false, legality: 'legal', effect: { astrogation: 2 }, note: 'charts beyond the lanes (+2 on astrogation rolls)' },
  { id: 'cargo', name: 'cargo expansion', type: 'cargo', points: 2, share: 0.05, flat: 4000, big: true, legality: 'legal', effect: { cargoX: 1.5 }, note: '+50% hold' },
  { id: 'compartment', name: 'hidden compartment', type: 'cargo', points: 1, share: 0, flat: 2000, big: false, legality: 'legal', effect: { compartment: 'basic' }, note: 'beats a basic search, not a boarding inspection' },
  { id: 'shieldedCompartment', name: 'sensor-shielded compartment', type: 'cargo', points: 2, share: 0, flat: 12000, big: true, legality: 'illegal', effect: { compartment: 'shielded' }, note: 'lined against scans (the lore\'s cloaked compartment is a later product; a cruder lining here)' },
  { id: 'sensorMask', name: 'sensor masking', type: 'illegal', points: 2, share: 0.1, flat: 10000, big: true, legality: 'illegal', effect: { mask: 4 }, note: 'muffles engine and weapon signatures (lore: sensor-stealth system)' },
  { id: 'transponderMask', name: 'transponder mask', type: 'illegal', points: 1, share: 0, flat: 15000, big: false, legality: 'illegal', effect: { transponderMask: true }, note: 'switches between two codes on record (the lore\'s example is later-era)' },
];
export const MOD_BY_ID: ReadonlyMap<string, ModDef> = new Map(SHIP_MODS.map((m) => [m.id, m]));

/**
 * Mods in battle (Jared, 26 Nov 2026; m8-ground Part B2; numbers invented): weapon mods add a barrel to every gun mount (upgraded
 * guns), and military-grade weapons add a barrel and heavier guns on the mount (x1.3); a jammer is +2 on the evasion roll against
 * a torpedo lock, beside decoys (+4); a sensor suite reads the enemy: +1 on the dogfight position roll, the enemy formation known in
 * a fleet battle, and an ambush spotted sooner (the ambusher starts 1 up the track, not 2).
 */
export const MOD_BATTLE = { barrels: { 1: 1, 2: 1 } as Readonly<Record<number, number>>, heavy: { 1: 1, 2: 1.3 } as Readonly<Record<number, number>>, jammer: 2, sensorsPosition: 1, ambushSpotted: 1 } as const;

/** Installing a mod (invented): a factory kit costs this much more and needs no roll; a shipyard charges labour on the parts. */
export const MOD_INSTALL = {
  kitX: 1.5,
  shipyardLabour: 0.3,
  /** A crew member's Repair roll for a small mod: the rating to beat; a failure loses this share of the parts. */
  fieldRating: 45,
  failLoss: 0.5,
  /** Days in a shipyard: a base plus per point; hours for a field job per point. */
  yardDays: 2,
  yardDaysPerPoint: 1,
  fieldHoursPerPoint: 6,
} as const;
/** The hyperdrive step table: an upgrade moves a drive one step faster (invented; Class 1 is the ruling's "exceptional"). */
export const DRIVE_STEPS: readonly number[] = [15, 12, 10, 8, 6, 4, 3, 2, 1.5, 1, 0.75, 0.5];

// ---- wear, breakdowns, repairs ----

/**
 * Wear (0 = new or just overhauled, 1 = worn out). Rises with jumps and months without an overhaul, and with battle damage
 * carried; an overhaul at a shipyard clears it (all invented).
 */
export const WEAR = { perJump: 0.004, perMonth: 0.015, perHullLost: 0.3, badly: 0.5, missedUpkeep: 0.03 } as const;

/**
 * Breakdowns (ruled by Jared, 23 Nov 2026): a roll when the ship is pushed (an emergency jump, overloaded systems, hard
 * manoeuvres, running damaged), plus a small chance on every jump for a badly worn or heavily over-modded ship. A well-kept
 * stock ship almost never breaks down. Chances invented.
 */
export const BREAKDOWN = {
  pushedBase: 0.005,
  pushedPerWear: 0.2,
  pushedPerOver: 0.06,
  pushedDamaged: 0.1,
  /** Every jump: only past WEAR.badly or `overHeavy` points over capacity. */
  jumpBase: 0.02,
  jumpPerWear: 0.12,
  jumpPerOver: 0.02,
  overHeavy: 3,
  /** A field patch gives way under strain: per patched system, when pushed. */
  patchFails: 0.25,
  /** Hours lost to a breakdown in transit (a reversion, a drift while it is fixed). */
  hours: [6, 48] as readonly [number, number],
} as const;
export const PUSHES = ['emergencyJump', 'overload', 'hardManoeuvres', 'runningDamaged'] as const;
export type Push = (typeof PUSHES)[number];

/** Shipyard work by size (days for light / heavy / crippling damage; invented). Destroyed systems: parts as a share of price. */
export const YARD_DAYS: Readonly<Record<'fighter' | 'freighter' | 'corvette' | 'capital', readonly [number, number, number]>> = {
  fighter: [1, 3, 7],
  freighter: [2, 5, 12],
  corvette: [4, 10, 25],
  capital: [7, 21, 60],
};
export const REPLACEMENT_PART_SHARE = 0.03;
/** An overhaul (wear back to 0): this share of the price and the light-damage days (invented). */
export const OVERHAUL_SHARE = 0.02;

// ---- travel ----

/** Off the charted routes (design notes, Travel): a leg per grid square (at least 2); an astrogation roll a leg (invented DCs). */
export const ASTROGATION = {
  legDc: { core: 10, colonies: 11, mid: 12, outer: 14, wild: 16, deep: 18 } as Readonly<Record<string, number>>,
  /** Givin and Siniteen calculate jumps in their heads (lore): a bonus (invented). */
  calculators: { givin: 4, siniteen: 4 } as Readonly<Record<string, number>>,
  /** A failed leg: a reversion short of the mark (hours lost); failed by `misjumpBy` or more, a misjump (a hazard). */
  reversionHours: [2, 12] as readonly [number, number],
  misjumpBy: 5,
  misjumpSeverity: 2,
  minLegs: 2,
} as const;
/** Supplies a crew member uses a day aboard, and their price when restocked (invented). */
export const CONSUMABLE_CREW_DAY = 10;
/** Docking by lifestyle (invented: the poorer berths and the better ones). Issued ships dock free (the issuer pays). */
export const DOCK_LIFESTYLE_X: Readonly<Record<string, number>> = { destitute: 0.5, poor: 0.6, modest: 1, comfortable: 1.5, wealthy: 3, provided: 0 };

/** Passage on a liner or freighter (invented): a base plus per grid square, by berth; the liner's drive. */
export const PASSAGE = {
  base: { steerage: 40, standard: 100, luxury: 400 } as Readonly<Record<'steerage' | 'standard' | 'luxury', number>>,
  perSquare: { steerage: 8, standard: 20, luxury: 70 } as Readonly<Record<'steerage' | 'standard' | 'luxury', number>>,
  drive: 2,
} as const;
/** The berth a lifestyle buys (invented). */
export const BERTH_BY_LIFESTYLE: Readonly<Record<string, 'steerage' | 'standard' | 'luxury'>> = { destitute: 'steerage', poor: 'steerage', modest: 'standard', comfortable: 'standard', wealthy: 'luxury', provided: 'standard' };

// ---- customs and scans ----

/** Chance of a check on arrival by market zone (dense in the Core and war zones, light in the Outer Rim and Hutt space; invented). */
export const CUSTOMS_DENSITY: Readonly<Record<string, number>> = { core: 0.6, mid: 0.35, outer: 0.15, hutt: 0.1, remote: 0.05 };
export const CUSTOMS = {
  /** A world of a side at war: x this. A flagged ship: x this. Caps the chance. */
  warX: 1.3,
  flaggedX: 2,
  cap: 0.95,
  /** Standing: a Jedi in Republic space, a member of the side that holds the world, its enemy (invented). */
  standingX: { jedi: 0.3, member: 0.6, enemy: 1.5 } as Readonly<Record<string, number>>,
  /** Inspectors' scan skill and their equipment (invented). Police and military ships can scan for a true identity (lore). */
  inspectors: {
    port: { level: 35, gear: 0, trueId: false },
    police: { level: 45, gear: 2, trueId: true },
    military: { level: 55, gear: 4, trueId: true },
  } as Readonly<Record<'port' | 'police' | 'military', { level: number; gear: number; trueId: boolean }>>,
  /** Concealment: compartment quality, masking from mods, the crew's bluff (the player's Charisma roll). */
  compartment: { basic: 3, good: 5, shielded: 7 } as Readonly<Record<CompartmentQuality, number>>,
  /** A thorough boarding inspection: compartments count only if shielded, at half. */
  thoroughShielded: 0.5,
  /** An altered transponder's quality against a true-identity scan (the work's rating; invented). */
  alteredRating: 12,
  /** What counts as major contraband: units in the hold (invented). */
  majorUnits: 5,
  /** A fine by finding (economy FINE_SIZES: small, fair, large) and a corrupt inspector's bribe as a share of it. */
  bribeShare: 0.5,
  /** Inspectors who would take a bribe instead of a fine (invented; by the check's seed). */
  corruptShare: 0.4,
} as const;
export const CUSTOMS_OUTCOMES = ['clear', 'fine', 'bribe', 'impoundCargo', 'impoundShip', 'arrest', 'chase'] as const;
export type CustomsOutcome = (typeof CUSTOMS_OUTCOMES)[number];

// ---- ownership, crew, renown ----

export const SHIP_HOLDS = ['owned', 'issued', 'stolen'] as const;
export type ShipHold = (typeof SHIP_HOLDS)[number];
export const SHIP_HOW = ['bought', 'boughtUsed', 'financed', 'issued', 'won', 'salvaged', 'stolen', 'taken', 'start'] as const;
export type ShipHow = (typeof SHIP_HOW)[number];
export const TRANSPONDERS = ['real', 'altered', 'missing'] as const;
export type Transponder = (typeof TRANSPONDERS)[number];
export const CREW_ROLES = ['pilot', 'copilot', 'gunner', 'engineer', 'medic', 'hand'] as const;
export type CrewRole = (typeof CREW_ROLES)[number];

/** Financing a ship (invented): the deposit the wallet pays; the rest a bank loan if the bank would lend, else a Hutt's. */
export const SHIP_FINANCE = { deposit: 0.2 } as const;

/**
 * Crew (design notes, Ownership; invented numbers): paid crew draw wages on the calendar through the economy (WAGES by tier);
 * a companion serves for a share of the character's earnings or for loyalty. Loyalty 0-5; an unpaid month costs one, and at 0
 * they leave. Generic crew levels by role.
 */
export const CREW = {
  startLoyalty: { wage: 3, share: 3, loyalty: 4 } as Readonly<Record<'wage' | 'share' | 'loyalty', number>>,
  unpaidLoss: 1,
  wageTier: { pilot: 'skilled', copilot: 'skilled', gunner: 'skilled', engineer: 'skilled', medic: 'professional', hand: 'menial' } as Readonly<Record<CrewRole, 'menial' | 'skilled' | 'professional'>>,
  level: { pilot: 40, copilot: 30, gunner: 35, engineer: 40, medic: 40, hand: 20 } as Readonly<Record<CrewRole, number>>,
  /** A share crew member's cut of the character's smuggling, contract and bounty pay. */
  share: 0.1,
} as const;

/** A stolen ship's former owner finds it: a chance a week while the old transponder still reads (invented). */
export const HUNTED_WEEKLY = 0.05;

/**
 * Ship renown (design notes, Ownership; the renown system is not built, so the ship keeps its own fame for it to read): points
 * from battles won in it and blockades run; recognised from `known`. A changed ID resets it. Numbers invented.
 */
export const SHIP_RENOWN = { battleWon: 5, majorBattleWon: 15, blockadeRun: 8, known: 20, famous: 50, max: 100 } as const;

/** The starting ship by start option (readings of the start options; invented names and mods). */
export const START_SHIPS_BY_OPTION: Readonly<Record<string, { classId: string; how: ShipHow; hold: ShipHold; mods: readonly string[]; names: readonly string[] }>> = {
  'underworld-smuggler': { classId: 'xsFreighter', how: 'start', hold: 'owned', mods: ['hyperdrive', 'engines', 'compartment', 'sensorMask'], names: ['Kessel Dawn', 'Second Chance', 'Lucky Strike', 'Night Market', 'Rimward Star', 'Long Odds'] },
  'republic-pilot': { classId: 'liberator', how: 'issued', hold: 'issued', mods: [], names: ['Talon Seven', 'Blue Four', 'Gold Two', 'Red Nine'] },
};
