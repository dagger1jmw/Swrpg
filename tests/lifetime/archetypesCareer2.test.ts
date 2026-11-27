// npc test 7, part 4 (archetypeLife.ts; D-462, Jared): the careers that start before 15 besides the Mandalorian, with the career youth
// phase (D-461).
import { describe } from 'vitest';
import { archetypeLife } from './archetypeLife';

for (const id of ['warrior', 'yuuzhanVongWarrior']) describe(`npc test 7: ${id}`, () => archetypeLife(id));
