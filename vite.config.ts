import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works under the GitHub Pages project path (Phase 9 cutover).
  base: './',
  // One fixed dev origin: settings, the API key and the usage meter live in localStorage, which is
  // per origin (port included), so a changed port looks like a fresh install (D-99).
  // host: true exposes the dev server on the local network so the iPad can test it (dev only;
  // `server` options do not affect the production build).
  server: { port: 5173, strictPort: true, host: true },
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
    // 8 workers (measured: this machine's throughput tops out near 4-8 lives at once; 15 is slower, see
    // tests/support/parallelRuns.ts). The lifetime suite runs one profile per worker.
    maxWorkers: 8,
  },
});
