// Progression constants (architecture §12: "All constants live in src/data/progression.config.ts,
// each commented with the target it serves"). Every value cites its spec section.

import type { Intensity } from './activities';
import type { AgeRow, RustRow } from './skills';

// ---- Curve (progression-numbers §2) ----
/**
 * Solved so the Average profile's highest form reaches 41 in exactly 16.0 years (D-118 / D-119:
 * Shii-Cho as an Initiate, then the main form 2 h + second form 1 h from Padawan, with the 0.75
 * fundamentals transfer). Re-solved on the real day loop (D-431, 2026-11-22; npm run ksolve, the gated seed: 41 at 15.995
 * years) with the daily meditation block and the age-scaled Padawan hours: 12.30 (it was 11.683 from
 * docs-v2/calc/progression-sim.mjs, and 15.181 under D-102). D-456 (2026-11-23): re-solved after the rest-before-trim
 * fix (the fill is no longer trimmed, so the Average trains more hours): 12.45 (12.30 gave 41 at 15.834, 12.47 gave 16.027).
 * D-459 (2026-11-23): the Initiate lightsaber curriculum moves the Average's 41 to 18.51 years at 12.45; the solve wants
 * K 10.21, under the 11.5 bound of the tuning rules, so K sat at the bound. D-460 (Jared): the Padawan specialty
 * transfer, the gate over free training, Form I at 75% in the survey and the gate at 5 bring the solve back inside the
 * bounds: 11.64 (11.5 gave 41 at 15.842, 11.66 gave 16.024, 11.64 gives 16.000 on the gated seed).
 */
export const K = 11.64;
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
export const OVERTRAINING = { capacityPerDay: 0.1, maxCapacityCut: 0.5, /** From this consecutive overtrained day the whole day's fatigue Willpower is halved (D-110). */ halveWillpowerFromDay: 3, resetBelowF: 0.6 } as const;
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
/**
 * The career youth phase (D-461, Jared): a career that starts before this age gets one measured pace from its start to
 * here, then its adult pace. The training budget reaches its adult hours at 15 (BUDGET: 4 h to 10, 6 h at 15 on
 * standard), which a single pace cannot follow (the Mandalorian, start 8: about 1.04 at 9-11, 1.43 by 60). Sith acolytes
 * will use it too (later).
 */
export const CAREER_YOUTH_TO = 15;
export const PACE_WINDOW_DAYS = 365;
/**
 * Y_avg(age): the Average profile's most-trained form XP for the 365 days starting at that age
 * (progression-numbers §5, K = 11.683), re-measured on the routine day loop in M4 (D-132) and again after the M5
 * retune (D-166) and after the known-abilities spillover rule (D-207): the training XP of the Average with its yearly
 * mission (combat XP excluded), median of the fixed seed and 5 more.
 */
/**
 * D-431 (Jared): re-measured for the Knight-at-25 Average with the daily meditation block and the age-scaled Padawan hours
 * (K 12.30): the table times the 20-seed median ratio per age (npm run spread, 2026-11-22). The frozen ages of D-426 are
 * gone; the 4.0x stays defined against the Average. D-445: re-measured again with the Average in the Coruscant Temple (the
 * 20-seed medians moved 30: 444 -> 405, 90: 324 -> 300, 60: 505 -> 498; the rest within 1%).
 * D-456 (2026-11-23): re-measured after the rest-before-trim fix (K 12.45): the dip at 30 is gone (405 -> 484), 90: 300 ->
 * 338, 16: 604 -> 625, 60: 498 -> 480; the rest within 1.5%.
 */
export const Y_AVG_FROZEN_AGES: readonly number[] = [];
/**
 * D-459 (2026-11-23): re-measured on the Initiate lightsaber curriculum with the per-hour clamp (K 11.5, 20-seed medians,
 * the clamp open): no form XP before the saber gate (about 5.7), so 4: 0; 8: 609 -> 550, 12: 606 -> 662 (the survey's
 * transfers), 20: 629 -> 595, 90: 338 -> 275, 98: 207 -> 226 (the old share rule had clamped the Average's last years).
 * D-460 (2026-11-23): re-measured the same way at K 11.64 with the gate at 5, Form I at 75% in the survey, the gate over
 * free training and the Padawan specialty transfer (transfers excluded, as D-119's): 8: 550 -> 567, 12: 662 -> 620 (the
 * Padawan main form starts higher, so its first-year drill gains are smaller), 20: 595 -> 634, 60: 461 -> 449; the rest
 * within 2.5%.
 */
export const Y_AVG: readonly (readonly [number, number])[] = [
  [4, 0],
  [8, 567],
  [12, 620],
  [16, 624],
  [20, 634],
  [24, 561],
  [30, 487],
  [40, 471],
  [50, 460],
  [60, 449],
  [70, 452],
  [80, 447],
  [90, 268],
  [98, 223],
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
export type SynergyRelation = 'variant' | 'parentForm' | 'foundation' | 'nimanFoundation' | 'parentAbility' | 'subAbility' | 'forceControl' | 'forceSense' | 'physical';
export const SYNERGY: Record<SynergyRelation, { coef: number; ceiling: number }> = {
  variant: { coef: 0.25, ceiling: 0.6 },
  parentForm: { coef: 0.1, ceiling: 0.5 },
  foundation: { coef: 0.05, ceiling: 0.4 },
  /** Forms I, III, IV, V -> Niman (D-121; replaces the 0.05 foundation into Niman). */
  nimanFoundation: { coef: 0.1, ceiling: 0.6 },
  parentAbility: { coef: 0.1, ceiling: 0.5 },
  subAbility: { coef: 0.15, ceiling: 0.8 },
  forceControl: { coef: 0.03, ceiling: 0.3 },
  forceSense: { coef: 0.05, ceiling: 0.4 },
  physical: { coef: 0.05, ceiling: 0.8 },
};
/**
 * Fundamentals transfer (D-119): a lightsaber form's first session starts it at this share of the
 * character's highest form XP at that moment. Once per form; outside the 4.0x clamp, like banked XP.
 * Lightsaber forms only, never Force abilities.
 */
export const FORM_TRANSFER_SHARE = 0.75;
/**
 * Niman (Form VI) transfers from the AVERAGE of the Form I, III, IV and V levels, not the highest form
 * (D-121). Each entry is one form; Form V is the higher of its variants Shien and Djem So.
 */
export const NIMAN_TRANSFER_FORMS: readonly (readonly string[])[] = [['shiiCho'], ['soresu'], ['ataru'], ['shien', 'djemSo']];

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
/** Grief and despair ease back to x1.00 over 14-30 days by intensity 1-3 (design, D-108). */
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
/** Passion states (fear, anger, hatred) last until calm or this many days (design, D-108). */
export const PASSION_DAYS = 3;
/** Centered from meditation: 30+ minutes of meditation today (§17). */
export const CENTERED_MEDITATION_HOURS = 0.5;
/** Distracted: an open thread with a deadline within 3 days, or an overtraining streak of 2+ days. */
export const DISTRACTED = { deadlineDays: 3, streakDays: 2 } as const;

// ---- Physical performance and natural baseline (§11, §11a) ----
/** Human body cap by age up to the peak (straight lines between points); after prime it falls by BODY_DECLINE (ageing.config, D-472). */
export const HUMAN_BODY_CAP: readonly (readonly [number, number])[] = [
  [5, 15],
  [9, 25],
  [12, 35],
  [15, 50],
  [18, 65],
  [22, 80],
];
/** Force boost = min(45, 0.3 * max(0, FC - 40) + 0.2 * Force body-ability level). */
export const FORCE_BOOST = { max: 45, fcFrom: 40, fcPer: 0.3, bodyPer: 0.2 } as const;
/**
 * Force Sense keeps pace with Force Control for every Force user (Jared, 2026-11-25; D-495; both numbers are invented): never more
 * than `gap` levels behind it, and left to its own training up to `free` behind (engine/forceSense.ts).
 */
export const FORCE_SENSE_TRACK = { free: 5, gap: 10 } as const;
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

// ---- Combat XP (combat-xp.md §1-2, D-55; built in M4 for the scripted lifetime fights, D-127) ----
export const COMBAT_STAKES = ['spar', 'skirmish', 'serious', 'lethal'] as const;
export type CombatStakes = (typeof COMBAT_STAKES)[number];
/** interrupted (D-196): an outside event stopped the fight; nobody won, lost or fled, and the opponents are as they stood. */
export const COMBAT_OUTCOMES = ['won', 'lost', 'fled', 'truce', 'interrupted', 'stalemate'] as const;
export type CombatOutcome = (typeof COMBAT_OUTCOMES)[number];
export const COMBAT_XP = {
  /** XP per exchange before challenge, stakes, outcome and M (tunable, §5). */
  perExchange: 0.25,
  /** XP per Force use before challenge, stakes and M. */
  perForceUse: 0.1,
  stakes: { spar: 0.5, skirmish: 1.0, serious: 1.5, lethal: 2.0 } as Record<CombatStakes, number>,
  /** lost = lost and survived; an interrupted fight teaches what was fought at the fled factor, never the win factor (D-196). */
  outcome: { won: 1.0, lost: 1.2, fled: 0.8, truce: 1.0, interrupted: 0.8, stalemate: 0.8 } as Record<CombatOutcome, number>,
  /**
   * A surrender (an outcome of lost) in place of the lost factor (Jared, D-227; combat pass 2 balance row 15: at 1.2 a
   * surrender paid more than fleeing). Below fled, so giving up is never the XP-best way out of a fight.
   */
  surrendered: 0.5,
  /** Daily cap per skill, before M. */
  dailyCap: 12,
  /** The third and later fights in one day. */
  laterFightFactor: 0.5,
  laterFightFrom: 3,
  /** Challenge ramps linearly from the §4 curve's value at gap -25 to 0 at gap -35 (D-65). */
  rampFrom: -25,
  zeroAt: -35,
} as const;

// ---- Applied experience E, combat integration CI, the drill ceiling and bank (progression-numbers §7, §8;
// combat-xp §3; D-45; Order classes as sparring, D-143 A). Built in M5. ----
/**
 * E per session or fight, scaled by (1 - E/120). sparStronger: sparring a partner at least SPAR_STRONGER.minGap levels
 * above (D-163; formerly "sparring with master"). lethalStronger: life-or-death vs an opponent 5+ levels stronger.
 */
export const E_GAIN = { sparPeer: 0.2, sparStronger: 0.4, skirmish: 3, serious: 6, lethal: 6, lethalStronger: 10 } as const;
export type ESource = keyof typeof E_GAIN;
/** Sparring E from peers (and partners less than SPAR_STRONGER.minGap above) is capped at this. */
export const SPAR_E_CAP = 15;
/**
 * Sparring a stronger partner (Jared, D-163): a partner (a master too) at least `minGap` levels above the student's
 * form raises sparring E toward the partner's main-form level minus `targetBelow` (never below SPAR_E_CAP).
 */
export const SPAR_STRONGER = { minGap: 10, targetBelow: 25 } as const;
/** Group sparring (D-163): 2-3 partners at once count as one at the strongest's level + `perExtra` per extra partner. */
export const SPAR_GROUP = { perExtra: 10, maxPartners: 3 } as const;
export const E_SCALE = 120;
/** CI per Force ability use, scaled by (1 - CI/120); CI from sparring capped at 20. */
export const CI_GAIN = { spar: 0.1, skirmish: 0.5, serious: 1, lethal: 2 } as const;
export const SPAR_CI_CAP = 20;
/** Stronger by at least this many levels makes a lethal fight give the +10 E (combat-xp §3). */
export const E_STRONGER_GAP = 5;
export const DRILL_CEILING = {
  base: 25,
  /** Above the ceiling, this share of drill XP applies; the rest is banked. */
  aboveShare: 0.25,
  /** Bank cap: the XP needed for this many levels above the current level. */
  bankLevels: 15,
  /** After a real fight (skirmish+): release this share of the remaining bank per day for `releaseDays`. */
  releaseShare: 0.1,
  releaseDays: 60,
} as const;
/** Order classes that count as sparring for E when taught (D-143 A); peer or stronger by the teacher's level (D-163). */
export const ORDER_SPARRING_CLASSES: readonly string[] = ['shiiChoBasics', 'padawanTraining'];
/** Reviewing a recording of one's own fight (progression-numbers §19). */
export const RECORDING_REVIEW_BONUS = 0.05;


// ---- Special training conditions (D-418; progression-numbers §21) ----
/**
 * Force-rich worlds (D-418, D-425; src/data/forceNexus.ts): Force skills (the Force stats and abilities) train x this on a
 * Force-rich world or a nexus planet, inside the 2.8 M cap and the 4.0x clamp. Invented. Lore basis (Jared): on a
 * Force-rich world you feel the Force more strongly, so you progress faster while using it there.
 */
export const FORCE_RICH_FACTOR = 1.1;
/**
 * A Force nexus site (D-432, Jared): Force skills train x this at a nexus site (the Valley of the Dark Lords, the Temple
 * spire), inside the 2.8 M cap and the 4.0x clamp. No stacking with the planet's factor (the stronger wins), and only where
 * the site's leaning matches the character's or is balanced (src/data/forceNexus.ts forceBonusAt). Invented.
 */
export const NEXUS_SITE_FACTOR = 1.15;
/** A major nexus planet (D-451, Jared: Tython balanced, Korriban and Dromund Kaas dark): x1.15, the same as a site. */
export const MAJOR_NEXUS_FACTOR = 1.15;
/**
 * The accelerated path (Jared, D-418): training cut to using and channelling the Force and blade work; history, protocol
 * and most doctrine dropped (the Order's knowledge blocks leave the routine), so the knowledge and doctrine stats stay
 * low until later study. Force skills and lightsaber forms train x `mult` on top of the 2.8 M cap, and their 4.0x clamp
 * is raised x `capMult`: the only condition allowed past the 4.0x ceiling. The averages and the 4.0x calibration are not
 * changed for it. First guess (invented), tuned on the Luke accelerated-path harness check (tests/lifetime/lukeAccelerated).
 * D-431: x3.4 (was 3.2) after K moved to 12.30: at 3.2 Luke's Djem So was 53.3 at year 5 (target 55+); at 3.4 it is 56.0
 * (Force Control 61.0; 44.1 at year 3). The cap multiplier stays 3.2.
 * D-456: x3.5 after K moved to 12.45 (at x3.4 Djem So was 55.4 at year 5, goal 56).
 */
export const ACCELERATED_PATH = { mult: 3.5, capMult: 3.2 } as const;

// ---- XP sources for the knowledge stats (Jared, D-427; M7). Every number here is invented and tagged. ----
/**
 * Daily-life blocks outside the D-25 training budget (so the forms calibration is untouched), for Order members (the
 * Jedi and Sith paths): a meditation block every training day from Padawan or apprentice on, and a Knight's study
 * expectation (Force lore, the Code) on `daysPerWeek` days of 7 from Knight or Lord on. Both are dropped on the
 * accelerated path except the meditation block (using the Force), which it keeps.
 */
export const DAILY_LIFE = {
  // On from Padawan on (D-431, Jared: daily meditation is normal Jedi life, so the baseline is measured with it; centered
  // stays as is, so Padawans and Knights are centered every training day). K, the paces and Y_AVG were re-measured with it.
  meditation: { hours: 0.5, activityId: 'basicCentering', fromRows: ['padawan', 'knight'] as readonly string[] },
  knightStudy: { hours: 1, daysPerWeek: 3, activityId: { jedi: 'jediCode', sith: 'forceLore' } as Readonly<Record<string, string>> },
} as const;
/**
 * Learning by dueling a stronger opponent (D-427): a serious or lethal fight against an opponent at least `minGap` levels
 * stronger gives `share` of the fight's form XP to the opponent's form as well, even an unknown one (it then opens
 * without a teacher). On the accelerated path the share is x`acceleratedMult` (Jared, D-427: duels count more there).
 */
export const STRONGER_DUEL = { minGap: 10, share: 0.25, acceleratedMult: 2 } as const;
/**
 * The instructor's share (D-433, Jared; replaces the D-163 note): teaching a Padawan, the teacher gains `share` of the
 * student's drill XP in the drilled form, at most `maxPerHour` XP a session hour, counted as teaching. Invented.
 */
export const INSTRUCTOR_SHARE = { share: 0.1, maxPerHour: 0.25 } as const;
/** Natural Intelligence and Charisma by Human-equivalent age (D-427: schooling and life; invented), like Willpower's. */
export const NATURAL_INTELLIGENCE: readonly (readonly [number, number])[] = [
  [4, 4],
  [10, 8],
  [16, 12],
  [20, 14],
  [30, 16],
  [60, 18],
];
export const NATURAL_CHARISMA: readonly (readonly [number, number])[] = [
  [4, 3],
  [10, 6],
  [16, 9],
  [20, 11],
  [30, 13],
  [60, 15],
];
/**
 * Long lives in the NPC closed form (Jared, D-429): the Human-equivalent age counts at most a full life (100: the
 * species' own maturity and lifespan map it, species.md §1), and levels above `from` gain with diminishing returns toward
 * `apex` (the roster's apex, about 135): level = from + (apex - from) x (1 - exp(-(L - from) / (apex - from))). Invented.
 */
export const LONG_LIFE = { maxHumanAge: 100, from: 110, apex: 135 } as const;
