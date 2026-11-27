// Global setup for npm run lifegap (m9-release A15; parallel shards): one "[lifegap] {json}" line per life, the means per archetype ("[lifegap-mean]") and the runtime.
import { readResults, readRunInfo, startRun } from '../support/parallelRuns';
import { summarize, type GapRow } from './lifegap';

let runDir = '';

export function setup(): void {
  runDir = startRun('lifegap');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<GapRow>(runDir);
  console.info(`[lifegap-run] ${JSON.stringify(readRunInfo(runDir))}`);
  for (const r of rows) console.info(`[lifegap] ${JSON.stringify(r)}`);
  for (const x of summarize(rows)) console.info(`[lifegap-mean] ${JSON.stringify(x)}`);
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  console.info(`[lifegap-runtime] ${rows.length} lives in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
