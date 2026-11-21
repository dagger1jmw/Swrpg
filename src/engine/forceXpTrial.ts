// Force XP rework prototype (docs-v2/spec/force-xp-rework.md; docs-v2/testing/force-xp-trial.md). HARNESS ONLY and OFF
// by default: FORCE_XP_TRIAL.enabled is false in the game and is switched on only by the test harness (tests/support/
// forceXpTrial.ts, from the FORCE_XP environment variable). Nothing here is adopted; the M4 drill ladder (10-90) and
// the max(physical, mental) day trim stay the game's rules.
//
// With the trial on, a Force-discipline session trains on an exercise instead of a ladder rating: the exercise's rating
// sets the challenge factor (the M4 formula is unchanged), its draw comes from the reserve spec (force-reserve.md §3-4),
// a free exercise earns only a trickle, and the day trim also tests projected strain (force-xp-rework.md §4).
// Pure: every number is in FORCE_XP_TRIAL or RESERVE below; no randomness.
import { CHALLENGE_ANCHORS, DRILL_GAP } from '../data/progression.config';
import { interp } from './interp';

export type TrialRow = 'initiate' | 'padawan' | 'knight';
export type TrialEffort = 'easy' | 'standard' | 'push';
export type ExerciseKind = 'control' | 'output' | 'sense';

export interface ForceXpTrialConfig {
  enabled: boolean;
  /** Harness measurement only: record each Force session's challenge factor (on or off). */
  collect: boolean;
  /** Challenge multiplier for an exercise that draws nothing under the free rule (proposal §3). */
  trickle: number;
  /** Demand rating = offset + slope x log2(base x scale x effort x held / 10) (proposal §1). */
  slope: number;
  offset: number;
  /** Work units per drill hour: repetitions of an instant exercise, or minutes held of a sustained one (proposal §4). */
  unitsPerHour: number;
  /** Projected strain limit for the day trim, by the routine's effort (proposal §4). */
  strainLimit: Record<TrialEffort, number>;
  /** A finesse rating at or above this makes an exercise never free (proposal §1). */
  freeFinesseLine: number;
  /**
   * Neutral start (force-xp-trial.md step 1): the challenge factor each default exercise aims at, keyed
   * "row|effort|kind" (kind: control, output, sense), set to today's measured hour-weighted mean for Force sessions below
   * level 80, where the 10-90 ladder does not bind. Missing keys use 1.0 (standard) and 1.25 (push).
   */
  targetChallenge: Record<string, number>;
  /** Midi-chlorian count by character id (the lifetime player is 'pc'); others use defaultCount. */
  counts: Record<string, number>;
  defaultCount: number;
  /** Harness assumptions shared with the precognition trial: pool max share by Force Sense, Conditioning by fighting level. */
  poolShareByForceSense: readonly (readonly [number, number])[];
  conditioningByLevel: readonly (readonly [number, number])[];
}

export const FORCE_XP_TRIAL: ForceXpTrialConfig = {
  enabled: false,
  collect: false,
  trickle: 0.1,
  slope: 30,
  offset: 20,
  unitsPerHour: 12,
  strainLimit: { easy: 0.4, standard: 0.75, push: 1.0 },
  freeFinesseLine: 15,
  // Measured 2026-11-21 (npm run mortals, FORCE_XP=collect, 4 profiles x 20 seeds; force-xp-trial.md step 1). No profile
  // drills Force Output, so output uses control's value.
  targetChallenge: {
    'initiate|standard|control': 1.0065,
    'initiate|standard|output': 1.0065,
    'initiate|standard|sense': 1.0067,
    'initiate|push|control': 1.0102,
    'initiate|push|output': 1.0102,
    'initiate|push|sense': 1.0053,
    'padawan|standard|control': 1.0203,
    'padawan|standard|output': 1.0203,
    'padawan|standard|sense': 1.0243,
    'padawan|push|control': 1.126,
    'padawan|push|output': 1.126,
    'padawan|push|sense': 1.128,
    'knight|standard|control': 1.0222,
    'knight|standard|output': 1.0222,
    'knight|standard|sense': 1.022,
    'knight|push|control': 1.0274,
    'knight|push|output': 1.0274,
    'knight|push|sense': 1.0401,
  },
  counts: {},
  defaultCount: 10_000,
  poolShareByForceSense: [
    [20, 0.3],
    [50, 0.7],
    [90, 0.95],
  ],
  conditioningByLevel: [
    [0, 0],
    [20, 10],
    [50, 40],
    [90, 70],
    [120, 85],
  ],
};

/** Reserve spec numbers (§2-4, §6) used unchanged. */
export const RESERVE = {
  ceilingAtAverage: 500,
  averageCount: 10_000,
  ceilingExponent: 1.5,
  tierBase: 10,
  effort: { light: 0.5, normal: 1.0, strong: 1.5, allOut: 2.0 },
  scaleFactors: [1.0, 1.5, 2.25, 3.4, 5.0, 7.6, 11.4],
  scaleGate: [0, 0, 0, 150, 300, 600, 900],
  masteryReliefPerLevel: 0.006,
  masteryReliefCap: 0.6,
  tiredFocusPerStrain: 0.5,
  tiredFocusCap: 1.5,
  depthAtComfort: 0.25,
  depthBase: 32,
  rateCap: 4,
  combinedCap: 8,
  durationStrain: 0.001,
  free: { basic: 40, moderate: 60 },
  /** Pool refilled (share of pool max) and strain cleared per hour (§6). */
  recovery: { meditation: [0.25, 0.05], sleep: [0.08, 0.12], rest: [0.05, 0.04], normal: [0.02, 0] } as Readonly<Record<string, readonly [number, number]>>,
  tiredRefillFloor: 0.35,
} as const;

/** Catalog tiers (force-catalog-m6.md) of the coded Force abilities. Stats use the default tier by level. */
export const ABILITY_TIER: Readonly<Record<string, number>> = {
  telekinesis: 1.0,
  forcePush: 1.0,
  forceBarrier: 1.0,
  forceJump: 1.0,
  mindTrick: 1.0,
  forceSpeed: 1.5,
  forceChoke: 2.5,
  forceLightning: 2.5,
  forceHealSelf: 2.5,
  forceHealOthers: 2.5,
  revitalize: 2.5,
  forceAbsorb: 4.0,
  battleMeditation: 4.0,
};

/** The default exercise's tier by level (proposal §4 table: Basic for Initiates and Padawans, Moderate for Knights, Complex for Masters). */
export const defaultTier = (level: number): number => (level < 35 ? 1.0 : level < 70 ? 1.5 : level < 100 ? 2.5 : 4.0);

export const exerciseKind = (skillId: string): ExerciseKind => (skillId === 'forceSense' ? 'sense' : skillId === 'forceOutput' ? 'output' : 'control');

/** Reserve §3 efficiency: 1 + the drilled skill's level / 50 + Force Control / 100. */
export const efficiency = (level: number, forceControl: number): number => 1 + Math.max(0, level) / 50 + Math.max(0, forceControl) / 100;

export const demandRating = (base: number, scale: number, effort: number, held = 1): number =>
  FORCE_XP_TRIAL.offset + FORCE_XP_TRIAL.slope * Math.log2((base * scale * effort * held) / 10);

/** The gap (rating - level) whose challenge factor is the target: inside the effort's band if possible, nearest 0 on a tie. */
export function gapForChallenge(target: number, effort: 'standard' | 'push'): number {
  const [lo, hi] = DRILL_GAP[effort];
  let best: { gap: number; err: number } = { gap: 0, err: Infinity };
  for (let i = -200; i <= 500; i++) {
    const g = i / 20;
    const c = interp(CHALLENGE_ANCHORS, g);
    const err = Math.abs(c - target) + (g < lo || g > hi ? 0.001 : 0) + Math.abs(g) * 1e-6;
    if (err < best.err) best = { gap: g, err };
  }
  return best.gap;
}

/** The neutral-start target for a session: by Order row, drill effort and exercise kind, else 1.0 standard / 1.25 push. */
export function targetFor(row: TrialRow, effort: 'standard' | 'push', kind: ExerciseKind): number {
  return FORCE_XP_TRIAL.targetChallenge[`${row}|${effort}|${kind}`] ?? (effort === 'push' ? 1.25 : 1.0);
}

export interface Exercise {
  kind: ExerciseKind;
  tier: number;
  /** Base cost before scale, effort and efficiency: 10 x tier for instant control and output; the catalog sustained cost for sense. */
  base: number;
  scale: number;
  effort: number;
  finesse: number;
  rating: number;
  /** Draw per work unit before the tired-focus state. */
  drawPerUnit: number;
  sustained: boolean;
  free: boolean;
  /** What the exercise is, for notes. */
  label: string;
}

export interface ExerciseCtx {
  /** The drilled skill's level (the challenge level). */
  level: number;
  forceControl: number;
  poolMax: number;
  targetRating: number;
}

const largestAllowedScale = (poolMax: number): number => {
  let s: number = RESERVE.scaleFactors[0]!;
  RESERVE.scaleFactors.forEach((f, i) => {
    if (poolMax >= RESERVE.scaleGate[i]!) s = f;
  });
  return s;
};

const reliefScale = (scale: number, level: number): number => 1 + (scale - 1) * (1 - Math.min(RESERVE.masteryReliefCap, RESERVE.masteryReliefPerLevel * Math.max(0, level)));

/**
 * The default exercise for a session (proposal §1-2, as built for the trial). Control: the ability's tier (stats: the
 * default tier by level) at normal effort, finesse filling up to the target rating (precision, distraction and duration
 * add no draw). Output: the tier at normal effort with scale (continuous between classes) up to the target, pool max
 * gating classes 3+; strong or all-out effort makes up what the gate cuts. Sense: Force Sight (Basic, sustained 2 per
 * minute) below level 60, Precognition (Complex, sustained 5) from 60 (the catalog's sustained costs, Jared 2026-11-21);
 * finesse (obscured, distraction, range within a room) up to +70 adds no draw, past it each distance class multiplies
 * draw by the scale factor.
 */
export function buildExercise(skillId: string, ctx: ExerciseCtx): Exercise {
  const kind = exerciseKind(skillId);
  const eff = efficiency(ctx.level, ctx.forceControl);
  const E = RESERVE.effort;
  if (kind === 'output') {
    const tier = defaultTier(ctx.level);
    const base = RESERVE.tierBase * tier;
    const maxScale = largestAllowedScale(ctx.poolMax);
    let effort: number = E.normal;
    let scale = (10 * 2 ** ((ctx.targetRating - FORCE_XP_TRIAL.offset) / FORCE_XP_TRIAL.slope)) / (base * effort);
    if (scale < 1) {
      effort = E.light;
      scale = Math.max(1, scale * 2);
    }
    if (scale > maxScale) {
      const need = scale * effort;
      scale = maxScale;
      effort = Math.min(E.allOut, Math.max(E.normal, need / maxScale));
    }
    const rating = demandRating(base, scale, effort);
    const free = tier <= 1.5 && ctx.level >= (tier <= 1 ? RESERVE.free.basic : RESERVE.free.moderate) && effort <= E.normal && scale <= RESERVE.scaleFactors[1]!;
    return { kind, tier, base, scale, effort, finesse: 0, rating, drawPerUnit: free ? 0 : (base * reliefScale(scale, ctx.level) * effort) / eff, sustained: false, free, label: `output tier ${tier} scale ${scale.toFixed(2)} effort ${effort}` };
  }
  if (kind === 'sense') {
    const precog = ctx.level >= 60;
    const tier = precog ? 2.5 : 1.0;
    const cost = precog ? 5 : 2;
    let effort: number = E.normal;
    let demand = demandRating(RESERVE.tierBase * tier, 1, effort);
    if (ctx.targetRating < demand) {
      effort = E.light;
      demand = demandRating(RESERVE.tierBase * tier, 1, effort);
    }
    const finesse = Math.max(0, ctx.targetRating - demand);
    let scale = 1;
    for (let cls = 1; finesse > 70 + 60 * (cls - 1) && cls < RESERVE.scaleFactors.length; cls++) scale = RESERVE.scaleFactors[cls]!;
    const free = !precog && ctx.level >= RESERVE.free.basic && finesse < FORCE_XP_TRIAL.freeFinesseLine;
    return { kind, tier, base: cost, scale, effort, finesse, rating: demand + finesse, drawPerUnit: free ? 0 : (cost * reliefScale(scale, ctx.level) * effort) / eff, sustained: true, free, label: `${precog ? 'precognition' : 'Force Sight'} finesse ${finesse.toFixed(0)}` };
  }
  const tier = ABILITY_TIER[skillId] ?? defaultTier(ctx.level);
  const base = RESERVE.tierBase * tier;
  let effort: number = E.normal;
  let finesse = ctx.targetRating - demandRating(base, 1, effort);
  if (finesse < 0) {
    effort = E.light;
    finesse = Math.max(0, ctx.targetRating - demandRating(base, 1, effort));
  }
  const freeTier = tier <= 1.5 && ctx.level >= (tier <= 1 ? RESERVE.free.basic : RESERVE.free.moderate);
  const free = freeTier && finesse < FORCE_XP_TRIAL.freeFinesseLine;
  return { kind, tier, base, scale: 1, effort, finesse, rating: demandRating(base, 1, effort) + finesse, drawPerUnit: free ? 0 : (base * effort) / eff, sustained: false, free, label: `control tier ${tier} effort ${effort} finesse ${finesse.toFixed(0)}` };
}

/** A character's reserve while the trial runs (harness state; M6 integration replaces it with real state). */
export interface Reserve {
  pool: number;
  poolMax: number;
  comfort: number;
  usual: number;
  strain: number;
}

export const poolCeiling = (count: number): number => RESERVE.ceilingAtAverage * (Math.max(0, count) / RESERVE.averageCount) ** RESERVE.ceilingExponent;

/** Pool max, comfort line and usual rate for a count, Force Sense and fighting level (keeps the pool's share when pool max moves). */
export function reshapeReserve(r: Reserve | null, count: number, forceSense: number, fightingLevel: number): Reserve {
  const c = FORCE_XP_TRIAL;
  const poolMax = poolCeiling(count) * interp(c.poolShareByForceSense, forceSense);
  const cond = Math.max(0, Math.min(100, interp(c.conditioningByLevel, fightingLevel))) / 100;
  const share = r && r.poolMax > 0 ? r.pool / r.poolMax : 1;
  return { pool: poolMax * share, poolMax, comfort: poolMax * (0.5 - 0.3 * cond), usual: poolMax * (0.02 + 0.06 * cond), strain: r?.strain ?? 0 };
}

export function depthMult(pool: number, comfort: number): number {
  if (pool >= comfort || comfort <= 0) return RESERVE.depthAtComfort;
  const d = Math.min(1, (comfort - pool) / comfort);
  return RESERVE.depthAtComfort * RESERVE.depthBase ** d;
}

export function rateMult(drawn: number, usual: number): number {
  const ratio = usual > 0 ? drawn / usual : Infinity;
  return ratio <= 1 ? 1 : Math.min(RESERVE.rateCap, 2 ** (ratio - 1));
}

/** Hours of an exercise: each work unit draws (with tired focus) and gains strain (reserve §3-4); past empty, overdraw strain at the x8 cap (§5). */
export function drillHours(r: Reserve, ex: Exercise, hours: number): Reserve {
  let { pool, strain } = r;
  const units = Math.round(hours * FORCE_XP_TRIAL.unitsPerHour);
  for (let i = 0; i < units; i++) {
    if (ex.drawPerUnit <= 0) continue;
    const draw = ex.drawPerUnit * Math.min(RESERVE.tiredFocusCap, 1 + RESERVE.tiredFocusPerStrain * Math.max(0, strain));
    const paid = Math.min(draw, pool);
    const mult = Math.min(RESERVE.combinedCap, depthMult(pool, r.comfort) * rateMult(draw, r.usual));
    strain += (paid / r.poolMax) * mult + ((draw - paid) / r.poolMax) * RESERVE.combinedCap + (ex.sustained ? RESERVE.durationStrain : 0);
    pool -= paid;
  }
  return { ...r, pool, strain };
}

/** Recovery over hours (reserve §6): pool refill (tired refill 1 - 0.5 x strain, floor 0.35) and strain cleared. */
export function recoverHours(r: Reserve, hours: number, kind: 'meditation' | 'sleep' | 'rest' | 'normal'): Reserve {
  if (hours <= 0) return r;
  const [refill, clear] = RESERVE.recovery[kind]!;
  const tired = Math.max(RESERVE.tiredRefillFloor, 1 - 0.5 * Math.max(0, r.strain));
  return { ...r, pool: Math.min(r.poolMax, r.pool + refill * tired * r.poolMax * hours), strain: Math.max(0, r.strain - clear * hours) };
}

/** The gate-relevant tier lines (reserve §12) for reporting: 0 fresh .. 4 running on will. */
export function strainTier(strain: number): number {
  return strain > 1.0 ? 4 : strain >= 0.75 ? 3 : strain >= 0.4 ? 2 : strain >= 0.15 ? 1 : 0;
}
