// Species table (spec/species.md, D-103; lore batch 21, D-399). Legends only.
// Ages (D-472): `maturity` is the age of adulthood (Human-equivalent 18), `prime` the body's peak (Human-equivalent 30) and
// `lifespan` the end of a full life (Human-equivalent 100), joined by straight lines; engine/species.ts rescales every Human
// table by them. Each carries a source tag (ageSource): 'lore' (a novel, comic, game text or codex), 'game stat' (an RPG
// sourcebook; UAA = Ultimate Alien Anthology) or 'invented' (our choice: the Human bands for species with no source,
// D-399 [2]; was 'house default'). A prime with no source sits at the same share of adult life as a Human's 30. Where lore and a
// game book disagree, lore wins. From the bands in SW_Species_OldRepublic_Part1-3: `lifespan` is the stated average
// lifespan when lore gives one, else the game book's venerable age or stated maximum, else the Human 100.
// Traits are design (species.md §3): a body-cap bonus on a physical stat (max +20), a learning factor on one category,
// skill or ability side (x0.9..x1.1), a contest modifier, or a story rule. The species added in lore batch 21 have theirs in
// speciesTraits.ts (D-473), with their body scale by lore height.

import { FULL_LIFE_H, PRIME_H } from './ageing.config';
import type { PhysicalStat } from './skills';
import { HUMAN_HEIGHT, SPECIES_HEIGHT, traitCapBonus } from './speciesTraits';

export type LearningTarget =
  | { kind: 'skill'; skill: string }
  | { kind: 'category'; category: string }
  /** Every Force ability with this side tag (sith_pureblood: dark-tagged abilities). */
  | { kind: 'side'; side: 'dark' | 'light' };

export interface LearningFactor {
  target: LearningTarget;
  factor: number;
}

/** Where an ageing number comes from (lore batch 21, D-399). */
export type AgeTag = 'lore' | 'game stat' | 'invented';

export interface AgeSource {
  lifespan: AgeTag;
  maturity: AgeTag;
  /** Absent = 'invented'. */
  prime?: AgeTag;
  /** What the numbers rest on, citing the species file. */
  basis: string;
  /** Infobox ages whose sources could not be checked (D-399 [19]). */
  unverified?: boolean;
}

export interface SpeciesDef {
  id: string;
  name: string;
  lifespan: number;
  /** Adult (Human-equivalent 18). */
  maturity: number;
  /** The body's peak (Human-equivalent 30); the decline counts from here. Absent = defaultPrime. */
  prime?: number;
  /** The lifespan comes from Jedi alone (Yoda's species), so the Force's stretch is already in it. */
  lifespanIncludesForce?: true;
  ageSource: AgeSource;
  bodyScale: number;
  /** Scales the Agility ceiling alone (D-473); absent = bodyScale. */
  agilityScale?: number;
  /** Where a non-1.0 body scale comes from (D-401 [12]; lore heights since D-473). */
  bodyScaleSource?: AgeTag;
  capBonus: Partial<Record<PhysicalStat, number>>;
  learning: readonly LearningFactor[];
  /** Story and contest rules the engine does not compute yet, shown on the sheet. */
  notes: readonly string[];
  /** Signs of age the narrator may use (D-399 [8]); flavour, not mechanics. */
  ageingSigns?: readonly { text: string; tag: AgeTag }[];
  /** Factions that may play this species (species.md §4); absent = any. */
  factions?: readonly string[];
  /** Offered at character creation (D-399 [20]); NPC-only species are still in the table for NPC ageing. */
  playable: boolean;
  /**
   * Era gate (D-399 [21]): the species' people are known to the galaxy only from this year (negative = BBY), so it is
   * offered only for starts on or after it. Absent = known throughout.
   */
  knownFrom?: number;
  /** Trait source: a line or "design". */
  source: string;
}

const DESIGN = 'design (species.md §2)';
const TRAITS = 'speciesTraits.ts (the lore traits and heights; D-473)';
const P1 = 'SW_Species_OldRepublic_Part1';
const P2 = 'SW_Species_OldRepublic_Part2';
const HUMAN_BANDS = 'no lifespan source: the Human bands as an invented default (D-399 [2])';
const HD: AgeSource = { lifespan: 'invented', maturity: 'invented', basis: HUMAN_BANDS };

/** A species of lore batch 21: traits, ceilings and body scale from speciesTraits.ts (D-473). */
function plain(id: string, name: string, lifespan: number, maturity: number, ageSource: AgeSource, extra: Partial<SpeciesDef> = {}): SpeciesDef {
  const height = SPECIES_HEIGHT[id];
  const scale = height ? { bodyScale: Math.round((height.m / HUMAN_HEIGHT) * 100) / 100, bodyScaleSource: height.tag } : { bodyScale: 1.0 };
  return { id, name, lifespan, maturity, ageSource, ...scale, agilityScale: 1, capBonus: traitCapBonus(id), learning: [], notes: [], playable: true, source: TRAITS, ...extra };
}
const gs = (basis: string, maturity: AgeTag = 'invented', unverified = false): AgeSource => ({ lifespan: 'game stat', maturity, basis, ...(unverified ? { unverified } : {}) });

export const SPECIES: readonly SpeciesDef[] = [
  {
    id: 'human',
    name: 'Human',
    lifespan: 100,
    maturity: 18,
    ageSource: { lifespan: 'game stat', maturity: 'invented', basis: `average 100–120 (Saga Edition Core Rulebook); adulthood set by culture (${P1}, Human)` },
    bodyScale: 1.0,
    capBonus: {},
    learning: [],
    notes: [],
    playable: true,
    source: 'baseline (progression-numbers §11)',
  },
  {
    id: 'twilek',
    name: "Twi'lek",
    lifespan: 100,
    maturity: 18,
    ageSource: HD,
    bodyScale: 1.0,
    capBonus: { agility: 5 },
    // D-113 (Jared): the old "+5 Charisma cap" becomes Charisma learning x1.05 (only physical stats have caps).
    learning: [{ target: { kind: 'skill', skill: 'charisma' }, factor: 1.05 }],
    notes: ['Lekku: expressive in social scenes; Charisma learning x1.05', 'Dance and agility culture: Agility cap +5'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'zabrak',
    name: 'Zabrak',
    lifespan: 80,
    maturity: 18,
    ageSource: { lifespan: 'lore', maturity: 'invented', basis: `average lifespan 80 (SWTOR codex, D-399 [6]); horns at puberty (${P1}, Zabrak)` },
    bodyScale: 1.0,
    capBonus: {},
    // D-113 (Jared): the old "+5 Willpower cap" becomes Willpower learning x1.05.
    learning: [{ target: { kind: 'skill', skill: 'willpower' }, factor: 1.05 }],
    notes: ['Resilience: Willpower learning x1.05', 'Pain penalties x0.9 (applies with wounds, M5)'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'mirialan',
    name: 'Mirialan',
    lifespan: 100,
    maturity: 18,
    ageSource: HD,
    bodyScale: 1.0,
    capBonus: {},
    learning: [{ target: { kind: 'skill', skill: 'forceControl' }, factor: 1.05 }],
    notes: ['Force-attuned culture: Force Control learning x1.05'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'togruta',
    name: 'Togruta',
    lifespan: 95,
    maturity: 18,
    ageSource: { lifespan: 'game stat', maturity: 'game stat', basis: `venerable 95+, adult 18 (Force Unleashed Campaign Guide, UAA; ${P1}, Togruta)` },
    bodyScale: 1.0,
    capBonus: {},
    learning: [],
    notes: ['Echolocation (montrals): +10% vs surprise contests (M5)'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'miraluka',
    name: 'Miraluka',
    lifespan: 84,
    maturity: 18,
    ageSource: gs(`maximum 84 (game stat; ${P1}, Miraluka)`),
    bodyScale: 1.0,
    capBonus: {},
    learning: [{ target: { kind: 'skill', skill: 'forceSense' }, factor: 1.1 }],
    notes: ['Force sight: no eyes; perception uses Force Sense', 'Blinded if cut off from the Force', 'Force Sense learning x1.1'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'chiss',
    name: 'Chiss',
    lifespan: 80,
    maturity: 10,
    ageSource: { lifespan: 'game stat', maturity: 'lore', basis: `venerable 80 (Alien Anthology, UAA); "physically like a 20-year-old Human at 10" (${P1}, Chiss)` },
    bodyScale: 1.0,
    capBonus: {},
    learning: [{ target: { kind: 'skill', skill: 'tactics' }, factor: 1.1 }],
    notes: ['Tactical culture: Tactics learning x1.1', 'Imperial ally (renown: Empire)'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'cathar',
    name: 'Cathar',
    lifespan: 90,
    maturity: 18,
    ageSource: { lifespan: 'game stat', maturity: 'game stat', basis: `venerable 90+, adult 18 (UAA; ${P1}, Cathar)` },
    bodyScale: 1.05,
    capBonus: { agility: 5 },
    learning: [],
    notes: ['Claws and reflexes: unarmed base 8 (M5)', 'Agility cap +5'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'sith_pureblood',
    name: 'Sith Pureblood',
    lifespan: 100,
    maturity: 18,
    ageSource: HD,
    bodyScale: 1.0,
    capBonus: {},
    learning: [{ target: { kind: 'side', side: 'dark' }, factor: 1.05 }],
    notes: ['Dark-side heritage: dark-tagged ability learning x1.05', 'Empire only'],
    ageingSigns: [{ text: 'old Purebloods get mottled skin and withered facial tendrils', tag: 'lore' }],
    factions: ['empire'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'rattataki',
    name: 'Rattataki',
    lifespan: 100,
    maturity: 18,
    ageSource: HD,
    bodyScale: 1.0,
    capBonus: {},
    learning: [],
    notes: ['Pain tolerance: pain penalties x0.85 (M5)'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'mon_calamari',
    name: 'Mon Calamari',
    lifespan: 100,
    maturity: 18,
    ageSource: HD,
    bodyScale: 0.95,
    capBonus: {},
    learning: [{ target: { kind: 'skill', skill: 'intelligence' }, factor: 1.05 }],
    notes: ['Amphibious', 'Intelligence learning x1.05'],
    playable: true,
    source: DESIGN,
  },
  {
    id: 'wookiee',
    name: 'Wookiee',
    lifespan: 400,
    maturity: 18,
    prime: 200,
    ageSource: {
      lifespan: 'lore',
      maturity: 'game stat',
      prime: 'lore',
      basis: `soft cap about 400, rare cases beyond; adult 18 (UAA); prime about 200 (Visual Dictionary; D-399 [4], D-472; ${P1}, Wookiee)`,
    },
    bodyScale: 1.25,
    capBonus: { strength: 20 },
    learning: [],
    notes: ['Great strength: Strength cap +20', 'Rage: anger takes hold more easily (story)'],
    playable: true,
    source: DESIGN,
  },
  // ---- Lore batch 21 (D-399): the rest of the playable-ready species, the three thin playable ones, and the NPC-only ones.
  // D-434 (Jared): raised from the game stat's 70 (venerable 70+) so Grand Master Zym, a Kel Dor of about 120 in 3661
  // BBY (born about 3780 BBY, estimate), fits the band: at 150 he reads as a Human of about 81. Invented; the Kel Dor
  // lifespan is on the lore research queue.
  plain('kel_dor', 'Kel Dor', 150, 18, { lifespan: 'invented', maturity: 'invented', basis: `invented 150 (D-434: Zym at about 120); the game stat says venerable 70+ (${P1}, Kel Dor); lore check queued` }),
  plain('trandoshan', 'Trandoshan', 60, 15, gs(`venerable 60+, adult 15 (UAA; ${P1}, Trandoshan)`, 'game stat'), {
    ageingSigns: [{ text: 'stop regrowing lost limbs at about 54 (mechanical once limb loss exists)', tag: 'game stat' }],
  }),
  plain('rodian', 'Rodian', 100, 18, HD),
  plain('duros', 'Duros', 70, 15, gs(`venerable 70+, adult 15 (UAA; ${P1}, Duros)`, 'game stat')),
  plain('bothan', 'Bothan', 85, 17, gs(`venerable 85+, adult 17 (UAA; ${P1}, Bothan)`, 'game stat')),
  plain('cerean', 'Cerean', 70, 15, gs(`venerable 70+, adult 15 (UAA; ${P1}, Cerean)`, 'game stat')),
  plain('nautolan', 'Nautolan', 70, 18, gs(`maximum 70 (game stat; ${P1}, Nautolan)`)),
  plain('devaronian', 'Devaronian', 100, 18, HD),
  plain('gand', 'Gand', 95, 18, gs(`venerable 95+ (game stat; the same book's average of 61 does not fit it; ${P2}, Gand)`)),
  // D-402 [10]: Kalee is in Wild Space and the Kaleesh were "only recently contacted by the Galactic War" (SW_Planets_Travel_OldRepublic_Part2,
  // Kalee), which does not put contact before 3,661: gated like the Voss, open from the Galactic War (3,641).
  plain('kaleesh', 'Kaleesh', 80, 18, gs(`maximum 80 (game stat; ${P2}, Kaleesh)`), { knownFrom: -3641, notes: ['Only recently contacted by the Galactic War; offered from 3,641 [inferred] (D-402 [10], D-405 [1])'] }),
  plain('nikto', 'Nikto', 100, 18, HD),
  plain('weequay', 'Weequay', 90, 18, gs(`maximum 90 (game stat; ${P2}, Weequay)`)),
  plain('talz', 'Talz', 52, 18, gs(`maximum 52 (game stat; ${P2}, Talz)`)),
  plain('epicanthix', 'Epicanthix', 130, 18, { lifespan: 'lore', maturity: 'invented', basis: `up to 130 (novel; ${P2}, Epicanthix)` }),
  plain('falleen', 'Falleen', 250, 18, gs(`most live to about 250, rarely 400 (UAA, WEG; D-399 [3]; ${P2}, Falleen)`)),
  plain('hutt', 'Hutt', 1000, 200, { lifespan: 'lore', maturity: 'lore', basis: `adult at 200, lives over 1,000 (${P2}, Hutt)` }, { bodyScale: 1.5, bodyScaleSource: 'invented' as const }),
  plain('jawa', 'Jawa', 80, 18, gs(`maximum 80 (game stat; ${P2}, Jawa)`)),
  plain('dashade', 'Dashade', 85, 18, gs(`average 85 (game stat; "many centuries" in the infobox; ${P2}, Dashade)`)),
  plain('chagrian', 'Chagrian', 76, 18, gs(`maximum 76 (game stat; ${P2}, Chagrian)`)),
  plain('selkath', 'Selkath', 100, 18, gs(`maximum 100 (game stat; ${P2}, Selkath)`)),
  plain('sullustan', 'Sullustan', 100, 18, HD, { ageingSigns: [{ text: 'eyes start failing after 30', tag: 'lore' }] }),
  plain('ithorian', 'Ithorian', 85, 18, gs(`average 85 (game stat; ${P2}, Ithorian)`)),
  plain('arkanian', 'Arkanian', 103, 15, gs(`venerable 103+, adult 15 (UAA; ${P2}, Arkanian)`, 'game stat')),
  plain('zeltron', 'Zeltron', 80, 18, gs(`maximum 80 (game stat; ${P2}, Zeltron)`)),
  plain('gran', 'Gran', 79, 18, gs(`maximum 79 (infobox, source unchecked: unverified; ${P2}, Gran)`, 'invented', true)),
  plain('voss', 'Voss', 100, 18, HD, { knownFrom: -3645, notes: ['Unknown to the galaxy until the rediscovery c. 3,645 BBY (D-399 [15])'] }),
  // NPC-only (thin, D-399 [20]).
  plain('houk', 'Houk', 100, 18, HD, { playable: false }),
  plain('gormak', 'Gormak', 100, 18, HD, { playable: false, knownFrom: -3645 }),
  plain('gektl', 'Gektl', 100, 18, HD, { playable: false }),
  plain('yodas_species', "Yoda's species", 900, 18, { lifespan: 'lore', maturity: 'invented', basis: `Yoda died at 900 (${P2}, Yoda's species)` }, { playable: false, lifespanIncludesForce: true }),
  plain('sarkhai', 'Sarkhai', 100, 18, HD, { playable: false }),
  plain('echani', 'Echani', 100, 18, HD, { playable: false }),
  plain('aqualish', 'Aqualish', 80, 17, gs(`venerable 80+, adult 17 (infobox, source unchecked: unverified; ${P2}, Aqualish)`, 'game stat', true), { playable: false }),
];

export const SPECIES_BY_ID: ReadonlyMap<string, SpeciesDef> = new Map(SPECIES.map((s) => [s.id, s]));
export const DEFAULT_SPECIES = 'human';

export function speciesDef(id: string): SpeciesDef {
  const s = SPECIES_BY_ID.get(id);
  if (!s) throw new Error(`Unknown species id: ${id}`);
  return s;
}

/**
 * Species offered at character creation for a start in `year` (D-399 [20], [21]): playable, and known to the galaxy
 * by then. Later start eras need the same check as more gates are found (23-species.md).
 */
export function speciesOfferedAt(year: number): readonly SpeciesDef[] {
  return SPECIES.filter((s) => s.playable && (s.knownFrom === undefined || year >= s.knownFrom));
}

/** species.md §3 limits, asserted by tests. */
export const TRAIT_LIMITS = { maxCapBonus: 20, minLearning: 0.9, maxLearning: 1.1 } as const;

export const HUMAN_MATURITY = 18;
export const HUMAN_SPAN = FULL_LIFE_H - HUMAN_MATURITY;

/** A prime with no source: at the same share of adult life as a Human's (invented; the two lines are then one straight line). */
export const defaultPrime = (maturity: number, lifespan: number): number => maturity + ((lifespan - maturity) * (PRIME_H - HUMAN_MATURITY)) / HUMAN_SPAN;
export const speciesPrime = (s: Pick<SpeciesDef, 'prime' | 'maturity' | 'lifespan'>): number => s.prime ?? defaultPrime(s.maturity, s.lifespan);

/** The age map's corners: birth, adult, prime and the end of a full life against their Human-equivalent ages (species.md §1, D-472). */
const ageCorners = (s: SpeciesDef): readonly (readonly [number, number])[] => [
  [0, 0],
  [s.maturity, HUMAN_MATURITY],
  [speciesPrime(s), PRIME_H],
  [s.lifespan, FULL_LIFE_H],
];

/** Straight lines through the corners, the last one carried on past a full life; `from` and `to` pick the direction. */
function alongCorners(corners: readonly (readonly [number, number])[], x: number, from: 0 | 1, to: 0 | 1): number {
  let i = 1;
  while (i < corners.length - 1 && x > corners[i]![from]) i++;
  const a = corners[i - 1]!;
  const b = corners[i]!;
  return a[to] + ((x - a[from]) * (b[to] - a[to])) / (b[from] - a[from]);
}

/**
 * Human-equivalent age: adult reads 18, prime 30, a full life 100, in straight lines (species.md §1, D-103, D-472). Lives
 * here so the data layer can read it (the canon knowledge bands, D-462); src/engine/species re-exports it.
 */
export const humanEquivalentAge = (species: SpeciesDef, age: number): number => alongCorners(ageCorners(species), age, 0, 1);

/** The inverse: the species age at which h is reached. */
export const speciesAgeFromHuman = (species: SpeciesDef, h: number): number => alongCorners(ageCorners(species), h, 1, 0);

/**
 * The species-table id for an entity species id (canon figures and NPCs use camelCase ids; the table snake_case): the
 * table's own id, its snake_case form, else 'human'. Shared by NPC generation and the canon knowledge bands (D-462).
 */
export function speciesTableId(id: string): string {
  if (SPECIES_BY_ID.has(id)) return id;
  const snake = id.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  return SPECIES_BY_ID.has(snake) ? snake : 'human';
}
