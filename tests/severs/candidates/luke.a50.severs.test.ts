// Candidate severing tunables, luke, a50 (measured only, not adopted; see severs.ts).
import { expect, it } from 'vitest';
import { LUKE } from '../../lifetime/profiles';
import { runSevers } from '../severs';

it('luke, a50: severed limbs on 20 seeds, morale on', () => {
  expect(runSevers('luke', LUKE, 70, true, {} as never, 50)).toHaveLength(20);
}, 0);
