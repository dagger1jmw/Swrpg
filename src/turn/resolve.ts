// Step b of the turn (architecture §4): RESOLVE. Pure. Produces the frozen TurnDraft once; every
// retry of the narration reuses it, so dice are never re-rolled.
import { CHECK_RULES, type ActionType } from '../data/checks.config';
import { M1_PACING_LEVELS, PACING_RANGES, type PacingLevel } from '../data/pacing.config';
import { stubFatigueEfficiency, stubRust, stubSkillLevel, stubVitalitySpent, stubWoundPenalty } from '../data/stubs';
import { spanToSeconds, type Intent } from '../ai/schemas/intent';
import { check, clampDifficulty, isCheckRequired, type CheckCard } from '../engine/rolls';
import type { RngState } from '../engine/rng';
import { selectPacingLevel } from '../features/pacing/selectors';
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

export interface TurnDraft {
  readonly intent: Intent | null;
  readonly checks: readonly CheckCard[];
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

export function resolveTurn(registry: Registry<GameState>, initial: GameState, intent: Intent | null): Resolution {
  let state = initial;
  const report: string[] = [];
  const applied: AppliedEvent[] = [];
  const rejected: RejectedEvent[] = [];
  const notices: string[] = [];
  const checks: CheckCard[] = [];
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
    // Duration first: it decides the pacing level (D-72).
    let spanSeconds: number | null = null;
    if (intent.requestedSpan) spanSeconds = spanToSeconds(intent.requestedSpan);
    else if (intent.actionType === 'sleep') spanSeconds = DEFAULT_SLEEP_SECONDS;

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
      const [card, next] = check(state.meta.rngState, {
        label: ACTION_LABELS[intent.actionType],
        skillId,
        levelInputs: {
          level: stubSkillLevel(intent.skillId),
          woundPenalty: stubWoundPenalty(),
          rust: stubRust(intent.skillId),
          vitalitySpent: stubVitalitySpent(),
          fatigueEfficiency: stubFatigueEfficiency(),
        },
        modifiers: [],
        difficulty,
        notes,
      });
      checks.push(card);
      report.push(...notes);
      state = { ...state, meta: { ...state.meta, rngState: next } };
    }

    if (span) {
      if (span.clampedFrom !== undefined) report.push(`requested span ${span.clampedFrom}s clamped to ${span.seconds}s (${span.level})`);
      const reason = intent.requestedSpan ? `${intent.actionType} for ${intent.requestedSpan.amount} ${intent.requestedSpan.unit}` : intent.actionType;
      const adv = advanceTime(registry, state, {
        seconds: span.seconds,
        reason,
        source: 'turnDraft',
        requested: spanSeconds ?? span.seconds,
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
    }

    if (intent.unknownNames.length) report.push(`unknown names (review queue arrives in M2): ${intent.unknownNames.join(', ')}`);
  }

  const draft: TurnDraft = Object.freeze({
    intent,
    checks: Object.freeze(checks),
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
