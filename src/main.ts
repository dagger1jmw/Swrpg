// Browser entry: wires the real adapters (IndexedDB, localStorage, Gemini via fetch) into the app, and the installed app's parts
// (m9-release B): the service worker and its update banner, persistent storage, the share sheet.
import { createGeminiProvider } from './ai/gemini';
import { createIndexedDbStorage, openDatabase } from './persist/indexedDb';
import { REGISTRY } from './state/registry';
import { App, type Platform } from './ui/app';
import { newId } from './ui/ids';
import { exportRoute, isStandalone } from './ui/pwa';
import './ui/styles.css';

/** Asks the browser to keep this site's storage (m9-release B2): on start and when installed; the answer is shown in Settings. */
async function askPersist(): Promise<void> {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist?.();
  } catch {
    // Not offered here: Settings says so.
  }
}

const platform: Platform = {
  standalone: isStandalone({ displayModeStandalone: window.matchMedia?.('(display-mode: standalone)').matches === true, navigatorStandalone: (navigator as { standalone?: boolean }).standalone }),
  async storageInfo() {
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
    const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    return { persisted, usage: est?.usage ?? null, quota: est?.quota ?? null };
  },
  async shareFile(file, title) {
    const can = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
    if (exportRoute(can) === 'download') return 'unsupported';
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      // The player closed the sheet: nothing was saved. Anything else falls back to a download.
      return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'unsupported';
    }
  },
};

/**
 * The service worker (m9-release B1), in the built app only: it caches the app shell so the game opens offline. A new build waits
 * until the player reloads into it from the banner; the page reloads once the new worker has taken over.
 */
function registerServiceWorker(app: App): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  // Reload only into an update the player asked for (the first install's takeover of a page needs none).
  let asked = false;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!asked || reloading) return;
    reloading = true;
    window.location.reload();
  });
  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      const offer = (w: ServiceWorker | null): void => {
        if (!w || !navigator.serviceWorker.controller) return;
        app.setUpdateReady(() => {
          asked = true;
          w.postMessage({ type: 'SKIP_WAITING' });
        });
      };
      offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed') offer(w);
        });
      });
      // Coming back to the app looks for a new build.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void reg.update().catch(() => undefined);
      });
    })
    .catch(() => undefined);
}

async function main(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) throw new Error('#app not found');
  try {
    const db = await openDatabase();
    void askPersist();
    window.addEventListener('appinstalled', () => void askPersist());
    const app = new App({
      root,
      registry: REGISTRY,
      storage: createIndexedDbStorage(db),
      kv: window.localStorage,
      makeProvider: (getApiKey) => createGeminiProvider({ getApiKey, fetch: window.fetch.bind(window) }),
      newId: () => newId(),
      now: () => Date.now(),
      platform,
    });
    await app.start();
    registerServiceWorker(app);
  } catch (e) {
    root.textContent = `Could not start: ${e instanceof Error ? e.message : String(e)}`;
  }
}

void main();
