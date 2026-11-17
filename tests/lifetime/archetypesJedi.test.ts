// npc test 7, part 1 (archetypeCase.ts).
import { describe } from 'vitest';
import { archetypeCase } from './archetypeCase';

describe('npc test 7: Jedi archetypes are reachable by their own routine', () => {
  for (const id of ['jediGuardian', 'jediConsular', 'jediSentinel']) archetypeCase(id);
});
