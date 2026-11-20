// Lifetime seed spread (Jared, combat pass 2 overnight job; report only, nothing tuned): each lifetime profile run on
// the fixed seed and 19 more, every gate of tests/lifetime checked per seed, each seed printed as one "[spread] {json}"
// line for docs-v2/testing/lifetime-spread.md. Not part of npm test or test:all; run with npm run spread (40+ minutes).
import { Y_AVG } from '../../src/data/progression.config';
import { runLifetime, type LifeProfile, type LifeResult } from '../support/lifetime';
import { ANAKIN, AVERAGE, LUKE, OBIWAN, TARGETS } from '../lifetime/profiles';
import type { Job } from '../support/parallelRuns';
import { within4xFloor } from '../lifetime/checks';

export const SPREAD_SEEDS = 20;
export const TIERS = [21, 41, 61, 81, 101] as const;

export interface SeedRow {
  seed: string;
  milestones: Record<number, number | null>;
  /** Combat share of the main-form XP per training year (index = years since the start). */
  shares: number[];
  gates: Record<string, boolean>;
  /** Details for gates with a value (the worst year's share, the Y_avg deviation). */
  values: Record<string, number>;
  ms: number;
}

const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
const share = (r: LifeResult, i: number): number => (r.yearMain[i]! > 0 ? r.yearCombat[i]! / r.yearMain[i]! : 0);
const within20 = (r: LifeResult, t: Record<number, number>): boolean => TIERS.every((k) => r.milestones[k] !== undefined && Math.abs(r.milestones[k]! / t[k]! - 1) <= 0.2);
const notFasterThanAnakin = (r: LifeResult): boolean => TIERS.every((k) => (r.milestones[k] ?? Infinity) >= TARGETS.anakin[k] * 1.2);
// The clamp's own reference (D-235), as tests/lifetime/checks.ts.
const within4x = (r: LifeResult): boolean => {
  const floor = within4xFloor(r);
  return TIERS.every((k) => (r.milestones[k] ?? Infinity) >= floor[k]!);
};

/** The gates of each profile's lifetime test, per seed (same bands as tests/lifetime/*.test.ts). */
export const GATES: Record<string, (r: LifeResult) => { gates: Record<string, boolean>; values: Record<string, number> }> = {
  average: (r) => {
    const yAvgDev = Math.max(...Y_AVG.map(([age, y]) => Math.abs((r.yearMain[age - 4] ?? 0) / y - 1)));
    const peace = Math.max(...r.yearMain.map((_, i) => share(r, i)));
    const at = (k: string): number => r.cross[k] ?? NaN;
    const ranks = ['highestForm>=24', 'forceControl>=14'].every((k) => Math.abs(at(k) - 10) <= 2) && ['highestForm>=39', 'forceControl>=34', 'forceSense>=31', 'willpower>=53'].every((k) => Math.abs(at(k) - 20.3) <= 2) && Math.abs(at('highestForm>=58') - 35) <= 2;
    return {
      gates: {
        'K: 41 at 16.0 +/- 0.1 y': Math.abs((r.milestones[41] ?? 0) - 16.0) <= 0.1,
        'milestones +/-20%': within20(r, TARGETS.average),
        'not faster than Anakin; within 4.0x': notFasterThanAnakin(r) && within4x(r),
        'peacetime combat < 10%': peace < 0.1,
        'Y_avg within +/-5%': yAvgDev <= 0.05,
        'rank minimums +/-2 y': ranks,
        'day-end tiredness < 1.1': r.maxDayEndF < 1.1,
      },
      values: { yAvgMaxDeviation: yAvgDev, peacetimeMaxShare: peace },
    };
  },
  anakin: (r) => {
    const war = [10, 11, 12].map((i) => share(r, i));
    return {
      gates: {
        'milestones +/-20%': within20(r, TARGETS.anakin),
        'every milestone <= 1.2 x target': TIERS.every((k) => (r.milestones[k] ?? Infinity) <= TARGETS.anakin[k] * 1.2),
        'within 4.0x': within4x(r),
        // The mean over the war years (D-159 amended); the per-year shares stay in the row as information.
        'Clone Wars share 25-35% (war-year mean)': mean(war) >= 0.25 && mean(war) <= 0.35,
      },
      values: { warMin: Math.min(...war), warMax: Math.max(...war), warMean: mean(war) },
    };
  },
  obiwan: (r) => {
    const war = [32, 33, 34].map((i) => share(r, i));
    const peace = Math.max(...r.yearMain.map((_, i) => (i < 32 || i > 34 ? share(r, i) : 0)));
    return {
      gates: {
        'milestones +/-20%': within20(r, TARGETS.obiwan),
        'not faster than Anakin; within 4.0x': notFasterThanAnakin(r) && within4x(r),
        'Clone Wars share 20-30% (war-year mean)': mean(war) >= 0.2 && mean(war) <= 0.3,
        'peacetime combat < 10%': peace < 0.1,
      },
      values: { warMin: Math.min(...war), warMax: Math.max(...war), warMean: mean(war), peacetimeMaxShare: peace },
    };
  },
  luke: (r) => {
    const PHYS = ['perf:strength', 'perf:agility', 'perf:endurance'];
    const fc = r.levelsByYear.map((o) => o['forceControl']!);
    const mean = r.levelsByYear.map((o) => PHYS.reduce((a, k) => a + (o[k] ?? 0), 0) / PHYS.length);
    const peakAge = 19 + mean.indexOf(Math.max(...mean)) + 1;
    return {
      gates: {
        'milestones +/-20%': within20(r, TARGETS.luke),
        'not faster than Anakin; within 4.0x': notFasterThanAnakin(r) && within4x(r),
        'Force still rising at 40-42 y of training; > 100 at 62': fc[40]! > fc[39]! && fc[41]! > fc[40]! && fc[42]! > 100,
        'physical peak at 58-68': peakAge >= 58 && peakAge <= 68,
      },
      values: { physicalPeakAge: peakAge },
    };
  },
};

/** One seed of one profile (k = 0 is the profile's own seed, then -s1 ... -s19): its spread row. */
export function spreadRow(name: string, profile: LifeProfile, years: number, k: number, opts: Parameters<typeof runLifetime>[2] = {}): SeedRow & { profile: string } {
  const seed = k === 0 ? profile.seed : `${profile.seed}-s${k}`;
  const t0 = Date.now();
  const r = runLifetime({ ...profile, seed }, years, opts);
  const g = GATES[name]!(r);
  return { profile: name, seed, milestones: Object.fromEntries(TIERS.map((t) => [t, r.milestones[t] ?? null])), shares: r.yearMain.map((_, i) => share(r, i)), gates: g.gates, values: g.values, ms: Date.now() - t0 };
}

/** The four profiles as the old per-profile files ran them (in their file order: anakin, average, luke, obiwan). */
export const SPREAD_PROFILES: readonly { name: string; profile: LifeProfile; years: number; opts: Parameters<typeof runLifetime>[2] }[] = [
  { name: 'anakin', profile: ANAKIN, years: 70, opts: {} },
  { name: 'average', profile: AVERAGE, years: 95, opts: { crossLevels: { highestForm: [24, 39, 58], forceControl: [14, 34], forceSense: [31], willpower: [53] } } },
  { name: 'luke', profile: LUKE, years: 70, opts: { track: ['forceControl', 'perf:strength', 'perf:agility', 'perf:endurance'] } },
  { name: 'obiwan', profile: OBIWAN, years: 70, opts: {} },
];

/** Relative cost of one life by profile, for balancing the shards (mean seconds a life, measured 2026-11-20). */
export const LIFE_COST: Readonly<Record<string, number>> = { luke: 32, anakin: 46, obiwan: 63, average: 74 };

/** Every (profile, seed) as a job, in output order (profile, then seed). */
export const SPREAD_JOBS: readonly Job<SeedRow & { profile: string }>[] = SPREAD_PROFILES.flatMap((p, pi) =>
  Array.from({ length: SPREAD_SEEDS }, (_, k) => ({ order: pi * SPREAD_SEEDS + k, cost: LIFE_COST[p.name] ?? p.years, run: () => spreadRow(p.name, p.profile, p.years, k, p.opts) })),
);

/** Sequential, as before the shards (kept for a check that the shards give the same rows). */
export function runSpread(name: string, profile: LifeProfile, years: number, opts: Parameters<typeof runLifetime>[2] = {}): SeedRow[] {
  return Array.from({ length: SPREAD_SEEDS }, (_, k) => spreadRow(name, profile, years, k, opts));
}
