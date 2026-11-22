// Canon figures whose whereabouts the lore puts on record for a year (D-401 [3], [5]), sent to the narrator at that place.
// Since the date-agnostic refactor (D-412) these are the roster's `placed` location spans (src/data/canon/era09Timeline.ts)
// plus the few figures on record who are not in a roster. Only placed figures are here; everyone else is left to the
// narrator. They are data, not NPC records: an NPC record means the character has met them, so a placed figure becomes
// an NPC only when the story introduces them. The narrator sees the placed figures of the current location (D-401 [4]);
// an imprisoned figure can be linked to canon when the scene is at the prison (D-401 [5]). Years are BBY as positive
// numbers, both ends inclusive.
import { CANON_NPCS } from './canonNpcs';

export interface CanonPlacement {
  /** The roster entry, when the figure is in a canon roster. */
  canonId?: string;
  /** How the narrator names them. */
  name: string;
  /** The place, matched against location names (as in worldControl.ts). */
  place: string;
  fromBby: number;
  toBby: number;
  /** One short line: what they are doing there. */
  doing: string;
  /** Held there: an NPC linked to them at this place gets the status "imprisoned". */
  imprisoned?: boolean;
  source: string;
}

/** Figures on record at a place who are not in a canon roster (none since Ragate joined the roster, D-421). */
const NOT_IN_ROSTER: readonly CanonPlacement[] = [];

/** Every placement: the roster's placed location spans, then the figures outside the rosters. */
export const CANON_PLACEMENTS: readonly CanonPlacement[] = [
  ...CANON_NPCS.flatMap((n) =>
    (n.locations ?? []).filter((l) => l.placed).map((l) => ({
      canonId: n.canonId,
      name: l.shownAs ?? n.name,
      place: l.place,
      fromBby: l.fromBby,
      toBby: l.toBby ?? n.deathBby ?? -Infinity,
      doing: l.doing,
      ...(l.imprisoned ? { imprisoned: true } : {}),
      source: l.source,
    })),
  ),
  ...NOT_IN_ROSTER,
];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const mentions = (text: string, name: string): boolean => (` ${norm(text)} `).includes(` ${norm(name)} `);

/** The placed figures at any of these place names (a location and its ancestors) in `bby`. */
export function placementsAt(placeNames: readonly string[], bby: number): CanonPlacement[] {
  return CANON_PLACEMENTS.filter((p) => bby <= p.fromBby && bby >= p.toBby && placeNames.some((n) => mentions(n, p.place)));
}

/** One on-record whereabouts line (D-420): a location span, or a dated status fact, covering the year. */
export interface OnRecord {
  canonId: string;
  name: string;
  /** The place, or '' for a status fact that names none. */
  place: string;
  doing: string;
  imprisoned: boolean;
}

const covers = (from: number, to: number | undefined, death: number | undefined, bby: number): boolean => bby <= from && bby >= (to ?? death ?? -Infinity);

/**
 * Every on-record whereabouts at these place names this year (Jared, D-420): any location span of a roster figure that
 * covers the year and names the place, placed or not; any dated status fact of the year whose wording names the place
 * ("recalled to Coruscant over the Hydian blockade"); and the figures outside the rosters. The narrator gets these for
 * the current place; it never gets a full list.
 */
export function onRecordAt(placeNames: readonly string[], bby: number): OnRecord[] {
  const out: OnRecord[] = [];
  for (const n of CANON_NPCS) {
    const spans = (n.locations ?? []).filter((l) => covers(l.fromBby, l.toBby, n.deathBby, bby) && placeNames.some((p) => mentions(p, l.place)));
    for (const l of spans) out.push({ canonId: n.canonId, name: l.shownAs ?? n.name, place: l.place, doing: l.doing, imprisoned: l.imprisoned === true });
    if (spans.length) continue;
    for (const st of n.status ?? []) {
      if (st.kind !== 'active' || !covers(st.fromBby, st.toBby, n.deathBby, bby)) continue;
      const place = placeNames.find((p) => p.trim().length > 2 && mentions(st.note, p));
      if (place) out.push({ canonId: n.canonId, name: n.name, place, doing: st.note, imprisoned: false });
    }
  }
  for (const p of NOT_IN_ROSTER) if (covers(p.fromBby, p.toBby, undefined, bby) && placeNames.some((x) => mentions(x, p.place))) out.push({ canonId: '', name: p.name, place: p.place, doing: p.doing, imprisoned: p.imprisoned === true });
  return out;
}

/** A roster figure's on-record whereabouts this year (D-420: sent when the figure is named): location spans and the year's status facts. */
export function onRecordFor(canonId: string, bby: number): OnRecord[] {
  const n = CANON_NPCS.find((x) => x.canonId === canonId);
  if (!n) return [];
  const spans = (n.locations ?? []).filter((l) => covers(l.fromBby, l.toBby, n.deathBby, bby)).map((l) => ({ canonId: n.canonId, name: l.shownAs ?? n.name, place: l.place, doing: l.doing, imprisoned: l.imprisoned === true }));
  const facts = (n.status ?? []).filter((st) => st.kind === 'active' && covers(st.fromBby, st.toBby, n.deathBby, bby)).map((st) => ({ canonId: n.canonId, name: n.name, place: '', doing: st.note, imprisoned: false }));
  return [...spans, ...facts];
}
