// Age and learning speed (progression-numbers §16) and its exact integral (D-43). Ages are
// Human-equivalent ages (species.md §1). Pure.
import { AGE_ANCHOR_X, AGE_ROWS } from '../data/progression.config';
import type { AgeRow } from '../data/skills';
import { integratePiecewise, interp, type Anchors } from './interp';

const anchorsFor = (row: AgeRow): Anchors => AGE_ANCHOR_X.map((x, i) => [x, AGE_ROWS[row][i]!] as const);
const ROW_ANCHORS: Record<AgeRow, Anchors> = {
  technique: anchorsFor('technique'),
  wisdom: anchorsFor('wisdom'),
  physical: anchorsFor('physical'),
  academic: anchorsFor('academic'),
};

export function ageFactor(row: AgeRow, h: number): number {
  return interp(ROW_ANCHORS[row], h);
}

/** Age-weighted years: the integral of the row's age factor from age a to b. */
export function ageIntegral(row: AgeRow, a: number, b: number): number {
  return integratePiecewise(ROW_ANCHORS[row], a, b);
}
