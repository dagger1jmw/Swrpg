// Global setup for npm run mortals (parallel shards): clears the results, then prints them merged in profile and seed
// order: one "[mortals] {json}" line per seed and one "[mortals-summary] {json}" line per profile.
import { clearResults, readResults } from '../support/parallelRuns';
import type { MortalRow } from './mortals';

const median = (xs: readonly number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};
const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

export function setup(): void {
  clearResults('mortals');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<MortalRow>('mortals');
  const byProfile = new Map<string, MortalRow[]>();
  for (const r of rows) byProfile.set(r.profile, [...(byProfile.get(r.profile) ?? []), r]);
  for (const [profile, rs] of byProfile) {
    for (const r of rs) console.info(`[mortals] ${JSON.stringify(r)}`);
    const fails: Record<string, string[]> = {};
    for (const r of rs) for (const [g, ok] of Object.entries(r.gates)) if (!ok) (fails[g] ??= []).push(r.seed.replace(/^.*-/, ''));
    const pick = (f: (r: MortalRow) => number) => ({ mean: +mean(rs.map(f)).toFixed(2), median: median(rs.map(f)) });
    console.info(`[mortals-summary] ${JSON.stringify({ candidate: rs[0]!.candidate, profile, mortal: pick((r) => r.mortal), lost: pick((r) => r.lost), withdrew: pick((r) => r.withdrew), skipped: pick((r) => r.skipped), warMean: rs[0]!.values['warMean'] !== undefined ? +median(rs.map((r) => r.values['warMean']!)).toFixed(4) : null, failing: fails })}`);
  }
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  console.info(`[mortals-runtime] ${rows.length} lifetimes in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
