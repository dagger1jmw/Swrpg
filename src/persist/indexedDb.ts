// IndexedDB implementation of Storage (architecture §13). Stores: campaigns, snapshots
// (autosave + slots), transcript keyed by [campaignId, branchId, turn].
import type { CampaignRecord, Storage, TranscriptEntry } from './storage';
import { AUTOSAVE_SLOT } from './storage';

const DB_NAME = 'swrpg-v2';
const DB_VERSION = 1;

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export function openDatabase(factory: IDBFactory = indexedDB): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('campaigns')) db.createObjectStore('campaigns', { keyPath: 'campaignId' });
      if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots');
      if (!db.objectStoreNames.contains('transcript')) db.createObjectStore('transcript', { keyPath: ['campaignId', 'branchId', 'turn'] });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open IndexedDB'));
    req.onblocked = () => reject(new Error('IndexedDB is blocked by another open tab'));
  });
}

export function createIndexedDbStorage(db: IDBDatabase): Storage {
  return {
    async commitTurn(envelope, campaign: CampaignRecord, entry: TranscriptEntry | null) {
      const tx = db.transaction(['snapshots', 'campaigns', 'transcript'], 'readwrite');
      const done = txDone(tx);
      tx.objectStore('snapshots').put(envelope, AUTOSAVE_SLOT);
      tx.objectStore('campaigns').put(campaign);
      // add (not put): an existing entry aborts the whole transaction, so nothing is overwritten.
      if (entry) tx.objectStore('transcript').add(entry);
      await done;
    },
    async loadSnapshot(slot) {
      const tx = db.transaction('snapshots', 'readonly');
      const v = await promisify(tx.objectStore('snapshots').get(slot));
      return v ?? null;
    },
    async readTranscript(campaignId, branchId, fromTurn = 0) {
      const tx = db.transaction('transcript', 'readonly');
      const range = IDBKeyRange.bound([campaignId, branchId, fromTurn], [campaignId, branchId, Number.MAX_SAFE_INTEGER]);
      return (await promisify(tx.objectStore('transcript').getAll(range))) as TranscriptEntry[];
    },
  };
}
