// Lost limbs per lifetime, average, morale on (report only; see severs.ts).
import { expect, it } from 'vitest';
import { AVERAGE } from '../lifetime/profiles';
import { runSevers } from './severs';

it('average, morale on: severed limbs on 20 seeds', () => {
  expect(runSevers('average', AVERAGE, 95, true, { crossLevels: { highestForm: [24, 39, 58], forceControl: [14, 34], forceSense: [31], willpower: [53] } })).toHaveLength(20);
}, 0);
