// Browser entry: wires the real adapters (IndexedDB, localStorage, Gemini via fetch) into the app.
import { createGeminiProvider } from './ai/gemini';
import { createIndexedDbStorage, openDatabase } from './persist/indexedDb';
import { REGISTRY } from './state/registry';
import { App } from './ui/app';
import { newId } from './ui/ids';
import './ui/styles.css';

async function main(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) throw new Error('#app not found');
  try {
    const db = await openDatabase();
    const app = new App({
      root,
      registry: REGISTRY,
      storage: createIndexedDbStorage(db),
      kv: window.localStorage,
      makeProvider: (getApiKey) => createGeminiProvider({ getApiKey, fetch: window.fetch.bind(window) }),
      newId: () => newId(),
      now: () => Date.now(),
    });
    await app.start();
  } catch (e) {
    root.textContent = `Could not start: ${e instanceof Error ? e.message : String(e)}`;
  }
}

void main();
