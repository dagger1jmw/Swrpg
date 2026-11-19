// Lifetime seed spread for the average profile (report only; see spread.ts).
import { expect, it } from 'vitest';
import { AVERAGE } from '../lifetime/profiles';
import { runSpread, SPREAD_SEEDS } from './spread';

it('average: the lifetime on the fixed seed and 19 more', () => {
  expect(runSpread('average', AVERAGE, 95, { crossLevels: { highestForm: [24, 39, 58], forceControl: [14, 34], forceSense: [31], willpower: [53] } })).toHaveLength(SPREAD_SEEDS);
}, 0);
