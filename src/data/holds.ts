// Holds against a duelist and getting away (Jared, 2026-11-25; D-496, D-497; docs-v2/spec/holds.md). Every number is invented
// unless it says otherwise.
import type { LocationKind } from './entities.config';

/**
 * The chance each exchange that the duelist gets past the holder, by how far the duelist's ability is above theirs (the
 * mean of the gaps in combat, Force Control and Willpower). One clock (D-497): an exchange is 5-10 s here as everywhere,
 * so a hold's time is the fight's own clock up to then. Tuned to the shares of D-496's table.
 */
export const PAST_CHANCE: readonly (readonly [number, number])[] = [[2, 0.012], [12, 0.055], [20, 0.1], [24, 0.21], [31, 0.28], [38, 0.53], [45, 0.75], [70, 0.95]];
/** Against an apex duelist (or one beyond) the gap counts for this much more (D-497: steeper). */
export const APEX_GAP = 1.15;
/** Getting past is a blow: the duelist strikes the holder down or aside. Its margin: the least, a die's worth, and a share of the gap. */
export const PAST_BLOW = { least: 8, die: 12, perGap: 0.3 } as const;
/** What an exchange takes on the clock on average (rolls §3: 5-10 s), for a hold saved before D-497. */
export const EXCHANGE_MEAN_SECONDS = 7.5;

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

/**
 * Who else is looking (D-497): the share of that chance by what the pursuer can call on. Malgus, a lord of the Empire with
 * its Intelligence behind him, keeps his 8% a day; a lone hunter has half the chance of one so backed.
 */
export const SEARCH_SUPPORT = { service: 1, order: 0.85, organisation: 0.7, lone: 0.5 } as const;
export type SearchSupport = keyof typeof SEARCH_SUPPORT;
/** Factions with an intelligence service, and the roles that can set it looking (the rest of the faction: an organisation). */
export const SERVICE_FACTIONS: readonly string[] = ['sithEmpire', 'republic'];
export const SERVICE_ROLES: readonly string[] = ['sithLord', 'inquisitor', 'officer', 'official', 'politician', 'jediMaster'];
/** The Orders: their watchers, seers and holdings. */
export const ORDER_FACTIONS: readonly string[] = ['jediOrder', 'sith'];
/** The years the Sith are only two (D-320): no Order behind either. */
export const SITH_OF_TWO = { fromYear: -1000, toYear: 25 } as const;
/** Clans, cartels and syndicates. */
export const ORGANISATION_FACTIONS: readonly string[] = ['mandalorians', 'underworld'];
/** On their own whatever their faction: a hunter for pay, a masterless darksider. */
export const LONE_ROLES: readonly string[] = ['bountyHunter', 'darkJedi', 'darkAcolyte'];
export const SUPPORT_LABELS: Readonly<Record<SearchSupport, string>> = { service: 'with an intelligence service to call on', order: 'with an Order to call on', organisation: 'with their own people to call on', lone: 'alone' };

/** The most exchanges an NPC's hold is played (a stalemate after that: the duelist was held). */
export const HOLD_MAX_EXCHANGES = 200;
