// On-demand measurements (reports/opt-1.md): tests/measure/*.measure.ts, never part of npm test or test:all.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/measure/**/*.measure.ts'],
    environment: 'node',
    testTimeout: 600_000,
  },
});
