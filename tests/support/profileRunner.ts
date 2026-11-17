// Test-support profile runner (M3 plan step 9). Runs a calibration profile day by day through the src
// engine: the Order requirements for its rank (ranks.md §1a) as fixed commitments, the D-25 budget
// filled by archetype shares (D-40, D-41), sessions ordered and trimmed to the tiredness limit
// (training-routines §3-4), every session credited by computeTrainingXp (fatigue stepper, challenge,
// split, M, rolled outcome, synergy, fatigue Willpower). Mirrors docs-v2/calc/progression-sim.mjs;
// the M4 routine scheduler and advanceTime replace it.
// Forms (D-118, D-119): Initiates train Shii-Cho; from Padawan the 2 h master session trains the main
// form and the 1 h solo hour the second form, the forms part of the fill splits 2:1, and a form's first
// session starts it at 0.75 x the highest form. Fill is trimmed largest block first (D-120).
// Simplifications (as in the calc): no rust (every skill is trained continuously), no clamp (the
// Average never nears 4.0x), every block at standard intensity, one instruction factor per block.
import { ACTIVITY_BY_ID, isPhysicalActivity, type ActivityDef } from '../../src/data/activities';
import { focusShares, sharesFromWeights, type ArchetypeDef } from '../../src/data/archetypes';
import { AVERAGE_INSTRUCTION, type Instructor } from '../../src/data/orderRequirements';
import { BUDGET, FORM_TRANSFER_SHARE, TIREDNESS_LIMIT, K as CONFIG_K } from '../../src/data/progression.config';
import { CATEGORY_RULES, FORM_IDS, SKILL_BY_ID } from '../../src/data/skills';
import { ageFactor } from '../../src/engine/ageFactor';
import { pickDrillRating } from '../../src/engine/challenge';
import { computeTrainingXp } from '../../src/engine/computeXp';
import { levelExact, levelWithNatural } from '../../src/engine/curve';
import { EMPTY_DAY, ZERO_METERS, capacities, stepBlock, type DayTraining, type Meters } from '../../src/engine/fatigue';
import { interp } from '../../src/engine/interp';
import { seedRng, type RngState } from '../../src/engine/rng';
import { bodyCap, forceBoost, naturalLevel } from '../../src/engine/species';
import { speedM } from '../../src/engine/speed';

export const DAYS = 368;

export interface Profile {
  archetype: ArchetypeDef;
  mainForm: string;
  secondForm: string;
  startAge: number;
  padawanAge: number;
  knightAge: number;
  /** Jedi and Sith follow the Order rows; careers and outsiders fill the whole budget. */
  order: boolean;
  trainingDays: number;
  seed: string;
}

type Rank = 'initiate' | 'padawan' | 'knight';
interface Block {
  activity: ActivityDef;
  primary: string;
  hours: number;
  /** Hours before trimming (fill blocks are trimmed in proportion, D-120). */
  planned: number;
  instruction: number;
  fill: boolean;
}

/** ranks.md §1a with the skills-and-activities.md §5 activities (Average instruction factors). */
const ORDER: Record<Rank, [string, number, Instructor, string?][]> = {
  initiate: [
    ['shiiChoBasics', 2, 'instructor', 'shiiCho'],
    ['forceControlDrill', 0.5, 'instructor', 'forceControl'],
    ['senseAwareness', 0.5, 'instructor'],
    ['forceLore', 1, 'instructor'],
  ],
  padawan: [
    ['padawanTraining', 2, 'master', '$mainForm'],
    ['$secondFormBasics', 1, 'solo', '$secondForm'],
    ['forceControlDrill', 1, 'master', 'forceControl'],
    ['senseAwareness', 1, 'master'],
  ],
  knight: [],
};

/** The activity that trains a skill when the fill gives it hours (docs-v2/calc TRAINS). */
const TRAINS: Record<string, string> = {
  forceControl: 'forceControlDrill',
  forceSense: 'senseAwareness',
  strength: 'strengthTraining',
  agility: 'agilityFlexibility',
  endurance: 'cardio',
  willpower: 'willpowerMeditation',
  meditation: 'basicCentering',
  forceKnowledge: 'forceLore',
  forceOutput: 'outputDrill',
  forceHealOthers: 'abilityDrill',
  forceLightning: 'lightningControl',
  blaster: 'blasterRange',
  melee: 'meleeDrills',
  piloting: 'piloting',
  tracking: 'trackingFieldwork',
  stealth: 'stealthPractice',
  investigation: 'investigationCasework',
  intelligence: 'academicStudy',
  tactics: 'tacticsStudy',
  profession: 'professionWork',
  charisma: 'socialPractice',
};
const FORM_BASICS: Record<string, string> = { shiiCho: 'shiiChoBasics', soresu: 'soresuBasics', makashi: 'makashiBasics', ataru: 'ataruBasics', niman: 'nimanBasics' };

export interface RunResult {
  xp: Record<string, number>;
  /** Years of training when the main specialty (the highest form for form archetypes) first reached each tier. */
  milestones: Record<number, number>;
  /** Main-specialty XP per 368-day year (the most-trained form's, for form archetypes). */
  yearMain: number[];
  /** Age when a skill first reaches a level (natural baseline included). */
  cross: Record<string, number>;
  /** Main-specialty trained level at each whole year of training (the highest form for form archetypes). */
  mainByYear: number[];
  /** Fundamentals transfers: form -> {age, xp}. */
  transfers: Record<string, { age: number; xp: number }>;
  maxDayEndF: number;
}

export function runProfile(p: Profile, years: number, opts: { k?: number; crossLevels?: Record<string, number[]> } = {}): RunResult {
  const k = opts.k ?? CONFIG_K;
  const a = p.archetype;
  const resolveKey = (key: string): string => (key === '$mainForm' ? p.mainForm : key === '$secondForm' ? p.secondForm : key);
  const formMain = a.main === '$mainForm';
  const mainSkill = resolveKey(a.main);
  const isForm = (skill: string): boolean => SKILL_BY_ID.get(skill)?.kind === 'form';
  // The forms pool of the fill: Initiates put it on Shii-Cho; later it splits main 2 : second 1 (D-118).
  const pooled = (sh: Record<string, number>, rank: Rank): Record<string, number> => {
    const out: Record<string, number> = {};
    let pool = 0;
    for (const [key, v] of Object.entries(sh)) {
      if (key === '$mainForm' || key === '$secondForm') pool += v;
      else out[key] = (out[key] ?? 0) + v;
    }
    if (pool > 0 && rank === 'initiate') out['shiiCho'] = (out['shiiCho'] ?? 0) + pool;
    else if (pool > 0) {
      out[p.mainForm] = (out[p.mainForm] ?? 0) + (pool * 2) / 3;
      out[p.secondForm] = (out[p.secondForm] ?? 0) + pool / 3;
    }
    return out;
  };
  const sharesEarly = sharesFromWeights(a.weights);
  const sharesKnight = focusShares(a.weights, a.main, 0.5);
  const started = new Set<string>();
  const transfers: Record<string, { age: number; xp: number }> = {};
  const formXp = (f: string): number => xp[f] ?? 0;
  const highestFormLevel = (): number => Math.max(0, ...FORM_IDS.map((f) => levelExact(formXp(f), k)));
  const mainLevel = (): number => (formMain ? highestFormLevel() : levelExact(xp[mainSkill] ?? 0, k));
  let formYear: Record<string, number> = {};
  const xp: Record<string, number> = {};
  const credit: Record<string, number> = {};
  const milestones: Record<number, number> = {};
  const cross: Record<string, number> = {};
  const yearMain: number[] = [];
  const mainByYear: number[] = [];
  let maxDayEndF = 0;
  let rng: RngState = seedRng(p.seed);
  const total = Math.round(years * DAYS);
  const rankAt = (age: number): Rank => (!p.order ? 'knight' : age < p.padawanAge ? 'initiate' : age < p.knightAge ? 'padawan' : 'knight');
  const level = (s: string, age: number): number => (s === 'highestForm' ? highestFormLevel() : levelWithNatural(xp[s] ?? 0, naturalLevel(s, 'human', age), k));

  const activity = (id: string): ActivityDef => {
    const act = ACTIVITY_BY_ID.get(id === '$secondFormBasics' ? (FORM_BASICS[p.secondForm] ?? 'shiiChoBasics') : id);
    if (!act) throw new Error(`runner: unknown activity ${id}`);
    return act;
  };
  const trainsFor = (skill: string): [ActivityDef, string] => {
    if (isForm(skill)) return [activity(FORM_BASICS[skill] ?? 'shiiChoBasics'), skill];
    const id = TRAINS[skill];
    if (!id) throw new Error(`runner: nothing trains ${skill}`);
    return [activity(id), skill];
  };

  const buildDay = (age: number): Block[] => {
    const rank = rankAt(age);
    const effort = 'standard';
    const budget = interp(BUDGET[effort], age);
    const blocks: Block[] = [];
    let used = 0;
    for (const [id, hours, who, prim] of ORDER[rank]) {
      const act = activity(id);
      const primary = prim === '$mainForm' ? p.mainForm : prim === '$secondForm' ? p.secondForm : (prim ?? (act.primary.kind === 'skill' ? act.primary.skill : p.mainForm));
      blocks.push({ activity: act, primary, hours, planned: hours, instruction: AVERAGE_INSTRUCTION[who], fill: false });
      used += hours;
    }
    const remaining = Math.max(0, budget - used);
    const sh = pooled(rank === 'knight' ? sharesKnight : sharesEarly, rank);
    for (const [skill, s] of Object.entries(sh)) credit[skill] = (credit[skill] ?? 0) + remaining * s;
    let left = Math.floor(remaining / 0.5 + 1e-9) * 0.5;
    const fill: Record<string, number> = {};
    while (left >= 0.5) {
      const [skill] = Object.entries(credit).sort((x, y) => y[1] - x[1])[0]!;
      credit[skill]! -= 0.5;
      fill[skill] = (fill[skill] ?? 0) + 0.5;
      left -= 0.5;
    }
    for (const [skill, hours] of Object.entries(fill)) {
      const [act, primary] = trainsFor(skill);
      blocks.push({ activity: act, primary, hours, planned: hours, instruction: AVERAGE_INSTRUCTION.fill, fill: true });
    }
    return blocks;
  };

  // training-routines §3-4: sessions <= 2 h; physical first, a mental block after each physical one,
  // meditation last; 0.5 h rest between physical blocks when f_phys would pass 0.7.
  type Ordered = Block | { rest: number };
  const order = (blocks: Block[]): Ordered[] => {
    const split: Block[] = [];
    for (const b of blocks) for (let h = b.hours; h > 0; h -= Math.min(2, h)) split.push({ ...b, hours: Math.min(2, h) });
    const phys = split.filter((b) => b.activity.load.p >= 0.8);
    const medit = split.filter((b) => b.activity.load.m < 0);
    const mental = split.filter((b) => b.activity.load.p < 0.8 && b.activity.load.m >= 0);
    const out: Ordered[] = [];
    phys.forEach((b, i) => {
      if (i > 0) out.push({ rest: 0.5 });
      out.push(b);
      const m = mental.shift();
      if (m) out.push(m);
    });
    return [...out, ...mental, ...medit];
  };

  const caps = (age: number) => {
    const fc = level('forceControl', age);
    const end = Math.min(level('endurance', age), bodyCap('human', 'endurance', age)) + forceBoost(fc, 0);
    return capacities(end, level('willpower', age), fc);
  };

  /** Steps a day without crediting (for the trim): the day-end f. */
  const dryRun = (ordered: Ordered[], age: number): number => {
    const c = caps(age);
    let m: Meters = ZERO_METERS;
    let d: DayTraining = EMPTY_DAY;
    for (const o of ordered) {
      if ('rest' in o) {
        if (m.p / c.p <= 0.7) continue;
        m = { p: Math.max(0, m.p - 0.75 * o.rest), m: Math.max(0, m.m - 1.0 * o.rest), f: m.f };
        d = { ...d, postWindow: 0, lastPhysicalHeavy: false };
        continue;
      }
      const r = stepBlock(m, c, d, { activityId: o.activity.id, load: o.activity.load, physical: isPhysicalActivity(o.activity), meditation: o.activity.group === 'meditation', hours: o.hours, intensity: 'standard' });
      m = r.meters;
      d = r.day;
    }
    return Math.max(m.p / c.p, m.m / c.m);
  };

  const crossLevels = opts.crossLevels ?? {};
  for (let day = 0; day < total; day++) {
    const age = p.startAge + day / DAYS;
    const trains = Math.floor(((day + 1) * p.trainingDays) / DAYS) !== Math.floor((day * p.trainingDays) / DAYS);
    if (trains) {
      const raw = buildDay(age);
      let ordered = order(raw);
      while (dryRun(ordered, age) > TIREDNESS_LIMIT.standard) {
        // Trim the fill in proportion (D-120): the block with the largest remaining fraction of its plan.
        let i = -1;
        const frac = (b: Block): number => b.hours / b.planned;
        raw.forEach((b, j) => {
          if (b.fill && b.hours > 0 && (i < 0 || frac(b) > frac(raw[i]!) || (frac(b) === frac(raw[i]!) && b.hours > raw[i]!.hours))) i = j;
        });
        if (i < 0) break;
        raw[i] = { ...raw[i]!, hours: raw[i]!.hours - 0.5 };
        ordered = order(raw.filter((b) => b.hours > 0));
      }
      const c = caps(age);
      const levels = new Map<string, number>();
      const L = (s: string): number => {
        if (!levels.has(s)) levels.set(s, level(s, age));
        return levels.get(s)!;
      };
      let m: Meters = ZERO_METERS;
      let d: DayTraining = EMPTY_DAY;
      let willToday = 0;
      for (const o of ordered) {
        if ('rest' in o) {
          if (m.p / c.p <= 0.7) continue;
          m = { p: Math.max(0, m.p - 0.75 * o.rest), m: Math.max(0, m.m - 1.0 * o.rest), f: m.f };
          d = { ...d, postWindow: 0, lastPhysicalHeavy: false };
          continue;
        }
        const act = o.activity;
        // Fundamentals transfer (D-119): a form's first session starts it at 0.75 x the highest form.
        if (isForm(o.primary) && !started.has(o.primary)) {
          started.add(o.primary);
          const t = FORM_TRANSFER_SHARE * Math.max(0, ...FORM_IDS.map(formXp)) - formXp(o.primary);
          if (t > 0) {
            xp[o.primary] = formXp(o.primary) + t;
            transfers[o.primary] = { age, xp: t };
            levels.delete(o.primary);
          }
        }
        const secondaries: Record<string, number> = {};
        for (const [key, w] of Object.entries(act.secondaries)) {
          const s = key === '$secondForm' ? p.secondForm : key;
          if (s.startsWith('$') || s === o.primary) continue;
          secondaries[s] = (secondaries[s] ?? 0) + w;
        }
        const r = computeTrainingXp({
          activityId: act.id,
          load: act.load,
          physical: isPhysicalActivity(act),
          meditation: act.group === 'meditation',
          hours: o.hours,
          intensity: 'standard',
          drillRating: pickDrillRating(L(o.primary), 'standard'),
          challengeLevel: L(o.primary),
          split: { primaries: { [o.primary]: 1 }, secondaries },
          meters: m,
          caps: c,
          day: d,
          halveFatigueWillpower: false,
          willpowerToday: willToday,
          m: (s) => {
            const def = SKILL_BY_ID.get(s);
            const row = def ? CATEGORY_RULES[def.category].ageRow : 'academic';
            return speedM({ talent: 1, crossTalent: 1, instruction: o.instruction, age: ageFactor(row, age), state: 1, alignment: 1, species: 1 }).m;
          },
          levelOf: L,
          xpOf: (s) => xp[s] ?? 0,
          naturalOf: (s) => naturalLevel(s, 'human', age),
          clamp: (_s, wanted) => ({ credited: wanted, discarded: 0 }),
          rng,
        });
        rng = r.rng;
        m = r.meters;
        d = r.day;
        willToday += r.fatigueWillpower;
        for (const [s, v] of Object.entries(r.credited)) {
          xp[s] = (xp[s] ?? 0) + v;
          if (formMain ? isForm(s) : s === mainSkill) formYear[s] = (formYear[s] ?? 0) + v;
        }
      }
      maxDayEndF = Math.max(maxDayEndF, m.p / c.p, m.m / c.m);
    }
    const ageEnd = p.startAge + (day + 1) / DAYS;
    const lvl = mainLevel();
    for (const t of [21, 41, 61, 81, 101]) if (milestones[t] === undefined && lvl >= t) milestones[t] = (day + 1) / DAYS;
    for (const [s, ts] of Object.entries(crossLevels)) {
      const l = level(s, ageEnd);
      for (const t of ts) if (cross[`${s}>=${t}`] === undefined && l >= t) cross[`${s}>=${t}`] = ageEnd;
    }
    if ((day + 1) % DAYS === 0) {
      yearMain.push(Math.max(0, ...Object.values(formYear)));
      formYear = {};
      mainByYear.push(lvl);
    }
  }
  return { xp, milestones, yearMain, cross, mainByYear, maxDayEndF, transfers };
}
