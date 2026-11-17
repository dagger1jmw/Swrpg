// Species table (spec/species.md, D-103). Legends only. Every lifespan and trait is a design
// default marked LORE CHECK until M8 (species.md: "confirm against Docs/SWRPG lore/").
// Trait effects are limited to: a body-cap bonus on a physical stat (max +20), a learning factor
// on one category, skill or ability side (x0.9..x1.1), a contest modifier, or a story rule.

import type { PhysicalStat } from './skills';

export type LearningTarget =
  | { kind: 'skill'; skill: string }
  | { kind: 'category'; category: string }
  /** Every Force ability with this side tag (sith_pureblood: dark-tagged abilities). */
  | { kind: 'side'; side: 'dark' | 'light' };

export interface LearningFactor {
  target: LearningTarget;
  factor: number;
}

export interface SpeciesDef {
  id: string;
  name: string;
  lifespan: number;
  maturity: number;
  bodyScale: number;
  capBonus: Partial<Record<PhysicalStat, number>>;
  learning: readonly LearningFactor[];
  /** Story and contest rules the engine does not compute yet, shown on the sheet. */
  notes: readonly string[];
  /** Factions that may play this species (species.md §4); absent = any. */
  factions?: readonly string[];
  source: string;
}

const DESIGN = 'design (species.md §2, LORE CHECK until M8)';

export const SPECIES: readonly SpeciesDef[] = [
  { id: 'human', name: 'Human', lifespan: 100, maturity: 18, bodyScale: 1.0, capBonus: {}, learning: [], notes: [], source: 'baseline (progression-numbers §11)' },
  {
    id: 'twilek',
    name: "Twi'lek",
    lifespan: 100,
    maturity: 18,
    bodyScale: 1.0,
    capBonus: { agility: 5 },
    learning: [],
    // Charisma has no cap in v2 (only physical stats are capped), so "+5 Charisma cap" stays story flavor (D-107).
    notes: ['Lekku: expressive in social scenes (story; Charisma has no cap)', 'Dance and agility culture: Agility cap +5'],
    source: DESIGN,
  },
  {
    id: 'zabrak',
    name: 'Zabrak',
    lifespan: 100,
    maturity: 18,
    bodyScale: 1.0,
    capBonus: {},
    learning: [],
    notes: ['Resilience: hard to break (story; Willpower has no cap)', 'Pain penalties x0.9 (applies with wounds, M5)'],
    source: DESIGN,
  },
  {
    id: 'mirialan',
    name: 'Mirialan',
    lifespan: 100,
    maturity: 18,
    bodyScale: 1.0,
    capBonus: {},
    learning: [{ target: { kind: 'skill', skill: 'forceControl' }, factor: 1.05 }],
    notes: ['Force-attuned culture: Force Control learning x1.05'],
    source: DESIGN,
  },
  {
    id: 'togruta',
    name: 'Togruta',
    lifespan: 95,
    maturity: 18,
    bodyScale: 1.0,
    capBonus: {},
    learning: [],
    notes: ['Echolocation (montrals): +10% vs surprise contests (M5)'],
    source: DESIGN,
  },
  {
    id: 'miraluka',
    name: 'Miraluka',
    lifespan: 100,
    maturity: 18,
    bodyScale: 1.0,
    capBonus: {},
    learning: [{ target: { kind: 'skill', skill: 'forceSense' }, factor: 1.1 }],
    notes: ['Force sight: no eyes; perception uses Force Sense', 'Blinded if cut off from the Force', 'Force Sense learning x1.1'],
    source: DESIGN,
  },
  {
    id: 'chiss',
    name: 'Chiss',
    lifespan: 110,
    maturity: 18,
    bodyScale: 1.0,
    capBonus: {},
    learning: [{ target: { kind: 'skill', skill: 'tactics' }, factor: 1.1 }],
    notes: ['Tactical culture: Tactics learning x1.1', 'Imperial ally (renown: Empire)'],
    source: DESIGN,
  },
  {
    id: 'cathar',
    name: 'Cathar',
    lifespan: 100,
    maturity: 18,
    bodyScale: 1.05,
    capBonus: { agility: 5 },
    learning: [],
    notes: ['Claws and reflexes: unarmed base 8 (M5)', 'Agility cap +5'],
    source: DESIGN,
  },
  {
    id: 'sith_pureblood',
    name: 'Sith Pureblood',
    lifespan: 120,
    maturity: 18,
    bodyScale: 1.0,
    capBonus: {},
    learning: [{ target: { kind: 'side', side: 'dark' }, factor: 1.05 }],
    notes: ['Dark-side heritage: dark-tagged ability learning x1.05', 'Empire only'],
    factions: ['empire'],
    source: DESIGN,
  },
  {
    id: 'rattataki',
    name: 'Rattataki',
    lifespan: 100,
    maturity: 18,
    bodyScale: 1.0,
    capBonus: {},
    learning: [],
    notes: ['Pain tolerance: pain penalties x0.85 (M5)'],
    source: DESIGN,
  },
  {
    id: 'mon_calamari',
    name: 'Mon Calamari',
    lifespan: 100,
    maturity: 18,
    bodyScale: 0.95,
    capBonus: {},
    learning: [{ target: { kind: 'skill', skill: 'intelligence' }, factor: 1.05 }],
    notes: ['Amphibious', 'Intelligence learning x1.05'],
    source: DESIGN,
  },
  {
    id: 'wookiee',
    name: 'Wookiee',
    lifespan: 400,
    maturity: 60,
    bodyScale: 1.25,
    capBonus: { strength: 20 },
    learning: [],
    notes: ['Great strength: Strength cap +20', 'Rage: anger takes hold more easily (story)'],
    source: DESIGN,
  },
];

export const SPECIES_BY_ID: ReadonlyMap<string, SpeciesDef> = new Map(SPECIES.map((s) => [s.id, s]));
export const DEFAULT_SPECIES = 'human';

export function speciesDef(id: string): SpeciesDef {
  const s = SPECIES_BY_ID.get(id);
  if (!s) throw new Error(`Unknown species id: ${id}`);
  return s;
}

/** species.md §3 limits, asserted by tests. */
export const TRAIT_LIMITS = { maxCapBonus: 20, minLearning: 0.9, maxLearning: 1.1 } as const;
