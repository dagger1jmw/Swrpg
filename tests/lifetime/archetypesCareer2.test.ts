// npc test 7, part 4 (archetypeCase.ts; D-462, Jared): the careers that start before 15 besides the Mandalorian, with the
// career youth phase (D-461).
import { describe } from 'vitest';
import { archetypeCase } from './archetypeCase';

describe('npc test 7: the young-start careers are reachable by their own routine', () => {
  for (const id of ['warrior', 'yuuzhanVongWarrior']) archetypeCase(id);
});
