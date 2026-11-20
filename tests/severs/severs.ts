// Lost limbs per lifetime (Jared, D-256 / D-257 measurement; report only): each configuration (profile, morale on or
// off, a candidate severing rule) on the spread's 20 seeds, the severed limbs the profile ends its life with (every sever
// is a lasting injury at once). npm run severs runs every (configuration, seed) as a job in parallel shards
// (tests/support/parallelRuns.ts); the global teardown prints one "[severs] {json}" line per seed and one
// "[severs-summary]" line per configuration, in configuration and seed order. Not part of npm test or test:all.
import { MORALE } from '../../src/data/combat.config';
import { LOCATION_WEIGHTS, SEVERING, SEVER_AT } from '../../src/data/health.config';
import { runLifetime, type LifeProfile } from '../support/lifetime';
import type { Job } from '../support/parallelRuns';
import { LIFE_COST, SPREAD_SEEDS } from '../spread/spread';
import { ANAKIN, AVERAGE, LUKE, OBIWAN } from '../lifetime/profiles';

const LOST = ['lostHand', 'lostArm', 'lostLeg'];
const BASE_WEIGHTS = { ...LOCATION_WEIGHTS };
const LIMBS = ['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'leftHand', 'rightHand'];

export interface SeverConfig {
  label: string;
  profile: string;
  p: LifeProfile;
  years: number;
  opts: Parameters<typeof runLifetime>[2];
  morale: boolean;
  /** Candidates (measured only, never adopted here): the threshold, the limb-hit share, a sever chance. */
  severAt?: number;
  limbShare?: number;
  chance?: number;
}

const AVG_OPTS = { crossLevels: { highestForm: [24, 39, 58], forceControl: [14, 34], forceSense: [31], willpower: [53] } };
const P = { average: [AVERAGE, 95, AVG_OPTS], anakin: [ANAKIN, 70, {}], obiwan: [OBIWAN, 70, {}], luke: [LUKE, 70, {}] } as const;
const cfg = (label: string, profile: keyof typeof P, morale: boolean, extra: Partial<SeverConfig> = {}): SeverConfig => ({ label, profile, p: P[profile][0], years: P[profile][1], opts: P[profile][2], morale, ...extra });

/**
 * The configurations, in output order: the rules as they are (strike intent, D-260; morale on), and the D-257 sever
 * chance of 0.1 on top, measured only. (Morale off and the A / B candidates answered D-256 and D-257; see decisions.)
 */
export const SEVER_CONFIGS: readonly SeverConfig[] = [
  ...(['anakin', 'average', 'luke', 'obiwan'] as const).map((n) => cfg(`${n} now`, n, true)),
  ...(['anakin', 'average', 'luke', 'obiwan'] as const).map((n) => cfg(`${n} + sever chance 0.1`, n, true, { chance: 0.1 })),
];

/** Sets a configuration's switches for one job and puts every one back afterwards (one shard runs many configurations). */
function withConfig<R>(c: SeverConfig, f: () => R): R {
  (MORALE as { enabled: boolean }).enabled = c.morale;
  (SEVERING as { at: number; chance: number }).at = c.severAt ?? SEVER_AT;
  (SEVERING as { at: number; chance: number }).chance = c.chance ?? 1;
  const w = LOCATION_WEIGHTS as Record<string, number>;
  const share = c.limbShare ?? 1;
  let moved = 0;
  for (const k of LIMBS) {
    w[k] = (BASE_WEIGHTS as Record<string, number>)[k]! * share;
    moved += (BASE_WEIGHTS as Record<string, number>)[k]! * (1 - share);
  }
  w['torso'] = BASE_WEIGHTS.torso + moved;
  try {
    return f();
  } finally {
    (MORALE as { enabled: boolean }).enabled = true;
    (SEVERING as { at: number; chance: number }).at = SEVER_AT;
    (SEVERING as { at: number; chance: number }).chance = 1;
    Object.assign(w, BASE_WEIGHTS);
  }
}

export interface SeverRow {
  config: string;
  profile: string;
  morale: boolean;
  severAt: number;
  torso: number;
  chance: number;
  seed: string;
  count: number;
  lost?: { part: string; age: number }[];
  died?: string;
  /** Mortal wounds taken and Dying states entered over the life (D-260 report). */
  mortal?: number;
  dying?: number;
}

export function severRow(c: SeverConfig, k: number): SeverRow {
  return withConfig(c, () => {
    const seed = k === 0 ? c.p.seed : `${c.p.seed}-s${k}`;
    const head = { config: c.label, profile: c.profile, morale: c.morale, severAt: SEVERING.at, torso: LOCATION_WEIGHTS.torso, chance: SEVERING.chance, seed };
    try {
      const r = runLifetime({ ...c.p, seed }, c.years, c.opts);
      const born = r.state.character.birthDay;
      const lost = r.state.health.lasting.filter((l) => LOST.includes(l.kind)).map((l) => ({ part: l.part, age: Math.round(((l.day - born) / 368) * 10) / 10 }));
      return { ...head, count: lost.length, lost, mortal: r.fightStats?.mortal ?? 0, dying: r.fightStats?.dying ?? 0 };
    } catch (e) {
      // The harness stops on a death; a candidate that kills is counted, not hidden.
      return { ...head, count: -1, died: String(e instanceof Error ? e.message : e) };
    }
  });
}

export const SEVER_JOBS: readonly Job<SeverRow>[] = SEVER_CONFIGS.flatMap((c, ci) =>
  Array.from({ length: SPREAD_SEEDS }, (_, k) => ({ order: ci * SPREAD_SEEDS + k, cost: LIFE_COST[c.profile] ?? c.years, run: () => severRow(c, k) })),
);

/** One configuration's summary line (as before: mean and median over the seeds that lived). */
export function severSummary(rows: readonly SeverRow[]): Record<string, unknown> {
  const counts = rows.map((r) => r.count);
  const alive = counts.filter((n) => n >= 0);
  const sorted = [...alive].sort((a, b) => a - b);
  const mid = sorted.length % 2 ? sorted[(sorted.length - 1) / 2]! : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2;
  const r0 = rows[0]!;
  const sum = (k: 'mortal' | 'dying'): number => rows.reduce((a, r) => a + (r[k] ?? 0), 0);
  return { config: r0.config, profile: r0.profile, morale: r0.morale, severAt: r0.severAt, torso: r0.torso, chance: r0.chance, deaths: counts.length - alive.length, mean: alive.reduce((a, b) => a + b, 0) / Math.max(1, alive.length), median: mid, min: sorted[0], max: sorted[sorted.length - 1], counts, mortalMean: sum('mortal') / rows.length, dyingMean: sum('dying') / rows.length };
}
