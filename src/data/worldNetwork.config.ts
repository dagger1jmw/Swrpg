// Numbers of the world-event tag network (D-466). Every number here is `invented` (a design default for Jared to rule
// on): the design notes give guards only in words. low: one scene or a single good roll; medium: a deliberate effort (a
// mission, an investigation, a won fight); high: foreknowledge or extraordinary action; very high (Jared, D-467): several
// steps that each must succeed, or a much harder feat. The first three guards are accepted for now (D-467 [1]).
import type { CheckGrade } from './checks.config';
import type { TestStrength, WorldGuard } from './worldNetwork';

export interface GuardRule {
  /** An action's check total is measured against this rating's DC (10 + rating / 10), not the scene's own. invented */
  rating: number;
  /** Points needed to break the condition. invented */
  points: number;
}

export const GUARD_RULES: Readonly<Record<WorldGuard, GuardRule>> = {
  low: { rating: 50, points: 1 },
  medium: { rating: 70, points: 3 },
  high: { rating: 90, points: 6 },
  veryHigh: { rating: 110, points: 10 },
};

/** Points of a recorded fact or a won fight: decisive breaks a high guard, major a medium one, minor a low one. invented */
export const STRENGTH_POINTS: Readonly<Record<TestStrength, number>> = { minor: 1, major: 3, decisive: 6 };

/** Points of one action by its grade against the guard's DC; a condition's points never fall below 0. invented */
export const GRADE_POINTS: Readonly<Record<CheckGrade, number>> = {
  'exceptional success': 3,
  'decisive success': 2,
  'strong success': 2,
  'clear success': 1,
  'narrow success': 1,
  'narrow failure': 0,
  'clear failure': 0,
  'bad failure': -1,
};

/** Counted actions per condition per in-game day: breaking a guard is never one scene of repeated rolls. invented */
export const ACTIONS_PER_CONDITION_PER_DAY = 1;

/** Foreknowledge is its own step at this guard: its DC and its points (D-467 [6]). */
export const PREREQUISITE_GUARD: WorldGuard = 'medium';
/** Distinct prerequisites a guard needs before anything counts (D-467 [1], [6]). A condition that lists one needs at least one. */
export const PREREQUISITES_NEEDED: Readonly<Record<WorldGuard, number>> = { low: 0, medium: 0, high: 1, veryHigh: 2 };

/** A fact or thread that repeats this share of the significant words of what is to come states the secret outright: no lead. invented */
export const SECRET_OVERLAP = 0.6;

/** Words that mark a fact or thread as a vision or a feeling in the Force: never a lead (D-489). The list is invented. */
export const FORESEEN_WORDS = /\b(?:visions?|premonitions?|foresee[ns]?|foresaw|foresight|foretold|dream(?:s|ed|t)?|nightmares?|prophec(?:y|ies)|(?:sens|feel|felt|stirr?)\w*\b[^.]*\b(?:in|through) the Force|disturbance in the Force|the Force (?:warns?|whispers?|shows?|tells?))\b/i;

/** The narrator gets at most this many new timeline entries a turn; the rest wait. invented */
export const TIMELINE_TOLD_MAX = 10;
/** ...and is reminded of at most this many past divergences (the newest). invented */
export const DIVERGENCES_SHOWN_MAX = 10;
