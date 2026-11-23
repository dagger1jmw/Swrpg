// The pace measurement (D-431), part: career1 (tests/paces/measure.ts). Files run in parallel.
import { it } from 'vitest';
import { measureArchetype } from './measure';

for (const id of ['soldier', 'mandalorian']) it(`measure ${id}`, () => void measureArchetype(id), 1_800_000);
