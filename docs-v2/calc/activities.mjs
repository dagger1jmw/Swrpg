// Skills and activities used by the calculations. Mirrors docs-v2/spec/skills-and-activities.md
// (that spec is the source of truth; keep the two in sync).

// Skill -> category (skills-and-activities.md §1)
export const SKILLS = {
  mainForm: 'technique', secondForm: 'technique',
  ForceControl: 'force', ForceSense: 'force', ForceOutput: 'force',
  Strength: 'physical', Agility: 'physical', Endurance: 'physical',
  Willpower: 'wisdom', Meditation: 'wisdom', ForceKnowledge: 'knowledge',
  Intelligence: 'academic', Charisma: 'academic',
  blaster: 'technique', melee: 'technique', tactics: 'academic', piloting: 'technique',
  tracking: 'technique', stealth: 'technique', investigation: 'academic',
  profession: 'technique', darkAbilities: 'force', healing: 'force',
};

// Loads per hour (progression-numbers §3 categories). Secondary weights from
// Docs/SW_Activity_Bank_v1.md, normalized at use (0.75 primary / 0.25 secondaries).
const SABER = { p: 1.0, m: 0.4 };
const PHYS = { p: 1.2, m: 0.2 };
const FORCE = { p: 0.4, m: 0.8 };
const STUDY = { p: 0.05, m: 1.0 };
const MEDIT = { p: 0.05, m: -0.5 };

export const ACT = {
  formDrill: { id: 'formDrill', load: SABER, primary: 'mainForm',
    secondaries: { Strength: 0.4, Agility: 0.3, Endurance: 0.2, ForceControl: 0.15 } },
  secondFormDrill: { id: 'secondFormDrill', load: SABER, primary: 'secondForm',
    secondaries: { Strength: 0.4, Agility: 0.3, Endurance: 0.2, ForceControl: 0.15 } },
  masterTraining: { id: 'masterTraining', load: SABER, primary: 'mainForm',
    secondaries: { ForceControl: 0.4, Willpower: 0.3 } },
  forceDrill: { id: 'forceDrill', load: FORCE, primary: 'ForceControl',
    secondaries: { ForceSense: 0.3, Willpower: 0.3 } },
  senseDrill: { id: 'senseDrill', load: FORCE, primary: 'ForceSense',
    secondaries: { Meditation: 0.5, Willpower: 0.3, ForceControl: 0.2 } },
  strength: { id: 'strength', load: PHYS, primary: 'Strength', secondaries: { Endurance: 0.4 } },
  cardio: { id: 'cardio', load: PHYS, primary: 'Endurance', secondaries: { Strength: 0.2, Agility: 0.2 } },
  agility: { id: 'agility', load: PHYS, primary: 'Agility', secondaries: { Endurance: 0.3, Strength: 0.2 } },
  willpowerMeditation: { id: 'willpowerMeditation', load: MEDIT, primary: 'Willpower',
    secondaries: { Meditation: 0.4, ForceControl: 0.1 } },
  meditation: { id: 'meditation', load: MEDIT, primary: 'Meditation',
    secondaries: { Willpower: 0.4, ForceSense: 0.2, ForceControl: 0.2 } },
  study: { id: 'study', load: STUDY, primary: 'ForceKnowledge', secondaries: { Willpower: 0.3 } },
  // Force disciplines without their own bank entry use "Ability drill (generic)" (§4).
  outputDrill: { id: 'outputDrill', load: FORCE, primary: 'ForceOutput',
    secondaries: { ForceControl: 0.5, Willpower: 0.3, ForceSense: 0.2 } },
  healingDrill: { id: 'healingDrill', load: FORCE, primary: 'healing',
    secondaries: { ForceControl: 0.5, Willpower: 0.3, ForceSense: 0.2 } },
  darkDrill: { id: 'darkDrill', load: FORCE, primary: 'darkAbilities',
    secondaries: { ForceControl: 0.7, Willpower: 0.5 } },
  // Non-Force careers (§4, design weights D-53).
  blasterRange: { id: 'blasterRange', load: SABER, primary: 'blaster', secondaries: { Agility: 0.4, Willpower: 0.2 } },
  meleeDrills: { id: 'meleeDrills', load: PHYS, primary: 'melee', secondaries: { Strength: 0.5, Agility: 0.4, Endurance: 0.3 } },
  piloting: { id: 'piloting', load: STUDY, primary: 'piloting', secondaries: { Intelligence: 0.3, Agility: 0.2 } },
  tracking: { id: 'tracking', load: PHYS, primary: 'tracking', secondaries: { Endurance: 0.4, Intelligence: 0.3 } },
  stealth: { id: 'stealth', load: SABER, primary: 'stealth', secondaries: { Agility: 0.5, Willpower: 0.2 } },
  investigation: { id: 'investigation', load: STUDY, primary: 'investigation', secondaries: { Intelligence: 0.5, Charisma: 0.2 } },
  academic: { id: 'academic', load: STUDY, primary: 'Intelligence', secondaries: { ForceKnowledge: 0.1 } },
  tacticsStudy: { id: 'tacticsStudy', load: STUDY, primary: 'tactics', secondaries: { Intelligence: 0.4 } },
  profession: { id: 'profession', load: STUDY, primary: 'profession', secondaries: { Intelligence: 0.2 } },
  // Design activity (M3, chosen while Jared was away): nothing in the bank trains Charisma.
  socialPractice: { id: 'socialPractice', load: STUDY, primary: 'Charisma', secondaries: { Intelligence: 0.3, Willpower: 0.2 } },
};

// Which activity trains a skill when the scheduler fills hours by archetype share.
export const TRAINS = {
  mainForm: 'formDrill', secondForm: 'secondFormDrill', ForceControl: 'forceDrill',
  ForceSense: 'senseDrill', Strength: 'strength', Agility: 'agility', Endurance: 'cardio',
  Willpower: 'willpowerMeditation', Meditation: 'meditation', ForceKnowledge: 'study',
  ForceOutput: 'outputDrill', healing: 'healingDrill', darkAbilities: 'darkDrill',
  blaster: 'blasterRange', melee: 'meleeDrills', piloting: 'piloting', tracking: 'tracking',
  stealth: 'stealth', investigation: 'investigation', Intelligence: 'academic',
  tactics: 'tacticsStudy', profession: 'profession', Charisma: 'socialPractice',
};

// Archetype weights before normalization (npc-generation.md §3; "physical w" = w each for
// Strength, Agility, Endurance; Willpower added by row 21: Jedi/Sith 0.4, others 0.2).
// The main specialty is the first key (weight 1.0); it takes 0.5 of the fill from Knight on
// (D-41) and for careers all life.
export const ARCHETYPES = {
  jediGuardian: { mainForm: 1.0, secondForm: 0.3, ForceControl: 0.6, ForceSense: 0.5,
    Strength: 0.5, Agility: 0.5, Endurance: 0.5, Willpower: 0.4 },
  jediConsular: { ForceKnowledge: 1.0, Meditation: 0.8, ForceSense: 0.8, healing: 0.8, mainForm: 0.4,
    Strength: 0.3, Agility: 0.3, Endurance: 0.3, Willpower: 0.4 },
  jediSentinel: { mainForm: 1.0, ForceSense: 0.8, investigation: 0.8, stealth: 0.8, ForceControl: 0.6,
    Strength: 0.5, Agility: 0.5, Endurance: 0.5, Willpower: 0.4 },
  sithWarrior: { mainForm: 1.0, ForceOutput: 0.8, Strength: 0.6, Agility: 0.6, Endurance: 0.6, Willpower: 0.4 },
  sithInquisitor: { ForceOutput: 1.0, darkAbilities: 0.9, ForceKnowledge: 0.7, mainForm: 0.4, Willpower: 0.4 },
  soldier: { blaster: 1.0, tactics: 0.6, Strength: 0.6, Agility: 0.6, Endurance: 0.6, Willpower: 0.2 },
  mandalorian: { blaster: 1.0, melee: 0.6, Strength: 0.8, Agility: 0.8, Endurance: 0.8, tactics: 0.5, Willpower: 0.2 },
  smuggler: { piloting: 1.0, blaster: 0.7, Charisma: 0.6, Willpower: 0.2 },
  bountyHunter: { blaster: 1.0, tracking: 0.9, melee: 0.5, Strength: 0.6, Agility: 0.6, Endurance: 0.6, Willpower: 0.2 },
  civilian: { profession: 1.0, Strength: 0.1, Agility: 0.1, Endurance: 0.1, Intelligence: 0.1, Charisma: 0.1, Willpower: 0.2 },
};
// Path and default start age per archetype (npc-generation §3).
export const ARCHETYPE_PATH = {
  jediGuardian: ['jedi', 4], jediConsular: ['jedi', 4], jediSentinel: ['jedi', 4],
  sithWarrior: ['sith', 8], sithInquisitor: ['sith', 8],
  soldier: ['career', 17], mandalorian: ['career', 8], smuggler: ['career', 17],
  bountyHunter: ['career', 17], civilian: ['career', 16],
};
export function shares(weights) {
  const tot = Object.values(weights).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / tot]));
}
