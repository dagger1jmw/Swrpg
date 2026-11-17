import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { absDayFromDate, dateFromAbsDay, SECONDS_PER_DAY } from '../../src/engine/calendar';
import { clockFeature } from '../../src/features/clock';
import { selectAge } from '../../src/features/character/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { HOOK_ORDER, REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { BaseState, FeatureModule, InitCtx, TimeStep } from '../../src/state/types';

const START = absDayFromDate({ year: -3661, month: 1, day: 1 });
const ctx = (over: Partial<InitCtx> = {}): InitCtx => ({
  campaignId: 'c1',
  branchId: 'b1',
  seed: 'seed',
  start: { day: START, second: 7 * 3600 },
  character: { name: 'Kael', birthDay: absDayFromDate({ year: -3675, month: 2, day: 10 }) },
  ...over,
});
const game = (over?: Partial<InitCtx>): GameState => createInitialState<GameState>(REGISTRY, ctx(over));
const adv = (seconds: number) => ({ seconds, reason: 'test', source: 'turnDraft' as const });

// A recorder feature: counts steps; optional interruption on a given absolute day.
interface Rec {
  days: number;
  sub: number;
  seconds: number;
  endedDays: number[];
}
function recorder(id: string, log: string[], interruptOnDay?: number): FeatureModule<Rec, BaseState> {
  return {
    id,
    version: 1,
    initialState: () => ({ days: 0, sub: 0, seconds: 0, endedDays: [] }),
    stateSchema: z.object({ days: z.number(), sub: z.number(), seconds: z.number(), endedDays: z.array(z.number()) }),
    events: {},
    onTimeAdvanced: (s, step: TimeStep) => {
      log.push(id);
      const endedDay = Math.floor(step.fromAbs / SECONDS_PER_DAY);
      const next: Rec = {
        days: s.days + (step.kind === 'day' ? 1 : 0),
        sub: s.sub + (step.kind === 'subDay' ? 1 : 0),
        seconds: s.seconds + step.seconds,
        endedDays: step.endsDay ? [...s.endedDays, endedDay] : s.endedDays,
      };
      return step.endsDay && endedDay === interruptOnDay ? { slice: next, interrupt: 'ambush' } : { slice: next };
    },
    selectors: {},
  };
}

describe('advanceTime (architecture §9, §10)', () => {
  it('a multi-month skip covers every second once and runs one day step per whole day', () => {
    const log: string[] = [];
    const reg = [clockFeature, recorder('rec', log)] as unknown as readonly FeatureModule<unknown, BaseState>[];
    const s0 = createInitialState<BaseState>(reg, ctx());
    const span = 100 * SECONDS_PER_DAY; // starts at 07:00, so 99 whole days + two partial days
    const r = advanceTime(reg, s0, adv(span));
    const rec = r.state['rec'] as Rec;
    expect(rec.seconds).toBe(span);
    expect(rec.days).toBe(99);
    expect(rec.sub).toBe(2);
    expect(rec.endedDays).toHaveLength(100);
    expect(r.secondsAdvanced).toBe(span);
    const clock = r.state['clock'] as GameState['clock'];
    expect(clock.now).toEqual({ day: START + 100, second: 7 * 3600 });
    expect(dateFromAbsDay(clock.now.day)).toEqual({ year: -3661, month: 4, day: 8 });
  });

  it('a midnight crossing splits the step and ends the day once', () => {
    const log: string[] = [];
    const reg = [clockFeature, recorder('rec', log)] as unknown as readonly FeatureModule<unknown, BaseState>[];
    const s0 = createInitialState<BaseState>(reg, ctx({ start: { day: START, second: 22 * 3600 } }));
    const r = advanceTime(reg, s0, adv(4 * 3600));
    const rec = r.state['rec'] as Rec;
    expect(rec).toEqual({ days: 0, sub: 2, seconds: 4 * 3600, endedDays: [START] });
  });

  it('rolls over months and years across 1 BBY -> 0 BBY/ABY -> 1 ABY', () => {
    const start = absDayFromDate({ year: -1, month: 12, day: 30 });
    const s = game({ start: { day: start, second: 0 } });
    const r1 = advanceTime(REGISTRY, s, adv(SECONDS_PER_DAY));
    expect(dateFromAbsDay(r1.state.clock.now.day)).toEqual({ year: 0, month: 1, day: 1 });
    const r2 = advanceTime(REGISTRY, r1.state, adv(368 * SECONDS_PER_DAY));
    expect(dateFromAbsDay(r2.state.clock.now.day)).toEqual({ year: 1, month: 1, day: 1 });
  });

  it('hooks run in registry order every step, and REGISTRY follows the documented hook order', () => {
    const log: string[] = [];
    const reg = [clockFeature, recorder('a', log), recorder('b', log), recorder('c', log)] as unknown as readonly FeatureModule<unknown, BaseState>[];
    advanceTime(reg, createInitialState<BaseState>(reg, ctx()), adv(3 * SECONDS_PER_DAY));
    expect(log.join('')).toBe('abc'.repeat(4));
    const ids = REGISTRY.map((f) => f.id);
    const positions = ids.map((id) => HOOK_ORDER.indexOf(id));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((x, y) => x - y)).toEqual(positions);
  });

  it('an interruption mid-skip stops at that day; the state equals a run to that day', () => {
    const interruptDay = START + 10;
    const reg = [clockFeature, recorder('rec', [], interruptDay)] as unknown as readonly FeatureModule<unknown, BaseState>[];
    const s0 = createInitialState<BaseState>(reg, ctx({ start: { day: START, second: 0 } }));
    const r = advanceTime(reg, s0, adv(60 * SECONDS_PER_DAY));
    expect(r.interrupted).toBe('ambush');
    expect(r.secondsAdvanced).toBe(11 * SECONDS_PER_DAY);
    const direct = advanceTime([clockFeature, recorder('rec', [])] as unknown as typeof reg, s0, adv(11 * SECONDS_PER_DAY));
    expect(r.state['rec']).toEqual(direct.state['rec']);
    expect((r.state['clock'] as GameState['clock']).now).toEqual((direct.state['clock'] as GameState['clock']).now);
    expect((r.state['clock'] as GameState['clock']).lastAdvance?.interruptedBy).toBe('ambush');
  });

  it('a birthday during a skip gives a notice; age is derived', () => {
    const s = game();
    expect(selectAge(s)).toBe(13);
    const r = advanceTime(REGISTRY, s, adv(400 * SECONDS_PER_DAY));
    expect(r.notices).toEqual(['Kael turns 14.']);
    expect(selectAge(r.state)).toBe(14);
  });

  it('records lastAdvance and is pure', () => {
    const s = game();
    const before = JSON.stringify(s);
    const r = advanceTime(REGISTRY, s, { seconds: 600, reason: 'walk', source: 'turnDraft', requested: 600 });
    expect(JSON.stringify(s)).toBe(before);
    expect(r.state.clock.lastAdvance).toEqual({ seconds: 600, reason: 'walk', source: 'turnDraft', requested: 600 });
    expect(r.state.clock.now.second).toBe(7 * 3600 + 600);
  });
});

describe('clock and pacing events (D-30, architecture §8)', () => {
  it('timeElapsed is clamped to the pacing range and advances the clock through the hooks', () => {
    const s = game(); // moment: 5 s - 15 min
    const r = applyEvents(REGISTRY, s, [{ type: 'timeElapsed', seconds: 3600, reason: 'long talk' }], { source: 'ai' });
    expect(r.rejected).toEqual([]);
    expect(r.state.clock.now.second).toBe(7 * 3600 + 900);
    expect(r.state.clock.lastAdvance).toMatchObject({ seconds: 900, source: 'timeElapsed', requested: 3600, clampedFrom: 3600 });
    expect(r.applied[0]?.notes[0]).toMatch(/clamped to 900s \(moment range\)/);
  });

  it('timeElapsed in scene pacing raises short spans to 15 minutes', () => {
    const s = applyEvents(REGISTRY, game(), [{ type: 'pacingSet', level: 'scene' }], { source: 'engine' }).state;
    const r = applyEvents(REGISTRY, s, [{ type: 'timeElapsed', seconds: 60, reason: 'x' }], { source: 'ai' });
    expect(r.state.clock.lastAdvance?.seconds).toBe(900);
  });

  it('the AI may not set pacing except to moment; montage falls back to scene until M4', () => {
    const scene = applyEvents(REGISTRY, game(), [{ type: 'pacingSet', level: 'montage' }], { source: 'engine' });
    expect(scene.state.pacing.level).toBe('scene');
    expect(scene.applied[0]?.notes[0]).toMatch(/not available until M4/);
    const toScene = applyEvents(REGISTRY, scene.state, [{ type: 'pacingSuggested', level: 'scene', reason: 'r' }], { source: 'ai' });
    expect(toScene.rejected[0]?.reason).toMatch(/only moment/);
    const toMoment = applyEvents(REGISTRY, scene.state, [{ type: 'pacingSuggested', level: 'moment', reason: 'r' }], { source: 'ai' });
    expect(toMoment.state.pacing.level).toBe('moment');
    expect(applyEvents(REGISTRY, game(), [{ type: 'pacingSet', level: 'scene' }], { source: 'ai' }).rejected[0]?.reason).toMatch(/source ai/);
  });

  it('sceneUpdated stores mood tags verbatim within limits', () => {
    const r = applyEvents(REGISTRY, game(), [{ type: 'sceneUpdated', moodTags: ['tense', 'quiet'], presentNpcRefs: [] }], { source: 'ai' });
    expect(r.state.pacing.scene.moodTags).toEqual(['tense', 'quiet']);
    const bad = applyEvents(REGISTRY, game(), [{ type: 'sceneUpdated', moodTags: ['a', 'b', 'c', 'd', 'e', 'f'], presentNpcRefs: [] }], { source: 'ai' });
    expect(bad.rejected).toHaveLength(1);
  });
});
