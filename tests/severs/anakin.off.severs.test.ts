// Lost limbs per lifetime, anakin, morale off (report only; see severs.ts).
import { expect, it } from 'vitest';
import { ANAKIN } from '../lifetime/profiles';
import { runSevers } from './severs';

it('anakin, morale off: severed limbs on 20 seeds', () => {
  expect(runSevers('anakin', ANAKIN, 70, false)).toHaveLength(20);
}, 0);
