// Progression constants (architecture §12: "All constants live in src/data/progression.config.ts,
// each commented with the target it serves"). Every value cites its spec section.

import type { Intensity } from './activities';
import type { AgeRow, RustRow } from './skills';

// ---- Curve (progression-numbers §2) ----
/** Solved so the Average profile reaches 41 in exactly 16.0 years (D-102; docs-v2/calc/progression-sim.mjs: 15.181). */
export const K = 15.181;
export const CURVE_EXP = 1.75;

/** progression-numbers §1. [min level, name]. */
export const TIERS = [
  [151, 'Transcendent'],
  [101, 'Legendary'],
  [81, 'High Master'],
  [61, 'Master'],
  [41, 'Adept'],
  [21, 'Apprentice'],
  [0, 'Untrained'],
] as const;
export type TierName = (typeof TIERS)[number][1];
/** Crossing one of these adds a tier beat (architecture §12). */
export const TIER_THRESHOLDS = [21, 41, 61, 81, 101, 151] as const;

// ---- Fatigue (progression-numbers §3, §9, §10; health §2) ----
export const INTENSITY: Record<Intensity, { load: number; xp: number }> = {
  casual: { load: 0.6, xp: 0.7 },
  standard: { load: 1.0, xp: 1.0 },
  intense: { load: 1.4, xp: 1.2 },
  extreme: { load: 1.8, xp: 1.35 },
};
/** Session step (meters update every 30 minutes). */
export const STEP_HOURS = 0.5;
/** Capacity = base + perHundred * min(stat,100)/100 + max(0, min(stat,150) - 100)/over100Per. */
export const CAPACITY = { base: 3, perHundred: 4, over100Per: 50, maxStat: 150 } as const;
/** Force capacity (health §2): 3 + 3 * FC/100 + 1 * Will/100 + max(0, min(FC,150)-100)/50. */
export const FORCE_CAPACITY = { base: 3, perHundredFc: 3, perHundredWill: 1, over100Per: 50, maxStat: 150 } as const;
/** e(f): 1.0 up to 0.4, linear to 0.3 at 1.0, 0.1 above 1.0. */
export const EFFICIENCY = { flatUntil: 0.4, atLimit: 0.3, overLimit: 0.1 } as const;
/** Cross-meter penalties of each 30 minutes. */
export const CROSS_PENALTY = { physicalFromMental: 0.15, mentalFromPhysical: 0.5 } as const;
/** First 1.0 h of mental activity after physical activity (physical load >= 0.8) counts x1.25. */
export const POST_WORKOUT = { hours: 1.0, factor: 1.25, minPhysicalLoad: 0.8 } as const;
/** Each hour beyond 2 of the same activity in one day x0.85. */
export const SAME_ACTIVITY = { freeHours: 2, factor: 0.85 } as const;
/** Recovery per hour of rest (progression-numbers §3, health §2). Meditation restores Force 2.0/h. */
export const REST_RECOVERY = { p: 0.75, m: 1.0, f: 1.0 } as const;
export const MEDITATION_FORCE_RECOVERY = 2.0;
/** Sleep (D-52): 7 h+ full reset; 5-7 h 30% carries over; under 5 h 60%. */
export const SLEEP = { fullHours: 7, partialHours: 5, partialCarry: 0.3, shortCarry: 0.6 } as const;
/** Willpower from fatigue (§9): 1.5 * g(f) per hour, g 0 below 0.6, 0.25 -> 1.0 over 0.6..1.0, 1.5 above. */
export const FATIGUE_WILLPOWER = { perHour: 1.5, startF: 0.6, g0: 0.25, g1: 1.0, gOver: 1.5, dailyCap: 3.0 } as const;
/** Overtraining streak (§10). */
export const OVERTRAINING = { capacityPerDay: 0.1, maxCapacityCut: 0.5, halveWillpowerFromDay: 3, resetBelowF: 0.6 } as const;
/** Day-end tiredness limits by effort (training-routines §4 rule 6). */
export const TIREDNESS_LIMIT = { easy: 0.7, standard: 0.9, push: 1.0 } as const;
/** Meter labels for the sheet and the prompt (f = meter / capacity). */
export const TIREDNESS_LABELS = [
  [1.0, 'overtrained'],
  [0.8, 'exhausted'],
  [0.6, 'tired'],
  [0.4, 'worked'],
  [0, 'fresh'],
] as const;

// ---- Challenge (§4) ----
export const CHALLENGE_ANCHORS: readonly (readonly [number, number])[] = [
  [-25, 0.3],
  [-15, 0.6],
  [-10, 1.0],
  [5, 1.0],
  [12, 1.25],
  [18, 1.25],
  [25, 0.8],
  [35, 0.3],
];
/** Scheduler drill choice (training-routines §3): standard/easy gap -10..+10, push +10..+20. */
export const DRILL_GAP = { standard: [-10, 10], easy: [-10, 10], push: [10, 20] } as const;

// ---- XP per session (§5) ----
export const PRIMARY_SHARE = 0.75;
export const SECONDARY_SHARE = 0.25;
/** Outcome roll (mean 0.996). [name, probability, multiplier]. */
export const OUTCOMES = [
  ['failure', 0.15, 0.7],
  ['partial', 0.25, 0.9],
  ['solid', 0.38, 1.0],
  ['strong', 0.18, 1.2],
  ['breakthrough', 0.04, 1.75],
] as const;
export type OutcomeName = (typeof OUTCOMES)[number][0];
export const TALENT_LEVELS = ['none', 'gifted', 'prodigy', 'exceptional'] as const;
export type TalentLevel = (typeof TALENT_LEVELS)[number];
export const TALENT_MULT: Record<TalentLevel, number> = { none: 1.0, gifted: 1.25, prodigy: 1.5, exceptional: 1.8 };
/** Character creation §1: 3 talent points; gifted 1, prodigy 2, exceptional 3. */
export const TALENT_COST: Record<TalentLevel, number> = { none: 0, gifted: 1, prodigy: 2, exceptional: 3 };
export const TALENT_POINTS = 3;
/** Cross-talent: a Force prodigy or better gets x1.1 on combat (technique) skills (M3 plan, D-107). */
export const CROSS_TALENT = 1.1;
export const M_CAP = 2.8;
/** D-48 clamp. */
export const PACE_CAP = 4.0;
export const AVERAGE_MAIN_SHARE = 0.5;
export const PACE_WINDOW_DAYS = 365;
/**
 * Y_avg(age): the Average profile's main-skill XP for the 365 days starting at that age
 * (progression-numbers §5, recomputed by D-102, K = 15.18).
 */
export const Y_AVG: readonly (readonly [number, number])[] = [
  [4, 582],
  [8, 544],
  [12, 691],
  [16, 670],
  [20, 720],
  [24, 595],
  [30, 585],
  [40, 572],
  [50, 556],
  [60, 599],
  [70, 544],
  [80, 544],
  [90, 425],
  [98, 304],
];

// ---- Age and learning speed (§16) ----
export const AGE_ANCHOR_X = [6, 10, 15, 24, 40, 60] as const;
export const AGE_ROWS: Record<AgeRow, readonly number[]> = {
  technique: [1.25, 1.15, 1.05, 1.0, 0.95, 0.9],
  wisdom: [0.85, 0.9, 0.95, 1.0, 1.1, 1.2],
  physical: [0.8, 0.9, 1.1, 1.0, 0.9, 0.75],
  academic: [1, 1, 1, 1, 1, 1],
};

// ---- Rust (§13) ----
export interface RustRule {
  graceDays: number;
  /** Fraction per 30 days and the cap, at level <= 40 (technique) or for every level. */
  rate: number;
  cap: number;
  /** Technique / Force: rate and cap scale linearly from level 40 to level 80+ (0.5%, 10%). */
  deep?: { fromLevel: number; toLevel: number; rate: number; cap: number };
}
export const RUST: Record<RustRow, RustRule> = {
  technique: { graceDays: 30, rate: 0.01, cap: 0.15, deep: { fromLevel: 40, toLevel: 80, rate: 0.005, cap: 0.1 } },
  physical: { graceDays: 14, rate: 0.01, cap: 0.2 },
  knowledge: { graceDays: 30, rate: 0.0025, cap: 0.05 },
};
/** Each effective hour of practice removes 0.5 percentage points of rust. */
export const RUST_REMOVAL_PER_HOUR = 0.005;

// ---- Synergy (§14) ----
export type SynergyRelation = 'variant' | 'parentForm' | 'foundation' | 'parentAbility' | 'subAbility' | 'forceControl' | 'forceSense' | 'physical';
export const SYNERGY: Record<SynergyRelation, { coef: number; ceiling: number }> = {
  variant: { coef: 0.25, ceiling: 0.6 },
  parentForm: { coef: 0.1, ceiling: 0.5 },
  foundation: { coef: 0.05, ceiling: 0.4 },
  parentAbility: { coef: 0.1, ceiling: 0.5 },
  subAbility: { coef: 0.15, ceiling: 0.8 },
  forceControl: { coef: 0.03, ceiling: 0.3 },
  forceSense: { coef: 0.05, ceiling: 0.4 },
  physical: { coef: 0.05, ceiling: 0.8 },
};
/** Total spillover from one session may not exceed 25% of its credited XP. */
export const SYNERGY_SESSION_CAP = 0.25;

// ---- Instruction (§15, §19) ----
export const TEACHER = { perLevel: 0.005, minDiff: -10, maxDiff: 30, maxFactor: 1.15, aptitude: 0.05, bond: 0.03 } as const;
export const HOLOCRON = { physical: 0.9, other: 1.0 } as const;
export const TRAINING_MODE = { solo: 0.9, partner: 1.0, weakPartner: 0.95, partnerRange: 15 } as const;

// ---- Training budget (training-routines §2, D-25) ----
export const BUDGET: Record<'easy' | 'standard' | 'push', readonly (readonly [number, number])[]> = {
  easy: [
    [10, 3],
    [15, 4],
    [20, 4],
  ],
  standard: [
    [10, 4],
    [15, 6],
    [20, 6],
  ],
  push: [
    [10, 5],
    [15, 7],
    [20, 8],
  ],
};
export const TRAINING_DAYS_PER_YEAR = 300;

// ---- State of mind (§17, D-46, D-54) ----
export const STATES_OF_MIND = ['centered', 'neutral', 'distracted', 'fear', 'anger', 'hatred', 'pride', 'despair'] as const;
export type StateOfMind = (typeof STATES_OF_MIND)[number];
/** Strongest wins: hatred > anger > fear > despair > pride > distracted > centered > neutral. */
export const STATE_STRENGTH: Record<StateOfMind, number> = { hatred: 7, anger: 6, fear: 5, despair: 4, pride: 3, distracted: 2, centered: 1, neutral: 0 };
export const STATE_MULT = {
  centered: 1.05,
  neutral: 1.0,
  distracted: 0.9,
  pride: 1.0,
  despair: 0.8,
  /** fear / anger / hatred: light-side techniques and Meditation x0.80; channeling x1.20 (x1.30 when D > 50). */
  passionLight: 0.8,
  passionChannel: 1.2,
  passionChannelDark: 1.3,
  passionDarkThreshold: 50,
} as const;
/** +0.5 dark pressure per effective hour channeled (alignment, M6: logged only in M3). */
export const PASSION_DARK_PRESSURE_PER_HOUR = 0.5;
export const GRIEF_MULT = 0.8;
/** Grief and despair ease back to x1.00 over 14-30 days by intensity 1-3 (design, D-107). */
export const EASE_DAYS: Record<1 | 2 | 3, number> = { 1: 14, 2: 21, 3: 30 };
/** emotionalEvent.type -> state (§17 table). Grief is the lingering condition, not a state. */
export const EMOTION_TO_STATE: Record<string, StateOfMind | 'grief'> = {
  grief: 'grief',
  fear: 'fear',
  anger: 'anger',
  hatred: 'hatred',
  calm: 'centered',
  pride: 'pride',
  despair: 'despair',
};
/** Passion states (fear, anger, hatred) last until calm or this many days (design, D-107). */
export const PASSION_DAYS = 3;
/** Centered from meditation: 30+ minutes of meditation today (§17). */
export const CENTERED_MEDITATION_HOURS = 0.5;
/** Distracted: an open thread with a deadline within 3 days, or an overtraining streak of 2+ days. */
export const DISTRACTED = { deadlineDays: 3, streakDays: 2 } as const;

// ---- Physical performance and natural baseline (§11, §11a) ----
/** Human body cap by age (straight lines between points). */
export const HUMAN_BODY_CAP: readonly (readonly [number, number])[] = [
  [5, 15],
  [9, 25],
  [12, 35],
  [15, 50],
  [18, 65],
  [22, 80],
  [35, 80],
  [45, 78],
  [55, 74],
  [65, 68],
  [75, 58],
  [85, 45],
  [100, 25],
];
/** Force boost = min(45, 0.3 * max(0, FC - 40) + 0.2 * Force body-ability level). */
export const FORCE_BOOST = { max: 45, fcFrom: 40, fcPer: 0.3, bodyPer: 0.2 } as const;
/** Natural baseline (§11a, D-102): physical = 0.5 * body cap(h); Willpower by age; others 0. */
export const NATURAL_PHYSICAL_FACTOR = 0.5;
export const NATURAL_WILLPOWER: readonly (readonly [number, number])[] = [
  [4, 10],
  [10, 18],
  [16, 25],
  [20, 30],
  [30, 35],
  [60, 40],
];

// ---- Closed form (npc-generation §1, D-43, D-105) ----
/** A_ref = A(technique, 4, 20): the Average reaches 41 in 16 years from age 4. */
export const CLOSED_FORM = { referenceLevel: 41, refStart: 4, refEnd: 20, warFactor: 0.3 } as const;
