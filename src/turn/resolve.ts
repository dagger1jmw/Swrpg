// Step b of the turn (architecture §4): RESOLVE. Pure. Produces the frozen TurnDraft once; every
// retry of the narration reuses it, so dice are never re-rolled.
import { CHECK_RULES, type ActionType } from '../data/checks.config';
import { M1_PACING_LEVELS, PACING_RANGES, type PacingLevel } from '../data/pacing.config';
import { stubVitalitySpent, stubWoundPenalty } from '../data/stubs';
import { DEFAULT_ACTIVITY } from '../data/activities';
import { isSkillId } from '../data/skills';
import { spanToSeconds, type Intent } from '../ai/schemas/intent';
import { efficiency } from '../engine/fatigue';
import { check, clampDifficulty, isCheckRequired, type CheckCard } from '../engine/rolls';
import type { RngState } from '../engine/rng';
import { selectFatigue } from '../features/health/selectors';
import { selectPacingLevel } from '../features/pacing/selectors';
import { selectPerformance, selectRust } from '../features/progression/selectors';
import { resolveTraining, type TrainingCard, type TrainingRequest } from '../features/progression/selectors';
import { DEFAULT_TRAINING_HOURS } from './expandChoice';
import { advanceTime } from '../state/advanceTime';
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

/** The smallest M1 pacing level whose range holds the span; longer spans clamp to scene (D-72). */
export function pacingForSpan(seconds: number): { level: PacingLevel; seconds: number; clampedFrom?: number } {
  for (const level of M1_PACING_LEVELS) {
    const r = PACING_RANGES[level];
    if (seconds <= r.max) {
      const s = Math.max(r.min, seconds);
      return s === seconds ? { level, seconds } : { level, seconds: s, clampedFrom: seconds };
    }
  }
  const max = PACING_RANGES.scene.max;
  return { level: 'scene', seconds: max, clampedFrom: seconds };
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

export function resolveTurn(registry: Registry<GameState>, initial: GameState, intent: Intent | null): Resolution {
  let state = initial;
  const report: string[] = [];
  const applied: AppliedEvent[] = [];
  const rejected: RejectedEvent[] = [];
  const notices: string[] = [];
  const checks: CheckCard[] = [];
  let training: TrainingOutcome | null = null;
  let timeAdvanced: TimeAdvanced | null = null;

  const apply = (events: unknown[]): void => {
    const r = applyEvents(registry, state, events, { source: 'engine' });
    state = r.state;
    applied.push(...r.applied);
    rejected.push(...r.rejected);
    notices.push(...r.notices);
    for (const a of r.applied) report.push(...a.notes);
  };

  if (intent) {
    // A train / study intent with an activity (or a skill with a default activity) is a session (M3).
    const trainingReq = trainingRequest(intent);
    if ((intent.actionType === 'train' || intent.actionType === 'study') && !trainingReq) report.push('no activity or skill named: nothing trained');

    // Duration first: it decides the pacing level (D-72).
    let spanSeconds: number | null = null;
    if (intent.requestedSpan) spanSeconds = spanToSeconds(intent.requestedSpan);
    else if (intent.actionType === 'sleep') spanSeconds = DEFAULT_SLEEP_SECONDS;
    else if (trainingReq) spanSeconds = DEFAULT_TRAINING_HOURS * 3600;

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
          woundPenalty: stubWoundPenalty(),
          rust: validSkill ? selectRust(state, skillId) : 0,
          vitalitySpent: stubVitalitySpent(),
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

  const draft: TurnDraft = Object.freeze({
    intent,
    checks: Object.freeze(checks),
    training,
    timeAdvanced,
    pacingLevel: selectPacingLevel(state),
    notices: Object.freeze(notices),
    report: Object.freeze(report),
    resolvedActions: Object.freeze([]),
    rngAfter: state.meta.rngState,
    applied: Object.freeze(applied),
    rejected: Object.freeze(rejected),
  });
  return { draft, state };
}
