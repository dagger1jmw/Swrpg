// Step b of the turn (architecture §4): RESOLVE. Pure. Produces the frozen TurnDraft once; every
// retry of the narration reuses it, so dice are never re-rolled.
import { CHECK_RULES, type ActionType } from '../data/checks.config';
import { JUMP_LEVELS, PACING_LEVELS, PACING_RANGES, type JumpLevel, type PacingLevel } from '../data/pacing.config';
import { ACTIVITY_BY_ID, DEFAULT_ACTIVITY } from '../data/activities';
import { isSkillId } from '../data/skills';
import { spanToSeconds, type Intent, type RequestedSpan } from '../ai/schemas/intent';
import { addCalendarMonths } from '../engine/calendar';
import { efficiency } from '../engine/fatigue';
import { check, clampDifficulty, gradeMargin, isCheckRequired, type CheckCard } from '../engine/rolls';
import { ABILITY_FORCE_GROUP } from '../data/forceResistance.config';
import { characterForceTraits, forceContest, forceResistanceOf, FORCE_OUTCOME_TEXT, type ForceTarget } from '../engine/combatForce';
import type { RngState } from '../engine/rng';
import { selectFatigue, selectIsDying, selectIsSpent, selectLastingPenalty, selectWoundPenalty, selectWounds } from '../features/health/selectors';
import { npcInsideForce, selectNpc, selectNpcLevel } from '../features/npcs/selectors';
import { selectLevelExact } from '../features/progression/selectors';
import { STABILIZE_DIFFICULTY } from '../data/health.config';
import type { DuelState } from '../engine/duel';
import { combatActionFromBeat, combatActionFromIntent, combatDraft, combatWordsAction, reconcileCombatPayload, saysSpeech, targetFromText, type CombatDraft } from './combatTurn';
import { SPEECH_LINE } from '../data/combatWords';
import { SEQUENCE_SCHEMA_MAX } from '../data/sequence.config';
import { CONTINUE_WORDS, STOP_SPAR_WORDS } from '../data/combatWords';
import type { CombatActionInput } from './record';
import { selectPacingLevel } from '../features/pacing/selectors';
import { selectPerformance, selectRust } from '../features/progression/selectors';
import { selectActionMatters, selectWorldAction } from '../features/world/selectors';
import { resolveTraining, type TrainingCard, type TrainingRequest } from '../features/progression/selectors';
import { DEFAULT_TRAINING_HOURS } from './expandChoice';
import { advanceTime } from '../state/advanceTime';
import { advanceByRoutine } from '../state/advanceRoutine';
import { buildMontageReport, type MontageReport } from '../state/montageReport';
import { applyEvents, type AppliedEvent, type RejectedEvent } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import { tryEscape } from './escape';
import { planTravel, runTravelBlockade, watchTravelBlockade, type TravelOutcome } from './travel';
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
  /** A trip between map worlds (M7, D-405): its engine time, or why it was refused; absent when no trip. */
  readonly travel?: TravelOutcome;
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

export function resolveJump(registry: Registry<GameState>, initial: GameState, level: JumpLevel, targetDay: number, reason: string, rest = false) {
  const days = Math.max(1, targetDay - initial.clock.now.day);
  const wake = initial.routines.active.wakeSecond;
  const untilAbs = (initial.clock.now.day + days) * 86_400 + wake;
  const run = advanceByRoutine(registry, initial, { untilAbs, reason, ...(rest ? { rest } : {}) });
  const report = buildMontageReport(initial, run, { level, requestedDays: days });
  return { run, report, days };
}

/** Default care spans (D-160): medical 7 days, a bacta tank 6 h, a Force healer 1 h. */
const CARE_DEFAULT_HOURS = { medical: 7 * 24, bacta: 6, forceHealer: 1 } as const;

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

/** The text ends a sparring session (D-199). */
function saysStopSparring(text: string): boolean {
  const t = ` ${text.toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/ +/g, ' ')} `;
  return STOP_SPAR_WORDS.some((w) => t.includes(` ${w} `));
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
  let travel: TravelOutcome | null = null;
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
      ...(travel ? { travel } : {}),
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
      // A choice or text that starts the fight (the opening's "Draw your lightsaber and meet the charge") is the first
      // beat, not a question back (pass 5 issue 12: "not understood", and blows told at exchange 0).
      payload = (opts.text ? combatWordsAction(opts.text) : null) ?? (started ? { action: 'continue' } : { action: 'clarify' });
    }
    // Attack verbs are strike steps and named Force actions are steps (D-191): the text makes sure of both.
    if (!opts.beat && opts.text) payload = reconcileCombatPayload(opts.text, payload, SEQUENCE_SCHEMA_MAX);
    const sess = before.combat.active!.session;
    // Typed words that end a sparring session, like the Stop sparring button (D-199).
    if (!opts.beat && sess && !sess.ended && opts.text && saysStopSparring(opts.text)) payload = { action: 'stopSession' };
    else if (!opts.beat && sess && !sess.ended && !sess.playing && payload['action'] === 'continue' && !isSparringActivityIntent(intent)) payload = { action: 'playBout' };
    // The opponent the typed text aims at becomes the target first (D-212): "turn to the droids and cut at the nearest one".
    const duelNow = before.combat.active!.duel as DuelState;
    const aimed = !opts.beat && opts.text ? targetFromText(opts.text, duelNow.opponents.map((o) => ({ id: o.id, name: o.name, out: o.out, engagedElsewhere: o.engagedElsewhere, minion: o.minion }))) : null;
    const current = duelNow.opponents[duelNow.target];
    const retarget = aimed && aimed !== current?.id ? [{ type: 'targetSet', targetRef: aimed }] : [];
    const done = apply([...retarget, { type: 'combatAction', ...payload }], 'player');
    const notes = done.flatMap((a) => a.notes);
    const after = state;
    const secondsAfter = after.combat.active ? (after.combat.active.duel as { seconds: number }).seconds : after.combat.last?.id === fightId ? ((after.combat.last.duel as { seconds: number } | undefined)?.seconds ?? secondsBefore) : secondsBefore;
    const seconds = Math.max(0, secondsAfter - secondsBefore);
    combat = combatDraft(before, after, started, [...startNotes, ...notes]);
    // Talking in a fight (D-216): the quiet line says what ends a fight instead of only asking what the player does.
    if (combat && combat.beat === 'clarify' && opts.text && saysSpeech(opts.text)) combat = { ...combat, quietLine: SPEECH_LINE };
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
    // A span of days with no activity named follows the routine (a montage or /skip): nothing to report there (issue 20).
    if ((intent.actionType === 'train' || intent.actionType === 'study') && !trainingReq && !intent.requestedSpan) report.push('no activity or skill named: nothing trained');

    // Duration first: it decides the pacing level (D-72).
    let spanSeconds: number | null = null;
    if (intent.requestedSpan) spanSeconds = spanToSeconds(intent.requestedSpan);
    else if (intent.actionType === 'sleep') spanSeconds = DEFAULT_SLEEP_SECONDS;
    else if (trainingReq) spanSeconds = DEFAULT_TRAINING_HOURS * 3600;
    if (spanSeconds === null && isJumpLevel(intent.requestedPacing)) spanSeconds = DEFAULT_JUMP_DAYS[intent.requestedPacing] * 86_400;
    // Travel between map worlds (M7, D-405): the engine's trip time, or no time when the trip is refused.
    travel = planTravel(state, intent);
    // Running a blockade (M8 item 4, D-469): the approach is played before the trip's time passes.
    const attempt = travel && !travel.ok ? runTravelBlockade(state, intent, travel) : null;
    const watch = travel ? null : watchTravelBlockade(state, intent, spanSeconds !== null ? spanSeconds / 3600 : null);
    for (const act of [attempt, watch]) {
      if (!act) continue;
      if ('refused' in act) {
        report.push(`blockade: ${act.refused}`);
        if (travel?.blockade) travel = { ...travel, reason: `${travel.reason}; ${act.refused}` };
        continue;
      }
      checks.push(...act.cards);
      state = { ...state, meta: { ...state.meta, rngState: act.rng } };
      apply([...act.events]);
      if ('note' in act) report.push(act.note);
      if ('stabilize' in act && act.stabilize && selectIsDying(state)) apply([{ type: 'woundsStabilized', by: 'the captors' }]);
    }
    // A prisoner's attempt to escape (D-471).
    const escape = tryEscape(state, intent);
    if (escape && 'refused' in escape) report.push(`escape: ${escape.refused}`);
    else if (escape) {
      checks.push(escape.card);
      state = { ...state, meta: { ...state.meta, rngState: escape.rng } };
      apply([...escape.events]);
    }
    const handled = [attempt, watch, escape].some((a) => a && !('refused' in a));
    if (attempt && !('refused' in attempt)) travel = attempt.travel;
    if (travel?.ok) {
      if (intent.requestedSpan) report.push(`travel time is the engine's (${travel.hours} h), not the requested span`);
      spanSeconds = Math.round(travel.hours! * 3600);
      report.push(`travel ${travel.from} to ${travel.to}: ${travel.hours} h (${travel.parts.join(', ')})`);
    } else if (travel?.run && attempt && !('refused' in attempt)) {
      report.push(`blockade: ${travel.from} to ${travel.to}: ${travel.reason}`);
      spanSeconds = attempt.seconds;
    } else if (travel) {
      report.push(`travel refused: ${travel.reason}`);
      spanSeconds = null;
    }
    if (watch && !('refused' in watch)) spanSeconds = watch.seconds;

    // Montage and time skip (M4): the routine runs day by day to the target morning; checks and a
    // single training session do not apply (the routine is the training, D-139).
    const jumpSpan = spanSeconds !== null ? pacingForSpan(spanSeconds, intent.requestedPacing) : null;
    if (jumpSpan && isJumpLevel(jumpSpan.level)) {
      const level = jumpSpan.level;
      if (jumpSpan.clampedFrom !== undefined) report.push(`requested span ${jumpSpan.clampedFrom}s clamped to ${jumpSpan.seconds}s (${level})`);
      const reason = intent.requestedSpan ? `${level} for ${intent.requestedSpan.amount} ${intent.requestedSpan.unit}` : level;
      const target = jumpTargetDay(state.clock.now.day, jumpSpan.seconds, intent.requestedSpan, jumpSpan.clampedFrom !== undefined);
      // Rest and care over days (D-199): the care period starts first, and the days are rest and recovery, not training.
      const resting = intent.actionType === 'rest' || intent.actionType === 'heal' || intent.actionType === 'sleep' || intent.healing !== undefined;
      if ((intent.actionType === 'heal' || intent.healing) && selectWounds(state).length && !selectIsDying(state)) {
        const source = intent.healing?.source ?? 'medical';
        const healer = intent.healing?.healerRef && selectNpc(state, intent.healing.healerRef) ? intent.healing.healerRef : null;
        const hours = source === 'medical' ? jumpSpan.seconds / 3600 : source === 'bacta' ? CARE_DEFAULT_HOURS.bacta : CARE_DEFAULT_HOURS.forceHealer;
        const healerLevel = source === 'forceHealer' ? (healer ? selectNpcLevel(state, healer, 'forceHealOthers') : selectLevelExact(state, 'forceHealSelf')) : undefined;
        if (source !== 'forceHealer' || (healerLevel ?? 0) >= 1) apply([{ type: 'careStarted', kind: source, hours, ...(healerLevel !== undefined ? { healerLevel } : {}) }]);
        else report.push('no Force healer: no Force healing applied');
      }
      const j = resolveJump(registry, state, level, target, reason, resting);
      if (resting) report.push('rest and recovery: no training on these days');
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
      const hours = spanSeconds !== null ? spanSeconds / 3600 : CARE_DEFAULT_HOURS[source];
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

    // A mind ability on a person is a Willpower contest, never a flat difficulty (D-192): droids and lore-immune species
    // cannot be affected; a Force user adds their Force resistance.
    const mindTarget = intent.forceAbility && ABILITY_FORCE_GROUP[intent.forceAbility] === 'mind' ? npcTargets.find((t) => selectNpc(state, t)) : undefined;
    if (mindTarget && intent.forceAbility) {
      const card = mindContestCard(state, intent.forceAbility, mindTarget);
      checks.push(card.card);
      state = { ...state, meta: { ...state.meta, rngState: card.rng } };
    } else if (!handled && isCheckRequired(intent.actionType, intent.targets.length)) {
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
      // A rolled action counts against the world conditions it is about (D-466); nothing is recorded otherwise.
      const deed = { actionType: intent.actionType, skillId: validSkill ? skillId : null, total: card.total, targets: [...new Set([...intent.targets, ...intent.references])] };
      if (selectActionMatters(state, selectWorldAction(state, deed))) apply([{ type: 'worldActionRecorded', ...deed }]);
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

/** A mind ability on an NPC as a contest (D-192), shown as a check card whose DC is the target's roll. */
function mindContestCard(state: GameState, abilityId: string, npcId: string): { card: CheckCard; rng: RngState } {
  const npc = selectNpc(state, npcId)!;
  const lv = (id: string): number => selectNpcLevel(state, npcId, id);
  const target: ForceTarget = { name: npc.name, willpower: lv('willpower'), agility: lv('agility'), forceResistance: forceResistanceOf(lv), traits: characterForceTraits(npc.speciesId, npcInsideForce(npc)), bodySize: 'humanoid', inCover: false, canReact: true, saberLevel: 0 };
  const level = selectPerformance(state, abilityId);
  const [r, rng] = forceContest(state.meta.rngState, { kind: 'mindTrick', group: 'mind', level, modifiers: [], target, negated: false });
  const total = r.user?.total ?? 0;
  const against = r.resist?.total ?? total + 1;
  const card: CheckCard = {
    kind: 'check',
    // An immune mind makes no roll (D-216): the label says so instead of showing an empty d20.
    label: `${abilityId === 'mindTrick' ? 'Mind trick' : abilityId} on ${npc.name}${r.outcome === 'immune' ? ': immune, no roll' : ''}`,
    skillId: abilityId,
    d20: r.user?.d20 ?? 0,
    natural: r.user?.natural ?? null,
    naturalBonus: r.user?.naturalBonus ?? 0,
    effectiveLevel: level,
    levelBonus: r.user?.levelBonus ?? 0,
    modifiers: r.user?.modifiers ?? [],
    total,
    difficulty: 'moderate',
    rating: Math.round((against - 10) * 10),
    dc: Math.round(against * 10) / 10,
    margin: total - against,
    success: r.success,
    grade: gradeMargin(r.user ? total - against : -10),
    // The resisting dice in full (D-216): d20, the total, and a Force user's added resistance (D-192).
    notes: r.outcome === 'immune'
      ? [`${npc.name} cannot be mind-tricked: no roll is made (immune)`]
      : [`contest: ${npc.name}'s ${r.resistKind === 'willpower' ? 'Willpower roll' : 'mind'}${r.resist ? ` d20 ${r.resist.d20} = ${r.resist.total.toFixed(1)}` : ''}${target.forceResistance > 0 ? ' (a Force user: half their Force resistance added)' : ''}`, `the mind trick ${FORCE_OUTCOME_TEXT[r.outcome]}`],
  };
  return { card, rng };
}
