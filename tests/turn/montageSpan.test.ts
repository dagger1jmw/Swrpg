// Montage spans on the calendar (D-142): whole months and years end on the same day of the month that
// many months later (31-day months 1-8, 30-day months 9-12), at the wake time.
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it, vi } from 'vitest';
import { absDayFromDate, addCalendarMonths, dateFromAbsDay } from '../../src/engine/calendar';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { jumpTargetDay, resolveTurn } from '../../src/turn/resolve';
import type * as WorldEventsConfig from '../../src/data/worldEvents.config';

// World events are switched off in this file (D-457, Jared): the span test checks the calendar, not the world's rolls, so it
// no longer depends on a seed that happens to roll no event (D-427 and D-456 each shifted the RNG and broke the seed).
vi.mock('../../src/data/worldEvents.config', async (orig) => ({ ...(await orig<typeof WorldEventsConfig>()), WORLD_EVENT_CHANCE: { significant: 0, minor: 0 } }));

const day = (year: number, month: number, d: number) => absDayFromDate({ year, month, day: d });

describe('addCalendarMonths', () => {
  it('lands on the same day of the month', () => {
    expect(addCalendarMonths(day(TEST_YEAR, 1, 1), 3)).toBe(day(TEST_YEAR, 4, 1));
    expect(addCalendarMonths(day(TEST_YEAR, 1, 1), 3) - day(TEST_YEAR, 1, 1)).toBe(93);
    expect(addCalendarMonths(day(TEST_YEAR, 2, 17), 1)).toBe(day(TEST_YEAR, 3, 17));
    expect(addCalendarMonths(day(TEST_YEAR, 9, 10), 3)).toBe(day(TEST_YEAR, 12, 10));
  });
  it('clamps to the shorter 30-day months 9-12', () => {
    expect(addCalendarMonths(day(TEST_YEAR, 8, 31), 1)).toBe(day(TEST_YEAR, 9, 30));
    expect(addCalendarMonths(day(TEST_YEAR, 6, 31), 3)).toBe(day(TEST_YEAR, 9, 30));
  });
  it('carries across years, including year 0 (1 BBY -> 0 BBY/ABY -> 1 ABY)', () => {
    expect(addCalendarMonths(day(TEST_YEAR, 11, 20), 3)).toBe(day((TEST_YEAR + 1), 2, 20));
    expect(addCalendarMonths(day(-1, 12, 5), 1)).toBe(day(0, 1, 5));
    expect(addCalendarMonths(day(0, 12, 5), 1)).toBe(day(1, 1, 5));
    expect(addCalendarMonths(day(TEST_YEAR, 5, 3), 12)).toBe(day((TEST_YEAR + 1), 5, 3));
  });
});

describe('jumpTargetDay', () => {
  it('months and years follow the calendar; days and weeks count days', () => {
    const from = day(TEST_YEAR, 1, 1);
    expect(jumpTargetDay(from, 92 * 86_400, { amount: 3, unit: 'months' })).toBe(day(TEST_YEAR, 4, 1));
    expect(jumpTargetDay(from, 368 * 86_400, { amount: 1, unit: 'years' })).toBe(day((TEST_YEAR + 1), 1, 1));
    expect(jumpTargetDay(from, 92 * 86_400, { amount: 92, unit: 'days' })).toBe(from + 92);
    expect(jumpTargetDay(from, 14 * 86_400, { amount: 2, unit: 'weeks' })).toBe(from + 14);
    // A fractional month has no calendar day: counted in days.
    expect(jumpTargetDay(from, 46 * 86_400, { amount: 1.5, unit: 'months' })).toBe(from + 46);
  });
});

describe('a "3 months" montage turn', () => {
  it('ends on the same day of the month three months later, at the wake time', () => {
    const start = day(TEST_YEAR, 1, 1);
    const s = createInitialState<GameState>(REGISTRY, {
      campaignId: 'c1',
      branchId: 'b1',
      seed: 'span',
      start: { day: start, second: 9 * 3600 },
      character: { name: 'Kael', birthDay: start - 25 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
      rank: 'knight',
    });
    const { draft, state } = resolveTurn(REGISTRY, s, {
      actionType: 'train',
      targets: [],
      references: [],
      unknownNames: [],
      requestedPacing: 'montage',
      requestedSpan: { amount: 3, unit: 'months' },
    });
    const rep = draft.jump!.report;
    expect(rep.interrupted).toBeNull();
    expect(dateFromAbsDay(state.clock.now.day)).toEqual({ year: TEST_YEAR, month: 4, day: 1 });
    expect(state.clock.now.second).toBe(s.routines.active.wakeSecond);
    expect(rep.requestedDays).toBe(93);
    expect(rep.daysCompleted).toBe(93);
  });
});
