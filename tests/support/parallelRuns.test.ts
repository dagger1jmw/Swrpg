// Per-run results folders (tests/support/parallelRuns.ts): two runs of the same suite at once never mix their lives.
import { afterEach, describe, expect, it } from 'vitest';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { KEEP_RUNS, readResults, readRunInfo, runDirEnv, runShard, SHARDS, startRun, type Job } from './parallelRuns';

const root = join(process.cwd(), 'node_modules', '.cache', 'swrpg-runs-unit');
const suite = 'unit';
const saved = { dir: process.env[runDirEnv(suite)], fx: process.env['FORCE_XP'] };

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  if (saved.dir === undefined) delete process.env[runDirEnv(suite)];
  else process.env[runDirEnv(suite)] = saved.dir;
  if (saved.fx === undefined) delete process.env['FORCE_XP'];
  else process.env['FORCE_XP'] = saved.fx;
});

const lives = (tag: string): Job<{ run: string; seed: number }>[] =>
  Array.from({ length: 20 }, (_, seed) => ({ order: seed, cost: 1 + (seed % 3), run: () => ({ run: tag, seed }) }));

describe('parallel runs', () => {
  it('two runs of the same suite started at once write to different folders, and neither report has the other\'s lives', () => {
    process.env['FORCE_XP'] = 'on,cap=115';
    const a = startRun(suite, root);
    process.env['FORCE_XP'] = 'on,cap=120';
    const b = startRun(suite, root);
    expect(a).not.toBe(b);
    // The shards of both runs interleave, as they do when two runs share the machine.
    for (let s = 0; s < SHARDS; s++) {
      runShard(suite, lives('A'), s, a);
      runShard(suite, lives('B'), s, b);
    }
    const ra = readResults<{ run: string; seed: number }>(a);
    const rb = readResults<{ run: string; seed: number }>(b);
    expect(ra.map((r) => r.seed)).toEqual(Array.from({ length: 20 }, (_, i) => i));
    expect(rb.map((r) => r.seed)).toEqual(Array.from({ length: 20 }, (_, i) => i));
    expect(ra.every((r) => r.run === 'A')).toBe(true);
    expect(rb.every((r) => r.run === 'B')).toBe(true);
    // Each folder says what produced it.
    expect(readRunInfo(a).env.FORCE_XP).toBe('on,cap=115');
    expect(readRunInfo(b).env.FORCE_XP).toBe('on,cap=120');
  });

  it('the shard workers find the run folder through the environment the global setup sets', () => {
    const dir = startRun(suite, root);
    expect(process.env[runDirEnv(suite)]).toBe(dir);
    runShard(suite, lives('A'), 0);
    expect(readResults(dir).length).toBeGreaterThan(0);
  });

  it(`keeps the last ${KEEP_RUNS} run folders per suite and deletes older ones when a run starts`, () => {
    const dirs = Array.from({ length: KEEP_RUNS + 3 }, () => startRun(suite, root));
    const left = readdirSync(join(root, suite)).sort();
    expect(left).toHaveLength(KEEP_RUNS);
    expect(left).toEqual(dirs.slice(-KEEP_RUNS).map((d) => d.split(/[\\/]/).pop()));
  });
});
