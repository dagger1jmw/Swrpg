// Global setup for npm run missions (m9-release A16; parallel shards): starts its own results folder, then prints the merged tables
// in cell order: one "[missions] {json}" line per cell, the runtime, and (MISSIONS_OUT) the whole table as JSON.
import { writeFileSync } from 'node:fs';
import { readResults, readRunInfo, startRun } from '../support/parallelRuns';
import { summarize, type Year } from './missionsYear';

let runDir = '';

export function setup(): void {
  runDir = startRun('missions');
  (globalThis as { __t0?: number }).__t0 = Date.now();
}

export function teardown(): void {
  const rows = readResults<Year>(runDir);
  console.info(`[missions-run] ${JSON.stringify(readRunInfo(runDir))}`);
  const byCell = new Map<string, Year[]>();
  for (const r of rows) byCell.set(r.cell, [...(byCell.get(r.cell) ?? []), r]);
  const out: Record<string, unknown> = {};
  for (const [cell, ys] of byCell) {
    out[cell] = summarize(ys);
    console.info(`[missions] ${cell} ${JSON.stringify(out[cell])}`);
  }
  const t0 = (globalThis as { __t0?: number }).__t0 ?? Date.now();
  out['runtimeSeconds'] = Math.round((Date.now() - t0) / 1000);
  console.info(`[missions-runtime] ${rows.length} years in ${out['runtimeSeconds']} s`);
  if (process.env['MISSIONS_OUT']) writeFileSync(process.env['MISSIONS_OUT'], JSON.stringify(out, null, 2));
}
