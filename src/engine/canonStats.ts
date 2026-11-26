// The canon NPC stat model (date-agnostic refactor, D-414; docs-v2/spec/date-agnostic-refactor.md §2). Pure.
//
// A figure's stats at any date come from its anchors (src/data/canon/types.ts StatAnchor): complete anchors set every
// stat at a dated source, partial anchors only the stats a source shows. Each stat uses its nearest relevant anchor and
// is carried to the date along the figure's growth curve G (the closed-form main level for its archetype, shaped by its
// rank spans, at its lived age). Between two anchors for the same stat the stat's ratio to G is interpolated in growth
// space, so the curve passes through both. Going backward from an anchor the stat is clamped at the archetype's
// baseline for that age (the generator's line). Dated events (an injury, a lost limb) multiply the stats they name from
// their date on; an anchor after an event already includes it. A physical stat also keeps only what the body's age leaves
// (D-472), measured from its anchor's date. Stasis years count toward neither age nor growth (the
// callers measure age as lived age). A figure with no anchor for a stat takes the generator's line.
import type { CanonNpc, StatAnchor } from '../data/canon/types';
import { PAST_SHEET } from '../data/canon/growthCap';
import { FORM_IDS } from '../data/skills';

export interface CanonStatDeps {
  /** The figure's growth G at a date (BBY): the closed-form main level at its lived age, rank-shaped. */
  growthAt: (bby: number) => number;
  /** The generator's complete line at a date (BBY): archetype and rank at the lived age, no talents. */
  lineAt: (bby: number) => Readonly<Record<string, number>>;
  /** The figure's lived age at a date (BBY), for interpolating when G is flat. */
  livedAgeAt: (bby: number) => number;
  /** The share of its peak the figure's body keeps at a date (D-472); physical stats only, 1 for the rest. */
  retentionAt?: (stat: string, bby: number) => number;
  /**
   * The cap past a figure's last sheet (D-503, D-504): for a sheet at a date, from when it counts (the sheet, or when a Padawan
   * or an apprentice became a full member) and the most a stat gains. Absent = no cap.
   */
  pastSheet?: (sheetBby: number) => { from: number; most: number };
  /** The body's cap for a physical stat at a date (D-494): the figure's species and body age. Absent = no cap. */
  capAt?: (stat: string, bby: number) => number | null;
}

const EPS = 1e-9;

/** What a stat may have gained so many years past its last sheet: front-loaded, then it holds (D-503). */
export const pastSheetGain = (years: number, most: number = PAST_SHEET.most): number => most * (1 - (1 - Math.min(1, Math.max(0, years) / PAST_SHEET.years)) ** 2);

/** The cap on a stat's growth: by its last sheet (an unlisted stat: the last complete one). */
function capOf(n: Pick<CanonNpc, 'anchors'>, stat: string, deps: Pick<CanonStatDeps, 'pastSheet'>): { from: number; most: number } | null {
  const own = n.anchors.filter((a) => a.levels[stat] !== undefined);
  const list = own.length ? own : n.anchors.filter((a) => a.complete);
  return list.length && deps.pastSheet ? deps.pastSheet(Math.min(...list.map((a) => a.bby))) : null;
}

/** The generator's line as a sheeted figure takes it: past its last sheet it rises no further than the cap. */
function cappedLine(n: CanonNpc, bby: number, deps: CanonStatDeps): Readonly<Record<string, number>> {
  const line = deps.lineAt(bby);
  if (!deps.pastSheet || !n.anchors.some((a) => a.complete)) return line;
  const at = new Map<number, Readonly<Record<string, number>>>();
  return Object.fromEntries(
    Object.entries(line).map(([s, v]) => {
      const cap = capOf(n, s, deps);
      if (!cap || bby >= cap.from) return [s, v];
      if (!at.has(cap.from)) at.set(cap.from, deps.lineAt(cap.from));
      return [s, Math.min(v, (at.get(cap.from)![s] ?? 0) + pastSheetGain(cap.from - bby, cap.most))];
    }),
  );
}

/** The product of the event factors for `stat` from events on or before `bby` (an event's year counts). */
export function eventFactor(n: CanonNpc, stat: string, bby: number): number {
  let f = 1;
  for (const e of n.events ?? []) if (e.bby >= bby) f *= e.factors?.[stat] ?? 1;
  return f;
}

/** The anchors that show `stat`, oldest first. */
function anchorsFor(n: CanonNpc, stat: string): StatAnchor[] {
  return n.anchors.filter((a) => a.levels[stat] !== undefined).sort((a, b) => b.bby - a.bby);
}

/**
 * The floor of a stat at a date (Jared, D-494, D-495): what the game would generate for the archetype, rank and age, but
 * never above what the sheet sets (the nearest sheet that has the stat). A stat the sheet leaves unset has the plain floor.
 */
function floorAt(n: CanonNpc, stat: string, bby: number, line: Readonly<Record<string, number>>): number {
  const set = n.anchors
    .filter((a) => a.complete && (a.authored ?? a.levels)[stat] !== undefined)
    .sort((a, b) => Math.abs(a.bby - bby) - Math.abs(b.bby - bby))[0];
  return Math.min(line[stat] ?? 0, set ? (set.authored ?? set.levels)[stat]! : Infinity) * eventFactor(n, stat, bby);
}

/**
 * The floor and the body's cap (Jared, D-494, D-495). No physical stat is above what the species' body can hold. A
 * figure's main form stays its best: a form its sheet does not have is held just under it.
 */
function floored(n: CanonNpc, bby: number, levels: Readonly<Record<string, number>>, line: Readonly<Record<string, number>>, deps: CanonStatDeps): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of new Set([...Object.keys(levels), ...Object.keys(line)])) {
    const cap = deps.capAt?.(s, bby) ?? null;
    const v = levels[s] ?? (line[s] ?? 0) * eventFactor(n, s, bby);
    out[s] = Math.max(cap === null ? v : Math.min(v, cap), floorAt(n, s, bby, line));
  }
  const fights = FORM_IDS.filter((f) => f !== 'jarKai');
  // The sheet's own order settles a tie.
  const listed = [...new Set(n.anchors.flatMap((a) => Object.keys(a.levels)))].filter((f) => fights.includes(f));
  const written = (f: string): number => Math.max(0, ...n.anchors.map((a) => (a.authored ?? a.levels)[f] ?? 0));
  const own = [...listed].sort((a, b) => written(b) - written(a))[0];
  if (own) for (const f of fights) if (f !== own && (out[f] ?? 0) >= out[own]!) out[f] = Math.max(0, out[own]! - OWN_FORM_EDGE);
  return out;
}
/** A figure's own form over any other (invented): enough to be the one it fights with. */
const OWN_FORM_EDGE = 0.1;

/** A stat's level past its last anchor, its events and the body's age taken out: the curve's growth, held by the cap (D-503). */
function capped(n: CanonNpc, stat: string, bby: number, sheet: number, sheetBby: number, deps: CanonStatDeps): number {
  const g0 = Math.max(EPS, deps.growthAt(sheetBby));
  const grown = (d: number): number => (sheet * deps.growthAt(d)) / g0;
  const cap = capOf(n, stat, deps);
  return !cap || bby >= cap.from ? grown(bby) : Math.min(grown(bby), grown(cap.from) + pastSheetGain(cap.from - bby, cap.most));
}

/**
 * The figure's stats at `bby` from its anchors (D-414). `fixed` figures keep their first complete anchor unchanged
 * (immortal or ancient beings, npc-generation §5).
 */
export function canonLevelsAt(n: CanonNpc, bby: number, deps: CanonStatDeps): Record<string, number> {
  const sheet = n.anchors.find((a) => a.complete);
  if (n.fixed && sheet) return floored(n, bby, sheet.levels, deps.lineAt(bby), deps);
  const line = cappedLine(n, bby, deps);
  const gNow = deps.growthAt(bby);
  // Dated events and, for a physical stat, the body's age (the generator's line has its own).
  const factor = (s: string, d: number): number => eventFactor(n, s, d) * (deps.retentionAt?.(s, d) ?? 1);
  const stats = new Set<string>([...Object.keys(line), ...n.anchors.flatMap((a) => Object.keys(a.levels))]);
  const out: Record<string, number> = {};
  for (const s of stats) {
    // A skill left behind (D-516): its value on the day the career ended, and no growth after it.
    const hold = (n.holds ?? []).find((h) => h.stats.includes(s) && bby < h.fromBby);
    if (hold) {
      out[s] = canonLevelsAt({ ...n, holds: (n.holds ?? []).filter((h) => h !== hold) }, hold.fromBby, deps)[s] ?? 0;
      continue;
    }
    const base = floorAt(n, s, bby, line);
    const list = anchorsFor(n, s);
    if (!list.length) {
      out[s] = base;
      continue;
    }
    // Anchor values with their events taken out, as ratios to G at the anchor.
    const ratio = (a: StatAnchor) => a.levels[s]! / Math.max(EPS, factor(s, a.bby)) / Math.max(EPS, deps.growthAt(a.bby));
    const before = list.filter((a) => a.bby >= bby); // anchors at or before the date
    const after = list.filter((a) => a.bby < bby); // anchors later than the date
    const prev = before[before.length - 1];
    const next = after[0];
    let v: number;
    if (prev && next) {
      const g0 = deps.growthAt(prev.bby);
      const g1 = deps.growthAt(next.bby);
      const t = Math.abs(g1 - g0) > EPS ? (gNow - g0) / (g1 - g0) : (deps.livedAgeAt(bby) - deps.livedAgeAt(prev.bby)) / Math.max(EPS, deps.livedAgeAt(next.bby) - deps.livedAgeAt(prev.bby));
      const r = ratio(prev) + Math.min(1, Math.max(0, t)) * (ratio(next) - ratio(prev));
      v = gNow * r * factor(s, bby);
    } else if (prev) {
      v = capped(n, s, bby, prev.levels[s]! / Math.max(EPS, factor(s, prev.bby)), prev.bby, deps) * factor(s, bby);
    } else {
      // Backward from the nearest later anchor: never below the archetype's baseline for that age.
      v = Math.max(gNow * ratio(next!) * factor(s, bby), base);
    }
    // At an anchor the curve gives back the anchor: no rounding error either side of a tier's line.
    out[s] = Math.max(0, Math.round(v * 1e9) / 1e9);
  }
  return n.anchors.length ? floored(n, bby, out, line, deps) : out;
}

/**
 * A canon figure that has left its canon course (D-419; D-504): it grows from what it was on that day by the growth its own
 * ranks by then give it. It never passes its canon course by more than its own growth passes the canon one, so someone barely
 * trained that day is never multiplied up. A figure on its course needs none of this: it is the same in every campaign.
 */
export function canonLevelsDiverged(atDivergence: Readonly<Record<string, number>>, onCourse: Readonly<Record<string, number>>, courseGrowth: (bby: number) => number, growthAfter: (bby: number) => number, divergedBby: number, nowBby: number, retentionAt: (stat: string, bby: number) => number = () => 1): Record<string, number> {
  if (nowBby >= divergedBby) return { ...onCourse };
  const g0 = growthAfter(divergedBby);
  const r = g0 > EPS ? growthAfter(nowBby) / g0 : 1;
  const own = Math.max(1, growthAfter(nowBby) / Math.max(EPS, courseGrowth(nowBby)));
  return Object.fromEntries(
    Object.entries(atDivergence).map(([k, v]) => {
      const aged = (v * retentionAt(k, nowBby)) / Math.max(EPS, retentionAt(k, divergedBby));
      return [k, Math.min(aged * r, Math.max(aged, (onCourse[k] ?? 0) * own))];
    }),
  );
}
