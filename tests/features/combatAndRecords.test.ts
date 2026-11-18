// M4 step 2: fightResolved (combat-xp §1-2, tests 2 and 8: counters survive the fight and reset at the
// day hook, D-47), training records (progression-numbers §15, D-125) and self-study (D-126).
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { resolveTraining } from '../../src/features/progression/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const fresh = (path: 'jedi' | 'outsider' = 'jedi', startingXp: Record<string, number> = { soresu: xpForLevel(30) }): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: START, second: 7 * 3600 },
    character: { name: 'Kael', birthDay: START - 20 * 368, path, archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp,
    rank: 'knight',
  });
const fight = (n: number) => ({ type: 'fightResolved', stakes: 'serious', outcome: 'won', exchanges: Array.from({ length: n }, () => ({ skillId: 'soresu', gap: 0 })), forceUses: [] });

describe('fightResolved', () => {
  it('credits combat XP with the daily cap, keeps the counters after the fight and resets them at midnight', () => {
    const s0 = fresh();
    const r1 = applyEvents(REGISTRY, s0, [fight(34)], { source: 'engine' });
    expect(r1.rejected).toEqual([]);
    const gained = r1.state.progression.skills['soresu']!.xp - s0.progression.skills['soresu']!.xp;
    expect(gained).toBeGreaterThan(0);
    expect(r1.state.progression.combatXpToday['soresu']).toBeCloseTo(12, 6);
    expect(r1.state.progression.fightsToday['soresu']).toBe(1);
    // A second fight the same day earns nothing more for that skill (cap reached).
    const r2 = applyEvents(REGISTRY, r1.state, [fight(34)], { source: 'engine' });
    expect(r2.state.progression.skills['soresu']!.xp).toBeCloseTo(r1.state.progression.skills['soresu']!.xp, 9);
    const next = advanceTime(REGISTRY, r2.state, { seconds: 86_400, reason: 't', source: 'turnDraft' }).state;
    expect(next.progression.fightsToday).toEqual({});
    expect(next.progression.combatXpToday).toEqual({});
  });
  it('is engine-only and rejects unknown skills', () => {
    expect(applyEvents(REGISTRY, fresh(), [fight(3)], { source: 'ai' }).rejected).toHaveLength(1);
    const bad = { ...fight(1), exchanges: [{ skillId: 'saberDance', gap: 0 }] };
    expect(applyEvents(REGISTRY, fresh(), [bad], { source: 'engine' }).rejected[0]!.reason).toContain('unknown skill');
  });
});

describe('training records and self-study', () => {
  it('an archive record teaches a new form (opens the drill, transfer applies, x0.9 for a form)', () => {
    const plan = resolveTraining(fresh(), { activityId: 'ataruBasics', hours: 1, source: { kind: 'record', id: 'record:jediArchiveForms' } });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.card.instruction.mode).toBe('holocron');
    expect(plan.card.notes.some((n) => n.startsWith('fundamentals transfer'))).toBe(true);
    expect(plan.card.notes.some((n) => n.startsWith('self-study'))).toBe(false);
  });
  it('archive records are path-gated; records must cover the skill', () => {
    expect(resolveTraining(fresh('outsider'), { activityId: 'ataruBasics', hours: 1, source: { kind: 'record', id: 'record:jediArchiveForms' } }).ok).toBe(false);
    expect(resolveTraining(fresh(), { activityId: 'ataruBasics', hours: 1, source: { kind: 'record', id: 'record:jediArchiveLore' } }).ok).toBe(false);
    expect(resolveTraining(fresh('outsider'), { activityId: 'ataruBasics', hours: 1, source: { kind: 'record', id: 'holocron:formMaster' } }).ok).toBe(true);
  });
  it('self-study drills one rating lower than the same solo session of a taught form', () => {
    const s = fresh('jedi', { soresu: xpForLevel(30), ataru: xpForLevel(30) });
    const taughtSolo = resolveTraining(s, { activityId: 'ataruBasics', hours: 1, source: { kind: 'solo' } });
    const selfTaught = resolveTraining({ ...s, progression: { ...s.progression, selfTaught: ['ataru'] } }, { activityId: 'ataruBasics', hours: 1, source: { kind: 'solo' } });
    expect(taughtSolo.ok && selfTaught.ok).toBe(true);
    if (!taughtSolo.ok || !selfTaught.ok) return;
    expect(selfTaught.card.drillRating).toBeLessThan(taughtSolo.card.drillRating);
  });
  it('a taught session ends self-taught status', () => {
    const s = fresh('jedi', { soresu: xpForLevel(30), ataru: xpForLevel(20) });
    const st = { ...s, progression: { ...s.progression, selfTaught: ['ataru'] } };
    const plan = resolveTraining(st, { activityId: 'ataruBasics', hours: 1, source: { kind: 'instructor' } });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const after = applyEvents(REGISTRY, st, plan.events, { source: 'engine' }).state;
    expect(after.progression.selfTaught).toEqual([]);
  });
  it('Order stubs: instructors x1.05, an unnamed master x1.15, peers x1.00, solo x0.90', () => {
    const f = (kind: 'instructor' | 'master' | 'peers' | 'solo') => {
      const p = resolveTraining(fresh(), { activityId: 'soresuBasics', hours: 1, source: { kind } });
      return p.ok ? p.card.instruction.factor : NaN;
    };
    expect(f('instructor')).toBeCloseTo(1.05, 3);
    expect(f('master')).toBeCloseTo(1.15, 3);
    expect(f('peers')).toBeCloseTo(1.0, 3);
    expect(f('solo')).toBeCloseTo(0.9, 3);
  });
});
