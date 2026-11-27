// Field practice on a mission (Jared, 27 Nov 2026, m9-tune A2: "Jedi keep training in the field"). A day of a mission's stage work
// leaves room for a short session on the routine's plan: the day's plan (the routine's own blocks, in its own mix) scaled down to
// FIELD_PRACTICE.hours, each block through resolveTraining as the routine runs it. None on a day with a fight or a battle, none
// while wounded past minor, at most one a day (a day the routine or a montage already trained is not a field day). Pure.
import { FIELD_PRACTICE } from '../data/missions.config';
import { STEP_HOURS } from '../data/progression.config';
import { DUTY_INJURY } from '../data/duty.config';
import { selectWounds } from '../features/health/selectors';
import { resolveTraining } from '../features/progression/selectors';
import { planDay, selectActiveRoutine, selectFillCredit, type PlannedBlock } from '../features/routines/selectors';
import { advanceTime } from './advanceTime';
import { applyEvents, type AppliedEvent, type RejectedEvent } from './applyEvents';
import type { GameState } from './gameState';
import type { Registry } from './types';

export interface FieldPractice {
  state: GameState;
  applied: AppliedEvent[];
  rejected: RejectedEvent[];
  notices: string[];
  /** The day-by-day line: what was practised and for how long. */
  line: string | null;
  seconds: number;
}

/** Why no field practice today, or null when there may be one. */
export function fieldPracticeBlocked(s: GameState): string | null {
  if (s.duty.status !== 'mission') return 'not on a mission';
  if (s.progression.today.trainingHours > 0) return 'already trained today';
  // A fight today (any form or weapon), or a battle (its field fighting, command, gunnery or flying).
  if (Object.values(s.progression.fightsToday).some((n) => n > 0)) return 'a fight today';
  if (Object.keys(s.progression.playToday ?? {}).some((k) => /^(fieldFight|command|gunnery|piloting):/.test(k))) return 'a battle today';
  if (s.combat.active || s.battles.active || s.battles.ground || s.battles.planning) return 'a fight or battle under way';
  const hurt = selectWounds(s).find((w) => w.severity !== 'minor' && w.healProgress < DUTY_INJURY.healedEnough);
  if (hurt) return `a ${hurt.severity} wound`;
  return null;
}

/**
 * The practice's hours on the day's plan: the plan's blocks (the same activity and skill merged) share `hours` in steps of a
 * session's least length (STEP_HOURS, 0.5 h: shorter sessions round up to it), by the largest remainder of their planned hours,
 * so the biggest parts of the routine are practised first and the total stays `hours`.
 */
export function practiceShares(blocks: readonly PlannedBlock[], hours: number): { block: PlannedBlock; hours: number }[] {
  const merged = new Map<string, { block: PlannedBlock; planned: number }>();
  for (const b of blocks) {
    const k = `${b.activityId}|${b.skillId}`;
    const m = merged.get(k);
    if (m) m.planned += b.hours;
    else merged.set(k, { block: b, planned: b.hours });
  }
  const list = [...merged.values()].filter((m) => m.planned > 0);
  const total = list.reduce((a, m) => a + m.planned, 0);
  const units = Math.floor(Math.min(hours, total) / STEP_HOURS + 1e-9);
  if (!units || total <= 0) return [];
  const exact = list.map((m) => (m.planned / total) * units);
  const got = exact.map(Math.floor);
  let left = units - got.reduce((a, b) => a + b, 0);
  // Largest remainder; a tie goes to the block planned first.
  const order = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const o of order) {
    if (left <= 0) break;
    got[o.i]! += 1;
    left -= 1;
  }
  return list.map((m, i) => ({ block: m.block, hours: got[i]! * STEP_HOURS })).filter((x) => x.hours > 0);
}

/** A short session on the routine's plan after the day's mission work, or nothing (with the reason in no line). */
export function fieldPractice(registry: Registry<GameState>, initial: GameState): FieldPractice {
  const out: FieldPractice = { state: initial, applied: [], rejected: [], notices: [], line: null, seconds: 0 };
  if (fieldPracticeBlocked(initial) !== null) return out;
  const routine = selectActiveRoutine(initial);
  const plan = planDay(initial, routine, selectFillCredit(initial));
  if (!plan.trainingDay || plan.recovery) return out;
  const done: string[] = [];
  let hours = 0;
  for (const { block: b, hours: h } of practiceShares(plan.items.filter((x) => x.kind === 'train'), FIELD_PRACTICE.hours)) {
    const p = resolveTraining(out.state, { activityId: b.activityId, skillId: b.skillId, hours: h, source: b.source, intensity: b.intensity, drillEffort: routine.effort === 'push' ? 'push' : 'standard' });
    if (!p.ok) continue;
    out.state = { ...out.state, meta: { ...out.state.meta, rngState: p.rng } };
    const r = applyEvents(registry, out.state, p.events, { source: 'engine' });
    out.state = r.state;
    out.applied.push(...r.applied);
    out.rejected.push(...r.rejected);
    out.notices.push(...r.notices);
    const t = advanceTime(registry, out.state, { seconds: Math.round(p.hours * 3600), reason: `field practice: ${p.card.activityName}`, source: 'turnDraft', occupation: 'activity' });
    out.state = t.state;
    out.applied.push(...t.applied);
    out.rejected.push(...t.rejected);
    out.notices.push(...t.notices);
    out.seconds += t.secondsAdvanced;
    hours += p.hours;
    done.push(`${p.card.activityName} ${p.hours} h`);
  }
  if (done.length) out.line = `field practice after the day's work (${Math.round(hours * 100) / 100} h): ${done.join(', ')}`;
  return out;
}
