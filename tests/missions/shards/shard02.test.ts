// Missions measure shard 2 of 8 (parallel; see tests/support/parallelRuns.ts). The merged tables print at the end of the run.
import { expect, it } from 'vitest';
import { runShardAsync } from '../../support/parallelRuns';
import { MISSION_JOBS } from '../missionsYear';

it('missions shard 2', async () => {
  expect(await runShardAsync('missions', MISSION_JOBS, 2)).toBeGreaterThanOrEqual(0);
}, 0);
