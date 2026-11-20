// Candidate D (measured only, not adopted): a sever chance of 0.1 on a qualifying limb hit; obiwan.
import { expect, it } from 'vitest';
import { SEVERING } from '../../../src/data/health.config';
import { OBIWAN } from '../../lifetime/profiles';
import { runSevers } from '../severs';

it('obiwan, D: sever chance 0.1, morale on', () => {
  (SEVERING as { chance: number }).chance = 0.1;
  expect(runSevers('obiwan', OBIWAN, 70, true)).toHaveLength(20);
}, 0);
