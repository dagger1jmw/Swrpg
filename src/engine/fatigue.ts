// Fatigue meters (progression-numbers §3, §9, §10; health §2). A training block is stepped in 30-minute
// steps; the meters are read at the start of each step. Pure; mirrors docs-v2/calc/day.mjs.
import type { Intensity, Load } from '../data/activities';
import { FORCE_EFFORT, FORCE_METER, type ForceEffort } from '../data/health.config';
import {
  CAPACITY,
  CROSS_PENALTY,
  EFFICIENCY,
  FATIGUE_WILLPOWER,
  FORCE_CAPACITY,
  INTENSITY,
  MEDITATION_FORCE_RECOVERY,
  OVERTRAINING,
  POST_WORKOUT,
  REST_RECOVERY,
  SAME_ACTIVITY,
  SLEEP,
  STEP_HOURS,
  TIREDNESS_LABELS,
} from '../data/progression.config';

export interface Meters {
  p: number;
  m: number;
  f: number;
}
export const ZERO_METERS: Meters = { p: 0, m: 0, f: 0 };

/** Physical (Endurance) or mental (Willpower) capacity in load-hours: stat 30 -> 4.2, 90 -> 6.6, 150 -> 8.0. */
export function capacity(stat: number): number {
  const s = Math.max(0, stat);
  return CAPACITY.base + (CAPACITY.perHundred * Math.min(s, 100)) / 100 + Math.max(0, Math.min(s, CAPACITY.maxStat) - 100) / CAPACITY.over100Per;
}

/** Force capacity (health §2). */
export function forceCapacity(forceControl: number, willpower: number): number {
  const fc = Math.max(0, forceControl);
  const w = Math.max(0, willpower);
  return (
    FORCE_CAPACITY.base +
    (FORCE_CAPACITY.perHundredFc * Math.min(fc, 100)) / 100 +
    (FORCE_CAPACITY.perHundredWill * Math.min(w, 100)) / 100 +
    Math.max(0, Math.min(fc, FORCE_CAPACITY.maxStat) - 100) / FORCE_CAPACITY.over100Per
  );
}

export interface Capacities {
  p: number;
  m: number;
  f: number;
}

/** Capacities from levels, reduced by the overtraining streak (§10: -10% per day, max -50%). */
export function capacities(endurance: number, willpower: number, forceControl: number, overtrainStreak = 0): Capacities {
  const cut = 1 - Math.min(OVERTRAINING.maxCapacityCut, OVERTRAINING.capacityPerDay * Math.max(0, overtrainStreak));
  return { p: capacity(endurance) * cut, m: capacity(willpower) * cut, f: forceCapacity(forceControl, willpower) * cut };
}

/** Base efficiency e(f). */
export function efficiency(f: number): number {
  if (f <= EFFICIENCY.flatUntil) return 1.0;
  if (f <= 1.0) return 1.0 - ((1.0 - EFFICIENCY.atLimit) * (f - EFFICIENCY.flatUntil)) / (1.0 - EFFICIENCY.flatUntil);
  return EFFICIENCY.overLimit;
}

/** Willpower from fatigue g(f) (§9). */
export function fatigueWillpowerRate(f: number): number {
  const w = FATIGUE_WILLPOWER;
  if (f < w.startF) return 0;
  if (f <= 1.0) return w.g0 + ((w.g1 - w.g0) * (f - w.startF)) / (1.0 - w.startF);
  return w.gOver;
}

/** Per-day state the stepper carries between blocks (reset at midnight by progression). */
export interface DayTraining {
  /** Hours of each activity done today (same-activity x0.85 past 2 h). */
  hoursByActivity: Record<string, number>;
  /** Hours left in the post-workout window. */
  postWindow: number;
  /** The last training block was physical with load >= 0.8. */
  lastPhysicalHeavy: boolean;
}
export const EMPTY_DAY: DayTraining = { hoursByActivity: {}, postWindow: 0, lastPhysicalHeavy: false };

export interface BlockInput {
  activityId: string;
  load: Load;
  physical: boolean;
  /** Meditation-type activities restore the Force meter (health §2). */
  meditation: boolean;
  hours: number;
  intensity: Intensity;
}

export interface BlockResult {
  effectiveHours: number;
  meters: Meters;
  day: DayTraining;
  /** Fatigue Willpower XP before the daily cap (§9). */
  fatigueWillpower: number;
  /** Hours actually stepped (whole 30-minute steps). */
  hours: number;
  /** Peak f reached during the block. */
  peakF: number;
}

/** One training block in 30-minute steps. The §10 halving of fatigue Willpower is applied per day by computeXp (D-110). */
export function stepBlock(meters: Meters, caps: Capacities, dayIn: DayTraining, block: BlockInput): BlockResult {
  const inten = INTENSITY[block.intensity];
  let { p, m, f } = meters;
  const day: DayTraining = { hoursByActivity: { ...dayIn.hoursByActivity }, postWindow: dayIn.postWindow, lastPhysicalHeavy: dayIn.lastPhysicalHeavy };
  if (!block.physical && day.lastPhysicalHeavy) day.postWindow = POST_WORKOUT.hours;
  if (block.physical) day.postWindow = 0;
  const steps = Math.round(block.hours / STEP_HOURS);
  let eff = 0;
  let will = 0;
  let peak = Math.max(p / caps.p, m / caps.m);
  for (let s = 0; s < steps; s++) {
    const fp = p / caps.p;
    const fm = m / caps.m;
    let e: number;
    if (block.physical) e = efficiency(fp) * (1 - CROSS_PENALTY.physicalFromMental * Math.min(1, fm));
    else if (day.postWindow > 0) {
      e = POST_WORKOUT.factor * efficiency(fm);
      day.postWindow -= STEP_HOURS;
    } else e = efficiency(fm) * (1 - CROSS_PENALTY.mentalFromPhysical * Math.min(1, fp));
    const done = day.hoursByActivity[block.activityId] ?? 0;
    if (done >= SAME_ACTIVITY.freeHours) e *= SAME_ACTIVITY.factor;
    eff += e * STEP_HOURS;
    day.hoursByActivity[block.activityId] = done + STEP_HOURS;
    const fMax = Math.max(fp, fm);
    will += FATIGUE_WILLPOWER.perHour * fatigueWillpowerRate(fMax) * STEP_HOURS;
    p = Math.max(0, p + block.load.p * inten.load * STEP_HOURS);
    m = Math.max(0, m + block.load.m * inten.load * STEP_HOURS);
    f = block.meditation ? Math.max(0, f - MEDITATION_FORCE_RECOVERY * STEP_HOURS) : Math.max(0, f + block.load.f * inten.load * STEP_HOURS);
    peak = Math.max(peak, p / caps.p, m / caps.m);
  }
  day.lastPhysicalHeavy = block.physical && block.load.p >= POST_WORKOUT.minPhysicalLoad;
  return { effectiveHours: eff, meters: { p, m, f }, day, fatigueWillpower: will, hours: steps * STEP_HOURS, peakF: peak };
}

/** Rest (D-52): elapsed time not covered by an activity recovers the meters. Ends the post-workout window. */
export function rest(meters: Meters, hours: number): Meters {
  return {
    p: Math.max(0, meters.p - REST_RECOVERY.p * hours),
    m: Math.max(0, meters.m - REST_RECOVERY.m * hours),
    f: Math.max(0, meters.f - REST_RECOVERY.f * hours),
  };
}

/** Fraction of each meter that carries over a sleep of this many hours (7 h+ resets). */
export function sleepCarry(hours: number): number {
  if (hours >= SLEEP.fullHours) return 0;
  if (hours >= SLEEP.partialHours) return SLEEP.partialCarry;
  return SLEEP.shortCarry;
}

export function afterSleep(meters: Meters, hours: number): Meters {
  const c = sleepCarry(hours);
  return { p: meters.p * c, m: meters.m * c, f: meters.f * c };
}

export function tirednessLabel(f: number): string {
  for (const [min, label] of TIREDNESS_LABELS) if (f > min || (min === 0 && f >= 0)) return label;
  return 'fresh';
}

// ---- Force meter use (health §2; M5) ----

/** Load per use = base x effort x mastery factor max(0.4, 1 - level / 200) x combat-integration factor. */
export function forceLoadPerUse(base: number, effort: ForceEffort, abilityLevel: number, ciFactor = 1): number {
  return base * FORCE_EFFORT[effort] * Math.max(0.4, 1 - Math.max(0, abilityLevel) / 200) * ciFactor;
}

export interface ForceLoadResult {
  meters: Meters;
  /** Mental load added by backlash (+0.5 per Force load point over the limit). */
  backlashMental: number;
  /** True when the use went over the limit: the caller rolls the 5% collapse. */
  overLimit: boolean;
  /** Load points above 1.0 while channeling anger (+2 dark pressure each; alignment, M6). */
  angerPointsOver1: number;
}

/**
 * Adds a use's Force load. The limit is 1.0 of capacity, or 1.3 while channeling anger. Load above the limit
 * backlashes (+0.5 mental load per point); with anger, load between 1.0 and 1.3 is counted for dark pressure.
 */
export function applyForceLoad(meters: Meters, forceCap: number, load: number, angerChanneling = false): ForceLoadResult {
  const limit = forceCap * (angerChanneling ? FORCE_METER.angerLimit : 1);
  const before = meters.f;
  const after = before + Math.max(0, load);
  const over = Math.max(0, after - Math.max(before, limit));
  const backlashMental = over * FORCE_METER.backlashMentalPerPoint;
  const angerPointsOver1 = angerChanneling ? Math.max(0, Math.min(after, limit) - Math.max(before, forceCap)) : 0;
  return { meters: { ...meters, f: after, m: meters.m + backlashMental }, backlashMental, overLimit: after > limit, angerPointsOver1 };
}
