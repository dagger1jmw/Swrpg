// Force XP rework prototype: the glue between the pure model (engine/forceXpTrial.ts) and the training session and day
// planner. HARNESS ONLY: every function here is called only while FORCE_XP_TRIAL.enabled or .collect is set (both false
// in the game). The reserve (pool and strain) lives in TRIAL_STORE, a module-level record the harness resets at the
// start of each lifetime; the game has no pool or strain state until the M6 integration (reserve build steps 2-4), which
// replaces this store with real state. Report statistics are collected here for docs-v2/testing/force-xp-trial.md.
import { ACTIVITY_BY_ID } from '../../data/activities';
import { REQUIREMENT_ROW } from '../../data/orderRequirements';
import { FORM_IDS } from '../../data/skills';
import { FORCE_XP_TRIAL, buildExercise, drillHours, exerciseKind, gapForChallenge, levelBand, poolFit, recoverHours, reshapeReserve, scaleExercise, targetFor, type Exercise, type Reserve, type TrialEffort, type TrialRow } from '../../engine/forceXpTrial';
import type { GameState } from '../../state/gameState';
import { selectPath } from '../character/selectors';
import { selectRank } from '../ranks/selectors';
import { selectLevelExact, selectPerformance } from './selectors';

const DAY = 86_400;
const WAKE = 6 * 3600;
const SLEEP_HOURS = 8;

export interface SessionStat {
  hours: number;
  challengeHours: number;
  sessions: number;
}

export interface BucketStat {
  days: number;
  /** Days with a Force block planned. */
  forceDays: number;
  endF: number;
  endFMax: number;
  strainEnd: number;
  strainEndMax: number;
  strainPeak: number;
  meterTrimDays: number;
  meterTrimHours: number;
  strainTrimDays: number;
  strainTrimHours: number;
  forcePlanned: number;
  forceKept: number;
  /** Actual strain at bedtime (from the reserve, after the day's sessions and evening). */
  bedStrain: number;
  bedStrainDays: number;
}

/** Force drill hours by day bucket, and those fitted to the pool (ruling 2) with their hour-weighted demand factor. */
export interface FitStat {
  hours: number;
  fittedHours: number;
  fitHours: number;
}

export interface ForceXpTrialSummary {
  sessions: Record<string, SessionStat>;
  buckets: Record<string, BucketStat>;
  fits: Record<string, FitStat>;
}

interface Store {
  reserve: Reserve | null;
  at: number | null;
  summary: ForceXpTrialSummary;
  /** The bucket of the day last planned (for the bedtime strain). */
  dayBucket: string | null;
  /** The day plan's pool fit (ruling 2): the demand factor for that day's Force sessions. */
  dayFit: { day: number; f: number } | null;
  /** Harness diagnosis only: called with each reserve event when set. */
  trace?: ((e: Record<string, unknown>) => void) | undefined;
}

export const TRIAL_STORE: Store = { reserve: null, at: null, summary: { sessions: {}, buckets: {}, fits: {} }, dayBucket: null, dayFit: null };

export function resetForceXpTrial(): void {
  TRIAL_STORE.reserve = null;
  TRIAL_STORE.at = null;
  TRIAL_STORE.summary = { sessions: {}, buckets: {}, fits: {} };
  TRIAL_STORE.dayBucket = null;
  TRIAL_STORE.dayFit = null;
}

export const summarizeForceXpTrial = (): ForceXpTrialSummary => JSON.parse(JSON.stringify(TRIAL_STORE.summary)) as ForceXpTrialSummary;

/** The Order row (as the scheduler's requirementRow). */
export function trialRow(s: GameState): TrialRow {
  const path = selectPath(s);
  if (path !== 'jedi' && path !== 'sith') return 'knight';
  const row = REQUIREMENT_ROW[selectRank(s)] ?? 'knight';
  return row === 'initiate' || row === 'acolyte' ? 'initiate' : row === 'padawan' || row === 'apprentice' ? 'padawan' : 'knight';
}

const fightingLevel = (s: GameState): number => Math.max(0, ...FORM_IDS.map((f) => selectLevelExact(s, f)));

/** The report bucket for a day: the Order row, and for Padawans and Knights the Force Control band of the proposal's table. */
function bucketOf(s: GameState): string {
  const row = trialRow(s);
  if (row === 'initiate') return 'initiate';
  const fc = selectLevelExact(s, 'forceControl');
  if (row === 'padawan') return fc >= 15 && fc < 25 ? 'padawan FC 15-25' : 'padawan other';
  if (fc >= 45 && fc < 55) return 'knight FC 45-55';
  if (fc >= 80 && fc < 90) return 'knight FC 80-90';
  return 'knight other';
}

const absOf = (s: GameState): number => s.clock.now.day * DAY + s.clock.now.second;

/** The reserve brought up to now: pool max follows Force Sense, then the time since the last update recovers (normal activity by day, sleep by night). */
function caughtUp(s: GameState, stored: Reserve | null, at: number | null, onBed?: (strain: number) => void): Reserve {
  let r = reshapeReserve(stored, FORCE_XP_TRIAL.counts['pc'] ?? FORCE_XP_TRIAL.defaultCount, selectLevelExact(s, 'forceSense'), fightingLevel(s));
  const now = absOf(s);
  if (at === null || now <= at) return r;
  let t = at;
  // Days run wake to wake: normal activity until bedtime, then sleep (the routine's 8 h). Long gaps saturate, so at
  // most a few days are stepped.
  for (let guard = 0; t < now && guard < 12; guard++) {
    const wakeT = Math.floor((t - WAKE) / DAY) * DAY + WAKE;
    const bed = wakeT + (24 - SLEEP_HOURS) * 3600;
    if (t < bed) {
      const until = Math.min(now, bed);
      r = recoverHours(r, (until - t) / 3600, 'normal');
      t = until;
    } else {
      onBed?.(r.strain);
      TRIAL_STORE.trace?.({ ev: 'sleep', t, strain: r.strain, pool: r.pool / r.poolMax });
      const until = Math.min(now, wakeT + DAY);
      r = recoverHours(r, (until - t) / 3600, 'sleep');
      t = until;
    }
  }
  return r;
}

const gapCache = new Map<string, number>();
const targetGap = (row: TrialRow, effort: 'standard' | 'push', skillId: string, level: number): number => {
  const target = targetFor(row, effort, exerciseKind(skillId), level);
  const key = `${target.toFixed(4)}|${effort}`;
  let g = gapCache.get(key);
  if (g === undefined) {
    g = gapForChallenge(target, effort);
    gapCache.set(key, g);
  }
  return g;
};

/** The session's default exercise (proposal §1-3; neutral start: rating = level + the gap whose challenge is the row's target). */
export function exerciseFor(s: GameState, skillId: string, effort: 'standard' | 'push', poolMax: number, challengeLevel?: number): Exercise {
  const level = challengeLevel ?? selectPerformance(s, skillId);
  return buildExercise(skillId, { level, forceControl: selectLevelExact(s, 'forceControl'), poolMax, targetRating: level + targetGap(trialRow(s), effort, skillId, level) });
}

/** A Force-discipline session: the exercise's rating and trickle multiplier, and its draw on the reserve. */
export function forceSessionRating(s: GameState, skillId: string, hours: number, effort: 'standard' | 'push', challengeLevel: number): { rating: number; mult: number; note: string } {
  const r = caughtUp(s, TRIAL_STORE.reserve, TRIAL_STORE.at, bedStrain);
  // The day plan's fit (ruling 2), and no more than this block alone allows from the reserve now (a guard for where the
  // session differs from the plan's projection: a level crossed during the day, a fight before it).
  const dayFit = TRIAL_STORE.dayFit && TRIAL_STORE.dayFit.day === s.clock.now.day ? TRIAL_STORE.dayFit.f : 1;
  const base = exerciseFor(s, skillId, effort, r.poolMax, challengeLevel);
  const blockFit = poolFit((g) => drillHours(r, scaleExercise(base, g), hours).strain);
  const ex = scaleExercise(base, Math.min(dayFit, blockFit));
  TRIAL_STORE.reserve = drillHours(r, ex, hours);
  const fs = (TRIAL_STORE.summary.fits[bucketOf(s)] ??= { hours: 0, fittedHours: 0, fitHours: 0 });
  fs.hours += hours;
  if (ex.fit !== undefined) {
    fs.fittedHours += hours;
    fs.fitHours += hours * ex.fit;
  }
  TRIAL_STORE.trace?.({ ev: 'drill', t: absOf(s), skillId, hours, before: r.strain, poolBefore: r.pool / r.poolMax, after: TRIAL_STORE.reserve.strain, poolAfter: TRIAL_STORE.reserve.pool / r.poolMax, poolMax: r.poolMax, comfort: r.comfort / r.poolMax, draw: ex.drawPerUnit, usual: r.usual, label: ex.label });
  TRIAL_STORE.at = absOf(s) + Math.round(hours * 3600);
  return { rating: ex.rating, mult: ex.free ? FORCE_XP_TRIAL.trickle : 1, note: `Force XP trial: ${ex.label}, rating ${ex.rating.toFixed(1)}${ex.free ? ' (free: trickle)' : ''}, strain ${TRIAL_STORE.reserve.strain.toFixed(2)}, pool ${Math.round((100 * TRIAL_STORE.reserve.pool) / TRIAL_STORE.reserve.poolMax)}%` };
}

/** A meditation session refills the pool and clears a little strain (reserve §6). */
export function trialMeditation(s: GameState, hours: number): void {
  const r = caughtUp(s, TRIAL_STORE.reserve, TRIAL_STORE.at, bedStrain);
  TRIAL_STORE.reserve = recoverHours(r, hours, 'meditation');
  TRIAL_STORE.at = absOf(s) + Math.round(hours * 3600);
}

function bedStrain(strain: number): void {
  const k = TRIAL_STORE.dayBucket;
  if (!k) return;
  const b = TRIAL_STORE.summary.buckets[k];
  if (!b) return;
  b.bedStrain += strain;
  b.bedStrainDays += 1;
  TRIAL_STORE.dayBucket = null;
}

/** Collects a Force session's challenge factor (hour-weighted), by Order row, drill effort and 10-level band (80 = 80 and above). */
export function recordChallenge(s: GameState, skillId: string, effort: TrialEffort, level: number, hours: number, challenge: number): void {
  const key = `${trialRow(s)}|${effort}|b${levelBand(level)}|${skillId}`;
  const st = (TRIAL_STORE.summary.sessions[key] ??= { hours: 0, challengeHours: 0, sessions: 0 });
  st.hours += hours;
  st.challengeHours += hours * challenge;
  st.sessions += 1;
}

export interface TrialBlock {
  activityId: string;
  skillId: string;
  hours: number;
  planned: number;
  fill: boolean;
}

const isForce = (b: { activityId: string }): boolean => ACTIVITY_BY_ID.get(b.activityId)?.group === 'force';

/** Projected strain over the day's ordered blocks from a reserve (peak and end). */
export function projectStrain(s: GameState, ordered: readonly (TrialBlock | { rest: number })[], start: Reserve, effort: 'standard' | 'push', fit = 1): { peak: number; end: number } {
  let r = start;
  let peak = r.strain;
  for (const o of ordered) {
    if ('rest' in o) {
      r = recoverHours(r, o.rest, 'rest');
      continue;
    }
    if (o.hours <= 0) continue;
    const g = ACTIVITY_BY_ID.get(o.activityId)?.group;
    if (g === 'force') r = drillHours(r, scaleExercise(exerciseFor(s, o.skillId, effort, r.poolMax), fit), o.hours);
    else r = recoverHours(r, o.hours, g === 'meditation' ? 'meditation' : 'normal');
    peak = Math.max(peak, r.strain);
  }
  return { peak, end: r.strain };
}

/**
 * The strain trim (proposal §4): with the meters trim done, Force hours come off (0.5 h steps; the largest fill block
 * first, then the fixed Order blocks down to what they reach on a fresh day, as D-165) until the projected peak strain
 * is within the effort's limit. Mutates `blocks`; returns the hours taken and the projection.
 */
export function strainTrim<B extends TrialBlock>(
  s: GameState,
  blocks: B[],
  order: (bs: readonly B[]) => (B | { rest: number })[],
  routineEffort: TrialEffort,
  step: number,
): { trimmed: number; peak: number; end: number } {
  const effort = routineEffort === 'push' ? 'push' : 'standard';
  const limit = FORCE_XP_TRIAL.strainLimit[routineEffort];
  const start = caughtUp(s, TRIAL_STORE.reserve, TRIAL_STORE.at);
  const fresh: Reserve = { ...start, pool: start.poolMax, strain: 0 };
  const project = (from: Reserve, bs: readonly B[], f: number): { peak: number; end: number } => projectStrain(s, order(bs.filter((b) => b.hours > 0)), from, effort, f);
  // Ruling 2: the day's Force block is fitted to the pool first (one demand factor for every Force exercise of the day,
  // finesse making up the rating), and refitted after every trim step; hours come off only while even the floors
  // overrun (a day that started strained). The fresh-day level of the fixed blocks is fitted the same way.
  const fitted = (from: Reserve, bs: readonly B[]): { fit: number; peak: number; end: number } => {
    const f = poolFit((g) => project(from, bs, g).peak);
    return { fit: f, ...project(from, bs, f) };
  };
  let p = fitted(start, blocks);
  const freshFixed = fitted(fresh, blocks.filter((b) => !b.fill && isForce(b))).peak;
  let trimmed = 0;
  for (const pass of ['fill', 'fixed'] as const) {
    const target = pass === 'fill' ? limit : Math.max(limit, freshFixed);
    while (p.peak > target + 1e-9) {
      let i = -1;
      blocks.forEach((b, j) => {
        if (isForce(b) && (pass === 'fill' ? b.fill : !b.fill) && b.hours > 0 && (i < 0 || b.hours > blocks[i]!.hours)) i = j;
      });
      if (i < 0) break;
      blocks[i] = { ...blocks[i]!, hours: blocks[i]!.hours - step };
      trimmed += step;
      p = fitted(start, blocks);
    }
  }
  const fit = p.fit;
  TRIAL_STORE.dayFit = { day: s.clock.now.day, f: fit };
  TRIAL_STORE.trace?.({ ev: 'plan', t: absOf(s), startStrain: start.strain, startPool: start.pool / start.poolMax, trimmed, peak: p.peak, end: p.end, freshFixed, fit });
  return { trimmed, peak: p.peak, end: p.end };
}

/** Records the planned day for the report (both modes; strain fields stay 0 when the trial is off). */
export function recordPlan(s: GameState, d: { endF: number; meterTrim: number; strainTrim: number; strainPeak: number; strainEnd: number; forcePlanned: number; forceKept: number }): void {
  const k = bucketOf(s);
  const b = (TRIAL_STORE.summary.buckets[k] ??= { days: 0, forceDays: 0, endF: 0, endFMax: 0, strainEnd: 0, strainEndMax: 0, strainPeak: 0, meterTrimDays: 0, meterTrimHours: 0, strainTrimDays: 0, strainTrimHours: 0, forcePlanned: 0, forceKept: 0, bedStrain: 0, bedStrainDays: 0 });
  b.days += 1;
  if (d.forcePlanned > 0) b.forceDays += 1;
  b.endF += d.endF;
  b.endFMax = Math.max(b.endFMax, d.endF);
  b.strainEnd += d.strainEnd;
  b.strainEndMax = Math.max(b.strainEndMax, d.strainEnd);
  b.strainPeak += d.strainPeak;
  if (d.meterTrim > 0) b.meterTrimDays += 1;
  b.meterTrimHours += d.meterTrim;
  if (d.strainTrim > 0) b.strainTrimDays += 1;
  b.strainTrimHours += d.strainTrim;
  b.forcePlanned += d.forcePlanned;
  b.forceKept += d.forceKept;
  TRIAL_STORE.dayBucket = FORCE_XP_TRIAL.enabled ? k : null;
}

export const forceHours = (bs: readonly { activityId: string; hours: number }[], key: 'hours' | 'planned' = 'hours'): number =>
  bs.filter(isForce).reduce((a, b) => a + (key === 'planned' ? ((b as unknown as { planned: number }).planned ?? b.hours) : b.hours), 0);
