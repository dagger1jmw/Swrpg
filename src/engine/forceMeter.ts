// The Force meter (health §2; D-167). The one module for every Force-load rule in M5: the Force reserve is redesigned
// in M6, so combat (Force actions, shatterpoint), precognitive defense, sequences (through Force actions) and the
// fatigue stepper (training load, meditation, rest, sleep) call this interface and never compute Force load
// themselves. Every number lives in config: health.config FORCE_METER and FORCE_EFFORT, progression.config
// FORCE_CAPACITY, REST_RECOVERY.f and MEDITATION_FORCE_RECOVERY, combat.config PRECOG and SHATTERPOINT_COMBAT. Pure.
import { FORCE_EFFORT, FORCE_METER, type ForceEffort } from '../data/health.config';
import { FORCE_CAPACITY, MEDITATION_FORCE_RECOVERY, REST_RECOVERY } from '../data/progression.config';
import { nextFloat, type RngState } from './rng';

/** The meters a Force use touches: f, and m for backlash. */
export interface ForceMeters {
  p: number;
  m: number;
  f: number;
}

// ---- The current limit ----

/** Force capacity (health §2): the meter's 1.0 point. */
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

/** The limit in load points: 1.0 of capacity, or 1.3 while channeling anger. */
export const forceLimit = (cap: number, angerChanneling = false): number => cap * (angerChanneling ? FORCE_METER.angerLimit : 1);

/** The meter as a fraction of capacity (0 when there is no capacity). */
export const forceFraction = (f: number, cap: number): number => (cap > 0 ? f / cap : 0);

/** True while the meter is at or below `maxFraction` of capacity (precognitive defense needs 1.0 or less). */
export const forceWithin = (f: number, cap: number, maxFraction: number): boolean => cap > 0 && f / cap <= maxFraction;

// ---- The load for an ability use ----

/** Load per use = base x effort x mastery factor max(0.4, 1 - level / 200) x combat-integration factor. */
export function forceLoadPerUse(base: number, effort: ForceEffort, abilityLevel: number, ciFactor = 1): number {
  return base * FORCE_EFFORT[effort] * Math.max(0.4, 1 - Math.max(0, abilityLevel) / 200) * ciFactor;
}

// ---- Backlash and collapse ----

export interface ForceLoadResult {
  meters: ForceMeters;
  /** Mental load added by backlash (+0.5 per Force load point over the limit). */
  backlashMental: number;
  /** True when the use went over the limit: roll the collapse (rollCollapse). */
  overLimit: boolean;
  /** Load points above 1.0 while channeling anger (+2 dark pressure each; alignment, M6). */
  angerPointsOver1: number;
}

/**
 * Adds a use's Force load. Load above the limit backlashes (+0.5 mental load per point); with anger, load between 1.0
 * and 1.3 is counted for dark pressure.
 */
export function applyForceLoad(meters: ForceMeters, forceCap: number, load: number, angerChanneling = false): ForceLoadResult {
  const limit = forceLimit(forceCap, angerChanneling);
  const before = meters.f;
  const after = before + Math.max(0, load);
  const over = Math.max(0, after - Math.max(before, limit));
  const backlashMental = over * FORCE_METER.backlashMentalPerPoint;
  const angerPointsOver1 = angerChanneling ? Math.max(0, Math.min(after, limit) - Math.max(before, forceCap)) : 0;
  return { meters: { ...meters, f: after, m: meters.m + backlashMental }, backlashMental, overLimit: after > limit, angerPointsOver1 };
}

/** A fixed load with no backlash check (precognitive defense, a shatterpoint strike; as built in M5). */
export const addFixedLoad = (f: number, load: number): number => f + Math.max(0, load);

/** The collapse roll after a use over the limit (5%; the caller records 1-3 hours of incapacitation). */
export function rollCollapse(rng: RngState, overLimit: boolean): [boolean, RngState] {
  if (!overLimit) return [false, rng];
  const [u, r] = nextFloat(rng);
  return [u < FORCE_METER.collapseChance, r];
}

// ---- Recovery ----

/** One training step's Force meter: meditation recovers it, any other activity adds its Force load. */
export function trainingForceStep(f: number, i: { meditation: boolean; loadF: number; intensityLoad: number; hours: number }): number {
  return i.meditation ? Math.max(0, f - MEDITATION_FORCE_RECOVERY * i.hours) : Math.max(0, f + i.loadF * i.intensityLoad * i.hours);
}

/** Rest recovers the Force meter at its rest rate (D-52). */
export const restForce = (f: number, hours: number): number => Math.max(0, f - REST_RECOVERY.f * hours);

/** Sleep carries this fraction of the meter over (7 h+ resets; the fraction is the fatigue model's sleep carry). */
export const sleepForce = (f: number, carry: number): number => f * carry;
