// Lifetime seed spread for the obiwan profile (report only; see spread.ts).
import { expect, it } from 'vitest';
import { OBIWAN } from '../lifetime/profiles';
import { runSpread, SPREAD_SEEDS } from './spread';

it('obiwan: the lifetime on the fixed seed and 19 more', () => {
  expect(runSpread('obiwan', OBIWAN, 70, {})).toHaveLength(SPREAD_SEEDS);
}, 0);
