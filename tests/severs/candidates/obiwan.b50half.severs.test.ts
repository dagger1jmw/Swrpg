// Candidate severing tunables, obiwan, b50half (measured only, not adopted; see severs.ts).
import { expect, it } from 'vitest';
import { OBIWAN } from '../../lifetime/profiles';
import { runSevers } from '../severs';

it('obiwan, b50half: severed limbs on 20 seeds, morale on', () => {
  expect(runSevers('obiwan', OBIWAN, 70, true, { limbShare: 0.5 } as never, 50)).toHaveLength(20);
}, 0);
