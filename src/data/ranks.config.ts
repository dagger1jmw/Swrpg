// Rank ladders, trials, standing and Padawan selection (ranks.md §1-5, flag-registry.md §2-3; M7 §15, D-424). The rank
// rows and skill minimums are in rankMinimums.ts; these are the rules around them. Numbers cite ranks.md, or are tagged
// design defaults (D-424).

/** The five Knight Trials (ranks.md §1). Each check is a skill against a difficulty rating (DC = 10 + rating / 10). */
import { INITIATE_CURRICULUM } from './initiateCurriculum';

export const KNIGHT_TRIAL_IDS = ['skill', 'courage', 'flesh', 'spirit', 'insight'] as const;
export type KnightTrialId = (typeof KNIGHT_TRIAL_IDS)[number];
export type TrialId = KnightTrialId | 'initiate';

export interface TrialCheckDef {
  /** A skill id, or '$highestForm'. */
  skill: string;
  /** Difficulty rating; 'spirit' reads the dark pressure instead (DC 10 + D / 5 + 4). */
  rating: number;
}
export interface TrialDef {
  id: TrialId;
  name: string;
  checks: readonly TrialCheckDef[];
  /** Checks to pass of `checks` (Skill: 3 of 4). */
  need: number;
  /** The scene starts at this physical tiredness (Flesh: f 0.8). */
  startF?: number;
  /** Wartime credit: a heroicAct flag counts as passing it (Courage and Flesh, ranks.md §1). */
  heroicCredit?: boolean;
  /**
   * Basic competence (not rolled): at least `need` of these form groups at `floor` or more (a group reads its best form).
   * The Initiate Trials' Forms II-VI (D-459).
   */
  competence?: { groups: readonly (readonly string[])[]; need: number; floor: number };
  note: string;
}

export const TRIALS: Readonly<Record<TrialId, TrialDef>> = {
  initiate: {
    id: 'initiate',
    name: 'the Initiate Trials',
    // D-459 (Jared): the dueling test is Form I at rating 20 plus basic competence in the other five forms of the
    // Initiate curriculum (4 of 5 at 18+: the Average's lowest of Forms II-VI after a survey year, rounded down; D-460:
    // 18.0 at 11, measured 2026-11-23, gated seed, K 11.64, the gate at 5 and Form I at 75% in the survey; D-459 had
    // 16.4 at K 11.5); Force Control at rating 20 as before.
    checks: [
      { skill: 'shiiCho', rating: 20 },
      { skill: 'forceControl', rating: 20 },
    ],
    need: 2,
    competence: { groups: INITIATE_CURRICULUM.surveyForms, need: 4, floor: 18 },
    note: 'eligibility to be chosen as a Padawan (ranks.md §1: Form I and Force Control at rating 20; 4 of Forms II-VI at 18+)',
  },
  skill: {
    id: 'skill',
    name: 'the Trial of Skill',
    checks: [
      { skill: '$highestForm', rating: 45 },
      { skill: '$highestForm', rating: 45 },
      { skill: '$highestForm', rating: 45 },
      { skill: '$highestForm', rating: 45 },
    ],
    need: 3,
    note: 'a duel or droid gauntlet: 3 of 4 checks of the highest form at rating 45',
  },
  courage: { id: 'courage', name: 'the Trial of Courage', checks: [{ skill: 'willpower', rating: 40 }], need: 1, heroicCredit: true, note: 'a fear scenario: Willpower at rating 40 + the fear level' },
  flesh: {
    id: 'flesh',
    name: 'the Trial of the Flesh',
    checks: [
      { skill: 'endurance', rating: 40 },
      { skill: 'willpower', rating: 40 },
    ],
    need: 2,
    startF: 0.8,
    heroicCredit: true,
    note: 'pain and deprivation: Endurance and Willpower at rating 40 while fatigued (f 0.8)',
  },
  spirit: { id: 'spirit', name: 'the Trial of Spirit', checks: [{ skill: 'willpower', rating: 0 }], need: 1, note: 'confront one\'s own darkness: Willpower at DC 10 + dark pressure / 5 + 4' },
  insight: { id: 'insight', name: 'the Trial of Insight', checks: [{ skill: 'forceSense', rating: 45 }], need: 1, note: 'perceive a hidden truth: Force Sense at rating 45' },
};

/** Retakes (ranks.md §1): after 1 in-game year, at most twice; a third failure gives the three choices. */
export const TRIAL_RULES = { retakeWaitDays: 368, maxFailures: 3 } as const;

/** Padawan selection (ranks.md §1, D-66, D-120): S / 940 a month from the Initiate Trials to age 13. */
export const SELECTION = {
  divisor: 940,
  maxAge: 13,
  /** A Knight on a mission takes interest while in the Service Corps: 2% a month (ranks.md §1). */
  corpsChance: 0.02,
  /** The seeded population for the skill percentile (D-66): NPC Initiates of the same age. */
  population: 1000,
} as const;
export const SERVICE_CORPS = ['agricultural', 'medical', 'educational', 'exploration'] as const;

/** Standing S, 0-100 (ranks.md §1): 50% skill percentile, 30% deeds, 20% relationships with Knights and Masters. */
export const STANDING_WEIGHTS = { percentile: 0.5, deeds: 0.3, relationships: 0.2 } as const;
/** Each engine-set deed flag is worth this much of the deeds score, to 100 at DEEDS_PAST.from deeds (design default, D-424). */
export const DEED_POINTS = 20;
/**
 * Deeds past the fifth (D-435, Jared): they still count, with diminishing returns: the deeds score is
 * 100 + extra x (1 - exp(-(n - from) / scale)), toward 130. Invented. Tuned so an average Padawan (the 15th-26th
 * percentile among Padawans) never reaches the bypass's 75 even with perfect relationships (at most 72), while a strong
 * one with sustained deeds can (the 60th percentile with relationships +40 at about 13 deeds).
 */
export const DEEDS_PAST = { from: 5, extra: 30, scale: 5 } as const;

/** masterApproval (flag-registry §2): Padawan 6+ years, age 18+, relationship with the master +40 (friend), Knight minimums met. */
export const MASTER_APPROVAL = { relationship: 40 } as const;
/** The Council bypass (flag-registry §3): wartime, a heroicAct, standing 75+, age 18+, a Padawan meeting the Knight minimums. */
export const COUNCIL_BYPASS = { standing: 75, minAge: 18 } as const;
/** A Knight may take a Padawan from 25 with the Council's approval (ranks.md §1). */
export const TAKE_PADAWAN_AGE = 25;
/** A High Council seat (ranks.md §1): a Master, a vacancy (story), main specialty 70, Council standing. */
export const COUNCIL_SEAT = { main: 70, standing: 75 } as const;

/**
 * Pace-for-age milestones (ranks.md §4): pace for age = the character's level / the Average's level at the same training
 * years, in the main specialty, checked monthly after `afterYears` of training; each fires once as a milestone beat.
 */
export const PACE_MILESTONES = {
  afterYears: 3,
  noticed: { pace: 1.5, label: 'noticed by the masters (pace for age 1.5+ in the main specialty)' },
  prodigyTalk: { pace: 2.0, label: 'prodigy talk across the Temple (pace for age 2.0+)' },
  /** Meets the next rank's skill minimums this many years before the Average's age for it. */
  aheadOfTime: { years: 3, label: "ahead of their time (the next rank's minimums met 3+ years early)" },
} as const;
export type PaceMilestone = 'noticed' | 'prodigyTalk' | 'aheadOfTime';
