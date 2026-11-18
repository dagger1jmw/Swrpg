// Routine preview (training-routines §5): shown before the player approves a routine. It runs the routine
// for 7 days on a copy of the state through the real day loop (no world rolls, nothing is kept) and reports
// the typical day, its tiredness curve, the projected XP per skill per week, and warnings. Pure.
import { ACTIVITY_BY_ID } from '../data/activities';
import { RUST } from '../data/progression.config';
import { CATEGORY_RULES, SKILL_BY_ID } from '../data/skills';
import { formatClock } from '../engine/calendar';
import { challengeFactor } from '../engine/challenge';
import { selectCapacities, selectSkillXp } from '../features/progression/selectors';
import { orderBlocks, planDay, projectDay, routineSchema, type PlannedBlock, type Routine } from '../features/routines/selectors';
import { selectMeters } from '../features/health/selectors';
import { afterSleep } from '../engine/fatigue';
import { advanceByRoutine } from './advanceRoutine';
import { applyEvents } from './applyEvents';
import type { GameState } from './gameState';
import type { Registry } from './types';

export interface PreviewItem {
  start: string;
  kind: 'train' | 'rest';
  label: string;
  hours: number;
  skillId?: string;
  source?: string;
  fixed?: boolean;
  locked?: boolean;
}

export interface RoutinePreview {
  ok: boolean;
  error?: string;
  typicalDay: PreviewItem[];
  budget: number;
  projectedEndF: number;
  /** Tiredness through the typical day (fractions of capacity). */
  curve: { hour: number; fp: number; fm: number }[];
  weeklyXp: { skillId: string; name: string; xp: number }[];
  trainingDaysPerWeek: number;
  warnings: string[];
}

const EASY_DRILL_CHALLENGE = challengeFactor(-20);
const sourceLabel = (b: PlannedBlock): string => (b.source.kind === 'npc' || b.source.kind === 'partner' || b.source.kind === 'record' ? `${b.source.kind} ${b.source.id}` : b.source.kind);

export function previewRoutine(registry: Registry<GameState>, initial: GameState, routineIn: Routine): RoutinePreview {
  const parsed = routineSchema.safeParse(routineIn);
  const empty: RoutinePreview = { ok: false, typicalDay: [], budget: 0, projectedEndF: 0, curve: [], weeklyXp: [], trainingDaysPerWeek: 0, warnings: [] };
  if (!parsed.success) return { ...empty, error: parsed.error.issues[0]?.message ?? 'invalid routine' };
  const set = applyEvents(registry, initial, [{ type: 'routineSet', routine: parsed.data }], { source: 'player' });
  if (set.rejected.length) return { ...empty, error: set.rejected[0]!.reason };
  const s = set.state;
  const routine = parsed.data;

  // The typical day: today's plan as if it were a training day (the week below shows the real pattern).
  const typical = planDay(s, { ...routine, daysPerWeek: 7 }, s.routines.fillCredit);
  const items: PreviewItem[] = typical.items.map((it) =>
    it.kind === 'rest'
      ? { start: formatClock(it.startSecond), kind: 'rest', label: 'Rest (if tired)', hours: it.hours }
      : {
          start: formatClock(it.startSecond),
          kind: 'train',
          label: ACTIVITY_BY_ID.get(it.activityId)?.name ?? it.activityId,
          hours: it.hours,
          skillId: it.skillId,
          source: sourceLabel(it),
          fixed: it.fixed,
          locked: it.locked,
        },
  );
  const blocks = typical.items.filter((x): x is PlannedBlock => x.kind === 'train');
  const curve = projectDay(orderBlocks(blocks.filter((b) => !b.locked)).concat(blocks.filter((b) => b.locked)), afterSleep(selectMeters(s), routine.sleepHours), selectCapacities(s)).curve;

  // A week through the real day loop.
  const wake = routine.wakeSecond;
  const untilAbs = (s.clock.now.day + 7) * 86_400 + wake;
  const run = advanceByRoutine(registry, s, { untilAbs, reason: 'preview', jump: false });
  const weeklyXp: RoutinePreview['weeklyXp'] = [];
  for (const id of new Set([...Object.keys(s.progression.skills), ...Object.keys(run.state.progression.skills)])) {
    const xp = selectSkillXp(run.state, id) - selectSkillXp(s, id);
    if (xp >= 0.05) weeklyXp.push({ skillId: id, name: SKILL_BY_ID.get(id)?.name ?? id, xp: Math.round(xp * 10) / 10 });
  }
  weeklyXp.sort((a, b) => b.xp - a.xp);

  const warnings: string[] = [];
  const over = run.days.filter((d) => d.endF > 1.0).length;
  if (typical.projectedEndF > 1.0 || over) warnings.push(`Overtraining risk: ${over ? `${over} of 7 days end` : 'the typical day ends'} above f 1.0.`);
  for (const n of typical.notes) if (/over the/.test(n)) warnings.push(n);
  // Skills that will start rusting: trained, not practiced this week, past the grace period by its end.
  const practiced = new Set(run.days.flatMap((d) => d.sessions.filter((x) => !x.refused).map((x) => x.skillId)));
  const end = run.state.clock.now.day;
  const rusting: string[] = [];
  for (const [id, st] of Object.entries(s.progression.skills)) {
    const def = SKILL_BY_ID.get(id);
    if (!def || st.xp <= 0 || practiced.has(id) || st.lastPracticedDay === null) continue;
    const grace = RUST[CATEGORY_RULES[def.category].rustRow].graceDays;
    if (end - (run.state.progression.skills[id]?.lastPracticedDay ?? st.lastPracticedDay) >= grace) rusting.push(def.name);
  }
  if (rusting.length) warnings.push(`Starting to rust (unused past the grace period): ${rusting.join(', ')}.`);
  const notes = run.days.flatMap((d) => d.sessions.flatMap((x) => x.notes ?? []));
  if (notes.some((n) => /no teaching benefit/.test(n))) warnings.push('A teacher is no longer ahead of you in a skill: look for a new teacher or a holocron.');
  const easy = [...new Set(run.days.flatMap((d) => d.sessions.filter((x) => (x.challenge ?? 1) <= EASY_DRILL_CHALLENGE + 1e-9).map((x) => SKILL_BY_ID.get(x.skillId)?.name ?? x.skillId)))];
  if (easy.length) warnings.push(`Easy drills (more than 20 levels below you): ${easy.join(', ')}. Find a harder drill or a teacher.`);
  const refused = [...new Set(run.days.flatMap((d) => d.sessions.filter((x) => x.refused).map((x) => x.refused!)))];
  for (const r of refused) warnings.push(`Refused: ${r}`);
  for (const n of new Set(run.days.flatMap((d) => d.notes))) if (/unavailable|trimmed/.test(n)) warnings.push(n);
  // The drill ceiling (25 + E, M5) and the injury adjustments (training-routines §5-6), from the typical day and the week.
  for (const n of new Set([...typical.notes, ...run.days.flatMap((d) => d.notes)])) if (/drill ceiling|injury/.test(n)) warnings.push(n);

  return {
    ok: true,
    typicalDay: items,
    budget: Math.round(typical.budget * 10) / 10,
    projectedEndF: Math.round(typical.projectedEndF * 100) / 100,
    curve,
    weeklyXp,
    trainingDaysPerWeek: run.days.filter((d) => d.trainingDay && !d.recovery).length,
    warnings: [...new Set(warnings)],
  };
}
