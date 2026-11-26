// The pace measurement (D-431), part: career7 (tests/paces/measure.ts; m8-skills, D-513). Files run in parallel.
import { it } from 'vitest';
import { measureArchetype } from './measure';

for (const id of ['engineer']) it(`measure ${id}`, () => void measureArchetype(id), 1_800_000);
