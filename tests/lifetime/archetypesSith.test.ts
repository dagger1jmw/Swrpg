// npc test 7, part 2 (archetypeCase.ts).
import { describe } from 'vitest';
import { archetypeCase } from './archetypeCase';

describe('npc test 7: Sith archetypes and soldiers are reachable by their own routine', () => {
  for (const id of ['sithWarrior', 'sithInquisitor', 'soldier']) archetypeCase(id);
});
