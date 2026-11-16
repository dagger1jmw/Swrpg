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
};

// Which activity trains a skill when the scheduler fills hours by archetype share.
export const TRAINS = {
  mainForm: 'formDrill', secondForm: 'secondFormDrill', ForceControl: 'forceDrill',
  ForceSense: 'senseDrill', Strength: 'strength', Agility: 'agility', Endurance: 'cardio',
  Willpower: 'willpowerMeditation', Meditation: 'meditation', ForceKnowledge: 'study',
};

// Archetype weights before normalization (npc-generation.md §3; "physical w" = w each for
// Strength, Agility, Endurance; Willpower added by row 21: Jedi/Sith 0.4, others 0.2).
export const ARCHETYPES = {
  jediGuardian: { mainForm: 1.0, secondForm: 0.3, ForceControl: 0.6, ForceSense: 0.5,
    Strength: 0.5, Agility: 0.5, Endurance: 0.5, Willpower: 0.4 },
};
export function shares(weights) {
  const tot = Object.values(weights).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / tot]));
}
