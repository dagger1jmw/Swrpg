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

export interface CanonStatDeps {
  /** The figure's growth G at a date (BBY): the closed-form main level at its lived age, rank-shaped. */
  growthAt: (bby: number) => number;
  /** The generator's complete line at a date (BBY): archetype and rank at the lived age, no talents. */
  lineAt: (bby: number) => Readonly<Record<string, number>>;
  /** The figure's lived age at a date (BBY), for interpolating when G is flat. */
  livedAgeAt: (bby: number) => number;
  /** The share of its peak the figure's body keeps at a date (D-472); physical stats only, 1 for the rest. */
  retentionAt?: (stat: string, bby: number) => number;
}

const EPS = 1e-9;

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
 * The figure's stats at `bby` from its anchors (D-414). `fixed` figures keep their first complete anchor unchanged
 * (immortal or ancient beings, npc-generation §5).
 */
export function canonLevelsAt(n: CanonNpc, bby: number, deps: CanonStatDeps): Record<string, number> {
  const sheet = n.anchors.find((a) => a.complete);
  if (n.fixed && sheet) return { ...sheet.levels };
  const line = deps.lineAt(bby);
  const gNow = deps.growthAt(bby);
  // Dated events and, for a physical stat, the body's age (the generator's line has its own).
  const factor = (s: string, d: number): number => eventFactor(n, s, d) * (deps.retentionAt?.(s, d) ?? 1);
  const stats = new Set<string>([...Object.keys(line), ...n.anchors.flatMap((a) => Object.keys(a.levels))]);
  const out: Record<string, number> = {};
  for (const s of stats) {
    const base = (line[s] ?? 0) * eventFactor(n, s, bby);
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
      v = gNow * ratio(prev) * factor(s, bby);
    } else {
      // Backward from the nearest later anchor: never below the archetype's baseline for that age.
      v = Math.max(gNow * ratio(next!) * factor(s, bby), base);
    }
    out[s] = Math.max(0, v);
  }
  return out;
}

/**
 * A canon NPC's levels during a campaign (D-414 "when a campaign starts"): the line is calculated once at the start
 * date from the anchors, and from then on it grows by the normal NPC maths (the closed-form growth as of the start,
 * `growthAfterStart`), so the story can change the figure's course. With no start on record, the start is now.
 */
export function canonLevelsInCampaign(start: Readonly<Record<string, number>>, growthAfterStart: (bby: number) => number, startBby: number, nowBby: number, retentionAt: (stat: string, bby: number) => number = () => 1): Record<string, number> {
  if (nowBby === startBby) return { ...start };
  const g0 = growthAfterStart(startBby);
  const r = g0 > EPS ? growthAfterStart(nowBby) / g0 : 1;
  return Object.fromEntries(Object.entries(start).map(([k, v]) => [k, (v * r * retentionAt(k, nowBby)) / Math.max(EPS, retentionAt(k, startBby))]));
}
