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
   * Neutral start (force-xp-trial.md step 1; by level band, force-xp-trial-2.md ruling 5): the challenge factor each
   * default exercise aims at, keyed "row|effort|kind" (kind: control, output, sense), as [level, factor] anchors at the
   * midpoints of 10-level bands, interpolated between them and held flat past the ends. Each anchor is today's measured
   * hour-weighted mean for that band below level 80, where the 10-90 ladder does not bind; at 80 and above the last
   * anchor holds (the ceiling removal). Missing keys use 1.0 (standard) and 1.25 (push).
   */
  targetChallenge: Record<string, readonly (readonly [number, number])[]>;
  /**
   * Trial only (D-335): the §11 physical Force boost reads Force Control capped at this. 115 puts Luke's physical peak
   * median at 63 (force-xp-trial-3.md; 110 gave 59–60, 120 gave 65.5).
   */
  physicalBoostFcCap: number;
  /** Trial only (ruling 2): a session's exercise draw is lowered until the block ends at or under this strain. */
  poolFitStrain: number;
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
  // TARGETS-BEGIN (measured 2026-11-21: npm run mortals, FORCE_XP=collect, 4 profiles x 20 seeds, hour-weighted by 10-level
  // band, anchors at band midpoints for bands with 2,000+ hours below level 80; force-xp-trial-2.md ruling 5)
  targetChallenge: {
    'initiate|push|control': [[5, 1.0182], [15, 1.0000]],
    'initiate|push|sense': [[5, 1.0181], [15, 1.0000]],
    'initiate|standard|control': [[5, 1.0181], [15, 1.0000]],
    'initiate|standard|sense': [[5, 1.0179], [15, 1.0000]],
    'knight|push|control': [[5, 1.0237], [15, 1.0763], [25, 1.0419], [35, 1.0683], [45, 1.0318], [55, 1.0000], [65, 1.0403], [75, 1.0000]],
    'knight|push|sense': [[5, 1.0384], [15, 1.2315], [25, 1.0483], [35, 1.1508], [45, 1.0356], [55, 1.0000], [65, 1.0501], [75, 1.0000]],
    'knight|standard|control': [[35, 1.0000], [45, 1.0382], [55, 1.0000], [65, 1.0390], [75, 1.0000]],
    'knight|standard|sense': [[35, 1.0000], [45, 1.0394], [55, 1.0000], [65, 1.0401]],
    'padawan|push|control': [[5, 1.0369], [15, 1.2304], [25, 1.0471], [35, 1.2041], [45, 1.0802]],
    'padawan|push|sense': [[5, 1.0386], [15, 1.2276], [25, 1.0483], [35, 1.1923], [45, 1.1486]],
    'padawan|standard|control': [[15, 1.0000], [25, 1.0373], [35, 1.0000]],
    'padawan|standard|sense': [[15, 1.0000], [25, 1.0371], [35, 1.0000]],
  },
  // TARGETS-END
  physicalBoostFcCap: 115,
  poolFitStrain: 0.75,
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

/**
 * The neutral-start target for a session: by Order row, drill effort, exercise kind (output reads control's anchors; no
 * profile drills Force Output) and the drilled skill's level, else 1.0 standard / 1.25 push.
 */
export function targetFor(row: TrialRow, effort: 'standard' | 'push', kind: ExerciseKind, level: number): number {
  const k = kind === 'output' ? 'control' : kind;
  const anchors = FORCE_XP_TRIAL.targetChallenge[`${row}|${effort}|${k}`];
  if (!anchors || anchors.length === 0) return effort === 'push' ? 1.25 : 1.0;
  return interp(anchors, level);
}

/** The report band of a level for neutral targets: 0, 10, ... 70, and 80 for every level at or above 80. */
export const levelBand = (level: number): number => Math.min(80, Math.max(0, Math.floor(level / 10) * 10));

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
  /** Reserve §3 efficiency the draw was divided by. */
  efficiency: number;
  /** Set when fitted to the pool (ruling 2): the demand factor applied. */
  fit?: number;
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

/**
 * Effort for a control or sense exercise: normal when the target rating reaches the tier's normal demand rating, else
 * the continuous effort whose demand rating is the target, floored at light (trial 2: continuous, so the draw has no
 * jump where the target crosses the normal demand; trial 1 switched straight to light effort plus finesse there).
 */
const effortFor = (base: number, targetRating: number): number => {
  const E = RESERVE.effort;
  const normal = demandRating(base, 1, E.normal);
  if (targetRating >= normal) return E.normal;
  return Math.max(E.light, E.normal * 2 ** ((targetRating - normal) / FORCE_XP_TRIAL.slope));
};

const reliefScale =(scale: number, level: number): number => 1 + (scale - 1) * (1 - Math.min(RESERVE.masteryReliefCap, RESERVE.masteryReliefPerLevel * Math.max(0, level)));

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
    return { kind, tier, base, scale, effort, finesse: 0, rating, drawPerUnit: free ? 0 : (base * reliefScale(scale, ctx.level) * effort) / eff, sustained: false, free, efficiency: eff, label: `output tier ${tier} scale ${scale.toFixed(2)} effort ${effort}` };
  }
  if (kind === 'sense') {
    const precog = ctx.level >= 60;
    const tier = precog ? 2.5 : 1.0;
    const cost = precog ? 5 : 2;
    const effort = effortFor(RESERVE.tierBase * tier, ctx.targetRating);
    const demand = demandRating(RESERVE.tierBase * tier, 1, effort);
    const finesse = Math.max(0, ctx.targetRating - demand);
    let scale = 1;
    for (let cls = 1; finesse > 70 + 60 * (cls - 1) && cls < RESERVE.scaleFactors.length; cls++) scale = RESERVE.scaleFactors[cls]!;
    const free = !precog && ctx.level >= RESERVE.free.basic && finesse < FORCE_XP_TRIAL.freeFinesseLine;
    return { kind, tier, base: cost, scale, effort, finesse, rating: demand + finesse, drawPerUnit: free ? 0 : (cost * reliefScale(scale, ctx.level) * effort) / eff, sustained: true, free, efficiency: eff, label: `${precog ? 'precognition' : 'Force Sight'} finesse ${finesse.toFixed(0)}` };
  }
  const tier = ABILITY_TIER[skillId] ?? defaultTier(ctx.level);
  const base = RESERVE.tierBase * tier;
  const effort = effortFor(base, ctx.targetRating);
  const finesse = Math.max(0, ctx.targetRating - demandRating(base, 1, effort));
  const freeTier = tier <= 1.5 && ctx.level >= (tier <= 1 ? RESERVE.free.basic : RESERVE.free.moderate);
  const free = freeTier && finesse < FORCE_XP_TRIAL.freeFinesseLine;
  return { kind, tier, base, scale: 1, effort, finesse, rating: demandRating(base, 1, effort) + finesse, drawPerUnit: free ? 0 : (base * effort) / eff, sustained: false, free, efficiency: eff, label: `control tier ${tier} effort ${effort} finesse ${finesse.toFixed(0)}` };
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

/**
 * Ruling 2 on force-xp-trial.md: the exercise fits the pool. Its demand comes down (a lighter effort, a lower tier) by
 * a continuous factor f, and finesse makes up the rating (+30 x log2(1/f)), so the rating and the challenge factor are
 * unchanged. The floor is Basic at light effort (Force Sight at light effort for sense). Output keeps its scale gate and
 * is not scaled (its rating reads no finesse; no profile drills it). Pure.
 */
export function scaleExercise(ex: Exercise, f: number): Exercise {
  if (f >= 1 || ex.free || ex.drawPerUnit <= 0 || ex.kind === 'output') return ex;
  // Demand now and at the floor (base x scale relief x effort, before efficiency).
  const demand = ex.drawPerUnit * ex.efficiency;
  const floorDemand = ex.kind === 'sense' ? 2 * RESERVE.effort.light : RESERVE.tierBase * RESERVE.effort.light;
  const g = Math.max(f, Math.min(1, floorDemand / demand));
  if (g >= 1) return ex;
  const add = FORCE_XP_TRIAL.slope * Math.log2(1 / g);
  return { ...ex, drawPerUnit: ex.drawPerUnit * g, effort: ex.effort * g, finesse: ex.finesse + add, free: false, fit: g, label: `${ex.label}, fitted to the pool (demand x${g.toFixed(2)}, finesse +${add.toFixed(0)})` };
}

/**
 * The day's pool fit (ruling 2): the largest demand factor f in (0, 1] for which `peak(f)` (the projected strain peak
 * of the day's Force block with every exercise scaled by f) is at or under FORCE_XP_TRIAL.poolFitStrain, the standard
 * strain limit. If even the floors overrun (a day that started strained), the floor (f = 0, clamped per exercise) is
 * used and the strain trim stays the safety net. Pure.
 */
export function poolFit(peak: (f: number) => number): number {
  const limit = FORCE_XP_TRIAL.poolFitStrain;
  if (peak(1) <= limit + 1e-9) return 1;
  if (peak(0) > limit) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (peak(mid) <= limit) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Recovery over hours (reserve §6): pool refill (tired refill 1 - 0.5 x strain, floor 0.35) and strain cleared. */
export function recoverHours(r: Reserve, hours: number, kind: 'meditation' | 'sleep' | 'rest' | 'normal'): Reserve {
  if (hours <= 0) return r;
  const [refill, clear] = RESERVE.recovery[kind]!;
  const tired = Math.max(RESERVE.tiredRefillFloor, 1 - 0.5 * Math.max(0, r.strain));
  return { ...r, pool: Math.min(r.poolMax, r.pool + refill * tired * r.poolMax * hours), strain: Math.max(0, r.strain - clear * hours) };
}

