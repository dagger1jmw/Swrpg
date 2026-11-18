// The Force meter module (health §2; D-167): the one interface for Force load in M5, so the M6 redesign replaces one
// module. Behaviour tests for its functions live in health.test.ts (test 8); this file checks the isolation itself.
import { describe, expect, it } from 'vitest';
import { addFixedLoad, applyForceLoad, forceCapacity, forceFraction, forceWithin, restForce, rollCollapse, sleepForce, trainingForceStep } from '../../src/engine/forceMeter';
import { seedRng } from '../../src/engine/rng';

/** Every source file as text (Vite raw import, like tests/lore). */
const SOURCES = import.meta.glob('/src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('Force meter isolation (D-167)', () => {
  it('no source outside src/engine/forceMeter.ts does Force-meter math or reads its numbers', () => {
    // Arithmetic on a Force meter value, or the Force numbers used directly.
    const patterns = [/meters\.f\s*[+\-*/]/, /\.f\s*\/\s*[a-zA-Z.]*caps\.f/, /\bFORCE_CAPACITY\b/, /\bFORCE_METER\b/, /\bMEDITATION_FORCE_RECOVERY\b/, /REST_RECOVERY\.f\b/];
    const offenders: string[] = [];
    expect(Object.keys(SOURCES).length).toBeGreaterThan(50);
    for (const [path, text] of Object.entries(SOURCES)) {
      const rel = path.replace(/^\/src\//, '');
      if (rel === 'engine/forceMeter.ts' || rel.startsWith('data/')) continue;
      text.split(/\r?\n/).forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return;
        if (patterns.some((p) => p.test(line))) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the interface: limit, load, backlash, collapse and recovery', () => {
    expect(forceCapacity(50, 50)).toBeCloseTo(3 + 1.5 + 0.5);
    expect(forceFraction(2.5, 5)).toBe(0.5);
    expect(forceWithin(5, 5, 1.0)).toBe(true);
    expect(forceWithin(5.1, 5, 1.0)).toBe(false);
    expect(forceWithin(0, 0, 1.0)).toBe(false);
    expect(applyForceLoad({ p: 0, m: 0, f: 4.8 }, 5, 0.4).backlashMental).toBeCloseTo(0.1);
    expect(addFixedLoad(1, 0.4)).toBeCloseTo(1.4);
    expect(rollCollapse(seedRng('c'), false)[0]).toBe(false);
    let n = 0;
    let rng = seedRng('collapse');
    for (let i = 0; i < 20_000; i++) {
      const [c, r] = rollCollapse(rng, true);
      rng = r;
      if (c) n++;
    }
    expect(n / 20_000).toBeCloseTo(0.05, 2);
    expect(trainingForceStep(1, { meditation: true, loadF: 0, intensityLoad: 1, hours: 0.5 })).toBe(0);
    expect(trainingForceStep(1, { meditation: false, loadF: 0.4, intensityLoad: 1, hours: 0.5 })).toBeCloseTo(1.2);
    expect(restForce(2, 1)).toBe(1);
    expect(sleepForce(2, 0)).toBe(0);
  });
});
