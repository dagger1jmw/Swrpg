// Missions measure shard 0 of 8 (parallel; see tests/support/parallelRuns.ts). The merged tables print at the end of the run.
import { expect, it } from 'vitest';
import { runShardAsync } from '../../support/parallelRuns';
import { MISSION_JOBS } from '../missionsYear';

it('missions shard 0', async () => {
  expect(await runShardAsync('missions', MISSION_JOBS, 0)).toBeGreaterThanOrEqual(0);
}, 0);
