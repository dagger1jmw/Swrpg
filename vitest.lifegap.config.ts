// npm run lifegap (m9-release A15, report only): the six archetype lives (20 seeds each, m9-tune), missions off or (LIFETIME_MISSIONS=on) on, in parallel.
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/lifegap/shards/*.test.ts'], environment: 'node', maxWorkers: 8, testTimeout: 0, globalSetup: ['tests/lifegap/globalSetup.ts'] } });
