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

/** The crime lord's career paces (D-509; invented, set against Tassaa Bareesh and Suudaa Nemro). */
export const CRIME_LORD_PACE = { charisma: 1.1, intelligence: 1.0, profession: 0.9, tactics: 0.7 } as const;

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
  /**
   * The career youth phase (D-461): a career starting before CAREER_YOUTH_TO has these paces from its start to that age,
   * then `paces.knight` (measured on the loop over the two spans). Absent: one phase.
   */
  youthPaces?: Readonly<Record<string, number>>;
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
      initiate: { endurance: 0.082, strength: 0.138, agility: 0.109, forceControl: 0.566, forceSense: 0.466, willpower: 0.767, meditation: 0.085, forceKnowledge: 0.398 },
      padawan: { endurance: 0.126, strength: 0.093, agility: 0.117, forceControl: 1.252, forceSense: 1.197, willpower: 1.599, meditation: 0.245 },
      knight: { endurance: 0.487, strength: 0.289, agility: 0.297, forceControl: 0.563, forceSense: 0.559, willpower: 1.059, meditation: 0.212, forceKnowledge: 0.139 },
    },
    formPaces: {
      initiate: { fill: 0.008, order: 1.121 },
      padawan: { fill: 0.143, master: 1.262, solo: 0.294 },
      knight: { fill: 1.774 },
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
      initiate: { endurance: 0.078, strength: 0.132, agility: 0.104, forceControl: 0.57, forceSense: 0.47, willpower: 0.76, meditation: 0.09, forceKnowledge: 0.392 },
      padawan: { endurance: 0.073, strength: 0.056, agility: 0.079, forceControl: 1.119, forceSense: 1.147, willpower: 1.478, meditation: 0.314, forceKnowledge: 0.12 },
      knight: { endurance: 0.197, strength: 0.153, agility: 0.14, forceControl: 0.089, forceSense: 0.394, willpower: 0.894, meditation: 0.58, forceKnowledge: 1.916 },
    },
    formPaces: {
      initiate: { order: 1.11 },
      padawan: { fill: 0.046, master: 1.246, solo: 0.285 },
      knight: { fill: 0.16 },
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
      initiate: { endurance: 0.081, strength: 0.136, agility: 0.108, forceControl: 0.571, forceSense: 0.464, willpower: 0.764, meditation: 0.084, forceKnowledge: 0.397, investigation: 0.003, intelligence: 0.001, charisma: 0, stealth: 0.004 },
      padawan: { endurance: 0.096, strength: 0.071, agility: 0.112, forceControl: 1.216, forceSense: 1.182, willpower: 1.598, meditation: 0.241, investigation: 0.093, intelligence: 0.022, charisma: 0.009, stealth: 0.067 },
      knight: { endurance: 0.397, strength: 0.21, agility: 0.274, forceControl: 0.415, forceSense: 0.553, willpower: 0.923, meditation: 0.207, investigation: 0.337, intelligence: 0.08, charisma: 0.032, stealth: 0.225, forceKnowledge: 0.141 },
    },
    formPaces: {
      initiate: { fill: 0.001, order: 1.122 },
      padawan: { fill: 0.085, master: 1.251, solo: 0.292 },
      knight: { fill: 1.65 },
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
      initiate: { strength: 0.154, agility: 0.117, endurance: 0.082, forceControl: 0.494, forceSense: 0.088, willpower: 0.813, forceKnowledge: 0.578, meditation: 0.196, forceOutput: 0.009 },
      padawan: { strength: 0.112, agility: 0.136, endurance: 0.147, forceControl: 1.233, forceSense: 0.209, willpower: 1.601, meditation: 0.093, forceOutput: 1.095 },
      knight: { strength: 0.362, agility: 0.353, endurance: 0.564, forceControl: 0.206, forceSense: 0.155, willpower: 1.242, meditation: 0.133, forceKnowledge: 0.095, forceOutput: 0.639 },
    },
    formPaces: {
      initiate: { fill: 0.003, order: 1.145 },
      padawan: { fill: 0.114, master: 1.274, solo: 0.307 },
      knight: { fill: 1.645 },
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
      initiate: { strength: 0.141, agility: 0.105, endurance: 0.07, forceControl: 0.491, forceSense: 0.088, willpower: 0.768, forceKnowledge: 0.558, meditation: 0.197, forceOutput: 0.015 },
      padawan: { strength: 0.021, agility: 0.048, endurance: 0.033, forceControl: 1.231, forceSense: 0.207, willpower: 1.442, meditation: 0.114, forceOutput: 1.082, forceKnowledge: 0.099 },
      knight: { endurance: 0.031, forceControl: 0.356, forceSense: 0.15, willpower: 0.648, forceKnowledge: 0.556, meditation: 0.236, forceOutput: 1.815, strength: 0.005, agility: 0.012 },
    },
    formPaces: {
      initiate: { order: 1.107 },
      padawan: { fill: 0.051, master: 1.276, solo: 0.304 },
      knight: { fill: 0.274 },
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
      knight: { blaster: 1.477, agility: 0.683, willpower: 0.621, tactics: 0.465, intelligence: 0.155, endurance: 0.448, strength: 0.372, meditation: 0.021, forceControl: 0.005 },
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
      knight: { blaster: 1.465, agility: 0.684, willpower: 0.608, endurance: 0.444, strength: 0.382, melee: 0.195, tactics: 0.27, intelligence: 0.09, meditation: 0.015, forceControl: 0.004 },
    },
    youthPaces: { blaster: 1.166, agility: 0.534, willpower: 0.434, endurance: 0.336, strength: 0.293, melee: 0.151, tactics: 0.196, intelligence: 0.065, meditation: 0.009, forceControl: 0.002 },
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
      knight: { melee: 1.4, strength: 0.543, agility: 0.466, endurance: 0.529, tactics: 0.465, intelligence: 0.155, willpower: 0.687, meditation: 0.017 },
    },
    youthPaces: { melee: 1.212, strength: 0.421, agility: 0.373, endurance: 0.408, tactics: 0.431, intelligence: 0.144, willpower: 0.656, meditation: 0.013 },
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
      knight: { melee: 1.332, strength: 0.632, agility: 0.449, endurance: 0.621, tactics: 0.223, intelligence: 0.074, willpower: 0.622, meditation: 0.016, forceControl: 0.004 },
    },
    youthPaces: { melee: 1.213, strength: 0.437, agility: 0.362, endurance: 0.423, tactics: 0.2, intelligence: 0.067, willpower: 0.548, meditation: 0.012, forceControl: 0.003 },
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
      knight: { blaster: 0.755, agility: 0.361, willpower: 0.906, piloting: 1.458, intelligence: 0.367, charisma: 0.375, meditation: 0.051, forceControl: 0.013, strength: 0.01, endurance: 0.01 },
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
      knight: { blaster: 1.464, agility: 0.6, willpower: 0.749, tracking: 0.383, endurance: 0.413, intelligence: 0.055, strength: 0.304, melee: 0.178, meditation: 0.015, forceControl: 0.004 },
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
      knight: { agility: 0.266, endurance: 0.346, strength: 0.294, profession: 1.697, intelligence: 0.83, charisma: 0.232, willpower: 0.651, forceKnowledge: 0.074, meditation: 0.115, forceControl: 0.029 },
    },
    formPaces: {
      knight: {},
    },
  },
  {
    // A crime lord (Jared, D-509): runs a cartel or a criminal empire, by dealing, presence and planning, with others to do
    // the fighting. Generated and canon NPCs only. The civilian's measured day with the hours moved from the trade to
    // dealing and command: Charisma, Intelligence, Profession and Tactics as a career. Every pace invented.
    id: 'crimeLord',
    name: 'Crime lord',
    path: 'career',
    main: 'charisma',
    weights: { charisma: 1.0, intelligence: 0.8, profession: 0.6, tactics: 0.5, willpower: 0.3, blaster: 0.1 },
    startAge: 16,
    startRange: [14, 40],
    paces: {
      knight: { charisma: CRIME_LORD_PACE.charisma, intelligence: CRIME_LORD_PACE.intelligence, profession: CRIME_LORD_PACE.profession, tactics: CRIME_LORD_PACE.tactics, willpower: 0.651, agility: 0.15, endurance: 0.25, strength: 0.2, blaster: 0.2, meditation: 0.06 },
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
  career: ['yuuzhanVongWarrior', 'crimeLord'],
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
