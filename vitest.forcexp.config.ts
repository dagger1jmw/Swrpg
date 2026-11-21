// The Orgus Din check for the Force XP trial (tests/forcexp/orgus.ts): parallel shards under FORCE_XP. Standalone.
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/forcexp/shards/*.test.ts'], environment: 'node', maxWorkers: 8, globalSetup: ['tests/forcexp/globalSetup.ts'] } });
