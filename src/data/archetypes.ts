// Archetypes (npc-generation §3; D-41, D-44, D-51, D-105). Weights are the old weights (main
// specialty 1.0, "physical w" = w each for Strength, Agility, Endurance; Willpower 0.4 for Jedi
// and Sith, 0.2 for everyone else). Shares come from the weights; from Knight on (and for careers
// all life) the main specialty takes 0.5 of the fill (D-41).
// Phase paces are measured by docs-v2/calc/archetype-paces.mjs (K = 15.181) and copied verbatim
// from its JSON output: credited XP per age-weighted year of the skill's own age row, divided by
// the Average's mean main-form rate over ages 4-20 (so A_ref stays 17.98). Physical paces are the
// trained part only (the natural baseline goes on top). Willpower includes fatigue Willpower.
// Tokens: '$mainForm' and '$secondForm' are the character's chosen forms.

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
  /** Measured closed-form paces per phase. Careers have only 'knight' (one phase). */
  paces: Readonly<Partial<Record<Phase, Readonly<Record<string, number>>>>>;
}

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
      initiate: { $mainForm: 0.844, forceControl: 0.322, forceSense: 0.308, strength: 0.11, agility: 0.083, endurance: 0.056, willpower: 0.728, meditation: 0.044, forceKnowledge: 0.257 },
      padawan: { $mainForm: 1.177, $secondForm: 0.002, forceControl: 0.812, forceSense: 0.637, strength: 0.034, agility: 0.026, endurance: 0.018, willpower: 1.158, meditation: 0.091 },
      knight: { $mainForm: 1.099, $secondForm: 0.048, forceControl: 0.34, forceSense: 0.265, strength: 0.296, agility: 0.237, endurance: 0.233, willpower: 0.874, meditation: 0.051 },
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
      initiate: { $mainForm: 0.84, forceControl: 0.321, forceSense: 0.309, strength: 0.107, agility: 0.08, endurance: 0.053, willpower: 0.708, meditation: 0.047, forceKnowledge: 0.254, forceHealOthers: 0.002 },
      padawan: { $mainForm: 1.169, forceControl: 0.811, forceSense: 0.639, strength: 0.032, agility: 0.024, endurance: 0.017, willpower: 1.22, meditation: 0.101, forceKnowledge: 0.011, forceHealOthers: 0.002 },
      knight: { $mainForm: 0.117, forceControl: 0.071, forceSense: 0.218, strength: 0.132, agility: 0.116, endurance: 0.143, willpower: 0.951, meditation: 0.266, forceKnowledge: 1.257, forceHealOthers: 0.173 },
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
      initiate: { $mainForm: 0.842, forceControl: 0.322, forceSense: 0.309, strength: 0.108, agility: 0.082, endurance: 0.055, willpower: 0.723, meditation: 0.044, forceKnowledge: 0.255, stealth: 0.002, investigation: 0.002 },
      padawan: { $mainForm: 1.174, forceControl: 0.811, forceSense: 0.637, strength: 0.033, agility: 0.027, endurance: 0.017, willpower: 1.173, meditation: 0.091, intelligence: 0.002, charisma: 0.001, stealth: 0.007, investigation: 0.009 },
      knight: { $mainForm: 1.097, forceControl: 0.237, forceSense: 0.262, strength: 0.235, agility: 0.212, endurance: 0.167, willpower: 0.878, meditation: 0.051, intelligence: 0.057, charisma: 0.023, stealth: 0.122, investigation: 0.239 },
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
      initiate: { $mainForm: 0.834, forceControl: 0.324, forceSense: 0.31, forceOutput: 0.005, strength: 0.111, agility: 0.084, endurance: 0.059, willpower: 0.686, meditation: 0.044, forceKnowledge: 0.27 },
      padawan: { $mainForm: 1.177, forceControl: 0.81, forceSense: 0.624, forceOutput: 0.001, strength: 0.033, agility: 0.026, endurance: 0.017, willpower: 1.153, meditation: 0.089 },
      knight: { $mainForm: 1.088, forceControl: 0.105, forceSense: 0.02, forceOutput: 0.303, strength: 0.295, agility: 0.235, endurance: 0.211, willpower: 0.575, meditation: 0.01 },
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
      initiate: { $mainForm: 0.827, forceControl: 0.325, forceSense: 0.311, forceOutput: 0.008, strength: 0.105, agility: 0.079, endurance: 0.052, willpower: 0.642, meditation: 0.044, forceKnowledge: 0.261, forceLightning: 0.007 },
      padawan: { $mainForm: 1.168, forceControl: 0.811, forceSense: 0.624, forceOutput: 0.005, strength: 0.031, agility: 0.024, endurance: 0.016, willpower: 1.183, meditation: 0.089, forceKnowledge: 0.008, forceLightning: 0.003 },
      knight: { $mainForm: 0.206, forceControl: 0.273, forceSense: 0.077, forceOutput: 1.157, strength: 0.026, agility: 0.02, endurance: 0.013, willpower: 0.762, meditation: 0.044, forceKnowledge: 0.216, forceLightning: 0.308 },
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
      knight: { forceControl: 0.001, strength: 0.128, agility: 0.317, endurance: 0.123, willpower: 0.483, meditation: 0.005, intelligence: 0.072, blaster: 1.104, tactics: 0.215 },
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
      knight: { forceControl: 0.001, strength: 0.142, agility: 0.336, endurance: 0.127, willpower: 0.509, meditation: 0.002, intelligence: 0.021, blaster: 1.081, melee: 0.034, tactics: 0.062 },
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
      knight: { forceControl: 0.006, agility: 0.244, willpower: 0.601, meditation: 0.024, intelligence: 0.261, charisma: 0.212, blaster: 0.453, piloting: 1.092 },
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
      knight: { forceControl: 0.001, strength: 0.037, agility: 0.278, endurance: 0.056, willpower: 0.4, meditation: 0.003, intelligence: 0.017, blaster: 1.106, melee: 0.026, tracking: 0.121 },
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
      knight: { forceControl: 0.021, strength: 0.22, agility: 0.192, endurance: 0.251, willpower: 0.744, meditation: 0.083, forceKnowledge: 0.049, intelligence: 0.6, charisma: 0.128, profession: 1.289 },
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
