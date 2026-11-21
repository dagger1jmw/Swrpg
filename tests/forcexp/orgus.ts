// The Orgus Din check (docs-v2/spec/force-xp-rework.md §6; docs-v2/testing/force-xp-trial.md; report only): a Jedi
// Guardian on a heavy Force Control routine (Knight fill: Force Control 0.5 of the day) at two counts, 7,000 (the Orgus
// Din case; a design default, lore batch 2) and 10,000 (average Potential), on the spread's 20 seeds, under the Force XP
// trial switch FORCE_XP. Each row gives the age at Force Control 34 / 60 / 84 and the trial's report. Run with
// npx vitest run --config vitest.forcexp.config.ts.
import { AVERAGE } from '../lifetime/profiles';
import { runLifetime, type LifeProfile, type LifeResult } from '../support/lifetime';
import type { Job } from '../support/parallelRuns';
import { FORCE_XP_LABEL } from '../support/forceXpTrial';
import { SPREAD_SEEDS } from '../spread/spread';

const HEAVY_CONTROL: Omit<LifeProfile, 'seed'> = { ...AVERAGE, focusWeights: { forceControl: 0.5, soresu: 0.2, ataru: 0.1, forceSense: 0.1, willpower: 0.1 } };
export const ORGUS_PROFILES = [
  { name: 'orgus 7,000', seed: 'orgus' },
  { name: 'average 10,000', seed: 'orgusavg' },
] as const;
const YEARS = 95;
const FC = [34, 60, 70, 84];

export interface OrgusRow {
  mode: string;
  profile: string;
  seed: string;
  fcAt: Record<number, number | null>;
  fcByYear: number[];
  forceXpTrial?: LifeResult['forceXpTrial'];
}

export function orgusRow(pi: number, k: number): OrgusRow {
  const p = ORGUS_PROFILES[pi]!;
  const seed = k === 0 ? p.seed : `${p.seed}-s${k}`;
  const r = runLifetime({ ...HEAVY_CONTROL, seed }, YEARS, { crossLevels: { forceControl: FC }, track: ['forceControl'] });
  return {
    mode: FORCE_XP_LABEL,
    profile: p.name,
    seed,
    fcAt: Object.fromEntries(FC.map((t) => [t, r.cross[`forceControl>=${t}`] ?? null])),
    fcByYear: r.levelsByYear.map((o) => Math.round((o['forceControl'] ?? 0) * 10) / 10),
    ...(r.forceXpTrial ? { forceXpTrial: r.forceXpTrial } : {}),
  };
}

export const ORGUS_JOBS: Job<OrgusRow>[] = ORGUS_PROFILES.flatMap((_, pi) => Array.from({ length: SPREAD_SEEDS }, (_, k) => ({ order: pi * SPREAD_SEEDS + k, cost: YEARS, run: () => orgusRow(pi, k) })));
