// Computed character creation (character-creation.md §1-4; D-44, D-102, D-103, D-105, D-118, D-119).
// Pure: the same inputs always give the same character (test 6). Every starting level comes from the
// phase-pace closed form with the archetype's measured paces, adjusted by the focus sliders, talents,
// species and war years, read on the Human-equivalent age; the natural baseline is added on top by the
// progression selectors. Lightsaber forms follow the form plans: Initiates train only Shii-Cho; from
// Padawan the plan splits the 2 h master session and the 1 h solo hour among any forms, and each form's
// first phase starts it at 0.75 x the highest form (the fundamentals transfer). Variance is off.
import { orderHomelessAt, orderSeatAt } from '../../data/orderSeats';
import { STUB_INSTRUCTOR_LEAD, STUB_MASTER_LEAD } from '../../data/stubs';
import { gainE, sparringE } from '../../engine/appliedExperience';
import { ARCHETYPE_BY_ID, ARCHETYPE_FORCE_ABILITIES, NPC_ARCHETYPES, PATH_ARCHETYPES, PATH_START_RANGE, focusShares, type ArchetypeDef, type CharacterPath, type Phase } from '../../data/archetypes';
import { BUDGET, CAREER_YOUTH_TO, FORM_TRANSFER_SHARE, LONG_LIFE, K, TALENT_COST, TALENT_POINTS, type TalentLevel } from '../../data/progression.config';
import { orderHoursAt } from '../../data/orderRequirements';
import { INITIATE_CURRICULUM, closedFormCurriculum } from '../../data/initiateCurriculum';
import { interp } from '../../engine/interp';
import { AVERAGE_RANK_AGES, KNIGHT_TRIALS, RANK_BY_ID, RANK_PHASE, type RankDef } from '../../data/rankMinimums';
import { CATEGORY_RULES, FORM_IDS, PHYSICAL_STATS, SKILL_BY_ID, SKILL_IDS, type TalentDomain } from '../../data/skills';
import { SPECIES_BY_ID, speciesDef, speciesOfferedAt } from '../../data/species';
import { DAYS_PER_YEAR, dateFromAbsDay, formatYear } from '../../engine/calendar';
import { HUMAN_YEARS, closedFormLevel, formXps, phasesFor, planSplit, type AgeYears, type FormPlan } from '../../engine/closedForm';
import { npcNaturalLevel, npcWillpowerShare, npcYears } from '../../engine/npcHours';
import { levelExact, levelWithNatural, xpForLevel } from '../../engine/curve';
import { trackedSenseXp } from '../../engine/forceSense';
import { ageLoss, bodyAgeFromH } from '../../engine/ageing';
import { ageFromTraining, bodyCapAt, humanEquivalentAge, naturalLevel, speciesLearning, trainingAge, trainingAgeFactor, trainingIntegral } from '../../engine/species';
import { crossTalentMult, isForceXpSkill, isOutsideForce, talentMult, type Talents } from '../../engine/speed';

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
  /**
   * Padawan form plan (D-118): form id -> hours of the 2 h master session + 1 h solo hour (sums to 3).
   * Shii-Cho may be in it or not. Default: Soresu 2 h, Ataru 1 h (the Average).
   */
  padawanPlan?: FormPlan;
  /** Knight+ form plan (hours, any total; only the proportions count). Default: the Padawan plan. */
  knightPlan?: FormPlan;
  /**
   * Focus shares by archetype key ('$forms' for all lightsaber forms, or a skill id), summing to 1 (the
   * UI renormalizes the sliders). Absent = the archetype default (main specialty 0.5 from Knight on, D-41).
   */
  focus?: Readonly<Record<string, number>>;
  talents: Partial<Record<TalentDomain, TalentLevel>>;
  warYears?: number;
  dominantHand: 'left' | 'right';
  /** Keep an unreachable rank as a logged story exception (a battlefield promotion). */
  storyException?: boolean;
  /** Per-skill pace variance (NPC generation, npc-generation §1: exp(N(0, 0.12))); off for player characters. */
  variance?: ((skillId: string) => number) | undefined;
  /** NPC generation: the line under a canon figure whose sheet has its Willpower (D-499: sheeted figures are unaffected). */
  sheetedWillpower?: boolean;
  /** NPC generation: skip the talent limit and the rank-minimum validation (levels are what they are). */
  npc?: boolean;
  /**
   * NPC generation: the real ages the Padawan and Knight phases start, from a canon figure's rank spans (D-414: rank
   * spans shape the curve). Absent = the rank's average ages (phaseAges). Infinity = not reached.
   */
  phases?: { padawanAge: number; knightAge: number };
  /**
   * Ignore the 3-point talent limit (D-116): any number of talents, each still at most exceptional;
   * the 2.8 M cap and the 4.0x pace limit still apply. The campaign is flagged unbalanced.
   */
  ignoreTalentLimit?: boolean;
  /**
   * NPC generation (D-447, D-453): the figure is outside the Force (no Force XP or powers). The generator passes it because
   * it builds an unknown species (the Yuuzhan Vong) on the human body; absent = read from `speciesId`.
   */
  outsideForce?: boolean;
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
  /** True when the talent limit was ignored (D-116). */
  unbalanced: boolean;
  /** Starting trained XP per skill (the natural baseline is not included). */
  startingXp: Record<string, number>;
  /** Starting applied experience per form group and combat integration per combat Force ability (character-creation §2; M5). */
  startingE: Record<string, { E: number; eSpar: number }>;
  startingCI: Record<string, { CI: number; ciSpar: number }>;
  /** Preview: total levels (natural baseline included) for every skill above 0. */
  levels: Record<string, number>;
  /** Highest phase pace x multiplier used (must stay <= 4.0). */
  maxPace: number;
  /** Focus shares resolved to skill ids (stored on the character, used by the clamp). */
  focusWeights: Record<string, number>;
  /** The form plans in force (stored on the character). */
  formPlan: { padawan: Record<string, number>; knight: Record<string, number> };
  /** The current phase's main and second form (Initiates: Shii-Cho and none). */
  mainFormId: string | null;
  secondFormId: string | null;
  /** The highest form and its level (every "main form" minimum reads it, D-118). */
  highestForm: { id: string; level: number } | null;
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

/** The Average's Padawan form plan (D-118): main Soresu 2 h with the master, second Ataru 1 h solo. */
export const DEFAULT_FORM_PLAN: Readonly<Record<string, number>> = { soresu: 2, ataru: 1 };
/**
 * Sith default form plans (Jared, D-423: the Sith should not default to Soresu). From the hand-set Sith sheets' leading
 * forms: Warriors Djem So and Shien (6 of 7 sheets), Inquisitors Makashi, with Niman beside it (Vitiate's sheet).
 */
export const DEFAULT_FORM_PLAN_BY_ARCHETYPE: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  sithWarrior: { djemSo: 2, shien: 1 },
  sithInquisitor: { makashi: 2, niman: 1 },
};
/** An archetype's default Padawan form plan. */
export const defaultFormPlan = (archetype: string): Readonly<Record<string, number>> => DEFAULT_FORM_PLAN_BY_ARCHETYPE[archetype] ?? DEFAULT_FORM_PLAN;
/** Hours of the Padawan form plan: the 2 h master session + the 1 h solo hour. */
export const PADAWAN_PLAN_HOURS = 3;

/** The forms pool key in focus shares (the archetype weights '$mainForm' and '$secondForm' together). */
export const FORMS_KEY = '$forms';
const isFormKey = (k: string): boolean => k === '$mainForm' || k === '$secondForm';

/** Archetype weights with the form keys merged into the forms pool. */
function poolWeights(w: Readonly<Record<string, number>>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(w)) {
    const key = isFormKey(k) ? FORMS_KEY : k;
    out[key] = (out[key] ?? 0) + v;
  }
  return out;
}

/** Forms of a plan by hours, largest first. */
export function planOrder(plan: FormPlan): string[] {
  return Object.entries(plan)
    .filter(([, h]) => h > 0)
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
    .map(([f]) => f);
}

/** Rank ages for the closed-form phases, all on the training age (D-474). */
export function phaseAges(rank: string, path: CharacterPath, startAge: number, age: number): { padawanAge: number; knightAge: number; onePhase: boolean } {
  if (path === 'outsider' || path === 'career') return { padawanAge: startAge, knightAge: startAge, onePhase: true };
  const phase = RANK_PHASE[rank] ?? 'initiate';
  if (phase === 'initiate') return { padawanAge: Infinity, knightAge: Infinity, onePhase: false };
  if (phase === 'padawan') return { padawanAge: Math.max(startAge, Math.min(AVERAGE_RANK_AGES.padawan, age)), knightAge: Infinity, onePhase: false };
  const knightAge = Math.max(startAge, Math.min(AVERAGE_RANK_AGES.knight, age));
  return { padawanAge: Math.max(startAge, Math.min(AVERAGE_RANK_AGES.padawan, knightAge - KNIGHT_TRIALS.padawanYears)), knightAge, onePhase: false };
}

/** The Knight+ standard day (budget 6 h, no Order hours) that the focus formula is measured on. */
const REFERENCE_FILL_HOURS = BUDGET.standard[BUDGET.standard.length - 1]![1];
/** The phase's fixed Order hours at a training age (D-431: the young Padawan's hours are scaled). */
const orderHours = (phase: Phase, age: number): number => (phase === 'knight' ? 0 : orderHoursAt(phase, age));

/** Mean fill hours (standard budget minus Order hours, never below 0) over [from, to], over the reference day. */
export function fillFactor(phase: Phase, from: number, to: number): number {
  if (!(to > from) || !Number.isFinite(from)) return phase === 'knight' ? 1 : 0;
  const end = Number.isFinite(to) ? to : from + 1;
  const steps = Math.max(1, Math.ceil((end - from) / 0.1));
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    const x = from + ((i + 0.5) * (end - from)) / steps;
    sum += Math.max(0, interp(BUDGET.standard, x) - orderHours(phase, x));
  }
  return sum / steps / REFERENCE_FILL_HOURS;
}

/** Default focus shares for an archetype (main 0.5 of the Knight+ / career fill, D-41), forms pooled. */
export function defaultFocus(a: ArchetypeDef): Record<string, number> {
  return poolWeights(focusShares(a.weights, a.main, 0.5));
}

export function computeCreation(input: CreationInput): CreationResult {
  const errors: string[] = [];
  const a = ARCHETYPE_BY_ID.get(input.archetype);
  const species = SPECIES_BY_ID.get(input.speciesId);
  const rankDef = RANK_BY_ID.get(input.rank);
  const age = ageAt(input.birthDay, input.startDay);
  // Training and rank ages read the training age (real years from adulthood, D-474), the body the Human-equivalent age
  // (species.md §1); unknown species fall back to Human.
  // NPCs (D-429): a figure past its species' full life accrues no more (Zym, a Kel Dor of 120, read as 179 before).
  const lived = input.npc && species ? Math.min(species.lifespan, age) : age;
  const tNow = species ? trainingAge(species, lived) : age;
  const tStartIn = species ? trainingAge(species, input.trainingStartAge) : input.trainingStartAge;
  if (!a) errors.push(`Unknown archetype ${input.archetype}.`);
  if (!species) errors.push(`Unknown species ${input.speciesId}.`);
  // D-399 [20], [21]: players pick from the species offered for the start year (NPCs may be any species in the table).
  else if (!input.npc && !speciesOfferedAt(dateFromAbsDay(input.startDay).year).some((s) => s.id === species.id))
    errors.push(species.playable ? `${species.name} are not known to the galaxy in ${formatYear(dateFromAbsDay(input.startDay).year)}.` : `${species.name} are not offered at character creation.`);
  if (!rankDef) errors.push(`Unknown rank ${input.rank}.`);
  if (a && !PATH_ARCHETYPES[input.path].includes(a.id) && !(input.npc && NPC_ARCHETYPES[input.path].includes(a.id))) errors.push(`${a.name} is not an archetype of the ${input.path} path.`);
  if (rankDef && rankDef.path !== input.path) errors.push(`${rankDef.name} is not a rank of the ${input.path} path.`);
  if (rankDef && !ranksFor(input.path, tNow).some((r) => r.id === rankDef.id)) errors.push(`${rankDef.name} does not fit age ${age.toFixed(1)}.`);
  const [lo, hi] = PATH_START_RANGE[input.path];
  if (!(tStartIn >= lo - 1e-9 && tStartIn <= hi + 1e-9)) errors.push(`Training start age must be ${lo}-${hi} (Human-equivalent) for this path.`);
  if (input.trainingStartAge > age) errors.push('Training cannot start after the campaign start.');
  if (!input.ignoreTalentLimit && !input.npc && talentCost(input.talents) > TALENT_POINTS) errors.push(`Talents cost ${talentCost(input.talents)} points; the limit is ${TALENT_POINTS}.`);
  const padawanPlan: Record<string, number> = { ...(input.padawanPlan ?? defaultFormPlan(input.archetype)) };
  const knightPlan: Record<string, number> = { ...(input.knightPlan ?? padawanPlan) };
  for (const [name, plan] of [
    ['Padawan', padawanPlan],
    ['Knight', knightPlan],
  ] as const) {
    for (const [f, hrs] of Object.entries(plan)) {
      if (!FORM_IDS.includes(f)) errors.push(`${f} is not a lightsaber form.`);
      if (!(hrs >= 0)) errors.push(`${name} form plan hours must be 0 or more.`);
    }
    if (!planOrder(plan).length) errors.push(`The ${name} form plan needs at least one form.`);
  }
  const padTotal = Object.values(padawanPlan).reduce((x, y) => x + y, 0);
  if (Math.abs(padTotal - PADAWAN_PLAN_HOURS) > 1e-3) errors.push(`The Padawan form plan must total ${PADAWAN_PLAN_HOURS} h (2 h with the master + 1 h solo).`);
  const focusIn = input.focus;
  if (focusIn) {
    const total = Object.values(focusIn).reduce((x, y) => x + y, 0);
    if (Math.abs(total - 1) > 1e-6) errors.push('Focus shares must sum to 1.');
    if (a) for (const k of Object.keys(focusIn)) if (!(k in poolWeights(a.weights))) errors.push(`Focus key ${k} is not in the archetype.`);
  }
  const unbalanced = input.ignoreTalentLimit === true && talentCost(input.talents) > TALENT_POINTS;
  const empty: CreationResult = {
    ok: false,
    errors,
    unmet: [],
    options: [],
    storyException: false,
    unbalanced,
    startingXp: {},
    startingE: {},
    startingCI: {},
    levels: {},
    maxPace: 0,
    focusWeights: {},
    formPlan: { padawan: padawanPlan, knight: knightPlan },
    mainFormId: null,
    secondFormId: null,
    highestForm: null,
    facts: [],
  };
  if (errors.length || !a || !species || !rankDef) return empty;

  const def = defaultFocus(a);
  const focus = focusIn ?? def;
  // Pace per unit of focus share at Knight+ (D-105): the main specialty's pace over its default share.
  const mainKey = isFormKey(a.main) ? FORMS_KEY : a.main;
  const mainKnightPace = mainKey === FORMS_KEY ? (a.formPaces.knight?.fill ?? 0) : (a.paces.knight?.[mainKey] ?? 0);
  const perShare = (def[mainKey] ?? 0) > 0 ? mainKnightPace / def[mainKey]! : 0;
  const h = tNow;
  const hStart = tStartIn;
  const full: AgeYears | undefined = species.id === 'human' ? undefined : { integral: (row, x, y) => trainingIntegral(species, row, x, y), factor: (row, x) => trainingAgeFactor(species, row, x) };
  // An NPC's training day falls from about 50 on (D-497); the player's never does.
  const years = input.npc ? npcYears(species, full ?? HUMAN_YEARS) : full;
  // Its Willpower training stops there (D-499), except in the line under a canon sheet's Willpower.
  const willpowerYears = input.npc && !input.sheetedWillpower ? npcYears(species, full ?? HUMAN_YEARS, npcWillpowerShare) : years;
  const ages0 = phaseAges(rankDef.id, input.path, hStart, h);
  const he = (x: number): number => (Number.isFinite(x) ? trainingAge(species, x) : Infinity);
  const phasesIn = input.phases;
  const ages = phasesIn && !ages0.onePhase
    ? (() => {
        const knightAge = Math.max(hStart, he(phasesIn.knightAge));
        return { ...ages0, knightAge, padawanAge: Math.min(knightAge, Math.max(hStart, he(phasesIn.padawanAge))) };
      })()
    : ages0;
  const hAges = { padawanAge: ages.padawanAge, knightAge: ages.knightAge };
  const talents: Talents = input.talents;
  const warYears = input.warYears ?? 0;

  // Outsiders and careers train in one phase at the Knight+ factor (M3 plan: same budget, same 0.5 share).
  const phaseKeys: Phase[] = ages.onePhase ? ['knight'] : ['initiate', 'padawan', 'knight'];
  const keysBySkill = new Map<string, string>();
  for (const ph of phaseKeys) for (const key of Object.keys(a.paces[ph] ?? {})) if (SKILL_BY_ID.has(key) && !keysBySkill.has(key)) keysBySkill.set(key, key);
  for (const key of Object.keys(focus)) if (key !== FORMS_KEY && SKILL_BY_ID.has(key) && !keysBySkill.has(key)) keysBySkill.set(key, key);
  // Order-trained Force abilities (D-191): a share of the parent stat's pace; an ability the archetype measures stays measured.
  const derived = ARCHETYPE_FORCE_ABILITIES[a.id] ?? {};
  for (const id of Object.keys(derived)) if (SKILL_BY_ID.has(id) && !keysBySkill.has(id)) keysBySkill.set(id, id);

  // How much of each phase's day is player-directed fill (budget minus Order hours), relative to the
  // Knight+ day the focus formula is measured on (D-115). Initiates and Padawans fill only a little.
  const fill = {
    initiate: fillFactor('initiate', hStart, Math.min(h, hAges.padawanAge)),
    padawan: fillFactor('padawan', Math.max(hStart, hAges.padawanAge), Math.min(h, hAges.knightAge)),
    knight: fillFactor('knight', ages.onePhase ? hStart : Math.max(hStart, hAges.knightAge), h),
  };
  const startingXp: Record<string, number> = {};
  const levels: Record<string, number> = {};
  let maxPace = 0;
  // The ends of the rank phases lived, for Force Sense's closed form (D-495).
  const stretchEnds = [...new Set([hAges.padawanAge, hAges.knightAge, h].filter((x) => x > hStart && x <= h))].sort((x, y) => x - y);
  const stretch: { forceSense?: number[]; forceControl?: number[] } = {};
  // Focus sliders move a phase's pace by Delta share x the Knight+ pace per share (D-105), scaled by the phase's share
  // of fill hours (D-115: the Order-fixed phases move by their fill only).
  const ownPace = (key: string, ph: Phase): number => Math.max(0, (a.paces[ph]?.[key] ?? 0) + ((focus[key] ?? 0) - (def[key] ?? 0)) * perShare * fill[ph]);
  // The career youth phase (D-461): its own measured pace to CAREER_YOUTH_TO; focus moves it by the youth years' fill.
  const youth = a.youthPaces && ages.onePhase ? a.youthPaces : null;
  const fillYouth = youth ? fillFactor('knight', hStart, Math.min(h, CAREER_YOUTH_TO)) : 0;
  const ownYouth = (key: string): number => Math.max(0, (youth?.[key] ?? 0) + ((focus[key] ?? 0) - (def[key] ?? 0)) * perShare * fillYouth);
  for (const [skill, key] of keysBySkill) {
    const d = a.paces.knight?.[key] !== undefined || a.paces.padawan?.[key] !== undefined || a.paces.initiate?.[key] !== undefined ? undefined : derived[key];
    // The daily-life blocks (D-427) are in the measured paces since D-431 (measured on the day loop with them).
    const pace = (ph: Phase): number => (d ? d.share * ownPace(d.of, ph) : ownPace(key, ph));
    const mult = talentMult(talents, skill) * crossTalentMult(talents, skill) * speciesLearning(species.id, skill) * (input.variance?.(skill) ?? 1);
    const youthPace = youth ? (d ? d.share * ownYouth(d.of) : ownYouth(key)) : undefined;
    const phases = phasesFor({ initiate: pace('initiate'), padawan: pace('padawan'), knight: pace('knight'), ...(youthPace !== undefined ? { youth: youthPace } : {}) }, hAges, ages.onePhase);
    for (const ph of phases) if (ph.to > hStart && ph.from < h) maxPace = Math.max(maxPace, Math.min(4, ph.pace * mult));
    const row = CATEGORY_RULES[SKILL_BY_ID.get(skill)!.category].ageRow;
    const own = skill === 'willpower' ? willpowerYears : years;
    const trainedAt = (age: number, war: number): number => xpForLevel(closedFormLevel({ row, startAge: hStart, age, phases, mult, warYears: war, ...(own ? { years: own } : {}) }));
    const trained = trainedAt(h, warYears);
    if (trained > 0) startingXp[skill] = trained;
    if (skill === 'forceSense' || skill === 'forceControl') stretch[skill] = stretchEnds.map((x) => trainedAt(x, x === h ? warYears : 0));
  }
  // Force Sense keeps pace with Force Control for every Force user (D-495): the loop's rule in closed form.
  if (input.path !== 'career' && stretch.forceControl) {
    const tracked = trackedSenseXp(stretch.forceControl.map((control, i) => ({ control, own: stretch.forceSense?.[i] ?? 0 })), input.path === 'sith');
    if (tracked > 0) startingXp['forceSense'] = tracked;
  }
  // Lightsaber forms (D-118, D-119): the form plans with the fundamentals transfer.
  const hasForms = Object.keys(a.weights).some(isFormKey) || input.path === 'jedi' || input.path === 'sith';
  // The highest form at the end of the Initiate and Padawan years: the Order classes' sparring partners (the stub
  // instructors and master) are that many levels ahead, which sets the sparring E they give (D-163).
  const phaseEnd = { initiate: 0, padawan: 0 };
  if (hasForms) {
    const formMult = (f: string): number => talentMult(talents, f) * crossTalentMult(talents, f) * speciesLearning(species.id, f) * (input.variance?.(f) ?? 1);
    // The Jedi Initiate lightsaber curriculum (D-459); the Sith acolyte row keeps Form I only.
    // The curriculum at the year of the survey (D-463: the forms that exist then).
    const curriculum = closedFormCurriculum(input.path, dateFromAbsDay(input.birthDay + Math.round(INITIATE_CURRICULUM.surveyFromAge * DAYS_PER_YEAR)).year);
    const formsAt = (age: number): Record<string, number> =>
      formXps({ formPaces: a.formPaces, k: K, startAge: hStart, age, padawanAge: hAges.padawanAge, knightAge: hAges.knightAge, onePhase: ages.onePhase, padawanPlan, knightPlan, mult: formMult, transferShare: FORM_TRANSFER_SHARE, warYears, ...(years ? { years } : {}), knightPoolDelta: ((focus[FORMS_KEY] ?? 0) - (def[FORMS_KEY] ?? 0)) * perShare * fill.knight, ...(curriculum ? { curriculum } : {}) });
    const highestAt = (age: number): number => (age > hStart ? levelExact(Math.max(0, ...Object.values(formsAt(age)))) : 0);
    phaseEnd.initiate = highestAt(Math.min(h, hAges.padawanAge));
    phaseEnd.padawan = highestAt(Math.min(h, hAges.knightAge));
    const xps = formXps({
      formPaces: a.formPaces,
      k: K,
      startAge: hStart,
      age: h,
      padawanAge: hAges.padawanAge,
      knightAge: hAges.knightAge,
      onePhase: ages.onePhase,
      padawanPlan,
      knightPlan,
      mult: formMult,
      transferShare: FORM_TRANSFER_SHARE,
      warYears,
      ...(years ? { years } : {}),
      knightPoolDelta: ((focus[FORMS_KEY] ?? 0) - (def[FORMS_KEY] ?? 0)) * perShare * fill.knight,
      onPace: (p) => (maxPace = Math.max(maxPace, p)),
      ...(curriculum ? { curriculum } : {}),
    });
    for (const [f, x] of Object.entries(xps)) if (x > 0) startingXp[f] = x;
  }
  // Outside the Force (D-447): a Yuuzhan Vong has no Force skills or powers, whatever the archetype's paces.
  if (input.outsideForce ?? isOutsideForce(input.speciesId)) for (const id of Object.keys(startingXp)) if (isForceXpSkill(id)) delete startingXp[id];
  for (const id of SKILL_IDS) {
    const n = input.npc ? npcNaturalLevel(id, species, age) : naturalLevel(id, species.id, age);
    const raw = levelWithNatural(startingXp[id] ?? 0, n);
    const lv = input.npc ? softCapLevel(raw) : raw;
    if (lv > 0) levels[id] = lv;
  }
  // An NPC's body past its prime (D-472), under its species' ceilings (D-474); a player's ageing is the progression feature's (its selectors take it off).
  if (input.npc) {
    const body = bodyAgeFromH(Math.min(LONG_LIFE.maxHumanAge, humanEquivalentAge(species, age)), levels['forceControl'] ?? 0, species.lifespanIncludesForce === true);
    for (const stat of PHYSICAL_STATS) if (levels[stat]) levels[stat] = Math.min(levels[stat] * (1 - ageLoss(stat, body)), bodyCapAt(species.id, stat, body));
  }

  // The highest form: every "main form" minimum reads it (D-118).
  let highestForm: { id: string; level: number } | null = null;
  for (const f of FORM_IDS) if ((levels[f] ?? 0) > (highestForm?.level ?? 0)) highestForm = { id: f, level: levels[f]! };

  // Rank minimums (ranks.md; character-creation §3).
  const unmet: UnmetMinimum[] = [];
  for (const [key, need] of Object.entries(rankDef.minimums)) {
    const target = key === '$main' ? (isFormKey(a.main) ? '$highestForm' : a.main) : key;
    const skill = target === '$highestForm' ? (highestForm?.id ?? 'shiiCho') : target;
    const have = Math.floor((levels[skill] ?? 0) + 1e-9);
    if (have < need) unmet.push({ skillId: skill, need, have });
  }
  const storyException = unmet.length > 0 && input.storyException === true;

  // The current phase's forms: Initiates train Shii-Cho; later the plan in force.
  const phaseNow = ages.onePhase ? 'knight' : h < hAges.padawanAge ? 'initiate' : h < hAges.knightAge ? 'padawan' : 'knight';
  const planNow = phaseNow === 'initiate' ? { shiiCho: 1 } : phaseNow === 'padawan' ? padawanPlan : knightPlan;
  const [mainFormId = null, secondFormId = null] = hasForms ? planOrder(planNow) : [];

  // Focus weights for the clamp: the forms pool shared out by the plan in force (by hours).
  const focusWeights: Record<string, number> = {};
  for (const [key, share] of Object.entries(focus)) {
    if (key === FORMS_KEY) {
      const split = planSplit(planNow);
      for (const [f, w] of Object.entries(split)) focusWeights[f] = (focusWeights[f] ?? 0) + share * w.fill;
    } else if (SKILL_BY_ID.has(key)) focusWeights[key] = (focusWeights[key] ?? 0) + share;
  }
  const real = (from: number, to: number): number => (to > from ? ageFromTraining(species, to) - ageFromTraining(species, from) : 0);
  const facts = backstory(input, a, rankDef, h, storyException, unmet, { padawanPlan, knightPlan, mainFormId, hasForms });
  const applied = startingApplied({ real, path: input.path, startAge: hStart, age: h, ages, warYears, startingXp, phaseEnd });
  return {
    ok: unmet.length === 0 || storyException,
    errors,
    unmet,
    options: unmet.length && !storyException ? VALIDATION_OPTIONS : [],
    storyException,
    unbalanced,
    startingXp,
    startingE: applied.E,
    startingCI: applied.CI,
    levels,
    maxPace,
    focusWeights,
    formPlan: { padawan: padawanPlan, knight: knightPlan },
    mainFormId,
    secondFormId,
    highestForm,
    facts,
  };
}

/**
 * Starting E and CI (character-creation §2; D-143 A, D-163): Order classes count as sparring with partners ahead of the
 * student (the Initiate forms class with the stub instructors, the Padawan master session with the stub master; a
 * partner 10+ levels ahead raises sparring E toward its level - 25, else peers cap it at 15), each war year adds E +3 and CI +1 on the
 * combat Force abilities the character knows (scaled as usual), and Knights and above add E +1 per year of missions
 * (at most +15). E applies to every form group the character has trained.
 */
function startingApplied(i: {
  /** Real years between two training ages. */
  real: (from: number, to: number) => number;
  path: CharacterPath;
  startAge: number;
  age: number;
  ages: { padawanAge: number; knightAge: number; onePhase: boolean };
  warYears: number;
  startingXp: Record<string, number>;
  /** The highest form level at the end of the Initiate and Padawan years (D-163). */
  phaseEnd: { initiate: number; padawan: number };
}): { E: Record<string, { E: number; eSpar: number }>; CI: Record<string, { CI: number; ciSpar: number }> } {
  let e = { E: 0, eSpar: 0 };
  const order = (i.path === 'jedi' || i.path === 'sith') && !i.ages.onePhase;
  if (order) {
    const initYears = i.real(i.startAge, Math.min(i.age, i.ages.padawanAge));
    const padYears = i.real(Math.max(i.startAge, i.ages.padawanAge), Math.min(i.age, i.ages.knightAge));
    const sessions = (years: number): number => Math.min(2000, Math.round(years * ORDER_SESSIONS_PER_YEAR));
    // The Order classes as sparring (D-143 A) with the stub instructors and master ahead of the student (D-163).
    const init = sparringE(i.phaseEnd.initiate, i.phaseEnd.initiate + STUB_INSTRUCTOR_LEAD);
    const pad = sparringE(i.phaseEnd.padawan, i.phaseEnd.padawan + STUB_MASTER_LEAD);
    for (let k = 0; k < sessions(initYears) && e.eSpar < init.cap - 1e-6; k++) e = gainE(e, init.source, init.cap);
    for (let k = 0; k < sessions(padYears) && e.eSpar < pad.cap - 1e-6; k++) e = gainE(e, pad.source, pad.cap);
    const missionYears = i.real(Math.max(i.startAge, i.ages.knightAge), i.age);
    let added = 0;
    for (let k = 0; k < Math.floor(missionYears) && added < MISSION_E_MAX; k++) {
      const g = Math.min(MISSION_E_MAX - added, 1 * Math.max(0, 1 - e.E / 120));
      e = { ...e, E: e.E + g };
      added += g;
    }
  }
  for (let k = 0; k < Math.floor(i.warYears); k++) e = gainE(e, 'skirmish');
  const E: Record<string, { E: number; eSpar: number }> = {};
  if (e.E > 0) for (const id of Object.keys(i.startingXp)) {
    const def = SKILL_BY_ID.get(id);
    if (def?.kind === 'form') E[def.formGroup ?? id] = { ...e };
  }
  const CI: Record<string, { CI: number; ciSpar: number }> = {};
  if (i.warYears > 0) for (const id of Object.keys(i.startingXp)) {
    const def = SKILL_BY_ID.get(id);
    if (def?.kind !== 'forceAbility' || def.forceUse === 'nonCombat') continue;
    let c = 0;
    for (let k = 0; k < Math.floor(i.warYears); k++) c += 1 * Math.max(0, 1 - c / 120);
    CI[id] = { CI: c, ciSpar: 0 };
  }
  return { E, CI };
}

/** Order training sessions a year counted for starting E (the Average's 300 training days). */
const ORDER_SESSIONS_PER_YEAR = 300;
/** Knights and above: E +1 per year of missions, at most +15 (character-creation §2). */
const MISSION_E_MAX = 15;

/** The Order's seat by start date (src/data/orderSeats.ts; L-03, D-155: every era). */
function templeFor(year: number): string {
  if (orderHomelessAt(year)) return 'one of the places the scattered Order met';
  return orderSeatAt(year) ?? 'a hidden enclave of surviving Jedi';
}

interface FormStory {
  padawanPlan: Record<string, number>;
  knightPlan: Record<string, number>;
  mainFormId: string | null;
  hasForms: boolean;
}

function backstory(input: CreationInput, a: ArchetypeDef, rank: RankDef, h: number, exception: boolean, unmet: UnmetMinimum[], forms: FormStory): string[] {
  const facts: string[] = [];
  const birthYear = dateFromAbsDay(input.birthDay).year;
  const startYear = dateFromAbsDay(Math.round(input.birthDay + input.trainingStartAge * DAYS_PER_YEAR)).year;
  const sp = speciesDef(input.speciesId).name;
  const form = forms.mainFormId ? SKILL_BY_ID.get(forms.mainFormId)?.name : null;
  const planText = (plan: Record<string, number>): string =>
    planOrder(plan)
      .map((f) => `${SKILL_BY_ID.get(f)?.name ?? f} ${plan[f]} h`)
      .join(', ');
  facts.push(`${input.name} is a ${sp}, born in ${formatYear(birthYear)}.`);
  if (input.path === 'jedi') facts.push(`Began training at age ${Math.round(input.trainingStartAge)} at ${templeFor(startYear)}.`);
  else if (input.path === 'sith') facts.push(`Entered the Sith Academy on Korriban at age ${Math.round(input.trainingStartAge)}.`);
  else if (input.path === 'outsider') facts.push(`A Force-sensitive outsider, self-taught since age ${Math.round(input.trainingStartAge)} without the Jedi or the Sith.`);
  else facts.push(`Began training as a ${a.name.toLowerCase()} at age ${Math.round(input.trainingStartAge)}.`);
  facts.push(`Trains as a ${a.name}${form ? `; main lightsaber form ${form}` : ''}.`);
  const phase = RANK_PHASE[rank.id];
  const spec = speciesDef(input.speciesId);
  const hAges = phaseAges(rank.id, input.path, trainingAge(spec, input.trainingStartAge), h);
  const ages = { padawanAge: ageFromTraining(spec, hAges.padawanAge), knightAge: ageFromTraining(spec, hAges.knightAge) };
  if ((input.path === 'jedi' || input.path === 'sith') && phase !== 'initiate') facts.push(`Became ${input.path === 'jedi' ? 'a Padawan' : 'an apprentice'} at about age ${Math.round(ages.padawanAge)}.`);
  if ((input.path === 'jedi' || input.path === 'sith') && phase === 'knight') facts.push(`${input.path === 'jedi' ? 'Knighted' : 'Recognized as a Sith Lord'} at about age ${Math.round(ages.knightAge)}.`);
  if (forms.hasForms && (input.path === 'jedi' || input.path === 'sith')) {
    facts.push(`Learned Shii-Cho as an Initiate${phase !== 'initiate' ? `; as ${input.path === 'jedi' ? 'a Padawan' : 'an apprentice'} trained ${planText(forms.padawanPlan)} a day` : ''}.`);
    if (phase === 'knight' && planText(forms.knightPlan) !== planText(forms.padawanPlan)) facts.push(`Later changed the form training to ${planText(forms.knightPlan)}.`);
  }
  if (rank.id === 'master') facts.push('Holds the rank of Jedi Master.');
  if ((input.warYears ?? 0) > 0) facts.push(`Served ${input.warYears} year${input.warYears === 1 ? '' : 's'} in the war.`);
  for (const [domain, level] of Object.entries(input.talents)) if (level && level !== 'none') facts.push(`Recognized as ${level === 'gifted' ? 'gifted' : `a ${level === 'prodigy' ? 'prodigy' : 'exceptional talent'}`} in ${domain === 'combat' ? 'combat' : domain === 'force' ? 'the Force' : domain === 'physical' ? 'physical training' : 'study'}.`);
  if (exception) facts.push(`Holds the rank of ${rank.name} as a story exception (a battlefield promotion) without meeting ${unmet.map((u) => `${SKILL_BY_ID.get(u.skillId)?.name ?? u.skillId} ${u.need}`).join(', ')}.`);
  return facts;
}

/** Diminishing returns above the band top (D-429; LONG_LIFE): identity up to LONG_LIFE.from, toward LONG_LIFE.apex above it. */
export function softCapLevel(level: number): number {
  if (level <= LONG_LIFE.from) return level;
  const span = LONG_LIFE.apex - LONG_LIFE.from;
  return LONG_LIFE.from + span * (1 - Math.exp(-(level - LONG_LIFE.from) / span));
}
