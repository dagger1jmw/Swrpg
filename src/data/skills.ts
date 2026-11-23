// Skill registry (spec/skills-and-activities.md §1-2, D-53). Every skill has one category; the
// category picks its age row (progression-numbers §16), rust row (§13), body-cap rule (§11) and
// talent domain (M3 plan, D-107). Unknown skill ids are rejected; there are no aliases (D-07).
// Force abilities are limited to what the archetypes and activities need in M3; the full
// catalog (spec/force-catalog.md) arrives in M6.

export const SKILL_CATEGORIES = ['technique', 'force', 'wisdom', 'knowledge', 'physical', 'academic'] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/** Age rows of progression-numbers §16. */
export type AgeRow = 'technique' | 'wisdom' | 'physical' | 'academic';
/** Rust rows of progression-numbers §13. */
export type RustRow = 'technique' | 'physical' | 'knowledge';
/** Talent domains (M3 plan, D-107): combat = technique, Force = force, physical, mind = wisdom, knowledge, academic. */
export const TALENT_DOMAINS = ['combat', 'force', 'physical', 'mind'] as const;
export type TalentDomain = (typeof TALENT_DOMAINS)[number];

export interface CategoryRules {
  ageRow: AgeRow;
  rustRow: RustRow;
  bodyCapped: boolean;
  domain: TalentDomain;
}

/** skills-and-activities.md §1. */
export const CATEGORY_RULES: Record<SkillCategory, CategoryRules> = {
  technique: { ageRow: 'technique', rustRow: 'technique', bodyCapped: false, domain: 'combat' },
  force: { ageRow: 'technique', rustRow: 'technique', bodyCapped: false, domain: 'force' },
  wisdom: { ageRow: 'wisdom', rustRow: 'technique', bodyCapped: false, domain: 'mind' },
  knowledge: { ageRow: 'wisdom', rustRow: 'knowledge', bodyCapped: false, domain: 'mind' },
  physical: { ageRow: 'physical', rustRow: 'physical', bodyCapped: true, domain: 'physical' },
  academic: { ageRow: 'academic', rustRow: 'knowledge', bodyCapped: false, domain: 'mind' },
};

export type SkillKind = 'stat' | 'form' | 'forceAbility' | 'career';
export type ForceUse = 'combat' | 'nonCombat' | 'both';
export type ForceSide = 'light' | 'neutral' | 'dark';

export interface SkillDef {
  id: string;
  name: string;
  category: SkillCategory;
  kind: SkillKind;
  /** Lightsaber forms: the form group that shares E (progression-numbers §7). */
  formGroup?: string;
  /** Aggressive forms take anger channeling (progression-numbers §17). */
  aggressive?: boolean;
  /** Force abilities (force-catalog.md fields, the subset M3 needs). */
  forceUse?: ForceUse;
  side?: ForceSide;
  parent?: string;
  /** The Body Enhancement family: the "Force body-ability level" (progression-numbers §11). */
  bodyAbility?: boolean;
  /** Sensory abilities take Force Sense synergy (progression-numbers §14). */
  sensory?: boolean;
}

const stat = (id: string, name: string, category: SkillCategory): SkillDef => ({ id, name, category, kind: 'stat' });
const form = (id: string, name: string, group: string, aggressive = false): SkillDef => ({
  id,
  name,
  category: 'technique',
  kind: 'form',
  formGroup: group,
  ...(aggressive ? { aggressive } : {}),
});
const ability = (id: string, name: string, use: ForceUse, side: ForceSide, extra: Partial<SkillDef> = {}): SkillDef => ({
  id,
  name,
  category: 'force',
  kind: 'forceAbility',
  forceUse: use,
  side,
  ...extra,
});
const career = (id: string, name: string, category: SkillCategory): SkillDef => ({ id, name, category, kind: 'career' });

export const SKILLS: readonly SkillDef[] = [
  stat('strength', 'Strength', 'physical'),
  stat('agility', 'Agility', 'physical'),
  stat('endurance', 'Endurance', 'physical'),
  stat('willpower', 'Willpower', 'wisdom'),
  stat('charisma', 'Charisma', 'academic'),
  stat('intelligence', 'Intelligence', 'academic'),
  stat('forceSense', 'Force Sense', 'force'),
  stat('forceControl', 'Force Control', 'force'),
  stat('forceOutput', 'Force Output', 'force'),
  stat('meditation', 'Meditation', 'wisdom'),
  stat('forceKnowledge', 'Force Knowledge', 'knowledge'),
  form('shiiCho', 'Shii-Cho', 'shiiCho'),
  form('makashi', 'Makashi', 'makashi'),
  form('soresu', 'Soresu', 'soresu'),
  form('ataru', 'Ataru', 'ataru'),
  form('shien', 'Shien', 'shienDjemSo'),
  form('djemSo', 'Djem So', 'shienDjemSo', true),
  form('niman', 'Niman', 'niman'),
  form('juyo', 'Juyo', 'juyoVaapad', true),
  form('vaapad', 'Vaapad', 'juyoVaapad', true),
  form('trakata', 'Tràkata', 'trakata'),
  form('jarKai', "Jar'Kai", 'jarKai'),
  form('sokan', 'Sokan', 'sokan'),
  form('dunMoch', 'Dun Möch', 'dunMoch'),
  form('zeroG', 'Zero-G Combat', 'zeroG'),
  form('saberstaff', 'Saberstaff', 'saberstaff'),
  ability('telekinesis', 'Telekinesis', 'both', 'neutral'),
  ability('forcePush', 'Force Push', 'both', 'neutral', { parent: 'telekinesis' }),
  ability('forceBarrier', 'Force Barrier', 'combat', 'neutral'),
  ability('forceSpeed', 'Force Speed', 'both', 'neutral', { bodyAbility: true }),
  ability('forceJump', 'Force Jump', 'both', 'neutral', { bodyAbility: true }),
  ability('mindTrick', 'Mind Trick', 'nonCombat', 'neutral'),
  ability('forceAbsorb', 'Force Absorb', 'combat', 'light'),
  ability('battleMeditation', 'Battle Meditation', 'both', 'light'),
  ability('forceLightning', 'Force Lightning', 'combat', 'dark'),
  ability('forceChoke', 'Force Choke', 'combat', 'dark'),
  ability('forceHealSelf', 'Force Heal (Self)', 'nonCombat', 'light'),
  ability('forceHealOthers', 'Force Heal (Others)', 'nonCombat', 'light'),
  ability('revitalize', 'Revitalize', 'nonCombat', 'light'),
  // The forbidden powers (D-346; force-catalog-m6 §3, §5; D-436): in the catalog for the Order's rules; their combat
  // effects are narrator-only until the M6 catalog integration gives them rules.
  ability('electricJudgment', 'Electric Judgment', 'combat', 'light'),
  ability('deadlySight', 'Deadly Sight', 'combat', 'dark'),
  ability('morichro', 'Morichro', 'both', 'light'),
  career('blaster', 'Blaster', 'technique'),
  career('melee', 'Melee', 'technique'),
  career('piloting', 'Piloting', 'technique'),
  career('tracking', 'Tracking', 'technique'),
  career('stealth', 'Stealth', 'technique'),
  career('investigation', 'Investigation', 'academic'),
  career('tactics', 'Tactics', 'academic'),
  career('medicine', 'Medicine', 'academic'),
  // Profession:<kind> (civilian archetype) is one skill in M3; kinds are story flavor (D-108).
  career('profession', 'Profession', 'technique'),
];

export const SKILL_BY_ID: ReadonlyMap<string, SkillDef> = new Map(SKILLS.map((s) => [s.id, s]));
export const SKILL_IDS: readonly string[] = SKILLS.map((s) => s.id);
export const FORM_IDS: readonly string[] = SKILLS.filter((s) => s.kind === 'form').map((s) => s.id);
export const PHYSICAL_STATS = ['strength', 'agility', 'endurance'] as const;
export type PhysicalStat = (typeof PHYSICAL_STATS)[number];

export function isSkillId(id: string): boolean {
  return SKILL_BY_ID.has(id);
}

/** The skill's definition; throws on an unknown id (callers validate first). */
export function skillDef(id: string): SkillDef {
  const s = SKILL_BY_ID.get(id);
  if (!s) throw new Error(`Unknown skill id: ${id}`);
  return s;
}

export function categoryRules(id: string): CategoryRules {
  return CATEGORY_RULES[skillDef(id).category];
}
