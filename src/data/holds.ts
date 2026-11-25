// Holds against a duelist and getting away (Jared, 2026-11-25; D-496; docs-v2/spec/holds.md). Every number is invented
// unless it says otherwise.
import type { LocationKind } from './entities.config';

/**
 * What one exchange of a hold is worth in seconds, by how far the duelist's ability is above the holder's (the mean of the
 * gaps in combat, Force Control and Willpower). About 3 s between equals (Jared); the more one-sided, the less each
 * exchange keeps the duelist: they drive the holder back, look past them, keep moving. The exchanges are the duel's own.
 */
export const EXCHANGE_WORTH: readonly (readonly [number, number])[] = [[2, 3], [12, 1.7], [24, 0.85], [45, 0.3], [70, 0.15]];

/**
 * Where it happens, read from the recorded location. interior: aboard a ship or a station, with blast doors. building: plain
 * doors. hangar: by its recorded name. street: a city or a district. open: everything else.
 */
export const HOLD_SETTINGS = ['interior', 'building', 'hangar', 'street', 'open'] as const;
export type HoldSetting = (typeof HOLD_SETTINGS)[number];

/** The seconds a hold has to buy for those who flee: the doors closed and the console wrecked; a ship up; a head start worth having. */
export const HOLD_NEED: Readonly<Record<HoldSetting, number>> = { interior: 20, building: 20, hangar: 45, street: 20, open: 20 };

export const INDOOR_KINDS: readonly LocationKind[] = ['building', 'room'];
export const VESSEL_KINDS: readonly LocationKind[] = ['ship', 'station'];
export const STREET_KINDS: readonly LocationKind[] = ['city', 'district'];
/** A recorded name that makes a place a hangar. */
export const HANGAR_WORDS = /\b(?:hangars?|docking bays?|landing (?:bays?|pads?|platforms?|decks?)|launch bays?|flight decks?|spaceports?|starports?)\b/i;

/** The steps of an escape plan the player can state, in their order. */
export const ESCAPE_STEPS = ['reachExit', 'sealDoor', 'wreckConsole', 'reachShip', 'startShip', 'vehicle', 'cover', 'run', 'evasive', 'conceal'] as const;
export type EscapeStep = (typeof ESCAPE_STEPS)[number];
/** Seconds each takes. run, evasive and conceal are how the rest is done and take none of their own. */
export const STEP_SECONDS: Readonly<Record<EscapeStep, number>> = { reachExit: 8, sealDoor: 5, wreckConsole: 4, reachShip: 12, startShip: 30, vehicle: 18, cover: 12, run: 0, evasive: 0, conceal: 0 };
/** What each step needs done first (done on the way when the plan leaves it out). */
export const STEP_NEEDS: Readonly<Partial<Record<EscapeStep, EscapeStep>>> = { sealDoor: 'reachExit', wreckConsole: 'sealDoor', startShip: 'reachShip' };
/** Where each step can be done; a step not listed can be done anywhere. */
export const STEP_SETTINGS: Readonly<Partial<Record<EscapeStep, readonly HoldSetting[]>>> = {
  reachExit: ['interior', 'building', 'hangar'],
  sealDoor: ['interior', 'building', 'hangar'],
  wreckConsole: ['interior', 'hangar'],
  reachShip: ['hangar'],
  startShip: ['hangar'],
  vehicle: ['street', 'hangar'],
  cover: ['street', 'building', 'open'],
};
export const STEP_LABELS: Readonly<Record<EscapeStep, string>> = {
  reachExit: 'reach the way out',
  sealDoor: 'close the door behind them',
  wreckConsole: 'wreck its console',
  reachShip: 'reach a ship',
  startShip: 'start it and get it out',
  vehicle: 'reach a vehicle and get it moving',
  cover: 'reach cover out of sight',
  run: 'run',
  evasive: 'run an evasive route, never straight',
  conceal: 'hide their presence in the Force',
};

/** A barrier's delay in seconds for a lightsaber cutting through (the ordinary foe's). */
export const BARRIER_SECONDS = { interior: 45, hangar: 45, building: 12 } as const;
/** A wrecked console adds this share: the door cannot simply be opened. */
export const CONSOLE_SHARE = 0.5;
/** A foe without a lightsaber takes this many times as long. */
export const NO_SABER_MULT = 2.5;
/**
 * A strong Force user rips the barrier open instead of cutting: the share of the cutting time by tier. Still time. Below
 * Master nobody is strong enough.
 */
export const RIP_SHARE = { below: 1, master: 0.75, top: 0.45, apex: 0.25, beyond: 0.15 } as const;

/** On foot, in metres and seconds. */
export const PURSUIT = {
  /** A run without the Force, and what each point of Force Speed adds to it (as a share). */
  base: 6,
  perForceSpeed: 0.04,
  /** How long that pace lasts: a run's own, and per point of Force Speed (0 without it) and of Endurance. */
  sustain: 20,
  sustainPerForceSpeed: 0.5,
  sustainPerEndurance: 0.4,
  /** Distance that breaks line of sight on an evasive route, by setting, and how many times that on a straight one. */
  sight: { interior: 60, building: 60, hangar: 150, street: 150, open: 400 } as Readonly<Record<HoldSetting, number>>,
  straightMult: 4,
  /** How far a pursuer senses a runner in the Force, per point of Force Sense. */
  sensePerLevel: 6,
  /** Concealment against that: the range falls to sense / (sense + concealment × this). */
  concealWeight: 2,
  /** Holding concealment costs pace and stamina. */
  concealSpeed: 0.8,
  concealSustain: 0.7,
  /** The chase is over after this long. */
  maxSeconds: 900,
} as const;

/**
 * Losing the pursuer once clear: d20 + level / 10 each side. The runner's best of Stealth and Agility (trained or boosted),
 * the pursuer's best of Tracking and Force Sense.
 */
export const LOSE_PURSUER = {
  evasive: 3,
  straight: -4,
  cover: 2,
  /** Past the point where the runner hid their presence, the pursuer has nothing to go on. */
  concealed: 7,
  /** A wider ground to search: per this many metres run, up to the most. */
  perMetres: 400,
  groundMost: 3,
} as const;

/** The trail afterwards: each day, the chance the pursuer finds it again, by their best of Tracking and Force Sense, for so many days. */
export const TRAIL = { days: 7, perDay: 0.03, perLevel: 0.0006, concealed: 0.4 } as const;

/** The most exchanges an NPC's hold is played (a stalemate after that: the duelist was held). */
export const HOLD_MAX_EXCHANGES = 200;
