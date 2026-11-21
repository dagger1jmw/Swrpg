// M6 precognition trial (m6-integration-checklist item 5; docs-v2/testing/precog-m6-trial.md). HARNESS ONLY and OFF
// by default: PRECOG_TRIAL.enabled is false in the game and is switched on only by the test harness
// (tests/support/precogTrial.ts, from the PRECOG_M6 environment variable). Nothing here is adopted; the M5 rule
// (0.4 Force load per trigger, gated at meter 1.0) stays the game's rule.
//
// With the trial on, precognitive defense follows the reserve spec (force-reserve.md §2-5) as far as precognition needs
// it: a sustained draw from the pool every exchange while it is held (one combat round = one exchange), strain from that
// draw by the depth and rate multipliers, and "senses go dark" at the running-on-will tier (pool empty or strain above
// 1.0), after which it is not held again in that fight (no lull centering is modelled). The trigger chance is unchanged
// (D-244: min(0.5, Force Sense / 200), +0.10 centered). Strain uses the step 1 report's unit conversion: the fighter's
// Force meter fraction (meters.f / caps.f) is the strain, so strain gained adds strain x caps.f to meters.f.
// Pure: every number is in PRECOG_TRIAL; no randomness.
import { interp } from './interp';

export interface PrecogTrialConfig {
  enabled: boolean;
  /** Base draw per exchange before state and efficiency (catalog: Precognition, Complex, sustained, 2 x 2.5 = 5). */
  upkeepBase: number;
  /** Comfort line as a share of pool max at Conditioning 0 and 100 (reserve §2: 50% to 20%). */
  comfortAt0: number;
  comfortAt100: number;
  /** Usual rate as a share of pool max per round at Conditioning 0 and 100 (reserve §2: 2% to 8%). */
  rateAt0: number;
  rateAt100: number;
  /** Midi-chlorian count by fighter id (the lifetime player is 'pc'); others use defaultCount (an average Jedi). */
  counts: Record<string, number>;
  defaultCount: number;
  /**
   * Harness assumption: pool max as a share of the ceiling by Force Sense, anchored on the reserve spec's worked example
   * (§3: Padawan at 20 holds 150 = 30% of an average Jedi's 500, Knight at 50 holds 350 = 70%; a Master near the top).
   */
  poolShareByForceSense: readonly (readonly [number, number])[];
  /** Harness assumption: Conditioning (0-100) by fighting level (real combat experience). */
  conditioningByLevel: readonly (readonly [number, number])[];
  /** Diagnostic scale on the reserve spec's pain focus strain (1 = the spec's +0.01 to +0.03 a round). */
  painScale: number;
}

export const PRECOG_TRIAL: PrecogTrialConfig = {
  enabled: false,
  upkeepBase: 5,
  comfortAt0: 0.5,
  comfortAt100: 0.2,
  rateAt0: 0.02,
  rateAt100: 0.08,
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
  painScale: 1,
};

/** Reserve spec numbers the trial uses unchanged (§3-4). */
const RESERVE = {
  ceilingAtAverage: 500,
  averageCount: 10_000,
  ceilingExponent: 1.5,
  calmState: 0.85,
  tiredFocusPerStrain: 0.5,
  tiredFocusCap: 1.5,
  depthAtComfort: 0.25,
  depthBase: 32,
  rateCap: 4,
  combinedCap: 8,
  durationStrain: 0.001,
  painStrain: { minor: 0, moderate: 0.01, severe: 0.02, critical: 0.03, mortal: 0.03 } as Readonly<Record<string, number>>,
  fearStrain: 0.01,
} as const;

/** One fighter's trial state, carried on the Fighter while the trial is on. */
export interface PrecogTrialState {
  pool: number;
  poolMax: number;
  comfort: number;
  usual: number;
  /** Senses dark (running on will): precognition is no longer held this fight. */
  dark: boolean;
  /** The exchange at which the senses went dark, or null. */
  darkAt: number | null;
  /** Exchanges the draw was paid. */
  held: number;
  /** Strain gained from precognition this fight (meter fraction). */
  strainGained: number;
  /** The worst tier reached (0 fresh .. 4 running on will). */
  worstTier: number;
}

export const poolCeiling = (count: number): number => RESERVE.ceilingAtAverage * (Math.max(0, count) / RESERVE.averageCount) ** RESERVE.ceilingExponent;

/** A fresh pool for a fighter (arrives rested: the pool is full; strain carries in through the Force meter). */
export function trialPool(id: string, forceSense: number, level: number): PrecogTrialState {
  const c = PRECOG_TRIAL;
  const poolMax = poolCeiling(c.counts[id] ?? c.defaultCount) * interp(c.poolShareByForceSense, forceSense);
  const cond = Math.max(0, Math.min(100, interp(c.conditioningByLevel, level))) / 100;
  return {
    pool: poolMax,
    poolMax,
    comfort: poolMax * (c.comfortAt0 + (c.comfortAt100 - c.comfortAt0) * cond),
    usual: poolMax * (c.rateAt0 + (c.rateAt100 - c.rateAt0) * cond),
    dark: false,
    darkAt: null,
    held: 0,
    strainGained: 0,
    worstTier: 0,
  };
}

/** Reserve §3 efficiency, with the ability level and Force Control both read as Force Sense (harness fighters). */
export const trialEfficiency = (forceSense: number): number => 1 + Math.max(0, forceSense) / 50 + Math.max(0, forceSense) / 100;

/** Reserve §4 depth multiplier at a pool level. */
export function depthMult(pool: number, comfort: number): number {
  if (pool >= comfort || comfort <= 0) return RESERVE.depthAtComfort;
  const d = Math.min(1, (comfort - pool) / comfort);
  return RESERVE.depthAtComfort * RESERVE.depthBase ** d;
}

/** Reserve §4 rate multiplier for a round's total draw. */
export function rateMult(drawn: number, usual: number): number {
  const ratio = usual > 0 ? drawn / usual : Infinity;
  return ratio <= 1 ? 1 : Math.min(RESERVE.rateCap, 2 ** (ratio - 1));
}

/** Reserve §12 tier (0 fresh, 1 taxed, 2 strained, 3 exhausted, 4 running on will): the worse of pool and strain. */
export function trialTier(t: Pick<PrecogTrialState, 'pool' | 'poolMax' | 'comfort'>, strain: number): number {
  const share = t.poolMax > 0 ? t.pool / t.poolMax : 0;
  const byPool = t.pool <= 0 ? 4 : share < 0.1 ? 3 : t.pool < t.comfort ? 2 : share > 0.7 ? 0 : 1;
  const byStrain = strain > 1.0 ? 4 : strain >= 0.75 ? 3 : strain >= 0.4 ? 2 : strain >= 0.15 ? 1 : 0;
  return Math.max(byPool, byStrain);
}

export interface UpkeepInput {
  strain: number;
  forceSense: number;
  centered: boolean;
  fearful: boolean;
  worstWound: string | null;
  exchange: number;
}

/** One exchange of holding precognition: the draw, the strain gained, and the senses going dark. */
export function precogUpkeep(t: PrecogTrialState, i: UpkeepInput): { t: PrecogTrialState; strainGain: number } {
  if (t.dark) return { t, strainGain: 0 };
  if (i.strain > 1.0 || t.pool <= 0) return { t: { ...t, dark: true, darkAt: i.exchange, worstTier: 4 }, strainGain: 0 };
  const state = (i.centered ? RESERVE.calmState : 1) * Math.min(RESERVE.tiredFocusCap, 1 + RESERVE.tiredFocusPerStrain * Math.max(0, i.strain));
  const draw = (PRECOG_TRIAL.upkeepBase * state) / trialEfficiency(i.forceSense);
  const paid = Math.min(draw, t.pool);
  const mult = Math.min(RESERVE.combinedCap, depthMult(t.pool, t.comfort) * rateMult(draw, t.usual));
  const focus = RESERVE.durationStrain + (i.worstWound ? (RESERVE.painStrain[i.worstWound] ?? 0) * PRECOG_TRIAL.painScale : 0) + (i.fearful ? RESERVE.fearStrain : 0);
  const strainGain = (paid / t.poolMax) * mult + focus;
  const pool = t.pool - paid;
  const strain = i.strain + strainGain;
  const dark = pool <= 0 || strain > 1.0;
  const next: PrecogTrialState = { ...t, pool, held: t.held + 1, strainGained: t.strainGained + strainGain, dark, darkAt: dark ? i.exchange : null, worstTier: 0 };
  next.worstTier = Math.max(t.worstTier, dark ? 4 : trialTier(next, strain));
  return { t: next, strainGain };
}
