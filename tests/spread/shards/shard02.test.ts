// Spread shard 2 of 8 (parallel; see tests/support/parallelRuns.ts). The merged rows print at the end of the run.
import { expect, it } from 'vitest';
import { runShard } from '../../support/parallelRuns';
import { SPREAD_JOBS } from '../spread';

it('spread shard 2', () => {
  expect(runShard('spread', SPREAD_JOBS, 2)).toBeGreaterThan(0);
}, 0);
