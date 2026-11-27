// npm run missions (m9-release A16): the simulated year of duty, every (cell, seed) in parallel shards (one per core), merged in
// order by the global teardown. On demand; not part of npm test or test:all. SEEDS (default 20) and ONLY (a cell, "peace.knight")
// narrow it for a look, never for a tuning decision (CLAUDE.md rule 6).
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/missions/shards/*.test.ts'], environment: 'node', maxWorkers: 8, testTimeout: 0, globalSetup: ['tests/missions/globalSetup.ts'] } });
