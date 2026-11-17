import { describe, expect, it } from 'vitest';
import { nextInt, rngCursor, rollD20, seedRng, type RngState } from '../../src/engine/rng';

describe('rng', () => {
  it('same seed gives the same sequence', () => {
    const a = rngCursor(seedRng('campaign-1'));
    const b = rngCursor(seedRng('campaign-1'));
    const sa = Array.from({ length: 50 }, () => a.d20());
    const sb = Array.from({ length: 50 }, () => b.d20());
    expect(sa).toEqual(sb);
    expect(a.state()).toEqual(b.state());
  });

  it('different seeds diverge', () => {
    const a = rngCursor(seedRng('x'));
    const b = rngCursor(seedRng('y'));
    expect(Array.from({ length: 20 }, () => a.d20())).not.toEqual(Array.from({ length: 20 }, () => b.d20()));
  });

  it('is pure: the input state is not mutated and the state is plain uint32 data', () => {
    const s = seedRng('pure');
    const copy = [...s];
    const [, next] = rollD20(s);
    expect([...s]).toEqual(copy);
    expect(next).not.toEqual(s);
    for (const w of next) expect(Number.isInteger(w) && w >= 0 && w <= 0xffffffff).toBe(true);
    expect(JSON.parse(JSON.stringify(next))).toEqual(next);
  });

  it('rolls.md test 4: natural 20 and natural 1 each occur 5% (+/-0.5%) over 100,000 rolls', () => {
    const r = rngCursor(seedRng('d20-distribution'));
    const counts = new Array<number>(21).fill(0);
    const N = 100_000;
    for (let i = 0; i < N; i++) {
      const v = r.d20();
      counts[v] = (counts[v] ?? 0) + 1;
    }
    expect(counts[0]).toBe(0);
    expect(Math.abs((counts[20] ?? 0) / N - 0.05)).toBeLessThanOrEqual(0.005);
    expect(Math.abs((counts[1] ?? 0) / N - 0.05)).toBeLessThanOrEqual(0.005);
    for (let f = 1; f <= 20; f++) expect(counts[f]).toBeGreaterThan(0);
  });

  it('nextInt stays in range and rejects bad ranges', () => {
    let s: RngState = seedRng('range');
    for (let i = 0; i < 1000; i++) {
      const [v, n] = nextInt(s, 5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(10);
      s = n;
    }
    expect(() => nextInt(s, 3, 2)).toThrow();
  });
});
