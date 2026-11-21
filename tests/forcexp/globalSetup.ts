// Global setup for the Orgus Din check (parallel shards): clears the results, then prints them merged in order, one
// "[orgus] {json}" line per seed and the runtime.
import { clearResults, readResults } from '../support/parallelRuns';

export function setup(): void {
  clearResults('forcexp');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<Record<string, unknown>>('forcexp');
  for (const r of rows) console.info(`[orgus] ${JSON.stringify(r)}`);
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  console.info(`[orgus-runtime] ${rows.length} lifetimes in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
