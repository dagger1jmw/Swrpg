// Mortals shard 4 of 8 (parallel; see tests/support/parallelRuns.ts), under the CANDIDATE environment variable.
import { expect, it } from 'vitest';
import { applyCandidate } from '../../support/candidates';
import { runShard } from '../../support/parallelRuns';
import { mortalJobs } from '../mortals';

const candidate = applyCandidate(process.env['CANDIDATE']);

it('mortals shard 4', () => {
  expect(runShard('mortals', mortalJobs(candidate), 4)).toBeGreaterThan(0);
}, 0);