// The pace window's store (opt-1 F, D-533; D-48, D-104, D-457). Per skill, the credited XP and training hours of the rolling 365-day
// window, kept compactly: one sum per finished calendar week (week = floor(absolute day / 7)) and the current week's days, every
// value at a fixed precision. It replaced one {day, xp, hours} object per skill per day (about 97% of the save at a year).
// Pure.
//
// What the readers get, and the tolerance:
// - the days of the current week are exact (to the precision below);
// - a finished week counts whole when at least 4 of its 7 days are inside the window, and not at all otherwise, so the window's
//   oldest edge moves by at most 3 days (of 365, under 1%). The 4.0x clamp reads XP and hours over the same window, so a moved
//   edge shifts both sides of its ratio together;
// - XP is kept to 0.001 and hours to 0.001 (3.6 seconds): a year's rounding moves a sum by at most 0.2.
// The seeded-lives comparison (tests/features/paceWindowStore.test.ts) checks the results against the old store.
import { PACE_WINDOW_DAYS } from '../data/progression.config';

/** One skill's window: the first stored week's start day, the week sums, and the current week's days. */
export interface PaceSkillStore {
  /** Start day of the first week in wx / wh (a multiple of 7); the weeks follow without gaps. */
  w0: number;
  wx: number[];
  wh: number[];
  /** The current week's days (ascending), their XP and hours. */
  dd: number[];
  dx: number[];
  dh: number[];
}


export const PACE_WEEK_DAYS = 7;
/** A finished week counts when at least this many of its days are inside the window. */
export const PACE_WEEK_MIN_INSIDE = 4;

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const weekStart = (day: number): number => Math.floor(day / PACE_WEEK_DAYS) * PACE_WEEK_DAYS;

export const emptySkillStore = (): PaceSkillStore => ({ w0: 0, wx: [], wh: [], dd: [], dx: [], dh: [] });

/** Days of the week starting `start` inside the window that ends on `today` (inclusive). */
function insideDays(start: number, today: number): number {
  const lo = Math.max(start, today - PACE_WINDOW_DAYS + 1);
  const hi = Math.min(start + PACE_WEEK_DAYS - 1, today);
  return Math.max(0, hi - lo + 1);
}

/**
 * Today's credited XP and hours for one skill (the day's whole share, added to what the day already has). Days of earlier weeks are
 * folded into their week's sum; weeks wholly outside the window are dropped (the old store dropped days past it on the same write).
 */
export function addToStore(store: PaceSkillStore | undefined, day: number, xp: number, hours: number): PaceSkillStore {
  const s = store ?? emptySkillStore();
  let w0 = s.w0;
  let wx = s.wx.slice();
  let wh = s.wh.slice();
  const dd: number[] = [];
  const dx: number[] = [];
  const dh: number[] = [];
  const thisWeek = weekStart(day);
  const fold = (d: number, x: number, h: number): void => {
    const ws = weekStart(d);
    if (!wx.length) w0 = ws;
    if (ws < w0) {
      const pad = (w0 - ws) / PACE_WEEK_DAYS;
      wx = [...Array<number>(pad).fill(0), ...wx];
      wh = [...Array<number>(pad).fill(0), ...wh];
      w0 = ws;
    }
    const i = (ws - w0) / PACE_WEEK_DAYS;
    while (wx.length <= i) {
      wx.push(0);
      wh.push(0);
    }
    wx[i] = round3(wx[i]! + x);
    wh[i] = round3(wh[i]! + h);
  };
  for (let k = 0; k < s.dd.length; k++) {
    if (weekStart(s.dd[k]!) < thisWeek) fold(s.dd[k]!, s.dx[k]!, s.dh[k]!);
    else {
      dd.push(s.dd[k]!);
      dx.push(s.dx[k]!);
      dh.push(s.dh[k]!);
    }
  }
  const last = dd.length - 1;
  if (last >= 0 && dd[last] === day) {
    dx[last] = round3(dx[last]! + xp);
    dh[last] = round3(dh[last]! + hours);
  } else {
    dd.push(day);
    dx.push(round3(xp));
    dh.push(round3(hours));
  }
  // Weeks wholly outside the window go (their last day at or before day - 365).
  let drop = 0;
  while (drop < wx.length && w0 + drop * PACE_WEEK_DAYS + PACE_WEEK_DAYS - 1 <= day - PACE_WINDOW_DAYS) drop++;
  if (drop) {
    wx = wx.slice(drop);
    wh = wh.slice(drop);
    w0 += drop * PACE_WEEK_DAYS;
  }
  // Leading empty weeks carry nothing.
  while (wx.length && wx[0] === 0 && wh[0] === 0) {
    wx.shift();
    wh.shift();
    w0 += PACE_WEEK_DAYS;
  }
  if (!wx.length) w0 = 0;
  return { w0, wx, wh, dd, dx, dh };
}

/** A skill's XP and hours in the window that ends on `today` (inclusive): what the 4.0x clamp reads. */
export function windowSums(store: PaceSkillStore | undefined, today: number): { xp: number; hours: number } {
  if (!store) return { xp: 0, hours: 0 };
  let xp = 0;
  let hours = 0;
  for (let i = 0; i < store.wx.length; i++) {
    const start = store.w0 + i * PACE_WEEK_DAYS;
    if (start > today) break;
    const inside = insideDays(start, today);
    if (inside >= PACE_WEEK_MIN_INSIDE) {
      xp += store.wx[i]!;
      hours += store.wh[i]!;
    }
  }
  for (let k = 0; k < store.dd.length; k++) {
    const d = store.dd[k]!;
    if (d > today - PACE_WINDOW_DAYS && d <= today) {
      xp += store.dx[k]!;
      hours += store.dh[k]!;
    }
  }
  return { xp, hours };
}

/** Every hour the store holds (the body's ageing reads the year's training hours as the old store did: all it kept). */
export function storedHours(store: PaceSkillStore | undefined): number {
  if (!store) return 0;
  return store.wh.reduce((a, b) => a + b, 0) + store.dh.reduce((a, b) => a + b, 0);
}

/** The old store's daily entries, converted (the save migration): each day added in order. */
export function storeFromEntries(entries: readonly { day: number; xp: number; hours: number }[]): PaceSkillStore {
  let s: PaceSkillStore | undefined;
  const sorted = [...entries].sort((a, b) => a.day - b.day);
  for (const e of sorted) s = addToStore(s, e.day, e.xp, e.hours);
  return s ?? emptySkillStore();
}
