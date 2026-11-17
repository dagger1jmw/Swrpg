import { describe, expect, it } from 'vitest';
import { absDayFromDate, DAYS_PER_YEAR } from '../../src/engine/calendar';
import { makeEnvelope } from '../../src/persist/envelope';
import { exportCampaign, importCampaign, parseImport, type ExportFile } from '../../src/persist/exportImport';
import { AUTOSAVE_SLOT, createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: -3661, month: 1, day: 1 });

async function saved() {
  const storage = createMemoryStorage();
  let state = createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: START, second: 0 },
    character: { name: 'Kael', birthDay: START - 14 * DAYS_PER_YEAR },
  });
  state = applyEvents(REGISTRY, state, [{ type: 'factLearned', aboutRef: 'pc', fact: 'Kael fears water.', importance: 'minor' }], { source: 'ai' }).state;
  const campaign = { campaignId: 'c1', name: 'Kael', createdAt: 'a', lastPlayedAt: 'b' };
  for (const turn of [1, 2]) {
    state = { ...state, meta: { ...state.meta, turn } };
    await storage.commitTurn(makeEnvelope(REGISTRY, state, 'now'), campaign, { campaignId: 'c1', branchId: 'b1', turn, savedAt: 'now', data: { narrative: `turn ${turn}` } });
  }
  return { storage, state };
}

describe('export / import (architecture §13)', () => {
  it('round-trips the save (with memory) and the transcript into an empty storage', async () => {
    const { storage, state } = await saved();
    const file = (await exportCampaign(REGISTRY, storage, 'x')) as ExportFile;
    expect(file.transcript.map((t) => t.turn)).toEqual([1, 2]);
    const json = JSON.parse(JSON.stringify(file)) as unknown;
    const target = createMemoryStorage();
    const r = await importCampaign(REGISTRY, target, json, () => 'b2', 'later');
    expect(r).toMatchObject({ ok: true, rebranched: false });
    expect(r.ok && r.state).toEqual(state);
    expect(target.transcript).toHaveLength(2);
    expect(await target.loadSnapshot(AUTOSAVE_SLOT)).toBeTruthy();
  });

  it('importing into storage that already has that branch continues on a new branch', async () => {
    const { storage } = await saved();
    const file = (await exportCampaign(REGISTRY, storage, 'x')) as ExportFile;
    const r = await importCampaign(REGISTRY, storage, JSON.parse(JSON.stringify(file)), () => 'b2', 'later');
    expect(r).toMatchObject({ ok: true, rebranched: true });
    expect(r.ok && r.state.meta.branchId).toBe('b2');
    expect(storage.transcript.filter((t) => t.branchId === 'b1')).toHaveLength(2);
    expect(storage.transcript.filter((t) => t.branchId === 'b2')).toHaveLength(2);
  });

  it('refuses corrupt or mismatched files and writes nothing', async () => {
    const { storage } = await saved();
    const file = (await exportCampaign(REGISTRY, storage, 'x')) as ExportFile;
    expect(parseImport(REGISTRY, { format: 'nope' })).toMatchObject({ ok: false });
    expect(parseImport(REGISTRY, { ...file, transcript: [{ ...file.transcript[0], branchId: 'other' }] })).toMatchObject({ ok: false });
    expect(parseImport(REGISTRY, { ...file, transcript: [file.transcript[0], file.transcript[0]] })).toMatchObject({ ok: false });
    const broken = { ...file, envelope: { ...file.envelope, state: { ...(file.envelope.state as object), memory: { facts: 'x' } } } };
    const target = createMemoryStorage();
    expect(await importCampaign(REGISTRY, target, broken, () => 'b2', 'later')).toMatchObject({ ok: false });
    expect(target.transcript).toHaveLength(0);
    expect(await target.loadSnapshot(AUTOSAVE_SLOT)).toBeNull();
  });

  it('no save means nothing to export', async () => {
    expect(await exportCampaign(REGISTRY, createMemoryStorage(), 'x')).toBeNull();
  });
});
