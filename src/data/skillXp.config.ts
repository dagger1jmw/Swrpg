// XP from play for the non-Force skills (m8-skills, D-513; spec/skills-m8.md section 3; design: m8-design-notes "XP from
// play"). Every source is a structured line from code, never the narrator. Every number here is invented (tagged in the
// spec's section 10) except the persuasion outcome factors (Jared: success 1.0, failure 0.25), the command loss at about half
// (Jared), the 0.2 Intelligence share (Jared), the half rate with a peer (Jared) and the insight cap (Jared: +1, at most +2).

/** The stakes of a social line, a persuasion, a command, an operation (the check's difficulty maps onto them). */
export const PLAY_STAKES = ['minor', 'notable', 'major', 'critical'] as const;
export type PlayStakes = (typeof PLAY_STAKES)[number];
export const STAKES_FACTOR: Readonly<Record<PlayStakes, number>> = { minor: 0.5, notable: 1.0, major: 1.5, critical: 2.0 };
/** A check's difficulty as the stakes of what was at stake (invented). */
export const DIFFICULTY_STAKES: Readonly<Record<string, PlayStakes>> = { trivial: 'minor', easy: 'minor', moderate: 'notable', hard: 'major', extreme: 'critical' };

/**
 * Charisma from social lines (Jared: XP only when code logs a social line, something at stake or a relationship changed;
 * more lines the same day earn less). Base XP per line by stakes; the n-th line of a day earns 1 / (1 + falloff x (n - 1)).
 * Target (Jared): a sociable adult about 30-40 by 30; diplomats 60-80 (with negotiation as work).
 */
export const SOCIAL_LINE = { base: 0.6, falloff: 0.5 } as const;

/** Persuasion (Jared: success 1.0, failure 0.25), by the stakes and the opponent's level (the challenge curve on the gap). */
export const PERSUASION = { base: 1.0, success: 1.0, failure: 0.25 } as const;

/**
 * Tactics from command (Jared: stakes x outcome x size of command; a loss teaches about half). Base XP per battle; size
 * by the units commanded on a log curve; outcome won 1.0, drawn 0.75, lost 0.5 (Jared: about half). A daily cap like
 * combat's (invented).
 */
export const COMMAND = {
  base: 3,
  outcome: { won: 1.0, drawn: 0.75, lost: 0.5 },
  size: { squad: 1.0, platoon: 1.25, company: 1.5, battalion: 1.75, regiment: 2.0, army: 2.5, ship: 1.5, squadron: 1.75, taskForce: 2.0, fleet: 2.5 },
  dailyCap: 12,
} as const;
export type CommandOutcome = keyof typeof COMMAND.outcome;
export type CommandSize = keyof typeof COMMAND.size;

/** Tactics from personal combat (Jared: each strike earned by reaching +3 on the advantage track gives a small share). */
export const STRIKE_TACTICS = { perStrike: 0.05 } as const;

/** Intelligence takes this share of any Tactics XP earned in the field (Jared: 0.2; study already gives 0.4). */
export const FIELD_TACTICS_INTELLIGENCE = 0.2;

/** Discussing tactics with a peer: half the base rate (Jared); with a master the teacher's multiplier applies as usual. */
export const PEER_DISCUSSION_RATE = 0.5;

/**
 * Cultural insight (Jared: Intelligence 80+, the Thrawn model): studying a culture's art or history gives Tactics and an
 * insight bonus against that culture's forces in fleet and ground rolls: +1, at most +2. The study hours for each point
 * (invented).
 */
export const CULTURAL_INSIGHT = { minIntelligence: 80, firstHours: 20, secondHours: 100, max: 2 } as const;

/**
 * Gunnery from shots taken in battle (Jared: scaled by margin and stakes). XP per shot; the margin factor by anchors
 * (a clean miss teaches less, a hit more; invented). The daily cap of combat applies.
 */
export const GUNNERY_SHOT = { perShot: 0.08, margin: [[-12, 0.4], [0, 1.0], [12, 1.2]] as readonly (readonly [number, number])[] } as const;

/**
 * Repair from repairs in a fight or during upkeep (Jared). XP per hour of the job, by the challenge of the job's rating
 * against the level; a failure teaches 0.4; in a fight x1.5 (invented).
 */
export const REPAIR_JOB = { perHour: 0.5, failure: 0.4, inFight: 1.5 } as const;

/**
 * Intelligence field operations earn XP from their stakes and outcome, as commanding does (Jared): the tradecraft split
 * (Investigation 0.75, Stealth and Charisma 0.125 each; invented base).
 */
export const FIELD_OP = { base: 3, outcome: { won: 1.0, drawn: 0.75, lost: 0.5 }, split: { investigation: 0.75, stealth: 0.125, charisma: 0.125 } } as const;

/** Stealth from field use (a stealth check or contest that matters): XP per use by stakes, challenge and outcome (invented). */
export const STEALTH_USE = { base: 0.5, success: 1.0, failure: 0.5 } as const;

/**
 * A mission stage's roll teaches the skill it used (Jared, 27 Nov 2026, m9-tune A4: Investigation on a scene, Piloting, Tactics,
 * Willpower, Force Sense...): field use on stealth's shape (invented: the same numbers), by the stage's stakes and the challenge of
 * its rating against the skill. Stealth keeps STEALTH_USE and Charisma the persuasion rule; a social approach (talk, influence,
 * read them) is also a conversation with something at stake (a social line, Charisma).
 */
export const FIELD_CHECK = { base: 0.5, success: 1.0, failure: 0.5 } as const;
