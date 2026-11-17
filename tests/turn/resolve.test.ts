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
  start: { day: absDayFromDate({ year: -3661, month: 1, day: 1 }), second: 22 * 3600 },
  character: { name: 'Kael', birthDay: absDayFromDate({ year: -3675, month: 1, day: 2 }) },
});
const base = { targets: [], references: [], unknownNames: [] };

describe('resolve (architecture §4 step b)', () => {
  it('picks the pacing level from the span and clamps beyond 12 h until M4 (D-72)', () => {
    expect(pacingForSpan(60)).toEqual({ level: 'moment', seconds: 60 });
    expect(pacingForSpan(2)).toEqual({ level: 'moment', seconds: 5, clampedFrom: 2 });
    expect(pacingForSpan(3 * 3600)).toEqual({ level: 'scene', seconds: 3 * 3600 });
    expect(pacingForSpan(3 * 86_400)).toEqual({ level: 'scene', seconds: 12 * 3600, clampedFrom: 3 * 86_400 });
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

  it('fight resolves as one check with the stub note (D-70); clamps are reported', () => {
    const { draft } = resolveTurn(REGISTRY, state, { ...base, actionType: 'fight', proposedDifficulty: 'trivial' });
    expect(draft.checks[0]?.difficulty).toBe('easy');
    expect(draft.report).toContain('difficulty trivial clamped to easy for fight');
    expect(draft.checks[0]?.notes.some((n) => n.includes('until duels (M5)'))).toBe(true);
    expect(Object.isFrozen(draft)).toBe(true);
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
