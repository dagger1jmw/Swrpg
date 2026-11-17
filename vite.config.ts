import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works under the GitHub Pages project path (Phase 9 cutover).
  base: './',
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
