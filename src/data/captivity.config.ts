// Captivity (Jared, 2026-11-24; D-471): the narrator no longer decides when a prisoner goes free. EVERY number here is
// `invented`, for Jared to rule on. A rating is a check difficulty: DC = 10 + rating / 10 (rolls.md §2).

/** The captors' security at a blockade: base, and per point of picket strength and alertness over 3. */
export const BLOCKADE_SECURITY = { base: 60, perPoint: 5 } as const;
/** The captors' security after a fight: base, per captor still standing (up to a cap), and for a named captor. */
export const FIGHT_SECURITY = { base: 45, perCaptor: 3, maxCaptors: 8, named: 15 } as const;
export const SECURITY_RANGE = { min: 20, max: 110 } as const;

/** What a prisoner can try with; the best of them unless the player names one. */
export const ESCAPE_SKILLS: readonly string[] = ['stealth', 'agility', 'strength', 'charisma', 'intelligence', 'mindTrick', 'telekinesis'];
/** One attempt a day; a clear failure tightens security, a bad one more and for longer (days without another try). */
export const ESCAPE = { perDays: 1, clearPenalty: 5, badPenalty: 10, badWaitDays: 3, maxPenalty: 20, shipMargin: 8 } as const;

/** The daily chance of rescue, by the allies the player has; scaled by security and capped. */
export const RESCUE = {
  faction: 0.005,
  /** A master, or the apprentice's own. */
  master: 0.01,
  friend: 0.003,
  closeFriend: 0.006,
  /** A friend with a ship or a crew trade counts this much more. */
  crewFactor: 1.5,
  maxFriends: 6,
  friendFrom: 20,
  closeFrom: 60,
  /** Security at which the chance is as listed; half as much again below, down to a fifth above. */
  securityAt: 60,
  minFactor: 0.2,
  maxFactor: 1.5,
  dailyCap: 0.06,
} as const;
export const CREW_ROLES: readonly string[] = ['pilot', 'smuggler', 'soldier', 'officer', 'bountyHunter', 'jediKnight', 'jediMaster', 'sithLord'];
/** Sides that come for their own. */
export const RESCUING_FACTIONS: readonly string[] = ['jediOrder', 'republic', 'sithEmpire', 'mandalorians'];

/** The limit: released, ransomed (a debt in the ledger) or transferred (a new term, harder), by weight. One transfer only. */
export const CAPTIVITY_LIMIT_DAYS = 14;
export const LIMIT_WEIGHTS = { released: 0.4, ransomed: 0.35, transferred: 0.25 } as const;
export const RANSOM_CREDITS = 5000;
export const TRANSFER = { securityUp: 15, max: 1 } as const;
