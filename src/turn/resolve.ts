// Step b of the turn (architecture §4): RESOLVE. Pure. Produces the frozen TurnDraft once; every
// retry of the narration reuses it, so dice are never re-rolled.
import { CHECK_RULES, type ActionType } from '../data/checks.config';
import { JUMP_LEVELS, PACING_LEVELS, PACING_RANGES, type JumpLevel, type PacingLevel } from '../data/pacing.config';
import { ACTIVITY_BY_ID, DEFAULT_ACTIVITY } from '../data/activities';
import { isSkillId } from '../data/skills';
import { spanToSeconds, type Intent, type RequestedSpan } from '../ai/schemas/intent';
import { addCalendarMonths } from '../engine/calendar';
import { efficiency } from '../engine/fatigue';
import { check, clampDifficulty, isCheckRequired, type CheckCard } from '../engine/rolls';
import type { RngState } from '../engine/rng';
import { selectFatigue, selectIsDying, selectIsSpent, selectLastingPenalty, selectWoundPenalty } from '../features/health/selectors';
import { selectNpc, selectNpcLevel } from '../features/npcs/selectors';
import { selectLevelExact } from '../features/progression/selectors';
import { STABILIZE_DIFFICULTY } from '../data/health.config';
import { combatActionFromBeat, combatActionFromIntent, combatDraft, combatWordsAction, type CombatDraft } from './combatTurn';
import { CONTINUE_WORDS } from '../data/combatWords';
import type { CombatActionInput } from './record';
import { selectPacingLevel } from '../features/pacing/selectors';
import { selectPerformance, selectRust } from '../features/progression/selectors';
import { resolveTraining, type TrainingCard, type TrainingRequest } from '../features/progression/selectors';
import { DEFAULT_TRAINING_HOURS } from './expandChoice';
import { advanceTime } from '../state/advanceTime';
import { advanceByRoutine } from '../state/advanceRoutine';
import { buildMontageReport, type MontageReport } from '../state/montageReport';
import { applyEvents, type AppliedEvent, type RejectedEvent } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import type { Registry, ResolvedAction } from '../state/types';

/** Sleep with no stated duration (health spec: 7 h+ is a full night). */
export const DEFAULT_SLEEP_SECONDS = 8 * 3600;

export interface TimeAdvanced {
  seconds: number;
  requested: number;
  clampedFrom?: number;
  reason: string;
  interrupted?: string;
}

/** A resolved training session, or why the requested activity was refused (M3). */
export type TrainingOutcome = { ok: true; card: TrainingCard } | { ok: false; activityId: string; reason: string };

export interface TurnDraft {
  readonly intent: Intent | null;
  readonly checks: readonly CheckCard[];
  /** The train / study session resolved by computeXp (M3); null when the turn trained nothing. */
  readonly training: TrainingOutcome | null;
  readonly timeAdvanced: TimeAdvanced | null;
  /** A montage or time skip run by the routine day loop (M4), with its report; null otherwise. */
  readonly jump: { level: JumpLevel; report: MontageReport } | null;
  /** A duel segment this turn (M5): the exchanges, the beat, quiet or narrated, the end; null outside combat. */
  readonly combat: CombatDraft | null;
  /** The level the narration is written at (the jump's level for a jump). */
  readonly pacingLevel: PacingLevel;
  readonly notices: readonly string[];
  /** Engine notes for the transcript (clamps, stubs, dropped refs). */
  readonly report: readonly string[];
  readonly resolvedActions: readonly ResolvedAction[];
  readonly rngAfter: RngState;
  readonly applied: readonly AppliedEvent[];
  readonly rejected: readonly RejectedEvent[];
}

export interface Resolution {
  draft: TurnDraft;
  /** State after the engine resolution, before the narrative events. */
  state: GameState;
}

const ACTION_LABELS: Record<ActionType, string> = {
  dialogue: 'Persuade',
  move: 'Move',
  travel: 'Travel',
  train: 'Train',
  study: 'Study',
  fight: 'Fight',
  forceUse: 'Use the Force',
  investigate: 'Investigate',
  heal: 'Heal',
  rest: 'Rest',
  sleep: 'Sleep',
  other: 'Act',
};

/** Default spans when a jump is requested without one (D-139). */
export const DEFAULT_JUMP_DAYS: Record<JumpLevel, number> = { montage: 30, timeSkip: 90 };

export const isJumpLevel = (l: PacingLevel | undefined): l is JumpLevel => l !== undefined && (JUMP_LEVELS as readonly string[]).includes(l);

/**
 * The pacing level for a span (D-72, extended in M4): the requested level when the span fits its range,
 * else the smallest level whose range holds it; spans past 10 years clamp to the time-skip maximum.
 */
export function pacingForSpan(seconds: number, requested?: PacingLevel): { level: PacingLevel; seconds: number; clampedFrom?: number } {
  const fit = (level: PacingLevel) => {
    const r = PACING_RANGES[level];
    const s = Math.min(r.max, Math.max(r.min, seconds));
    return s === seconds ? { level, seconds } : { level, seconds: s, clampedFrom: seconds };
  };
  if (requested && seconds >= PACING_RANGES[requested].min && seconds <= PACING_RANGES[requested].max) return { level: requested, seconds };
  if (isJumpLevel(requested) && seconds < PACING_RANGES[requested].min) return fit(requested);
  // Between 12 h and a day without a jump request: a long scene, clamped to 12 h (not a 1-day montage).
  if (seconds > PACING_RANGES.scene.max && seconds < PACING_RANGES.montage.min) return fit('scene');
  for (const level of PACING_LEVELS) if (seconds <= PACING_RANGES[level].max) return fit(level);
  return fit('timeSkip');
}

/** A montage or time skip: the routine day loop to the morning `days` days on (Q48), and its report. */
/**
 * The day a jump ends on (its wake time is the end, Q48). Whole calendar months and years land on the
 * same day of the month that many months later, clamped to the month's length (31-day months 1-8,
 * 30-day months 9-12; D-142); days and weeks are counted in days. A clamped span uses its seconds.
 */
export function jumpTargetDay(fromDay: number, seconds: number, span?: RequestedSpan, clamped = false): number {
  if (span && !clamped && (span.unit === 'months' || span.unit === 'years')) {
    const months = span.amount * (span.unit === 'years' ? 12 : 1);
    if (Number.isInteger(months) && months > 0) return addCalendarMonths(fromDay, months);
  }
  return fromDay + Math.max(1, Math.round(seconds / 86_400));
}

export function resolveJump(registry: Registry<GameState>, initial: GameState, level: JumpLevel, targetDay: number, reason: string) {
  const days = Math.max(1, targetDay - initial.clock.now.day);
  const wake = initial.routines.active.wakeSecond;
  const untilAbs = (initial.clock.now.day + days) * 86_400 + wake;
  const run = advanceByRoutine(registry, initial, { untilAbs, reason });
  const report = buildMontageReport(initial, run, { level, requestedDays: days });
  return { run, report, days };
}

/** The session a train / study intent asks for: its activity, or the default activity of its skill. */
export function trainingRequest(intent: Intent): Omit<TrainingRequest, 'hours'> | null {
  if (intent.actionType !== 'train' && intent.actionType !== 'study') return null;
  const skill = intent.skillId;
  const activityId = intent.activity?.activityId ?? (skill !== undefined && isSkillId(skill) ? DEFAULT_ACTIVITY[skill] : undefined);
  if (!activityId) return null;
  return {
    activityId,
    ...(intent.activity?.intensity ? { intensity: intent.activity.intensity } : {}),
    ...(skill !== undefined ? { skillId: skill } : {}),
    teacherId: intent.activity?.teacherRef ?? null,
    partnerId: intent.activity?.partnerRef ?? null,
  };
}

/** The text says to go on as before (D-179). */
function saysContinue(text: string): boolean {
  const t = ` ${text.toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/ +/g, ' ')} `;
  return CONTINUE_WORDS.some((w) => t.includes(` ${w} `));
}

/** The intent asks for sparring as an activity ("spar with the other Initiates for an hour"), D-177. */
function isSparringActivityIntent(intent: Intent | null): boolean {
  const id = intent?.activity?.activityId;
  return id !== undefined && ACTIVITY_BY_ID.get(id)?.sparring === true;
}

export function resolveTurn(registry: Registry<GameState>, initial: GameState, intent: Intent | null, opts: { beat?: CombatActionInput; text?: string } = {}): Resolution {
  let state = initial;
  const report: string[] = [];
  const applied: AppliedEvent[] = [];
  const rejected: RejectedEvent[] = [];
  const notices: string[] = [];
  const checks: CheckCard[] = [];
  let training: TrainingOutcome | null = null;
  let timeAdvanced: TimeAdvanced | null = null;
  let jump: TurnDraft['jump'] = null;
  let combat: CombatDraft | null = null;
  let narrationLevel: PacingLevel | null = null;

  const finish = (): Resolution => {
    const draft: TurnDraft = Object.freeze({
      intent,
      checks: Object.freeze(checks),
      training,
      timeAdvanced,
      jump,
      combat,
      pacingLevel: narrationLevel ?? selectPacingLevel(state),
      notices: Object.freeze(notices),
      report: Object.freeze(report),
      resolvedActions: Object.freeze([]),
      rngAfter: state.meta.rngState,
      applied: Object.freeze(applied),
      rejected: Object.freeze(rejected),
    });
    return { draft, state };
  };

  const apply = (events: unknown[], source: 'engine' | 'player' = 'engine'): AppliedEvent[] => {
    const r = applyEvents(registry, state, events, { source });
    state = r.state;
    applied.push(...r.applied);
    rejected.push(...r.rejected);
    notices.push(...r.notices);
    for (const a of r.applied) report.push(...a.notes);
    return r.applied;
  };

  // Deferred events from the previous turn come first (architecture §3, D-29): hazards, then a pending fight.
  for (const h of state.health.pendingHazards) apply([{ type: 'hazardResolved', hazard: h.hazard, severity: h.severity, cause: h.cause, fromPending: true }]);
  let started = false;
  // The fight's start notes (terrain accidents of the first bout, D-184) reach the narration with the exchanges.
  const startNotes: string[] = [];
  if (state.combat.pending && !state.combat.active) {
    startNotes.push(...apply([{ type: 'fightBegun', fromPending: true }]).flatMap((a) => a.notes));
    started = state.combat.active !== null;
  }
  // A fight intent starts a duel directly: its single entry point (D-29); fights are duels, not a check (M5).
  const npcTargets = intent ? intent.targets.filter((t) => selectNpc(state, t) !== null) : [];
  if (!state.combat.active && intent?.actionType === 'fight' && npcTargets.length) {
    startNotes.push(...apply([{ type: 'fightBegun', fromPending: false, opponentRefs: npcTargets, stakes: 'serious' }]).flatMap((a) => a.notes));
    started = state.combat.active !== null;
  }
  // "Play the next bout" after an auto-resolved spar (D-177): the same partners, played out with the beats.
  const rematch = state.combat.last?.rematch;
  if (opts.beat?.action === 'playNextBout' && !state.combat.active && rematch) {
    startNotes.push(...apply([{ type: 'fightBegun', fromPending: false, opponentRefs: rematch.opponentRefs, stakes: 'spar', ...(rematch.sparringMode ? { sparringMode: rematch.sparringMode } : {}) }]).flatMap((a) => a.notes));
    started = state.combat.active !== null;
  }
  if (opts.beat && (opts.beat.action === 'fate' || opts.beat.action === 'review')) {
    // Out-of-fight choices from the combat card: an NPC's fate, or reviewing a recording (progression-numbers §19).
    const b = opts.beat;
    apply([b.action === 'fate' ? { type: 'fateChosen', npcRef: b.npcRef, fate: b.fate } : { type: 'recordingReviewed', skillId: b.skillId }], 'player');
    return finish();
  }
  // In a fight: one combat action per turn (rolls §3, D-145); the clock advances by the exchanges' seconds (D-30).
  if (state.combat.active) {
    const before = state;
    const secondsBefore = (before.combat.active!.duel as { seconds: number }).seconds;
    const fightId = before.combat.active!.id;
    let payload = opts.beat?.action === 'playNextBout' ? { action: 'playBout' } : opts.beat ? combatActionFromBeat(opts.beat) : combatActionFromIntent(intent);
    // A sparring session (D-168, D-177): input that describes a specific combat action (a parry, a strike, a feint, a
    // form technique, a sequence: anything but a request to spar as an activity) plays the bout out with the beats;
    // only sparring asked for as an activity resolves like a montage.
    // Natural combat words (D-179): when the intent names no move, the player's text is read against the word list; a
    // text with no move the game can read asks back through the beat buttons instead of resolving as Continue.
    if (!opts.beat && payload['action'] === 'continue' && !isSparringActivityIntent(intent) && !(opts.text && saysContinue(opts.text))) {
      payload = (opts.text ? combatWordsAction(opts.text) : null) ?? { action: 'clarify' };
    }
    const sess = before.combat.active!.session;
    if (!opts.beat && sess && !sess.ended && !sess.playing && payload['action'] === 'continue' && !isSparringActivityIntent(intent)) payload = { action: 'playBout' };
    const done = apply([{ type: 'combatAction', ...payload }], 'player');
    const notes = done.flatMap((a) => a.notes);
    const after = state;
    const secondsAfter = after.combat.active ? (after.combat.active.duel as { seconds: number }).seconds : after.combat.last?.id === fightId ? ((after.combat.last.duel as { seconds: number } | undefined)?.seconds ?? secondsBefore) : secondsBefore;
    const seconds = Math.max(0, secondsAfter - secondsBefore);
    combat = combatDraft(before, after, started, [...startNotes, ...notes]);
    if (seconds > 0) {
      const adv = advanceTime(registry, state, { seconds, reason: 'combat', source: 'turnDraft', requested: seconds, occupation: 'combat' });
      state = adv.state;
      applied.push(...adv.applied);
      rejected.push(...adv.rejected);
      notices.push(...adv.notices);
      timeAdvanced = { seconds: adv.secondsAdvanced, requested: seconds, reason: 'combat' };
    }
    narrationLevel = 'moment';
    return finish();
  }

  if (intent) {
    // A train / study intent with an activity (or a skill with a default activity) is a session (M3).
    const trainingReq = trainingRequest(intent);
    if ((intent.actionType === 'train' || intent.actionType === 'study') && !trainingReq) report.push('no activity or skill named: nothing trained');

    // Duration first: it decides the pacing level (D-72).
    let spanSeconds: number | null = null;
    if (intent.requestedSpan) spanSeconds = spanToSeconds(intent.requestedSpan);
    else if (intent.actionType === 'sleep') spanSeconds = DEFAULT_SLEEP_SECONDS;
    else if (trainingReq) spanSeconds = DEFAULT_TRAINING_HOURS * 3600;
    if (spanSeconds === null && isJumpLevel(intent.requestedPacing)) spanSeconds = DEFAULT_JUMP_DAYS[intent.requestedPacing] * 86_400;

    // Montage and time skip (M4): the routine runs day by day to the target morning; checks and a
    // single training session do not apply (the routine is the training, D-139).
    const jumpSpan = spanSeconds !== null ? pacingForSpan(spanSeconds, intent.requestedPacing) : null;
    if (jumpSpan && isJumpLevel(jumpSpan.level)) {
      const level = jumpSpan.level;
      if (jumpSpan.clampedFrom !== undefined) report.push(`requested span ${jumpSpan.clampedFrom}s clamped to ${jumpSpan.seconds}s (${level})`);
      const reason = intent.requestedSpan ? `${level} for ${intent.requestedSpan.amount} ${intent.requestedSpan.unit}` : level;
      const target = jumpTargetDay(state.clock.now.day, jumpSpan.seconds, intent.requestedSpan, jumpSpan.clampedFrom !== undefined);
      const j = resolveJump(registry, state, level, target, reason);
      state = j.run.state;
      applied.push(...j.run.applied);
      rejected.push(...j.run.rejected);
      jump = { level, report: j.report };
      narrationLevel = level;
      timeAdvanced = {
        seconds: j.run.secondsAdvanced,
        requested: spanSeconds!,
        reason,
        ...(jumpSpan.clampedFrom !== undefined ? { clampedFrom: jumpSpan.clampedFrom } : {}),
        ...(j.run.interrupted ? { interrupted: j.run.interrupted.reason } : {}),
      };
      // After a jump the story resumes in the morning: at moment on an interruption (architecture §9),
      // else at scene, so the next turn's time is not read in jump-sized units.
      apply([{ type: 'pacingSet', level: j.run.interrupted ? 'moment' : 'scene' }]);
      if (j.run.interrupted) report.push(`${level} interrupted on day ${j.report.daysCompleted} of ${j.days}: ${j.run.interrupted.reason}`);
      return finish();
    }

    // The training session is planned before the pacing decision: a refused activity changes
    // nothing (no pacing switch, no time from the draft; the AI's timeElapsed applies instead).
    let plan: ReturnType<typeof resolveTraining> | null = null;
    if (trainingReq && spanSeconds !== null) {
      plan = resolveTraining(state, { ...trainingReq, hours: pacingForSpan(spanSeconds).seconds / 3600 });
      if (!plan.ok) {
        training = { ok: false, activityId: trainingReq.activityId, reason: plan.reason };
        report.push(plan.reason);
        spanSeconds = null;
      }
    }

    const span = spanSeconds !== null ? pacingForSpan(spanSeconds) : null;
    const wantedLevel = span?.level ?? intent.requestedPacing;
    if (wantedLevel && wantedLevel !== selectPacingLevel(state)) apply([{ type: 'pacingSet', level: wantedLevel }]);

    // A hazard the player's own action causes (intent.risk): damage by the health rules (D-149).
    if (intent.risk) apply([{ type: 'hazardResolved', hazard: intent.risk.type, severity: intent.risk.severityHint, cause: `the player's action (${intent.actionType})` }]);
    // Healing (health §7, D-150): stabilizing a mortal wound is a check; care and healers apply through health events.
    if (intent.actionType === 'heal' || intent.forceAbility === 'forceHealSelf') {
      const healer = intent.healing?.healerRef && selectNpc(state, intent.healing.healerRef) ? intent.healing.healerRef : null;
      const selfForce = intent.forceAbility === 'forceHealSelf' && selectLevelExact(state, 'forceHealSelf') >= 1;
      const source = intent.healing?.source ?? (selfForce ? 'forceHealer' : 'medical');
      const hours = spanSeconds !== null ? spanSeconds / 3600 : source === 'medical' ? 7 * 24 : source === 'bacta' ? 6 : 1;
      if (selectIsDying(state)) {
        const skill = healer ? (source === 'forceHealer' ? 'forceHealOthers' : 'medicine') : selfForce ? 'forceHealSelf' : 'medicine';
        const level = healer ? selectNpcLevel(state, healer, skill) : selectPerformance(state, skill);
        const [card, next] = check(state.meta.rngState, {
          label: 'Stabilize',
          skillId: skill,
          levelInputs: { level, woundPenalty: healer ? 0 : selectWoundPenalty(state, skill), rust: 0, vitalitySpent: healer ? false : selectIsSpent(state), fatigueEfficiency: 1 },
          modifiers: [],
          difficulty: STABILIZE_DIFFICULTY,
          notes: [healer ? `by ${selectNpc(state, healer)!.name}` : 'by the character'],
        });
        checks.push(card);
        state = { ...state, meta: { ...state.meta, rngState: next } };
        if (card.success) apply([{ type: 'woundsStabilized', by: healer ? selectNpc(state, healer)!.name : skill === 'forceHealSelf' ? 'Force healing' : 'a medpac' }]);
      } else {
        const healerLevel = source === 'forceHealer' ? (healer ? selectNpcLevel(state, healer, 'forceHealOthers') : selectLevelExact(state, 'forceHealSelf')) : undefined;
        apply([{ type: 'careStarted', kind: source, hours, ...(healerLevel !== undefined ? { healerLevel } : {}) }]);
      }
    }

    // Engine-decided checks (D-37). M1: level 0 plus circumstance modifiers (none yet), stubs per §15.
    if (isCheckRequired(intent.actionType, intent.targets.length)) {
      const { difficulty, clampedFrom } = clampDifficulty(intent.actionType, intent.proposedDifficulty);
      const notes: string[] = [];
      if (clampedFrom) notes.push(`difficulty ${clampedFrom} clamped to ${difficulty} for ${intent.actionType}`);
      const ruleNote = CHECK_RULES[intent.actionType].note;
      if (ruleNote) notes.push(ruleNote);
      const skillId = intent.skillId ?? null;
      // M3: real skill levels, rust and e(f_phys) (the D-56 stubs are gone); an unknown skill rolls at level 0.
      const validSkill = skillId !== null && isSkillId(skillId);
      if (skillId !== null && !validSkill) notes.push(`unknown skill ${skillId}: level 0`);
      const [card, next] = check(state.meta.rngState, {
        label: ACTION_LABELS[intent.actionType],
        skillId,
        levelInputs: {
          level: validSkill ? selectPerformance(state, skillId) : 0,
          // M5: wounds (status + location, less Willpower) and lasting injuries combine multiplicatively (rolls §1).
          woundPenalty: validSkill ? 1 - (1 - selectWoundPenalty(state, skillId)) * (1 - selectLastingPenalty(state, skillId)) : 0,
          rust: validSkill ? selectRust(state, skillId) : 0,
          vitalitySpent: selectIsSpent(state),
          fatigueEfficiency: efficiency(selectFatigue(state).p),
        },
        modifiers: [],
        difficulty,
        notes,
      });
      checks.push(card);
      report.push(...notes);
      state = { ...state, meta: { ...state.meta, rngState: next } };
    }

    // Training: one computeXp session, applied through engine events before its time passes (M3).
    let advanceSeconds = span?.seconds ?? null;
    let occupation: 'rest' | 'activity' | 'sleep' = intent.actionType === 'sleep' ? 'sleep' : 'rest';
    if (plan?.ok) {
      // Train / study actions roll no checks, so the planned session's dice follow the current RNG state.
      state = { ...state, meta: { ...state.meta, rngState: plan.rng } };
      apply(plan.events);
      training = { ok: true, card: plan.card };
      report.push(...plan.card.notes);
      advanceSeconds = Math.round(plan.hours * 3600);
      occupation = 'activity';
    }

    if (span && advanceSeconds !== null) {
      if (span.clampedFrom !== undefined) report.push(`requested span ${span.clampedFrom}s clamped to ${span.seconds}s (${span.level})`);
      const reason = intent.requestedSpan ? `${intent.actionType} for ${intent.requestedSpan.amount} ${intent.requestedSpan.unit}` : intent.actionType;
      const adv = advanceTime(registry, state, {
        seconds: advanceSeconds,
        reason,
        source: 'turnDraft',
        requested: spanSeconds ?? span.seconds,
        occupation,
        ...(span.clampedFrom !== undefined ? { clampedFrom: span.clampedFrom } : {}),
      });
      state = adv.state;
      applied.push(...adv.applied);
      rejected.push(...adv.rejected);
      notices.push(...adv.notices);
      timeAdvanced = {
        seconds: adv.secondsAdvanced,
        requested: spanSeconds ?? span.seconds,
        reason,
        ...(span.clampedFrom !== undefined ? { clampedFrom: span.clampedFrom } : {}),
        ...(adv.interrupted !== undefined ? { interrupted: adv.interrupted } : {}),
      };
      // Sleep resolves at its end with the health sleep rules (D-52): 7 h+ resets the meters.
      if (occupation === 'sleep') apply([{ type: 'sleepCompleted', hours: Math.round((adv.secondsAdvanced / 3600) * 100) / 100 }]);
    }

    // intent.unknownNames go to the review queue after the narrative is applied, and only if the
    // reply did not introduce them (pipeline, D-94).
  }
  return finish();
}
