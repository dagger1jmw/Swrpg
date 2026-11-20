// Lost limbs per lifetime, obiwan, morale off (report only; see severs.ts).
import { expect, it } from 'vitest';
import { OBIWAN } from '../lifetime/profiles';
import { runSevers } from './severs';

it('obiwan, morale off: severed limbs on 20 seeds', () => {
  expect(runSevers('obiwan', OBIWAN, 70, false)).toHaveLength(20);
}, 0);
