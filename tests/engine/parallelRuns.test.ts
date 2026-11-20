// The long runs' shard assignment (tests/support/parallelRuns.ts): every job in exactly one shard, the same shard on
// every run, balanced by cost, and each shard's jobs in output order, so a merged run prints what the sequential loop did.
import { describe, expect, it } from 'vitest';
import { jobsOfShard, SHARDS, type Job } from '../support/parallelRuns';
import { SPREAD_JOBS } from '../spread/spread';
import { SEVER_JOBS } from '../severs/severs';

const ids = (jobs: readonly Job<unknown>[]): number[][] => Array.from({ length: SHARDS }, (_, i) => jobsOfShard(jobs, i).map((j) => j.order));

describe('shard assignment', () => {
  for (const [name, jobs] of [['spread', SPREAD_JOBS as readonly Job<unknown>[]], ['severs', SEVER_JOBS as readonly Job<unknown>[]]] as const) {
    it(`${name}: each job once, deterministic, in order within a shard, balanced`, () => {
      const a = ids(jobs);
      expect(ids(jobs)).toEqual(a);
      expect(a.flat().sort((x, y) => x - y)).toEqual(jobs.map((j) => j.order).sort((x, y) => x - y));
      for (const s of a) expect([...s].sort((x, y) => x - y)).toEqual(s);
      const cost = Array.from({ length: SHARDS }, (_, i) => jobsOfShard(jobs, i).reduce((t, j) => t + j.cost, 0));
      expect(Math.max(...cost) - Math.min(...cost)).toBeLessThanOrEqual(Math.max(...jobs.map((j) => j.cost)));
    });
  }
  it('the spread jobs are the 4 profiles x 20 seeds in profile and seed order', () => {
    expect(SPREAD_JOBS.map((j) => j.order)).toEqual(Array.from({ length: 80 }, (_, i) => i));
  });
});
