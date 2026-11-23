// Archetypes (npc-generation §3; D-41, D-44, D-51, D-105). Weights are the old weights (main
// specialty 1.0, "physical w" = w each for Strength, Agility, Endurance; Willpower 0.4 for Jedi
// and Sith, 0.2 for everyone else). Shares come from the weights; from Knight on (and for careers
// all life) the main specialty takes 0.5 of the fill (D-41).
// Phase paces are measured on the real day loop (D-431, 2026-11-22: tests/paces, npm run paces; K = 12.30, the daily
// meditation block, the Knight's study, the age-scaled Padawan hours and the Sith rows) and copied verbatim from its JSON
// output: trained XP per age-weighted year of the skill's own age row over 60 years of the archetype's routine (Padawan
// 12, Knight 25), divided by R = K * 41^1.75 / A_ref (D-119). Before D-431 they came from docs-v2/calc/archetype-paces.mjs. Physical paces are the trained part only (the natural
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

/**
 * Force abilities an Order-trained archetype learns (D-191). The measured paces have no ability rows: the routine's
 * levitation drill trains Force Control while telekinesis is unknown (skills-and-activities: "Telekinesis, or Force
 * Control if Telekinesis is unknown"), so every Jedi and Sith started with no Force abilities at all. Each ability's
 * phase pace is this share of the parent stat's phase pace (focus included), on top of the parent (no hours moved), so
 * the closed form grows it in step with Force Control. Design defaults; Legends: every Jedi learns telekinesis and the
 * Push as an Initiate (lore: Telekinesis, Force Push), Guardians lean to the body abilities, Consulars to the mind and
 * defense, Sith to the grip. Level ~ share^0.571 x the parent level (curve exponent 1.75).
 */
export interface DerivedAbility {
  of: string;
  share: number;
}
const JEDI_CORE: Readonly<Record<string, DerivedAbility>> = {
  telekinesis: { of: 'forceControl', share: 0.8 },
  forcePush: { of: 'forceControl', share: 0.6 },
  forceJump: { of: 'forceControl', share: 0.45 },
  mindTrick: { of: 'forceControl', share: 0.35 },
};
const SITH_CORE: Readonly<Record<string, DerivedAbility>> = {
  telekinesis: { of: 'forceControl', share: 0.8 },
  forcePush: { of: 'forceControl', share: 0.6 },
  forceChoke: { of: 'forceControl', share: 0.5 },
  forceJump: { of: 'forceControl', share: 0.45 },
};
export const ARCHETYPE_FORCE_ABILITIES: Readonly<Record<string, Readonly<Record<string, DerivedAbility>>>> = {
  jediGuardian: { ...JEDI_CORE, forceSpeed: { of: 'forceControl', share: 0.5 } },
  jediConsular: { ...JEDI_CORE, mindTrick: { of: 'forceControl', share: 0.55 }, forceBarrier: { of: 'forceControl', share: 0.45 } },
  jediSentinel: { ...JEDI_CORE, mindTrick: { of: 'forceControl', share: 0.55 }, forceSpeed: { of: 'forceControl', share: 0.35 } },
  sithWarrior: { ...SITH_CORE, forceSpeed: { of: 'forceControl', share: 0.5 } },
  sithInquisitor: { ...SITH_CORE, mindTrick: { of: 'forceControl', share: 0.45 } },
};

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
      initiate: { strength: 0.133, agility: 0.1, endurance: 0.069, forceControl: 0.452, forceSense: 0.433, willpower: 0.868, meditation: 0.054, forceKnowledge: 0.319 },
      padawan: { strength: 0.087, agility: 0.108, endurance: 0.117, forceControl: 1.17, forceSense: 1.084, willpower: 1.512, meditation: 0.227 },
      knight: { strength: 0.27, agility: 0.276, endurance: 0.463, forceControl: 0.506, forceSense: 0.501, willpower: 1.032, meditation: 0.195, forceKnowledge: 0.129 },
    },
    formPaces: {
      initiate: { fill: 0, order: 1.028 },
      padawan: { fill: 0.134, master: 1.184, solo: 0.271 },
      knight: { fill: 1.662 },
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
      initiate: { strength: 0.13, agility: 0.097, endurance: 0.065, forceControl: 0.453, forceSense: 0.433, willpower: 0.859, meditation: 0.057, forceKnowledge: 0.314 },
      padawan: { strength: 0.051, agility: 0.073, endurance: 0.067, forceControl: 1.042, forceSense: 1.058, willpower: 1.394, meditation: 0.292, forceKnowledge: 0.112 },
      knight: { strength: 0.145, agility: 0.133, endurance: 0.186, forceControl: 0.084, forceSense: 0.37, willpower: 0.836, meditation: 0.542, forceKnowledge: 1.794 },
    },
    formPaces: {
      initiate: { order: 1.022 },
      padawan: { fill: 0.069, master: 1.147, solo: 0.232 },
      knight: { fill: 0.15 },
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
      initiate: { strength: 0.133, agility: 0.101, endurance: 0.068, forceControl: 0.452, forceSense: 0.432, willpower: 0.865, meditation: 0.054, forceKnowledge: 0.315, investigation: 0.002, intelligence: 0.001, charisma: 0, stealth: 0.004 },
      padawan: { strength: 0.066, agility: 0.103, endurance: 0.088, forceControl: 1.122, forceSense: 1.08, willpower: 1.506, meditation: 0.225, investigation: 0.087, intelligence: 0.021, charisma: 0.008, stealth: 0.063 },
      knight: { strength: 0.197, agility: 0.255, endurance: 0.372, forceControl: 0.377, forceSense: 0.506, willpower: 0.88, meditation: 0.192, investigation: 0.309, intelligence: 0.074, charisma: 0.029, stealth: 0.211, forceKnowledge: 0.131 },
    },
    formPaces: {
      initiate: { order: 1.035 },
      padawan: { fill: 0.085, master: 1.171, solo: 0.261 },
      knight: { fill: 1.544 },
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
      initiate: { strength: 0.143, agility: 0.109, endurance: 0.077, forceControl: 0.462, forceSense: 0.082, willpower: 0.762, forceKnowledge: 0.541, meditation: 0.183, forceOutput: 0.009 },
      padawan: { strength: 0.105, agility: 0.127, endurance: 0.138, forceControl: 1.143, forceSense: 0.194, willpower: 1.501, meditation: 0.087, forceOutput: 0.985 },
      knight: { strength: 0.338, agility: 0.331, endurance: 0.532, forceControl: 0.186, forceSense: 0.14, willpower: 1.207, meditation: 0.123, forceKnowledge: 0.087, forceOutput: 0.497 },
    },
    formPaces: {
      initiate: { fill: 0.003, order: 1.067 },
      padawan: { fill: 0.105, master: 1.193, solo: 0.289 },
      knight: { fill: 1.528 },
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
      initiate: { strength: 0.132, agility: 0.099, endurance: 0.066, forceControl: 0.46, forceSense: 0.082, willpower: 0.72, forceKnowledge: 0.522, meditation: 0.185, forceOutput: 0.014 },
      padawan: { strength: 0.019, agility: 0.045, endurance: 0.031, forceControl: 1.145, forceSense: 0.192, willpower: 1.35, meditation: 0.107, forceOutput: 1.012, forceKnowledge: 0.092 },
      knight: { endurance: 0.029, forceControl: 0.333, forceSense: 0.141, willpower: 0.607, forceKnowledge: 0.52, meditation: 0.221, forceOutput: 1.701, strength: 0.005, agility: 0.011 },
    },
    formPaces: {
      initiate: { order: 1.036 },
      padawan: { fill: 0.046, master: 1.195, solo: 0.286 },
      knight: { fill: 0.257 },
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
      knight: { blaster: 1.379, agility: 0.638, willpower: 0.59, tactics: 0.436, intelligence: 0.145, endurance: 0.418, strength: 0.347, meditation: 0.019, forceControl: 0.005 },
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
      knight: { blaster: 1.33, agility: 0.62, willpower: 0.559, endurance: 0.399, strength: 0.345, melee: 0.176, tactics: 0.244, intelligence: 0.081, meditation: 0.013, forceControl: 0.003 },
    },
    formPaces: {
      knight: {},
    },
  },
  {
    // Jared, D-224 (combat pass 2 balance row 8): the warrior caste, the main enemy of the Yuuzhan Vong War era. The
    // soldier's routine with melee (the amphistaff) as the weapon skill in place of the blaster, and no Force (the Vong
    // are outside it, D-192). Not a player archetype; generated NPCs only.
    id: 'yuuzhanVongWarrior',
    name: 'Yuuzhan Vong warrior',
    path: 'career',
    main: 'melee',
    weights: { melee: 1.0, tactics: 0.6, strength: 0.6, agility: 0.6, endurance: 0.6, willpower: 0.2 },
    // Trained for war from youth, as a caste (D-270; pass 5 issue 4: the soldier's [16, 30] let a 28-year-old warrior
    // start the year he was met, melee 0.7, "+0.4 level" and 0 XP). Design default.
    startAge: 14,
    startRange: [12, 17],
    paces: {
      knight: { melee: 1.304, strength: 0.501, agility: 0.431, endurance: 0.486, tactics: 0.435, intelligence: 0.145, willpower: 0.648, meditation: 0.015 },
    },
    formPaces: {
      knight: {},
    },
  },
  {
    // Jared, D-422: the non-Force melee fighter (Mandalorian blade-fighters, Talz, Dashade, arena gladiators); heavier on
    // the body than the soldier in its weights; its paces measured on its own routine since D-431. Offered at character creation for non-Force melee paths (D-425).
    id: 'warrior',
    name: 'Warrior (melee)',
    path: 'career',
    main: 'melee',
    weights: { melee: 1.0, strength: 0.8, endurance: 0.8, agility: 0.6, tactics: 0.3, willpower: 0.2 },
    // Raised to fight from youth (gladiator pits, warrior clans, Tulak Hord's servants): design default.
    startAge: 14,
    startRange: [10, 20],
    paces: {
      knight: { melee: 1.244, strength: 0.586, agility: 0.417, endurance: 0.575, tactics: 0.208, intelligence: 0.069, willpower: 0.587, meditation: 0.015, forceControl: 0.004 },
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
      knight: { blaster: 0.707, agility: 0.338, willpower: 0.862, piloting: 1.361, intelligence: 0.342, charisma: 0.348, meditation: 0.048, forceControl: 0.012, strength: 0.009, endurance: 0.009 },
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
      knight: { blaster: 1.368, agility: 0.559, willpower: 0.712, tracking: 0.357, endurance: 0.385, intelligence: 0.051, strength: 0.282, melee: 0.166, meditation: 0.014, forceControl: 0.003 },
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
      knight: { agility: 0.248, endurance: 0.324, strength: 0.275, profession: 1.63, intelligence: 0.791, charisma: 0.216, willpower: 0.616, forceKnowledge: 0.069, meditation: 0.107, forceControl: 0.027 },
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
  career: ['soldier', 'mandalorian', 'warrior', 'smuggler', 'bountyHunter', 'civilian'],
};
/**
 * Archetypes that only generated NPCs take (not on the creation form), by path (D-246). Creation accepts them for an NPC
 * (CreationInput.npc); without this the Yuuzhan Vong warrior (D-224) got no levels at all (pass 4: +0, 20 Vitality).
 */
export const NPC_ARCHETYPES: Record<CharacterPath, readonly string[]> = {
  jedi: [],
  sith: [],
  outsider: [],
  career: ['yuuzhanVongWarrior'],
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
