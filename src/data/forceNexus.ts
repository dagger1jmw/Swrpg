// Force-rich worlds and Force nexuses (Jared, D-425; force-reserve.md §9; progression-numbers §21). Two levels:
// planet-level (a whole world: Korriban, Byss, Tython) and site-level (a place within a world: the Valley of the Dark
// Lords, the cave on Dagobah). A site can sit inside a nexus planet and be stronger than the planet around it; a
// Force-rich world without a planet-level nexus can still hold a nexus site. Each nexus has a leaning, tagged with its
// source. Lore basis for the training bonus (Jared): on a Force-rich world you feel the Force more strongly, so you
// progress faster while using it there (Legends: the Je'daii formed on Tython, the Sith train on Korriban, Dagobah is
// Force-rich because it teems with life). Years are calendar years (negative = BBY); absent = every era.

export type NexusLeaning = 'light' | 'dark' | 'balanced';

export interface ForceNexus {
  id: string;
  name: string;
  level: 'planet' | 'site';
  /** The world: the place itself for a planet, the containing world for a site. */
  planet: string;
  /** A planet-level nexus (true) or a Force-rich world without one (false: Dagobah). Sites are nexuses. */
  nexus: boolean;
  leaning: NexusLeaning;
  /** Stronger than the planet around it (a site inside a nexus planet). */
  strongerThanPlanet?: boolean;
  fromYear?: number;
  /** The last year it gives its bonus (absent = no end on record): Malachor V's core imploded in 3951 BBY (D-440). */
  toYear?: number;
  source: string;
}

export const FORCE_NEXUSES: readonly ForceNexus[] = [
  { id: 'tython', name: 'Tython', level: 'planet', planet: 'Tython', nexus: true, leaning: 'balanced', source: 'SW_Legends_Galaxy_Timeline (Dawn of the Jedi: Tython is violently sensitive to Force imbalance; the Je\'daii practised balance there)' },
  { id: 'korriban', name: 'Korriban', level: 'planet', planet: 'Korriban', nexus: true, leaning: 'dark', source: 'SW_DarkSide_Fall_Corruption_Redemption_Part1 (Korriban, and the Valley in particular, became nexuses because Sith Lords were there so long)' },
  { id: 'valley-of-the-dark-lords', name: 'the Valley of the Dark Lords', level: 'site', planet: 'Korriban', nexus: true, leaning: 'dark', strongerThanPlanet: true, source: 'SW_DarkSide_Fall_Corruption_Redemption_Part1 (the Valley in particular)' },
  { id: 'byss', name: 'Byss', level: 'planet', planet: 'Byss', nexus: true, leaning: 'dark', fromYear: -19, source: 'SW_DarkSide_Fall_Corruption_Redemption_Part3 (Byss: a dark-side nexus created by Sidious\'s clones and alchemy; the year is a design default: the Empire\'s era)' },
  { id: 'dromund-kaas', name: 'Dromund Kaas', level: 'planet', planet: 'Dromund Kaas', nexus: true, leaning: 'dark', source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 (the storm-clouded sky from the Emperor\'s dark-side experiments; the dark side emanates from the Citadel)' },
  // D-440: a dark nexus before 3960 BBY, a wound in the Force 3960-3951 (the Trayus Core's upwelling still held), destroyed
  // in 3951 BBY (the core imploded, releasing its energies): no bonus after 3951. Any residual taint is [unclear], a story
  // hazard only (era rule malachor-v-wreckage).
  { id: 'malachor-v', name: 'Malachor V', level: 'planet', planet: 'Malachor V', nexus: true, leaning: 'dark', toYear: -3951, source: 'SW_Malachor_V; SW_Force_Nexus_Vergence (Malachor V, decision 2); D-440' },
  { id: 'vjun', name: 'Vjun', level: 'planet', planet: 'Vjun', nexus: true, leaning: 'dark', fromYear: -29, source: 'SW_DarkSide_Fall_Corruption_Redemption_Part2 (the 29 BBY slaughter made it a nexus)' },
  { id: 'valley-of-the-jedi', name: 'the Valley of the Jedi', level: 'site', planet: 'Ruusan', nexus: true, leaning: 'balanced', fromYear: -1000, source: 'SW_Legends_Galaxy_Timeline (1,000 BBY: a Force nexus where the spirits of the fallen Jedi and Sith are trapped)' },
  { id: 'jedi-temple-coruscant', name: 'the Jedi Temple', level: 'site', planet: 'Coruscant', nexus: true, leaning: 'light', fromYear: -5000, source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (the sacred spire, a Force nexus holy to the native Coruscanti; granted to the Jedi after the Great Hyperspace War); the leaning is not stated [inferred: the Jedi\'s seat]' },
  { id: 'dagobah', name: 'Dagobah', level: 'planet', planet: 'Dagobah', nexus: false, leaning: 'balanced', source: 'Jared, D-425 (Legends: Force-rich because it teems with life; Yoda\'s exile); not in the lore files yet (research queue)' },
  { id: 'dagobah-cave', name: 'the cave on Dagobah', level: 'site', planet: 'Dagobah', nexus: true, leaning: 'dark', source: 'Jared, D-425 (Legends: the dark-side cave of The Empire Strikes Back); not in the lore files yet (research queue)' },
];

const norm = (x: string): string => ` ${x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const inEra = (n: ForceNexus, year: number | undefined): boolean => year === undefined || ((n.fromYear === undefined || year >= n.fromYear) && (n.toYear === undefined || year <= n.toYear));

/**
 * The Force-rich world here (D-425): a planet-level nexus or a Force-rich world among these place names (a location
 * and its ancestors), in the year. Sites: nexusSitesAt; the bonus with both levels and the leaning is forceBonusAt (D-432).
 */
export function forceRichWorldAt(placeNames: readonly string[], year?: number): ForceNexus | null {
  return FORCE_NEXUSES.find((n) => n.level === 'planet' && inEra(n, year) && placeNames.some((p) => norm(p).includes(norm(n.planet)))) ?? null;
}

/** The nexus sites among these place names. */
export function nexusSitesAt(placeNames: readonly string[], year?: number): ForceNexus[] {
  return FORCE_NEXUSES.filter((n) => n.level === 'site' && inEra(n, year) && placeNames.some((p) => norm(p).includes(norm(n.name.replace(/^the /, '')))));
}

/** Whether a place's leaning gives a character of this leaning its bonus (D-432): the same leaning, or a balanced place. */
export const leaningMatches = (place: NexusLeaning, character: NexusLeaning): boolean => place === 'balanced' || place === character;

/**
 * The Force-skill training bonus here (D-432, Jared): a Force-rich world or nexus planet x`world`, a nexus site x`site`;
 * no stacking (the stronger of the site and its planet wins); only where the place's leaning matches the character's or
 * is balanced (a mismatched leaning gives no bonus for now; alignment effects come later).
 */
export function forceBonusAt(placeNames: readonly string[], year: number | undefined, leaning: NexusLeaning, factors: { world: number; site: number }): { nexus: ForceNexus; factor: number } | null {
  const world = forceRichWorldAt(placeNames, year);
  const options = [...(world ? [{ nexus: world, factor: factors.world }] : []), ...nexusSitesAt(placeNames, year).map((n) => ({ nexus: n, factor: factors.site }))];
  return options.filter((o) => leaningMatches(o.nexus.leaning, leaning)).sort((a, b) => b.factor - a.factor)[0] ?? null;
}
