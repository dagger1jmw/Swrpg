// Global setup for npm run severs (parallel shards): clears the results, then prints them merged in configuration and
// seed order: one "[severs] {json}" line per seed and one "[severs-summary] {json}" line per configuration.
import { clearResults, readResults } from '../support/parallelRuns';
import { severSummary, type SeverRow } from './severs';

export function setup(): void {
  clearResults('severs');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<SeverRow>('severs');
  const byConfig = new Map<string, SeverRow[]>();
  for (const r of rows) byConfig.set(r.config, [...(byConfig.get(r.config) ?? []), r]);
  for (const [, rs] of byConfig) {
    for (const r of rs) console.info(`[severs] ${JSON.stringify(r)}`);
    console.info(`[severs-summary] ${JSON.stringify(severSummary(rs))}`);
  }
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  console.info(`[severs-runtime] ${rows.length} lifetimes in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}