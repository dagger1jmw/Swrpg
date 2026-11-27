// Fundamentals transfer at run time (D-119): a lightsaber form's first session as the primary starts it
// at 0.75 x the highest form's XP, once per form, outside the 4.0x clamp; never for Force abilities.
import { windowSums } from '../../src/engine/paceStore';
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { FORM_TRANSFER_SHARE } from '../../src/data/progression.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { resolveTraining } from '../../src/features/progression/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const padawan = (): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'transfer',
    start: { day: START, second: 8 * 3600 },
    character: { name: 'Kael', birthDay: START - 14 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', secondFormId: 'ataru', trainingStartAge: 4 },
    startingXp: { shiiCho: xpForLevel(30), soresu: xpForLevel(25), ataru: xpForLevel(20), forceControl: xpForLevel(20) },
    rank: 'padawan',
  });

function train(s: GameState, activityId: string, extra: Record<string, unknown> = {}) {
  const plan = resolveTraining(s, { activityId, hours: 1, teacherId: 'npc:master', ...extra });
  if (!plan.ok) throw new Error(plan.reason);
  const r = applyEvents(REGISTRY, { ...s, meta: { ...s.meta, rngState: plan.rng } }, plan.events, { source: 'engine' });
  expect(r.rejected).toEqual([]);
  return { state: r.state, plan, event: plan.events[0] as Record<string, unknown> };
}

describe('fundamentals transfer at run time (D-119)', () => {
  it('a new form (Makashi, with a teacher) starts at 0.75 x the highest form, once, outside the pace window', () => {
    const s0 = padawan();
    expect(s0.progression.formsStarted.sort()).toEqual(['ataru', 'shiiCho', 'soresu']);
    const highest = s0.progression.skills['shiiCho']!.xp;
    const first = train(s0, 'makashiBasics');
    const transfer = (first.event['transfer'] as Record<string, number>)['makashi']!;
    expect(transfer).toBeCloseTo(FORM_TRANSFER_SHARE * highest, 6);
    const credited = (first.event['credited'] as Record<string, number>)['makashi']!;
    expect(first.state.progression.skills['makashi']!.xp).toBeCloseTo(transfer + credited, 6);
    expect(first.state.progression.formsStarted).toContain('makashi');
    // The pace window holds only the session's credited XP, not the transfer.
    expect(windowSums(first.state.progression.paceWindow['makashi'], first.state.clock.now.day).xp).toBeCloseTo(credited, 3); // kept to 0.001 (opt-1 F)
    expect(first.plan.ok && first.plan.card.notes.some((n) => n.includes('fundamentals transfer'))).toBe(true);

    const second = train(first.state, 'makashiBasics');
    expect(second.event['transfer']).toBeUndefined();
  });

  it('forms already started and Force abilities never get a transfer', () => {
    const s0 = padawan();
    expect(train(s0, 'ataruBasics').event['transfer']).toBeUndefined();
    expect(train(s0, 'forceControlDrill').event['transfer']).toBeUndefined();
    // The engine refuses a transfer to a Force ability or to a started form.
    const bad = applyEvents(
      REGISTRY,
      s0,
      [{ type: 'activityResolved', activityId: 'x', primaries: ['telekinesis'], hours: 1, windowHours: {}, credited: {}, practiceHours: {}, transfer: { telekinesis: 100 }, fatigueWillpower: 0, meditation: false, day: { hoursByActivity: {}, postWindow: 0, lastPhysicalHeavy: false } }],
      { source: 'engine' },
    );
    expect(bad.rejected[0]?.reason).toMatch(/lightsaber forms only/);
  });

  it('dropping Shii-Cho never removes XP; it only rusts', () => {
    let s = padawan();
    const xp = s.progression.skills['shiiCho']!.xp;
    for (let i = 0; i < 6; i++) {
      s = train(s, 'soresuBasics').state;
      s = advanceTime(REGISTRY, s, { seconds: 30 * 86_400, reason: 'month', source: 'turnDraft' }).state;
    }
    expect(s.progression.skills['shiiCho']!.xp).toBeGreaterThanOrEqual(xp);
    expect(s.progression.skills['shiiCho']!.rust).toBeGreaterThan(0);
  });
});

describe('Shii-Cho gets the transfer like any other form (D-173)', () => {
  it('a Knight who never trained Shii-Cho can start it with peers: the teacher gate reads the level after the transfer', () => {
    const s0 = createInitialState<GameState>(REGISTRY, {
      campaignId: 'c',
      branchId: 'b',
      seed: 'shii',
      start: { day: START, second: 8 * 3600 },
      character: { name: 'Vex', birthDay: START - 40 * 368, path: 'sith', archetype: 'sithWarrior', mainFormId: 'juyo', trainingStartAge: 17 },
      startingXp: { juyo: xpForLevel(90) },
      rank: 'lord',
    });
    expect(s0.progression.formsStarted).not.toContain('shiiCho');
    const plan = resolveTraining(s0, { activityId: 'shiiChoBasics', hours: 1, source: { kind: 'peers' } });
    expect(plan.ok, plan.ok ? '' : plan.reason).toBe(true);
    const transfer = ((plan.ok ? plan.events[0] : {}) as Record<string, unknown>)['transfer'] as Record<string, number>;
    expect(transfer['shiiCho']).toBeCloseTo(FORM_TRANSFER_SHARE * xpForLevel(90), 6);
    // Without a teacher and without a transfer to lift it (a fresh student), Shii-Cho basics stays gated.
    const fresh = createInitialState<GameState>(REGISTRY, {
      campaignId: 'c',
      branchId: 'b',
      seed: 'shii2',
      start: { day: START, second: 8 * 3600 },
      character: { name: 'Kid', birthDay: START - 6 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'shiiCho', trainingStartAge: 4 },
      rank: 'initiate',
    });
    const gated = resolveTraining(fresh, { activityId: 'shiiChoBasics', hours: 1, source: { kind: 'peers' } });
    expect(gated.ok).toBe(false);
  });
});
