import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works under the GitHub Pages project path (Phase 9 cutover).
  base: './',
  // One fixed dev origin: settings, the API key and the usage meter live in localStorage, which is
  // per origin (port included), so a changed port looks like a fresh install (D-99).
  server: { port: 5173, strictPort: true },
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
