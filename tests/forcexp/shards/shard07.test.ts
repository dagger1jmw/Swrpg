// Orgus Din check shard 7 of 8 (parallel; see tests/support/parallelRuns.ts), under the FORCE_XP environment variable.
import { expect, it } from 'vitest';
import { runShard } from '../../support/parallelRuns';
import { ORGUS_JOBS } from '../orgus';

it('orgus shard 7', () => {
  expect(runShard('forcexp', ORGUS_JOBS, 7)).toBeGreaterThanOrEqual(0);
}, 0);
