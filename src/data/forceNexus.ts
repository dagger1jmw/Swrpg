// Force-rich worlds and Force nexuses (Jared, D-425; force-reserve.md §9; progression-numbers §21). Two levels:
// planet-level (a whole world: Korriban, Byss, Tython) and site-level (a place within a world: the Valley of the Dark
// Lords, the cave on Dagobah). A site can sit inside a nexus planet and be stronger than the planet around it; a
// Force-rich world without a planet-level nexus can still hold a nexus site. Each nexus has a leaning, tagged with its
// source. Lore basis for the training bonus (Jared): on a Force-rich world you feel the Force more strongly, so you
// progress faster while using it there (Legends: the Je'daii formed on Tython, the Sith train on Korriban). Three tiers
// (D-451, Jared): a major nexus planet (Tython, Korriban, Dromund Kaas) x1.15, an ordinary nexus or Force-rich planet
// x1.10, a site x1.15; the stronger wins, no stacking. Mortis is story-only: no multiplier and no map access. Years are
// calendar years (negative = BBY); absent = every era.

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
  /** Stronger than the planet around it (a site inside an ordinary nexus planet; D-451: a site inside a major one equals it). */
  strongerThanPlanet?: boolean;
  /** A major nexus planet (D-451: Tython, Korriban, Dromund Kaas), x1.15 instead of the ordinary x1.10. */
  major?: boolean;
  /** Story only (D-451: Mortis): no training multiplier, never a place on the map. */
  storyOnly?: boolean;
  fromYear?: number;
  /** The last year it gives its bonus (absent = no end on record): Malachor V's core imploded in 3951 BBY (D-440). */
  toYear?: number;
  source: string;
}

export const FORCE_NEXUSES: readonly ForceNexus[] = [
  { id: 'tython', name: 'Tython', level: 'planet', planet: 'Tython', nexus: true, major: true, leaning: 'balanced', source: 'SW_Timeline_36453_5001BBY_Part1 (Dawn of the Jedi: Tython is violently sensitive to Force imbalance; the Je\'daii practised balance there)' },
  { id: 'korriban', name: 'Korriban', level: 'planet', planet: 'Korriban', nexus: true, major: true, leaning: 'dark', source: 'SW_DarkSide_Fall_Corruption_Redemption_Part1 (Korriban, and the Valley in particular, became nexuses because Sith Lords were there so long)' },
  { id: 'valley-of-the-dark-lords', name: 'the Valley of the Dark Lords', level: 'site', planet: 'Korriban', nexus: true, leaning: 'dark', source: 'SW_DarkSide_Fall_Corruption_Redemption_Part1 (the Valley in particular); D-451: equals its major planet (x1.15)' },
  { id: 'byss', name: 'Byss', level: 'planet', planet: 'Byss', nexus: true, leaning: 'dark', fromYear: -19, source: 'SW_DarkSide_Fall_Corruption_Redemption_Part3 (Byss: a dark-side nexus created by Sidious\'s clones and alchemy; the year is a design default: the Empire\'s era)' },
  { id: 'dromund-kaas', name: 'Dromund Kaas', level: 'planet', planet: 'Dromund Kaas', nexus: true, major: true, leaning: 'dark', source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 (the storm-clouded sky from the Emperor\'s dark-side experiments; the dark side emanates from the Citadel)' },
  // D-451: the Emperor's expansion after 4980 BBY made the Dark Temple a dark nexus (the year is the expansion's earliest);
  // a site equal to its major planet (x1.15). Sealed c. 4606-3643 BBY: a story fact, not a bonus rule.
  { id: 'dark-temple', name: 'the Dark Temple', level: 'site', planet: 'Dromund Kaas', nexus: true, leaning: 'dark', fromYear: -4980, source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 (Dark Temple: the Emperor\'s experiments and entombments turned it into a dark-side nexus); D-451' },
  // D-440: a dark nexus before 3960 BBY, a wound in the Force 3960-3951 (the Trayus Core's upwelling still held), destroyed
  // in 3951 BBY (the core imploded, releasing its energies): no bonus after 3951. Any residual taint is [unclear], a story
  // hazard only (era rule malachor-v-wreckage).
  { id: 'malachor-v', name: 'Malachor V', level: 'planet', planet: 'Malachor V', nexus: true, leaning: 'dark', toYear: -3951, source: 'SW_Malachor_V; SW_Force_Nexus_Vergence (Malachor V, decision 2); D-440' },
  { id: 'vjun', name: 'Vjun', level: 'planet', planet: 'Vjun', nexus: true, leaning: 'dark', fromYear: -29, source: 'SW_DarkSide_Fall_Corruption_Redemption_Part2 (the 29 BBY slaughter made it a nexus)' },
  { id: 'valley-of-the-jedi', name: 'the Valley of the Jedi', level: 'site', planet: 'Ruusan', nexus: true, leaning: 'balanced', fromYear: -1000, source: 'SW_Timeline_2000_1000BBY_Part2 (1,000 BBY: a Force nexus where the spirits of the fallen Jedi and Sith are trapped)' },
  { id: 'jedi-temple-coruscant', name: 'the Jedi Temple', level: 'site', planet: 'Coruscant', nexus: true, leaning: 'light', fromYear: -5000, source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (the sacred spire, a Force nexus holy to the native Coruscanti; granted to the Jedi after the Great Hyperspace War); the leaning is not stated [inferred: the Jedi\'s seat]' },
  // D-445: re-read against SW_Dagobah. The Force-rich status rests on Jared's ruling (Nov 22, 2026); the "because it teems
  // with life" wording is Canon (The Clone Wars "Lost Missions", 2014), not Legends, so it is no longer cited here.
  { id: 'dagobah', name: 'Dagobah', level: 'planet', planet: 'Dagobah', nexus: false, leaning: 'balanced', source: 'SW_Dagobah (ruling, Jared, Nov 22, 2026: apart from the cave, an extremely Force-rich world); D-425' },
  // D-445: the cave formed about 700 BBY, when a Jedi killed a Bpfasshi Dark Jedi there (SW_Dagobah); not a dark nexus before.
  { id: 'dagobah-cave', name: 'the cave on Dagobah', level: 'site', planet: 'Dagobah', nexus: true, leaning: 'dark', fromYear: -700, source: 'SW_Dagobah (the Dark Side Cave formed around 700 BBY); Jared, D-425' },
  // D-451 (Jared): Mortis is a special exception: story only, no multiplier, no map access (it is not on the galaxy map).
  // The Mortis arc is 2008 The Clone Wars material (SW_Characters_12_CloneWars: "borderline Legends").
  { id: 'mortis', name: 'Mortis', level: 'planet', planet: 'Mortis', nexus: true, leaning: 'balanced', storyOnly: true, source: 'SW_Characters_12_CloneWars (the Force-vergence realm of Mortis); D-451' },
];

const norm = (x: string): string => ` ${x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const inEra = (n: ForceNexus, year: number | undefined): boolean => !n.storyOnly && (year === undefined || ((n.fromYear === undefined || year >= n.fromYear) && (n.toYear === undefined || year <= n.toYear)));

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
 * The Force-skill training bonus here (D-432, Jared; D-451 tiers): a Force-rich world or ordinary nexus planet x`world`,
 * a major nexus planet x`major`, a nexus site x`site`; no stacking (the stronger of the site and its planet wins); only
 * where the place's leaning matches the character's or is balanced (a mismatched leaning gives no bonus for now;
 * alignment effects come later). A story-only nexus (Mortis) never gives one.
 */
export function forceBonusAt(placeNames: readonly string[], year: number | undefined, leaning: NexusLeaning, factors: { world: number; major: number; site: number }): { nexus: ForceNexus; factor: number } | null {
  const world = forceRichWorldAt(placeNames, year);
  const options = [...(world ? [{ nexus: world, factor: world.major ? factors.major : factors.world }] : []), ...nexusSitesAt(placeNames, year).map((n) => ({ nexus: n, factor: factors.site }))];
  return options.filter((o) => leaningMatches(o.nexus.leaning, leaning)).sort((a, b) => b.factor - a.factor)[0] ?? null;
}
