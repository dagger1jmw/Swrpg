// Global setup for npm run lifegap (m9-release A15; parallel shards): one "[lifegap] {json}" line per archetype life and the runtime.
import { readResults, readRunInfo, startRun } from '../support/parallelRuns';
import type { GapRow } from './lifegap';

let runDir = '';

export function setup(): void {
  runDir = startRun('lifegap');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<GapRow>(runDir);
  console.info(`[lifegap-run] ${JSON.stringify(readRunInfo(runDir))}`);
  for (const r of rows) console.info(`[lifegap] ${JSON.stringify(r)}`);
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  console.info(`[lifegap-runtime] ${rows.length} lives in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
