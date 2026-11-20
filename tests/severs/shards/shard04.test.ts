// Severs shard 4 of 8 (parallel; see tests/support/parallelRuns.ts). The merged rows print at the end of the run.
import { expect, it } from 'vitest';
import { runShard } from '../../support/parallelRuns';
import { SEVER_JOBS } from '../severs';

it('severs shard 4', () => {
  expect(runShard('severs', SEVER_JOBS, 4)).toBeGreaterThan(0);
}, 0);
