// D-159 amended (Jared, 2026-11-20): the Y_avg calibration gate is judged on the 20-seed median in npm run spread.
import { describe, expect, it } from 'vitest';
import { Y_AVG } from '../../src/data/progression.config';
import { yAvgMedianGate } from '../spread/spread';

const row = (byAge: (age: number) => number) => ({ profile: 'average', values: Object.fromEntries(Y_AVG.map(([age]) => [`yAvgRatio@${age}`, byAge(age)])) });

describe('the Y_avg gate on the 20-seed median', () => {
  it('a few seeds far off (long recoveries) do not fail it; the median does', () => {
    const rows = Array.from({ length: 20 }, (_, k) => row((age) => (k < 9 && age === 90 ? 1.2 : 1.02)));
    expect(yAvgMedianGate(rows).pass).toBe(true);
    expect(yAvgMedianGate(rows).worst.ratio).toBeCloseTo(1.02, 6);
    const off = Array.from({ length: 20 }, (_, k) => row((age) => (k < 11 && age === 90 ? 1.07 : 1.0)));
    const g = yAvgMedianGate(off);
    expect(g.pass).toBe(false);
    expect(g.worst.age).toBe(90);
  });
  it('other profiles are ignored; no Average rows is a failure', () => {
    expect(yAvgMedianGate([{ profile: 'luke', values: {} }]).pass).toBe(false);
  });
});
