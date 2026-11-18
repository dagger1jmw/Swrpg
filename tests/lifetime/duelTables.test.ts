// rolls.md §8 tests 1, 2, 3 and 5 by seeded simulation (10,000 duels per case; slow, so they run with test:all).
// Duration targets as amended by D-156: gaps 0-10 within the §3 band of 30-40 exchanges, gaps 20+ within +/-5 of the
// table; test 3 median 5 or fewer (D-157).
import { describe, expect, it } from 'vitest';
import { runUntilBeat, startDuel, type DuelState, type Fighter } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { REAL, forceUser, simulate } from '../support/duelSim';

const N = 10_000;
const TABLE: readonly [number, number, number][] = [
  [0, 50, 34],
  [5, 60, 33],
  [10, 68, 34],
  [20, 84, 29],
  [30, 92, 24],
  [40, 96, 20],
  [60, 99, 13],
];

const trooper = (level: number): Fighter =>
  forceUser('T', level, { skillId: 'blaster', form: null, weapon: 'blasterRifle', armor: 'medium', forceSense: 0, vitality: 47, maxVitality: 47, minion: true, caps: { p: 4.6, f: 0 } });

/** Win rate of A when the duel is played with a custom opening. */
function winRate(make: () => { a: Fighter; b: Fighter }, seed: string): number {
  let rng = seedRng(seed);
  let wins = 0;
  for (let i = 0; i < N; i++) {
    const { a, b } = make();
    let s: DuelState = startDuel(a, [b], rng);
    s = runUntilBeat(s, REAL, 0, 'toEnd', 2000).state;
    rng = s.rng;
    if (s.end?.winner === 'A') wins++;
  }
  return wins / N;
}

describe('rolls §8 duel tables (seeded simulation)', { timeout: 300_000 }, () => {
  it('test 1: the upset and median-exchange table between equal-Vitality Force users', () => {
    for (const [gap, win, median] of TABLE) {
      const st = simulate(() => ({ a: forceUser('A', 50 + gap), b: forceUser('B', 50) }), N, `gap${gap}`);
      expect(Math.abs(st.winRateA * 100 - win), `gap ${gap} win ${st.winRateA}`).toBeLessThanOrEqual(3);
      if (gap <= 10) {
        expect(st.medianExchanges, `gap ${gap} median`).toBeGreaterThanOrEqual(30);
        expect(st.medianExchanges, `gap ${gap} median`).toBeLessThanOrEqual(40);
      } else expect(Math.abs(st.medianExchanges - median), `gap ${gap} median ${st.medianExchanges}`).toBeLessThanOrEqual(5);
    }
  });

  it('test 2: the scenario table within +/-5 points', () => {
    const straight = winRate(() => ({ a: forceUser('A', 50), b: forceUser('B', 65) }), 'sc1');
    expect(Math.abs(straight * 100 - 23), `straight ${straight}`).toBeLessThanOrEqual(5);
    // Opens with surprise (the first exchange is a strike), then an opening: the attacker holds at least +2 after it.
    // Under D-156 a missed surprise strike already leaves +2 (the pressure rule), so the opening is not added on top.
    let rng = seedRng('sc2');
    let wins = 0;
    for (let i = 0; i < N; i++) {
      let s = startDuel(forceUser('A', 50), [forceUser('B', 65)], rng, 'A');
      s = runUntilBeat(s, REAL, 0, 'beat', 1).state;
      if (!s.end) s = { ...s, advantage: Math.max(s.advantage, 2) };
      s = runUntilBeat(s, REAL, 0, 'toEnd', 2000).state;
      rng = s.rng;
      if (s.end?.winner === 'A') wins++;
    }
    expect(Math.abs((wins / N) * 100 - 32), `surprise ${wins / N}`).toBeLessThanOrEqual(5);
    const high = winRate(() => ({ a: forceUser('A', 50, { position: 2 }), b: forceUser('B', 60) }), 'sc3');
    expect(Math.abs(high * 100 - 68), `high ground ${high}`).toBeLessThanOrEqual(5);
    const reckless = winRate(() => ({ a: forceUser('A', 50, { position: 2 }), b: forceUser('B', 60, { stateOfMind: 'anger' }) }), 'sc4');
    expect(Math.abs(reckless * 100 - 81), `reckless ${reckless}`).toBeLessThanOrEqual(5);
  });

  it('test 3: Jedi (70, Force Sense 70) vs trooper (15): 99%+ wins, median 5 or fewer exchanges (D-157)', () => {
    const st = simulate(() => ({ a: forceUser('J', 70, { form: 'soresu' }), b: trooper(15) }), N, 'test3');
    expect(st.winRateA).toBeGreaterThanOrEqual(0.99);
    expect(st.medianExchanges).toBeLessThanOrEqual(5);
  });

  it('test 5: one level of difference never changes the odds by more than 2.5 points', () => {
    for (const base of [0, 10, 20]) {
      const lo = simulate(() => ({ a: forceUser('A', 50 + base), b: forceUser('B', 50) }), N, `lvl${base}`).winRateA;
      const hi = simulate(() => ({ a: forceUser('A', 51 + base), b: forceUser('B', 50) }), N, `lvl${base}`).winRateA;
      expect(Math.abs(hi - lo) * 100, `base ${base}`).toBeLessThanOrEqual(2.5);
    }
  });
});
