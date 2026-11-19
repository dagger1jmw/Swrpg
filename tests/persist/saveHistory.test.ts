// D-214 (combat pass 2, issue 10): earlier saves. The last 10, plus one per in-game day for the last 7 days; "Load an
// earlier save" starts a new branch (after death too), copying the old branch's transcript up to that turn.
import { describe, expect, it } from 'vitest';
import { makeEnvelope } from '../../src/persist/envelope';
import { retainSaves, SAVE_HISTORY, saveKey, type SaveMeta } from '../../src/persist/saveHistory';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND, loadEarlierSave, resumeCampaign } from '../../src/turn/campaign';
import { testStartInput } from '../../src/turn/testStart';
import { deathCardHint, saveLabel } from '../../src/ui/app';
import { TEST_START_DATE } from '../support/dates';

const meta = (turn: number, day: number): SaveMeta => ({ key: saveKey('c', 'b', turn), campaignId: 'c', branchId: 'b', turn, savedAt: `t${String(turn).padStart(3, '0')}`, day, second: 0, place: 'Temple', dead: false });

describe('retention (D-214)', () => {
  it(`keeps the last ${SAVE_HISTORY.recent} and the newest save of each of the last ${SAVE_HISTORY.dailyDays} in-game days`, () => {
    // 60 saves over 20 days, three a day.
    let kept: SaveMeta[] = [];
    const dropped: string[] = [];
    for (let t = 1; t <= 60; t++) {
      const r = retainSaves(kept, meta(t, Math.ceil(t / 3)));
      kept = r.keep;
      dropped.push(...r.drop);
    }
    const turns = kept.map((m) => m.turn).sort((a, b) => a - b);
    // Recent: 51-60. Dailies, days 14-20: the last save of each day (42, 45, 48, 51, 54, 57, 60), days 17-20 already recent.
    expect(turns).toEqual([42, 45, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
    expect(new Set(dropped).size + kept.length).toBe(60);
    expect(kept[0]!.turn).toBe(60);
  });
  it('a re-commit of the same turn replaces it', () => {
    const r = retainSaves([meta(3, 1), meta(2, 1)], { ...meta(3, 1), savedAt: 'later' });
    expect(r.keep.filter((m) => m.turn === 3)).toHaveLength(1);
    expect(r.keep[0]!.savedAt).toBe('later');
  });
});

async function campaign() {
  const storage = createMemoryStorage();
  const input = testStartInput({ name: 'Kael Voss', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
  const c = await createCampaign(REGISTRY, storage, input, { campaignId: 'camp', branchId: 'b0' }, '2026-11-19T00:00:00.000Z');
  return { storage, c };
}
/** Commits turn n: the clock a day further each turn, a transcript entry, optionally dead. */
async function commit(storage: ReturnType<typeof createMemoryStorage>, base: GameState, n: number, dead = false): Promise<GameState> {
  const s: GameState = { ...base, meta: { ...base.meta, turn: n }, clock: { ...base.clock, now: { ...base.clock.now, day: base.clock.now.day + 1 } }, health: dead ? { ...base.health, death: { atAbs: 0, cause: 'died of their wounds (the dying timer ran out)' } } : base.health };
  await storage.commitTurn(makeEnvelope(REGISTRY, s, `2026-11-19T00:00:${String(n).padStart(2, '0')}.000Z`), { campaignId: 'camp', name: 'Kael Voss', createdAt: 'x', lastPlayedAt: 'x' }, { campaignId: 'camp', branchId: s.meta.branchId, turn: n, savedAt: 'x', data: { turn: n, narrative: `turn ${n}`, input: { kind: 'typed', text: `t${n}` } } });
  return s;
}

describe('the save history in storage and loading an earlier save (D-214)', () => {
  it('every commit is listed with its date, place and turn; pruned snapshots are deleted', async () => {
    const { storage, c } = await campaign();
    let s = c.state;
    for (let n = 1; n <= 14; n++) s = await commit(storage, s, n);
    const list = await storage.listSaves('camp');
    expect(list[0]!.turn).toBe(14);
    expect(list.length).toBe(10);
    const snapshotSaves = [...storage.snapshots.keys()].filter((k) => k.startsWith('save:'));
    expect(snapshotSaves.sort()).toEqual(list.map((m) => m.key).sort());
    expect(saveLabel(list[0]!)).toMatch(/^Day \d+ of Month \d+, 1,032 BBY \(weekday \d\), \d\d:\d\d · .+ · turn 14$/);
  });
  it('after death: an earlier save plays on, alive, on a new branch with the history up to that turn; the old branch is untouched', async () => {
    const { storage, c } = await campaign();
    let s = c.state;
    for (let n = 1; n <= 5; n++) s = await commit(storage, s, n, n === 5);
    expect(s.health.death).not.toBeNull();
    const target = (await storage.listSaves('camp')).find((m) => m.turn === 3)!;
    const r = await loadEarlierSave(REGISTRY, storage, target.key, 'b1', '2026-11-19T01:00:00.000Z');
    if ('error' in r) throw new Error(r.error);
    expect(r.session.state.health.death).toBeNull();
    expect(r.session.state.meta.branchId).toBe('b1');
    expect(r.session.state.meta.turn).toBe(3);
    expect(r.session.history.map((h) => h.turn)).toEqual([1, 2, 3]);
    // The old branch keeps all five turns; resuming loads the new branch.
    expect((await storage.readTranscript('camp', 'b0')).map((e) => e.turn)).toEqual([1, 2, 3, 4, 5]);
    const resumed = await resumeCampaign(REGISTRY, storage);
    expect(resumed && 'session' in resumed && resumed.session.state.meta.branchId).toBe('b1');
    expect(resumed && 'session' in resumed && resumed.session.history.map((h) => h.turn)).toEqual([1, 2, 3]);
    // Playing on commits turn 4 on the new branch without touching the old one.
    await commit(storage, r.session.state, 4);
    expect((await storage.readTranscript('camp', 'b1')).map((e) => e.turn)).toEqual([1, 2, 3, 4]);
  });
  it('the death card points to "Load an earlier save"', () => {
    expect(deathCardHint('died of their wounds (the dying timer ran out)')).toBe('Died of their wounds (the dying timer ran out). Choose Load an earlier save (in the campaign menu) to play on from before this moment on a new branch, or create a new character.');
  });
});
