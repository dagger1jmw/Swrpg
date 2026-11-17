import { tirednessLabel, type Meters } from '../../engine/fatigue';
import type { GameState } from '../../state/gameState';
import { selectCapacities } from '../progression/selectors';

export const selectMeters = (s: GameState): Meters => s.health.meters;

export interface Fatigue {
  p: number;
  m: number;
  f: number;
  capacity: { p: number; m: number; f: number };
  labels: { p: string; m: string; f: string };
}

/** Meter fractions f = meter / capacity and their labels (derived, never stored). */
export function selectFatigue(s: GameState): Fatigue {
  const caps = selectCapacities(s);
  const m = s.health.meters;
  const p = m.p / caps.p;
  const mm = m.m / caps.m;
  const f = m.f / caps.f;
  return { p, m: mm, f, capacity: caps, labels: { p: tirednessLabel(p), m: tirednessLabel(mm), f: tirednessLabel(f) } };
}

/** Day-end tiredness for the overtraining streak: the higher of the physical and mental fractions. */
export const selectMaxFraction = (s: GameState): number => {
  const f = selectFatigue(s);
  return Math.max(f.p, f.m);
};
