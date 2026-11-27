// npc test 7, part 3 (archetypeLife.ts; opt-1 G): career archetypes are reachable by their own routine, and have no Force Sense.
import { describe } from 'vitest';
import { archetypeLife } from './archetypeLife';

for (const id of ['mandalorian', 'smuggler', 'bountyHunter', 'civilian']) describe(`npc test 7: ${id}`, () => archetypeLife(id));
