// Lost limbs per lifetime, luke, morale off (report only; see severs.ts).
import { expect, it } from 'vitest';
import { LUKE } from '../lifetime/profiles';
import { runSevers } from './severs';

it('luke, morale off: severed limbs on 20 seeds', () => {
  expect(runSevers('luke', LUKE, 70, false)).toHaveLength(20);
}, 0);
