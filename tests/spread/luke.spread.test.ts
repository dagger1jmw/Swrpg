// Lifetime seed spread for the luke profile (report only; see spread.ts).
import { expect, it } from 'vitest';
import { LUKE } from '../lifetime/profiles';
import { runSpread, SPREAD_SEEDS } from './spread';

it('luke: the lifetime on the fixed seed and 19 more', () => {
  expect(runSpread('luke', LUKE, 70, { track: ['forceControl', 'perf:strength', 'perf:agility', 'perf:endurance'] })).toHaveLength(SPREAD_SEEDS);
}, 0);
