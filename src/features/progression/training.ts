// Training resolution (architecture §4 step b, §12): turns an intent's activity into one computeXp
// session and the engine events that apply it. Feature rule code: pure, reads other features
// through selectors. An unknown or locked activity is rejected with a reason and never mapped to a
// nearby one (D-07, skills-and-activities.md §2).
import { ACTIVITY_BY_ID, DRILL_RATINGS, DRILL_RATING_NAMES, isPhysicalActivity, type ActivityDef, type Intensity, type Unlock } from '../../data/activities';
import { archetypeDef } from '../../data/archetypes';
import { PASSION_DARK_PRESSURE_PER_HOUR, STEP_HOURS } from '../../data/progression.config';
import { CATEGORY_RULES, FORM_IDS, SKILL_BY_ID } from '../../data/skills';
import { STUB_ALIGNMENT_MULT, STUB_DARK_PRESSURE, STUB_TEACHER_ARCHETYPE, STUB_TEACHER_START_AGE } from '../../data/stubs';
import { ageFactor } from '../../engine/ageFactor';
import { pickDrillRating, type Effort } from '../../engine/challenge';
import { closedFormLevel, phasesFor } from '../../engine/closedForm';
import { computeTrainingXp, type SessionSplit, type TrainingResult } from '../../engine/computeXp';
import { tierOf, levelWithNatural } from '../../engine/curve';
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
  selectCapacities,
  selectDespairMult,
  selectGriefMult,
  selectLevelExact,
  selectNatural,
  selectPerformance,
  selectRust,
  selectSkillXp,
  selectStateOfMind,
} from './selectors';

export interface TrainingRequest {
  activityId: string;
  intensity?: Intensity | undefined;
  /** The intent's skillId: picks the primary when the activity offers a choice. */
  skillId?: string | undefined;
  hours: number;
  teacherId?: string | null | undefined;
  partnerId?: string | null | undefined;
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
  const key = def.kind === 'form' ? '$mainForm' : skillId;
  const pace = { initiate: a.paces.initiate?.[key], padawan: a.paces.padawan?.[key], knight: a.paces.knight?.[key] };
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

/** The intensity and effort for a session (training-routines §3: push picks gap +10..+20). */
const effortFor = (i: Intensity): Effort => (i === 'intense' || i === 'extreme' ? 'push' : 'standard');

export function resolveTraining(s: GameState, req: TrainingRequest): TrainingPlan {
  const a = ACTIVITY_BY_ID.get(req.activityId);
  if (!a) return { ok: false, reason: `unknown activity "${req.activityId}" (no nearby activity is used)` };
  const prim = resolvePrimaries(s, a, req.skillId);
  if (typeof prim === 'string') return { ok: false, reason: `${a.name}: ${prim}` };
  for (const id of Object.keys(prim)) if (!SKILL_BY_ID.has(id)) return { ok: false, reason: `${a.name}: unknown skill ${id}` };
  const primary = Object.keys(prim)[0]!;
  const teacherId = req.teacherId ?? null;
  const partnerId = req.partnerId ?? null;
  const ctx: UnlockCtx = { state: s, primary, primaries: prim, teacher: teacherId !== null, partner: partnerId !== null };
  for (const u of a.unlock) {
    const fail = unlockFails(u, ctx);
    if (fail) return { ok: false, reason: `${a.name} is locked: ${fail}` };
  }
  const secondaries = resolveSecondaries(s, a, prim);
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
  const tLevel = levelAt(teacherId);
  const pLevel = levelAt(partnerId);
  if (teacherId && tLevel === null) notes.push(`teacher ${selectNpc(s, teacherId)?.name ?? teacherId} has no known age: counted as a partner`);
  const instr = instructionFactor({
    studentLevel,
    ...(tLevel !== null && teacherId ? { teacher: { level: tLevel, bond: bond(teacherId) } } : {}),
    ...(partnerId && pLevel !== null ? { partner: { level: pLevel, bond: bond(partnerId) } } : teacherId && tLevel === null ? { partner: { level: studentLevel, bond: bond(teacherId) } } : {}),
  });
  if (instr.note) notes.push(instr.note);

  // Drill rating (training-routines §3): Basic always; higher with a teacher at that rating or own level >= rating - 10.
  const available = DRILL_RATINGS.filter((r) => r === DRILL_RATINGS[0] || (tLevel !== null && tLevel >= r) || studentLevel >= r - 10);
  const challengeLevel = selectPerformance(s, primary) * (1 - selectRust(s, primary));
  const drillRating = pickDrillRating(challengeLevel, effortFor(intensity), available);

  // M per skill (progression-numbers §5): talent x cross-talent x instruction x age x state x alignment x species, capped at 2.8.
  const c = selectCharacter(s);
  const h = selectHumanAge(s);
  const state = selectStateOfMind(s);
  const grief = selectGriefMult(s);
  const despair = selectDespairMult(s);
  const m = (skill: string): number => {
    const def = SKILL_BY_ID.get(skill);
    if (!def) return 1;
    return speedM({
      talent: talentMult(c.talents, skill),
      crossTalent: crossTalentMult(c.talents, skill),
      instruction: instr.factor,
      age: ageFactor(CATEGORY_RULES[def.category].ageRow, h),
      state: stateMult(state, skill, { grief, despair, darkPressure: STUB_DARK_PRESSURE }),
      alignment: STUB_ALIGNMENT_MULT,
      species: speciesLearning(c.speciesId, skill),
    }).m;
  };

  // The D-48 clamp (D-104): share = max(focus share, the skill's share of training hours in the window).
  const today = selectNow(s).day;
  const win = s.progression.paceWindow;
  const hoursIn = (id: string): number => inWindow(win[id] ?? [], today).reduce((x, e) => x + e.hours, 0);
  const totalHours = Object.keys(win).reduce((x, id) => x + hoursIn(id), 0) + hours;
  // D-104 share; a skill's hours are its share of each session's XP (D-109), this session included.
  const windowAge = humanEquivalentAge(speciesDef(c.speciesId), selectExactAge(s) - 365 / 368);
  const clamp = (skill: string, wanted: number, sessionHours: number) => {
    const skillHours = hoursIn(skill) + sessionHours;
    const share = clampShare(c.focusWeights[skill] ?? 0, skillHours, totalHours);
    const used = inWindow(win[skill] ?? [], today).reduce((x, e) => x + e.xp, 0);
    return clampCredit(wanted, used, paceCap(windowAge, share));
  };

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
  notes.push(...r.notes);
  if ((state === 'fear' || state === 'anger' || state === 'hatred') && Object.keys(prim).some(isChannelEligible)) {
    notes.push(`channeling ${state}: +${(PASSION_DARK_PRESSURE_PER_HOUR * r.effectiveHours).toFixed(1)} dark pressure (recorded with alignment in M6)`);
  }

  const round = (rec: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, Math.round(v * 100) / 100]));
  const levels = Object.keys(prim).map((id) => {
    const after = Math.floor(levelWithNatural(selectSkillXp(s, id) + (r.credited[id] ?? 0), selectNatural(s, id)) + 1e-9);
    return { skillId: id, before: before[id]!, after, tier: tierOf(after) };
  });
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
    credited: round(r.credited),
    discarded: round(r.discarded),
    levels,
    tiredness: { p: tirednessLabel(r.meters.p / caps.p), m: tirednessLabel(r.meters.m / caps.m), f: tirednessLabel(r.meters.f / caps.f) },
    notes,
  };
  const events: GameEvent[] = [
    {
      type: 'activityResolved',
      activityId: a.id,
      primaries: Object.keys(prim),
      hours: r.hours,
      windowHours: r.windowHours,
      credited: r.credited,
      practiceHours: r.practiceHours,
      fatigueWillpower: r.fatigueWillpower,
      meditation: a.group === 'meditation',
      day: r.day,
    },
    { type: 'activityLoad', activityId: a.id, meters: r.meters },
  ];
  return { ok: true, card, events, rng: r.rng, hours: r.hours };
}
