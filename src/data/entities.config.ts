// Entity enums and rules for npcs, relationships, locations and threads (architecture §2, M2).
// The enums are the "registered ids" the AI must choose from; the species table proper is M8.

export const SPECIES = [
  'human', 'twilek', 'zabrak', 'mirialan', 'togruta', 'kelDor', 'wookiee', 'rodian', 'cathar',
  'miraluka', 'chiss', 'sithPureblood', 'monCalamari', 'bothan', 'duros', 'trandoshan', 'nautolan',
  'ithorian', 'hutt', 'jawa', 'gamorrean', 'rattataki', 'arkanian', 'echani', 'iktotchi', 'cerean',
  'toydarian', 'yuuzhanVong', 'droid', 'other', 'unknown',
] as const;
export type SpeciesId = (typeof SPECIES)[number];

/** D-08 renown factions plus non-aligned buckets. */
export const FACTIONS = ['republic', 'sithEmpire', 'jediOrder', 'sith', 'mandalorians', 'underworld', 'civilian', 'independent', 'unknown'] as const;
export type FactionId = (typeof FACTIONS)[number];

export const NPC_ROLES = [
  'jediMaster', 'jediKnight', 'padawan', 'initiate', 'sithLord', 'sithAcolyte', 'soldier', 'officer',
  'pilot', 'politician', 'official', 'merchant', 'smuggler', 'criminal', 'bountyHunter', 'scholar',
  'healer', 'servant', 'civilian', 'droid', 'other',
] as const;
export type NpcRole = (typeof NPC_ROLES)[number];

/** AI-settable NPC states; deceased comes only from the engine (D-33, D-65). */
export const NPC_AI_STATES = ['active', 'dormant', 'departed'] as const;
export const NPC_STATES = [...NPC_AI_STATES, 'deceased'] as const;
export type NpcState = (typeof NPC_STATES)[number];

/** Upper bound for ageApprox (long-lived species exist; the species spec narrows this in M8). */
export const MAX_AGE_APPROX = 1000;

// ---------------------------------------------------------------- relationships (D-82)

/** value += delta x this, clamped to +/-100. A +3 moves 15 points. */
export const RELATIONSHIP_POINTS_PER_DELTA = 5;
export const RELATIONSHIP_RANGE = 100;
/** Labels are derived from the value (never stored): the first band whose `below` exceeds the value. */
export const RELATIONSHIP_LABELS: readonly { below: number; label: string }[] = [
  { below: -59, label: 'hostile' },
  { below: -19, label: 'unfriendly' },
  { below: 20, label: 'neutral' },
  { below: 60, label: 'friendly' },
  { below: Infinity, label: 'close' },
];

// ---------------------------------------------------------------- locations

export const LOCATION_KINDS = ['planet', 'moon', 'station', 'ship', 'city', 'district', 'building', 'room', 'wilderness', 'other'] as const;
export type LocationKind = (typeof LOCATION_KINDS)[number];

/**
 * Location kinds that count as a "major location" for chapter close (architecture §7, D-17):
 * moving to a place whose nearest major ancestor differs closes the chapter. Tunable (Jared):
 * drop 'ship' if travel fragments chapters.
 */
export const CHAPTER_PLACE_KINDS: readonly LocationKind[] = ['planet', 'moon', 'station', 'ship'];

// ---------------------------------------------------------------- threads

export const DEADLINE_HINTS = ['today', 'days', 'weeks', 'months'] as const;
export type DeadlineHint = (typeof DEADLINE_HINTS)[number];
/** deadlineHint -> days from now (engine-mapped; the AI never sends dates). */
export const DEADLINE_DAYS: Record<DeadlineHint, number> = { today: 0, days: 3, weeks: 14, months: 60 };

export const THREAD_OUTCOMES = ['resolved', 'failed'] as const;

/** Text limits (architecture §2). */
export const LIMITS = {
  name: 60,
  description: 400,
  threadTitle: 80,
  threadStakes: 200,
  note: 200,
  reason: 200,
  region: 60,
} as const;

/**
 * Thread escalation from the deadline (D-135; replaces the legacy "every thread is critical after 3 days",
 * 14-world-state bug 4). 1 = the deadline is within `soonDays`; 2 = the deadline day has come; 3 = overdue
 * by `overdueDays`. Levels 2 and 3 interrupt a jump once each. Threads without a deadline never escalate.
 * Code never resolves or fails a thread: the story does (threadResolved).
 */
export const THREAD_ESCALATION = { soonDays: 7, overdueDays: 3 } as const;

/**
 * Relationship drift during time advance (architecture §9, D-82, D-137; design values). Teachers and
 * training partners gain from shared routine sessions; everyone else drifts toward neutral when there
 * has been no contact for a month, and never past the edge of the neutral band.
 */
export const RELATIONSHIP_DRIFT = {
  /** Points per hour of a shared routine session, up to `sharedCap`. */
  perSharedHour: 0.2,
  sharedCap: 60,
  /** Days without contact before drift starts, then one point per `everyDays`. */
  graceDays: 30,
  everyDays: 30,
  points: 1,
  /** Drift stops at this distance from 0 (the neutral band is -19..19). */
  floor: 20,
} as const;
