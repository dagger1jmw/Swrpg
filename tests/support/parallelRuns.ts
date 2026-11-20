// Long runs in parallel (spread, severs): every (configuration, seed) is a job; jobs are spread over SHARDS test files
// that Vitest runs one per CPU core; each job writes its result to a file, and the suite's global teardown prints them
// merged in job order, so the output does not depend on which worker finished first. No game behaviour changes: each
// job runs exactly what the old sequential loop ran for that seed.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';

/**
 * Shard files per suite (each suite has this many shard test files). Measured on this machine (8 physical cores, 16
 * logical; 16 short lives): 1 worker 90 s, 2 47 s, 4 30 s, 8 29.5 s, 15 37 s. The harness saturates a shared resource
 * (memory bandwidth or the power budget) at about 4 lives at once, so 8 workers, not 15; more only slow each life down.
 */
export const SHARDS = 8;

export interface Job<R> {
  /** Stable order of the merged output (configuration, then seed). */
  order: number;
  /** Relative cost, for balancing (a 95-year life costs more than a 70-year one). */
  cost: number;
  run: () => R;
}

export const resultsDir = (suite: string): string => join(process.cwd(), 'node_modules', '.cache', 'swrpg-runs', suite);

/** The jobs of one shard: longest first, each to the least-loaded shard (deterministic). */
export function jobsOfShard<R>(jobs: readonly Job<R>[], shard: number, shards = SHARDS): Job<R>[] {
  const load = Array.from({ length: shards }, () => 0);
  const mine: Job<R>[] = [];
  const sorted = [...jobs].sort((a, b) => b.cost - a.cost || a.order - b.order);
  for (const j of sorted) {
    let best = 0;
    for (let i = 1; i < shards; i++) if (load[i]! < load[best]!) best = i;
    load[best]! += j.cost;
    if (best === shard) mine.push(j);
  }
  return mine.sort((a, b) => a.order - b.order);
}

/** Runs a shard's jobs and writes each result as `<order>.json` in the suite's results folder. */
export function runShard<R>(suite: string, jobs: readonly Job<R>[], shard: number): number {
  const dir = resultsDir(suite);
  mkdirSync(dir, { recursive: true });
  const mine = jobsOfShard(jobs, shard);
  for (const j of mine) writeFileSync(join(dir, `${String(j.order).padStart(6, '0')}.json`), JSON.stringify(j.run()));
  return mine.length;
}

/** Clears a suite's results (global setup). */
export function clearResults(suite: string): void {
  rmSync(resultsDir(suite), { recursive: true, force: true });
}

/** All results of a suite in job order (global teardown). */
export function readResults<R>(suite: string): R[] {
  const dir = resultsDir(suite);
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  return files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as R);
}

export const cores = (): number => availableParallelism();
