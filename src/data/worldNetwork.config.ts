// Numbers of the world-event tag network (D-466). Every number here is `invented` (a design default for Jared to rule
// on): the design notes give guards only in words. low: one scene or a single good roll; medium: a deliberate effort (a
// mission, an investigation, a won fight); high: foreknowledge or extraordinary action.
import type { CheckGrade, Difficulty } from './checks.config';
import type { TestStrength, WorldGuard } from './worldNetwork';

export interface GuardRule {
  /** An action's check total is measured against this difficulty's DC, whatever the scene's own difficulty was. invented */
  difficulty: Difficulty;
  /** Points needed to break the condition. invented */
  points: number;
}

export const GUARD_RULES: Readonly<Record<WorldGuard, GuardRule>> = {
  low: { difficulty: 'moderate', points: 1 },
  medium: { difficulty: 'hard', points: 3 },
  high: { difficulty: 'extreme', points: 6 },
};

/** Points of a recorded fact or a won fight: decisive breaks any guard, major a medium one, minor a low one. invented */
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

/** A prerequisite learned by an action is measured against this guard's DC. invented */
export const PREREQUISITE_GUARD: WorldGuard = 'medium';

/** The narrator gets at most this many new timeline entries a turn; the rest wait. invented */
export const TIMELINE_TOLD_MAX = 10;
/** ...and is reminded of at most this many past divergences (the newest). invented */
export const DIVERGENCES_SHOWN_MAX = 10;
