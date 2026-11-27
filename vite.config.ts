import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Every file under public/ (copied as is to dist/), as dist-relative paths. */
function publicFiles(dir = 'public', root = dir): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? publicFiles(p, root) : [relative(root, p).replace(/\\/g, '/')];
  });
}

/**
 * The service worker (m9-release B1; hand-written, no plugin dependency): sw/service-worker.js with this build's file list (the
 * page, every bundled asset, the manifest and the icons) and a version from their content, written to dist/sw.js. Relative paths
 * throughout, so it works under the GitHub Pages project path.
 */
function serviceWorker(): Plugin {
  return {
    name: 'swrpg-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_opts, bundle) {
      const files = [...Object.keys(bundle), ...publicFiles()].filter((f) => f !== 'sw.js' && !f.endsWith('.map')).sort();
      const hash = createHash('sha256');
      for (const f of Object.keys(bundle).sort()) {
        const out = bundle[f]!;
        hash.update(f).update(out.type === 'chunk' ? out.code : out.source);
      }
      for (const f of publicFiles()) hash.update(f).update(readFileSync(join('public', f)));
      const version = hash.digest('hex').slice(0, 12);
      const source = readFileSync('sw/service-worker.js', 'utf8').replace('__SWRPG_VERSION__', version).replace('__SWRPG_PRECACHE__', JSON.stringify(['./', ...files]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  // Relative base so the build works under the GitHub Pages project path (/Swrpg/; m9-release B5).
  base: './',
  plugins: [serviceWorker()],
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
