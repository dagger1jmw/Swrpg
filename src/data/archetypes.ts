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
      initiate: { endurance: 0.089, strength: 0.133, agility: 0.109, forceControl: 0.648, forceSense: 0.475, willpower: 0.757, meditation: 0.108, forceKnowledge: 0.412 },
      padawan: { endurance: 0.12, strength: 0.09, agility: 0.111, forceControl: 1.259, forceSense: 1.197, willpower: 1.733, meditation: 0.241 },
      knight: { endurance: 0.479, strength: 0.28, agility: 0.293, forceControl: 0.569, forceSense: 0.563, willpower: 1.24, meditation: 0.2, forceKnowledge: 0.136 },
    },
    formPaces: {
      initiate: { fill: 0.009, order: 1.204 },
      padawan: { fill: 0.137, master: 1.273, solo: 0.294 },
      knight: { fill: 1.795 },
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
      initiate: { endurance: 0.085, strength: 0.128, agility: 0.106, forceControl: 0.65, forceSense: 0.477, willpower: 0.751, meditation: 0.112, forceKnowledge: 0.403 },
      padawan: { endurance: 0.074, strength: 0.056, agility: 0.08, forceControl: 1.134, forceSense: 1.163, willpower: 1.49, meditation: 0.319, forceKnowledge: 0.121 },
      knight: { endurance: 0.199, strength: 0.156, agility: 0.142, forceControl: 0.09, forceSense: 0.396, willpower: 0.902, meditation: 0.587, forceKnowledge: 1.932 },
    },
    formPaces: {
      initiate: { order: 1.2 },
      padawan: { fill: 0.041, master: 1.272, solo: 0.297 },
      knight: { fill: 0.162 },
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
      initiate: { endurance: 0.087, strength: 0.131, agility: 0.108, forceControl: 0.652, forceSense: 0.475, willpower: 0.755, meditation: 0.106, forceKnowledge: 0.406, investigation: 0.003, intelligence: 0.001, charisma: 0, stealth: 0.004 },
      padawan: { endurance: 0.098, strength: 0.073, agility: 0.114, forceControl: 1.224, forceSense: 1.193, willpower: 1.612, meditation: 0.245, investigation: 0.093, intelligence: 0.022, charisma: 0.009, stealth: 0.068 },
      knight: { endurance: 0.393, strength: 0.207, agility: 0.271, forceControl: 0.421, forceSense: 0.558, willpower: 1.077, meditation: 0.203, investigation: 0.34, intelligence: 0.081, charisma: 0.032, stealth: 0.221, forceKnowledge: 0.139 },
    },
    formPaces: {
      initiate: { fill: 0.002, order: 1.211 },
      padawan: { fill: 0.084, master: 1.284, solo: 0.298 },
      knight: { fill: 1.666 },
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
      initiate: { strength: 0.156, agility: 0.118, endurance: 0.084, forceControl: 0.5, forceSense: 0.089, willpower: 0.823, forceKnowledge: 0.585, meditation: 0.198, forceOutput: 0.009 },
      padawan: { strength: 0.113, agility: 0.138, endurance: 0.149, forceControl: 1.249, forceSense: 0.211, willpower: 1.619, meditation: 0.095, forceOutput: 1.108 },
      knight: { strength: 0.368, agility: 0.358, endurance: 0.574, forceControl: 0.208, forceSense: 0.158, willpower: 1.249, meditation: 0.135, forceKnowledge: 0.096, forceOutput: 0.646 },
    },
    formPaces: {
      initiate: { fill: 0.004, order: 1.162 },
      padawan: { fill: 0.116, master: 1.288, solo: 0.31 },
      knight: { fill: 1.665 },
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
      initiate: { strength: 0.143, agility: 0.107, endurance: 0.071, forceControl: 0.497, forceSense: 0.089, willpower: 0.777, forceKnowledge: 0.565, meditation: 0.2, forceOutput: 0.015 },
      padawan: { strength: 0.021, agility: 0.049, endurance: 0.033, forceControl: 1.247, forceSense: 0.209, willpower: 1.459, meditation: 0.116, forceOutput: 1.095, forceKnowledge: 0.1 },
      knight: { endurance: 0.031, forceControl: 0.359, forceSense: 0.152, willpower: 0.656, forceKnowledge: 0.563, meditation: 0.239, forceOutput: 1.833, strength: 0.005, agility: 0.012 },
    },
    formPaces: {
      initiate: { order: 1.123 },
      padawan: { fill: 0.052, master: 1.291, solo: 0.308 },
      knight: { fill: 0.277 },
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
      knight: { blaster: 1.495, agility: 0.691, willpower: 0.627, tactics: 0.471, intelligence: 0.157, endurance: 0.453, strength: 0.377, meditation: 0.021, forceControl: 0.005 },
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
      knight: { blaster: 1.443, agility: 0.673, willpower: 0.597, endurance: 0.437, strength: 0.376, melee: 0.191, tactics: 0.264, intelligence: 0.088, meditation: 0.015, forceControl: 0.004 },
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
      knight: { melee: 1.414, strength: 0.547, agility: 0.47, endurance: 0.533, tactics: 0.47, intelligence: 0.157, willpower: 0.694, meditation: 0.017 },
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
      knight: { melee: 1.346, strength: 0.636, agility: 0.453, endurance: 0.625, tactics: 0.225, intelligence: 0.075, willpower: 0.627, meditation: 0.016, forceControl: 0.004 },
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
      knight: { blaster: 0.765, agility: 0.366, willpower: 0.914, piloting: 1.476, intelligence: 0.372, charisma: 0.38, meditation: 0.052, forceControl: 0.013, strength: 0.011, endurance: 0.011 },
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
      knight: { blaster: 1.482, agility: 0.607, willpower: 0.756, tracking: 0.387, endurance: 0.418, intelligence: 0.055, strength: 0.308, melee: 0.18, meditation: 0.015, forceControl: 0.004 },
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
      knight: { agility: 0.269, endurance: 0.351, strength: 0.297, profession: 1.708, intelligence: 0.838, charisma: 0.235, willpower: 0.658, forceKnowledge: 0.075, meditation: 0.117, forceControl: 0.029 },
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
