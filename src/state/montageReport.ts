// The montage report (training-routines §8; architecture §9): what a jump did, built by code from the
// day loop's logs, the applied events and the state before and after. The AI receives it to write the
// narration and invents no stat outcomes. Pure.
import { SKILL_BY_ID } from '../data/skills';
import { formatDate } from '../engine/calendar';
import { selectNpc } from '../features/npcs/selectors';
import { selectLevel, selectRust, selectSkillXp } from '../features/progression/selectors';
import { selectThread } from '../features/threads/selectors';
import type { AppliedEvent } from './applyEvents';
import type { DayLog, RoutineAdvanceResult } from './advanceRoutine';
import type { GameState } from './gameState';

export interface SkillChange {
  skillId: string;
  name: string;
  xp: number;
  levelBefore: number;
  levelAfter: number;
}

export interface MontageReport {
  level: 'montage' | 'timeSkip';
  fromDay: number;
  toDay: number;
  fromLabel: string;
  toLabel: string;
  requestedDays: number;
  /** Calendar days that passed; `days` has one entry per morning the routine was planned. */
  daysCompleted: number;
  trainingDays: number;
  restDays: number;
  hoursTrained: number;
  interrupted: { reason: string; day: number; label: string } | null;
  skills: SkillChange[];
  breakthroughs: number;
  willpowerXp: number;
  rust: { cleared: { skillId: string; from: number; to: number }[]; gained: { skillId: string; from: number; to: number }[] };
  /** Injuries arrive with health in M5. */
  injuries: string[];
  relationships: { npcId: string; name: string; from: number; to: number }[];
  /** World events, thread deadlines, tier crossings and other notices, in order. */
  events: { day: number; label: string; text: string; significant: boolean }[];
  /** Automatic adjustments and scheduling notes with how many days each applied (training-routines §6). */
  adjustments: { note: string; days: number }[];
  /** One line per day for the day-by-day view. */
  days: { day: number; label: string; hours: number; trained: string[]; notes: string[]; events: string[] }[];
}

const round = (x: number, d = 2): number => Math.round(x * 10 ** d) / 10 ** d;

export function buildMontageReport(before: GameState, run: RoutineAdvanceResult, opts: { level: 'montage' | 'timeSkip'; requestedDays: number }): MontageReport {
  const after = run.state;
  const skills: SkillChange[] = [];
  const ids = new Set([...Object.keys(before.progression.skills), ...Object.keys(after.progression.skills)]);
  for (const id of ids) {
    const xp = selectSkillXp(after, id) - selectSkillXp(before, id);
    if (xp < 0.05) continue;
    skills.push({ skillId: id, name: SKILL_BY_ID.get(id)?.name ?? id, xp: round(xp, 1), levelBefore: selectLevel(before, id), levelAfter: selectLevel(after, id) });
  }
  skills.sort((a, b) => b.xp - a.xp);

  const cleared: MontageReport['rust']['cleared'] = [];
  const gained: MontageReport['rust']['gained'] = [];
  for (const id of ids) {
    const a = selectRust(before, id);
    const b = selectRust(after, id);
    if (b < a - 0.0005) cleared.push({ skillId: id, from: round(a, 3), to: round(b, 3) });
    else if (b > a + 0.0005) gained.push({ skillId: id, from: round(a, 3), to: round(b, 3) });
  }

  const relationships: MontageReport['relationships'] = [];
  for (const [id, r] of Object.entries(after.relationships.byNpcId)) {
    const from = before.relationships.byNpcId[id]?.value ?? 0;
    if (Math.abs(r.value - from) >= 0.5) relationships.push({ npcId: id, name: selectNpc(after, id)?.name ?? id, from: round(from, 1), to: round(r.value, 1) });
  }

  const events: MontageReport['events'] = [];
  const dayOf = (a: AppliedEvent): number => Number(a.event['day'] ?? after.clock.now.day);
  for (const a of run.applied) {
    const e = a.event;
    if (e.type === 'worldEventRolled') events.push({ day: dayOf(a), label: formatDate(dayOf(a)), text: String(e['summary']), significant: e['significant'] === true });
    else if (e.type === 'threadEscalated') {
      const t = selectThread(after, String(e['threadRef']));
      const lv = Number(e['level']);
      events.push({ day: after.clock.now.day, label: '', text: `"${t?.title ?? e['threadRef']}" ${lv === 3 ? 'is overdue' : lv === 2 ? 'reached its deadline' : 'is due soon'}`, significant: lv >= 2 });
    }
  }
  // Day labels for thread events come from the day logs' notices (the hook ran that night).
  for (const d of run.days) for (const n of d.notices) if (!n.startsWith('World:') && !events.some((x) => x.text === n)) events.push({ day: d.day, label: d.label, text: n, significant: false });
  for (const ev of events) if (!ev.label) ev.label = formatDate(ev.day);
  events.sort((x, y) => x.day - y.day);

  const counts = new Map<string, number>();
  for (const d of run.days) for (const n of new Set(d.notes)) counts.set(n, (counts.get(n) ?? 0) + 1);
  const adjustments = [...counts.entries()].map(([note, days]) => ({ note, days })).sort((a, b) => b.days - a.days);

  const breakthroughs = run.days.reduce((a, d) => a + d.sessions.filter((s) => s.outcome === 'breakthrough').length, 0);
  const willpowerXp = round(selectSkillXp(after, 'willpower') - selectSkillXp(before, 'willpower'), 1);
  const days = run.days.map((d: DayLog) => ({
    day: d.day,
    label: d.label,
    hours: round(d.hoursTrained, 1),
    trained: [...new Set(d.sessions.filter((s) => !s.refused).map((s) => SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId))],
    notes: d.recovery ? ['recovery day'] : d.trainingDay ? [] : ['rest day'],
    events: d.notices,
  }));
  const interrupted = run.interrupted ? { ...run.interrupted, label: formatDate(run.interrupted.day) } : null;
  return {
    level: opts.level,
    fromDay: before.clock.now.day,
    toDay: after.clock.now.day,
    fromLabel: formatDate(before.clock.now.day),
    toLabel: formatDate(after.clock.now.day),
    requestedDays: opts.requestedDays,
    // Calendar days that passed (the start day to the day the jump ended), not mornings planned (D-142).
    daysCompleted: after.clock.now.day - before.clock.now.day,
    trainingDays: run.days.filter((d) => d.trainingDay && !d.recovery).length,
    restDays: run.days.filter((d) => !d.trainingDay || d.recovery).length,
    hoursTrained: round(run.days.reduce((a, d) => a + d.hoursTrained, 0), 1),
    interrupted,
    skills,
    breakthroughs,
    willpowerXp,
    rust: { cleared, gained },
    injuries: [],
    relationships,
    events,
    adjustments,
    days,
  };
}
