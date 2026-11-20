// npm run mortals: the D-267 mortal-wound measurement in parallel shards (one per core) and its reports (the rolls §8
// tables, the D-158 rows), merged in order by the global teardown, under the CANDIDATE environment variable.
// Standalone (see the spread config).
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/mortals/shards/*.test.ts', 'tests/mortals/reports/*.test.ts'], environment: 'node', maxWorkers: 8, globalSetup: ['tests/mortals/globalSetup.ts'] } });