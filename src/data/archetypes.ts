// Archetypes (npc-generation §3; D-41, D-44, D-51, D-105). Weights are the old weights (main
// specialty 1.0, "physical w" = w each for Strength, Agility, Endurance; Willpower 0.4 for Jedi
// and Sith, 0.2 for everyone else). Shares come from the weights; from Knight on (and for careers
// all life) the main specialty takes 0.5 of the fill (D-41).
// Phase paces are measured by docs-v2/calc/archetype-paces.mjs (K = 11.683, D-118 / D-119 / D-120; with the centered state, D-133) and
// copied verbatim from its JSON output: credited XP per age-weighted year of the skill's own age row,
// divided by R = K * 41^1.75 / A_ref (D-119). Physical paces are the trained part only (the natural
// baseline goes on top). Willpower includes fatigue Willpower.
// Lightsaber forms are a pool (D-118): `formPaces` gives the pace of all form XP per phase and source
// (Initiate: the Order Shii-Cho block and fill; Padawan: the master session, the solo hour and fill;
// Knight+: fill), shared out by the character's form plan. The weight tokens '$mainForm' and
// '$secondForm' together are the forms' share of the fill.

export type CharacterPath = 'jedi' | 'sith' | 'outsider' | 'career';
export type Phase = 'initiate' | 'padawan' | 'knight';

export interface ArchetypeDef {
  id: string;
  name: string;
  path: CharacterPath;
  /** The main specialty (first weight). */
  main: string;
  weights: Readonly<Record<string, number>>;
  /** Default training start age and the allowed range (npc-generation §3, character-creation §1). */
  startAge: number;
  startRange: readonly [number, number];
  /** Measured closed-form paces per phase, lightsaber forms excluded. Careers have only 'knight' (one phase). */
  paces: Readonly<Partial<Record<Phase, Readonly<Record<string, number>>>>>;
  /** Pace of all lightsaber-form XP per phase and source (D-118); absent for archetypes without forms. */
  formPaces: Readonly<Partial<Record<Phase, Readonly<Partial<Record<FormSource, number>>>>>>;
}

export type FormSource = 'order' | 'master' | 'solo' | 'fill';

const JEDI_RANGE = [2, 5] as const;
const SITH_RANGE = [8, 16] as const;

export const ARCHETYPES: readonly ArchetypeDef[] = [
  {
    id: 'jediGuardian',
    name: 'Jedi Guardian',
    path: 'jedi',
    main: '$mainForm',
    weights: { $mainForm: 1.0, $secondForm: 0.3, forceControl: 0.6, forceSense: 0.5, strength: 0.5, agility: 0.5, endurance: 0.5, willpower: 0.4 },
    startAge: 4,
    startRange: JEDI_RANGE,
    paces: {
      initiate: { forceControl: 0.42, forceSense: 0.402, strength: 0.142, agility: 0.107, endurance: 0.072, willpower: 0.946, meditation: 0.058, forceKnowledge: 0.338 },
      padawan: { forceControl: 1.063, forceSense: 0.841, strength: 0.021, agility: 0.046, endurance: 0.029, willpower: 1.51, meditation: 0.12 },
      knight: { forceControl: 0.485, forceSense: 0.441, strength: 0.238, agility: 0.246, endurance: 0.419, willpower: 1.196, meditation: 0.075 },
    },
    formPaces: {
      initiate: { order: 1.091, fill: 0.007 },
      padawan: { master: 1.205, solo: 0.319, fill: 0.012 },
      knight: { fill: 1.59 },
    },
  },
  {
    id: 'jediConsular',
    name: 'Jedi Consular',
    path: 'jedi',
    main: 'forceKnowledge',
    weights: { forceKnowledge: 1.0, meditation: 0.8, forceSense: 0.8, forceHealOthers: 0.8, $mainForm: 0.4, strength: 0.3, agility: 0.3, endurance: 0.3, willpower: 0.4 },
    startAge: 4,
    startRange: JEDI_RANGE,
    paces: {
      initiate: { forceControl: 0.419, forceSense: 0.404, strength: 0.139, agility: 0.104, endurance: 0.069, willpower: 0.918, meditation: 0.061, forceKnowledge: 0.333, forceHealOthers: 0.003 },
      padawan: { forceControl: 1.064, forceSense: 0.843, strength: 0.02, agility: 0.046, endurance: 0.027, willpower: 1.576, meditation: 0.128, forceKnowledge: 0.015, forceHealOthers: 0.004 },
      knight: { forceControl: 0.101, forceSense: 0.314, strength: 0.155, agility: 0.146, endurance: 0.199, willpower: 1.146, meditation: 0.37, forceKnowledge: 1.716, forceHealOthers: 0.244 },
    },
    formPaces: {
      initiate: { order: 1.092, fill: 0.001 },
      padawan: { master: 1.208, solo: 0.32, fill: 0.005 },
      knight: { fill: 0.158 },
    },
  },
  {
    id: 'jediSentinel',
    name: 'Jedi Sentinel',
    path: 'jedi',
    main: '$mainForm',
    weights: { $mainForm: 1.0, forceSense: 0.8, investigation: 0.8, stealth: 0.8, forceControl: 0.6, strength: 0.5, agility: 0.5, endurance: 0.5, willpower: 0.4 },
    startAge: 4,
    startRange: JEDI_RANGE,
    paces: {
      initiate: { forceControl: 0.419, forceSense: 0.402, strength: 0.141, agility: 0.107, endurance: 0.071, willpower: 0.938, meditation: 0.058, forceKnowledge: 0.335, intelligence: 0.001, charisma: 0, stealth: 0.003, investigation: 0.002 },
      padawan: { forceControl: 1.061, forceSense: 0.841, strength: 0.02, agility: 0.047, endurance: 0.028, willpower: 1.539, meditation: 0.12, intelligence: 0.004, charisma: 0.001, stealth: 0.005, investigation: 0.016 },
      knight: { forceControl: 0.356, forceSense: 0.437, strength: 0.17, agility: 0.227, endurance: 0.326, willpower: 1.163, meditation: 0.071, intelligence: 0.078, charisma: 0.031, stealth: 0.178, investigation: 0.329 },
    },
    formPaces: {
      initiate: { order: 1.091, fill: 0.003 },
      padawan: { master: 1.204, solo: 0.319, fill: 0.007 },
      knight: { fill: 1.482 },
    },
  },
  {
    id: 'sithWarrior',
    name: 'Sith Warrior',
    path: 'sith',
    main: '$mainForm',
    weights: { $mainForm: 1.0, forceOutput: 0.8, strength: 0.6, agility: 0.6, endurance: 0.6, willpower: 0.4 },
    startAge: 8,
    startRange: SITH_RANGE,
    paces: {
      initiate: { forceControl: 0.422, forceSense: 0.404, forceOutput: 0.006, strength: 0.145, agility: 0.109, endurance: 0.077, willpower: 0.891, meditation: 0.058, forceKnowledge: 0.352 },
      padawan: { forceControl: 1.06, forceSense: 0.823, forceOutput: 0.003, strength: 0.022, agility: 0.049, endurance: 0.03, willpower: 1.505, meditation: 0.117 },
      knight: { forceControl: 0.174, forceSense: 0.097, forceOutput: 0.546, strength: 0.322, agility: 0.314, endurance: 0.49, willpower: 1.11, meditation: 0.027 },
    },
    formPaces: {
      initiate: { order: 1.078, fill: 0.01 },
      padawan: { master: 1.206, solo: 0.336, fill: 0.01 },
      knight: { fill: 1.37 },
    },
  },
  {
    id: 'sithInquisitor',
    name: 'Sith Inquisitor',
    path: 'sith',
    main: 'forceOutput',
    weights: { forceOutput: 1.0, forceLightning: 0.9, forceKnowledge: 0.7, $mainForm: 0.4, willpower: 0.4 },
    startAge: 8,
    startRange: SITH_RANGE,
    paces: {
      initiate: { forceControl: 0.423, forceSense: 0.404, forceOutput: 0.01, strength: 0.137, agility: 0.103, endurance: 0.068, willpower: 0.834, meditation: 0.058, forceKnowledge: 0.341, forceLightning: 0.009 },
      padawan: { forceControl: 1.063, forceSense: 0.823, forceOutput: 0.003, strength: 0.02, agility: 0.047, endurance: 0.027, willpower: 1.58, meditation: 0.118, forceKnowledge: 0.015, forceLightning: 0.005 },
      knight: { forceControl: 0.379, forceSense: 0.118, forceOutput: 1.586, strength: 0.005, agility: 0.012, endurance: 0.031, willpower: 0.913, meditation: 0.062, forceKnowledge: 0.3, forceLightning: 0.431 },
    },
    formPaces: {
      initiate: { order: 1.078, fill: 0.001 },
      padawan: { master: 1.207, solo: 0.336, fill: 0.008 },
      knight: { fill: 0.27 },
    },
  },
  {
    id: 'soldier',
    name: 'Republic / Imperial soldier',
    path: 'career',
    main: 'blaster',
    weights: { blaster: 1.0, tactics: 0.6, strength: 0.6, agility: 0.6, endurance: 0.6, willpower: 0.2 },
    startAge: 17,
    startRange: [16, 30],
    paces: {
      knight: { forceControl: 0.004, strength: 0.283, agility: 0.523, endurance: 0.334, willpower: 0.832, meditation: 0.016, intelligence: 0.154, blaster: 1.326, tactics: 0.463 },
    },
    formPaces: {
      knight: {},
    },
  },
  {
    id: 'mandalorian',
    name: 'Mandalorian',
    path: 'career',
    main: 'blaster',
    weights: { blaster: 1.0, melee: 0.6, strength: 0.8, agility: 0.8, endurance: 0.8, tactics: 0.5, willpower: 0.2 },
    startAge: 8,
    startRange: [6, 16],
    paces: {
      knight: { forceControl: 0.003, strength: 0.28, agility: 0.529, endurance: 0.314, willpower: 0.912, meditation: 0.01, intelligence: 0.085, blaster: 1.292, melee: 0.156, tactics: 0.256 },
    },
    formPaces: {
      knight: {},
    },
  },
  {
    id: 'smuggler',
    name: 'Smuggler / scoundrel',
    path: 'career',
    main: 'piloting',
    weights: { piloting: 1.0, blaster: 0.7, charisma: 0.6, willpower: 0.2 },
    startAge: 17,
    startRange: [14, 30],
    paces: {
      knight: { forceControl: 0.013, agility: 0.359, willpower: 0.904, meditation: 0.051, intelligence: 0.365, charisma: 0.373, blaster: 0.752, piloting: 1.448 },
    },
    formPaces: {
      knight: {},
    },
  },
  {
    id: 'bountyHunter',
    name: 'Bounty hunter',
    path: 'career',
    main: 'blaster',
    weights: { blaster: 1.0, tracking: 0.9, melee: 0.5, strength: 0.6, agility: 0.6, endurance: 0.6, willpower: 0.2 },
    startAge: 17,
    startRange: [14, 30],
    paces: {
      knight: { forceControl: 0.003, strength: 0.231, agility: 0.493, endurance: 0.295, willpower: 1.004, meditation: 0.011, intelligence: 0.029, blaster: 1.286, melee: 0.14, tracking: 0.2 },
    },
    formPaces: {
      knight: {},
    },
  },
  {
    id: 'civilian',
    name: 'Civilian',
    path: 'career',
    main: 'profession',
    weights: { profession: 1.0, strength: 0.1, agility: 0.1, endurance: 0.1, intelligence: 0.1, charisma: 0.1, willpower: 0.2 },
    startAge: 16,
    startRange: [12, 40],
    paces: {
      knight: { forceControl: 0.028, strength: 0.297, agility: 0.259, endurance: 0.339, willpower: 0.896, meditation: 0.112, forceKnowledge: 0.068, intelligence: 0.799, charisma: 0.182, profession: 1.68 },
    },
    formPaces: {
      knight: {},
    },
  },
];

export const ARCHETYPE_BY_ID: ReadonlyMap<string, ArchetypeDef> = new Map(ARCHETYPES.map((a) => [a.id, a]));

export function archetypeDef(id: string): ArchetypeDef {
  const a = ARCHETYPE_BY_ID.get(id);
  if (!a) throw new Error(`Unknown archetype id: ${id}`);
  return a;
}

/** Archetypes a path may pick. Outsiders train like a Guardian without the Order (Luke). */
export const PATH_ARCHETYPES: Record<CharacterPath, readonly string[]> = {
  jedi: ['jediGuardian', 'jediConsular', 'jediSentinel'],
  sith: ['sithWarrior', 'sithInquisitor'],
  outsider: ['jediGuardian', 'jediConsular', 'jediSentinel'],
  career: ['soldier', 'mandalorian', 'smuggler', 'bountyHunter', 'civilian'],
};

/** Training start range per path (character-creation §1); outsiders may start late, like Luke. */
export const PATH_START_RANGE: Record<CharacterPath, readonly [number, number]> = {
  jedi: [2, 5],
  sith: [8, 16],
  outsider: [2, 40],
  career: [6, 40],
};

/** Shares from weights (sum to 1). */
export function sharesFromWeights(weights: Readonly<Record<string, number>>): Record<string, number> {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]));
}

/** Knight+ / career shares: the main specialty fixed at mainShare, the rest in proportion (D-41). */
export function focusShares(weights: Readonly<Record<string, number>>, main: string, mainShare = 0.5): Record<string, number> {
  const rest = Object.entries(weights).filter(([k]) => k !== main);
  const total = rest.reduce((a, [, v]) => a + v, 0);
  return { [main]: mainShare, ...Object.fromEntries(rest.map(([k, v]) => [k, (v / total) * (1 - mainShare)])) };
}
