// Lost limbs per lifetime, obiwan, morale on (report only; see severs.ts).
import { expect, it } from 'vitest';
import { OBIWAN } from '../lifetime/profiles';
import { runSevers } from './severs';

it('obiwan, morale on: severed limbs on 20 seeds', () => {
  expect(runSevers('obiwan', OBIWAN, 70, true)).toHaveLength(20);
}, 0);
