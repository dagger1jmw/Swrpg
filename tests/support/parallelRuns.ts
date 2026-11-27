// Long runs in parallel (spread, severs): every (configuration, seed) is a job; jobs are spread over SHARDS test files
// that Vitest runs one per CPU core; each job writes its result to a file, and the suite's global teardown prints them
// merged in job order, so the output does not depend on which worker finished first. No game behaviour changes: each
// job runs exactly what the old sequential loop ran for that seed.
//
// Each run has its own results folder, node_modules/.cache/swrpg-runs/<suite>/<runId>, with a run.json saying what
// produced it (the environment settings). The global setup starts the run and hands the folder to the shard workers
// through an environment variable; the teardown reads only that folder. Two runs of the same suite at once therefore
// never mix their lives (they only slow each other down: the machine is saturated at 8 workers). The last KEEP_RUNS
// run folders per suite are kept; older ones are deleted when a run starts.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';

/**
 * Shard files per suite (each suite has this many shard test files). Measured on this machine (8 physical cores, 16
 * logical; 16 short lives): 1 worker 90 s, 2 47 s, 4 30 s, 8 29.5 s, 15 37 s. The harness saturates a shared resource
 * (memory bandwidth or the power budget) at about 4 lives at once, so 8 workers, not 15; more only slow each life down.
 */
export const SHARDS = 8;

/** Run folders kept per suite (the new run included). */
export const KEEP_RUNS = 5;

/** Environment settings that change what a run measures; recorded in run.json. */
export const RUN_ENV_KEYS = ['LIFETIME_MISSIONS', 'CANDIDATE', 'FORCE_XP', 'PRECOG_M6', 'D158_N', 'D158_PATTERNS', 'TRACE_YEARS', 'TRACE_SEED', 'TRACE_PLAIN'] as const;

export interface Job<R> {
  /** Stable order of the merged output (configuration, then seed). */
  order: number;
  /** Relative cost, for balancing (a 95-year life costs more than a 70-year one). */
  cost: number;
  run: () => R;
}

export interface RunInfo {
  suite: string;
  runId: string;
  startedAt: string;
  pid: number;
  env: Partial<Record<(typeof RUN_ENV_KEYS)[number], string>>;
}

export const runsRoot = (): string => join(process.cwd(), 'node_modules', '.cache', 'swrpg-runs');

/** The environment variable that carries a suite's current run folder from the global setup to the shard workers. */
export const runDirEnv = (suite: string): string => `SWRPG_RUN_DIR_${suite.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;

let lastStamp = '';
let sameStamp = 0;
/** Sorts in start order: UTC timestamp to the millisecond, a counter within the millisecond, the pid, a random tag. */
function newRunId(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').replace('.', '-').replace('Z', '');
  sameStamp = stamp === lastStamp ? sameStamp + 1 : 0;
  lastStamp = stamp;
  return `${stamp}-${String(sameStamp).padStart(2, '0')}-p${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Deletes a suite's oldest run folders so that `keep` remain. */
export function pruneRuns(suite: string, keep: number, root = runsRoot()): void {
  const dir = join(root, suite);
  let names: string[];
  try {
    names = readdirSync(dir).sort();
  } catch {
    return;
  }
  // Loose files from before per-run folders (<order>.json) go too.
  for (const n of names) if (n.endsWith('.json')) rmSync(join(dir, n), { force: true });
  const runs = names.filter((n) => !n.endsWith('.json'));
  for (const n of runs.slice(0, Math.max(0, runs.length - keep))) rmSync(join(dir, n), { recursive: true, force: true });
}

/**
 * Starts a run (global setup): prunes old run folders, creates this run's folder with its run.json, and sets the
 * environment variable the shard workers read. Returns the folder.
 */
export function startRun(suite: string, root = runsRoot()): string {
  pruneRuns(suite, KEEP_RUNS - 1, root);
  const runId = newRunId();
  const dir = join(root, suite, runId);
  mkdirSync(dir, { recursive: true });
  const env: RunInfo['env'] = {};
  for (const k of RUN_ENV_KEYS) if (process.env[k] !== undefined) env[k] = process.env[k];
  const info: RunInfo = { suite, runId, startedAt: new Date().toISOString(), pid: process.pid, env };
  writeFileSync(join(dir, 'run.json'), JSON.stringify(info, null, 2));
  process.env[runDirEnv(suite)] = dir;
  return dir;
}

/** The current run's folder (shard workers); fails rather than write where another run might read. */
export function currentRunDir(suite: string): string {
  const dir = process.env[runDirEnv(suite)];
  if (!dir) throw new Error(`no run folder for suite '${suite}': ${runDirEnv(suite)} is unset (startRun runs in the global setup)`);
  return dir;
}

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

/** Runs a shard's jobs and writes each result as `<order>.json` in the run's folder. */
export function runShard<R>(suite: string, jobs: readonly Job<R>[], shard: number, dir = currentRunDir(suite), shards = SHARDS): number {
  const mine = jobsOfShard(jobs, shard, shards);
  for (const j of mine) writeFileSync(join(dir, `${String(j.order).padStart(6, '0')}.json`), JSON.stringify(j.run()));
  return mine.length;
}

/** All results of one run in job order (global teardown). */
export function readResults<R>(dir: string): R[] {
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).sort();
  } catch {
    return [];
  }
  return files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as R);
}

/** What produced a run folder. */
export function readRunInfo(dir: string): RunInfo {
  return JSON.parse(readFileSync(join(dir, 'run.json'), 'utf8')) as RunInfo;
}

export const cores = (): number => availableParallelism();

/** runShard for jobs that return a promise (the missions measure plays its years through async campaign creation). */
export async function runShardAsync<R>(suite: string, jobs: readonly Job<Promise<R>>[], shard: number, dir = currentRunDir(suite)): Promise<number> {
  const mine = jobsOfShard(jobs, shard);
  for (const j of mine) writeFileSync(join(dir, `${String(j.order).padStart(6, '0')}.json`), JSON.stringify(await j.run()));
  return mine.length;
}
