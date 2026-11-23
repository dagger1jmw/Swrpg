// Training resolution (architecture §4 step b, §12): turns an intent's activity into one computeXp
// session and the engine events that apply it. Feature rule code: pure, reads other features
// through selectors. An unknown or locked activity is rejected with a reason and never mapped to a
// nearby one (D-07, skills-and-activities.md §2).
import { ACCELERATED_PATH, FORCE_RICH_FACTOR, INSTRUCTOR_SHARE, INTENSITY, MAJOR_NEXUS_FACTOR, NEXUS_SITE_FACTOR, ORDER_SPARRING_CLASSES, RECORDING_REVIEW_BONUS } from '../../data/progression.config';
import { forceFraction } from '../../engine/forceMeter';
import { sparringE, splitDrillXp, type SparE } from '../../engine/appliedExperience';
import { ACTIVITY_BY_ID, DRILL_RATINGS, DRILL_RATING_NAMES, isPhysicalActivity, type ActivityDef, type Intensity, type Unlock } from '../../data/activities';
import { FORM_TRANSFER_SHARE, PASSION_DARK_PRESSURE_PER_HOUR, STEP_HOURS } from '../../data/progression.config';
import { CATEGORY_RULES, FORM_IDS, SKILL_BY_ID } from '../../data/skills';
import {
  STUB_ALIGNMENT_MULT,
  STUB_DARK_PRESSURE,
  STUB_INSTRUCTOR_LEAD,
  STUB_MASTER_LEAD,
  STUB_TEACHER_APTITUDE,
} from '../../data/stubs';
import { TRAINING_RECORD_BY_ID } from '../../data/trainingRecords';
import { dateFromAbsDay } from '../../engine/calendar';
import { VAAPAD_MASTER_LEVEL, vaapadAccess, type VaapadTeacher } from './formAccess';
import { ageFactor } from '../../engine/ageFactor';
import { pickDrillRating, type Effort } from '../../engine/challenge';
import { FORCE_XP_TRIAL } from '../../engine/forceXpTrial';
import { forceSessionRating, recordChallenge, trialMeditation } from './forceXpTrialHook';
import { transferXp } from '../../engine/forms';
import { computeTrainingXp, type SessionSplit, type TrainingResult } from '../../engine/computeXp';
import { levelExact, tierOf, levelWithNatural, xpForLevel } from '../../engine/curve';
import { tirednessLabel } from '../../engine/fatigue';
import { instructionFactor } from '../../engine/instruction';
import { clampCredit, inWindow, paceCap } from '../../engine/paceClamp';
import { nextFloat, type RngState } from '../../engine/rng';
import { humanEquivalentAge, speciesLearning } from '../../engine/species';
import { conditionedCap, conditionedM, crossTalentMult, isAcceleratedSkill, isChannelEligible, isForceSkill, speedM, stateMult, talentMult } from '../../engine/speed';
import { selectCurrentLocationId, selectLocationChain } from '../locations/selectors';
import { forceBonusAt, type NexusLeaning } from '../../data/forceNexus';
import { speciesDef } from '../../data/species';
import type { GameState } from '../../state/gameState';
import type { GameEvent } from '../../state/types';
import { selectCharacter, selectExactAge, selectHumanAge, selectPath } from '../character/selectors';
import { selectNow } from '../clock/selectors';
import { selectMeters } from '../health/selectors';
import { selectNpc, selectNpcAgeOrDefault, selectNpcLevel } from '../npcs/selectors';
import { covertDiscoveryChance, selectOrderPowerVerdict, selectRank } from '../ranks/selectors';
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
  /** Each primary's M and its parts (why a session is fast or slow; the clamp report reads it). */
  speed: Record<string, SpeedParts>;
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
    if (k === '$mainForm') {
      // The main form (no activity uses it since D-450 dropped teaching's review share; kept for the token).
      if (c.mainFormId && !(c.mainFormId in primaries)) out[c.mainFormId] = (out[c.mainFormId] ?? 0) + w;
    } else if (k === '$secondForm') {
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
  /** The fundamentals transfer this session would give (D-119): level gates read the level after it (D-173). */
  transfer: Readonly<Record<string, number>>;
  /** Vaapad's teacher, if this session's teacher qualifies (D-370). */
  vaapadTeacher: VaapadTeacher | null;
  /** This session's training record, if any. */
  recordId: string | null;
}

/** A named NPC teacher as a Vaapad teacher (D-370): Windu (teaching is his permission), Bulq, or a Vaapad master. */
function vaapadTeacherOf(s: GameState, teacherId: string | null): VaapadTeacher | null {
  if (!teacherId) return null;
  const canonId = selectNpc(s, teacherId)?.canonId ?? null;
  if (canonId === 'lore:mace-windu') return { kind: 'windu', permission: true };
  if (canonId === 'lore:sora-bulq') return { kind: 'bulq' };
  return (selectNpcLevel(s, teacherId, 'vaapad') ?? 0) >= VAAPAD_MASTER_LEVEL ? { kind: 'master' } : null;
}

/** A skill's level with this session's fundamentals transfer, if any (D-173). */
function levelAfterTransfer(ctx: UnlockCtx, id: string): number {
  const t = ctx.transfer[id] ?? 0;
  return t > 0 ? levelExact((ctx.state.progression.skills[id]?.xp ?? 0) + t) : selectLevelExact(ctx.state, id);
}

function unlockFails(u: Unlock, ctx: UnlockCtx): string | null {
  const s = ctx.state;
  const skill = (id: string): string => (id === '$primary' ? ctx.primary : id);
  const name = (id: string): string => SKILL_BY_ID.get(id)?.name ?? id;
  switch (u.kind) {
    case 'always':
      return null;
    case 'supervisedOrLevel':
      return ctx.teacher || levelAfterTransfer(ctx, u.skill) >= u.min ? null : `needs a teacher present until ${name(u.skill)} reaches ${u.min}`;
    case 'level':
      return levelAfterTransfer(ctx, skill(u.skill)) >= u.min ? null : `needs ${name(skill(u.skill))} ${u.min}`;
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
    case 'formGate': {
      if (known(s, ctx.primary)) return null;
      if (ctx.primary !== 'vaapad') return `${name(ctx.primary)} is not known yet`;
      const a = vaapadAccess({
        year: dateFromAbsDay(selectNow(s).day).year,
        teacher: ctx.vaapadTeacher,
        records: ctx.recordId === 'record:njoFormVII',
        // Light side only: until alignment is built (M6), the Sith path stands in for a dark-side character.
        lightSide: selectPath(s) !== 'sith',
        juyoLevel: selectLevelExact(s, 'juyo'),
      });
      return a.ok ? null : a.reason;
    }
    case 'hasApprentice':
      return s.ranks.apprenticeId ? null : 'needs a Padawan of your own (apprenticeTaken)';
    case 'partner':
      return ctx.partner ? null : 'needs a training partner present';
  }
}

/** The parts of a skill's M (progression-numbers §5, D-418): the multipliers before the 2.8 cap, the place and path after. */
export interface SpeedParts {
  talent: number;
  crossTalent: number;
  instruction: number;
  age: number;
  state: number;
  species: number;
  /** A Force-rich place (Force skills only; inside the 2.8 cap). */
  place: number;
  /** The accelerated path (past the cap). */
  accelerated: number;
  /** Reviewing a recording of one's own fight. */
  review: number;
  /** The M used: speedM's (capped) times the conditions and the review. */
  m: number;
}

/** M per skill with its parts (progression-numbers §5): talent x cross-talent x instruction x age x state x alignment x species, capped at 2.8. */
export function speedPartsFor(s: GameState, instruction: number): (skill: string) => SpeedParts | null {
  const c = selectCharacter(s);
  const h = selectHumanAge(s);
  const state = selectStateOfMind(s);
  const grief = selectGriefMult(s);
  const despair = selectDespairMult(s);
  const conditions = selectTrainingConditions(s);
  return (skill: string): SpeedParts | null => {
    const def = SKILL_BY_ID.get(skill);
    if (!def) return null;
    const parts = {
      talent: talentMult(c.talents, skill),
      crossTalent: crossTalentMult(c.talents, skill),
      instruction,
      age: ageFactor(CATEGORY_RULES[def.category].ageRow, h),
      state: stateMult(state, skill, { grief, despair, darkPressure: STUB_DARK_PRESSURE }),
      alignment: STUB_ALIGNMENT_MULT,
      species: speciesLearning(c.speciesId, skill),
    };
    const m = speedM(parts).m;
    const review = reviewBuff(s, skill);
    return {
      talent: parts.talent,
      crossTalent: parts.crossTalent,
      instruction,
      age: parts.age,
      state: parts.state,
      species: parts.species,
      place: isForceSkill(skill) ? conditions.forceFactor : 1,
      accelerated: conditions.accelerated && isAcceleratedSkill(skill) ? ACCELERATED_PATH.mult : 1,
      review,
      m: conditionedM(m, skill, conditions) * review,
    };
  };
}

/** M per skill (progression-numbers §5): talent x cross-talent x instruction x age x state x alignment x species, capped at 2.8. */
export function speedFor(s: GameState, instruction: number): (skill: string) => number {
  const parts = speedPartsFor(s, instruction);
  return (skill: string): number => parts(skill)?.m ?? 1;
}

/**
 * The character's leaning for the place bonus (D-432): the path's until alignment exists (M6): a Jedi light, a Sith dark,
 * anyone else balanced (a balanced place only). Design default.
 */
export function selectCharacterLeaning(s: GameState): NexusLeaning {
  const path = selectCharacter(s).path;
  return path === 'jedi' ? 'light' : path === 'sith' ? 'dark' : 'balanced';
}

/** The special training conditions in force now (D-418, D-432): the accelerated path, and a Force-rich place's factor. */
export function selectTrainingConditions(s: GameState): { accelerated: boolean; forceRich: boolean; forceFactor: number; site: string | null } {
  const names = selectLocationChain(s, selectCurrentLocationId(s)).flatMap((l) => [l.name, ...l.aliases, l.region ?? ''].filter(Boolean));
  const bonus = forceBonusAt(names, dateFromAbsDay(selectNow(s).day).year, selectCharacterLeaning(s), { world: FORCE_RICH_FACTOR, major: MAJOR_NEXUS_FACTOR, site: NEXUS_SITE_FACTOR });
  return { accelerated: selectCharacter(s).trainingPath === 'accelerated', forceRich: bonus !== null, forceFactor: bonus?.factor ?? 1, site: bonus?.nexus.name ?? null };
}

/** Reviewing a recording of one's own fight: +5% XP to that skill for 3 days (progression-numbers §19, D-154). */
function reviewBuff(s: GameState, skill: string): number {
  const b = s.progression.reviewBuff;
  return b && b.skillId === skill && selectNow(s).day <= b.untilDay ? 1 + RECORDING_REVIEW_BONUS : 1;
}

/**
 * The D-48 clamp (D-457, Jared: the ceiling limits prodigy speed, never focus): a skill's cap is 4.0 x the Average's XP per
 * hour in that skill at the window's start age x the character's hours in that skill in the window, this session's
 * included (a session's hours by XP share, D-109). Hours in other skills never change it.
 */
export function clampFor(s: GameState): (skill: string, wanted: number, sessionHours: number) => { credited: number; discarded: number } {
  const c = selectCharacter(s);
  const today = selectNow(s).day;
  const win = s.progression.paceWindow;
  const windowAge = humanEquivalentAge(speciesDef(c.speciesId), selectExactAge(s) - 365 / 368);
  const accelerated = c.trainingPath === 'accelerated';
  return (skill, wanted, sessionHours) => {
    const entries = inWindow(win[skill] ?? [], today);
    const skillHours = entries.reduce((x, e) => x + e.hours, 0) + sessionHours;
    const used = entries.reduce((x, e) => x + e.xp, 0);
    // The accelerated path is the only condition allowed past the 4.0x ceiling (D-418).
    return clampCredit(wanted, used, conditionedCap(paceCap(skill, windowAge, skillHours), skill, accelerated));
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
    if (record.fromYear !== undefined && dateFromAbsDay(selectNow(s).day).year < record.fromYear) return { ok: false, reason: `${record.name} does not exist yet` };
    if (record.places) {
      const here = selectLocationChain(s, selectCurrentLocationId(s)).flatMap((l) => [l.name, ...l.aliases, l.region ?? '']).map((x) => ` ${x.toLowerCase()} `);
      if (!record.places.some((p) => here.some((h) => h.includes(` ${p.toLowerCase()} `)))) return { ok: false, reason: `${record.name} can be studied only at ${record.places.join(' or ')}` };
    }
  }
  const teaching = teacherId !== null || record !== undefined || source?.kind === 'instructor' || source?.kind === 'master';
  // The Jedi Order's rules on powers (D-346, D-436): an Order teacher (the Temple's instructors, a Jedi master or Jedi
  // teacher, Jedi records) refuses a forbidden or dark-side power; learning it any other way is covert.
  const orderTeacher =
    source?.kind === 'instructor' || source?.kind === 'master' || (teacherId !== null && selectNpc(s, teacherId)?.factionId === 'jediOrder') || (record !== undefined && (record.paths.includes('jedi') || record.tradition === 'jedi'));
  const verdict = SKILL_BY_ID.get(primary)?.kind === 'forceAbility' ? selectOrderPowerVerdict(s, primary, orderTeacher) : ({ kind: 'open' } as { kind: 'open'; note?: string });
  if (verdict.kind === 'refused') return { ok: false, reason: verdict.reason };
  const partnered = partnerId !== null || source?.kind === 'peers';
  // Fundamentals transfer (D-119): a lightsaber form's first session as the primary starts it at 0.75 x
  // the highest form's XP, once per form, outside the 4.0x clamp. The session then runs on top of it. Worked out
  // before the unlock checks, so a level gate reads the level after the transfer (D-173: Shii-Cho's teacher gate).
  const transfer: Record<string, number> = {};
  const formXp = (id: string): number => s.progression.skills[id]?.xp ?? 0;
  for (const id of Object.keys(prim)) {
    if (SKILL_BY_ID.get(id)?.kind !== 'form' || s.progression.formsStarted.includes(id)) continue;
    const t = transferXp(id, formXp);
    if (t > 0) transfer[id] = t;
  }
  const ctx: UnlockCtx = { state: s, primary, primaries: prim, teacher: teaching, partner: partnered, transfer, vaapadTeacher: vaapadTeacherOf(s, teacherId), recordId: record?.id ?? null };
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
  // M5: a named NPC's own level in this skill (NPC generation; canon NPCs from their sheet), replacing the teacher stub.
  const levelAt = (id: string | null): number | null => (id && selectNpc(s, id) ? selectNpcLevel(s, id, primary) : null);
  const bond = (id: string | null): boolean => (id ? (selectRelationship(s, id)?.value ?? 0) >= 20 : false);
  const npcTeacherLevel = levelAt(teacherId);
  const pLevel = source?.kind === 'peers' ? studentLevel : levelAt(partnerId);
  if (teacherId && npcTeacherLevel === null) notes.push(`teacher ${teacherId} is unknown: counted as a partner`);
  // Order stubs (D-124): instructors and an unnamed master teach a fixed number of levels ahead.
  const tLevel =
    npcTeacherLevel ??
    (record ? record.levels[primary]! : source?.kind === 'instructor' ? studentLevel + STUB_INSTRUCTOR_LEAD : source?.kind === 'master' ? studentLevel + STUB_MASTER_LEAD : null);
  if (source?.kind === 'instructor') notes.push('Temple instructors (stub teacher, D-124)');
  if (source?.kind === 'master') notes.push('master (stub teacher until masters exist, D-124)');
  if (record) notes.push(`${record.name} (teaches at level ${tLevel})${record.kind !== 'archive' ? '; possession is trusted until items exist (M8)' : ''}`);
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

  // The Force XP trial (engine/forceXpTrial.ts; harness only, off in the game): a Force-discipline session trains on an
  // exercise whose rating replaces the ladder's, and draws on the trial reserve; meditation refills it.
  const drillEffort = req.drillEffort ?? effortFor(intensity);
  let challengeMult = 1;
  if (FORCE_XP_TRIAL.enabled && a.group === 'force') {
    const t = forceSessionRating(s, primary, hours, drillEffort === 'push' ? 'push' : 'standard', challengeLevel);
    drillRating = t.rating;
    challengeMult = t.mult;
    notes.push(t.note);
  }
  if (FORCE_XP_TRIAL.enabled && a.group === 'meditation') trialMeditation(s, hours);

  const state = selectStateOfMind(s);
  const parts = speedPartsFor(s, instr.factor);
  const m = (skill: string): number => parts(skill)?.m ?? 1;
  const clamp = clampFor(s);

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
    ...(challengeMult !== 1 ? { challengeMult } : {}),
  });
  if ((FORCE_XP_TRIAL.enabled || FORCE_XP_TRIAL.collect) && a.group === 'force') recordChallenge(s, primary, drillEffort, challengeLevel, r.hours, r.challenge);
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
  // The instructor's share (D-433, Jared): teaching a Padawan, the teacher gains INSTRUCTOR_SHARE.share of the student's
  // drill XP in the drilled form (the session's form, else the teacher's main form), at most maxPerHour a session hour,
  // inside the 4.0x clamp, counted as teaching. The student's drill XP is modelled: the session's effective hours at a
  // standard drill, the student's age factor and the teacher's instruction factor (the student's level from the NPC).
  const apprentice = a.id === 'teachingPadawan' ? s.ranks.apprenticeId : null;
  const taughtForm = req.skillId && SKILL_BY_ID.get(req.skillId)?.kind === 'form' ? req.skillId : selectCharacter(s).mainFormId;
  if (apprentice && taughtForm && selectNpc(s, apprentice)) {
    const teacherLevel = selectLevelExact(s, taughtForm);
    const studentLevel = selectNpcLevel(s, apprentice, taughtForm) ?? 0;
    const teach = instructionFactor({ studentLevel, teacher: { level: teacherLevel, bond: (selectRelationship(s, apprentice)?.value ?? 0) >= 20, aptitude: STUB_TEACHER_APTITUDE } }).factor;
    const studentXp = r.effectiveHours * INTENSITY.standard.xp * ageFactor('technique', selectNpcAgeOrDefault(s, apprentice)) * teach;
    const share = Math.min(INSTRUCTOR_SHARE.share * studentXp, INSTRUCTOR_SHARE.maxPerHour * r.hours);
    const had = r.credited[taughtForm] ?? 0;
    const got = Math.max(0, clamp(taughtForm, had + share, r.hours).credited - had);
    if (got > 0) {
      credited[taughtForm] = (credited[taughtForm] ?? 0) + got;
      notes.push(`instructor's share: +${got.toFixed(2)} XP to ${SKILL_BY_ID.get(taughtForm)?.name ?? taughtForm} (${Math.round(INSTRUCTOR_SHARE.share * 100)}% of the student's drill XP, counted as teaching)`);
    }
  }
  // Covert learning (D-436): the session may be discovered (COVERT_LEARNING), which costs Order standing.
  let rngAfter = r.rng;
  let discovered = false;
  if (verdict.kind === 'covert') {
    notes.push(verdict.reason);
    let u: number;
    [u, rngAfter] = nextFloat(rngAfter);
    discovered = u < covertDiscoveryChance(r.hours);
    if (discovered) notes.push('the Order has learned of it: your standing falls');
  } else if (verdict.kind === 'open' && verdict.note) notes.push(verdict.note);
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
    speed: Object.fromEntries(Object.keys(prim).flatMap((id) => { const p = parts(id); return p ? [[id, p]] : []; })),
    credited: round(credited),
    totals,
    discarded: round(r.discarded),
    levels,
    tiredness: { p: tirednessLabel(r.meters.p / caps.p), m: tirednessLabel(r.meters.m / caps.m), f: tirednessLabel(forceFraction(r.meters.f, caps.f)) },
    notes,
  };
  // Sparring for E (D-163): peer or stronger partner by the partner's level in this form (a teacher's, a named
  // partner's, the Order stubs'; peers are even). Order classes count only when taught (D-143 A).
  const taughtClass = ORDER_SPARRING_CLASSES.includes(a.id) && (source?.kind === 'instructor' || source?.kind === 'master' || teacherId !== null);
  const sparE: SparE | undefined = a.sparring || taughtClass ? sparringE(studentLevel, tLevel ?? pLevel ?? studentLevel) : undefined;
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
      ...(sparE ? { sparring: sparE.source, sparCap: sparE.cap } : {}),
      day: r.day,
    },
    { type: 'activityLoad', activityId: a.id, meters: r.meters },
    ...(discovered ? [{ type: 'covertLearningDiscovered', abilityId: primary }] : []),
  ];
  return { ok: true, card, events, rng: rngAfter, hours: r.hours };
}
