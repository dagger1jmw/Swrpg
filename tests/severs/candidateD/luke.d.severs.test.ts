// Candidate D (measured only, not adopted): a sever chance of 0.1 on a qualifying limb hit; luke.
import { expect, it } from 'vitest';
import { SEVERING } from '../../../src/data/health.config';
import { LUKE } from '../../lifetime/profiles';
import { runSevers } from '../severs';

it('luke, D: sever chance 0.1, morale on', () => {
  (SEVERING as { chance: number }).chance = 0.1;
  expect(runSevers('luke', LUKE, 70, true)).toHaveLength(20);
}, 0);
