// computeXp training branch: progression-numbers §20 tests 2, 12 and 14 (M3 step 4).
import { describe, expect, it } from 'vitest';
import { LOADS } from '../../src/data/activities';
import { M_CAP } from '../../src/data/progression.config';
import { computeTrainingXp, splitShares, type TrainingInput } from '../../src/engine/computeXp';
import { levelExact } from '../../src/engine/curve';
import { EMPTY_DAY, ZERO_METERS, capacities } from '../../src/engine/fatigue';
import { clampCredit, clampShare, inWindow, paceCap, type WindowEntry } from '../../src/engine/paceClamp';
import { seedRng, type RngState } from '../../src/engine/rng';

function baseInput(over: Partial<TrainingInput> = {}): TrainingInput {
  return {
    activityId: 'shiiChoBasics',
    load: LOADS.saberDrill,
    physical: true,
    meditation: false,
    hours: 2,
    intensity: 'standard',
    drillRating: 10,
    challengeLevel: 5,
    split: { primaries: { shiiCho: 1 }, secondaries: { strength: 0.4, agility: 0.3, endurance: 0.2, forceControl: 0.15 } },
    meters: ZERO_METERS,
    caps: capacities(30, 30, 10),
    day: EMPTY_DAY,
    halveFatigueWillpower: false,
    willpowerToday: 0,
    m: () => 1,
    levelOf: () => 0,
    xpOf: () => 0,
    naturalOf: () => 0,
    clamp: (_s, wanted) => ({ credited: wanted, discarded: 0 }),
    rng: seedRng('xp'),
    ...over,
  };
}

describe('computeXp (training branch)', () => {
  it('splits 0.75 / 0.25 and never adds: shares sum to 1', () => {
    const s = splitShares({ primaries: { shiiCho: 1 }, secondaries: { strength: 0.4, agility: 0.3, endurance: 0.2, forceControl: 0.15 } });
    expect(s['shiiCho']).toBeCloseTo(0.75, 12);
    expect(Object.values(s).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    const pair = splitShares({ primaries: { soresu: 1, ataru: 1 }, secondaries: { agility: 0.4, forceControl: 0.3 } });
    expect(pair['soresu']).toBeCloseTo(0.375, 12);
  });

  it('test 14: XP to all skills combined = effective hours x mults (synergy is the only extra, <= 25%)', () => {
    let rng: RngState = seedRng('t14');
    for (let i = 0; i < 200; i++) {
      const r = computeTrainingXp(baseInput({ rng, intensity: i % 2 ? 'intense' : 'standard' }));
      rng = r.rng;
      const rawTotal = Object.values(r.raw).reduce((a, b) => a + b, 0);
      const intensityXp = i % 2 ? 1.2 : 1.0;
      expect(rawTotal).toBeCloseTo(r.effectiveHours * intensityXp * r.challenge * r.outcome.mult, 9);
      const synergyTotal = Object.values(r.synergy).reduce((a, b) => a + b, 0);
      expect(synergyTotal).toBeLessThanOrEqual(0.25 * rawTotal + 1e-9);
      const creditedTotal = Object.values(r.credited).reduce((a, b) => a + b, 0);
      expect(creditedTotal).toBeCloseTo(rawTotal + synergyTotal + r.fatigueWillpower, 9);
    }
  });

  it('M multiplies per skill', () => {
    const plain = computeTrainingXp(baseInput());
    const fast = computeTrainingXp(baseInput({ m: (s) => (s === 'shiiCho' ? 1.5 : 1) }));
    expect(fast.raw['shiiCho']).toBeCloseTo(1.5 * plain.raw['shiiCho']!, 9);
    expect(fast.raw['strength']).toBeCloseTo(plain.raw['strength']!, 9);
  });

  it('removes rust by effective hours: primaries in full, secondaries by share', () => {
    const r = computeTrainingXp(baseInput());
    expect(r.practiceHours['shiiCho']).toBeCloseTo(r.effectiveHours, 9);
    expect(r.practiceHours['strength']!).toBeLessThan(r.effectiveHours);
  });

  it('test 12 (first half): fatigue Willpower never exceeds 3.0/day; direct Willpower training is outside the cap', () => {
    let rng: RngState = seedRng('t12');
    let willToday = 0;
    let meters = ZERO_METERS;
    let day = EMPTY_DAY;
    const caps = capacities(20, 20, 0);
    for (let i = 0; i < 8; i++) {
      const r = computeTrainingXp(baseInput({ rng, meters, day, caps, willpowerToday: willToday, hours: 2 }));
      rng = r.rng;
      meters = r.meters;
      day = r.day;
      willToday += r.fatigueWillpower;
    }
    expect(willToday).toBeLessThanOrEqual(3 + 1e-9);
    expect(willToday).toBeCloseTo(3, 6);
    const direct = computeTrainingXp(baseInput({ split: { primaries: { willpower: 1 }, secondaries: { meditation: 0.4, forceControl: 0.1 } }, willpowerToday: 3, meters, day, caps }));
    expect(direct.credited['willpower']!).toBeGreaterThan(0);
    expect(direct.fatigueWillpower).toBe(0);
  });

  it('test 12 (second half): a 7-day pushing streak earns less fatigue Willpower than alternating push and recovery days (D-110)', () => {
    // §10: an overtrained day (ending above 1.0) extends the streak, a rest day resets it, capacity
    // falls 10% per streak day, and from the 3rd consecutive overtrained day the whole day's fatigue
    // Willpower is halved. Same number of push days (7) in both schedules; End 30, Will 30, 6 h drills.
    const run = (pattern: boolean[]): { total: number; perDay: number[] } => {
      let streak = 0;
      let rng: RngState = seedRng('t12b');
      const perDay: number[] = [];
      for (const push of pattern) {
        if (!push) {
          streak = 0;
          continue;
        }
        const caps = capacities(30, 30, 0, streak);
        let meters = ZERO_METERS;
        let day = EMPTY_DAY;
        let will = 0;
        for (let i = 0; i < 3; i++) {
          const r = computeTrainingXp(baseInput({ rng, caps, meters, day, hours: 2, willpowerToday: will, halveFatigueWillpower: streak >= 2 }));
          rng = r.rng;
          meters = r.meters;
          day = r.day;
          will += r.fatigueWillpower;
        }
        perDay.push(will);
        streak = Math.max(meters.p / caps.p, meters.m / caps.m) > 1 ? streak + 1 : 0;
      }
      return { total: perDay.reduce((a, b) => a + b, 0), perDay };
    };
    const streak = run(Array(7).fill(true));
    const alternating = run(Array.from({ length: 14 }, (_, i) => i % 2 === 0));
    expect(streak.perDay.slice(0, 2).every((w) => w > 1.5)).toBe(true);
    for (const w of streak.perDay.slice(2)) expect(w).toBeLessThanOrEqual(1.5 + 1e-9);
    expect(streak.total).toBeLessThan(alternating.total);
  });

  it('a halving day credits half of min(3.0, raw) fatigue Willpower', () => {
    const caps = capacities(20, 20, 0);
    const go = (halve: boolean) => {
      let meters = ZERO_METERS;
      let day = EMPTY_DAY;
      let will = 0;
      for (let i = 0; i < 4; i++) {
        const r = computeTrainingXp(baseInput({ caps, meters, day, hours: 2, willpowerToday: will, halveFatigueWillpower: halve }));
        meters = r.meters;
        day = r.day;
        will += r.fatigueWillpower;
      }
      return will;
    };
    expect(go(false)).toBeCloseTo(3, 9);
    expect(go(true)).toBeCloseTo(1.5, 9);
  });

  it('test 2: no input combination exceeds 4.0x the Average pace (rolling 365-day window, per skill)', () => {
    // Every multiplier at its maximum (M capped at 2.8), extreme intensity, 8 h a day of one skill,
    // for two years; the clamp must hold the window under the cap every day.
    const window: Record<string, WindowEntry[]> = {};
    const totals: Record<string, number> = {};
    let rng: RngState = seedRng('t2');
    const startAge = 20;
    for (let d = 0; d < 736; d++) {
      const age = startAge + d / 368;
      const cap = paceCap(age - 365 / 368, clampShare(0.5, 1, 1));
      for (const k of Object.keys(window)) window[k] = inWindow(window[k]!, d);
      const before: Record<string, number> = Object.fromEntries(Object.entries(window).map(([k, e]) => [k, e.reduce((a, x) => a + x.xp, 0)]));
      for (let s = 0; s < 4; s++) {
        const r = computeTrainingXp(
          baseInput({
            rng,
            hours: 2,
            intensity: 'extreme',
            m: () => M_CAP,
            challengeLevel: 2,
            drillRating: 14,
            caps: { p: 1e6, m: 1e6, f: 1e6 },
            clamp: (skill, wanted, _h) => clampCredit(wanted, (window[skill] ?? []).reduce((a, e) => a + e.xp, 0), cap),
            xpOf: (sk) => totals[sk] ?? 0,
            levelOf: (sk) => levelExact(totals[sk] ?? 0),
          }),
        );
        rng = r.rng;
        for (const [k, v] of Object.entries(r.credited)) {
          (window[k] ??= []).push({ day: d, xp: v, hours: 0 });
          totals[k] = (totals[k] ?? 0) + v;
        }
      }
      for (const [k, entries] of Object.entries(window)) {
        // Y_avg falls with age, so credits made under an earlier, higher cap may stay in the window;
        // the clamp then credits nothing more. It never pushes a window above today's cap.
        const sum = entries.reduce((a, e) => a + e.xp, 0);
        expect(sum, `${k} day ${d}`).toBeLessThanOrEqual(Math.max(cap, before[k] ?? 0) + 1e-6);
      }
    }
  });
});
