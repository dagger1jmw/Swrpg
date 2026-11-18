// Training resolution (architecture §4 step b, §12): turns an intent's activity into one computeXp
// session and the engine events that apply it. Feature rule code: pure, reads other features
// through selectors. An unknown or locked activity is rejected with a reason and never mapped to a
// nearby one (D-07, skills-and-activities.md §2).
import { ORDER_CLASS_SPARRING, RECORDING_REVIEW_BONUS } from '../../data/progression.config';
import { splitDrillXp } from '../../engine/appliedExperience';
import { ACTIVITY_BY_ID, DRILL_RATINGS, DRILL_RATING_NAMES, isPhysicalActivity, type ActivityDef, type Intensity, type Unlock } from '../../data/activities';
import { archetypeDef } from '../../data/archetypes';
import { FORM_TRANSFER_SHARE, K, PASSION_DARK_PRESSURE_PER_HOUR, STEP_HOURS } from '../../data/progression.config';
import { CATEGORY_RULES, FORM_IDS, SKILL_BY_ID } from '../../data/skills';
import {
  STUB_ALIGNMENT_MULT,
  STUB_DARK_PRESSURE,
  STUB_INSTRUCTOR_LEAD,
  STUB_MASTER_LEAD,
  STUB_TEACHER_APTITUDE,
  STUB_TEACHER_ARCHETYPE,
  STUB_TEACHER_START_AGE,
} from '../../data/stubs';
import { TRAINING_RECORD_BY_ID } from '../../data/trainingRecords';
import { ageFactor } from '../../engine/ageFactor';
import { pickDrillRating, type Effort } from '../../engine/challenge';
import { closedFormLevel, formXps, phasesFor } from '../../engine/closedForm';
import { transferXp } from '../../engine/forms';
import { computeTrainingXp, type SessionSplit, type TrainingResult } from '../../engine/computeXp';
import { levelExact, tierOf, levelWithNatural, xpForLevel } from '../../engine/curve';
import { tirednessLabel } from '../../engine/fatigue';
import { instructionFactor } from '../../engine/instruction';
import { clampCredit, clampShare, inWindow, paceCap } from '../../engine/paceClamp';
import type { RngState } from '../../engine/rng';
import { humanEquivalentAge, naturalLevel, speciesLearning } from '../../engine/species';
import { crossTalentMult, isChannelEligible, speedM, stateMult, talentMult } from '../../engine/speed';
import { speciesDef } from '../../data/species';
import type { GameState } from '../../state/gameState';
import type { GameEvent } from '../../state/types';
import { selectCharacter, selectExactAge, selectHumanAge, selectPath } from '../character/selectors';
import { selectNow } from '../clock/selectors';
import { selectMeters } from '../health/selectors';
import { selectNpc, selectNpcAge } from '../npcs/selectors';
import { selectRank } from '../ranks/selectors';
import { selectRelationship } from '../relationships/selectors';
import {
  selectBank,
  selectCapacities,
  selectDespairMult,
  selectDrillCeiling,
  selectE,
  selectGriefMult,
  selectLevelExact,
  selectNatural,
  selectPerformance,
  selectRust,
  selectSkillXp,
  selectStateOfMind,
} from './selectors';

/**
 * Who teaches a session (D-124, D-125). `npc` / `partner` are NPC refs; `record` an archive record or
 * holocron; `instructor` (Temple instructors), `master` (a master with no NPC named) and `peers`
 * (Temple peers, an even partner) are the Order stubs; `solo` trains alone (self-study when the form is
 * new, D-126).
 */
export type TrainingSource =
  | { kind: 'npc'; id: string }
  | { kind: 'partner'; id: string }
  | { kind: 'record'; id: string }
  | { kind: 'instructor' }
  | { kind: 'master' }
  | { kind: 'peers' }
  | { kind: 'solo' };

export interface TrainingRequest {
  activityId: string;
  intensity?: Intensity | undefined;
  /** The intent's skillId: picks the primary when the activity offers a choice. */
  skillId?: string | undefined;
  hours: number;
  teacherId?: string | null | undefined;
  partnerId?: string | null | undefined;
  /** Overrides teacherId / partnerId when present (routines, the Train panel). */
  source?: TrainingSource | undefined;
  /** The routine's effort picks the drill band (training-routines §3); default from the intensity. */
  drillEffort?: Effort | undefined;
}

export interface TrainingCard {
  activityId: string;
  activityName: string;
  primaries: string[];
  hours: number;
  effectiveHours: number;
  intensity: Intensity;
  drillRating: number;
  drillName: string;
  challenge: number;
  outcome: string;
  outcomeMult: number;
  instruction: { mode: string; factor: number; teacherId?: string; partnerId?: string };
  /** XP credited per skill (rounded to 0.01). */
  credited: Record<string, number>;
  /**
   * After the session, per credited skill: total XP (natural baseline included, so it lines up with
   * the curve XP(L) = K * L^1.75), the displayed level, and the total XP the next level needs.
   */
  totals: Record<string, { xp: number; level: number; nextXp: number }>;
  discarded: Record<string, number>;
  /** Levels of the primaries before and after (displayed, natural baseline included). */
  levels: { skillId: string; before: number; after: number; tier: string }[];
  tiredness: { p: string; m: string; f: string };
  notes: string[];
}

export type TrainingPlan = { ok: false; reason: string } | { ok: true; card: TrainingCard; events: GameEvent[]; rng: RngState; hours: number };

const known = (s: GameState, id: string): boolean => selectLevelExact(s, id) >= 1;

/** The Teacher-level stub (architecture §15, D-56): the Average profile's closed-form level at the NPC's age. */
export function stubTeacherLevel(skillId: string, age: number): number {
  const a = archetypeDef(STUB_TEACHER_ARCHETYPE);
  const def = SKILL_BY_ID.get(skillId);
  if (!def) return 0;
  if (def.kind === 'form') {
    // A teacher of a form is assumed to specialize in it: the Average's form plan with that form as
    // the main form (Shii-Cho teachers keep Shii-Cho as main), D-118 / D-119.
    const other = skillId === 'ataru' ? 'soresu' : 'ataru';
    const xp = formXps({
      formPaces: a.formPaces,
      k: K,
      startAge: STUB_TEACHER_START_AGE,
      age,
      padawanAge: 12,
      knightAge: 20.5,
      onePhase: false,
      padawanPlan: { [skillId]: 2, [other]: 1 },
      knightPlan: { [skillId]: 2, [other]: 1 },
      mult: () => 1,
      transferShare: FORM_TRANSFER_SHARE,
    });
    return levelExact(Math.max(0, ...Object.values(xp)));
  }
  const pace = { initiate: a.paces.initiate?.[skillId], padawan: a.paces.padawan?.[skillId], knight: a.paces.knight?.[skillId] };
  const row = CATEGORY_RULES[def.category].ageRow;
  const trained = closedFormLevel({ row, startAge: STUB_TEACHER_START_AGE, age, phases: phasesFor(pace, { padawanAge: 12, knightAge: 20.5 }, false) });
  const n = naturalLevel(skillId, 'human', age);
  return n > 0 ? Math.pow(Math.pow(trained, 1.75) + Math.pow(n, 1.75), 1 / 1.75) : trained;
}

function resolvePrimaries(s: GameState, a: ActivityDef, skillId: string | undefined): Record<string, number> | string {
  const c = selectCharacter(s);
  const p = a.primary;
  switch (p.kind) {
    case 'skill':
      return { [p.skill]: 1 };
    case 'options': {
      if (skillId && p.options.includes(skillId)) return { [skillId]: 1 };
      const pick = p.options.find((o) => known(s, o)) ?? p.options[p.options.length - 1]!;
      return { [pick]: 1 };
    }
    case 'anyForm': {
      if (skillId && FORM_IDS.includes(skillId)) return { [skillId]: 1 };
      if (c.mainFormId) return { [c.mainFormId]: 1 };
      const best = [...FORM_IDS].sort((x, y) => selectLevelExact(s, y) - selectLevelExact(s, x))[0]!;
      return { [best]: 1 };
    }
    case 'formPair': {
      const first = skillId && FORM_IDS.includes(skillId) ? skillId : (c.mainFormId ?? null);
      const others = FORM_IDS.filter((f) => f !== first).sort((x, y) => selectLevelExact(s, y) - selectLevelExact(s, x));
      const second = c.secondFormId && c.secondFormId !== first ? c.secondFormId : others[0];
      if (!first || !second) return 'form combination drills need two forms';
      return { [first]: 1, [second]: 1 };
    }
    case 'anyAbility': {
      if (!skillId) return 'the generic ability drill needs the ability to drill (skillId)';
      if (SKILL_BY_ID.get(skillId)?.kind !== 'forceAbility') return `${skillId} is not a Force ability`;
      return { [skillId]: 1 };
    }
  }
}

function resolveSecondaries(s: GameState, a: ActivityDef, primaries: Record<string, number>): Record<string, number> {
  const c = selectCharacter(s);
  const out: Record<string, number> = {};
  for (const [k, w] of Object.entries(a.secondaries)) {
    if (k === '$secondForm') {
      if (c.secondFormId && !(c.secondFormId in primaries)) out[c.secondFormId] = (out[c.secondFormId] ?? 0) + w;
    } else if (k === '$knownForms') {
      const forms = FORM_IDS.filter((f) => !(f in primaries) && known(s, f));
      for (const f of forms) out[f] = (out[f] ?? 0) + w / forms.length;
    } else if (k === '$pairedStat') {
      const other = 'agility' in primaries ? 'strength' : 'agility';
      out[other] = (out[other] ?? 0) + w;
    } else if (!(k in primaries)) out[k] = (out[k] ?? 0) + w;
  }
  return out;
}

interface UnlockCtx {
  state: GameState;
  primary: string;
  primaries: Record<string, number>;
  teacher: boolean;
  partner: boolean;
}

function unlockFails(u: Unlock, ctx: UnlockCtx): string | null {
  const s = ctx.state;
  const skill = (id: string): string => (id === '$primary' ? ctx.primary : id);
  const name = (id: string): string => SKILL_BY_ID.get(id)?.name ?? id;
  switch (u.kind) {
    case 'always':
      return null;
    case 'supervisedOrLevel':
      return ctx.teacher || selectLevelExact(s, u.skill) >= u.min ? null : `needs a teacher present until ${name(u.skill)} reaches ${u.min}`;
    case 'level':
      return selectLevelExact(s, skill(u.skill)) >= u.min ? null : `needs ${name(skill(u.skill))} ${u.min}`;
    case 'known':
      return known(s, skill(u.skill)) ? null : `${name(skill(u.skill))} is not known yet`;
    case 'knownOrTeacher':
      return known(s, skill(u.skill)) || ctx.teacher ? null : `${name(skill(u.skill))} is not known yet (a teacher can start it)`;
    case 'formsKnown':
      return FORM_IDS.filter((f) => known(s, f)).length >= u.min ? null : `needs ${u.min} known forms`;
    case 'pairMin':
      return Object.keys(ctx.primaries).every((f) => selectLevelExact(s, f) >= u.min) ? null : `needs both forms at ${u.min}`;
    case 'anyAbilityLevel':
      return [...SKILL_BY_ID.values()].some((d) => d.kind === 'forceAbility' && selectLevelExact(s, d.id) >= u.min) ? null : `needs a Force ability at ${u.min}`;
    case 'rank':
      return u.ranks.includes(selectRank(s)) ? null : `only for ${u.ranks.join(' or ')}`;
    case 'notRank':
      return u.ranks.includes(selectRank(s)) ? `not for ${u.ranks.join(' or ')}` : null;
    case 'path':
      return u.paths.includes(selectPath(s)) ? null : `only for the ${u.paths.join(' or ')} path`;
    case 'hasApprentice':
      return 'needs an apprentice (M7)';
    case 'partner':
      return ctx.partner ? null : 'needs a training partner present';
  }
}

/** M per skill (progression-numbers §5): talent x cross-talent x instruction x age x state x alignment x species, capped at 2.8. */
export function speedFor(s: GameState, instruction: number): (skill: string) => number {
  const c = selectCharacter(s);
  const h = selectHumanAge(s);
  const state = selectStateOfMind(s);
  const grief = selectGriefMult(s);
  const despair = selectDespairMult(s);
  return (skill: string): number => {
    const def = SKILL_BY_ID.get(skill);
    if (!def) return 1;
    return speedM({
      talent: talentMult(c.talents, skill),
      crossTalent: crossTalentMult(c.talents, skill),
      instruction,
      age: ageFactor(CATEGORY_RULES[def.category].ageRow, h),
      state: stateMult(state, skill, { grief, despair, darkPressure: STUB_DARK_PRESSURE }),
      alignment: STUB_ALIGNMENT_MULT,
      species: speciesLearning(c.speciesId, skill),
    }).m * reviewBuff(s, skill);
  };
}

/** Reviewing a recording of one's own fight: +5% XP to that skill for 3 days (progression-numbers §19, D-154). */
function reviewBuff(s: GameState, skill: string): number {
  const b = s.progression.reviewBuff;
  return b && b.skillId === skill && selectNow(s).day <= b.untilDay ? 1 + RECORDING_REVIEW_BONUS : 1;
}

/**
 * The D-48 clamp (D-104): share = max(focus share, the skill's share of training hours in the window);
 * a skill's hours are its share of each session's XP (D-109), this session's `hours` included.
 */
export function clampFor(s: GameState, hours: number): (skill: string, wanted: number, sessionHours: number) => { credited: number; discarded: number } {
  const c = selectCharacter(s);
  const today = selectNow(s).day;
  const win = s.progression.paceWindow;
  const hoursIn = (id: string): number => inWindow(win[id] ?? [], today).reduce((x, e) => x + e.hours, 0);
  const totalHours = Object.keys(win).reduce((x, id) => x + hoursIn(id), 0) + hours;
  const windowAge = humanEquivalentAge(speciesDef(c.speciesId), selectExactAge(s) - 365 / 368);
  return (skill, wanted, sessionHours) => {
    const skillHours = hoursIn(skill) + sessionHours;
    const share = clampShare(c.focusWeights[skill] ?? 0, skillHours, totalHours);
    const used = inWindow(win[skill] ?? [], today).reduce((x, e) => x + e.xp, 0);
    return clampCredit(wanted, used, paceCap(windowAge, share));
  };
}

/** The intensity and effort for a session (training-routines §3: push picks gap +10..+20). */
const effortFor = (i: Intensity): Effort => (i === 'intense' || i === 'extreme' ? 'push' : 'standard');

export function resolveTraining(initial: GameState, req: TrainingRequest): TrainingPlan {
  let s = initial;
  const a = ACTIVITY_BY_ID.get(req.activityId);
  if (!a) return { ok: false, reason: `unknown activity "${req.activityId}" (no nearby activity is used)` };
  const prim = resolvePrimaries(s, a, req.skillId);
  if (typeof prim === 'string') return { ok: false, reason: `${a.name}: ${prim}` };
  for (const id of Object.keys(prim)) if (!SKILL_BY_ID.has(id)) return { ok: false, reason: `${a.name}: unknown skill ${id}` };
  const primary = Object.keys(prim)[0]!;
  const source: TrainingSource | null =
    req.source ?? (req.teacherId ? { kind: 'npc', id: req.teacherId } : req.partnerId ? { kind: 'partner', id: req.partnerId } : null);
  const teacherId = source?.kind === 'npc' ? source.id : null;
  const partnerId = source?.kind === 'partner' ? source.id : req.source === undefined ? (req.partnerId ?? null) : null;
  const record = source?.kind === 'record' ? TRAINING_RECORD_BY_ID.get(source.id) : undefined;
  if (source?.kind === 'record') {
    if (!record) return { ok: false, reason: `unknown training record ${source.id}` };
    if (record.kind === 'archive' && !record.paths.includes(selectPath(s))) return { ok: false, reason: `${record.name} is not open to the ${selectPath(s)} path` };
    if (record.levels[primary] === undefined) return { ok: false, reason: `${record.name} does not cover ${SKILL_BY_ID.get(primary)?.name ?? primary}` };
  }
  const teaching = teacherId !== null || record !== undefined || source?.kind === 'instructor' || source?.kind === 'master';
  const partnered = partnerId !== null || source?.kind === 'peers';
  const ctx: UnlockCtx = { state: s, primary, primaries: prim, teacher: teaching, partner: partnered };
  const selfStudyStart: string[] = [];
  for (const u of a.unlock) {
    const fail = unlockFails(u, ctx);
    // Self-study (D-126): an unknown form's basics drill opens without a teacher; slow (solo x0.90 and
    // a drill rating one step lower while the form stays self-taught).
    if (fail && u.kind === 'knownOrTeacher' && SKILL_BY_ID.get(primary)?.kind === 'form') {
      selfStudyStart.push(primary);
      continue;
    }
    if (fail) return { ok: false, reason: `${a.name} is locked: ${fail}` };
  }
  const secondaries = resolveSecondaries(s, a, prim);

  // Fundamentals transfer (D-119): a lightsaber form's first session as the primary starts it at 0.75 x
  // the highest form's XP, once per form, outside the 4.0x clamp. The session then runs on top of it.
  const transfer: Record<string, number> = {};
  const formXp = (id: string): number => s.progression.skills[id]?.xp ?? 0;
  for (const id of Object.keys(prim)) {
    if (SKILL_BY_ID.get(id)?.kind !== 'form' || s.progression.formsStarted.includes(id)) continue;
    const t = transferXp(id, formXp);
    if (t > 0) transfer[id] = t;
  }
  const transferNotes = Object.entries(transfer).map(
    ([id, x]) =>
      `fundamentals transfer: ${SKILL_BY_ID.get(id)?.name ?? id} starts at ${Math.round(FORM_TRANSFER_SHARE * 100)}% of ${id === 'niman' ? 'the average of Forms I, III, IV and V' : 'the highest form'} (+${x.toFixed(1)} XP, outside the pace limit)`,
  );
  if (Object.keys(transfer).length) {
    const skills = { ...s.progression.skills };
    for (const [id, x] of Object.entries(transfer)) skills[id] = { ...(skills[id] ?? { xp: 0, rust: 0, lastPracticedDay: null }), xp: formXp(id) + x };
    s = { ...s, progression: { ...s.progression, skills } };
  }
  const split: SessionSplit = { primaries: prim, secondaries };

  const notes: string[] = [];
  const maxH = a.maxSessionHours ?? Infinity;
  let hours = Math.max(STEP_HOURS, Math.round(Math.min(req.hours, maxH) / STEP_HOURS) * STEP_HOURS);
  if (req.hours > maxH) notes.push(`${a.name} is limited to ${maxH} h per session`);
  if (hours > 12) hours = 12;
  const intensity = req.intensity ?? a.defaultIntensity;

  // Instruction (§15, §19): the teacher's level in THIS skill (stub: the Average closed form at their age).
  const studentLevel = selectLevelExact(s, primary);
  const levelAt = (id: string | null): number | null => {
    if (!id) return null;
    const age = selectNpcAge(s, id);
    return age === null ? null : stubTeacherLevel(primary, age);
  };
  const bond = (id: string | null): boolean => (id ? (selectRelationship(s, id)?.value ?? 0) >= 20 : false);
  const npcTeacherLevel = levelAt(teacherId);
  const pLevel = source?.kind === 'peers' ? studentLevel : levelAt(partnerId);
  if (teacherId && npcTeacherLevel === null) notes.push(`teacher ${selectNpc(s, teacherId)?.name ?? teacherId} has no known age: counted as a partner`);
  // Order stubs (D-124): instructors and an unnamed master teach a fixed number of levels ahead.
  const tLevel =
    npcTeacherLevel ??
    (record ? record.levels[primary]! : source?.kind === 'instructor' ? studentLevel + STUB_INSTRUCTOR_LEAD : source?.kind === 'master' ? studentLevel + STUB_MASTER_LEAD : null);
  if (source?.kind === 'instructor') notes.push('Temple instructors (stub teacher, D-124)');
  if (source?.kind === 'master') notes.push('master (stub teacher until masters exist, D-124)');
  if (record) notes.push(`${record.name} (teaches at level ${tLevel})${record.kind === 'holocron' ? '; possession is trusted until items exist (M8)' : ''}`);
  const instr = instructionFactor({
    studentLevel,
    ...(tLevel !== null && (teacherId || record || source?.kind === 'instructor' || source?.kind === 'master')
      ? { teacher: { level: tLevel, bond: bond(teacherId), aptitude: STUB_TEACHER_APTITUDE, ...(record ? { holocron: true, physical: SKILL_BY_ID.get(primary)?.category === 'technique' } : {}) } }
      : {}),
    ...((partnerId || source?.kind === 'peers') && pLevel !== null
      ? { partner: { level: pLevel, bond: bond(partnerId) } }
      : teacherId && npcTeacherLevel === null
        ? { partner: { level: studentLevel, bond: bond(teacherId) } }
        : {}),
  });
  if (instr.note) notes.push(instr.note);

  // Drill rating (training-routines §3): Basic always; higher with a teacher at that rating or own level >= rating - 10.
  const available = DRILL_RATINGS.filter((r) => r === DRILL_RATINGS[0] || (tLevel !== null && tLevel >= r) || studentLevel >= r - 10);
  const challengeLevel = selectPerformance(s, primary) * (1 - selectRust(s, primary));
  let drillRating = pickDrillRating(challengeLevel, req.drillEffort ?? effortFor(intensity), available);
  // Self-study (D-126): a self-taught form trained without teaching drills one rating lower.
  const selfTaught = !teaching && Object.keys(prim).some((id) => selfStudyStart.includes(id) || s.progression.selfTaught.includes(id));
  if (selfTaught) {
    const lower = [...available].filter((r) => r < drillRating).pop();
    if (lower !== undefined) drillRating = lower;
    notes.push(`self-study: no teacher, drilled at a lower rating (${DRILL_RATING_NAMES[drillRating] ?? drillRating})`);
  }

  const state = selectStateOfMind(s);
  const m = speedFor(s, instr.factor);
  const clamp = clampFor(s, hours);

  const caps = selectCapacities(s);
  const before: Record<string, number> = Object.fromEntries(Object.keys(prim).map((id) => [id, Math.floor(selectLevelExact(s, id) + 1e-9)]));
  const r: TrainingResult = computeTrainingXp({
    activityId: a.id,
    load: a.load,
    physical: isPhysicalActivity(a),
    meditation: a.group === 'meditation',
    hours,
    intensity,
    drillRating,
    challengeLevel,
    split,
    meters: selectMeters(s),
    caps,
    day: { hoursByActivity: s.progression.today.hoursByActivity, postWindow: s.progression.today.postWindow, lastPhysicalHeavy: s.progression.today.lastPhysicalHeavy },
    halveFatigueWillpower: s.progression.overtrainStreak >= 2,
    willpowerToday: s.progression.willpowerToday,
    m,
    levelOf: (id) => selectLevelExact(s, id),
    xpOf: (id) => selectSkillXp(s, id),
    naturalOf: (id) => selectNatural(s, id),
    clamp,
    rng: s.meta.rngState,
  });
  notes.push(...transferNotes, ...r.notes);
  if ((state === 'fear' || state === 'anger' || state === 'hatred') && Object.keys(prim).some(isChannelEligible)) {
    notes.push(`channeling ${state}: +${(PASSION_DARK_PRESSURE_PER_HOUR * r.effectiveHours).toFixed(1)} dark pressure (recorded with alignment in M6)`);
  }

  // The drill ceiling on lightsaber forms (progression-numbers §7; D-45): below 25 + E the XP applies in full; past it
  // 25% applies and 75% is banked (cap 15 levels). Applied here so the card, the event and the save agree.
  const credited: Record<string, number> = { ...r.credited };
  const banked: Record<string, number> = {};
  for (const [id, x] of Object.entries(r.credited)) {
    if (SKILL_BY_ID.get(id)?.kind !== 'form' || x <= 0) continue;
    const split = splitDrillXp(selectSkillXp(s, id) + (transfer[id] ?? 0), x, selectE(s, id), selectBank(s, id));
    credited[id] = split.applied;
    if (split.banked > 0) banked[id] = split.banked;
    if (split.banked > 0 || split.overflow > 0) {
      const lost = split.overflow > 0 ? `, ${split.overflow.toFixed(2)} lost (bank full)` : '';
      notes.push(`${SKILL_BY_ID.get(id)!.name}: drill ceiling ${selectDrillCeiling(s, id).toFixed(1)}: ${split.applied.toFixed(2)} XP applied, ${split.banked.toFixed(2)} banked${lost}`);
    }
  }
  const round = (rec: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, Math.round(v * 100) / 100]));
  const levels = Object.keys(prim).map((id) => {
    const after = Math.floor(levelWithNatural(selectSkillXp(s, id) + (credited[id] ?? 0), selectNatural(s, id)) + 1e-9);
    return { skillId: id, before: before[id]!, after, tier: tierOf(after) };
  });
  const totals: TrainingCard['totals'] = {};
  for (const [id, v] of Object.entries(credited)) {
    if (v < 0.05) continue;
    const total = xpForLevel(selectNatural(s, id)) + selectSkillXp(s, id) + v;
    const level = Math.floor(levelWithNatural(selectSkillXp(s, id) + v, selectNatural(s, id)) + 1e-9);
    totals[id] = { xp: Math.round(total * 10) / 10, level, nextXp: Math.round(xpForLevel(level + 1) * 10) / 10 };
  }
  const card: TrainingCard = {
    activityId: a.id,
    activityName: a.name,
    primaries: Object.keys(prim),
    hours: r.hours,
    effectiveHours: Math.round(r.effectiveHours * 100) / 100,
    intensity,
    drillRating,
    drillName: DRILL_RATING_NAMES[drillRating] ?? String(drillRating),
    challenge: Math.round(r.challenge * 100) / 100,
    outcome: r.outcome.name,
    outcomeMult: r.outcome.mult,
    instruction: { mode: instr.mode, factor: Math.round(instr.factor * 1000) / 1000, ...(teacherId ? { teacherId } : {}), ...(partnerId ? { partnerId } : {}) },
    credited: round(credited),
    totals,
    discarded: round(r.discarded),
    levels,
    tiredness: { p: tirednessLabel(r.meters.p / caps.p), m: tirednessLabel(r.meters.m / caps.m), f: tirednessLabel(r.meters.f / caps.f) },
    notes,
  };
  const orderClass = ORDER_CLASS_SPARRING[a.id];
  const sparKind: 'sparPeer' | 'sparMaster' | undefined = a.sparring
    ? source?.kind === 'master' || teacherId
      ? 'sparMaster'
      : 'sparPeer'
    : orderClass && (source?.kind === 'instructor' || source?.kind === 'master' || teacherId)
      ? orderClass
      : undefined;
  const events: GameEvent[] = [
    {
      type: 'activityResolved',
      activityId: a.id,
      primaries: Object.keys(prim),
      hours: r.hours,
      windowHours: r.windowHours,
      credited,
      ...(Object.keys(banked).length ? { banked } : {}),
      practiceHours: r.practiceHours,
      ...(Object.keys(transfer).length ? { transfer } : {}),
      // D-126: forms started by self-study become self-taught; a taught session ends that.
      ...(selfStudyStart.length ? { selfTaughtStarted: selfStudyStart } : {}),
      ...(teaching ? { taught: Object.keys(prim).filter((id) => s.progression.selfTaught.includes(id)) } : {}),
      fatigueWillpower: r.fatigueWillpower,
      meditation: a.group === 'meditation',
      // Sparring for applied experience E (progression-numbers §7): partner sparring, and the Order classes that count
      // as sparring when taught (D-143 A: the Initiate forms class with instructors, the Padawan master session).
      ...(sparKind ? { sparring: sparKind } : {}),
      day: r.day,
    },
    { type: 'activityLoad', activityId: a.id, meters: r.meters },
  ];
  return { ok: true, card, events, rng: r.rng, hours: r.hours };
}
