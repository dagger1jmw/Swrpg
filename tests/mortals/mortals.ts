// Mortal wounds per lifetime (Jared, D-267; report only): each profile on the spread's 20 seeds under the candidate
// set by CANDIDATE (tests/support/candidates.ts), with every lifetime gate, the lost limbs, and each mortal wound's
// context (the opponent's kind, weapon, Force use and intent; the profile's meters; age and rank). npm run mortals runs
// the jobs in parallel shards; the global teardown prints "[mortals] {json}" per seed and "[mortals-summary]" per
// profile. Not part of npm test or test:all.
import { mortalEvents, runLifetime, type LifeResult, type MortalEvent } from '../support/lifetime';
import type { Job } from '../support/parallelRuns';
import { GATES, LIFE_COST, SPREAD_PROFILES, SPREAD_SEEDS, TIERS } from '../spread/spread';

const LOST = ['lostHand', 'lostArm', 'lostLeg'];

export interface MortalRow {
  candidate: string;
  profile: string;
  seed: string;
  milestones: Record<number, number | null>;
  gates: Record<string, boolean>;
  values: Record<string, number>;
  lost: number;
  mortal: number;
  dying: number;
  withdrew: number;
  sithWithdrew: number;
  skipped: number;
  /** The M6 precognition trial (harness only; zeros when off): real fights, and those where the profile went dark. */
  precogFights: number;
  precogDark: number;
  precogOpp: number;
  precogDarkOpp: number;
  /** The Force XP trial's report (absent when FORCE_XP is off). */
  forceXpTrial?: LifeResult['forceXpTrial'];
  events: MortalEvent[];
}

export function mortalRow(candidate: string, pi: number, k: number): MortalRow {
  const p = SPREAD_PROFILES[pi]!;
  const seed = k === 0 ? p.profile.seed : `${p.profile.seed}-s${k}`;
  mortalEvents.length = 0;
  const r = runLifetime({ ...p.profile, seed }, p.years, p.opts);
  const g = GATES[p.name]!(r);
  return {
    candidate,
    profile: p.name,
    seed,
    milestones: Object.fromEntries(TIERS.map((t) => [t, r.milestones[t] ?? null])),
    gates: g.gates,
    values: g.values,
    lost: r.state.health.lasting.filter((l) => LOST.includes(l.kind)).length,
    mortal: r.fightStats?.mortal ?? 0,
    dying: r.fightStats?.dying ?? 0,
    withdrew: r.fightStats?.withdrew ?? 0,
    sithWithdrew: r.fightStats?.sithWithdrew ?? 0,
    skipped: r.fightStats?.skipped ?? 0,
    precogFights: r.fightStats?.precogFights ?? 0,
    precogDark: r.fightStats?.precogDark ?? 0,
    precogOpp: r.fightStats?.precogOpp ?? 0,
    precogDarkOpp: r.fightStats?.precogDarkOpp ?? 0,
    ...(r.forceXpTrial ? { forceXpTrial: r.forceXpTrial } : {}),
    events: [...mortalEvents],
  };
}

export const mortalJobs = (candidate: string): Job<MortalRow>[] =>
  SPREAD_PROFILES.flatMap((p, pi) => Array.from({ length: SPREAD_SEEDS }, (_, k) => ({ order: pi * SPREAD_SEEDS + k, cost: LIFE_COST[p.name] ?? p.years, run: () => mortalRow(candidate, pi, k) })));
