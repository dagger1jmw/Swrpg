// Global setup for the Orgus Din check (parallel shards): starts its own results folder, then prints them merged in order, one
// "[orgus] {json}" line per seed and the runtime.
import { readResults, readRunInfo, startRun } from '../support/parallelRuns';

/** This run's results folder (its own; see parallelRuns.ts). */
let runDir = '';

export function setup(): void {
  runDir = startRun('forcexp');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<Record<string, unknown>>(runDir);
  console.info(`[orgus-run] ${JSON.stringify(readRunInfo(runDir))}`);
  for (const r of rows) console.info(`[orgus] ${JSON.stringify(r)}`);
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  console.info(`[orgus-runtime] ${rows.length} lifetimes in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
