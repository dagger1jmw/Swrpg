// The service worker (m9-release B1): hand-written, no framework. It caches the app shell (the page, its scripts and styles, the
// manifest and the icons) so the game opens offline; Gemini calls and every other host go to the network untouched. The build
// (vite.config.ts, the swrpg-service-worker plugin) writes this file to dist/sw.js with the build's file list and version in place
// of the two markers below. A new build installs beside the old one and waits: the page shows "A new version is ready: reload",
// and only the player's reload lets it take over (no mixing of versions in one page).
const VERSION = '__SWRPG_VERSION__';
const PRECACHE = __SWRPG_PRECACHE__;
const CACHE = `swrpg-shell-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('swrpg-shell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only this site's own files: Gemini (generativelanguage.googleapis.com) and anything else go straight to the network.
  if (url.origin !== self.location.origin) return;
  // A page load (the app, or the app with ?dev=1): this version's page, so it always matches its own scripts.
  if (req.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match('index.html', { ignoreVary: true }).then((hit) => hit || fetch(req))));
    return;
  }
  // ignoreVary: the scripts and styles are fetched in cors mode (with an Origin header) and a server may answer "Vary: Origin"; the
  // cached copies were stored without one, and every file here is static and named by its content.
  event.respondWith(caches.open(CACHE).then((cache) => cache.match(req, { ignoreSearch: true, ignoreVary: true }).then((hit) => hit || fetch(req))));
});
