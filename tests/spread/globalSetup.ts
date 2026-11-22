// Global setup for npm run spread (parallel shards): starts its own results folder, then prints them merged in profile and seed
// order (anakin, average, luke, obiwan; the profile seed, then -s1 ... -s19), one "[spread] {json}" line per seed.
import { readResults, readRunInfo, startRun } from '../support/parallelRuns';

/** This run's results folder (its own; see parallelRuns.ts). */
let runDir = '';
import { Y_AVG_MEDIAN_BAND, yAvgMedianGate } from './spread';

export function setup(): void {
  runDir = startRun('spread');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<Record<string, unknown>>(runDir);
  console.info(`[spread-run] ${JSON.stringify(readRunInfo(runDir))}`);
  for (const r of rows) console.info(`[spread] ${JSON.stringify(r)}`);
  // The Y_avg calibration gate on the 20-seed median (D-159 amended): a FAIL fails the run.
  const g = yAvgMedianGate(rows as unknown as { profile: string; values: Record<string, number> }[]);
  console.info(`[spread-gate] Average Y_avg on the ${g.seeds}-seed median: worst ${((g.worst.ratio - 1) * 100).toFixed(1)}% at age ${g.worst.age} (band +/-${Y_AVG_MEDIAN_BAND * 100}%): ${g.pass ? 'PASS' : 'FAIL'}`);
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  console.info(`[spread-runtime] ${rows.length} lifetimes in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (!g.pass) throw new Error("the Average's Y_avg calibration gate (20-seed median) fails");
}