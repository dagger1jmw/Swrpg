// Global setup for npm run spread (parallel shards): clears the results, then prints them merged in profile and seed
// order (anakin, average, luke, obiwan; the profile seed, then -s1 ... -s19), one "[spread] {json}" line per seed.
import { clearResults, readResults } from '../support/parallelRuns';

export function setup(): void {
  clearResults('spread');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<Record<string, unknown>>('spread');
  for (const r of rows) console.info(`[spread] ${JSON.stringify(r)}`);
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  console.info(`[spread-runtime] ${rows.length} lifetimes in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}