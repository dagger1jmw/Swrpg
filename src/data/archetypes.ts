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
      initiate: { strength: 0.135, agility: 0.102, endurance: 0.069, forceControl: 0.457, forceSense: 0.438, willpower: 0.878, meditation: 0.055, forceKnowledge: 0.323 },
      padawan: { strength: 0.073, agility: 0.085, endurance: 0.091, forceControl: 1.142, forceSense: 1.067, willpower: 1.348, meditation: 0.229 },
      knight: { strength: 0.278, agility: 0.283, endurance: 0.468, forceControl: 0.528, forceSense: 0.525, willpower: 0.997, meditation: 0.201, forceKnowledge: 0.132 },
    },
    formPaces: {
      initiate: { fill: 0, order: 1.041 },
      padawan: { fill: 0.115, master: 1.187, solo: 0.269 },
      knight: { fill: 1.615 },
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
      initiate: { strength: 0.131, agility: 0.099, endurance: 0.066, forceControl: 0.458, forceSense: 0.438, willpower: 0.869, meditation: 0.058, forceKnowledge: 0.317 },
      padawan: { strength: 0.043, agility: 0.067, endurance: 0.057, forceControl: 1.055, forceSense: 1.069, willpower: 1.362, meditation: 0.293, forceKnowledge: 0.099 },
      knight: { strength: 0.148, agility: 0.135, endurance: 0.189, forceControl: 0.085, forceSense: 0.374, willpower: 0.846, meditation: 0.55, forceKnowledge: 1.813 },
    },
    formPaces: {
      initiate: { order: 1.034 },
      padawan: { fill: 0.079, master: 1.157, solo: 0.221 },
      knight: { fill: 0.151 },
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
      initiate: { strength: 0.135, agility: 0.102, endurance: 0.068, forceControl: 0.457, forceSense: 0.437, willpower: 0.875, meditation: 0.054, forceKnowledge: 0.319, investigation: 0.002, intelligence: 0.001, charisma: 0, stealth: 0.004 },
      padawan: { strength: 0.056, agility: 0.082, endurance: 0.07, forceControl: 1.112, forceSense: 1.089, willpower: 1.4, meditation: 0.229, investigation: 0.087, intelligence: 0.021, charisma: 0.008, stealth: 0.055 },
      knight: { strength: 0.203, agility: 0.263, endurance: 0.376, forceControl: 0.385, forceSense: 0.525, willpower: 0.844, meditation: 0.198, investigation: 0.317, intelligence: 0.076, charisma: 0.03, stealth: 0.216, forceKnowledge: 0.134 },
    },
    formPaces: {
      initiate: { order: 1.047 },
      padawan: { fill: 0.082, master: 1.183, solo: 0.254 },
      knight: { fill: 1.511 },
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
      initiate: { strength: 0.145, agility: 0.11, endurance: 0.078, forceControl: 0.407, forceSense: 0.072, willpower: 0.771, forceKnowledge: 0.547, meditation: 0.185, forceOutput: 0.008 },
      padawan: { strength: 0.09, agility: 0.095, endurance: 0.107, forceControl: 0.994, forceSense: 0.165, willpower: 1.308, meditation: 0.094, forceOutput: 0.822 },
      knight: { strength: 0.365, agility: 0.361, endurance: 0.555, forceControl: 0.166, forceSense: 0.117, willpower: 0.972, meditation: 0.139, forceOutput: 0.516, forceKnowledge: 0.092 },
    },
    formPaces: {
      initiate: { fill: 0.002, order: 1.08 },
      padawan: { fill: 0.094, master: 1.198, solo: 0.293 },
      knight: { fill: 1.372 },
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
      initiate: { strength: 0.133, agility: 0.1, endurance: 0.067, forceControl: 0.405, forceSense: 0.073, willpower: 0.729, forceKnowledge: 0.529, meditation: 0.187, forceOutput: 0.012 },
      padawan: { strength: 0.019, agility: 0.045, endurance: 0.03, forceControl: 0.994, forceSense: 0.165, willpower: 1.304, meditation: 0.107, forceOutput: 0.851, forceKnowledge: 0.089 },
      knight: { endurance: 0.03, forceControl: 0.294, forceSense: 0.124, willpower: 0.616, forceKnowledge: 0.527, meditation: 0.224, forceOutput: 1.503, strength: 0.005, agility: 0.012 },
    },
    formPaces: {
      initiate: { order: 1.048 },
      padawan: { fill: 0.043, master: 1.207, solo: 0.287 },
      knight: { fill: 0.261 },
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
      knight: { blaster: 1.27, agility: 0.609, willpower: 0.302, tactics: 0.441, intelligence: 0.147, endurance: 0.392, strength: 0.357, meditation: 0.021, forceControl: 0.005 },
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
      knight: { blaster: 1.232, agility: 0.585, willpower: 0.261, endurance: 0.386, strength: 0.352, melee: 0.196, tactics: 0.244, intelligence: 0.081, meditation: 0.014, forceControl: 0.003 },
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
      // D-431, D-447: Force Control (0.005 on the loop, from the drills' secondaries) left out: the Vong are outside the Force
      // (creation drops it for the species anyway).
      knight: { melee: 1.239, strength: 0.465, agility: 0.403, endurance: 0.443, tactics: 0.404, intelligence: 0.135, willpower: 0.23, meditation: 0.02 },
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
      knight: { melee: 1.228, strength: 0.466, agility: 0.382, endurance: 0.453, tactics: 0.211, intelligence: 0.07, willpower: 0.176, meditation: 0.02, forceControl: 0.005 },
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
      knight: { blaster: 0.715, agility: 0.342, willpower: 0.87, piloting: 1.378, intelligence: 0.347, charisma: 0.352, meditation: 0.049, forceControl: 0.012, strength: 0.009, endurance: 0.009 },
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
      knight: { blaster: 1.241, agility: 0.553, willpower: 0.296, tracking: 0.281, endurance: 0.405, intelligence: 0.041, strength: 0.305, melee: 0.184, meditation: 0.017, forceControl: 0.004 },
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
      knight: { agility: 0.251, endurance: 0.328, strength: 0.278, profession: 1.638, intelligence: 0.798, charisma: 0.22, willpower: 0.617, forceKnowledge: 0.07, meditation: 0.108, forceControl: 0.027 },
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
