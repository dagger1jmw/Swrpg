// opt-1 F (D-533): the pace window's compact store against the old daily entries. The readers get the same sums within the stated
// tolerance (the edge week counts whole with 4 of its 7 days inside, so the oldest edge moves at most 3 days; values at 0.001), old
// saves migrate, and the store stays small. The seeded lives' comparison is in reports/opt-1.md F (identical XP where the 4.0x clamp
// never fires; within 0.12 levels where it does).
import { describe, expect, it } from 'vitest';
import { PACE_WINDOW_DAYS } from '../../src/data/progression.config';
import { addToStore, PACE_WEEK_DAYS, storedHours, storeFromEntries, windowSums, type PaceSkillStore } from '../../src/engine/paceStore';
import { migrateProgressionV4 } from '../../src/features/progression/progression';
import { nextFloat, seedRng } from '../../src/engine/rng';

interface Entry { day: number; xp: number; hours: number }

/** The old store and reader (D-48): one entry per day, pruned on write, summed over (today - 365, today]. */
function oldAdd(entries: Entry[], day: number, xp: number, hours: number): Entry[] {
  const kept = entries.filter((w) => w.day > day - PACE_WINDOW_DAYS);
  const last = kept[kept.length - 1];
  if (last && last.day === day) kept[kept.length - 1] = { day, xp: last.xp + xp, hours: last.hours + hours };
  else kept.push({ day, xp, hours });
  return kept;
}
const oldSums = (entries: readonly Entry[], today: number) => {
  const inWin = entries.filter((e) => e.day > today - PACE_WINDOW_DAYS && e.day <= today);
  return { xp: inWin.reduce((a, e) => a + e.xp, 0), hours: inWin.reduce((a, e) => a + e.hours, 0) };
};

/** A life of training days: most days, gaps of a few weeks, a few heavy weeks; BBY days (negative) as in play. */
function stream(seed: string, days: number, start = -1_347_000): Entry[] {
  let rng = seedRng(seed);
  const out: Entry[] = [];
  for (let d = start; d < start + days; d++) {
    let u: number;
    [u, rng] = nextFloat(rng);
    if (u < 0.15) continue;
    const heavy = Math.floor((d - start) / 60) % 5 === 0 ? 2.5 : 1;
    [u, rng] = nextFloat(rng);
    out.push({ day: d, xp: (0.3 + 4 * u) * heavy, hours: (0.5 + 2 * u) * heavy });
  }
  return out;
}

describe('the compact pace window (opt-1 F, D-533)', () => {
  it('reads the old sums within the tolerance on every day of a three-year life', () => {
    for (const seed of ['a', 'b', 'c']) {
      const days = stream(seed, 3 * 368);
      let oldStore: Entry[] = [];
      let store: PaceSkillStore | undefined;
      let worstXp = 0;
      for (const e of days) {
        oldStore = oldAdd(oldStore, e.day, e.xp, e.hours);
        store = addToStore(store, e.day, e.xp, e.hours);
        const a = oldSums(oldStore, e.day);
        const b = windowSums(store, e.day);
        // The tolerance: what the 3 days on either side of the window's oldest edge hold, plus the rounding.
        const edge = days.filter((x) => Math.abs(x.day - (e.day - PACE_WINDOW_DAYS + 0.5)) <= 3.5);
        const bound = (k: 'xp' | 'hours') => edge.reduce((s, x) => s + x[k], 0) + 0.002 * 60;
        expect(Math.abs(a.xp - b.xp), `${seed} day ${e.day} xp`).toBeLessThanOrEqual(bound('xp'));
        expect(Math.abs(a.hours - b.hours), `${seed} day ${e.day} hours`).toBeLessThanOrEqual(bound('hours'));
        worstXp = Math.max(worstXp, Math.abs(a.xp - b.xp) / Math.max(1, a.xp));
      }
      // The edge is at most 3 of 365 days; with this stream's heavy weeks (2.5x) sitting on the edge, up to about 3% of the window's
      // XP on the worst day (measured 3.2% on seed a).
      expect(worstXp, seed).toBeLessThan(0.04);
    }
  });

  it('is exact inside the first year (no edge yet) up to the rounding', () => {
    const days = stream('d', 360);
    let oldStore: Entry[] = [];
    let store: PaceSkillStore | undefined;
    for (const e of days) {
      oldStore = oldAdd(oldStore, e.day, e.xp, e.hours);
      store = addToStore(store, e.day, e.xp, e.hours);
      expect(windowSums(store, e.day).xp).toBeCloseTo(oldSums(oldStore, e.day).xp, 1);
    }
  });

  it('keeps at most 53 week sums and 7 days per skill, at a fixed precision', () => {
    let store: PaceSkillStore | undefined;
    for (const e of stream('e', 5 * 368)) store = addToStore(store, e.day, e.xp, e.hours);
    expect(store!.wx.length).toBeLessThanOrEqual(53);
    expect(store!.dd.length).toBeLessThanOrEqual(PACE_WEEK_DAYS);
    for (const v of [...store!.wx, ...store!.dx]) expect(Math.round(v * 1000) / 1000).toBe(v);
  });

  it('migrates an old save: the daily entries become the store, the sums and the stored hours kept', () => {
    const days = stream('f', 400);
    let oldStore: Entry[] = [];
    for (const e of days) oldStore = oldAdd(oldStore, e.day, e.xp, e.hours);
    const today = days.at(-1)!.day;
    const migrated = migrateProgressionV4({ paceWindow: { soresu: oldStore }, skills: {} } as never);
    const s = migrated.paceWindow['soresu']!;
    expect(Math.abs(windowSums(s, today).xp - oldSums(oldStore, today).xp)).toBeLessThan(0.05 * oldSums(oldStore, today).xp);
    expect(storedHours(s)).toBeCloseTo(oldStore.reduce((a, e) => a + e.hours, 0), 0);
    expect(storeFromEntries([])).toEqual({ w0: 0, wx: [], wh: [], dd: [], dx: [], dh: [] });
  });
});
