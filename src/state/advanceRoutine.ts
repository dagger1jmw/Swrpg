// The routine day loop (architecture §9, §10; training-routines §6-7; D-130). Montages, time skips and
// the lifetime test advance through here, one day at a time:
//   free time (rest) until bedtime -> sleep until the wake time -> sleepCompleted ->
//   the scheduler's plan for the day: each session through resolveTraining (the same code path as a
//   story turn's training) and advanceTime with occupation activity; the conditional rests and the gaps
//   around locked blocks as rest.
// The routine's sessions are §10 slot 1: they happen during the day, so every day-end hook (health,
// progression, ..., world, pacing) runs after them, at midnight, in registry order. Midnight falls in the
// night's sleep for any normal routine. A hook's interruption stops the loop; an interruption during the
// night lets the sleep finish, so the story resumes in the morning (Q48). Pure.
import { formatDate } from '../engine/calendar';
import { selectFatigue, selectMaxFraction } from '../features/health/selectors';
import { resolveTraining } from '../features/progression/selectors';
import { planDay, selectActiveRoutine, selectFillCredit, type PlannedBlock } from '../features/routines/selectors';
import { advanceTime } from './advanceTime';
import { applyEvents, type AppliedEvent, type RejectedEvent, type UnknownRef } from './applyEvents';
import type { GameState } from './gameState';
import type { GameEvent, Occupation, Registry } from './types';

const DAY = 86_400;

export interface SessionLog {
  activityId: string;
  skillId: string;
  hours: number;
  /** XP credited per skill (rounded to 0.01). */
  credited: Record<string, number>;
  outcome: string;
  refused?: string;
  /** The challenge factor of the drill (a gap below -20 is an easy drill, training-routines §5). */
  challenge?: number;
  notes?: string[];
  /** A fill block (the budget's free hours) rather than a fixed one (Order, locked, daily life); pace measurement reads it. */
  fill?: boolean;
}

export interface DayLog {
  /** Absolute day (the waking day). */
  day: number;
  label: string;
  trainingDay: boolean;
  recovery: boolean;
  sessions: SessionLog[];
  hoursTrained: number;
  /** Scheduling and adjustment notes (training-routines §6). */
  notes: string[];
  /** Notices from the day's hooks (birthdays, world events, thread deadlines, ...). */
  notices: string[];
  endF: number;
}

export interface RoutineAdvanceResult {
  state: GameState;
  applied: AppliedEvent[];
  rejected: RejectedEvent[];
  notices: string[];
  unknownRefs: UnknownRef[];
  days: DayLog[];
  secondsAdvanced: number;
  interrupted?: { reason: string; day: number };
}

/** The first wake time at or after `abs` (absolute seconds). */
export function nextWakeAbs(abs: number, wakeSecond: number): number {
  const day = Math.floor(abs / DAY);
  const today = day * DAY + wakeSecond;
  return today >= abs ? today : today + DAY;
}

const absOf = (s: GameState): number => s.clock.now.day * DAY + s.clock.now.second;

/**
 * Runs the routine until `untilAbs` (normally a wake time), or until a hook interrupts. `untilAbs` is
 * clamped so the loop always ends at a wake time.
 */
export function advanceByRoutine(registry: Registry<GameState>, initial: GameState, opts: { untilAbs: number; reason: string; jump?: boolean; rest?: boolean }): RoutineAdvanceResult {
  const jump = opts.jump ?? true;
  let state = initial;
  const applied: AppliedEvent[] = [];
  const rejected: RejectedEvent[] = [];
  const notices: string[] = [];
  const unknownRefs: UnknownRef[] = [];
  const days: DayLog[] = [];
  const startAbs = absOf(state);
  let interrupted: { reason: string; day: number } | undefined;
  let dayNotices: string[] = [];

  const apply = (events: readonly GameEvent[]): AppliedEvent[] => {
    const r = applyEvents(registry, state, events, { source: 'engine' });
    state = r.state;
    applied.push(...r.applied);
    rejected.push(...r.rejected);
    notices.push(...r.notices);
    dayNotices.push(...r.notices);
    unknownRefs.push(...r.unknownRefs);
    return r.applied;
  };
  /** Advances `seconds`; returns false when a hook interrupted. */
  const pass = (seconds: number, occupation: Occupation, why: string): boolean => {
    const secs = Math.round(seconds);
    if (secs <= 0) return true;
    const r = advanceTime(registry, state, { seconds: secs, reason: why, source: 'turnDraft', occupation, jump });
    state = r.state;
    applied.push(...r.applied);
    rejected.push(...r.rejected);
    notices.push(...r.notices);
    dayNotices.push(...r.notices);
    unknownRefs.push(...r.unknownRefs);
    if (r.interrupted !== undefined && !interrupted) {
      interrupted = { reason: r.interrupted, day: state.clock.now.day };
      return false;
    }
    return true;
  };

  const runBlock = (b: PlannedBlock, effort: 'easy' | 'standard' | 'push', log: DayLog): boolean => {
    const plan = resolveTraining(state, {
      activityId: b.activityId,
      skillId: b.skillId,
      hours: b.hours,
      source: b.source,
      intensity: b.intensity,
      drillEffort: effort === 'push' ? 'push' : 'standard',
    });
    if (!plan.ok) {
      log.sessions.push({ activityId: b.activityId, skillId: b.skillId, hours: 0, credited: {}, outcome: 'refused', refused: plan.reason });
      log.notes.push(`refused: ${plan.reason}`);
      return true;
    }
    state = { ...state, meta: { ...state.meta, rngState: plan.rng } };
    apply(plan.events);
    // Teachers and partners grow closer through shared sessions (architecture §9, D-137).
    const npc = plan.card.instruction.teacherId ?? plan.card.instruction.partnerId;
    if (npc) apply([{ type: 'sharedTraining', npcId: npc, hours: plan.hours }]);
    log.sessions.push({ activityId: b.activityId, skillId: b.skillId, hours: plan.hours, credited: plan.card.credited, outcome: plan.card.outcome, challenge: plan.card.challenge, notes: plan.card.notes, ...(b.fill ? { fill: true } : {}) });
    log.hoursTrained += plan.hours;
    return pass(plan.hours * 3600, 'activity', `routine: ${plan.card.activityName}`);
  };

  while (absOf(state) < opts.untilAbs && !interrupted) {
    const routine = selectActiveRoutine(state);
    const now = absOf(state);
    const wake = nextWakeAbs(now, routine.wakeSecond);
    if (wake !== now) {
      // Evening and night: free time until bedtime, then sleep to the wake time (D-52).
      const bed = wake - routine.sleepHours * 3600;
      if (now < bed && !pass(Math.min(bed, opts.untilAbs) - now, 'rest', 'routine: free time')) break;
      if (absOf(state) >= opts.untilAbs) break;
      const sleepFrom = absOf(state);
      const ok = pass(wake - sleepFrom, 'sleep', 'routine: sleep');
      // An interruption in the night: the sleep still finishes, so the story resumes in the morning.
      if (!ok && absOf(state) < wake) pass(wake - absOf(state), 'sleep', 'routine: sleep');
      apply([{ type: 'sleepCompleted', hours: Math.round(((absOf(state) - sleepFrom) / 3600) * 100) / 100 }]);
      if (interrupted) break;
      continue;
    }
    if (now >= opts.untilAbs) break;

    // Morning: the day's plan. Notices from the night (midnight hooks) belong to this day.
    // The player rests (D-199: "I rest for a week while a medic treats my arm"): rest and recovery days, no training.
    const planned = planDay(state, routine, selectFillCredit(state));
    const plan = opts.rest ? { ...planned, trainingDay: false, recovery: true, items: [], notes: ['rest and recovery: the character rests'] } : planned;
    const log: DayLog = { day: state.clock.now.day, label: formatDate(state.clock.now.day), trainingDay: plan.trainingDay, recovery: plan.recovery, sessions: [], hoursTrained: 0, notes: [...plan.notes], notices: dayNotices, endF: 0 };
    days.push(log);
    if (plan.trainingDay && !plan.recovery) apply([{ type: 'routineDayPlanned', fillCredit: plan.fillCredit }]);
    for (const item of plan.items) {
      const t = absOf(state);
      const at = state.clock.now.day * DAY + item.startSecond;
      if (at > t && !pass(at - t, 'rest', 'routine: break')) break;
      if (item.kind === 'rest') {
        // §4 rule 5: rest between physical blocks only when f_phys has passed 0.7; a rest the plan needs to stay under the
        // tiredness limit is always taken (D-456: a rest before a trim).
        if ((!item.conditional || selectFatigue(state).p > 0.7) && !pass(item.hours * 3600, 'rest', 'routine: rest')) break;
        continue;
      }
      if (!runBlock(item, routine.effort, log)) break;
    }
    log.endF = Math.round(selectMaxFraction(state) * 100) / 100;
    // The evening and the night collect the next day's notices.
    dayNotices = [];
    if (interrupted) break;
    // Next: free time and the night (loop top). Guard: a plan that ends past the next wake time moves on.
    if (absOf(state) === now) pass(1, 'rest', 'routine: free time');
  }
  const out: RoutineAdvanceResult = { state, applied, rejected, notices, unknownRefs, days, secondsAdvanced: absOf(state) - startAbs };
  if (interrupted) out.interrupted = interrupted;
  return out;
}
