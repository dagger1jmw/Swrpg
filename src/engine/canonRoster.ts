// Who of the canon rosters is present at a campaign date, and as what (npc-generation.md §5; D-155; date-agnostic since
// D-412). Pure. Years are BBY as positive numbers (a campaign year y < 0 is |y| BBY; ABY years are negative BBY here).
// Everything here is calculated from the figure's dated spans at the date asked: rank and role, side, status, location
// and age. A figure is present in a year when born by then, not dead before it (the death year itself counts: the
// figure lives part of it), not off the board by a status span, and old enough for the role held then.
import { CANON_NPCS, type CanonNpc } from '../data/canonNpcs';
import type { CanonSpan, LocationSpan, RankSpan, StatusKind, StatusSpan } from '../data/canon/types';
import type { FactionId, NpcRole } from '../data/entities.config';
import { ROLE_MIN_AGE } from '../data/npcGen.config';
import { CANON_PLACEMENTS, type CanonPlacement } from '../data/canonPlacements';

/** Campaign calendar year (negative = BBY) to BBY. */
export const toBby = (year: number): number => -year;

/** Whether a span covers `bby` (an open end runs to the figure's death, or on). */
export function spanCovers(s: CanonSpan, bby: number, deathBby?: number): boolean {
  return bby <= s.fromBby && bby >= (s.toBby ?? deathBby ?? -Infinity);
}

/**
 * The rank, role or office held at `bby`: the latest-starting span that covers it, and of two starting together the
 * shorter (an office inside a rank wins).
 */
export function canonRankAt(n: CanonNpc, bby: number): RankSpan | null {
  const len = (r: RankSpan) => r.fromBby - (r.toBby ?? n.deathBby ?? -Infinity);
  let best: RankSpan | null = null;
  for (const r of n.ranks) if (spanCovers(r, bby, n.deathBby) && (!best || r.fromBby < best.fromBby || (r.fromBby === best.fromBby && len(r) < len(best)))) best = r;
  return best;
}

/** The role at `bby`; before the first rank span (a child), 'civilian'. */
export function canonRoleAt(n: CanonNpc, bby: number): NpcRole {
  return canonRankAt(n, bby)?.role ?? 'civilian';
}

const JEDI_ROLES: readonly string[] = ['initiate', 'padawan', 'jediKnight', 'jediMaster'];
const DARK_ROLES: readonly string[] = ['sithLord', 'sithAcolyte', 'darkJedi', 'darkAcolyte', 'inquisitor'];
/**
 * When a figure who was a Jedi fell, BBY (Jared, D-503): its dated fall, else its first dark rank after a Jedi one. Null: no
 * Jedi before it, or no fall.
 */
export function canonFallBby(n: Pick<CanonNpc, 'ranks' | 'events'>): number | null {
  const jedi = n.ranks.filter((r) => JEDI_ROLES.includes(r.role)).map((r) => r.fromBby);
  if (!jedi.length) return null;
  const first = Math.max(...jedi);
  const fall = (n.events ?? []).filter((e) => e.kind === 'fall' && e.bby <= first).map((e) => e.bby);
  if (fall.length) return Math.max(...fall);
  const dark = n.ranks.filter((r) => DARK_ROLES.includes(r.role) && r.fromBby < first).map((r) => r.fromBby);
  return dark.length && !n.ranks.some((r) => DARK_ROLES.includes(r.role) && r.fromBby >= first) ? Math.max(...dark) : null;
}

/** The side served at `bby`: the rank span's, else the entry's. */
export function canonFactionAt(n: CanonNpc, bby: number): FactionId {
  return canonRankAt(n, bby)?.faction ?? n.faction;
}

/** How strongly a status keeps a figure off the board (the strongest covering span wins). */
const STATUS_WEIGHT: Readonly<Record<StatusKind, number>> = { imprisoned: 6, stasis: 5, captured: 4, missing: 3, offRecord: 2, exiled: 1, active: 0 };

/** The status at `bby` other than 'active' (the strongest covering span), or null. */
export function canonStatusAt(n: CanonNpc, bby: number): StatusSpan | null {
  let best: StatusSpan | null = null;
  for (const s of n.status ?? []) if (s.kind !== 'active' && spanCovers(s, bby, n.deathBby) && (!best || STATUS_WEIGHT[s.kind] > STATUS_WEIGHT[best.kind])) best = s;
  return best;
}

/** The status facts on record for `bby` (including 'active' ones), for the narrator and tools. */
export function canonStatusFactsAt(n: CanonNpc, bby: number): StatusSpan[] {
  return (n.status ?? []).filter((s) => spanCovers(s, bby, n.deathBby));
}

/** Where the lore puts the figure in `bby`. */
export function canonLocationsAt(n: CanonNpc, bby: number): LocationSpan[] {
  return (n.locations ?? []).filter((l) => spanCovers(l, bby, n.deathBby));
}

export function canonAgeAt(n: CanonNpc, bby: number): number {
  return n.birthBby - bby;
}

/** Years spent in stasis between birth and `bby` (a figure doesn't age or train in stasis; D-414). */
export function canonStasisYears(n: CanonNpc, bby: number): number {
  let years = 0;
  for (const s of n.status ?? []) {
    if (s.kind !== 'stasis') continue;
    const from = Math.min(s.fromBby, n.birthBby);
    const to = Math.max(s.toBby ?? bby, bby);
    if (to <= from) years += from - to;
  }
  return years;
}

/** The figure's lived age at `bby`: calendar age less the years in stasis. */
export function canonLivedAgeAt(n: CanonNpc, bby: number): number {
  return Math.max(0, canonAgeAt(n, bby) - canonStasisYears(n, bby));
}

export type Absence = 'unborn' | 'dead' | 'unavailable' | 'tooYoung';

/** Null when present; otherwise why not. */
export function canonAbsence(n: CanonNpc, bby: number): Absence | null {
  const off = canonOffBoard(n, bby);
  if (off === 'unborn' || off === 'dead') return off;
  if (off) return 'unavailable';
  // Present means present in a role: a child before their first rank span (or too young for it) is not.
  const rank = canonRankAt(n, bby);
  if (!rank || canonAgeAt(n, bby) < (ROLE_MIN_AGE[rank.role] ?? 0)) return 'tooYoung';
  return null;
}

export function canonPresentAt(bby: number, roster: readonly CanonNpc[] = CANON_NPCS): CanonNpc[] {
  return roster.filter((n) => canonAbsence(n, bby) === null);
}

// ---- Who is on the board (M7; D-400; from the spans since D-412) ----

/** Why a canon figure is off the board at a date. Children are on the board (as children), so 'tooYoung' is not here. */
export type OffBoard = 'unborn' | 'dead' | 'unavailable' | 'imprisoned';

/**
 * Null when the figure can be on the board in `bby`; otherwise why not: unborn, dead, imprisoned (a prison span), or
 * unavailable (in stasis, missing, captured, or off the record). An exiled figure stays on the board. A child is on the
 * board as a child.
 */
export function canonOffBoard(n: CanonNpc, bby: number): OffBoard | null {
  if (bby > n.birthBby) return 'unborn';
  if (n.deathBby !== undefined && bby < n.deathBby) return 'dead';
  const s = canonStatusAt(n, bby);
  if (!s || s.kind === 'exiled') return null;
  return s.kind === 'imprisoned' ? 'imprisoned' : 'unavailable';
}

const living = new WeakMap<CanonNpc, CanonNpc>();
/**
 * The figure without the death on record (D-467: the event that causes it diverged in this campaign, or the campaign's own
 * NPC has outlived it): whatever they held at their death they still hold.
 */
export function withoutDeath(n: CanonNpc): CanonNpc {
  if (n.deathBby === undefined) return n;
  const hit = living.get(n);
  if (hit) return hit;
  const { deathBby, deathSource: _s, ...rest } = n;
  const open = <T extends CanonSpan>(spans: readonly T[]): T[] => spans.map((x) => (x.toBby === deathBby ? { ...x, toBby: undefined } : x));
  const out: CanonNpc = { ...rest, ranks: open(n.ranks), ...(n.status ? { status: open(n.status) } : {}) };
  living.set(n, out);
  return out;
}

/** Where the lore holds a figure prisoner in `bby` (a location span marked imprisoned), or null. */
export function prisonOf(canonId: string, bby: number): CanonPlacement | null {
  return CANON_PLACEMENTS.find((p) => p.imprisoned && p.canonId === canonId && bby <= p.fromBby && bby >= p.toBby) ?? null;
}

/** The canon figures on the board at a date (bby), each entry once (the first era file wins, as in CANON_BY_ID). */
export function canonBoardAt(bby: number, roster: readonly CanonNpc[] = CANON_NPCS): CanonNpc[] {
  const seen = new Set<string>();
  return roster.filter((n) => {
    if (seen.has(n.canonId) || canonOffBoard(n, bby) !== null) return false;
    seen.add(n.canonId);
    return true;
  });
}
