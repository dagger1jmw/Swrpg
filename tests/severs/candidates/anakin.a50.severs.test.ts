// Candidate severing tunables, anakin, a50 (measured only, not adopted; see severs.ts).
import { expect, it } from 'vitest';
import { ANAKIN } from '../../lifetime/profiles';
import { runSevers } from '../severs';

it('anakin, a50: severed limbs on 20 seeds, morale on', () => {
  expect(runSevers('anakin', ANAKIN, 70, true, {} as never, 50)).toHaveLength(20);
}, 0);
