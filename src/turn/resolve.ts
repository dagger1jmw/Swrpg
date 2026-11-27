// Step b of the turn (architecture §4): RESOLVE. Pure. Produces the frozen TurnDraft once; every
// retry of the narration reuses it, so dice are never re-rolled.
import { CHECK_RULES, type ActionType } from '../data/checks.config';
import { DIFFICULTY_STAKES } from '../data/skillXp.config';
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
import { npcInsideForce, npcOwnForceTraits, selectNpc, selectNpcLevel } from '../features/npcs/selectors';
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
import { tryPlan } from './planning';
import { resolveHoldTurn, type HoldTurn } from '../features/combat/selectors';
import { carePlan } from './medicine';
import { planTravel, runTravelBlockade, shipTrip, watchTravelBlockade, type TravelOutcome } from './travel';
import { missionAfterTurn, tryMissionStage } from './missionTurn';
import type { GameEvent, Registry, ResolvedAction } from '../state/types';
import { selectCheckTraitMod, selectNpcMindTrickResist } from '../features/traits/selectors';
import { selectActiveBattle, selectBattleStep, selectBattleWaitsOnFight, selectGroundBattle, selectGroundWaitsOnFight, selectLastEndedBattle, selectLastGround } from '../features/battles/selectors';
import type { GroundInput } from './record';

/** A battle turn for the narrator (Jared's brief E): quiet when nothing big happened (the code's line or two, no AI call). */
export interface BattleDraft {
  lines: readonly string[];
  big: readonly string[];
  wrap: string | null;
  quiet: boolean;
  map: string | null;
}

/** The battle's last step as the turn tells it. */
function battleDraftOf(state: GameState, extra: readonly string[] = []): BattleDraft | null {
  const step = selectBattleStep(state);
  if (!step) return null;
  const b = selectActiveBattle(state) ?? selectLastEndedBattle(state);
  const g = selectGroundBattle(state) ?? selectLastGround(state);
  const big = [...extra, ...step.big];
  return { lines: step.lines, big, wrap: step.wrap, quiet: big.length === 0 && step.wrap === null, map: g?.map ?? b?.map ?? null };
}

/** A ground command input as the battles feature's events (m8-ground, D-522). */
function groundEvents(g: GroundInput): unknown[] {
  switch (g.act) {
    case 'order':
      return [{ type: 'groundOrdered', ...(g.orders ? { orders: g.orders } : {}) }];
    case 'auto':
      return [{ type: 'groundOrdered', auto: true }];
    case 'takeBack':
      return [{ type: 'groundOrdered', auto: false }];
    case 'scout':
      return [{ type: 'groundScouted', how: g.how ?? 'recon' }];
    case 'begin':
      return [...(g.plan || g.atPost !== undefined ? [{ type: 'groundPlanSet', ...(g.plan ? { plan: g.plan } : {}), ...(g.atPost !== undefined ? { atPost: g.atPost } : {}) }] : []), { type: 'groundBattleBegun' }];
    case 'standDown':
      return [{ type: 'groundPlanningEnded' }];
  }
}

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
  /** An NPC's hold told with the player's escape (D-496); absent otherwise. */
  readonly hold?: HoldTurn;
  /** A ship battle's turn or round (m8-ship-battles, D-517): the code's lines, the big moments, the wrap-up; absent otherwise. */
  readonly battle?: BattleDraft;
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
export function pacingForSpan(seconds: number, requested?: PacingLevel, exact = false): { level: PacingLevel; seconds: number; clampedFrom?: number } {
  // A trip's time is the travel rules', never clamped (m9-release A3): past a scene's 12 h it is told as a montage of its own length.
  if (exact) {
    if (seconds <= PACING_RANGES.scene.max) return { level: seconds <= PACING_RANGES.moment.max ? 'moment' : 'scene', seconds };
    return { level: seconds <= PACING_RANGES.montage.max ? 'montage' : 'timeSkip', seconds };
  }
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

/** The morning a trip of `seconds` ends on (m9-release A3): the wake time nearest the arrival, at least the next morning. */
export function tripTargetDay(s: GameState, seconds: number): number {
  const wake = s.routines.active.wakeSecond;
  const arrive = s.clock.now.day * 86_400 + s.clock.now.second + seconds;
  return Math.max(s.clock.now.day + 1, Math.round((arrive - wake) / 86_400));
}

export function resolveJump(registry: Registry<GameState>, initial: GameState, level: JumpLevel, targetDay: number, reason: string, rest = false, homeDays = false) {
  const days = Math.max(1, targetDay - initial.clock.now.day);
  const wake = initial.routines.active.wakeSecond;
  const untilAbs = (initial.clock.now.day + days) * 86_400 + wake;
  const run = advanceByRoutine(registry, initial, { untilAbs, reason, ...(rest ? { rest } : {}), ...(homeDays ? { homeDays } : {}) });
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

export function resolveTurn(registry: Registry<GameState>, initial: GameState, intent: Intent | null, opts: { beat?: CombatActionInput; text?: string; homeDays?: boolean; mission?: string; battle?: { orders?: Readonly<Record<string, unknown>>; auto?: boolean; repairs?: boolean; ground?: GroundInput } } = {}): Resolution {
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
  let hold: HoldTurn | null = null;
  let battle: BattleDraft | null = null;

  const finish = (): Resolution => {
    // Missions after the turn (m9-missions B3, B4, B6, B8): the trip's end moves the character, a stage's fight or battle that ended
    // is decided, a bad wound cuts the mission short, the mission ends back at base, the Council's best are sent straight on.
    const arrived = travel?.ok === true && timeAdvanced !== null && timeAdvanced.interrupted === undefined;
    const m0 = initial.duty.mission;
    const after = missionAfterTurn(registry, state, travel, arrived, m0 ? { id: m0.id, outcome: m0.outcome } : null);
    state = after.state;
    applied.push(...after.applied);
    rejected.push(...after.rejected);
    notices.push(...after.notices);
    report.push(...after.report);
    if (after.seconds > 0) timeAdvanced = { seconds: (timeAdvanced?.seconds ?? 0) + after.seconds, requested: (timeAdvanced?.requested ?? 0) + after.seconds, reason: timeAdvanced ? `${timeAdvanced.reason}; the mission` : 'the mission' };
    const draft: TurnDraft = Object.freeze({
      intent,
      checks: Object.freeze(checks),
      training,
      timeAdvanced,
      jump,
      combat,
      ...(travel ? { travel } : {}),
      ...(hold ? { hold } : {}),
      ...(battle ? { battle } : {}),
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
  // A ship battle that waits on a boarding fight no longer under way: its result goes back into the battle (D-517).
  const waits = selectBattleWaitsOnFight(state);
  if (waits && !state.combat.active) apply([{ type: 'boardingFought', won: state.combat.last?.id === waits && state.combat.last.outcome === 'won' }]);
  // A ground battle that waits on the player's own fight in their sector (m8-ground, D-522): its result counts next phase.
  const groundWaits = selectGroundWaitsOnFight(state);
  if (groundWaits && !state.combat.active) apply([{ type: 'groundFightFought', won: state.combat.last?.id === groundWaits && state.combat.last.outcome === 'won' }]);
  // A ship battle's turn or round (m8-ship-battles, D-517): one step from the tactics menu, or let it play out. The engine's
  // seconds pass (a dogfight turn 5 s, a fleet round 3 min; field repairs an hour a system).
  if (opts.battle) {
    const b = opts.battle;
    const done = apply(b.ground ? groundEvents(b.ground) : [b.repairs ? { type: 'fieldRepairsMade' } : { type: 'battleOrdered', ...(b.orders ? { orders: b.orders } : {}), ...(b.auto !== undefined ? { auto: b.auto } : {}) }], 'player');
    if (done.length) {
      battle = battleDraftOf(state);
      const seconds = Math.round(selectBattleStep(state)?.seconds ?? 0);
      const why = b.ground ? (b.ground.act === 'scout' ? 'scouting' : 'ground battle') : b.repairs ? 'field repairs' : 'ship battle';
      if (seconds > 0) {
        // A ground phase is an hour and a half (1.5 h): the character's time passes as activity, not as a duel's seconds.
        const adv = advanceTime(registry, state, { seconds, reason: why, source: 'turnDraft', requested: seconds, occupation: b.repairs || b.ground ? 'activity' : 'combat' });
        state = adv.state;
        applied.push(...adv.applied);
        rejected.push(...adv.rejected);
        notices.push(...adv.notices);
        timeAdvanced = { seconds: adv.secondsAdvanced, requested: seconds, reason: why };
      }
    }
    narrationLevel = 'moment';
    return finish();
  }
  let started = false;
  // The fight's start notes (terrain accidents of the first bout, D-184) reach the narration with the exchanges.
  const startNotes: string[] = [];
  if (state.combat.pending && !state.combat.active) {
    startNotes.push(...apply([{ type: 'fightBegun', fromPending: true }]).flatMap((a) => a.notes));
    started = state.combat.active !== null;
  }
  // A fight intent starts a duel directly: its single entry point (D-29); fights are duels, not a check (M5).
  const npcTargets = intent ? intent.targets.filter((t) => selectNpc(state, t) !== null) : [];
  if (!state.combat.active && !state.combat.hold && intent?.actionType === 'fight' && npcTargets.length) {
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
    // A boarding fight just ended: its result goes back into the ship battle (D-517), told with the fight's end.
    if (selectBattleWaitsOnFight(state) === fightId && !state.combat.active) {
      apply([{ type: 'boardingFought', won: state.combat.last?.id === fightId && state.combat.last.outcome === 'won' }]);
      battle = battleDraftOf(state);
    }
    // The player's own fight in a ground battle's sector just ended (m8-ground, D-522): back to the battle.
    if (selectGroundWaitsOnFight(state) === fightId && !state.combat.active) {
      apply([{ type: 'groundFightFought', won: state.combat.last?.id === fightId && state.combat.last.outcome === 'won' }]);
      battle = battleDraftOf(state);
    }
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

  // Someone is holding a foe off (D-496): this turn is the escape, whatever the player does with it. The duel was resolved
  // when they engaged; the plan meets it now.
  if (state.combat.hold && intent) {
    hold = resolveHoldTurn(state, state.combat.hold, intent.escapePlan ?? []);
    state = { ...state, meta: { ...state.meta, rngState: hold.rng } };
    const adv = advanceTime(registry, state, { seconds: hold.seconds, reason: 'escape', source: 'turnDraft', requested: hold.seconds, occupation: 'activity' });
    state = adv.state;
    applied.push(...adv.applied);
    rejected.push(...adv.rejected);
    notices.push(...adv.notices);
    timeAdvanced = { seconds: adv.secondsAdvanced, requested: hold.seconds, reason: 'escape' };
    apply([...hold.events]);
    narrationLevel = 'moment';
    return finish();
  }

  if (intent) {
    // A mission's stage (m9-missions B3): the player's approach decides it in code: a skill roll, a fight or a battle begun.
    const stage = tryMissionStage(registry, state, intent, opts.mission ?? null);
    if (stage) {
      state = stage.state;
      applied.push(...stage.applied);
      rejected.push(...stage.rejected);
      notices.push(...stage.notices);
      report.push(...stage.report);
      checks.push(...stage.checks);
      if (stage.seconds > 0) timeAdvanced = { seconds: stage.seconds, requested: stage.seconds, reason: 'the mission' };
      narrationLevel = stage.seconds > 12 * 3600 ? 'montage' : 'scene';
      if (narrationLevel !== selectPacingLevel(state)) apply([{ type: 'pacingSet', level: narrationLevel }]);
      return finish();
    }
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
    // A line of a plan against a top duelist (D-493).
    const laid = tryPlan(state, intent);
    if (laid && 'refused' in laid) report.push(`plan: ${laid.refused}`);
    else if (laid) {
      checks.push(laid.card);
      state = { ...state, meta: { ...state.meta, rngState: laid.rng } };
      apply([...laid.events]);
    }
    const handled = [attempt, watch, escape, laid].some((a) => a && !('refused' in a));
    if (attempt && !('refused' in attempt)) travel = attempt.travel;
    // The ship's part of a trip (m8-ship-life, D-519): passage, or the own ship's legs, breakdowns, costs and customs.
    if (travel?.ok) {
      const leg = shipTrip(state, intent, travel);
      state = { ...state, meta: { ...state.meta, rngState: leg.rng } };
      travel = leg.travel;
      if (travel.ok) apply([...leg.events]);
    }
    // The trip out to a mission's target begins (m9-release A11): recorded before the days pass, so a long trip is not "never set out".
    const outbound = state.duty.mission;
    if (travel?.ok && outbound?.phase === 'outbound' && outbound.setOut !== true && outbound.targetWorld.toLowerCase() === travel.to.toLowerCase()) apply([{ type: 'missionSetOut' }]);
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
    // A trip (m9-release A3): the travel rules' hours stand; the narrator's scene-span clamp never cuts them.
    const trip = travel?.ok === true && !(watch && !('refused' in watch));
    const jumpSpan = spanSeconds !== null ? pacingForSpan(spanSeconds, trip ? undefined : intent.requestedPacing, trip) : null;
    if (jumpSpan && isJumpLevel(jumpSpan.level)) {
      const level = jumpSpan.level;
      if (jumpSpan.clampedFrom !== undefined) report.push(`requested span ${jumpSpan.clampedFrom}s clamped to ${jumpSpan.seconds}s (${level})`);
      const reason = intent.requestedSpan ? `${level} for ${intent.requestedSpan.amount} ${intent.requestedSpan.unit}` : level;
      // A trip ends on the morning nearest its arrival (m9-release A3; a montage runs the days to a wake time).
      const target = trip ? tripTargetDay(state, jumpSpan.seconds) : jumpTargetDay(state.clock.now.day, jumpSpan.seconds, intent.requestedSpan, jumpSpan.clampedFrom !== undefined);
      // Rest and care over days (D-199): the care period starts first, and the days are rest and recovery, not training.
      const resting = intent.actionType === 'rest' || intent.actionType === 'heal' || intent.actionType === 'sleep' || intent.healing !== undefined;
      // Care over the jump (medicine.md, D-511): the events, the surgery roll and the bill come from the care plan.
      if ((intent.actionType === 'heal' || intent.healing) && (selectWounds(state).length || state.health.lasting.length) && !selectIsDying(state)) {
        const plan = carePlan(state, intent.healing ?? { source: 'admit' }, jumpSpan.seconds / 3600, { dying: false });
        if (plan.rng) state = { ...state, meta: { ...state.meta, rngState: plan.rng } };
        report.push(...plan.report);
        if (plan.events.length) apply(plan.events);
      }
      const j = resolveJump(registry, state, level, target, reason, resting, opts.homeDays === true);
      if (resting) report.push('rest and recovery: no training on these days');
      state = j.run.state;
      applied.push(...j.run.applied);
      rejected.push(...j.run.rejected);
      // Where the skip was going (opt-2 D5): kept when it stopped early, for "Resume the skip"; cleared when it ran to its end.
      const stoppedEarly = j.run.interrupted !== undefined && state.clock.now.day < target;
      if (stoppedEarly || state.duty.resume) apply([{ type: 'skipResumePoint', targetDay: stoppedEarly ? target : null }]);
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

    const span = spanSeconds !== null ? pacingForSpan(spanSeconds, undefined, trip) : null;
    const wantedLevel = span?.level ?? intent.requestedPacing;
    if (wantedLevel && wantedLevel !== selectPacingLevel(state)) apply([{ type: 'pacingSet', level: wantedLevel }]);

    // A hazard the player's own action causes (intent.risk): damage by the health rules (D-149).
    if (intent.risk) apply([{ type: 'hazardResolved', hazard: intent.risk.type, severity: intent.risk.severityHint, cause: `the player's action (${intent.actionType})` }]);
    // Healing (health §7, D-150): stabilizing a mortal wound is a check; care and healers apply through health events.
    if (intent.actionType === 'heal' || intent.forceAbility === 'forceHealSelf') {
      const healer = intent.healing?.healerRef && selectNpc(state, intent.healing.healerRef) ? intent.healing.healerRef : null;
      const selfForce = intent.forceAbility === 'forceHealSelf' && selectLevelExact(state, 'forceHealSelf') >= 1;
      const source = intent.healing?.source ?? (selfForce ? 'forceHealer' : 'treat');
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
      }
      // Care (medicine.md, D-511): after a stabilizing check, field care still dresses the wounds; otherwise the full plan.
      if (!selectIsDying(state) && !state.health.death) {
        const plan = carePlan(state, intent.healing ?? { source: source === 'forceHealer' ? 'forceHealer' : 'treat', ...(healer ? { healerRef: healer } : {}) }, spanSeconds !== null ? spanSeconds / 3600 : null, { dying: false });
        if (plan.rng) state = { ...state, meta: { ...state.meta, rngState: plan.rng } };
        report.push(...plan.report);
        if (plan.events.length) apply(plan.events);
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
      const traitMod = selectCheckTraitMod(state, { skillId: validSkill ? skillId : null, ...(intent.situation ? { situation: intent.situation } : {}), npcTargets });
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
        // Starting traits (M8 item 16): +-1-2 in the trait's situation and with the kinds of NPC it names, +-2 in all.
        modifiers: traitMod.total ? [{ source: traitMod.label, value: traitMod.total }] : [],
        difficulty,
        notes,
      });
      checks.push(card);
      report.push(...notes);
      state = { ...state, meta: { ...state.meta, rngState: next } };
      // XP from play (m8-skills, D-513): the code logs the line, never the narrator. A rolled social exchange with an NPC is
      // a social line (a Charisma roll is a persuasion, by the target's level); a Stealth roll is Stealth used in the field.
      const play = playXpFromCheck(state, { actionType: intent.actionType, skillId: validSkill ? skillId : null, difficulty, success: card.success, rating: card.rating, npcTargets });
      if (play.length) apply(play);
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

/**
 * XP from play for a rolled check (m8-skills, D-513; engine/playXp): a social exchange with an NPC logs a social line, or a
 * persuasion when the roll is Charisma (success 1.0, failure 0.25, by the target's Charisma or Willpower against the
 * character's Charisma); a Stealth roll is field use (by the check's rating). The check's difficulty is the stakes.
 */
export function playXpFromCheck(state: GameState, c: { actionType: string; skillId: string | null; difficulty: string; success: boolean; rating: number; npcTargets: readonly string[] }): GameEvent[] {
  const stakes = DIFFICULTY_STAKES[c.difficulty] ?? 'notable';
  const out: GameEvent[] = [];
  const target = c.npcTargets[0];
  if (c.actionType === 'dialogue' && target) {
    if (c.skillId === 'charisma') {
      const resist = Math.max(selectNpcLevel(state, target, 'charisma'), selectNpcLevel(state, target, 'willpower'));
      out.push({ type: 'playXpEarned', source: 'persuasion', success: c.success, stakes, gap: resist - selectLevelExact(state, 'charisma'), why: 'persuasion' });
    } else out.push({ type: 'playXpEarned', source: 'socialLine', stakes, why: 'a conversation with something at stake' });
  }
  if (c.skillId === 'stealth') out.push({ type: 'playXpEarned', source: 'stealth', success: c.success, stakes, gap: c.rating - selectLevelExact(state, 'stealth'), why: 'stealth in the field' });
  return out;
}

/** A mind ability on an NPC as a contest (D-192), shown as a check card whose DC is the target's roll. */
function mindContestCard(state: GameState, abilityId: string, npcId: string): { card: CheckCard; rng: RngState } {
  const npc = selectNpc(state, npcId)!;
  const lv = (id: string): number => selectNpcLevel(state, npcId, id);
  const target: ForceTarget = { name: npc.name, willpower: lv('willpower'), agility: lv('agility'), forceResistance: forceResistanceOf(lv), traits: characterForceTraits(npc.speciesId, npcInsideForce(npc), npcOwnForceTraits(npc)), bodySize: 'humanoid', inCover: false, canReact: true, saberLevel: 0 };
  const level = selectPerformance(state, abilityId);
  // The target's traits (M8 item 16): a Stubborn mind resists a trick (+2 to its side, shown as -2 on the user's roll).
  const resist = selectNpcMindTrickResist(state, npcId);
  const [r, rng] = forceContest(state.meta.rngState, { kind: 'mindTrick', group: 'mind', level, modifiers: resist ? [{ source: `${npc.name}'s traits`, value: -resist }] : [], target, negated: false });
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
