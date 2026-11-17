// training-routines.md §9 required tests (the scheduler, M4), the routine events, and the preview (§5).
import { describe, expect, it } from 'vitest';
import { ACTIVITY_BY_ID } from '../../src/data/activities';
import { TIREDNESS_LIMIT, Y_AVG } from '../../src/data/progression.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { interp } from '../../src/engine/interp';
import { planDay, type PlannedBlock, type Routine } from '../../src/features/routines/selectors';
import { advanceByRoutine } from '../../src/state/advanceRoutine';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { previewRoutine } from '../../src/state/routinePreview';

const START = absDayFromDate({ year: -3661, month: 1, day: 1 });
const knight = (age = 25): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'r',
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - age * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', secondFormId: 'ataru', trainingStartAge: 4 },
    rank: 'knight',
  });
const daily = (s: GameState, extra: Partial<Routine> = {}): Routine => ({ ...s.routines.active, daysPerWeek: 7, ...extra });
const trains = (items: ReturnType<typeof planDay>['items']): PlannedBlock[] => items.filter((x): x is PlannedBlock => x.kind === 'train');
const physical = (b: PlannedBlock) => ACTIVITY_BY_ID.get(b.activityId)!.load.p >= 0.8;
const PRIOS: Routine['priorities'] = [
  { skillId: 'soresu', weight: 3 },
  { skillId: 'forceSense', weight: 2 },
  { skillId: 'endurance', weight: 1 },
  { skillId: 'forceKnowledge', weight: 1 },
];

describe('scheduler (training-routines §9)', () => {
  it('test 1: the same inputs give the identical schedule', () => {
    const s = knight();
    expect(planDay(s, daily(s, { priorities: PRIOS }), {})).toEqual(planDay(s, daily(s, { priorities: PRIOS }), {}));
  });

  it('test 2: hours per priority match the weights within 0.5 h (over the carried rounding)', () => {
    const s = knight();
    const r = daily(s, { priorities: PRIOS, effort: 'easy' });
    let credit: Record<string, number> = {};
    const hours: Record<string, number> = {};
    let total = 0;
    const DAYS = 20;
    for (let d = 0; d < DAYS; d++) {
      const p = planDay(s, r, credit);
      credit = p.fillCredit;
      for (const b of trains(p.items)) if (b.fill) hours[b.skillId] = (hours[b.skillId] ?? 0) + b.planned;
      total += p.budget;
    }
    // planned (pre-trim) fill hours per day per priority vs budget * weight / total weight
    const perDay = (k: string) => (hours[k] ?? 0) / DAYS;
    for (const p of PRIOS!) expect(Math.abs(perDay(p.skillId) - (total / DAYS) * (p.weight / 7)), p.skillId).toBeLessThanOrEqual(0.5);
  });

  it('test 3: no session is longer than 2 h unless locked', () => {
    const s = knight();
    const p = planDay(s, daily(s, { priorities: [{ skillId: 'soresu', weight: 3 }], lockedBlocks: [{ activityId: 'willpowerMeditation', startSecond: 19 * 3600, hours: 3 }] }), {});
    for (const b of trains(p.items)) if (!b.locked) expect(b.hours).toBeLessThanOrEqual(2);
    expect(trains(p.items).some((b) => b.locked && b.hours === 3)).toBe(true);
  });

  it('test 4: a mental block follows a physical block whenever both exist that day', () => {
    const s = knight();
    const p = planDay(s, daily(s, { priorities: PRIOS }), {});
    const seq = trains(p.items);
    const firstPhys = seq.findIndex(physical);
    expect(firstPhys).toBeGreaterThanOrEqual(0);
    const next = p.items[p.items.indexOf(seq[firstPhys]!) + 1];
    expect(next && next.kind === 'train' && !physical(next)).toBe(true);
  });

  it('test 5: the projected day-end tiredness never passes the effort limit unless the player locked it', () => {
    const s = knight();
    for (const effort of ['easy', 'standard', 'push'] as const) {
      const p = planDay(s, daily(s, { priorities: PRIOS, effort }), {});
      expect(p.projectedEndF).toBeLessThanOrEqual(TIREDNESS_LIMIT[effort] + 1e-9);
    }
    const locked = planDay(s, daily(s, { effort: 'easy', lockedBlocks: [{ activityId: 'cardio', startSecond: 7 * 3600, hours: 8 }] }), {});
    expect(locked.projectedEndF).toBeGreaterThan(TIREDNESS_LIMIT.easy);
    expect(locked.notes.join(' ')).toMatch(/over the easy limit/);
  });

  it('test 6: locked blocks are never moved', () => {
    const s = knight();
    const lb = { activityId: 'basicCentering', startSecond: 13 * 3600, hours: 1 };
    const p = planDay(s, daily(s, { priorities: PRIOS, lockedBlocks: [lb] }), {});
    const l = trains(p.items).find((b) => b.locked)!;
    expect(l.startSecond).toBe(13 * 3600);
    for (const b of p.items) if (b !== l) expect(b.startSecond + b.hours * 3600 <= l.startSecond || b.startSecond >= l.startSecond + 3600).toBe(true);
  });

  it('test 7: injuries remove affected skills (arrives with wounds in M5): the plan has no injury input yet', () => {
    expect(planDay(knight(), daily(knight()), {}).notes.join(' ')).not.toMatch(/injur/);
  });

  it('test 9: days skipped in normal play use the current routine', () => {
    const s0 = knight();
    const s = applyEvents(REGISTRY, s0, [{ type: 'routineSet', routine: daily(s0, { priorities: [{ skillId: 'charisma', weight: 3 }] }) }], { source: 'player' }).state;
    const r = advanceByRoutine(REGISTRY, s, { untilAbs: (s.clock.now.day + 3) * 86_400 + s.routines.active.wakeSecond, reason: 'skip' });
    expect(r.days.every((d) => d.sessions.some((x) => x.skillId === 'charisma'))).toBe(true);
  });

  it('test 10: 90 days of the standard routine for the Average profile match the yearly rate within +/-10%', () => {
    // The Average Knight (age 25) on the default template, 300 of 368 days; Y_avg is its main-form XP a year.
    const s0 = knight(25);
    const s = applyEvents(REGISTRY, s0, [{ type: 'routineSet', routine: { ...s0.routines.active, daysPerWeek: (7 * 300) / 368 } }], { source: 'player' }).state;
    const r = advanceByRoutine(REGISTRY, s, { untilAbs: (s.clock.now.day + 90) * 86_400 + s.routines.active.wakeSecond, reason: 'montage', jump: false });
    const gained = (r.state.progression.skills['soresu']?.xp ?? 0) - (s.progression.skills['soresu']?.xp ?? 0);
    const expected = (interp(Y_AVG, 25) * 90) / 368;
    expect(Math.abs(gained / expected - 1), `${gained.toFixed(1)} vs ${expected.toFixed(1)}`).toBeLessThanOrEqual(0.1);
  });
});

describe('routine events', () => {
  it('rejects unknown skills and activities (no nearby fallback)', () => {
    const s = knight();
    expect(applyEvents(REGISTRY, s, [{ type: 'routineSet', routine: daily(s, { priorities: [{ skillId: 'sabering', weight: 2 }] }) }], { source: 'player' }).rejected).toHaveLength(1);
    expect(applyEvents(REGISTRY, s, [{ type: 'routineSet', routine: daily(s, { lockedBlocks: [{ activityId: 'saberDance', startSecond: 0, hours: 1 }] }) }], { source: 'player' }).rejected).toHaveLength(1);
  });

  it('templates save, load and delete; the AI suggestion applies only when the player accepts', () => {
    let s = knight();
    s = applyEvents(REGISTRY, s, [{ type: 'routineSet', routine: daily(s, { effort: 'push' }) }, { type: 'routineTemplateSaved', name: 'Hard week' }], { source: 'player' }).state;
    const id = s.routines.templates[0]!.id;
    s = applyEvents(REGISTRY, s, [{ type: 'routineSet', routine: daily(s, { effort: 'easy' }) }, { type: 'routineTemplateLoaded', templateId: id }], { source: 'player' }).state;
    expect(s.routines.active.effort).toBe('push');
    const sug = applyEvents(REGISTRY, s, [{ type: 'routineRequested', priorities: [{ skillId: 'forceSense', weight: 'focus' }], effort: 'standard', spanHint: 'until the trials' }], { source: 'ai' });
    expect(sug.rejected).toEqual([]);
    expect(sug.state.routines.active.effort).toBe('push');
    const accepted = applyEvents(REGISTRY, sug.state, [{ type: 'routineSuggestionResolved', accept: true }], { source: 'player' }).state;
    expect(accepted.routines.active.priorities).toEqual([{ skillId: 'forceSense', weight: 3 }]);
    expect(accepted.routines.suggested).toBeNull();
    s = applyEvents(REGISTRY, accepted, [{ type: 'routineTemplateDeleted', templateId: id }], { source: 'player' }).state;
    expect(s.routines.templates).toEqual([]);
  });
});

describe('preview (training-routines §5)', () => {
  it('shows the typical day, weekly XP and warnings, and changes nothing', () => {
    const s = knight();
    const p = previewRoutine(REGISTRY, s, daily(s, { priorities: PRIOS }));
    expect(p.ok).toBe(true);
    expect(p.typicalDay.length).toBeGreaterThan(0);
    expect(p.weeklyXp.find((x) => x.skillId === 'soresu')!.xp).toBeGreaterThan(0);
    expect(p.curve.length).toBeGreaterThan(1);
    expect(s.routines.active).toEqual(knight().routines.active);
  });

  it('warns about overtraining with a locked block past the limit, and about skills starting to rust', () => {
    const s0 = knight();
    const s = { ...s0, progression: { ...s0.progression, skills: { ...s0.progression.skills, makashi: { xp: 500, rust: 0, lastPracticedDay: START - 40 } } } };
    const p = previewRoutine(REGISTRY, s, daily(s, { effort: 'push', lockedBlocks: [{ activityId: 'cardio', startSecond: 7 * 3600, hours: 10 }] }));
    expect(p.warnings.join(' ')).toMatch(/Overtraining risk/);
    expect(p.warnings.join(' ')).toMatch(/rust.*Makashi/);
  });
});
