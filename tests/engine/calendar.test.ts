import { describe, expect, it } from 'vitest';
import {
  absDayFromDate,
  addSeconds,
  ageInYears,
  dateFromAbsDay,
  formatClock,
  formatDate,
  formatYear,
  splitAtMidnights,
  timeOfDayLabel,
  weekday,
  yearStartDay,
} from '../../src/engine/calendar';

describe('calendar (architecture §10, D-38)', () => {
  it('day 0 is day 1 of month 1 of 1 ABY, weekday 1', () => {
    expect(dateFromAbsDay(0)).toEqual({ year: 1, month: 1, day: 1 });
    expect(weekday(0)).toBe(1);
  });

  it('year 0 exists: days -368..-1; 1 BBY is days -736..-369', () => {
    expect(dateFromAbsDay(-368)).toEqual({ year: 0, month: 1, day: 1 });
    expect(dateFromAbsDay(-1)).toEqual({ year: 0, month: 12, day: 30 });
    expect(dateFromAbsDay(-736)).toEqual({ year: -1, month: 1, day: 1 });
    expect(dateFromAbsDay(-369)).toEqual({ year: -1, month: 12, day: 30 });
  });

  it('rolls over 1 BBY -> 0 BBY/ABY -> 1 ABY', () => {
    expect(formatYear(dateFromAbsDay(-369).year)).toBe('1 BBY');
    expect(formatYear(dateFromAbsDay(-368).year)).toBe('0 BBY/ABY');
    expect(formatYear(dateFromAbsDay(-1).year)).toBe('0 BBY/ABY');
    expect(formatYear(dateFromAbsDay(0).year)).toBe('1 ABY');
  });

  it('month 8 has 31 days and month 9 has 30 (8 -> 9 boundary)', () => {
    const lastOf8 = absDayFromDate({ year: -3661, month: 8, day: 31 });
    expect(dateFromAbsDay(lastOf8 + 1)).toEqual({ year: -3661, month: 9, day: 1 });
    expect(() => absDayFromDate({ year: 5, month: 9, day: 31 })).toThrow();
    const lastOf12 = absDayFromDate({ year: 5, month: 12, day: 30 });
    expect(dateFromAbsDay(lastOf12 + 1)).toEqual({ year: 6, month: 1, day: 1 });
  });

  it('round-trips every day across several years, including BBY and year 0', () => {
    for (let d = yearStartDay(-3); d < yearStartDay(3); d++) {
      expect(absDayFromDate(dateFromAbsDay(d))).toBe(d);
    }
    const sample = absDayFromDate({ year: -3661, month: 1, day: 1 });
    expect(sample).toBe(368 * (-3661 - 1));
    expect(dateFromAbsDay(sample)).toEqual({ year: -3661, month: 1, day: 1 });
  });

  it('weeks run continuously across a year boundary', () => {
    const last = absDayFromDate({ year: -3662, month: 12, day: 30 });
    expect(weekday(last + 1)).toBe((weekday(last) % 7) + 1);
    expect(weekday(-1)).toBe(7);
    for (let d = -20; d < 20; d++) expect(weekday(d + 1)).toBe((weekday(d) % 7) + 1);
  });

  it('age is derived from birth day and today', () => {
    const birth = absDayFromDate({ year: -3675, month: 6, day: 10 });
    expect(ageInYears(birth, absDayFromDate({ year: -3661, month: 6, day: 9 }))).toBe(13);
    expect(ageInYears(birth, absDayFromDate({ year: -3661, month: 6, day: 10 }))).toBe(14);
    // Across year 0
    const b0 = absDayFromDate({ year: -2, month: 3, day: 1 });
    expect(ageInYears(b0, absDayFromDate({ year: 1, month: 3, day: 1 }))).toBe(3);
  });

  it('adds seconds and splits spans at midnight', () => {
    expect(addSeconds({ day: 4, second: 86_390 }, 20)).toEqual({ day: 5, second: 10 });
    expect(addSeconds({ day: -1, second: 86_399 }, 1)).toEqual({ day: 0, second: 0 });
    const segs = splitAtMidnights({ day: 0, second: 80_000 }, 86_400 * 2);
    expect(segs.map((s) => s.seconds)).toEqual([6_400, 86_400, 80_000]);
    expect(segs.map((s) => s.endsAtMidnight)).toEqual([true, true, false]);
    expect(segs.reduce((a, s) => a + s.seconds, 0)).toBe(86_400 * 2);
    expect(splitAtMidnights({ day: 3, second: 100 }, 0)).toEqual([]);
  });

  it('formats clock, labels and dates', () => {
    expect(formatClock(7 * 3600 + 5 * 60 + 30)).toBe('07:05');
    expect(timeOfDayLabel(7 * 3600)).toBe('Morning');
    expect(timeOfDayLabel(2 * 3600)).toBe('Late Night');
    expect(timeOfDayLabel(23 * 3600)).toBe('Night');
    expect(formatDate(absDayFromDate({ year: -3661, month: 1, day: 1 }))).toMatch(/^Day 1 of Month 1, 3,661 BBY \(weekday \d\)$/);
  });
});
