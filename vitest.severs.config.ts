// npm run severs: every (configuration, seed) in parallel shards (one per core), merged in order by the global
// teardown; the report files (duel tables, per-duel limb rates, schedules) run beside them. Standalone (see the spread
// config).
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/severs/shards/*.test.ts', 'tests/severs/reports/*.test.ts'], environment: 'node', maxWorkers: 8, globalSetup: ['tests/severs/globalSetup.ts'] } });