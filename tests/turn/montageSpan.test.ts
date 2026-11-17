// Montage spans on the calendar (D-142): whole months and years end on the same day of the month that
// many months later (31-day months 1-8, 30-day months 9-12), at the wake time.
import { describe, expect, it } from 'vitest';
import { absDayFromDate, addCalendarMonths, dateFromAbsDay } from '../../src/engine/calendar';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { jumpTargetDay, resolveTurn } from '../../src/turn/resolve';

const day = (year: number, month: number, d: number) => absDayFromDate({ year, month, day: d });

describe('addCalendarMonths', () => {
  it('lands on the same day of the month', () => {
    expect(addCalendarMonths(day(-3661, 1, 1), 3)).toBe(day(-3661, 4, 1));
    expect(addCalendarMonths(day(-3661, 1, 1), 3) - day(-3661, 1, 1)).toBe(93);
    expect(addCalendarMonths(day(-3661, 2, 17), 1)).toBe(day(-3661, 3, 17));
    expect(addCalendarMonths(day(-3661, 9, 10), 3)).toBe(day(-3661, 12, 10));
  });
  it('clamps to the shorter 30-day months 9-12', () => {
    expect(addCalendarMonths(day(-3661, 8, 31), 1)).toBe(day(-3661, 9, 30));
    expect(addCalendarMonths(day(-3661, 6, 31), 3)).toBe(day(-3661, 9, 30));
  });
  it('carries across years, including year 0 (1 BBY -> 0 BBY/ABY -> 1 ABY)', () => {
    expect(addCalendarMonths(day(-3661, 11, 20), 3)).toBe(day(-3660, 2, 20));
    expect(addCalendarMonths(day(-1, 12, 5), 1)).toBe(day(0, 1, 5));
    expect(addCalendarMonths(day(0, 12, 5), 1)).toBe(day(1, 1, 5));
    expect(addCalendarMonths(day(-3661, 5, 3), 12)).toBe(day(-3660, 5, 3));
  });
});

describe('jumpTargetDay', () => {
  it('months and years follow the calendar; days and weeks count days', () => {
    const from = day(-3661, 1, 1);
    expect(jumpTargetDay(from, 92 * 86_400, { amount: 3, unit: 'months' })).toBe(day(-3661, 4, 1));
    expect(jumpTargetDay(from, 368 * 86_400, { amount: 1, unit: 'years' })).toBe(day(-3660, 1, 1));
    expect(jumpTargetDay(from, 92 * 86_400, { amount: 92, unit: 'days' })).toBe(from + 92);
    expect(jumpTargetDay(from, 14 * 86_400, { amount: 2, unit: 'weeks' })).toBe(from + 14);
    // A fractional month has no calendar day: counted in days.
    expect(jumpTargetDay(from, 46 * 86_400, { amount: 1.5, unit: 'months' })).toBe(from + 46);
  });
});

describe('a "3 months" montage turn', () => {
  it('ends on the same day of the month three months later, at the wake time', () => {
    const start = day(-3661, 1, 1);
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
    expect(dateFromAbsDay(state.clock.now.day)).toEqual({ year: -3661, month: 4, day: 1 });
    expect(state.clock.now.second).toBe(s.routines.active.wakeSecond);
    expect(rep.requestedDays).toBe(93);
    expect(rep.daysCompleted).toBe(93);
  });
});
