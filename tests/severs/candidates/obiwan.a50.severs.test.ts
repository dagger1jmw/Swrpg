// Candidate severing tunables, obiwan, a50 (measured only, not adopted; see severs.ts).
import { expect, it } from 'vitest';
import { OBIWAN } from '../../lifetime/profiles';
import { runSevers } from '../severs';

it('obiwan, a50: severed limbs on 20 seeds, morale on', () => {
  expect(runSevers('obiwan', OBIWAN, 70, true, {} as never, 50)).toHaveLength(20);
}, 0);
