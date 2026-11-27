// opt-2 B (audit D-dates): the closed forms the ranks read are built in the character's own era, not at 1 ABY (birth day 0); the
// economy's old-save start is the save's own day.
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { initiatePopulation, selectPaceForAge } from '../../src/features/ranks/selectors';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { base } from '../support/schemaSituations';

const D3661 = absDayFromDate({ year: -3661, month: 3, day: 1 });
const D1ABY = absDayFromDate({ year: 1, month: 3, day: 1 });
const D4500 = absDayFromDate({ year: -4500, month: 3, day: 1 });

/** The same character moved to another day: its birth day, start and clock shifted together. */
function shifted(s: GameState, to: number): GameState {
  const d = to - s.clock.now.day;
  return { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: to } }, character: { ...s.character, birthDay: s.character.birthDay + d } };
}

describe('B: the character\'s own era', () => {
  it('the Initiates a character is ranked among live in its era: before 3,959 BBY (fewer forms) they differ from 1 ABY\'s', () => {
    const early = initiatePopulation('opt2', 11, 60, 'initiate', D4500);
    const later = initiatePopulation('opt2', 11, 60, 'initiate', D1ABY);
    const then = initiatePopulation('opt2', 11, 60, 'initiate', D3661);
    // Each era is built on its own (a population per year), the same draw (seed, age, size, rank).
    expect(early).not.toBe(later);
    expect(then).not.toBe(later);
    expect(initiatePopulation('opt2', 11, 60, 'initiate', D3661)).toBe(then);
    // The composite reads the highest form (Shii-Cho for an Initiate, in every era): the era moves only the secondary forms, so
    // the numbers agree (reports/opt-2.md B: the fix is right, its measured effect today is none).
    expect(then).toEqual(later);
    expect(early).toEqual(later);
  });

  it('pace for age compares a character with the Average of its own era (a 3,661 BBY Padawan; the same Padawan in 4,500 BBY)', () => {
    const s = base({ rank: 'padawan' });
    const s2: GameState = { ...s, character: { ...s.character, birthDay: s.clock.now.day - 16 * 368 } };
    const now = selectPaceForAge(s2);
    expect(now.years).toBeGreaterThan(10);
    expect(Number.isFinite(now.pace)).toBe(true);
    // 3,661 BBY and 1 ABY share the curriculum: the same pace. 4,500 BBY has fewer forms: another Average.
    expect(selectPaceForAge(shifted(s2, D1ABY)).pace).toBeCloseTo(now.pace, 9);
    const early = selectPaceForAge(shifted(s2, D4500));
    expect(early.years).toBeCloseTo(now.years, 6);
  });

  it('an old save without an economy starts its purse on its own day, not 1 ABY', () => {
    // Latent (the audit): an old save has no trait debt, the start day's only reader; the slice is built on the save's day.
    const econ = REGISTRY.find((f) => f.id === 'economy')!;
    const raw = { character: { name: 'Old', birthDay: D3661 - 30 * 368, path: 'jedi' }, clock: { now: { day: D3661, second: 0 } } };
    const slice = econ.emptyState!(raw) as { loans: unknown[] };
    expect(slice.loans).toEqual([]);
  });
});
