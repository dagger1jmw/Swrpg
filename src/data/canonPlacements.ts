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

/** Figures on record at a place who are not in a canon roster. */
const NOT_IN_ROSTER: readonly CanonPlacement[] = [
  { name: 'Overseer Ragate', place: 'Korriban', fromBby: 3681, toBby: 3644, doing: 'an Overseer, keeper of the rite of blood and bone; reopened the Ritual Chambers during the war', source: 'SW_Korriban_Academy_Part1 §B; D-376' },
];

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
