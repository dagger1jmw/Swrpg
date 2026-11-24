// Numbers of the blockade system (D-469). EVERY number here is `invented`: the design notes rank the approaches in words and
// leave checks, costs and consequences open. They are proposals for Jared (docs-v2/reports/m8-world-c.md).
// A rating is a check difficulty: DC = 10 + rating / 10 (rolls.md §2).
import type { BlockadeApproach, BlockadeLevel, BlockadeResponse } from './blockades';

/** At a military blockade of middling strength and alertness. Going around follows AROUND_BY_AGE instead. */
export const APPROACH_RATING: Readonly<Record<Exclude<BlockadeApproach, 'aroundClose' | 'aroundOnFoot'>, number>> = { ride: 20, undercover: 70, smuggle: 90, sneak: 110, force: 130 };
export const LEVEL_RATING: Readonly<Record<BlockadeLevel, number>> = { 1: -30, 2: -15, 3: 0 };
/** Per point of alertness over 3 (every approach) and of strength over 3 (by ship, without leave). */
export const ALERTNESS_RATING = 5;
export const STRENGTH_RATING = 5;
/** Per point of corruptibility, for what money can ease (riding along, undercover, smuggling). */
export const CORRUPTIBILITY_RATING = -5;

/** Going around, by the blockade's age in days at a military blockade: medium, very hard, hardest. Interpolated. */
export const AROUND_BY_AGE: readonly (readonly [days: number, rating: number])[] = [
  [0, 50],
  [5, 60],
  [30, 88],
  [90, 95],
  [365, 110],
];
/** A trained military leaves no holes: never easier than this. */
export const DISCIPLINED_FLOOR = 80;
/** How much of the age scale applies: a trade blockade barely tightens. */
export const AGE_WEIGHT: Readonly<Record<BlockadeLevel, number>> = { 1: 0.1, 2: 0.5, 3: 1 };

/** Landing beyond patrol and sensor range makes the way around much easier; landing inside it, harder. */
export const LANDING_RATING = { outside: -55, inside: 20 } as const;
/** A trained eye's general range for where it is safe to land, in km, by level. It never expires. */
export const TRAINED_RANGE_KM: Readonly<Record<BlockadeLevel, readonly [number, number]>> = { 1: [10, 30], 2: [40, 90], 3: [90, 190] };
/** Without knowledge a landing is a guess somewhere in here. */
export const GUESS_RANGE_KM: readonly [number, number] = [10, 200];
/** Watching: hours needed; then exact for FRESH days, and a blurred figure until GONE days. */
export const OBSERVE = { hoursNeeded: 72, hoursPerWatch: 12, rating: 40, freshDays: 21, goneDays: 42, freshMargin: 1.1, fadedMargin: 1.35 } as const;
/** Who knows blockade tactics by training: these starts, or the flag blockadeTactics. */
export const TRAINED_STARTS: readonly string[] = ['mandalorian-blockade', 'republic-pilot', 'sis-agent', 'imperial-officer', 'imperial-agent'];

/**
 * The trek: km a day; a terrain check per leg of days; ground patrols only inside their own coverage, one check per stretch
 * (base + per point of ground patrols). A slip costs a day; only a bad one is a capture.
 */
export const TREK = { kmPerDay: 25, legDays: 3, terrainRating: 30, patrolStretchKm: 60, patrolBase: 20, patrolPerPoint: 6, lostDays: 1 } as const;
/** Chance a day, per point of ground patrols, that the ship left outside is found. */
export const SHIP_FOUND_PER_DAY = 0.01;

/** Danger sense: the least Force Sense that can feel a patrol coming, and its rating. It warns; it never knows where to land. */
export const DANGER_SENSE = { minLevel: 20, rating: 60 } as const;

/**
 * Forcing a way through: an ace pilot by design, to outfly the pursuers and not be hit, or a fleet (Jared, D-470). A
 * specialised stealth ship will lower it once ships are built.
 */
export const FORCE_THROUGH_PILOTING = 90;
/** The least relationship (0-100) with a contact: friendly for papers and codes; any known smuggler takes pay. */
export const CONTACT = { friendly: 20, hired: 0 } as const;
/** Modifiers to the roll (points, not rating): training and a contact help with codes. */
export const TRADECRAFT_BONUS = { trained: 2, contact: 2 } as const;

/** Credits, owed or paid (kept in the ledger until the economy is built), at a military blockade; × level / 3. */
export const APPROACH_COST: Readonly<Record<BlockadeApproach, number>> = { ride: 2000, undercover: 1500, smuggle: 5000, sneak: 0, aroundClose: 0, aroundOnFoot: 0, force: 0 };
export const BOARDED_FINE = 1000;

/** Hours beyond the trip itself: arranging it, and the sublight way around. */
export const APPROACH_HOURS: Readonly<Record<BlockadeApproach, number>> = { ride: 48, undercover: 24, smuggle: 72, sneak: 12, aroundClose: 72, aroundOnFoot: 72, force: 0 };

/** Responses that end the attempt but leave another way open, what it can turn into, and the rating it adds. */
export const TURNS_INTO: Readonly<Partial<Record<BlockadeResponse, { penalty: number; options: Readonly<Record<BlockadeApproach, readonly BlockadeApproach[]>> }>>> = {
  turnedBack: {
    penalty: 10,
    options: { ride: ['undercover'], undercover: ['force'], smuggle: ['undercover', 'force'], sneak: ['undercover', 'force'], aroundClose: ['undercover', 'force'], aroundOnFoot: [], force: [] },
  },
  boarded: { penalty: 20, options: { ride: ['force'], undercover: ['force'], smuggle: ['force'], sneak: ['force'], aroundClose: ['force'], aroundOnFoot: [], force: [] } },
};
/** A caught ship sharpens the line for a while. */
export const HEAT = { perCatch: 1, days: 14, max: 2 } as const;

/** Fame of a run that gets through, × level / 3; +1 for a decisive margin. Only a witnessed run counts (renown is not built). */
export const RUN_FAME: Readonly<Record<BlockadeApproach, number>> = { ride: 0, undercover: 1, smuggle: 1, sneak: 3, aroundClose: 2, aroundOnFoot: 2, force: 5 };
export const FAME_MARGIN = 12;
export const WITNESSED: readonly BlockadeApproach[] = ['force'];

export const RUNS_KEPT = 20;
