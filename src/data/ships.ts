// Ship classes as data (Jared, 2026-11-25; D-505; docs-v2/spec/combat-scales.md). Armament: SW_Starships_Classes.md, "Class
// armament and shields". What no source gives is filled from comparable ships (ruling 2, 23 Nov 2026) and listed in the built
// class's `invented` (engine/ships.ts adds the curve-filled fields). `weak`: 2014 FFG armament counts, kept (ruling 7).
// Arc splits are lore or game only where a note says so; the rest are invented.

export const FACINGS = ['fore', 'aft', 'port', 'starboard'] as const;
export type Facing = (typeof FACINGS)[number];
export type Arc = Facing | 'all';
export const SHIP_KINDS = ['fighter', 'freighter', 'corvette', 'frigate', 'heavyCruiser', 'starDestroyer', 'battleship', 'battlecruiser', 'dreadnought'] as const;
export type ShipKind = (typeof SHIP_KINDS)[number];
/** A dedicated carrier has few weapons and weak shields; a warship-carrier is a real warship (lore, ROTS ICS). */
export type ShipRole = 'fighter' | 'interceptor' | 'bomber' | 'freighter' | 'warship' | 'warshipCarrier' | 'carrier' | 'escort' | 'command';

export interface Mount {
  weapon: string;
  /** Bolts a mount fires in a volley (a dual turret 2, an octuple barbette 8). */
  barrels: number;
  arcs: Partial<Record<Arc, number>>;
  /** A crewed turret (freighters): any direction. */
  turret?: boolean;
  /** Warheads a tube carries. */
  ammo?: number;
  /** Guns with power settings (DBY-827: seven, lore). */
  settings?: boolean;
}

export interface ShipSpec {
  id: string;
  name: string;
  kind: ShipKind;
  role: ShipRole;
  /** In service, calendar years (negative = BBY); absent = no start or end on record. */
  from?: number;
  to?: number;
  len?: number;
  /** The length used for the curves when none is on record (a comparable ship's). */
  like?: number;
  /** Rated shields and hull: game stats (SBD, RU), or a comparable ship's where `invented` says so. */
  sbd?: number;
  ru?: number;
  /** Multipliers on the curve where nothing rates it. */
  shieldX?: number;
  hullX?: number;
  watts?: number;
  generators?: number;
  hardy?: boolean;
  weapons: readonly Mount[];
  hangar?: readonly { classId: string; count: number }[];
  /** On piloting and evasion rolls. */
  handling: number;
  /** Sublight, 0-10, for who sets the range; 5 when absent. */
  speed?: number;
  /** Almost all the reactor to the guns (the Venator, lore). */
  trueWarship?: boolean;
  /** Guns on the flanks also bear ahead, and the ship is poor in close broadsides (lore). */
  wedge?: boolean;
  /** Two arcs bear on any target, all of them on several (Mon Calamari, lore). */
  allRound?: boolean;
  longTargeting?: boolean;
  /** Shield domes on a command tower. */
  domes?: number;
  decoys?: boolean;
  /** On the battle map. */
  letter: string;
  weak?: boolean;
  invented?: readonly string[];
  note?: string;
}

type Split = Partial<Record<Arc, number>>;
const even = (n: number): Split => ({ fore: n / 4, aft: n / 4, port: n / 4, starboard: n / 4 });
const flanks = (n: number): Split => ({ port: n / 2, starboard: n / 2 });
const ahead = (n: number): Split => ({ fore: n });
const forward = (n: number): Split => ({ fore: n * 0.4, port: n * 0.25, starboard: n * 0.25, aft: n * 0.1 });
const allArcs = (n: number): Split => ({ all: n });
const m = (weapon: string, barrels: number, arcs: Split, over: Partial<Mount> = {}): Mount => ({ weapon, barrels, arcs, ...over });

/** Guns in a battery where a game book counts batteries (invented). */
const BATTERY = 4;

const CC = -22;
const CE = -19;

const FIGHTERS: readonly ShipSpec[] = [
  { id: 'aurek', name: 'Aurek-class tactical strikefighter', kind: 'fighter', role: 'fighter', from: -4015, to: -1000, len: 9.2, sbd: 40, ru: 18, handling: 2, letter: 'f', weapons: [m('heavyLaser', 2, ahead(1)), m('torpedo', 1, ahead(2), { ammo: 3 })], invented: ['shields', 'hull', 'dates'], note: 'armament: game (KOTOR CG); pools after the X-wing' },
  { id: 'sithFighter', name: 'Sith fighter (Star Forge)', kind: 'fighter', role: 'interceptor', from: -3959, to: -3950, len: 7, sbd: 0, ru: 14, handling: 3, letter: 'f', weapons: [m('laser', 2, ahead(1))], invented: ['shields', 'hull', 'weapons'], note: 'after the TIE/LN' },
  { id: 'davaab', name: 'Davaab-type starfighter', kind: 'fighter', role: 'fighter', from: -3976, to: -3950, len: 8.8, sbd: 30, ru: 16, handling: 2, letter: 'f', weapons: [m('laser', 2, ahead(1)), m('missile', 1, ahead(1), { ammo: 4 })], invented: ['shields', 'hull', 'weapons'], note: 'invented throughout' },
  { id: 'liberator', name: 'Liberator-class starfighter', kind: 'fighter', role: 'fighter', from: -3700, to: -3600, like: 12, sbd: 45, ru: 18, handling: 2, letter: 'f', weapons: [m('laser', 2, ahead(1)), m('torpedo', 1, ahead(1), { ammo: 4 })], invented: ['shields', 'hull', 'weapons'], note: '2 lasers (game stat); the rest after the Aurek' },
  { id: 'supremacy', name: 'Mark VI Supremacy-class starfighter', kind: 'fighter', role: 'interceptor', from: -3681, to: -3600, like: 10, sbd: 25, ru: 14, handling: 3, letter: 'f', weapons: [m('laser', 2, ahead(1))], invented: ['shields', 'hull', 'weapons'], note: 'invented throughout' },
  { id: 'extinction', name: 'B28 Extinction-class bomber', kind: 'fighter', role: 'bomber', from: -3681, to: -3600, like: 14, sbd: 40, ru: 34, handling: -1, letter: 'b', weapons: [m('laser', 2, ahead(1)), m('torpedo', 1, ahead(2), { ammo: 4 })], invented: ['shields', 'hull', 'weapons'], note: 'after the Y-wing and the TIE bomber' },
  { id: 'vulture', name: 'Vulture-class droid starfighter', kind: 'fighter', role: 'interceptor', from: -32, to: CE, like: 4, sbd: 0, ru: 8, handling: 2, letter: 'f', weapons: [m('lightLaser', 4, ahead(1))], invented: ['shields', 'hull', 'weapons'], note: "not in the lore files' tables; after the TIE/LN" },
  { id: 'arc170', name: 'ARC-170', kind: 'fighter', role: 'bomber', from: CC, like: 14, sbd: 70, ru: 36, handling: 0, letter: 'f', weapons: [m('laser', 2, ahead(1)), m('laser', 2, { aft: 1 }, { turret: true }), m('torpedo', 1, ahead(1), { ammo: 6 })], invented: ['shields', 'hull'], note: 'armament lore; pools after the Y-wing' },
  { id: 'vwing', name: 'Alpha-3 Nimbus V-wing', kind: 'fighter', role: 'interceptor', from: CE, like: 8, sbd: 30, ru: 14, handling: 3, letter: 'f', weapons: [m('lightLaser', 4, ahead(1))], invented: ['shields', 'hull'], note: 'two light twin lasers (ROTS ICS)' },
  { id: 'xwing', name: 'T-65 X-wing', kind: 'fighter', role: 'fighter', from: -1, like: 12, sbd: 50, ru: 20, handling: 2, letter: 'f', weapons: [m('laser', 4, ahead(1)), m('torpedo', 1, ahead(2), { ammo: 3 })], invented: ['dates'] },
  { id: 'ywing', name: 'BTL Y-wing', kind: 'fighter', role: 'bomber', from: CC, like: 16, sbd: 75, ru: 40, handling: -1, letter: 'b', weapons: [m('laser', 2, ahead(1)), m('lightIon', 2, allArcs(1), { turret: true }), m('torpedo', 1, ahead(2), { ammo: 4 })] },
  { id: 'awing', name: 'RZ-1 A-wing', kind: 'fighter', role: 'interceptor', from: -1, like: 10, sbd: 50, ru: 14, handling: 4, letter: 'f', weapons: [m('laser', 2, ahead(1)), m('missile', 1, ahead(2), { ammo: 6 })], invented: ['dates'] },
  { id: 'bwing', name: 'A/SF-01 B-wing', kind: 'fighter', role: 'bomber', from: 0, like: 17, sbd: 100, ru: 60, handling: -1, letter: 'b', weapons: [m('heavyLaser', 1, ahead(1)), m('autoblaster', 2, ahead(1)), m('lightIon', 3, ahead(1)), m('torpedo', 1, ahead(2), { ammo: 4 })], note: '8 torpedoes: the most-cited load (SotG 2001, CCS); ruling 6' },
  { id: 'tieln', name: 'TIE/LN', kind: 'fighter', role: 'interceptor', from: -19, like: 6, sbd: 0, ru: 9, handling: 3, letter: 'f', weapons: [m('laser', 2, ahead(1))], invented: ['dates'] },
  { id: 'tiein', name: 'TIE/IN Interceptor', kind: 'fighter', role: 'interceptor', from: -1, like: 10, sbd: 0, ru: 16, handling: 3, letter: 'f', weapons: [m('laser', 4, ahead(1))], note: '4 lasers: the most-cited figure (Starfighter Battle Book, The Stele Chronicles); ruling 6' },
  { id: 'tiesa', name: 'TIE/sa bomber', kind: 'fighter', role: 'bomber', from: -19, like: 8, sbd: 0, ru: 28, handling: -1, letter: 'b', weapons: [m('laser', 2, ahead(1)), m('torpedo', 1, ahead(2), { ammo: 4 }), m('missile', 1, ahead(2), { ammo: 8 })], invented: ['dates'] },
  { id: 'tied', name: 'TIE/D Defender', kind: 'fighter', role: 'fighter', from: 3, like: 7, sbd: 100, ru: 14, handling: 4, letter: 'f', weapons: [m('laser', 4, ahead(1)), m('ion', 2, ahead(1)), m('torpedo', 1, ahead(2), { ammo: 3 })] },
];

const FREIGHTERS: readonly ShipSpec[] = [
  { id: 'dynamic', name: 'Dynamic-class freighter', kind: 'freighter', role: 'freighter', from: -3976, to: -3600, len: 27.24, handling: 0, letter: 'y', weapons: [m('laser', 2, allArcs(1), { turret: true })], invented: ['weapons'], note: 'modest stock arms and shields (lore); counts invented' },
  { id: 'xsFreighter', name: 'XS stock light freighter', kind: 'freighter', role: 'freighter', from: -3700, to: -3600, len: 101, shieldX: 0.6, hullX: 0.6, handling: 0, letter: 'y', weapons: [m('laser', 2, allArcs(2), { turret: true })], decoys: true, invented: ['weapons', 'decoys'], note: 'turrets fireable from the cockpit (lore); counts invented' },
  { id: 'lethisk', name: 'Lethisk-class armed freighter', kind: 'freighter', role: 'freighter', from: -3970, to: -3940, len: 34, shieldX: 1.4, hullX: 1.2, handling: 0, letter: 'y', weapons: [m('heavyLaser', 2, allArcs(1), { turret: true }), m('laser', 2, ahead(1))], invented: ['weapons'] },
  { id: 'ebonHawk', name: 'the Ebon Hawk', kind: 'freighter', role: 'freighter', from: -3956, to: -3950, len: 27.24, shieldX: 1.6, hullX: 1.2, handling: 1, speed: 9, letter: 'Y', weapons: [m('lightTurbolaser', 2, allArcs(1), { turret: true }), m('heavyLaser', 2, ahead(1))], decoys: true, invented: ['weapon counts', 'decoys'], note: "twin turbolaser turrets, heavy lasers (lore); turrets sluggish against fast fighters (lore: the turbolaser's tracking)" },
];

const CAPITALS: readonly ShipSpec[] = [
  { id: 'hammerhead', name: 'Hammerhead-class cruiser', kind: 'frigate', role: 'warship', from: -5000, to: -1000, len: 315, handling: -2, letter: 'H', weapons: [m('lightTurbolaser', 2 * BATTERY, allArcs(4)), m('turbolaser', BATTERY, ahead(2)), m('pdLightLaser', BATTERY, even(2))], hangar: [{ classId: 'aurek', count: 12 }], invented: ['guns a battery'], note: 'armament game (KOTOR CG), in batteries' },
  { id: 'derriphan', name: 'Derriphan-class battleship', kind: 'frigate', role: 'warship', from: -5000, to: -3950, len: 215, handling: -2, letter: 'D', weapons: [m('turbolaser', 1, forward(8)), m('pdLaser', 1, even(4))], invented: ['weapons'] },
  { id: 'interdictorCruiser', name: 'Interdictor-class cruiser', kind: 'heavyCruiser', role: 'warship', from: -3963, to: -3600, len: 600, handling: -3, letter: 'I', wedge: true, weapons: [m('turbolaser', BATTERY, forward(5)), m('pdLightLaser', BATTERY, even(6))], hangar: [{ classId: 'sithFighter', count: 48 }], invented: ['guns a battery'], note: 'armament game (KOTOR CG), in batteries' },
  { id: 'centurion', name: 'Centurion-class battlecruiser', kind: 'starDestroyer', role: 'warship', from: -3960, to: -3600, len: 1200, handling: -4, letter: 'C', wedge: true, weapons: [m('turbolaser', BATTERY, forward(6)), m('heavyIon', BATTERY, forward(6)), m('pdLightLaser', BATTERY, even(6))], hangar: [{ classId: 'sithFighter', count: 96 }], invented: ['guns a battery'], note: 'armament game (KOTOR CG), in batteries' },
  { id: 'inexpugnable', name: 'Inexpugnable-class tactical command ship', kind: 'battlecruiser', role: 'command', from: -3996, to: -3900, len: 3100, shieldX: 0.6, hullX: 0.6, handling: -5, speed: 4, letter: 'X', weapons: [m('turbolaser', 2, even(40)), m('pdLaser', 1, even(40))], hangar: [{ classId: 'aurek', count: 48 }], invented: ['weapons', 'hangar', 'dates'] },
  { id: 'kandosii', name: 'Kandosii-type dreadnaught', kind: 'starDestroyer', role: 'warshipCarrier', from: -3976, to: -3950, len: 1360, handling: -4, letter: 'K', weapons: [m('turbolaser', 1, forward(40)), m('pdLaser', 1, even(20))], hangar: [{ classId: 'davaab', count: 128 }], invented: ['weapons'] },
  { id: 'thranta', name: 'Thranta-class corvette', kind: 'corvette', role: 'warship', from: -3700, to: -3600, like: 280, handling: -1, speed: 7, letter: 'T', weapons: [m('turbolaser', 2, { all: 3, fore: 3 }), m('pdLaser', 1, even(6)), m('ion', 1, ahead(1)), m('missile', 1, ahead(2), { ammo: 10 })], hangar: [{ classId: 'liberator', count: 14 }], invented: ['weapon counts'], note: '6 twin turbolasers (game stat); lasers, an ion cannon, missiles and 14 Liberators (its page); the other counts invented. A Thranta is like a Hammerhead (ruling 2)' },
  { id: 'defender', name: 'Defender-class light corvette', kind: 'corvette', role: 'escort', from: -3681, to: -3600, len: 94, handling: 0, speed: 8, letter: 'd', weapons: [m('laser', 2, allArcs(2), { turret: true })], note: 'two sets of dual lasers (game stat)' },
  { id: 'fury', name: 'Fury-class Imperial interceptor', kind: 'corvette', role: 'escort', from: -3681, to: -3600, len: 100, handling: 1, speed: 8, letter: 'u', weapons: [m('laser', 4, ahead(1))], note: '4 laser cannons (game stat)' },
  { id: 'valor', name: 'Valor-class cruiser', kind: 'heavyCruiser', role: 'warshipCarrier', from: -3681, to: -3600, like: 800, handling: -3, letter: 'V', weapons: [m('turbolaser', BATTERY, forward(30)), m('quadLaser', 1, even(16)), m('heavyIon', 1, forward(8)), m('torpedo', 1, ahead(6), { ammo: 8 }), m('missile', 1, even(8), { ammo: 8 })], hangar: [{ classId: 'liberator', count: 110 }], invented: ['weapon counts'], note: 'weapon types and 110 fighters lore (SWTOR Encyclopedia; its 40 bombers have no class here); counts invented, after the Harrower; batteries of four' },
  { id: 'harrower', name: 'Harrower-class dreadnought', kind: 'heavyCruiser', role: 'warship', from: -3681, to: -3596, len: 800, hullX: 1.2, generators: 4, handling: -3, letter: 'H', wedge: true, weapons: [m('turbolaser', BATTERY, forward(32)), m('quadLaser', 1, even(16)), m('heavyIon', 1, forward(8)), m('torpedo', 1, ahead(6), { ammo: 8 }), m('missile', 1, even(8), { ammo: 8 })], hangar: [{ classId: 'supremacy', count: 95 }, { classId: 'extinction', count: 32 }], invented: ['weapon counts'], note: '32+ turbolaser batteries, 4 shield generators, reinforced hull, 95 and 32 small craft (lore); the other counts and the guns a battery invented' },
  { id: 'terminus', name: 'Terminus-class destroyer', kind: 'frigate', role: 'warship', from: -3653, to: -3600, like: 350, handling: -2, letter: 'T', wedge: true, weapons: [m('turbolaser', 1, { all: 5, fore: 7 }), m('pdLaser', 1, even(6)), m('ion', 1, ahead(1)), m('missile', 1, ahead(2), { ammo: 8 })], hangar: [{ classId: 'supremacy', count: 14 }], invented: ['weapon counts'], note: 'a match for a Thranta or a Hammerhead; one ion cannon, 14 fighters (lore); counts invented' },
  { id: 'dreadnaught', name: 'Dreadnaught-class heavy cruiser', kind: 'heavyCruiser', role: 'warship', from: -119, len: 600, sbd: 1920, ru: 1056, handling: -3, speed: 4, letter: 'D', weak: true, weapons: [m('turbolaser', 1, { fore: 5, aft: 5 }), m('lightTurbolaser', 4, flanks(20)), m('heavyLaser', 1, even(20))], hangar: [{ classId: 'ywing', count: 12 }], note: 'counts FFG 2014; its 12 fighters are whatever its side flies' },
  { id: 'acclamator', name: 'Acclamator-class assault ship', kind: 'heavyCruiser', role: 'warship', from: CC, len: 752, shieldX: 0.8, watts: 2e23, handling: -3, letter: 'A', wedge: true, weapons: [m('lightTurbolaser', 4, forward(12)), m('pdLightLaser', 1, even(24)), m('torpedo', 1, ahead(4), { ammo: 25 })], note: 'a troop transport; counts lore (AOTC ICS)' },
  { id: 'venator', name: 'Venator-class Star Destroyer', kind: 'starDestroyer', role: 'warshipCarrier', from: CC, len: 1137, shieldX: 0.9, hullX: 0.9, watts: 3.6e24, handling: -3, speed: 7, letter: 'V', wedge: true, trueWarship: true, weapons: [m('heavyTurbolaser', 2, flanks(8), { settings: true }), m('turbolaser', 2, ahead(2)), m('pdLaser', 2, even(52)), m('torpedo', 1, ahead(4), { ammo: 16 })], hangar: [{ classId: 'vwing', count: 192 }, { classId: 'arc170', count: 36 }], note: 'counts lore (ROTS ICS). Hangar from its page (192 V-wings or V-19s, 36 ARC-170s); its 192 Eta-2 have no class here' },
  { id: 'victory1', name: 'Victory I-class Star Destroyer', kind: 'starDestroyer', role: 'warship', from: -20, len: 900, sbd: 3200, ru: 1520, handling: -3, speed: 4, letter: 'v', wedge: true, weapons: [m('turbolaser', 4, flanks(10)), m('turbolaser', 2, { fore: 10, port: 15, starboard: 15 }), m('heavyMissile', 1, even(80), { ammo: 4 })], hangar: [{ classId: 'tieln', count: 24 }], note: 'arcs game (Imperial Sourcebook)' },
  { id: 'victory2', name: 'Victory II-class Star Destroyer', kind: 'starDestroyer', role: 'warship', from: -19, len: 900, sbd: 3200, ru: 1520, handling: -3, letter: 'v', wedge: true, weapons: [m('turbolaser', 4, flanks(16)), m('turbolaser', 2, { fore: 10, port: 15, starboard: 15 }), m('heavyIon', 1, forward(20))], hangar: [{ classId: 'tieln', count: 24 }], invented: ['weapon counts', 'shields', 'hull', 'dates'], note: 'missiles traded for ion cannons and turbolasers (lore); ratings after the Victory I' },
  { id: 'lucrehulk', name: 'Lucrehulk-class battleship', kind: 'battleship', role: 'warshipCarrier', from: -32, to: CE, len: 3170, shieldX: 0.6, hullX: 0.8, handling: -6, speed: 2, letter: 'L', weapons: [m('turbolaser', 4, even(48)), m('turbolaser', 1, even(3)), m('pdQuadLaser', 1, even(185)), m('laser', 1, even(472)), m('assaultLaser', 1, even(48))], hangar: [{ classId: 'vulture', count: 1500 }], note: 'a Venator flotilla breaks its shields with ease (ROTS ICS); counts lore and game' },
  { id: 'providence', name: 'Providence-class carrier/destroyer', kind: 'starDestroyer', role: 'warshipCarrier', from: CC, to: CE, len: 1088, watts: 1.08e24, handling: -3, letter: 'P', weapons: [m('turbolaser', 4, even(14)), m('pdLaser', 2, even(34)), m('heavyIon', 1, forward(2)), m('pdIon', 1, even(12)), m('torpedo', 1, forward(102), { ammo: 27 }), m('flak', 1, even(12))], hangar: [{ classId: 'vulture', count: 120 }], invented: ['hangar'], note: 'thermal shields are not used (ruling 4)' },
  { id: 'munificent', name: 'Munificent-class star frigate', kind: 'heavyCruiser', role: 'warship', from: CC, to: CE, len: 825, shieldX: 0.45, hullX: 0.6, watts: 2.07e23, handling: -3, letter: 'M', weapons: [m('prowTurbolaser', 1, ahead(2)), m('longIon', 1, ahead(2)), m('turbolaser', 2, flanks(26)), m('lightTurbolaser', 1, even(20)), m('pdLightLaser', 1, even(38))], hangar: [{ classId: 'vulture', count: 12 }], invented: ['hangar'], note: 'relatively fragile (EGW); counts lore (ROTS ICS)' },
  { id: 'recusant', name: 'Recusant-class light destroyer', kind: 'starDestroyer', role: 'warship', from: CC, to: CE, len: 1187, shieldX: 0.5, hullX: 0.6, watts: 7.73e23, handling: -3, letter: 'R', weapons: [m('prowTurbolaser', 1, ahead(1)), m('heavyTurbolaser', 1, ahead(4)), m('heavyTurbolaser', 1, flanks(6)), m('turbolaser', 1, even(5)), m('pdLaser', 2, even(30)), m('pdLightLaser', 2, even(12)), m('pdLightLaser', 1, even(60))], note: 'relatively fragile (EGW); counts lore (ROTS ICS)' },
  { id: 'isd1', name: 'Imperial I-class Star Destroyer', kind: 'starDestroyer', role: 'warship', from: -20, len: 1600, sbd: 4800, ru: 2272, watts: 7.73e24, handling: -4, speed: 6, letter: 'S', wedge: true, domes: 2, weapons: [m('heavyTurbolaser', 1, { fore: 20, port: 20, starboard: 20 }), m('heavyIon', 1, { fore: 20, port: 15, starboard: 15, aft: 10 }), m('heavyTurbolaser', 2, flanks(6)), m('heavyIon', 2, flanks(2)), m('pdLaser', 1, even(40))], hangar: [{ classId: 'tieln', count: 48 }, { classId: 'tiesa', count: 12 }], invented: ['dates'], note: 'arcs game (Imperial Sourcebook)' },
  { id: 'isd2', name: 'Imperial II-class Star Destroyer', kind: 'starDestroyer', role: 'warship', from: 0, len: 1600, shieldX: 1.1, hullX: 1.15, watts: 9.28e24, handling: -4, speed: 6, letter: 'S', wedge: true, domes: 2, weapons: [m('heavyTurbolaser', 1, { fore: 20, port: 15, starboard: 15 }), m('heavyTurbolaser', 1, { fore: 20, port: 10, starboard: 10, aft: 10 }), m('heavyIon', 1, { fore: 10, port: 5, starboard: 5 }), m('heavyTurbolaser', 8, flanks(8)), m('pdLaser', 1, even(40))], hangar: [{ classId: 'tieln', count: 48 }, { classId: 'tiein', count: 12 }, { classId: 'tiesa', count: 12 }], invented: ['point defence', 'hangar split'], note: 'point defence after the Imperial I; arcs game' },
  { id: 'executor', name: 'Executor-class Star Dreadnought', kind: 'dreadnought', role: 'command', from: -3, len: 19000, sbd: 96000, handling: -8, speed: 5, letter: 'E', wedge: true, domes: 2, weapons: [m('turbolaser', 2, even(250)), m('heavyTurbolaser', 2, even(250)), m('heavyMissile', 1, even(250), { ammo: 30 }), m('heavyIon', 1, even(250)), m('pdLaser', 1, even(500))], hangar: [{ classId: 'tieln', count: 96 }, { classId: 'tiein', count: 24 }, { classId: 'tiesa', count: 24 }], invented: ['hangar split', 'what a linked group is worth'], note: 'itemised counts game (Starship Battles): 2,000 and 2,000 turbolasers fire-linked in groups of eight; a group fires as one, and counts here as two bolts' },
  { id: 'interdictorSd', name: 'Interdictor-class Star Destroyer', kind: 'starDestroyer', role: 'command', from: -2, len: 1600, handling: -4, speed: 6, letter: 's', wedge: true, domes: 2, weak: true, weapons: [m('heavyTurbolaser', 1, forward(30)), m('heavyIon', 1, forward(30))], invented: ['dates'], note: 'counts FFG 2014' },
  { id: 'immobilizer', name: 'Immobilizer 418 cruiser', kind: 'heavyCruiser', role: 'command', from: -2, len: 600, sbd: 2240, ru: 960, generators: 12, handling: -3, letter: 'i', wedge: true, weapons: [m('quadLaser', 1, { fore: 10, port: 5, starboard: 5 })], hangar: [{ classId: 'tieln', count: 24 }], note: 'more than a dozen generators (NEGVV)' },
  { id: 'lancer', name: 'Lancer-class frigate', kind: 'frigate', role: 'escort', from: 0, len: 250, sbd: 576, ru: 304, handling: -1, letter: 'l', weapons: [m('pdQuadLaser', 1, even(20))], invented: ['dates'] },
  { id: 'nebulonB', name: 'EF76 Nebulon-B escort frigate', kind: 'frigate', role: 'escort', from: -2, len: 300, sbd: 960, ru: 448, handling: -1, letter: 'N', weapons: [m('turbolaser', 1, { fore: 6, port: 3, starboard: 3 }), m('pdLaser', 1, { fore: 6, port: 2, starboard: 2, aft: 2 })], hangar: [{ classId: 'xwing', count: 24 }], invented: ['dates'], note: 'its 24 fighters are whatever its side flies' },
  { id: 'tonFalk', name: 'Ton-Falk-class escort carrier', kind: 'heavyCruiser', role: 'carrier', from: -2, len: 500, sbd: 1600, ru: 912, handling: -4, letter: 'K', weapons: [m('pdLaser', 2, even(10)), m('missile', 1, ahead(4), { ammo: 15 })], hangar: [{ classId: 'tieln', count: 60 }, { classId: 'tiesa', count: 12 }], invented: ['dates', 'hangar split', 'tubes'] },
  { id: 'secutor', name: 'Secutor-class Star Destroyer', kind: 'battlecruiser', role: 'carrier', from: -2, len: 2200, shieldX: 0.7, handling: -5, letter: 'U', wedge: true, domes: 2, weak: true, weapons: [m('heavyTurbolaser', 1, forward(15)), m('lightTurbolaser', 1, forward(15)), m('heavyIon', 1, forward(15)), m('ion', 1, even(16))], hangar: [{ classId: 'tieln', count: 144 }], invented: ['dates', 'domes'], note: 'counts FFG 2014' },
  { id: 'cr90', name: 'CR90 corvette', kind: 'corvette', role: 'escort', from: -60, len: 150, sbd: 400, ru: 188, handling: 0, speed: 8, letter: 'r', weapons: [m('turbolaser', 2, allArcs(2)), m('turbolaser', 1, ahead(4))], invented: ['dates'] },
  { id: 'mc80Liberty', name: 'MC80 Liberty type', kind: 'starDestroyer', role: 'warship', from: 2, len: 1200, shieldX: 1.6, hullX: 0.8, generators: 15, hardy: true, handling: -3, letter: 'M', allRound: true, longTargeting: true, weak: true, weapons: [m('heavyTurbolaser', 1, even(48)), m('heavyIon', 1, even(20))], hangar: [{ classId: 'xwing', count: 24 }, { classId: 'bwing', count: 12 }, { classId: 'awing', count: 12 }], invented: ['hangar split', 'dates'], note: 'three times the usual generators (lore; the usual is 5 at this length); counts and arcs FFG 2014' },
  { id: 'mc80a', name: 'MC80A Home One type', kind: 'starDestroyer', role: 'command', from: 0, len: 1200, shieldX: 1.6, hullX: 0.8, generators: 15, hardy: true, handling: -3, letter: 'O', allRound: true, longTargeting: true, weapons: [m('heavyTurbolaser', 1, even(29)), m('heavyIon', 2, even(12)), m('pdLaser', 1, even(30))], hangar: [{ classId: 'xwing', count: 48 }, { classId: 'awing', count: 24 }, { classId: 'bwing', count: 24 }, { classId: 'ywing', count: 24 }], invented: ['ion count', 'point defence', 'hangar split', 'dates'], note: '29 heavy turbolasers (EGVV); heavy twin ion batteries (SotG)' },
  { id: 'quasarFire', name: 'Quasar Fire-class cruiser-carrier', kind: 'frigate', role: 'carrier', from: -10, len: 350, shieldX: 0.5, hullX: 0.6, handling: -3, letter: 'Q', weak: true, weapons: [m('lightTurbolaser', 1, ahead(2))], hangar: [{ classId: 'xwing', count: 48 }], invented: ['dates'], note: 'counts FFG 2014; its 48 fighters are whatever its side flies' },
];

export const SHIP_SPECS: readonly ShipSpec[] = [...FIGHTERS, ...FREIGHTERS, ...CAPITALS];

/** Particle shielding by kind (invented). */
export const PARTICLE_BY_KIND: Readonly<Record<ShipKind, number>> = { fighter: 10, freighter: 20, corvette: 30, frigate: 45, heavyCruiser: 60, starDestroyer: 75, battleship: 70, battlecruiser: 78, dreadnought: 85 };
