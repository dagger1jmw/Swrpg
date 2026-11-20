// Candidate severing tunables, anakin, b50half (measured only, not adopted; see severs.ts).
import { expect, it } from 'vitest';
import { ANAKIN } from '../../lifetime/profiles';
import { runSevers } from '../severs';

it('anakin, b50half: severed limbs on 20 seeds, morale on', () => {
  expect(runSevers('anakin', ANAKIN, 70, true, { limbShare: 0.5 } as never, 50)).toHaveLength(20);
}, 0);
