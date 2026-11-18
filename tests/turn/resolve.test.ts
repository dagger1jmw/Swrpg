import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { historyMessages, resolvedBlock } from '../../src/turn/context';
import { expandChoice } from '../../src/turn/expandChoice';
import type { TurnRecord } from '../../src/turn/record';
import { DEFAULT_SLEEP_SECONDS, pacingForSpan, resolveTurn } from '../../src/turn/resolve';

const state = createInitialState<GameState>(REGISTRY, {
  campaignId: 'c',
  branchId: 'b',
  seed: 'resolve',
  start: { day: absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 }), second: 22 * 3600 },
  character: { name: 'Kael', birthDay: absDayFromDate({ year: TEST_YEAR - 14, month: 1, day: 2 }) },
});
const base = { targets: [], references: [], unknownNames: [] };

describe('resolve (architecture §4 step b)', () => {
  it('picks the pacing level from the span (D-72, extended in M4: montage to 120 days, time skip beyond)', () => {
    expect(pacingForSpan(60)).toEqual({ level: 'moment', seconds: 60 });
    expect(pacingForSpan(2)).toEqual({ level: 'moment', seconds: 5, clampedFrom: 2 });
    expect(pacingForSpan(3 * 3600)).toEqual({ level: 'scene', seconds: 3 * 3600 });
    expect(pacingForSpan(18 * 3600)).toEqual({ level: 'scene', seconds: 12 * 3600, clampedFrom: 18 * 3600 });
    expect(pacingForSpan(3 * 86_400)).toEqual({ level: 'montage', seconds: 3 * 86_400 });
    expect(pacingForSpan(200 * 86_400)).toEqual({ level: 'timeSkip', seconds: 200 * 86_400 });
    expect(pacingForSpan(30 * 86_400, 'timeSkip')).toEqual({ level: 'timeSkip', seconds: 30 * 86_400 });
    expect(pacingForSpan(2 * 86_400, 'timeSkip')).toEqual({ level: 'timeSkip', seconds: 7 * 86_400, clampedFrom: 2 * 86_400 });
    expect(pacingForSpan(20 * 368 * 86_400).level).toBe('timeSkip');
    expect(pacingForSpan(20 * 368 * 86_400).seconds).toBe(10 * 368 * 86_400);
  });

  it('sleep without a span advances 8 h, crossing midnight through the day hooks', () => {
    const { draft, state: after } = resolveTurn(REGISTRY, state, { ...base, actionType: 'sleep' });
    expect(draft.timeAdvanced?.seconds).toBe(DEFAULT_SLEEP_SECONDS);
    expect(after.clock.now).toEqual({ day: state.clock.now.day + 1, second: 6 * 3600 });
    expect(draft.notices).toEqual(['Kael turns 14.']);
    expect(draft.checks).toHaveLength(0);
  });

  it('no check for actions the engine does not roll; no time advance without a span', () => {
    const { draft, state: after } = resolveTurn(REGISTRY, state, { ...base, actionType: 'dialogue' });
    expect(draft.checks).toHaveLength(0);
    expect(draft.timeAdvanced).toBeNull();
    expect(after).toEqual(state);
  });

  it('a fight intent rolls no check (M5: fights are duels); with no opponent it starts nothing; clamps are reported for checks', () => {
    const { draft } = resolveTurn(REGISTRY, state, { ...base, actionType: 'fight', proposedDifficulty: 'trivial' });
    expect(draft.checks).toEqual([]);
    expect(draft.combat).toBeNull();
    expect(Object.isFrozen(draft)).toBe(true);
    const inv = resolveTurn(REGISTRY, state, { ...base, actionType: 'dialogue', targets: [], proposedDifficulty: 'extreme' }).draft;
    expect(inv.checks).toEqual([]);
  });

  it('the resolved block states each check outcome and the engine time', () => {
    const { draft } = resolveTurn(REGISTRY, state, { ...base, actionType: 'investigate', requestedSpan: { amount: 10, unit: 'minutes' } });
    const text = resolvedBlock(draft);
    expect(text).toContain(`DC 15`);
    expect(text).toContain(draft.checks[0]!.grade.toUpperCase());
    expect(text).toContain('Time already advanced by the engine: 10 minutes');
  });

  it('expands a compact choice intent; unknown target refs are dropped', () => {
    const { intent, notes } = expandChoice({ label: 'Talk', intent: { actionType: 'dialogue', targetRef: 'npc:ghost' }, pacingHint: 'scene' }, () => null);
    expect(intent).toMatchObject({ actionType: 'dialogue', targets: [], unknownNames: ['npc:ghost'], requestedPacing: 'scene' });
    expect(notes[0]).toMatch(/not a valid ID/);
  });
});

describe('context (D-74)', () => {
  const rec = (n: number, size: number): TurnRecord =>
    ({ input: { kind: 'typed', text: `action ${n}` }, narrative: 'x'.repeat(size) }) as unknown as TurnRecord;

  it('keeps the newest whole turns that fit the cap, oldest first, never split', () => {
    const records = [rec(1, 400), rec(2, 400), rec(3, 400)];
    const msgs = historyMessages(records, 230); // each pair costs about 104 tokens
    expect(msgs.map((m) => m.role)).toEqual(['user', 'model', 'user', 'model']);
    expect(msgs[0]?.text).toBe('PLAYER: action 2');
    expect(historyMessages(records, 50)).toEqual([]);
  });
});
