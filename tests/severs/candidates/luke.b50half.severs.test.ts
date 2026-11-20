// Candidate severing tunables, luke, b50half (measured only, not adopted; see severs.ts).
import { expect, it } from 'vitest';
import { LUKE } from '../../lifetime/profiles';
import { runSevers } from '../severs';

it('luke, b50half: severed limbs on 20 seeds, morale on', () => {
  expect(runSevers('luke', LUKE, 70, true, { limbShare: 0.5 } as never, 50)).toHaveLength(20);
}, 0);
