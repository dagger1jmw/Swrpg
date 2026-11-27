// npm run lifegap (m9-release A15, report only): the six archetype lives, missions off or (LIFETIME_MISSIONS=on) on, in parallel.
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/lifegap/shards/*.test.ts'], environment: 'node', maxWorkers: 6, testTimeout: 0, globalSetup: ['tests/lifegap/globalSetup.ts'] } });
