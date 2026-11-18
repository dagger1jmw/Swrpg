// The routine day loop (M4; architecture §9-10, training-routines §6-9).
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { planDay } from '../../src/features/routines/selectors';
import { advanceByRoutine, nextWakeAbs } from '../../src/state/advanceRoutine';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const initiate = (seed = 's'): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed,
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - 8 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', secondFormId: 'ataru', trainingStartAge: 4, formPlan: { padawan: { soresu: 2, ataru: 1 }, knight: { soresu: 2, ataru: 1 } } },
    rank: 'initiate',
  });
const knight = (): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'k',
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - 25 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    rank: 'knight',
  });
const wakeAfter = (s: GameState, days: number) => nextWakeAbs(s.clock.now.day * 86_400 + s.clock.now.second, s.routines.active.wakeSecond) + (days - 1) * 86_400;

describe('advanceByRoutine', () => {
  it('runs whole days: Order requirements first, ends at the wake time, deterministic', () => {
    const s0 = initiate();
    const a = advanceByRoutine(REGISTRY, s0, { untilAbs: wakeAfter(s0, 15), reason: 'test' });
    const b = advanceByRoutine(REGISTRY, s0, { untilAbs: wakeAfter(s0, 15), reason: 'test' });
    expect(a.state).toEqual(b.state);
    expect(a.state.clock.now.second).toBe(s0.routines.active.wakeSecond);
    expect(a.days.length).toBe(14);
    const training = a.days.filter((d) => d.trainingDay);
    expect(training.length).toBe(12);
    for (const d of training) {
      const acts = d.sessions.map((x) => x.activityId);
      expect(acts).toContain('shiiChoBasics');
      expect(acts).toContain('forceLore');
      expect(d.hoursTrained).toBeGreaterThanOrEqual(4);
      expect(d.endF).toBeLessThan(1.1);
    }
    expect(a.state.progression.skills['shiiCho']!.xp).toBeGreaterThan(0);
    expect(a.rejected).toEqual([]);
  });

  it('a recovery day follows an overtraining streak of 2 (training-routines §6)', () => {
    const s0 = initiate();
    const s1 = { ...s0, routines: { ...s0.routines, active: { ...s0.routines.active, daysPerWeek: 7 } }, progression: { ...s0.progression, overtrainStreak: 2 } };
    const plan = planDay(s1, s1.routines.active, {});
    expect(plan.recovery).toBe(true);
    expect(plan.items).toEqual([]);
    expect(plan.notes.join(' ')).toContain('recovery day');
  });

  it('a player routine with priorities and a locked block is followed', () => {
    const s0 = knight();
    const routine = { ...s0.routines.active, daysPerWeek: 7, priorities: [{ skillId: 'agility', weight: 3 }, { skillId: 'forceSense', weight: 1 }], lockedBlocks: [{ activityId: 'willpowerMeditation', startSecond: 18 * 3600, hours: 1 }] };
    const s1 = applyEvents(REGISTRY, s0, [{ type: 'routineSet', routine }], { source: 'player' }).state;
    const r = advanceByRoutine(REGISTRY, s1, { untilAbs: wakeAfter(s1, 3), reason: 'test' });
    for (const d of r.days) {
      const acts = d.sessions.map((x) => x.activityId);
      expect(acts).toContain('willpowerMeditation');
      expect(acts).toContain('agilityFlexibility');
    }
  });
});
