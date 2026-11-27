// Jumps (M4): thread deadlines and escalation (D-135), weighted world events and interruptions (D-136),
// relationship drift and shared training (D-137), the montage report (training-routines §8, test 8),
// a birthday during a skip and the interruption state (architecture §10 required tests).
import { quietDuty } from '../support/duty';
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { WORLD_EVENT_CHANCE } from '../../src/data/worldEvents.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { seedRng } from '../../src/engine/rng';
import { rollWorldEvent } from '../../src/features/world';
import { advanceByRoutine, nextWakeAbs } from '../../src/state/advanceRoutine';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { buildMontageReport } from '../../src/state/montageReport';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
// Duty's mission roll is kept quiet here (opt-2 D): these tests are about the other things a skip meets.
const knight = (seed = 'j', birthOffsetDays = 0): GameState =>
  quietDuty(createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed,
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - 25 * 368 + birthOffsetDays, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', secondFormId: 'ataru', trainingStartAge: 4 },
    rank: 'knight',
  }));
const ai = (s: GameState, events: unknown[]) => {
  const r = applyEvents(REGISTRY, s, events, { source: 'ai' });
  expect(r.rejected).toEqual([]);
  return r;
};
const wakeAfter = (s: GameState, days: number) => nextWakeAbs(s.clock.now.day * 86_400 + s.clock.now.second, s.routines.active.wakeSecond) + (days - 1) * 86_400;
const withPartner = (s: GameState): { s: GameState; npc: string } => {
  const r = ai(s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Bela Tarn', species: 'human', faction: 'jediOrder', role: 'jediKnight', ageApprox: 26, description: 'A fellow Knight.' }]);
  const npc = r.tempMap['tmp:1']!;
  const routine = { ...r.state.routines.active, daysPerWeek: 7, priorities: [{ skillId: 'soresu', weight: 3, source: { kind: 'partner' as const, id: npc } }, { skillId: 'forceSense', weight: 1 }] };
  return { s: applyEvents(REGISTRY, r.state, [{ type: 'routineSet', routine }], { source: 'player' }).state, npc };
};

describe('thread deadlines (D-135)', () => {
  it('escalate 1 within 7 days, 2 on the deadline (interrupting the jump), 3 when 3 days overdue', () => {
    const s0 = ai(knight(), [{ type: 'threadOpened', key: 'tmp:t', title: 'The envoy', stakes: 'peace', deadlineHint: 'weeks', entityRefs: [] }]).state;
    const id = Object.keys(s0.threads.byId)[0]!;
    const deadline = s0.threads.byId[id]!.deadlineDay!;
    const r = advanceByRoutine(REGISTRY, s0, { untilAbs: wakeAfter(s0, 60), reason: 'test' });
    expect(r.interrupted?.reason).toContain('has reached its deadline');
    expect(r.interrupted?.day).toBe(deadline);
    expect(r.state.clock.now.day).toBe(deadline);
    expect(r.state.clock.now.second).toBe(s0.routines.active.wakeSecond);
    expect(r.state.threads.byId[id]!.escalation).toBe(2);
    // Resuming: 3 days overdue is the next stop; the thread is never failed by code.
    const r2 = advanceByRoutine(REGISTRY, r.state, { untilAbs: wakeAfter(r.state, 30), reason: 'test' });
    expect(r2.interrupted?.reason).toContain('overdue');
    expect(r2.state.threads.byId[id]!.escalation).toBe(3);
    expect(r2.state.threads.byId[id]!.status).toBe('open');
  });

  it('the interrupted state equals a run straight to that day', () => {
    const s0 = ai(knight(), [{ type: 'threadOpened', key: 'tmp:t', title: 'The envoy', stakes: 'peace', deadlineHint: 'weeks', entityRefs: [] }]).state;
    const r = advanceByRoutine(REGISTRY, s0, { untilAbs: wakeAfter(s0, 60), reason: 'test' });
    const direct = advanceByRoutine(REGISTRY, s0, { untilAbs: r.state.clock.now.day * 86_400 + r.state.clock.now.second, reason: 'test' });
    expect(direct.state.progression).toEqual(r.state.progression);
    expect(direct.state.clock.now).toEqual(r.state.clock.now);
  });

  it('a story-turn span crossing the deadline is not stopped', () => {
    const s0 = ai(knight(), [{ type: 'threadOpened', key: 'tmp:t', title: 'The envoy', stakes: 'peace', deadlineHint: 'today', entityRefs: [] }]).state;
    const id = Object.keys(s0.threads.byId)[0]!;
    const r = advanceTime(REGISTRY, s0, { seconds: 20 * 3600, reason: 'a long day', source: 'turnDraft' });
    expect(r.interrupted).toBeUndefined();
    expect(r.secondsAdvanced).toBe(20 * 3600);
    expect(r.state.threads.byId[id]!.escalation).toBe(2);
  });
});

describe('world events (D-136)', () => {
  it('roll at the configured rates (seeded, 20,000 days)', () => {
    const s = withPartner(knight()).s;
    let rng = seedRng('rates');
    let sig = 0;
    let minor = 0;
    const N = 20_000;
    for (let d = 0; d < N; d++) {
      const r = rollWorldEvent(s, rng, START + d);
      rng = r.rng;
      if (r.event?.significant) sig += 1;
      else if (r.event) minor += 1;
    }
    expect(sig / N).toBeCloseTo(WORLD_EVENT_CHANCE.significant, 2);
    expect(Math.abs(minor / N - WORLD_EVENT_CHANCE.minor)).toBeLessThan(0.01);
  });

  it('about 45% of 90-day montages stop early on a significant event (Jared, D-123)', () => {
    const p = 1 - Math.pow(1 - WORLD_EVENT_CHANCE.significant, 90);
    expect(p).toBeGreaterThan(0.44);
    expect(p).toBeLessThan(0.46);
  });

  it('a significant event stops the jump in the morning; minor ones are logged and the jump goes on', () => {
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      const s0 = knight(`w${i}`);
      const r = advanceByRoutine(REGISTRY, s0, { untilAbs: wakeAfter(s0, 120), reason: 'test' });
      if (!r.interrupted) continue;
      found = true;
      const last = r.state.world.log.at(-1)!;
      expect(last.significant).toBe(true);
      expect(r.interrupted.reason).toBe(last.summary);
      expect(r.state.clock.now.second).toBe(s0.routines.active.wakeSecond);
      expect(r.state.world.log.slice(0, -1).every((e) => !e.significant)).toBe(true);
    }
    expect(found).toBe(true);
  });

  it('no world events in story turns', () => {
    const r = advanceTime(REGISTRY, knight(), { seconds: 30 * 86_400, reason: 'x', source: 'turnDraft' });
    expect(r.state.world.log).toEqual([]);
  });
});

describe('relationships during jumps (D-137)', () => {
  it('a training partner grows closer through shared sessions', () => {
    const { s, npc } = withPartner(knight());
    const r = advanceByRoutine(REGISTRY, s, { untilAbs: wakeAfter(s, 10), reason: 'test' });
    expect(r.state.relationships.byNpcId[npc]!.value).toBeGreaterThan(0);
  });

  it('without contact a relationship drifts toward the neutral band, one point a month, never past it', () => {
    const s0 = knight();
    const r = ai(s0, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Bela Tarn', species: 'human', faction: 'jediOrder', role: 'jediKnight', ageApprox: 26, description: 'x' }]);
    const npc = r.tempMap['tmp:1']!;
    let s = ai(r.state, [{ type: 'relationshipChanged', npcRef: npc, delta: 3, reason: 'saved me' }]).state;
    s = { ...s, relationships: { byNpcId: { [npc]: { ...s.relationships.byNpcId[npc]!, value: 23 } } } };
    const out = advanceByRoutine(REGISTRY, s, { untilAbs: wakeAfter(s, 200), reason: 'test' }).state;
    expect(out.relationships.byNpcId[npc]!.value).toBe(20);
  });
});

describe('the montage report (training-routines §8, test 8)', () => {
  it('a 90-day montage produces story events and a complete report', () => {
    const { s, npc } = withPartner(knight('report'));
    const run = advanceByRoutine(REGISTRY, s, { untilAbs: wakeAfter(s, 91), reason: 'montage' });
    const rep = buildMontageReport(s, run, { level: 'montage', requestedDays: 91 });
    expect(rep.daysCompleted).toBeGreaterThan(0);
    // Started at 09:00: 91 calendar days pass and the routine plans 90 mornings (D-142).
    expect(rep.trainingDays + rep.restDays).toBe(rep.days.length);
    expect(rep.skills.find((x) => x.skillId === 'soresu')!.xp).toBeGreaterThan(0);
    expect(rep.relationships.find((x) => x.npcId === npc)!.to).toBeGreaterThan(0);
    expect(rep.days).toHaveLength(rep.daysCompleted - 1);
    expect(rep.hoursTrained).toBeGreaterThan(0);
    if (run.interrupted) expect(rep.interrupted?.reason).toBe(run.interrupted.reason);
    else expect(rep.daysCompleted).toBe(91);
  });

  it('a birthday during a skip appears as a notice in the report (age is derived)', () => {
    const s = knight('bday', 2);
    const run = advanceByRoutine(REGISTRY, s, { untilAbs: wakeAfter(s, 30), reason: 'skip' });
    const rep = buildMontageReport(s, run, { level: 'timeSkip', requestedDays: 30 });
    expect(rep.events.some((e) => /birthday|turns/i.test(e.text))).toBe(true);
  });
});
