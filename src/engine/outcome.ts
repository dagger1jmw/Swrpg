// Session outcome roll (progression-numbers §5): code rolls it, mean ~1.0. Pure; seeded RNG.
import { OUTCOMES, type OutcomeName } from '../data/progression.config';
import { nextFloat, type RngState } from './rng';

export interface Outcome {
  name: OutcomeName;
  mult: number;
}

export function rollOutcome(rng: RngState): [Outcome, RngState] {
  const [u, next] = nextFloat(rng);
  let acc = 0;
  for (const [name, p, mult] of OUTCOMES) {
    acc += p;
    if (u < acc) return [{ name, mult }, next];
  }
  const [name, , mult] = OUTCOMES[OUTCOMES.length - 1]!;
  return [{ name, mult }, next];
}

export const OUTCOME_MEAN = OUTCOMES.reduce((a, [, p, m]) => a + p * m, 0);
