// D-460 (Jared): the saber gate covers all of a Jedi Initiate's lightsaber training (free training included), and the
// Padawan specialty transfer: the main form's first session past Initiate starts it at max(its XP, 0.75 x Form I's XP),
// once in a life, outside the pace window.
import { windowSums } from '../../src/engine/paceStore';
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { FORM_TRANSFER_SHARE } from '../../src/data/progression.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { resolveTraining } from '../../src/features/progression/selectors';
import { planDay } from '../../src/features/routines/scheduler';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const make = (rank: string, age: number, startingXp: Record<string, number>): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'specialty',
    start: { day: START, second: 8 * 3600 },
    character: { name: 'Kael', birthDay: START - age * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp,
    rank,
  });
const apply = (s: GameState, events: readonly Record<string, unknown>[]): GameState => {
  const r = applyEvents(REGISTRY, s, events as never, { source: 'engine' });
  expect(r.rejected).toEqual([]);
  return r.state;
};
const train = (s: GameState, activityId: string): { state: GameState; event: Record<string, unknown>; notes: string[] } => {
  const plan = resolveTraining(s, { activityId, hours: 1, source: { kind: 'master' } });
  if (!plan.ok) throw new Error(plan.reason);
  return { state: apply({ ...s, meta: { ...s.meta, rngState: plan.rng } }, plan.events), event: plan.events[0] as Record<string, unknown>, notes: plan.card.notes };
};

describe('the saber gate covers free training (D-460)', () => {
  it('a pre-gate Jedi Initiate cannot train a form, even alone; past the gate it can', () => {
    const pre = make('initiate', 5, { forceControl: xpForLevel(5) });
    const r = resolveTraining(pre, { activityId: 'shiiChoBasics', hours: 1, source: { kind: 'solo' } });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toContain('saber classes are not open');
    const past = make('initiate', 6, { forceControl: xpForLevel(20), forceKnowledge: xpForLevel(10) });
    // (Shii-Cho below 15 needs a teacher, D-173.)
    expect(resolveTraining(past, { activityId: 'shiiChoBasics', hours: 1, source: { kind: 'instructor' } }).ok).toBe(true);
    expect(resolveTraining(pre, { activityId: 'shiiChoBasics', hours: 1, source: { kind: 'instructor' } }).ok).toBe(false);
  });
  it('the scheduler sends a pre-gate Initiate\'s free form hours to the pre-gate blocks', () => {
    const pre = make('initiate', 5, { forceControl: xpForLevel(5) });
    const routine = { effort: 'push', daysPerWeek: 7, sleepHours: 8, lockedBlocks: [], priorities: [{ skillId: 'shiiCho', weight: 1 }] } as never;
    const plan = planDay(pre, routine, {});
    const trained = plan.items.filter((b) => b.kind === 'train').map((b) => (b as { skillId: string }).skillId);
    expect(trained.some((id) => ['shiiCho', 'makashi', 'soresu', 'ataru', 'shien', 'djemSo', 'niman'].includes(id))).toBe(false);
    expect(plan.notes.some((n) => n.includes('saber gate not yet passed'))).toBe(true);
  });
});

describe('the Padawan specialty transfer (D-460)', () => {
  const ini = { shiiCho: xpForLevel(28), soresu: xpForLevel(18), forceControl: xpForLevel(20), forceKnowledge: xpForLevel(10) };
  it('the main form\'s first session as a Padawan lifts it to 0.75 x Form I, once, outside the pace window', () => {
    let s = make('initiate', 12, ini);
    expect(s.progression.specialtyTransfer ?? null).toBeNull();
    // Not as an Initiate.
    expect(train(s, 'soresuBasics').event['specialty']).toBeUndefined();
    s = apply(s, [{ type: 'rankSet', rank: 'padawan' }]);
    const formI = s.progression.skills['shiiCho']!.xp;
    const before = s.progression.skills['soresu']!.xp;
    // Another form first: no specialty transfer.
    expect(train(s, 'shiiChoBasics').event['specialty']).toBeUndefined();
    const first = train(s, 'soresuBasics');
    const sp = first.event['specialty'] as { form: string; xp: number };
    expect(sp.form).toBe('soresu');
    expect(sp.xp).toBeCloseTo(FORM_TRANSFER_SHARE * formI - before, 6);
    const credited = (first.event['credited'] as Record<string, number>)['soresu']!;
    expect(first.state.progression.skills['soresu']!.xp).toBeCloseTo(before + sp.xp + credited, 6);
    expect(windowSums(first.state.progression.paceWindow['soresu'], first.state.clock.now.day).xp).toBeCloseTo(credited, 3); // kept to 0.001 (opt-1 F)
    expect(first.state.progression.specialtyTransfer).toBe('soresu');
    expect(first.notes.some((n) => n.includes('specialty transfer'))).toBe(true);
    // Once in a life.
    expect(train(first.state, 'soresuBasics').event['specialty']).toBeUndefined();
  });
  it('a main form already above 0.75 x Form I keeps its XP (the transfer is used up at 0)', () => {
    let s = make('initiate', 12, { ...ini, soresu: xpForLevel(27) });
    s = apply(s, [{ type: 'rankSet', rank: 'padawan' }]);
    const first = train(s, 'soresuBasics');
    expect((first.event['specialty'] as { xp: number }).xp).toBe(0);
    expect(first.state.progression.specialtyTransfer).toBe('soresu');
  });
  it('a character created past Initiate already holds it (the closed form), and the engine refuses a second one', () => {
    const s = make('padawan', 14, ini);
    expect(s.progression.specialtyTransfer).toBe('creation');
    expect(train(s, 'soresuBasics').event['specialty']).toBeUndefined();
    const r = applyEvents(REGISTRY, s, [{ ...(train(make('initiate', 12, ini), 'shiiChoBasics').event as object), specialty: { form: 'soresu', xp: 1 } }] as never, { source: 'engine' });
    expect(r.rejected.length).toBe(1);
  });
});
