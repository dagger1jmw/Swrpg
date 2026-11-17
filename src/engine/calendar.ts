// Galactic Standard Calendar math (architecture §10, D-03, D-38). Pure.
// Absolute day 0 = day 1 of month 1 of 1 ABY. Year y starts at day 368 * (y - 1); year 0 exists
// (0 BBY = 0 ABY) and is days -368..-1. BBY years are negative.

export const DAYS_PER_YEAR = 368;
export const SECONDS_PER_DAY = 86_400;
export const DAYS_PER_WEEK = 7;
/** Months 1-8 have 31 days, months 9-12 have 30 (248 + 120 = 368). */
export const MONTH_LENGTHS: readonly number[] = [31, 31, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30];

export interface CalendarDate {
  /** Signed year: BBY negative, ABY positive, 0 = 0 BBY/ABY. */
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
}

/** An instant: absolute day and second of that day (0..86399). */
export interface Instant {
  day: number;
  second: number;
}

const MONTH_STARTS: readonly number[] = MONTH_LENGTHS.reduce<number[]>(
  (acc, len, i) => {
    acc.push((acc[i] ?? 0) + len);
    return acc;
  },
  [0],
);

const mod = (n: number, m: number): number => ((n % m) + m) % m;

export function yearStartDay(year: number): number {
  return DAYS_PER_YEAR * (year - 1);
}

export function isValidDate(d: CalendarDate): boolean {
  if (!Number.isInteger(d.year) || !Number.isInteger(d.month) || !Number.isInteger(d.day)) return false;
  const len = MONTH_LENGTHS[d.month - 1];
  return len !== undefined && d.day >= 1 && d.day <= len;
}

export function absDayFromDate(d: CalendarDate): number {
  if (!isValidDate(d)) throw new RangeError(`Invalid date ${d.year}/${d.month}/${d.day}`);
  return yearStartDay(d.year) + (MONTH_STARTS[d.month - 1] ?? 0) + (d.day - 1);
}

export function dateFromAbsDay(absDay: number): CalendarDate {
  if (!Number.isInteger(absDay)) throw new RangeError(`Absolute day must be an integer: ${absDay}`);
  const year = Math.floor(absDay / DAYS_PER_YEAR) + 1;
  const dayOfYear = absDay - yearStartDay(year); // 0..367
  let month = 1;
  while (month < 12 && dayOfYear >= (MONTH_STARTS[month] ?? Infinity)) month++;
  return { year, month, day: dayOfYear - (MONTH_STARTS[month - 1] ?? 0) + 1 };
}

/** 0-based day of the year. */
export function dayOfYear(absDay: number): number {
  return mod(absDay, DAYS_PER_YEAR);
}

/** Weekday 1-7; absolute day 0 is weekday 1, continuous across years. */
export function weekday(absDay: number): number {
  return mod(absDay, DAYS_PER_WEEK) + 1;
}

/** Whole years completed between birthDay and today (negative before birth). */
export function ageInYears(birthDay: number, today: number): number {
  const by = dateFromAbsDay(birthDay).year;
  const ty = dateFromAbsDay(today).year;
  return ty - by - (dayOfYear(today) < dayOfYear(birthDay) ? 1 : 0);
}

// ---- Instants ----

export function toAbsSecond(t: Instant): number {
  return t.day * SECONDS_PER_DAY + t.second;
}

export function fromAbsSecond(abs: number): Instant {
  const day = Math.floor(abs / SECONDS_PER_DAY);
  return { day, second: abs - day * SECONDS_PER_DAY };
}

export function addSeconds(t: Instant, seconds: number): Instant {
  if (!Number.isInteger(seconds) || seconds < 0) throw new RangeError(`addSeconds: ${seconds}`);
  return fromAbsSecond(toAbsSecond(t) + seconds);
}

/** A piece of a time span that never crosses midnight. */
export interface SpanSegment {
  from: Instant;
  to: Instant;
  seconds: number;
  /** True when this segment ends exactly at a midnight (the next day starts). */
  endsAtMidnight: boolean;
}

/** Splits [from, from + seconds] at every midnight. */
export function splitAtMidnights(from: Instant, seconds: number): SpanSegment[] {
  if (!Number.isInteger(seconds) || seconds < 0) throw new RangeError(`splitAtMidnights: ${seconds}`);
  const out: SpanSegment[] = [];
  let cur = toAbsSecond(from);
  const end = cur + seconds;
  while (cur < end) {
    const nextMidnight = (Math.floor(cur / SECONDS_PER_DAY) + 1) * SECONDS_PER_DAY;
    const stop = Math.min(nextMidnight, end);
    out.push({ from: fromAbsSecond(cur), to: fromAbsSecond(stop), seconds: stop - cur, endsAtMidnight: stop === nextMidnight });
    cur = stop;
  }
  return out;
}

// ---- Display ----

/** Time-of-day labels (D-73: the legacy hour bands, a design choice). [startHour, label] */
export const TIME_OF_DAY_BANDS: readonly (readonly [number, string])[] = [
  [0, 'Late Night'],
  [3, 'Pre-Dawn'],
  [6, 'Dawn'],
  [7, 'Morning'],
  [12, 'Midday'],
  [14, 'Afternoon'],
  [18, 'Evening'],
  [21, 'Night'],
];

export function timeOfDayLabel(second: number): string {
  const hour = Math.floor(second / 3600);
  let label = TIME_OF_DAY_BANDS[0]?.[1] ?? '';
  for (const [start, name] of TIME_OF_DAY_BANDS) if (hour >= start) label = name;
  return label;
}

export function formatClock(second: number): string {
  const h = Math.floor(second / 3600);
  const m = Math.floor((second % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function withThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatYear(year: number): string {
  if (year === 0) return '0 BBY/ABY';
  return year < 0 ? `${withThousands(-year)} BBY` : `${withThousands(year)} ABY`;
}

/** e.g. "Day 1 of Month 1, 3,661 BBY (weekday 3)" */
export function formatDate(absDay: number): string {
  const d = dateFromAbsDay(absDay);
  return `Day ${d.day} of Month ${d.month}, ${formatYear(d.year)} (weekday ${weekday(absDay)})`;
}
