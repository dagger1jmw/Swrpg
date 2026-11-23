// The routine scheduler (training-routines.md §1-4, §6; D-40, D-41, D-118, D-120). Pure and
// deterministic: the same state gives the same day. It replaces the M3 test-only profile runner:
//  1. Fixed commitments (the Order requirements for the rank, ranks.md §1a) and locked blocks first.
//  2. The rest of the D-25 budget is the fill, shared by the routine's priorities (or the archetype
//     default template), in 0.5 h steps with the rounding carried across days (fillCredit).
//  3. Sessions <= 2 h; physical blocks first, a mental block after each physical one, meditation
//     last; a 0.5 h rest between physical blocks when f_phys would pass 0.7 (decided when it runs).
//  4. Fill trimmed in proportion (D-120) until the projected day-end f is within the effort's limit;
//     fixed and locked blocks are never trimmed.
// Automatic adjustments (§6): an overtraining streak of 2+ makes the day a recovery day; an absent
// teacher's block becomes solo. Injuries and the drill ceiling arrive with M5.
import { ACTIVITY_BY_ID, DEFAULT_ACTIVITY, isPhysicalActivity, type ActivityDef, type Intensity } from '../../data/activities';
import { archetypeDef, focusShares, sharesFromWeights } from '../../data/archetypes';
import { ORDER_REQUIREMENTS, REQUIREMENT_ROW, blockHours, type Instructor } from '../../data/orderRequirements';
import { BUDGET, DAILY_LIFE, STEP_HOURS, TIREDNESS_LIMIT } from '../../data/progression.config';
import { weekday } from '../../engine/calendar';
import { FORM_IDS, SKILL_BY_ID } from '../../data/skills';
import { EMPTY_DAY, ZERO_METERS, afterSleep, stepBlock, type Capacities, type DayTraining, type Meters } from '../../engine/fatigue';
import { interp } from '../../engine/interp';
import { curriculumPhase, initiateSaberBlocks } from './curriculum';
import type { GameState } from '../../state/gameState';
import { selectCharacter, selectHumanAge, selectPath } from '../character/selectors';
import { selectInjuredSkills, selectMeters } from '../health/selectors';
import { selectNpc } from '../npcs/selectors';
import { selectCapacities, selectDrillCeiling, selectLevelExact, selectOvertrainStreak, type TrainingSource } from '../progression/selectors';
import { selectRank } from '../ranks/selectors';
import { FORCE_XP_TRIAL } from '../../engine/forceXpTrial';
import { forceHours, recordPlan, strainTrim } from '../progression/selectors';
import type { Routine } from './routines';

export interface PlannedBlock {
  kind: 'train';
  activityId: string;
  /** The session's primary skill (passed as the training request's skillId). */
  skillId: string;
  hours: number;
  /** Hours before trimming (the fill is trimmed in proportion, D-120). */
  planned: number;
  source: TrainingSource;
  intensity: Intensity;
  /** An Order requirement (never trimmed). */
  fixed: boolean;
  locked: boolean;
  fill: boolean;
  startSecond: number;
}

/**
 * 0.5 h rest between physical blocks (§4 rule 5): a conditional rest is taken only when f_phys has passed 0.7 by then;
 * an unconditional one (D-456: a rest before a trim) is one the plan needs to stay under the tiredness limit, taken always.
 */
export interface PlannedRest {
  kind: 'rest';
  hours: number;
  conditional: boolean;
  startSecond: number;
}

/** A rest slot in an ordered day: `forced` = taken whatever the meter (D-456). */
type RestSlot = { rest: number; forced?: boolean };

export type PlanItem = PlannedBlock | PlannedRest;

export interface DayPlan {
  trainingDay: boolean;
  recovery: boolean;
  items: PlanItem[];
  budget: number;
  /** The fill credit after this day (applied by routineDayPlanned). */
  fillCredit: Record<string, number>;
  projectedEndF: number;
  /** Automatic adjustments and scheduling notes (training-routines §6: every one is logged). */
  notes: string[];
}

/** Training days spread evenly over the weeks (fractional days per week allowed). */
export function isTrainingDay(absDay: number, daysPerWeek: number): boolean {
  const r = daysPerWeek / 7;
  return Math.floor((absDay + 1) * r + 1e-9) !== Math.floor(absDay * r + 1e-9);
}

const PADAWAN_MASTER_HOURS = 2;

/** The Order row for the character's rank (ranks.md §1a); only the Jedi and Sith paths have one. */
export function requirementRow(s: GameState): 'initiate' | 'padawan' | 'knight' {
  const path = selectPath(s);
  if (path !== 'jedi' && path !== 'sith') return 'knight';
  const row = REQUIREMENT_ROW[selectRank(s)] ?? 'knight';
  // The Sith rows (D-427) are the acolyte and apprentice phases.
  return row === 'initiate' || row === 'acolyte' ? 'initiate' : row === 'padawan' || row === 'apprentice' ? 'padawan' : 'knight';
}

/** The Order requirements row key for the rank (the Sith have their own rows, D-427). */
export function orderRowKey(s: GameState): string {
  const path = selectPath(s);
  if (path !== 'jedi' && path !== 'sith') return 'knight';
  return REQUIREMENT_ROW[selectRank(s)] ?? 'knight';
}

/** The form plan in force for the character's rank (D-118): exported for the preview's unused-form warning (D-174). */
export const selectPlanForms = (s: GameState): Record<string, number> => planFor(s, requirementRow(s));

/** The form plan in force: hours by form (Padawan plan before Knight, Knight+ plan after; D-118). */
function planFor(s: GameState, row: 'initiate' | 'padawan' | 'knight'): Record<string, number> {
  const c = selectCharacter(s);
  if (row === 'initiate') return { shiiCho: 1 };
  const plan = c.formPlan ? (row === 'padawan' ? c.formPlan.padawan : c.formPlan.knight) : null;
  if (plan && Object.values(plan).some((h) => h > 0)) return { ...plan };
  const out: Record<string, number> = {};
  if (c.mainFormId) out[c.mainFormId] = 2;
  if (c.secondFormId) out[c.secondFormId] = 1;
  return Object.keys(out).length ? out : { shiiCho: 1 };
}

const sortedPlan = (plan: Record<string, number>): [string, number][] =>
  Object.entries(plan)
    .filter(([, h]) => h > 0)
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));

/** Fill shares from the routine's priorities, or the archetype default template (D-40, D-41). */
export function fillShares(s: GameState, routine: Routine, row: 'initiate' | 'padawan' | 'knight'): Record<string, number> {
  if (routine.priorities && routine.priorities.length) {
    const tot = routine.priorities.reduce((a, p) => a + p.weight, 0);
    const out: Record<string, number> = {};
    for (const p of routine.priorities) out[p.skillId] = (out[p.skillId] ?? 0) + p.weight / tot;
    return out;
  }
  const c = selectCharacter(s);
  const a = archetypeDef(c.archetype);
  if (row === 'knight' && Object.keys(c.focusWeights).length) return { ...c.focusWeights };
  const sh = row === 'knight' ? focusShares(a.weights, a.main, 0.5) : sharesFromWeights(a.weights);
  // The forms pool ($mainForm + $secondForm): Shii-Cho for Initiates, else the form plan's proportions (D-118).
  const out: Record<string, number> = {};
  let pool = 0;
  for (const [k, v] of Object.entries(sh)) {
    if (k === '$mainForm' || k === '$secondForm') pool += v;
    else out[k] = (out[k] ?? 0) + v;
  }
  if (pool > 0) {
    const plan = sortedPlan(planFor(s, row));
    const tot = plan.reduce((x, [, h]) => x + h, 0);
    for (const [f, h] of plan) out[f] = (out[f] ?? 0) + (pool * h) / tot;
  }
  return out;
}

/** The default path source of the fill: Temple / unit peers (x1.00, D-40), outsiders train alone (D-128). */
export function defaultFillSource(s: GameState): TrainingSource {
  return selectPath(s) === 'outsider' ? { kind: 'solo' } : { kind: 'peers' };
}

function activityFor(skill: string, override?: string): ActivityDef | null {
  return ACTIVITY_BY_ID.get(override ?? DEFAULT_ACTIVITY[skill] ?? '') ?? null;
}

function sourceFor(who: Instructor, routine: Routine, s: GameState, notes: string[]): TrainingSource {
  if (who === 'instructor') return { kind: 'instructor' };
  if (who === 'solo') return { kind: 'solo' };
  if (routine.masterRef) {
    const npc = selectNpc(s, routine.masterRef);
    if (npc && npc.status === 'active') return { kind: 'npc', id: npc.id };
    notes.push(`master ${npc?.name ?? routine.masterRef} is unavailable: the master stub teaches (training-routines §6)`);
  }
  return { kind: 'master' };
}

/** An NPC teacher or partner who is no longer active: the block becomes solo (training-routines §6). */
function availableSource(src: TrainingSource, s: GameState, notes: string[], label: string): TrainingSource {
  if (src.kind !== 'npc' && src.kind !== 'partner') return src;
  const npc = selectNpc(s, src.id);
  if (npc && npc.status === 'active') return src;
  notes.push(`${label}: ${npc?.name ?? src.id} is unavailable, trained solo instead`);
  return { kind: 'solo' };
}

const isPhysical = (b: PlannedBlock): boolean => (ACTIVITY_BY_ID.get(b.activityId)?.load.p ?? 0) >= 0.8;
const isMeditation = (b: PlannedBlock): boolean => (ACTIVITY_BY_ID.get(b.activityId)?.load.m ?? 0) < 0;

/** §3-4: sessions <= 2 h; physical first with a mental block after each, meditation last. */
export function orderBlocks(blocks: readonly PlannedBlock[], forcedRests = false): (PlannedBlock | RestSlot)[] {
  const split: PlannedBlock[] = [];
  for (const b of blocks) for (let h = b.hours; h > 1e-9; h -= Math.min(2, h)) split.push({ ...b, hours: Math.min(2, h) });
  const phys = split.filter(isPhysical);
  const medit = split.filter((b) => !isPhysical(b) && isMeditation(b));
  const mental = split.filter((b) => !isPhysical(b) && !isMeditation(b));
  const out: (PlannedBlock | RestSlot)[] = [];
  phys.forEach((b, i) => {
    if (i > 0) out.push(forcedRests ? { rest: STEP_HOURS, forced: true } : { rest: STEP_HOURS });
    out.push(b);
    const m = mental.shift();
    if (m) out.push(m);
  });
  return [...out, ...mental, ...medit];
}

/** Steps a day's sessions without crediting: the day-end f (the higher of f_phys and f_mental). */
export function projectDay(ordered: readonly (PlannedBlock | RestSlot)[], start: Meters, caps: Capacities): { endF: number; curve: { hour: number; fp: number; fm: number }[] } {
  let m = start;
  let d: DayTraining = EMPTY_DAY;
  let hour = 0;
  const curve: { hour: number; fp: number; fm: number }[] = [{ hour: 0, fp: m.p / caps.p, fm: m.m / caps.m }];
  for (const o of ordered) {
    if ('rest' in o) {
      if (!o.forced && m.p / caps.p <= 0.7) continue;
      m = { p: Math.max(0, m.p - 0.75 * o.rest), m: Math.max(0, m.m - 1.0 * o.rest), f: m.f };
      d = { ...d, postWindow: 0, lastPhysicalHeavy: false };
      hour += o.rest;
      curve.push({ hour, fp: m.p / caps.p, fm: m.m / caps.m });
      continue;
    }
    const act = ACTIVITY_BY_ID.get(o.activityId)!;
    const r = stepBlock(m, caps, d, { activityId: act.id, load: act.load, physical: isPhysicalActivity(act), meditation: act.group === 'meditation', hours: o.hours, intensity: o.intensity });
    m = r.meters;
    d = r.day;
    hour += o.hours;
    curve.push({ hour, fp: m.p / caps.p, fm: m.m / caps.m });
  }
  return { endF: Math.max(m.p / caps.p, m.m / caps.m), curve };
}

/** Lays the ordered sessions out from the wake time, around the locked blocks (which never move). */
function layout(ordered: readonly (PlannedBlock | RestSlot)[], locked: readonly PlannedBlock[], wake: number): PlanItem[] {
  const busy = locked.map((b) => [b.startSecond, b.startSecond + b.hours * 3600] as const);
  const items: PlanItem[] = [];
  let t = wake;
  const fit = (len: number): number => {
    let start = t;
    for (;;) {
      const clash = busy.find(([a, z]) => start < z && start + len > a);
      if (!clash) return start;
      start = clash[1];
    }
  };
  for (const o of ordered) {
    const len = ('rest' in o ? o.rest : o.hours) * 3600;
    const start = fit(len);
    items.push('rest' in o ? { kind: 'rest', hours: o.rest, conditional: !o.forced, startSecond: start } : { ...o, startSecond: start });
    t = start + len;
  }
  return [...items, ...locked].sort((x, y) => x.startSecond - y.startSecond);
}

/** The day's plan for the character (the morning after the night's sleep). */
export function planDay(s: GameState, routine: Routine, fillCredit: Readonly<Record<string, number>>, opts: { fromSleep?: boolean } = {}): DayPlan {
  const notes: string[] = [];
  const day = s.clock.now.day;
  const age = selectHumanAge(s);
  const budget = interp(BUDGET[routine.effort], age);
  const credit: Record<string, number> = { ...fillCredit };
  const empty = (trainingDay: boolean, recovery: boolean): DayPlan => ({ trainingDay, recovery, items: [], budget, fillCredit: credit, projectedEndF: 0, notes });
  if (selectCharacter(s).trainingStartAge === null && !routine.priorities?.length && !routine.lockedBlocks.length) return empty(false, false);
  if (!isTrainingDay(day, routine.daysPerWeek)) return empty(false, false);
  if (selectOvertrainStreak(s) >= 2) {
    notes.push('overtraining streak of 2+ days: today is a recovery day (training-routines §6)');
    return empty(true, true);
  }

  const row = requirementRow(s);
  const blocks: PlannedBlock[] = [];
  const add = (b: Omit<PlannedBlock, 'kind' | 'planned' | 'startSecond'>): void => {
    if (b.hours > 0) blocks.push({ kind: 'train', planned: b.hours, startSecond: 0, ...b });
  };

  // 1. Order requirements (fixed commitments, never trimmed).
  let used = 0;
  const plan = sortedPlan(planFor(s, row));
  // The accelerated path drops the Order's knowledge and doctrine blocks (D-418: history, protocol, doctrine).
  const accelerated = selectCharacter(s).trainingPath === 'accelerated';
  const knowledgeBlock = (req: { activityId: string; primary?: string }): boolean => {
    const act = ACTIVITY_BY_ID.get(req.activityId);
    const id = req.primary ?? (act?.primary.kind === 'skill' ? act.primary.skill : '');
    return SKILL_BY_ID.get(id)?.category === 'knowledge';
  };
  for (const req0 of (ORDER_REQUIREMENTS[orderRowKey(s)] ?? []).filter((r) => !(accelerated && knowledgeBlock(r)))) {
    // The block's hours at this age (D-431: the young Padawan's fixed hours are scaled down).
    const req = { ...req0, hours: blockHours(req0, age) };
    if (req.hours <= 0) continue;
    const source = sourceFor(req.instructor, routine, s, notes);
    const intensity: Intensity = 'standard';
    if (req.primary === '$curriculum') {
      // The Jedi Initiate lightsaber curriculum (D-459): the gate, Form I, the survey of Forms I-VI.
      const cur = initiateSaberBlocks({ age, day, hours: req.hours, level: (id) => selectLevelExact(s, id) });
      for (const b of cur.blocks) add({ activityId: b.activityId, skillId: b.skillId, hours: b.hours, source, intensity, fixed: true, locked: false, fill: false });
      if (cur.phase === 'preGate') notes.push('Initiate saber classes not yet open (basic Force Control and study first, D-459): the hours go to Force Control, physical training and meditation');
      used += req.hours;
      continue;
    }
    if (req.primary === '$planMaster' || req.primary === '$planSolo') {
      // The plan's forms by hours, largest first: the first 2 h with the master, the rest solo (D-118).
      let offset = req.primary === '$planMaster' ? 0 : PADAWAN_MASTER_HOURS;
      let left = req.hours;
      for (const [form, h] of plan) {
        const take = Math.max(0, Math.min(h - offset, left));
        offset = Math.max(0, offset - h);
        if (take <= 0) continue;
        const activityId = req.activityId === '$formBasics' ? (DEFAULT_ACTIVITY[form] ?? 'shiiChoBasics') : req.activityId;
        add({ activityId, skillId: form, hours: take, source, intensity, fixed: true, locked: false, fill: false });
        left -= take;
        if (left <= 1e-9) break;
      }
      used += req.hours;
      continue;
    }
    const act = ACTIVITY_BY_ID.get(req.activityId)!;
    const skillId = req.primary ?? (act.primary.kind === 'skill' ? act.primary.skill : 'shiiCho');
    add({ activityId: act.id, skillId, hours: req.hours, source, intensity, fixed: true, locked: false, fill: false });
    used += req.hours;
  }

  // Locked blocks (player-placed, never moved or trimmed).
  const locked: PlannedBlock[] = [];
  for (const lb of routine.lockedBlocks) {
    const act = ACTIVITY_BY_ID.get(lb.activityId);
    if (!act) {
      notes.push(`locked block: unknown activity ${lb.activityId} skipped`);
      continue;
    }
    const skillId = lb.skillId ?? (act.primary.kind === 'skill' ? act.primary.skill : (selectCharacter(s).mainFormId ?? 'shiiCho'));
    const source = availableSource(lb.source ?? { kind: 'solo' }, s, notes, act.name);
    locked.push({ kind: 'train', activityId: act.id, skillId, hours: lb.hours, planned: lb.hours, source, intensity: lb.intensity ?? 'standard', fixed: true, locked: true, fill: false, startSecond: lb.startSecond });
    used += lb.hours;
  }

  // 2. The fill: the rest of the budget by shares, 0.5 h steps, rounding carried across days.
  const remaining = Math.max(0, budget - used);
  const shares = fillShares(s, routine, row);
  for (const [skill, sh] of Object.entries(shares)) credit[skill] = (credit[skill] ?? 0) + remaining * sh;
  let left = Math.floor(remaining / STEP_HOURS + 1e-9) * STEP_HOURS;
  const fill: Record<string, number> = {};
  while (left >= STEP_HOURS) {
    const [skill] = Object.entries(credit).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0]!;
    credit[skill] = credit[skill]! - STEP_HOURS;
    fill[skill] = (fill[skill] ?? 0) + STEP_HOURS;
    left -= STEP_HOURS;
  }
  // Credit for skills no longer in the shares is dropped (a routine change starts fresh for them).
  for (const k of Object.keys(credit)) if (!(k in shares)) delete credit[k];
  const prio = new Map((routine.priorities ?? []).map((p) => [p.skillId, p]));
  const baseFill = routine.fillSource ?? defaultFillSource(s);
  // The saber gate covers the Initiate's free training too (D-460): before it, fill form hours go where the saber class's
  // hours go (Force Control, physical training, centering).
  const gateClosed = selectPath(s) === 'jedi' && selectRank(s) === 'initiate' && curriculumPhase({ age, level: (id) => selectLevelExact(s, id) }) === 'preGate';
  const gatedHours = gateClosed ? Object.entries(fill).filter(([k]) => isFormSkill(k)).reduce((x, [, h]) => x + h, 0) : 0;
  if (gatedHours > 0) {
    for (const k of Object.keys(fill)) if (isFormSkill(k)) delete fill[k];
    for (const b of initiateSaberBlocks({ age, day, hours: gatedHours, level: (id) => selectLevelExact(s, id) }).blocks)
      add({ activityId: b.activityId, skillId: b.skillId, hours: b.hours, source: availableSource(baseFill, s, notes, b.activityId), intensity: 'standard', fixed: false, locked: false, fill: true });
    notes.push(`saber gate not yet passed (D-460): ${gatedHours} h of free form training go to Force Control, physical training and meditation`);
  }
  for (const [skill, hours] of Object.entries(fill)) {
    const p = prio.get(skill);
    const act = activityFor(skill, p?.activityId);
    if (!act || !SKILL_BY_ID.has(skill)) {
      notes.push(`fill: nothing trains ${skill}; skipped`);
      continue;
    }
    const source = availableSource(p?.source ?? baseFill, s, notes, act.name);
    add({ activityId: act.id, skillId: skill, hours, source, intensity: p?.intensity ?? 'standard', fixed: false, locked: false, fill: true });
  }

  // Automatic adjustments (training-routines §6; M5), each logged. An injury takes the skills a moderate-or-worse
  // wound penalizes out of the day (rest until healed; test 7: within the same day); skills a lasting injury affects keep
  // training as adaptation training. A form at its drill ceiling shifts its fill hours to sparring with peers, which
  // also builds E (progression-numbers §7); without peers the hours stay and the preview warns.
  const injured = selectInjuredSkills(s);
  const restNames = new Set<string>();
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (!injured.rest.includes(blocks[i]!.skillId)) continue;
    restNames.add(SKILL_BY_ID.get(blocks[i]!.skillId)?.name ?? blocks[i]!.skillId);
    blocks.splice(i, 1);
  }
  for (let i = locked.length - 1; i >= 0; i--) {
    if (!injured.rest.includes(locked[i]!.skillId)) continue;
    restNames.add(SKILL_BY_ID.get(locked[i]!.skillId)?.name ?? locked[i]!.skillId);
    locked.splice(i, 1);
  }
  if (restNames.size) notes.push(`injury: ${[...restNames].join(', ')} rest until the wound heals (training-routines §6)`);
  const adapting = [...new Set(blocks.filter((b) => injured.adapt.includes(b.skillId)).map((b) => SKILL_BY_ID.get(b.skillId)?.name ?? b.skillId))];
  if (adapting.length) notes.push(`injury: ${adapting.join(', ')} trained as adaptation training (training-routines §6)`);
  const orderPath = selectPath(s) === 'jedi' || selectPath(s) === 'sith';
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (!b.fill || !isFormSkill(b.skillId) || b.activityId === 'sparring') continue;
    if (selectLevelExact(s, b.skillId) < selectDrillCeiling(s, b.skillId)) continue;
    const name = SKILL_BY_ID.get(b.skillId)?.name ?? b.skillId;
    if (orderPath || b.source.kind === 'partner' || b.source.kind === 'peers') {
      blocks[i] = { ...b, activityId: 'sparring', source: b.source.kind === 'partner' ? b.source : { kind: 'peers' }, intensity: 'standard' };
      notes.push(`drill ceiling reached in ${name}: ${b.hours} h shift to sparring (training-routines §6)`);
    } else notes.push(`drill ceiling reached in ${name}: no sparring partner, drills bank most of their XP (training-routines §6)`);
  }

  // 3-4. Order, then trim the fill in proportion to the effort's tiredness limit (D-120).
  const caps = selectCapacities(s);
  // The projection starts from the actual meters now (D-165): the day loop plans at wake, after the night's sleep has
  // already been applied, and anything earlier in the day (a fight at dawn) is not slept off. Only a look ahead (the
  // routine preview's typical day) starts from a night's sleep.
  const start = opts.fromSleep ? afterSleep(selectMeters(s), routine.sleepHours) : selectMeters(s);
  const limit = TIREDNESS_LIMIT[routine.effort];
  let ordered = orderBlocks(blocks);
  let projected = projectDay([...ordered, ...locked], start, caps).endF;
  // A rest before a trim (D-456): a day that projects over the limit first takes every rest between its physical blocks
  // (they cost clock time, not training hours); only a day still over is trimmed. Without it, a fitter character skipped
  // rests the meter no longer called for (f_phys just under 0.7) and lost fill hours for it (the dip at 30, D-455).
  const forced = projected > limit + 1e-9;
  if (forced) {
    ordered = orderBlocks(blocks, true);
    projected = projectDay([...ordered, ...locked], start, caps).endF;
    notes.push('rests between physical blocks taken to stay under the tiredness limit (D-456)');
  }
  // The fill is trimmed first. If the fixed Order blocks alone still pass the limit because the day started tired (a
  // fight at dawn), they are trimmed the same way, down to what they would reach on a fresh day: the Order excuses the
  // exertion, never an ordinary day's requirements (D-165). Player-locked blocks are never trimmed.
  const freshFixed = projectDay(orderBlocks(blocks.filter((b) => !b.fill), forced).concat(locked), ZERO_METERS, caps).endF;
  const trimmed = { fill: 0, fixed: 0 };
  for (const pass of ['fill', 'fixed'] as const) {
    const target = pass === 'fill' ? limit : Math.max(limit, freshFixed);
    while (projected > target + 1e-9) {
      let i = -1;
      const frac = (b: PlannedBlock): number => b.hours / b.planned;
      blocks.forEach((b, j) => {
        if ((pass === 'fill' ? b.fill : !b.fill) && b.hours > 0 && (i < 0 || frac(b) > frac(blocks[i]!) || (frac(b) === frac(blocks[i]!) && b.hours > blocks[i]!.hours))) i = j;
      });
      if (i < 0) break;
      blocks[i] = { ...blocks[i]!, hours: blocks[i]!.hours - STEP_HOURS };
      trimmed[pass] += STEP_HOURS;
      ordered = orderBlocks(blocks.filter((b) => b.hours > 0), forced);
      projected = projectDay([...ordered, ...locked], start, caps).endF;
    }
  }
  // The Force XP trial's strain trim (engine/forceXpTrial.ts; harness only, off in the game): after the meters trim,
  // Force hours come off until the projected strain is within the effort's limit (force-xp-rework.md §4).
  let strain = { trimmed: 0, peak: 0, end: 0 };
  if (FORCE_XP_TRIAL.enabled) {
    strain = strainTrim(s, blocks, (bs) => orderBlocks(bs, forced), routine.effort, STEP_HOURS);
    if (strain.trimmed > 0) {
      ordered = orderBlocks(blocks.filter((b) => b.hours > 0), forced);
      projected = projectDay([...ordered, ...locked], start, caps).endF;
      notes.push(`Force XP trial: Force hours trimmed by ${strain.trimmed} h to keep projected strain under ${FORCE_XP_TRIAL.strainLimit[routine.effort]}`);
    }
  }
  if (FORCE_XP_TRIAL.enabled || FORCE_XP_TRIAL.collect)
    recordPlan(s, { endF: projected, meterTrim: trimmed.fill + trimmed.fixed, strainTrim: strain.trimmed, strainPeak: strain.peak, strainEnd: strain.end, forcePlanned: forceHours(blocks, 'planned') + forceHours(locked), forceKept: forceHours(blocks) + forceHours(locked) });
  if (trimmed.fill > 0) notes.push(`fill trimmed by ${trimmed.fill} h to stay under the ${routine.effort} tiredness limit ${limit}`);
  if (trimmed.fixed > 0) notes.push(`Order requirements excused for ${trimmed.fixed} h: the day started too tired (over the ${routine.effort} limit ${limit}; D-165)`);
  if (projected > limit + 1e-9) notes.push(`fixed and locked blocks alone end the day at f ${projected.toFixed(2)} (over the ${routine.effort} limit ${limit})`);
  // 5. Daily life outside the training budget (D-427): the meditation block and the Knight's study expectation come
  // after the day's training and are never trimmed; the budget, the fill and the projection above don't count them.
  const life = dailyLifeBlocks(s, row, day, accelerated);
  return { trainingDay: true, recovery: false, items: layout([...ordered, ...life], locked, routine.wakeSecond), budget, fillCredit: credit, projectedEndF: projected, notes };
}

/** The daily-life blocks of an Order member (D-427; DAILY_LIFE): meditation from Padawan on, study on 3 days of 7 from Knight on. */
export function dailyLifeBlocks(s: GameState, row: 'initiate' | 'padawan' | 'knight', day: number, accelerated: boolean): PlannedBlock[] {
  const path = selectPath(s);
  if (path !== 'jedi' && path !== 'sith') return [];
  const out: PlannedBlock[] = [];
  const block = (activityId: string, hours: number): PlannedBlock => {
    const act = ACTIVITY_BY_ID.get(activityId)!;
    const skillId = act.primary.kind === 'skill' ? act.primary.skill : activityId;
    return { kind: 'train', activityId, skillId, hours, planned: hours, startSecond: 0, source: { kind: 'solo' }, intensity: act.defaultIntensity, fixed: true, locked: false, fill: false };
  };
  if (DAILY_LIFE.meditation.fromRows.includes(row)) out.push(block(DAILY_LIFE.meditation.activityId, DAILY_LIFE.meditation.hours));
  // The study days: the same weekdays every week (design default: 3 of 7).
  if (row === 'knight' && !accelerated && weekday(day) % 2 === 0 && weekday(day) <= 2 * DAILY_LIFE.knightStudy.daysPerWeek) out.push(block(DAILY_LIFE.knightStudy.activityId[path]!, DAILY_LIFE.knightStudy.hours));
  return out;
}

/** Forms are trained only through their plan; any form in the plan or priorities is a lightsaber form. */
export const isFormSkill = (id: string): boolean => FORM_IDS.includes(id);
