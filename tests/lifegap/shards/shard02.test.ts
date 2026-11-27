// Lifegap shard 2 of 6 (parallel; one archetype life each). The merged rows print at the end of the run.
import { expect, it } from 'vitest';
import { runShard } from '../../support/parallelRuns';
import { GAP_JOBS } from '../lifegap';

it('lifegap shard 2', () => {
  expect(runShard('lifegap', GAP_JOBS, 2, undefined, 6)).toBeGreaterThanOrEqual(0);
}, 0);
