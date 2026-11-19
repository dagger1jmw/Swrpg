// Lifetime seed spread for the anakin profile (report only; see spread.ts).
import { expect, it } from 'vitest';
import { ANAKIN } from '../lifetime/profiles';
import { runSpread, SPREAD_SEEDS } from './spread';

it('anakin: the lifetime on the fixed seed and 19 more', () => {
  expect(runSpread('anakin', ANAKIN, 70, {})).toHaveLength(SPREAD_SEEDS);
}, 0);
