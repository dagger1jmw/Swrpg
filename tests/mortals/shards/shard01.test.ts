// Mortals shard 1 of 8 (parallel; see tests/support/parallelRuns.ts), under the CANDIDATE environment variable.
import { expect, it } from 'vitest';
import { applyCandidate } from '../../support/candidates';
import { runShard } from '../../support/parallelRuns';
import { mortalJobs } from '../mortals';

const candidate = applyCandidate(process.env['CANDIDATE']);

it('mortals shard 1', () => {
  expect(runShard('mortals', mortalJobs(candidate), 1)).toBeGreaterThan(0);
}, 0);