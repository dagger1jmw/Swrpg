// Lifegap shard 2 of 8 (parallel; m9-tune: every (life, seed) is a job). The merged rows and means print at the end of the run.
import { expect, it } from 'vitest';
import { runShard } from '../../support/parallelRuns';
import { GAP_JOBS } from '../lifegap';

it('lifegap shard 2', () => {
  expect(runShard('lifegap', GAP_JOBS, 2)).toBeGreaterThanOrEqual(0);
}, 0);
