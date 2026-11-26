// Progression, health, ranks and character v2 (M3 step 5): progression-numbers §20 tests 21, 22, 25,
// 26; progression-targets test 6; health test 13; the M1/M2 migration fixture and a save round trip.
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { stateMult } from '../../src/engine/speed';
import { selectFatigue } from '../../src/features/health/selectors';
import { selectGriefMult, selectLevel, selectLevelExact, selectStateOfMind, selectTierBeats } from '../../src/features/progression/selectors';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const fresh = (startingXp: Record<string, number> = {}): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: START, second: 7 * 3600 },
    character: { name: 'Kael', birthDay: START - 20 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'shiiCho', trainingStartAge: 4 },
    startingXp,
    rank: 'knight',
  });

const ai = (s: GameState, events: unknown[]) => applyEvents(REGISTRY, s, events, { source: 'ai' });
const engine = (s: GameState, events: unknown[]) => applyEvents(REGISTRY, s, events, { source: 'engine' });
const days = (s: GameState, n: number) => advanceTime(REGISTRY, s, { seconds: n * 86_400, reason: 'test', source: 'turnDraft' }).state;
const emotion = (emotion: string, intensity = 2) => ({ type: 'emotionalEvent', emotion, intensity, cause: 'test' });
const session = (credited: Record<string, number>, extra: Record<string, unknown> = {}) => ({
  type: 'activityResolved',
  activityId: 'shiiChoBasics',
  primaries: ['shiiCho'],
  hours: 2,
  windowHours: { shiiCho: 1.5, strength: 0.5 },
  credited,
  practiceHours: { shiiCho: 1.8 },
  fatigueWillpower: 0,
  meditation: false,
  day: { hoursByActivity: { shiiChoBasics: 2 }, postWindow: 0, lastPhysicalHeavy: true },
  ...extra,
});

describe('state of mind and grief (§17)', () => {
  it('test 21: grief reduces XP to x0.80 and returns to x1.00 within its window', () => {
    let s = ai(fresh(), [emotion('grief', 2)]).state;
    expect(selectGriefMult(s)).toBeCloseTo(0.8, 9);
    s = days(s, 10);
    expect(selectGriefMult(s)).toBeGreaterThan(0.8);
    expect(selectGriefMult(s)).toBeLessThan(1);
    s = days(s, 12);
    expect(selectGriefMult(s)).toBe(1);
    expect(s.progression.grief).toBeNull();
  });

  it('test 22: channeling anger gives x1.20 to eligible skills; light-side skills get x0.80 (dark pressure stubbed at 0)', () => {
    const s = ai(fresh(), [emotion('anger')]).state;
    expect(selectStateOfMind(s)).toBe('anger');
    const g = selectGriefMult(s);
    expect(stateMult(selectStateOfMind(s), 'djemSo', { grief: g })).toBe(1.2);
    expect(stateMult(selectStateOfMind(s), 'forceOutput', { grief: g })).toBe(1.2);
    expect(stateMult(selectStateOfMind(s), 'meditation', { grief: g })).toBe(0.8);
    expect(stateMult(selectStateOfMind(s), 'forceHealOthers', { grief: g })).toBe(0.8);
  });

  it('test 25: grief lingers under anger and centered', () => {
    let s = ai(fresh(), [emotion('grief', 3)]).state;
    s = ai(s, [emotion('anger')]).state;
    expect(selectStateOfMind(s)).toBe('anger');
    expect(stateMult(selectStateOfMind(s), 'djemSo', { grief: selectGriefMult(s) })).toBeCloseTo(1.2 * 0.8, 9);
    s = ai(s, [emotion('calm')]).state;
    expect(selectStateOfMind(s)).toBe('centered');
    expect(stateMult(selectStateOfMind(s), 'shiiCho', { grief: selectGriefMult(s) })).toBeCloseTo(1.05 * 0.8, 9);
    expect(s.progression.grief).not.toBeNull();
  });

  it('test 26: emotionalEvent maps by the §17 table; distracted never comes from an event', () => {
    const map: Record<string, string> = { fear: 'fear', anger: 'anger', hatred: 'hatred', calm: 'centered', pride: 'pride', despair: 'despair' };
    for (const [e, st] of Object.entries(map)) expect(selectStateOfMind(ai(fresh(), [emotion(e)]).state)).toBe(st);
    const r = ai(fresh(), [emotion('distracted')]);
    expect(r.rejected).toHaveLength(1);
    expect(selectStateOfMind(r.state)).toBe('neutral');
  });

  it('strongest wins: pride does not replace anger; passions expire after 3 days', () => {
    let s = ai(fresh(), [emotion('anger')]).state;
    s = ai(s, [emotion('pride')]).state;
    expect(selectStateOfMind(s)).toBe('anger');
    s = days(s, 4);
    expect(selectStateOfMind(s)).toBe('neutral');
  });

  it('an overtraining streak of 2+ days makes the character distracted', () => {
    let s = fresh();
    for (let i = 0; i < 2; i++) {
      s = engine(s, [session({ shiiCho: 5 }), { type: 'activityLoad', activityId: 'x', meters: { p: 50, m: 50, f: 0 } }]).state;
      s = advanceTime(REGISTRY, s, { seconds: 86_400 - (s.clock.now.second % 86_400), reason: 'test', source: 'turnDraft', occupation: 'activity' }).state;
    }
    expect(s.progression.overtrainStreak).toBe(2);
    expect(selectStateOfMind(s)).toBe('distracted');
  });
});

describe('XP and tier beats', () => {
  it('targets test 6: crossing a tier never blocks XP; it creates exactly one beat and one fact', () => {
    const s0 = fresh({ shiiCho: xpForLevel(40.9) });
    const r = engine(s0, [session({ shiiCho: xpForLevel(41.5) - xpForLevel(40.9) })]);
    expect(r.rejected).toEqual([]);
    expect(selectLevel(r.state, 'shiiCho')).toBe(41);
    expect(selectTierBeats(r.state)).toHaveLength(1);
    expect(r.state.memory.facts.filter((f) => f.text.includes('Adept'))).toHaveLength(1);
    const ack = ai(r.state, [{ type: 'milestoneBeatAcknowledged', beatId: selectTierBeats(r.state)[0]!.id }]);
    expect(selectTierBeats(ack.state)).toHaveLength(0);
    expect(ai(ack.state, [{ type: 'milestoneBeatAcknowledged', beatId: 'beat:99' }]).rejected).toHaveLength(1);
  });

  it('activityResolved removes rust, records practice and fills the pace window', () => {
    let s = fresh({ shiiCho: xpForLevel(30) });
    s = { ...s, progression: { ...s.progression, skills: { shiiCho: { xp: xpForLevel(30), rust: 0.05, lastPracticedDay: START - 200 } } } };
    s = engine(s, [session({ shiiCho: 10, strength: 1 })]).state;
    expect(s.progression.skills['shiiCho']!.rust).toBeCloseTo(0.05 - 0.005 * 1.8, 9);
    expect(s.progression.skills['shiiCho']!.lastPracticedDay).toBe(START);
    expect(s.progression.paceWindow['shiiCho']).toEqual([{ day: START, xp: 10, hours: 1.5 }]);
    expect(s.progression.paceWindow['strength']).toEqual([{ day: START, xp: 1, hours: 0.5 }]);
  });

  it('only the engine credits XP; the AI cannot', () => {
    expect(ai(fresh(), [session({ shiiCho: 100 })]).rejected).toHaveLength(1);
  });

  it('rust grows on unused trained skills after the grace period; XP never drops', () => {
    let s = fresh({ shiiCho: xpForLevel(30) });
    const xp = s.progression.skills['shiiCho']!.xp;
    s = days(s, 180);
    expect(s.progression.skills['shiiCho']!.rust).toBeCloseTo(0.05, 6);
    expect(s.progression.skills['shiiCho']!.xp).toBe(xp);
  });

  it('levels include the natural baseline (§11a)', () => {
    const s = fresh();
    expect(selectLevelExact(s, 'willpower')).toBeCloseTo(30, 6);
    expect(selectLevelExact(s, 'endurance')).toBeCloseTo(0.5 * 72.5, 6);
  });
});

describe('health meters (health §2, D-52)', () => {
  it('test 13: a turn with no activity recovers at the rest rates; only sleep of 7 h+ resets', () => {
    let s = engine(fresh(), [{ type: 'activityLoad', activityId: 'x', meters: { p: 4, m: 3, f: 1 } }]).state;
    s = advanceTime(REGISTRY, s, { seconds: 3600, reason: 'talk', source: 'timeElapsed' }).state;
    expect(s.health.meters.p).toBeCloseTo(3.25, 9);
    expect(s.health.meters.m).toBeCloseTo(2, 9);
    expect(s.health.meters.f).toBeCloseTo(0, 9);
    const asleep = advanceTime(REGISTRY, s, { seconds: 6 * 3600, reason: 'sleep', source: 'turnDraft', occupation: 'sleep' }).state;
    expect(asleep.health.meters.p).toBeCloseTo(3.25, 9);
    const short = engine(asleep, [{ type: 'sleepCompleted', hours: 6 }]).state;
    expect(short.health.meters.p).toBeCloseTo(3.25 * 0.3, 9);
    const full = engine(asleep, [{ type: 'sleepCompleted', hours: 8 }]).state;
    expect(full.health.meters).toEqual({ p: 0, m: 0, f: 0 });
  });

  it('fatigue fractions are derived from capacities', () => {
    const s = engine(fresh(), [{ type: 'activityLoad', activityId: 'x', meters: { p: 3, m: 0, f: 0 } }]).state;
    const f = selectFatigue(s);
    expect(f.p).toBeCloseTo(3 / f.capacity.p, 9);
  });
});

describe('saves', () => {
  it('migration fixture: an M2 save loads as a Human outsider with no training', () => {
    const s = fresh();
    const { health: _h, progression: _p, ranks: _r, routines: _ro, world: _w, flags: _f, combat: _c, economy: _e, droids: _d, traits: _t, battles: _b, ...rest } = s;
    const m2State = { ...rest, character: { id: s.character.id, name: 'Kael', birthDay: s.character.birthDay } };
    const raw = {
      format: 'swrpg-v2',
      envelopeVersion: 1,
      featureVersions: { clock: 1, character: 1, locations: 1, memory: 1, npcs: 1, relationships: 1, threads: 1, pacing: 1 },
      savedAt: 'x',
      state: m2State,
    };
    const loaded = loadEnvelope(REGISTRY, raw);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.character).toMatchObject({ speciesId: 'human', path: 'outsider', trainingStartAge: null, talents: {} });
    expect(loaded.state.progression.skills).toEqual({});
    expect(loaded.state.health.meters).toEqual({ p: 0, m: 0, f: 0 });
    expect(loaded.state.ranks.rank).toBe('none');
    expect(selectLevelExact(loaded.state, 'willpower')).toBeCloseTo(30, 6);
  });

  it('round trip: a save with progression, health and ranks loads back identical', () => {
    let s = fresh({ shiiCho: 5000, forceControl: 2000 });
    s = engine(s, [session({ shiiCho: 10 }), { type: 'activityLoad', activityId: 'x', meters: { p: 1, m: 2, f: 0.5 } }]).state;
    s = ai(s, [emotion('grief', 1)]).state;
    const loaded = loadEnvelope(REGISTRY, JSON.parse(JSON.stringify(makeEnvelope(REGISTRY, s, 'x'))));
    expect(loaded.ok && loaded.state).toEqual(s);
  });
});
