// The built app's install check (m9-release B5, B6): dist/ has the manifest, the icons and the service worker, and every path is
// relative, so the GitHub Pages project path (/Swrpg/) serves them. Runs after every build (package.json postbuild) with Node's type
// stripping; the tests call checkDist on a folder of their own.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const REQUIRED = ['index.html', 'manifest.webmanifest', 'sw.js', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'] as const;

const relativePath = (p: string): boolean => !p.startsWith('/') && !/^[a-z]+:\/\//i.test(p);

function filesUnder(dir: string, root = dir): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? filesUnder(p, root) : [p.slice(root.length + 1).replace(/\\/g, '/')];
  });
}

/** The problems found in a built folder (none: it installs). */
export function checkDist(dir: string): string[] {
  const out: string[] = [];
  for (const f of REQUIRED) if (!existsSync(join(dir, f))) out.push(`missing ${f}`);
  if (out.length) return out;
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  const attr = (re: RegExp): string | null => re.exec(html)?.[1] ?? null;
  const manifestHref = attr(/<link[^>]*rel="manifest"[^>]*href="([^"]+)"/);
  const touchHref = attr(/<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]+)"/);
  if (!manifestHref) out.push('index.html: no <link rel="manifest">');
  else if (!relativePath(manifestHref) || !existsSync(join(dir, manifestHref))) out.push(`index.html: the manifest link ${manifestHref} is not a relative path to a built file`);
  if (!touchHref) out.push('index.html: no apple-touch-icon');
  else if (!relativePath(touchHref) || !existsSync(join(dir, touchHref))) out.push(`index.html: the apple-touch-icon ${touchHref} is not a relative path to a built file`);
  if (!/name="apple-mobile-web-app-capable"\s+content="yes"/.test(html)) out.push('index.html: no apple-mobile-web-app-capable');
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) if (!relativePath(m[1]!)) out.push(`index.html: ${m[1]} is not relative (the project path would break it)`);
  let manifest: { start_url?: string; scope?: string; display?: string; icons?: { src: string; sizes: string }[] } = {};
  try {
    manifest = JSON.parse(readFileSync(join(dir, 'manifest.webmanifest'), 'utf8')) as typeof manifest;
  } catch {
    out.push('manifest.webmanifest is not JSON');
  }
  if (manifest.display !== 'standalone') out.push('manifest: display is not standalone');
  for (const k of ['start_url', 'scope'] as const) if (!manifest[k] || !relativePath(manifest[k]!)) out.push(`manifest: ${k} is not relative`);
  for (const i of manifest.icons ?? []) if (!relativePath(i.src) || !existsSync(join(dir, i.src))) out.push(`manifest: icon ${i.src} is missing or not relative`);
  if (!(manifest.icons ?? []).some((i) => i.sizes === '180x180')) out.push('manifest: no 180 px icon');
  const sw = readFileSync(join(dir, 'sw.js'), 'utf8');
  if (/__SWRPG_(VERSION|PRECACHE)__/.test(sw)) out.push('sw.js: the build did not fill in its markers');
  const list = /const PRECACHE = (\[[^\n]*\]);/.exec(sw)?.[1];
  let precache: string[] = [];
  try {
    precache = list ? (JSON.parse(list) as string[]) : [];
  } catch {
    out.push('sw.js: the file list is not JSON');
  }
  if (!precache.length) out.push('sw.js: no file list');
  for (const p of precache) {
    if (!relativePath(p)) out.push(`sw.js: ${p} is not relative`);
    else if (p !== './' && !existsSync(join(dir, p))) out.push(`sw.js: ${p} is not in the build`);
  }
  for (const f of [...REQUIRED.filter((x) => x !== 'sw.js'), ...filesUnder(join(dir, 'assets')).map((x) => `assets/${x}`)]) if (!precache.includes(f)) out.push(`sw.js: ${f} is not cached`);
  return out;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/check-dist.ts')) {
  const problems = checkDist('dist');
  if (problems.length) {
    console.error(`dist/ check failed:\n- ${problems.join('\n- ')}`);
    process.exitCode = 1;
  } else console.log(`dist/ check: the manifest, ${REQUIRED.length - 3} icons and the service worker are in place, every path relative.`);
}
