// M5 step 7: training-routines §6 automatic adjustments (test 7: an injury removes affected skills within the same day;
// the drill ceiling shifts hours to sparring) and their preview warnings (§5) and report entries.
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { planDay, type PlannedBlock, type Routine } from '../../src/features/routines/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { previewRoutine } from '../../src/state/routinePreview';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const knight = (E = 60): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'adj',
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - 30 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', secondFormId: 'ataru', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(50), ataru: xpForLevel(40), forceSense: xpForLevel(35), endurance: xpForLevel(40) },
    startingE: { soresu: { E, eSpar: 15 }, ataru: { E, eSpar: 15 } },
    rank: 'knight',
  });
const daily = (s: GameState): Routine => ({ ...s.routines.active, daysPerWeek: 7 });
const trains = (items: ReturnType<typeof planDay>['items']): PlannedBlock[] => items.filter((x): x is PlannedBlock => x.kind === 'train');
const wound = (part: string, severity: string) => ({ id: 'x', part, severity, W: severity === 'moderate' ? 12 : 25, stabilized: false, healProgress: 0, day: START, source: 'duel' });

describe('injury adjustments (training-routines §6, test 7)', () => {
  it('a moderate arm wound takes the forms and Strength out of the day it is taken; the note is logged', () => {
    const s0 = knight();
    expect(trains(planDay(s0, daily(s0), {}).items).some((b) => ['soresu', 'ataru'].includes(b.skillId))).toBe(true);
    const s = applyEvents(REGISTRY, s0, [{ type: 'healthSynced', vitalityLost: 0, addWounds: [wound('rightArm', 'moderate')], cause: 'duel' }], { source: 'engine' }).state;
    const plan = planDay(s, daily(s), {});
    expect(trains(plan.items).some((b) => ['soresu', 'ataru', 'shiiCho', 'strength'].includes(b.skillId))).toBe(false);
    expect(plan.notes.some((n) => /injury: .*rest until the wound heals/.test(n))).toBe(true);
  });
  it('a minor wound changes nothing; a lasting injury keeps training as adaptation training', () => {
    const s0 = knight();
    const minor = applyEvents(REGISTRY, s0, [{ type: 'healthSynced', vitalityLost: 0, addWounds: [wound('rightArm', 'minor')], cause: 'duel' }], { source: 'engine' }).state;
    expect(trains(planDay(minor, daily(minor), {}).items).some((b) => b.skillId === 'soresu')).toBe(true);
    const lasting = applyEvents(REGISTRY, s0, [{ type: 'lastingAdded', lasting: { id: 'l1', kind: 'lostHand', part: 'leftHand', adaptation: 0, aid: 'qualityCybernetic', adaptedToday: 0, adaptDay: -1, day: START } }], { source: 'engine' }).state;
    const plan = planDay(lasting, daily(lasting), {});
    expect(trains(plan.items).some((b) => b.skillId === 'soresu')).toBe(true);
    expect(plan.notes.some((n) => /adaptation training/.test(n))).toBe(true);
  });
});

describe('the drill ceiling (training-routines §6)', () => {
  it('a form at its ceiling shifts its fill hours to sparring with peers, logged and warned in the preview', () => {
    const s = knight(5);
    const plan = planDay(s, daily(s), {});
    const soresu = trains(plan.items).filter((b) => b.skillId === 'soresu');
    expect(soresu.length).toBeGreaterThan(0);
    expect(soresu.every((b) => b.activityId === 'sparring' || !b.fill)).toBe(true);
    expect(plan.notes.some((n) => /drill ceiling reached in Soresu/.test(n))).toBe(true);
    const preview = previewRoutine(REGISTRY, s, daily(s));
    expect(preview.warnings.some((w) => /drill ceiling/.test(w))).toBe(true);
  });
  it('below the ceiling nothing shifts', () => {
    const s = knight(60);
    expect(planDay(s, daily(s), {}).notes.some((n) => /drill ceiling/.test(n))).toBe(false);
  });
});
