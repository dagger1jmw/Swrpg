// The numbers of ship combat (Jared, 2026-11-25; D-505; docs-v2/spec/combat-scales.md). Every number is invented unless a
// comment gives its lore or game source.
import type { HitQuality } from './combat.config';

export type Curve = readonly (readonly [number, number])[];

// ---- the core roll and the track, every scale ----

/** A strike that misses moves the track this many steps toward 0; one that lands resets it (as rolls §3). */
export const SCALE_MISSED_STRIKE_STEP = 2;

// ---- weapons ----

export const RANGE_BANDS = ['close', 'medium', 'long'] as const;
export type RangeBand = (typeof RANGE_BANDS)[number];
/** What a weapon can follow: point defence tracks fighters, a turbolaser does not (lore, EGWT). */
export type Tracking = 'fighter' | 'medium' | 'capital';
export type DamageKind = 'energy' | 'ion' | 'warhead';

export interface ShipWeapon {
  id: string;
  label: string;
  kind: DamageKind;
  /** One bolt or warhead. Scale: a laser cannon bolt is 10, so that the SBD/RU pools fit (a turbolaser is 30: lore, x3). */
  damage: number;
  /** The farthest band it reaches. A turbolaser reaches two to three times as far as a laser (lore, EGWT). */
  range: RangeBand;
  tracking: Tracking;
  turbolaser?: boolean;
  /** Guns against fighters and warheads. */
  pointDefence?: boolean;
  /** The share of it that counts against a capital ship; 1 when absent. Small guns are mostly dissipated. */
  vsCapital?: number;
  note: string;
}

const w = (id: string, label: string, kind: DamageKind, damage: number, range: RangeBand, tracking: Tracking, note: string, over: Partial<ShipWeapon> = {}): ShipWeapon => ({ id, label, kind, damage, range, tracking, note, ...over });

export const SHIP_WEAPONS: readonly ShipWeapon[] = [
  w('laser', 'laser cannon', 'energy', 10, 'close', 'fighter', 'the baseline', { vsCapital: 0.1 }),
  w('lightLaser', 'light laser cannon', 'energy', 6, 'close', 'fighter', 'invented: under a laser cannon', { vsCapital: 0.1 }),
  w('heavyLaser', 'heavy laser cannon', 'energy', 15, 'close', 'fighter', 'invented: between laser (10) and turbolaser (30)', { vsCapital: 0.2 }),
  w('autoblaster', 'autoblaster', 'energy', 5, 'close', 'fighter', 'invented', { vsCapital: 0.05 }),
  w('quadLaser', 'quad laser cannon', 'energy', 40, 'close', 'fighter', 'four laser bolts', { vsCapital: 0.1 }),
  w('pdLaser', 'point-defence laser', 'energy', 10, 'close', 'fighter', 'a laser cannon on a point-defence mount (lore)', { vsCapital: 0.1, pointDefence: true }),
  w('pdLightLaser', 'light point-defence laser', 'energy', 6, 'close', 'fighter', 'invented', { vsCapital: 0.1, pointDefence: true }),
  w('pdQuadLaser', 'point-defence quad laser', 'energy', 40, 'close', 'fighter', 'four laser bolts', { vsCapital: 0.1, pointDefence: true }),
  w('pdIon', 'point-defence ion cannon', 'ion', 10, 'close', 'fighter', 'invented', { vsCapital: 0.1, pointDefence: true }),
  w('flak', 'flak gun', 'energy', 20, 'close', 'fighter', 'dangerous to fighters, much less to larger ships (lore); number invented', { vsCapital: 0.02, pointDefence: true }),
  w('assaultLaser', 'assault laser cannon', 'energy', 20, 'medium', 'medium', 'invented', { vsCapital: 0.4 }),
  w('lightTurbolaser', 'light turbolaser', 'energy', 20, 'medium', 'medium', 'invented: under the turbolaser', { turbolaser: true }),
  w('turbolaser', 'turbolaser', 'energy', 30, 'medium', 'capital', 'lore: three times a laser cannon bolt (NEGWT)', { turbolaser: true }),
  w('heavyTurbolaser', 'heavy turbolaser', 'energy', 80, 'long', 'capital', "invented within the lore file's 6-10 lasers (XX-9, DBY-827)", { turbolaser: true }),
  w('prowTurbolaser', 'prow heavy turbolaser', 'energy', 240, 'long', 'capital', "invented: three heavy bolts; a Munificent's could pierce a battle station's shields (lore, ROTS ICS)", { turbolaser: true }),
  w('lightIon', 'light ion cannon', 'ion', 10, 'close', 'fighter', 'invented: as a laser', { vsCapital: 0.3 }),
  w('ion', 'ion cannon', 'ion', 30, 'medium', 'medium', 'invented: as a turbolaser'),
  w('heavyIon', 'heavy ion cannon', 'ion', 60, 'medium', 'capital', 'invented; NK-7 optimum 10 km, maximum 80 km (lore, NEGWT)'),
  w('longIon', 'long-range heavy ion cannon', 'ion', 180, 'long', 'capital', 'invented: three heavy ion bolts (the Munificent; the lore names it long-range)'),
  w('torpedo', 'proton torpedo', 'warhead', 80, 'medium', 'medium', "the lore file's 8 lasers (suggestion)"),
  w('missile', 'concussion missile', 'warhead', 60, 'close', 'fighter', 'invented: under a torpedo, follows fighters better'),
  w('heavyMissile', 'assault concussion missile', 'warhead', 120, 'medium', 'capital', 'invented: one and a half torpedoes'),
];
export const SHIP_WEAPON: ReadonlyMap<string, ShipWeapon> = new Map(SHIP_WEAPONS.map((x) => [x.id, x]));

export type TargetSize = 'fighter' | 'small' | 'capital';
/** The share of a weapon's fire that can follow a target of a size. small: corvettes and freighters. */
export const TRACKING_FACTOR: Readonly<Record<Tracking, Readonly<Record<TargetSize, number>>>> = {
  fighter: { fighter: 1, small: 1, capital: 1 },
  medium: { fighter: 0.35, small: 0.9, capital: 1 },
  capital: { fighter: 0.06, small: 0.75, capital: 1 },
};
/** The same as a d20 modifier, for a single shot at a fighter. */
export const TRACKING_MOD: Readonly<Record<Tracking, number>> = { fighter: 0, medium: -3, capital: -8 };

// ---- pools ----

/**
 * Pools for ships no source rates, by length: the flight games' ratings (game stats: CR90 400, Lancer 576, Nebulon-B 960,
 * Ton-Falk 1600, Dreadnaught and Immobilizer about 2080, Victory 3200, ISD 4800, Executor 96000). The two lowest points,
 * the one at 3200 m and the lines between are invented.
 */
export const SHIELDS_BY_LENGTH: Curve = [[20, 60], [60, 180], [150, 400], [250, 576], [300, 960], [500, 1600], [600, 2080], [900, 3200], [1600, 4800], [3200, 13000], [19000, 96000]];
/** Hull as a share of the shields, as the rated ships have it (game stats: 0.43 to 0.57). */
export const HULL_SHARE = 0.47;

/** Reactor: 100 is an Imperial I's. From the cross-sections' watts (lore); the square root is invented. */
export const reactorFromWatts = (watts: number): number => Math.round(100 * Math.sqrt(watts / 7.73e24));
/** The reactor a ship with these shields has when no source says (invented; 4800 gives the ISD's 100). */
export const usualReactor = (shields: number): number => 100 * Math.pow(Math.max(1, shields) / 4800, 0.75);
/** Shield generators a ship of a length usually has (invented; the Harrower's 4 and the Immobilizer's 12 are lore). */
export const GENERATORS_BY_LENGTH: Curve = [[60, 1], [150, 2], [300, 2], [600, 4], [900, 4], [1600, 6], [19000, 40]];

// ---- shields ----

/** How much of a warhead goes past the pool, by particle shielding (0 none, 100 as strong as it gets). */
export const WARHEAD_BYPASS: Curve = [[0, 0.9], [40, 0.6], [75, 0.2], [90, 0]];
/** Particle shielding in the round a ship launches fighters or fires its own warheads; none at all to a volley timed to it. */
export const PARTICLE_DOWN_FACTOR = 0.5;
/** Retuned against ion: the share of other fire the pool still stops, and how much of an ion bolt's drain it takes. */
export const RETUNED = { energyStopped: 0.15, ionDrain: 0.35 } as const;
/**
 * An ion bolt passes an ordinary (ray) shield, draining the generator as it does; the hull takes little. tolerance: the ion
 * load, as a share of hull, that disables. systemAt: the share of that from which a system goes down. Load fades by repair.
 */
export const ION = { shieldDrain: 0.6, hull: 0.1, tolerance: 0.5, systemAt: 0.4, disabledMinutes: [[1, 3], [2, 6], [4, 10]] as Curve, repairPerMinute: 0.06, repairPerLevel: 0.001 } as const;
/** Recovery a minute, as a share of the whole pool, at the usual reactor, generators and shield power. */
export const RECHARGE_PER_MINUTE = { small: 0.2, capital: 0.007 } as const;
/** More generators than usual recover faster, by this power of the ratio (Mon Calamari: three times as many, x1.7). */
export const GENERATOR_POWER = 0.5;
/** Fire on one facing in one turn or round, as a share of its full pool, that burns the projector out once the pool is gone. */
export const BURNOUT_SHARE = { small: 1.75, capital: 0.5 } as const;
export const HARDY_BURNOUT = 1.5;
/** A damage-control crew swaps a projector "in a matter of minutes" (lore, EGWT): these minutes, by its Repair. */
export const PROJECTOR_MINUTES: Curve = [[0, 14], [40, 9], [80, 6], [120, 4]];

/** Shields by the calendar year (negative = BBY): recovery before and after the breakthrough of c. 7500 BBY (lore; numbers invented). */
export const ERA_RECHARGE: Curve = [[-7550, 0.35], [-7450, 1]];
/** Rapid-fire turbolasers beat any shield from the 7700s to the 7500s BBY (lore; numbers invented). */
export const ERA_RAPID_FIRE: Curve = [[-7800, 1], [-7750, 4], [-7550, 4], [-7450, 1]];

// ---- power ----

export interface PowerShares {
  guns: number;
  shields: number;
  engines: number;
}
export const POWER_EVEN: PowerShares = { guns: 0.5, shields: 0.3, engines: 0.2 };
/** Most of the reactor a ship can put in its guns; the Venator could use almost all of it (lore). */
export const GUNS_MAX = { ordinary: 0.65, trueWarship: 0.95 } as const;
/** Guns by their share of power. Past 0.65 only guns with power settings gain (the DBY-827's seven, lore). */
export const GUN_POWER: Curve = [[0, 0], [0.25, 0.6], [0.5, 1], [0.65, 1.2]];
export const GUN_POWER_SETTINGS: Curve = [[0, 0], [0.25, 0.6], [0.5, 1], [0.65, 1.25], [0.95, 1.8]];
/** Guns that do not fire leave this share of their power for the shields. */
export const HELD_FIRE_TO_SHIELDS = 0.8;

// ---- damage ----

export const SHIP_SYSTEMS = ['engines', 'weapons', 'generator', 'sensors', 'hyperdrive', 'lifeSupport', 'hangar', 'cockpit', 'astromech'] as const;
export type ShipSystem = (typeof SHIP_SYSTEMS)[number];
export const SYSTEM_STATES = ['working', 'damaged', 'disabled', 'destroyed'] as const;
export type SystemState = (typeof SYSTEM_STATES)[number];
export const FIGHTER_SYSTEMS: readonly ShipSystem[] = ['engines', 'weapons', 'generator', 'sensors', 'hyperdrive', 'cockpit', 'astromech'];
export const CAPITAL_SYSTEMS: readonly ShipSystem[] = ['engines', 'weapons', 'generator', 'sensors', 'hyperdrive', 'lifeSupport', 'hangar'];
/** What a damaged, disabled or destroyed system leaves. */
export const SYSTEM_FACTOR: Readonly<Record<SystemState, number>> = { working: 1, damaged: 0.75, disabled: 0.35, destroyed: 0.2 };
/** The chance of a system hit from hull lost in a round, per whole hull. */
export const SYSTEM_HIT_PER_HULL = 3;
/** A field repair: Repair against this, one step better; a capital ship's crew tries one system a round. */
export const REPAIR_DC = 14;
/** Hull share below which a ship is damaged, and crippled; at none it may break up. */
export const HULL_STATES = { damaged: 0.75, crippled: 0.3 } as const;
/** At no hull: overkill of this share of the hull destroys at once, else this chance each round. */
export const BREAK_UP = { overkill: 0.35, chance: 0.35 } as const;
/** A shield dome and a bridge: hit points as a share of the hull. */
export const TOWER = { dome: 0.03, bridge: 0.02, cap: 400 } as const;

// ---- dogfights ----

export const TURN_SECONDS = 5;
export const DOGFIGHT = {
  /** A hit's share of the volley by quality (4-7, 8-11, 12-15, 16+). */
  share: { graze: 0.5, solid: 1, clean: 1.25, critical: 1.5 } as Readonly<Record<HitQuality, number>>,
  /** A graze on a facing already down does this share of itself to the hull. */
  bareGraze: 0.5,
  /** Gunnery by the track: head-on brief, from the side poor, on the tail best. */
  position: [[0, -2], [1, -5], [2, -3], [3, 0], [4, 1], [5, 2]] as Curve,
  /** After a shot the track comes back by this: the target breaks hard. */
  afterHit: 2,
  afterMiss: 1,
  torpedo: { evasion: -3, decoys: 4, freighter: -2 },
  jink: { evasion: 2, ownShots: -3 },
  range: { close: 0, medium: -2, long: -5 } as Readonly<Record<RangeBand, number>>,
  /** A Force user anticipates: on piloting and evasion. */
  forceSense: [[15, 0], [40, 1], [80, 2.5], [120, 3.5]] as Curve,
  boost: { lasers: 1.25, lasersWeak: 0.75, shields: 2, shieldsWeak: 0, engines: 1, enginesWeak: -1 },
  /** Shifting power in a freighter without an engineer costs the pilot. */
  noEngineer: -1,
  /** Shields angled one way: this share of the pool on that side. */
  angle: 0.8,
  /** A crewed turret fires in any direction, at this. */
  turret: -5,
} as const;

/** The manoeuvres (lore: SW_Space_Tactics.md; numbers invented). */
export const MANOEUVRES = ['fly', 'break', 'jink', 'scissors', 'stall', 'koiogran', 'powerPivot', 'terrain', 'reverseThrottleHop', 'tallonRoll', 'loopBack', 'trap', 'corellianSlip', 'slipJaws'] as const;
export type Manoeuvre = (typeof MANOEUVRES)[number];
export interface ManoeuvreDef {
  label: string;
  use: 'any' | 'defensive' | 'attacking';
  mod: number;
  /** A modifier against these. */
  against?: Partial<Record<Manoeuvre, number>>;
  needs?: 'wingman' | 'terrain' | 'forceOrDroid';
  /** Lost by this much: the pursuer overshoots into a free shot, or the pilot hits something. */
  risk?: number;
  note: string;
}
export const MANOEUVRE: Readonly<Record<Manoeuvre, ManoeuvreDef>> = {
  fly: { label: 'Hold the fight', use: 'any', mod: 0, note: 'no special move' },
  break: { label: 'Break', use: 'defensive', mod: 1, risk: 6, note: 'turn into the attack; a snap shot as the attacker passes if it goes wrong' },
  jink: { label: 'Jink', use: 'defensive', mod: 0, note: 'harder to hit, but the attacker keeps the position and your own shots suffer' },
  scissors: { label: 'Scissors', use: 'defensive', mod: 1, against: { fly: 1 }, risk: 6, note: 'timed turns after an overshoot' },
  stall: { label: 'Silerian Stall', use: 'defensive', mod: 2, risk: 3, note: 'a dead stop so the pursuer overshoots' },
  koiogran: { label: 'Koiogran turn', use: 'defensive', mod: 2, risk: 5, note: 'a loop-roll onto a new heading; dangerous near terrain' },
  powerPivot: { label: 'Power pivot', use: 'defensive', mod: 1, risk: 5, note: 'spin to face the pursuer' },
  terrain: { label: 'Terrain-following', use: 'defensive', mod: 2, needs: 'terrain', risk: 8, note: 'weave where they cannot follow' },
  reverseThrottleHop: { label: 'Reverse Throttle Hop', use: 'attacking', mod: 0, against: { break: 2, trap: 1 }, risk: 6, note: 'the counter to a break' },
  tallonRoll: { label: 'Tallon Roll', use: 'attacking', mod: 0, against: { break: 2, stall: 2, scissors: 1, trap: 1 }, risk: 6, note: 'slide in behind a target about to be overshot' },
  loopBack: { label: "Segnor's Loop", use: 'any', mod: 0, note: 'run out and come back: the positions are even again' },
  trap: { label: 'Trap', use: 'defensive', mod: 3, needs: 'wingman', note: 'a pair break apart; the pursuer is between them' },
  corellianSlip: { label: 'Corellian Slip', use: 'defensive', mod: 3, needs: 'wingman', note: 'a friend flies straight at the pursuer' },
  slipJaws: { label: 'Slip-jaws', use: 'defensive', mod: 4, needs: 'forceOrDroid', risk: 4, note: 'only droid or Force-aided pilots' },
};

// ---- fleets ----

export const ROUND_MINUTES = 3;
export const FLEET = {
  matchup: 2,
  intel: 1,
  reformPenalty: -2,
  gapsPenalty: -1,
  reformDc: 14,
  /** Crew quality 0 to +2, by the crews' level. */
  crew: [[20, 0], [50, 1], [80, 2]] as Curve,
  /** The share of a side's fire that lands, by its own margin this round. One round is one effective volley a gun. */
  landing: [[-12, 0.05], [-6, 0.1], [0, 0.16], [6, 0.225], [12, 0.29]] as Curve,
  range: { close: 1.15, medium: 0.9, long: 0.6 } as Readonly<Record<RangeBand, number>>,
  /** Accurate targeting computers at long range (Mon Calamari, lore). */
  longTargeting: 2,
  /** A wedge hull's guns in a close broadside (lore: poorly optimised for it). */
  wedgeClose: 0.9,
  /** A ship with far more fire than its target can take spreads it over this many at most. */
  spread: 4,
  /** The strike round: concentrated fire lands at this, by the strike's margin. */
  strike: [[3, 1], [4, 1.5], [10, 2.25], [16, 3]] as Curve,
  /** Fire ordered onto one ship lands this much better (lore: shared fire control, coordinated volleys); a strike that is not gets this share of the extra. */
  focus: 1.35,
  spreadStrike: 0.5,
  /** Guns in a round spent rolling to a fresh facing. */
  rolled: 0.6,
  /** A ship told to roll does when its shown facing is under this share of its freshest. */
  rollAt: 0.3,
  /** Engine power and damage in the race for the range: points of speed a whole reactor of it is worth over the usual share. */
  enginePower: 10,
  /** A pincer's fire that arrives on the aft facing. */
  pincerAft: 0.4,
  /** A brawl's luck: up to this much either way on the margin. */
  brawlSwing: 6,
  /** Forced break: this share of a side's strength lost in one round, or a key ship. */
  heavyLossRound: 0.3,
  commandLostRounds: 2,
  commandLost: -2,
  dogfightMax: 2,
  /**
   * Battle meditation in a fleet (Jared, D-506; Bastila's was a fleet's): on the side's Tactics roll by the meditator's
   * Meditation level (invented: the ground scale, D-505).
   */
  meditation: [[10, 0], [40, 1], [80, 2], [120, 3]] as Curve,
  /**
   * The meditator killed or broken: every crew checks, as on the ground (d20 + crew level / 10 against this). Failed by less
   * than routMargin: shaken (guns at `shaken` for shakenRounds); by more, the ship breaks off. Invented.
   */
  meditatorCheck: { dc: 18, routMargin: 4, shaken: 0.6, shakenRounds: 2 },
  /** Fighters: kills a round per point of fire over toughness; point defence the same; warheads each drops a round. */
  fighterKill: 0.35,
  pdKill: 0.2,
  warheadIntercept: 8,
  warheadsPerFighter: 1,
  /** Warheads that find the target, from fighters that aim them together and from a ship's own tubes over a whole round. */
  fighterWarheads: 0.25,
  shipWarheads: 0.08,
  /** Fighters' guns on a capital ship, as a share of a volley that lands. */
  fighterGuns: 0.25,
  /** Fighters a ship gets away in a round: this, or a sixth of its length in metres if that is more. */
  launch: { least: 48, perMetre: 1 / 6 },
  /** Point defence covers this much of a ship's length against fighters at one place. */
  pdLength: 1600,
  /** The share of the enemy's strike fighters a screen of equal numbers ties up. */
  screenHolds: 0.7,
  /** A commander with leave to withdraw breaks off below this share of the strength. */
  withdrawAt: 0.35,
  /** What an NPC captain of a true warship puts in the guns. */
  trueWarshipPower: { guns: 0.85, shields: 0.1, engines: 0.05 },
  maxRounds: 60,
} as const;

/** Formations (design notes; lore: SW_Space_Tactics.md). */
export const FORMATIONS = ['exchange', 'capT', 'slash', 'fake', 'brawl', 'pincer', 'screen', 'feignedRetreat', 'withdraw'] as const;
export type Formation = (typeof FORMATIONS)[number];
export const FORMATION_LABEL: Readonly<Record<Formation, string>> = { exchange: 'Line', capT: 'Cap the T', slash: 'Slash', fake: 'Fake', brawl: 'Brawl', pincer: 'Pincer', screen: 'Screen', feignedRetreat: 'Feigned retreat', withdraw: 'Withdraw' };
/** What each beats (+2, and -2 for the beaten); every other pair is even. Readings where the notes do not say (spec D). */
export const FORMATION_BEATS: Readonly<Record<Formation, readonly Formation[]>> = {
  exchange: ['fake', 'feignedRetreat'],
  capT: ['slash', 'fake'],
  slash: ['exchange', 'screen'],
  fake: ['brawl'],
  brawl: ['pincer'],
  pincer: ['slash', 'withdraw'],
  screen: [],
  feignedRetreat: ['slash', 'brawl', 'pincer'],
  withdraw: [],
};
/** Planned changes carry no penalty: the fake wheels into its broadside, the feigned retreat turns on the pursuer. */
export const PLANNED_CHANGES: Readonly<Partial<Record<Formation, readonly Formation[]>>> = { fake: ['exchange'], feignedRetreat: ['capT', 'pincer'] };
