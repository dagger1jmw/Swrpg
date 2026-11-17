// computeXp, training branch (architecture §12, progression-numbers §3-5, §9, §13-14, D-48). One
// function for every training source: hours from the 30-minute session stepper, intensity,
// challenge, the 0.75 / 0.25 split, M per skill, a code-rolled outcome, synergy (25% cap), the
// 4.0x clamp, rust removal and fatigue Willpower under its 3.0/day cap. Pure. The combat branch
// (D-55) arrives in M5.
import type { Intensity, Load } from '../data/activities';
import { FATIGUE_WILLPOWER, INTENSITY, PRIMARY_SHARE, SECONDARY_SHARE } from '../data/progression.config';
import { challengeFactor } from './challenge';
import { stepBlock, type Capacities, type DayTraining, type Meters } from './fatigue';
import { rollOutcome, type Outcome } from './outcome';
import type { RngState } from './rng';
import { spillover } from './synergy';

export interface SessionSplit {
  /** Primary skills and their share of the 0.75 (sums to 1). */
  primaries: Readonly<Record<string, number>>;
  /** Secondary weights (normalized here to the 0.25). */
  secondaries: Readonly<Record<string, number>>;
}

/** Shares of one session per skill (sum 1; 0.75 primaries, 0.25 secondaries). Never additive. */
export function splitShares(split: SessionSplit): Record<string, number> {
  const out: Record<string, number> = {};
  const pTot = Object.values(split.primaries).reduce((a, b) => a + b, 0);
  const sTot = Object.values(split.secondaries).reduce((a, b) => a + b, 0);
  const secShare = sTot > 0 ? SECONDARY_SHARE : 0;
  const priShare = 1 - secShare;
  for (const [k, v] of Object.entries(split.primaries)) out[k] = (out[k] ?? 0) + (priShare * v) / pTot;
  if (sTot > 0) for (const [k, v] of Object.entries(split.secondaries)) out[k] = (out[k] ?? 0) + (SECONDARY_SHARE * v) / sTot;
  return out;
}

export interface TrainingInput {
  activityId: string;
  load: Load;
  physical: boolean;
  meditation: boolean;
  hours: number;
  intensity: Intensity;
  drillRating: number;
  /** Level the challenge gap is read on (the primary's exact level, rust applied). */
  challengeLevel: number;
  split: SessionSplit;
  meters: Meters;
  caps: Capacities;
  day: DayTraining;
  halveOverLimitWillpower: boolean;
  /** Fatigue Willpower already credited today (cap 3.0). */
  willpowerToday: number;
  /** Speed multiplier M per skill (already capped at 2.8). */
  m(skill: string): number;
  /** Total level of a skill before the session (natural baseline included). */
  levelOf(skill: string): number;
  /** Trained XP of a skill before the session. */
  xpOf(skill: string): number;
  naturalOf(skill: string): number;
  /**
   * The D-48 clamp: how much of `wanted` (this session's total for the skill) may be credited now.
   * `sessionHours` is the skill's share of this session's hours (D-109), for the D-104 share.
   */
  clamp(skill: string, wanted: number, sessionHours: number): { credited: number; discarded: number };
  rng: RngState;
}

export interface TrainingResult {
  hours: number;
  effectiveHours: number;
  meters: Meters;
  day: DayTraining;
  peakF: number;
  outcome: Outcome;
  challenge: number;
  /** XP before the clamp, per skill (session split only). */
  raw: Record<string, number>;
  /** XP credited per skill: split, synergy and fatigue Willpower, after the clamp. */
  credited: Record<string, number>;
  /** Spillover credited per skill (part of `credited`). */
  synergy: Record<string, number>;
  /** Fatigue Willpower credited (part of `credited.willpower`). */
  fatigueWillpower: number;
  discarded: Record<string, number>;
  /** Effective hours of practice per skill, for rust removal (primaries full, secondaries by share). */
  practiceHours: Record<string, number>;
  /** The session's hours per skill by its share of the session's XP (D-109), for the pace window. */
  windowHours: Record<string, number>;
  rng: RngState;
  notes: string[];
}

export function computeTrainingXp(input: TrainingInput): TrainingResult {
  const notes: string[] = [];
  const block = stepBlock(
    input.meters,
    input.caps,
    input.day,
    { activityId: input.activityId, load: input.load, physical: input.physical, meditation: input.meditation, hours: input.hours, intensity: input.intensity },
    input.halveOverLimitWillpower,
  );
  const [outcome, rng] = rollOutcome(input.rng);
  const challenge = challengeFactor(input.drillRating - input.challengeLevel);
  const base = block.effectiveHours * INTENSITY[input.intensity].xp * challenge * outcome.mult;
  const shares = splitShares(input.split);

  const raw: Record<string, number> = {};
  const credited: Record<string, number> = {};
  const discarded: Record<string, number> = {};
  const add = (rec: Record<string, number>, k: string, v: number): void => {
    if (v > 0) rec[k] = (rec[k] ?? 0) + v;
  };
  const windowHours: Record<string, number> = {};
  const credit = (skill: string, wanted: number, fraction: number): number => {
    add(windowHours, skill, block.hours * fraction);
    const c = input.clamp(skill, wanted + (credited[skill] ?? 0), windowHours[skill] ?? 0);
    const already = credited[skill] ?? 0;
    const got = Math.max(0, c.credited - already);
    add(credited, skill, got);
    const lost = wanted - got;
    if (lost > 1e-9) {
      add(discarded, skill, lost);
      notes.push(`4.0x pace clamp: ${lost.toFixed(2)} XP to ${skill} discarded`);
    }
    return got;
  };

  for (const [skill, share] of Object.entries(shares)) {
    const xp = base * share * input.m(skill);
    raw[skill] = xp;
    credit(skill, xp, share);
  }
  const rawTotal = Object.values(raw).reduce((a, b) => a + b, 0);
  const fractionOf = (xp: number): number => (rawTotal > 0 ? xp / rawTotal : 0);

  // Synergy from the session's credited XP (never past the ceiling; 25% cap), then clamped too.
  const spill = spillover({
    credited,
    levelOf: input.levelOf,
    xpOf: (s) => input.xpOf(s) + (credited[s] ?? 0),
    naturalOf: input.naturalOf,
  });
  const synergy: Record<string, number> = {};
  for (const [skill, xp] of Object.entries(spill)) add(synergy, skill, credit(skill, xp, fractionOf(xp)));

  // Fatigue Willpower: 3.0/day cap (direct Willpower training is outside the cap, D-51).
  const room = Math.max(0, FATIGUE_WILLPOWER.dailyCap - input.willpowerToday);
  const fatigueWanted = Math.min(room, block.fatigueWillpower);
  const fatigueWillpower = fatigueWanted > 0 ? credit('willpower', fatigueWanted, fractionOf(fatigueWanted)) : 0;

  const practiceHours: Record<string, number> = {};
  for (const [skill, share] of Object.entries(shares)) {
    const isPrimary = skill in input.split.primaries;
    practiceHours[skill] = block.effectiveHours * (isPrimary ? 1 : share / PRIMARY_SHARE);
  }
  if (outcome.name === 'breakthrough') notes.push('breakthrough (x1.75)');
  return {
    hours: block.hours,
    effectiveHours: block.effectiveHours,
    meters: block.meters,
    day: block.day,
    peakF: block.peakF,
    outcome,
    challenge,
    raw,
    credited,
    synergy,
    fatigueWillpower,
    discarded,
    practiceHours,
    windowHours,
    rng,
    notes,
  };
}
