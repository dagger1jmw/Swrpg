// Computed character creation (character-creation.md §1-4; D-44, D-102, D-103, D-105). Pure: the same
// inputs always give the same character (test 6). Every starting level comes from the phase-pace
// closed form with the archetype's measured paces, adjusted by the focus sliders, talents, species
// and war years, read on the Human-equivalent age; the natural baseline is added on top by the
// progression selectors. Variance is off for player characters.
import { ARCHETYPE_BY_ID, PATH_ARCHETYPES, PATH_START_RANGE, focusShares, type ArchetypeDef, type CharacterPath, type Phase } from '../../data/archetypes';
import { TALENT_COST, TALENT_POINTS, type TalentLevel } from '../../data/progression.config';
import { AVERAGE_RANK_AGES, RANK_BY_ID, RANK_PHASE, type RankDef } from '../../data/rankMinimums';
import { CATEGORY_RULES, FORM_IDS, SKILL_BY_ID, SKILL_IDS, type TalentDomain } from '../../data/skills';
import { SPECIES_BY_ID, speciesDef } from '../../data/species';
import { DAYS_PER_YEAR, dateFromAbsDay, formatYear } from '../../engine/calendar';
import { closedFormLevel, phasesFor } from '../../engine/closedForm';
import { levelWithNatural, xpForLevel } from '../../engine/curve';
import { humanEquivalentAge, naturalLevel, speciesAgeFromHuman, speciesLearning } from '../../engine/species';
import { crossTalentMult, talentMult, type Talents } from '../../engine/speed';

export interface CreationInput {
  name: string;
  birthDay: number;
  /** The campaign start day (age is computed from it). */
  startDay: number;
  speciesId: string;
  path: CharacterPath;
  archetype: string;
  rank: string;
  trainingStartAge: number;
  mainFormId: string | null;
  secondFormId: string | null;
  /**
   * Focus shares by archetype key ('$mainForm', '$secondForm' or a skill id), summing to 1 (the UI
   * renormalizes the sliders). Absent = the archetype default (main specialty 0.5 from Knight on, D-41).
   */
  focus?: Readonly<Record<string, number>>;
  talents: Partial<Record<TalentDomain, TalentLevel>>;
  warYears?: number;
  dominantHand: 'left' | 'right';
  /** Keep an unreachable rank as a logged story exception (a battlefield promotion). */
  storyException?: boolean;
}

export interface UnmetMinimum {
  skillId: string;
  need: number;
  have: number;
}

export const VALIDATION_OPTIONS = [
  'Raise focus on the needed skills',
  'Pick a later age',
  'Pick a lower rank',
  'Keep it as a story exception (logged)',
] as const;

export interface CreationResult {
  ok: boolean;
  errors: string[];
  /** Rank minimums not met (character-creation §3). */
  unmet: UnmetMinimum[];
  /** Shown when `unmet` is not empty and no story exception was chosen. */
  options: readonly string[];
  storyException: boolean;
  /** Starting trained XP per skill (the natural baseline is not included). */
  startingXp: Record<string, number>;
  /** Preview: total levels (natural baseline included) for every skill above 0. */
  levels: Record<string, number>;
  /** Highest phase pace x multiplier used (must stay <= 4.0). */
  maxPace: number;
  /** Focus shares resolved to skill ids (stored on the character, used by the clamp). */
  focusWeights: Record<string, number>;
  /** Backstory facts (architecture §7; character-creation §4). */
  facts: string[];
}

export const ageAt = (birthDay: number, day: number): number => (day - birthDay) / DAYS_PER_YEAR;

/** Ranks a path allows at a Human-equivalent age h (character-creation §1: "the UI shows which ranks fit"). */
export function ranksFor(path: CharacterPath, h: number): RankDef[] {
  return [...RANK_BY_ID.values()].filter((r) => r.path === path && h >= r.minAge && (r.maxAge === undefined || h < r.maxAge)).sort((a, b) => a.order - b.order);
}

export function talentCost(t: Partial<Record<TalentDomain, TalentLevel>>): number {
  return Object.values(t).reduce((a, l) => a + TALENT_COST[l ?? 'none'], 0);
}

/** Resolves an archetype key to a skill id ('$mainForm' -> the chosen main form). */
function keySkill(key: string, input: Pick<CreationInput, 'mainFormId' | 'secondFormId'>): string | null {
  if (key === '$mainForm') return input.mainFormId;
  if (key === '$secondForm') return input.secondFormId;
  return key;
}

/** Rank ages for the closed-form phases, all on the Human-equivalent age (species.md §1). */
export function phaseAges(rank: string, path: CharacterPath, startAge: number, age: number): { padawanAge: number; knightAge: number; onePhase: boolean } {
  if (path === 'outsider' || path === 'career') return { padawanAge: startAge, knightAge: startAge, onePhase: true };
  const phase = RANK_PHASE[rank] ?? 'initiate';
  if (phase === 'initiate') return { padawanAge: Infinity, knightAge: Infinity, onePhase: false };
  if (phase === 'padawan') return { padawanAge: Math.max(startAge, Math.min(AVERAGE_RANK_AGES.padawan, age)), knightAge: Infinity, onePhase: false };
  const knightAge = Math.max(startAge, Math.min(AVERAGE_RANK_AGES.knight, age));
  return { padawanAge: Math.max(startAge, Math.min(AVERAGE_RANK_AGES.padawan, knightAge - 6)), knightAge, onePhase: false };
}

/** Default focus shares for an archetype (main 0.5 of the Knight+ / career fill, D-41). */
export function defaultFocus(a: ArchetypeDef): Record<string, number> {
  return focusShares(a.weights, a.main, 0.5);
}

export function computeCreation(input: CreationInput): CreationResult {
  const errors: string[] = [];
  const a = ARCHETYPE_BY_ID.get(input.archetype);
  const species = SPECIES_BY_ID.get(input.speciesId);
  const rankDef = RANK_BY_ID.get(input.rank);
  const age = ageAt(input.birthDay, input.startDay);
  // Life-stage gates read the Human-equivalent age (species.md §1); unknown species fall back to Human.
  const hNow = species ? humanEquivalentAge(species, age) : age;
  const hStartIn = species ? humanEquivalentAge(species, input.trainingStartAge) : input.trainingStartAge;
  if (!a) errors.push(`Unknown archetype ${input.archetype}.`);
  if (!species) errors.push(`Unknown species ${input.speciesId}.`);
  if (!rankDef) errors.push(`Unknown rank ${input.rank}.`);
  if (a && !PATH_ARCHETYPES[input.path].includes(a.id)) errors.push(`${a.name} is not an archetype of the ${input.path} path.`);
  if (rankDef && rankDef.path !== input.path) errors.push(`${rankDef.name} is not a rank of the ${input.path} path.`);
  if (rankDef && !ranksFor(input.path, hNow).some((r) => r.id === rankDef.id)) errors.push(`${rankDef.name} does not fit age ${age.toFixed(1)}.`);
  const [lo, hi] = PATH_START_RANGE[input.path];
  if (!(hStartIn >= lo - 1e-9 && hStartIn <= hi + 1e-9)) errors.push(`Training start age must be ${lo}-${hi} (Human-equivalent) for this path.`);
  if (input.trainingStartAge > age) errors.push('Training cannot start after the campaign start.');
  if (talentCost(input.talents) > TALENT_POINTS) errors.push(`Talents cost ${talentCost(input.talents)} points; the limit is ${TALENT_POINTS}.`);
  for (const f of [input.mainFormId, input.secondFormId]) if (f !== null && !FORM_IDS.includes(f)) errors.push(`${f} is not a lightsaber form.`);
  if (input.mainFormId !== null && input.mainFormId === input.secondFormId) errors.push('The second form must differ from the main form.');
  const usesMainForm = a ? Object.keys(a.weights).includes('$mainForm') || input.path === 'jedi' || input.path === 'sith' : false;
  if (usesMainForm && input.mainFormId === null) errors.push('Choose a main lightsaber form.');
  const focusIn = input.focus;
  if (focusIn) {
    const total = Object.values(focusIn).reduce((x, y) => x + y, 0);
    if (Math.abs(total - 1) > 1e-6) errors.push('Focus shares must sum to 1.');
    if (a) for (const k of Object.keys(focusIn)) if (!(k in a.weights)) errors.push(`Focus key ${k} is not in the archetype.`);
  }
  const empty: CreationResult = { ok: false, errors, unmet: [], options: [], storyException: false, startingXp: {}, levels: {}, maxPace: 0, focusWeights: {}, facts: [] };
  if (errors.length || !a || !species || !rankDef) return empty;

  const def = defaultFocus(a);
  const focus = focusIn ?? def;
  const mainKnight = a.paces.knight?.[a.main] ?? 1;
  const h = hNow;
  const hStart = hStartIn;
  const ages = phaseAges(rankDef.id, input.path, hStart, h);
  const hAges = { padawanAge: ages.padawanAge, knightAge: ages.knightAge };
  const talents: Talents = input.talents;
  const warYears = input.warYears ?? 0;

  // Outsiders and careers train in one phase at the Knight+ factor (M3 plan: same budget, same 0.5 share).
  const phaseKeys: Phase[] = ages.onePhase ? ['knight'] : ['initiate', 'padawan', 'knight'];
  const keysBySkill = new Map<string, string>();
  for (const ph of phaseKeys) for (const key of Object.keys(a.paces[ph] ?? {})) {
    const skill = keySkill(key, input);
    if (skill && SKILL_BY_ID.has(skill) && !keysBySkill.has(skill)) keysBySkill.set(skill, key);
  }
  for (const key of Object.keys(focus)) {
    const skill = keySkill(key, input);
    if (skill && SKILL_BY_ID.has(skill) && !keysBySkill.has(skill)) keysBySkill.set(skill, key);
  }

  const startingXp: Record<string, number> = {};
  const levels: Record<string, number> = {};
  let maxPace = 0;
  for (const [skill, key] of keysBySkill) {
    const pace = (ph: Phase): number => {
      let p = a.paces[ph]?.[key] ?? 0;
      // Focus sliders change the Knight+ / career pace by Delta share x 2 x the main Knight+ pace (D-105).
      if (ph === 'knight') p = Math.max(0, p + ((focus[key] ?? 0) - (def[key] ?? 0)) * 2 * mainKnight);
      return p;
    };
    const mult = talentMult(talents, skill) * crossTalentMult(talents, skill) * speciesLearning(species.id, skill);
    const phases = phasesFor({ initiate: pace('initiate'), padawan: pace('padawan'), knight: pace('knight') }, hAges, ages.onePhase);
    for (const ph of phases) if (ph.to > hStart && ph.from < h) maxPace = Math.max(maxPace, Math.min(4, ph.pace * mult));
    const row = CATEGORY_RULES[SKILL_BY_ID.get(skill)!.category].ageRow;
    const trained = closedFormLevel({ row, startAge: hStart, age: h, phases, mult, warYears });
    if (trained > 0) startingXp[skill] = xpForLevel(trained);
  }
  for (const id of SKILL_IDS) {
    const n = naturalLevel(id, species.id, age);
    const lv = levelWithNatural(startingXp[id] ?? 0, n);
    if (lv > 0) levels[id] = lv;
  }

  // Rank minimums (ranks.md; character-creation §3).
  const unmet: UnmetMinimum[] = [];
  for (const [key, need] of Object.entries(rankDef.minimums)) {
    const skill = key === '$main' ? keySkill(a.main, input) : keySkill(key, input);
    if (!skill) continue;
    const have = Math.floor((levels[skill] ?? 0) + 1e-9);
    if (have < need) unmet.push({ skillId: skill, need, have });
  }
  const storyException = unmet.length > 0 && input.storyException === true;
  const focusWeights: Record<string, number> = {};
  for (const [key, share] of Object.entries(focus)) {
    const skill = keySkill(key, input);
    if (skill && SKILL_BY_ID.has(skill)) focusWeights[skill] = (focusWeights[skill] ?? 0) + share;
  }
  const facts = backstory(input, a, rankDef, h, storyException, unmet);
  return {
    ok: unmet.length === 0 || storyException,
    errors,
    unmet,
    options: unmet.length && !storyException ? VALIDATION_OPTIONS : [],
    storyException,
    startingXp,
    levels,
    maxPace,
    focusWeights,
    facts,
  };
}

/** The Temple by start date (ranks.md era notes, L-03): Coruscant before 3,653 BBY, Tython from then. */
function templeFor(year: number): string {
  return year < -3653 ? 'the Jedi Temple on Coruscant' : 'the Jedi Temple on Tython';
}

function backstory(input: CreationInput, a: ArchetypeDef, rank: RankDef, h: number, exception: boolean, unmet: UnmetMinimum[]): string[] {
  const facts: string[] = [];
  const birthYear = dateFromAbsDay(input.birthDay).year;
  const startYear = dateFromAbsDay(Math.round(input.birthDay + input.trainingStartAge * DAYS_PER_YEAR)).year;
  const sp = speciesDef(input.speciesId).name;
  const form = input.mainFormId ? SKILL_BY_ID.get(input.mainFormId)?.name : null;
  facts.push(`${input.name} is a ${sp}, born in ${formatYear(birthYear)}.`);
  if (input.path === 'jedi') facts.push(`Began training at age ${Math.round(input.trainingStartAge)} at ${templeFor(startYear)}.`);
  else if (input.path === 'sith') facts.push(`Entered the Sith Academy on Korriban at age ${Math.round(input.trainingStartAge)}.`);
  else if (input.path === 'outsider') facts.push(`A Force-sensitive outsider, self-taught since age ${Math.round(input.trainingStartAge)} without the Jedi or the Sith.`);
  else facts.push(`Began training as a ${a.name.toLowerCase()} at age ${Math.round(input.trainingStartAge)}.`);
  facts.push(`Trains as a ${a.name}${form ? `; main lightsaber form ${form}` : ''}.`);
  const phase = RANK_PHASE[rank.id];
  const spec = speciesDef(input.speciesId);
  const hAges = phaseAges(rank.id, input.path, humanEquivalentAge(spec, input.trainingStartAge), h);
  const ages = { padawanAge: speciesAgeFromHuman(spec, hAges.padawanAge), knightAge: speciesAgeFromHuman(spec, hAges.knightAge) };
  if ((input.path === 'jedi' || input.path === 'sith') && phase !== 'initiate') facts.push(`Became ${input.path === 'jedi' ? 'a Padawan' : 'an apprentice'} at about age ${Math.round(ages.padawanAge)}.`);
  if ((input.path === 'jedi' || input.path === 'sith') && phase === 'knight') facts.push(`${input.path === 'jedi' ? 'Knighted' : 'Recognized as a Sith Lord'} at about age ${Math.round(ages.knightAge)}.`);
  if (rank.id === 'master') facts.push('Holds the rank of Jedi Master.');
  if ((input.warYears ?? 0) > 0) facts.push(`Served ${input.warYears} year${input.warYears === 1 ? '' : 's'} in the war.`);
  for (const [domain, level] of Object.entries(input.talents)) if (level && level !== 'none') facts.push(`Recognized as ${level === 'gifted' ? 'gifted' : `a ${level === 'prodigy' ? 'prodigy' : 'exceptional talent'}`} in ${domain === 'combat' ? 'combat' : domain === 'force' ? 'the Force' : domain === 'physical' ? 'physical training' : 'study'}.`);
  if (exception) facts.push(`Holds the rank of ${rank.name} as a story exception (a battlefield promotion) without meeting ${unmet.map((u) => `${SKILL_BY_ID.get(u.skillId)?.name ?? u.skillId} ${u.need}`).join(', ')}.`);
  return facts;
}
