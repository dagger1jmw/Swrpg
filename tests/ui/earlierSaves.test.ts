// Pass 5 issue 3: "Load an earlier save" showed the list read the first time the menu opened, so later saves never
// appeared. The list is read again each time the campaign menu opens (EarlierSaves.invalidate, called by openModal).
import { describe, expect, it } from 'vitest';
import type { SaveMeta } from '../../src/persist/saveHistory';
import { createMemoryStorage } from '../../src/persist/storage';
import { makeEnvelope } from '../../src/persist/envelope';
import { REGISTRY } from '../../src/state/registry';
import type { GameState } from '../../src/state/gameState';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { testStartInput } from '../../src/turn/testStart';
import { EarlierSaves } from '../../src/ui/earlierSaves';
import { TEST_START_DATE } from '../support/dates';

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('the earlier-saves list is read again each time the campaign menu opens', () => {
  it('in storage: turns saved after the menu first opened appear when it opens again', async () => {
    const storage = createMemoryStorage();
    const input = testStartInput({ name: 'Daven', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
    const created = await createCampaign(REGISTRY, storage, input, { campaignId: 'c-es', branchId: 'b' }, 'es');
    const commit = async (s: GameState, turn: number): Promise<GameState> => {
      const next = { ...s, meta: { ...s.meta, turn } };
      await storage.commitTurn(makeEnvelope(REGISTRY, next, `t${turn}`), created.campaign, { campaignId: 'c-es', branchId: 'b', turn, savedAt: `t${turn}`, data: {} as never });
      return next;
    };
    let s = created.state;
    for (let t = 1; t <= 14; t++) s = await commit(s, t);
    let renders = 0;
    const saves = new EarlierSaves((id) => storage.listSaves(id), () => renders++);
    const newest = (): number => Math.max(...saves.current('c-es').map((m) => m.turn));
    // The menu opens at turn 14.
    saves.invalidate();
    saves.current('c-es');
    await flush();
    expect(newest()).toBe(14);
    // Five more turns are played with the menu closed, then the menu opens again.
    for (let t = 15; t <= 19; t++) s = await commit(s, t);
    expect(newest()).toBe(14); // no new read until the menu opens
    saves.invalidate();
    expect(newest()).toBe(14); // while it reads, the last list is shown, not an empty one
    await flush();
    expect(newest()).toBe(19);
    expect(renders).toBe(2);
  });
  it('one read per opening, and a new read for another campaign', async () => {
    let reads = 0;
    const list = (id: string): SaveMeta[] => [{ key: `${id}:1`, campaignId: id, branchId: 'b', turn: 1, day: 0, second: 0, place: null, dead: false } as unknown as SaveMeta];
    const saves = new EarlierSaves(async (id) => {
      reads++;
      return list(id);
    }, () => {});
    saves.current('a');
    await flush();
    saves.current('a');
    saves.current('a');
    expect(reads).toBe(1);
    expect(saves.current('b')).toEqual([]);
    await flush();
    expect(reads).toBe(2);
    saves.invalidate();
    saves.current('b');
    await flush();
    expect(reads).toBe(3);
  });
});
