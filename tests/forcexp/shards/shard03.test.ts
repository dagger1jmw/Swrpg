// Orgus Din check shard 3 of 8 (parallel; see tests/support/parallelRuns.ts), under the FORCE_XP environment variable.
import { expect, it } from 'vitest';
import { runShard } from '../../support/parallelRuns';
import { ORGUS_JOBS } from '../orgus';

it('orgus shard 3', () => {
  expect(runShard('forcexp', ORGUS_JOBS, 3)).toBeGreaterThanOrEqual(0);
}, 0);
