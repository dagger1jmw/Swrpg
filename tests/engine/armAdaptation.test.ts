// M5 balance table rows 6 and 4 (Jared, 2026-11-20): a cybernetic arm or hand adapts within the 30-40 day reference
// (ARM_OTHER_SHARE, the share only, as in D-230); the roll card says when cover is on both sides.
import { describe, expect, it } from 'vitest';
import type { ExchangeRecord } from '../../src/engine/duel';
import { createMemoryStorage } from '../../src/persist/storage';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import { testStartInput } from '../../src/turn/testStart';
import { coverNote } from '../../src/ui/duelPanel';
import { CLONE_WARS_DATE } from '../support/dates';

const adaptedAfter = async (limb: string, days: number): Promise<number> => {
  const input = testStartInput({ name: 'K', rank: 'knight', age: 30, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
  let s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-adapt-${limb}`, branchId: 'b' }, 'adapt')).state;
  s = runDevCommand(REGISTRY, s, `/sever ${limb}`).state;
  // A montage stops at a story event ("a mission is offered"), so skip again until the day is reached.
  const until = s.clock.now.day + days;
  while (s.clock.now.day < until) s = runDevCommand(REGISTRY, s, `/skip ${until - s.clock.now.day} days`).state;
  return (s.health.lasting[0] as unknown as { adaptation: number }).adaptation;
};

describe('a quality cybernetic arm or hand adapts in about 30-40 days (row 6)', () => {
  it('the arm and the hand: well under way at 20 days, about done at 40 (pass 4: 3% at 30)', async () => {
    for (const limb of ['right arm', 'left hand']) {
      expect(await adaptedAfter(limb, 20), limb).toBeGreaterThan(0.4);
      expect(await adaptedAfter(limb, 40), limb).toBeGreaterThan(0.95);
    }
  });
  it('the leg is unchanged (D-230: about 64% at 40 days)', async () => {
    const leg = await adaptedAfter('left leg', 40);
    expect(leg).toBeGreaterThan(0.55);
    expect(leg).toBeLessThan(0.75);
  });
});

describe('the roll card: cover on both sides (row 4)', () => {
  const roll = (cover: boolean) => ({ d20: 10, natural: null, naturalBonus: 0, effectiveLevel: 30, levelBonus: 3, modifiers: cover ? [{ source: 'cover', value: 2 }] : [], total: 15 });
  const rec = (a: boolean, b: boolean): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 't', rollA: roll(a), rollB: roll(b), margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 30, effB: 30, seconds: 6, notes: [], surprise: false }) as unknown as ExchangeRecord;
  it('a note when both rolls carry cover; none when one does or neither', () => {
    expect(coverNote(rec(true, true))).toBe('cover on both sides: the two bonuses cancel');
    expect(coverNote(rec(false, true))).toBeNull();
    expect(coverNote(rec(false, false))).toBeNull();
  });
});
