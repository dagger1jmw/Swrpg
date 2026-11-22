// Canon figures whose whereabouts the lore puts on record for a year (D-401 [3], [5]). Only figures placed on record are
// here; everyone else is left to the narrator. They are data, not NPC records: an NPC record means the character has met
// them, so a placed figure becomes an NPC only when the story introduces them. The narrator sees the placed figures of
// the current location (D-401 [4]); an imprisoned figure can be linked to canon when the scene is at the prison (D-401 [5]).
// Years are BBY as positive numbers, both ends inclusive.

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

export const CANON_PLACEMENTS: readonly CanonPlacement[] = [
  { canonId: 'lore:tremel', name: 'Overseer Tremel', place: 'Korriban', fromBby: 3681, toBby: 3644, doing: 'an Overseer at the Sith Academy for decades, administering the trials', source: 'SW_Korriban_Academy_Part1 §B; D-376' },
  { canonId: 'lore:spindrall', name: 'Spindrall', place: 'Korriban', fromBby: 3681, toBby: 3644, doing: "a hermit in Ajunta Pall's tomb", source: 'SW_Korriban_Academy_Part1; D-376' },
  { name: 'Overseer Ragate', place: 'Korriban', fromBby: 3681, toBby: 3644, doing: 'an Overseer, keeper of the rite of blood and bone; reopened the Ritual Chambers during the war', source: 'SW_Korriban_Academy_Part1 §B; D-376' },
  { canonId: 'lore:karagga-the-unyielding', name: 'Karagga the Unyielding', place: 'Nal Hutta', fromBby: 3681, toBby: 3653, doing: 'Supreme Mogul of the Hutt Cartel [inferred], ruling from his palace on Nal Hutta', source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 (entry B: "ruled from a palace on Nal Hutta"); D-385' },
  { canonId: 'lore:ngani-zho', name: 'Ngani Zho', place: 'Monastery', fromBby: 3661, toBby: 3661, doing: 'has brought the young Theron Shan to learn focus from the Order of the Sacred Circle, away from the Order\'s eyes', source: 'Timeline slice Part 1 (c. 3,661); D-379' },
  { canonId: 'lore:theron-shan', name: 'Theron Shan (a child of about 5)', place: 'Monastery', fromBby: 3661, toBby: 3661, doing: "in Ngani Zho's care", source: 'Timeline slice Part 1 (c. 3,661); D-379' },
  // Imprisoned on Belsavis: the Dread Masters, captured in 3,668 and held in the Tomb until the Imperial invasion of 3,641.
  ...(['dread-masters', 'raptus', 'bestia', 'brontes', 'calphayus', 'styrak', 'tyrans'] as const).map((id) => ({
    canonId: `lore:${id}`,
    name: id === 'dread-masters' ? 'the Dread Masters' : `Dread Master ${id[0]!.toUpperCase()}${id.slice(1)}`,
    place: 'Belsavis',
    fromBby: 3668,
    toBby: 3642,
    doing: 'a prisoner in the Tomb, reported dead to the galaxy',
    imprisoned: true,
    source: 'Timeline slice Part 1 (3,668); lore batch 19 status3661 ("prisoner on Belsavis")',
  })),
];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const mentions = (text: string, name: string): boolean => (` ${norm(text)} `).includes(` ${norm(name)} `);

/** The placed figures at any of these place names (a location and its ancestors) in `bby`. */
export function placementsAt(placeNames: readonly string[], bby: number): CanonPlacement[] {
  return CANON_PLACEMENTS.filter((p) => bby <= p.fromBby && bby >= p.toBby && placeNames.some((n) => mentions(n, p.place)));
}
