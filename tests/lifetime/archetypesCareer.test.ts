// npc test 7, part 3 (archetypeCase.ts).
import { describe } from 'vitest';
import { archetypeCase } from './archetypeCase';

describe('npc test 7: career archetypes are reachable by their own routine', () => {
  for (const id of ['mandalorian', 'smuggler', 'bountyHunter', 'civilian']) archetypeCase(id);
});
