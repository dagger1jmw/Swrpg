import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defaultSettings, loadSettings, saveSettings, validateApiKey, withModel, type KeyValueStore } from '../../src/ai/settings';
import { absDayFromDate } from '../../src/engine/calendar';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { AUTOSAVE_SLOT, createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { BaseState, FeatureModule } from '../../src/state/types';

const state = createInitialState<GameState>(REGISTRY, {
  campaignId: 'c1',
  branchId: 'b1',
  seed: 's',
  start: { day: absDayFromDate({ year: -3661, month: 1, day: 1 }), second: 25_200 },
  character: { name: 'Kael', birthDay: absDayFromDate({ year: -3675, month: 1, day: 1 }) },
});
const campaign = { campaignId: 'c1', name: 'Kael', createdAt: 't', lastPlayedAt: 't' };

describe('save envelope and storage (architecture §13)', () => {
  it('commits snapshot and transcript together and loads them back', async () => {
    const storage = createMemoryStorage();
    const s1 = { ...state, meta: { ...state.meta, turn: 1 } };
    await storage.commitTurn(makeEnvelope(REGISTRY, s1, '2026-11-16T00:00:00Z'), campaign, { campaignId: 'c1', branchId: 'b1', turn: 1, savedAt: 'x', data: { narrative: 'hi' } });
    const loaded = loadEnvelope(REGISTRY, await storage.loadSnapshot(AUTOSAVE_SLOT));
    expect(loaded.ok && loaded.state).toEqual(s1);
    expect((await storage.readTranscript('c1', 'b1')).map((t) => t.turn)).toEqual([1]);
  });

  it('a failed commit writes nothing; a duplicate transcript turn is refused', async () => {
    const storage = createMemoryStorage({ failNextCommit: true });
    const entry = { campaignId: 'c1', branchId: 'b1', turn: 1, savedAt: 'x', data: {} };
    await expect(storage.commitTurn(makeEnvelope(REGISTRY, state, 'x'), campaign, entry)).rejects.toThrow();
    expect(await storage.loadSnapshot(AUTOSAVE_SLOT)).toBeNull();
    expect(storage.transcript).toHaveLength(0);
    await storage.commitTurn(makeEnvelope(REGISTRY, state, 'x'), campaign, entry);
    await expect(storage.commitTurn(makeEnvelope(REGISTRY, state, 'y'), campaign, entry)).rejects.toThrow(/already exists/);
  });

  it('refuses corrupt, foreign, newer or invalid saves with a message', () => {
    const env = makeEnvelope(REGISTRY, state, 'x');
    expect(loadEnvelope(REGISTRY, null)).toEqual({ ok: false, error: 'Not a swrpg-v2 save.' });
    expect(loadEnvelope(REGISTRY, { format: 'v170' }).ok).toBe(false);
    expect(loadEnvelope(REGISTRY, { ...env, envelopeVersion: 99 }).ok).toBe(false);
    expect(loadEnvelope(REGISTRY, { ...env, featureVersions: { ...env.featureVersions, clock: 9 } }).ok).toBe(false);
    const bad = loadEnvelope(REGISTRY, { ...env, state: { ...state, clock: { ...state.clock, now: { day: 1, second: 99_999 } } } });
    expect(bad.ok).toBe(false);
    expect(!bad.ok && bad.error).toMatch(/clock\.now\.second/);
    expect(loadEnvelope(REGISTRY, { ...env, state: { ...state, junk: 1 } }).ok).toBe(false);
  });

  it('runs feature migrations from the stored version (fixture)', () => {
    type V2 = BaseState & { thing: { name: string; level: number } };
    const thingV2: FeatureModule<{ name: string; level: number }, V2> = {
      id: 'thing',
      version: 2,
      initialState: () => ({ name: 'a', level: 0 }),
      stateSchema: z.object({ name: z.string(), level: z.number() }),
      events: {},
      selectors: {},
      migrations: { 2: (old) => ({ ...(old as { name: string }), level: 1 }) },
    };
    const fixtureV1 = {
      format: 'swrpg-v2',
      envelopeVersion: 1,
      featureVersions: { thing: 1 },
      savedAt: 'x',
      state: { meta: state.meta, thing: { name: 'old' } },
    };
    const r = loadEnvelope([thingV2], fixtureV1);
    expect(r.ok && r.state['thing']).toEqual({ name: 'old', level: 1 });
    const noMigration = { ...thingV2, migrations: {} };
    expect(loadEnvelope([noMigration], fixtureV1).ok).toBe(false);
  });
});

describe('settings (D-24)', () => {
  const memStore = (): KeyValueStore & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
  };

  it('defaults to the D-68 models and round-trips', () => {
    const store = memStore();
    const s = loadSettings(store);
    expect(s.models.narrative).toBe('gemini-3.6-flash');
    expect(s.models.intent).toBe('gemini-3.5-flash-lite');
    expect(s.limits['gemini-3.6-flash']).toEqual({ rpm: 5, tpm: 250_000, rpd: 20 });
    saveSettings(store, withModel({ ...s, apiKey: 'AIzaXXXXXXXXXXXXXXXXXXXX' }, 'narrative', 'gemini-3.8-flash'));
    const back = loadSettings(store);
    expect(back.models.narrative).toBe('gemini-3.8-flash');
    expect(back.apiKey).toBe('AIzaXXXXXXXXXXXXXXXXXXXX');
  });

  it('falls back to defaults on corrupt data', () => {
    const store = memStore();
    store.setItem('swrpg-v2:settings', '{not json');
    expect(loadSettings(store)).toEqual(defaultSettings());
  });

  it('validates keys (trimmed, no spaces, not too short)', () => {
    expect(validateApiKey('  AIzaSyABCDEFGHIJKLMNOPQRSTUV  ')).toEqual({ key: 'AIzaSyABCDEFGHIJKLMNOPQRSTUV' });
    expect('error' in validateApiKey('short')).toBe(true);
    expect('error' in validateApiKey('AIza Sy ABCDEFGHIJKLMNOPQRSTUV')).toBe(true);
  });
});
