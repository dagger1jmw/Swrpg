// npm run spread: the 20-seed spread in parallel shards (one per core), merged in seed order by the global teardown.
// Standalone (mergeConfig would concatenate the base include list and run the whole suite).
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/spread/shards/*.test.ts'], environment: 'node', maxWorkers: 8, globalSetup: ['tests/spread/globalSetup.ts'] } });