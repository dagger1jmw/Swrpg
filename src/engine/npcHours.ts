// An NPC's training years (Jared, 2026-11-25; D-497): the species' age-weighted years, each counted by the share of a full
// training day the NPC still keeps at that Human-equivalent age (data/npcHours.ts). Pure.
import { NPC_TRAINING_HOURS } from '../data/npcHours';
import { ageFromTraining, humanEquivalentAge, speciesAgeFromHuman, trainingAge, type SpeciesDef } from '../data/species';
import type { AgeYears } from './closedForm';
import { interp } from './interp';

/** The share of a full training day at a Human-equivalent age. */
export const npcHoursShare = (h: number): number => interp(NPC_TRAINING_HOURS, h);

/** Human-equivalent years between the points the curve is read at. */
const STEP = 1;

/** The years of `base` with the training day falling past the curve's first age. Before it nothing changes. */
export function npcYears(species: SpeciesDef, base: AgeYears): AgeYears {
  const from = NPC_TRAINING_HOURS[0]![0];
  const to = NPC_TRAINING_HOURS[NPC_TRAINING_HOURS.length - 1]![0];
  const cuts: number[] = [];
  for (let h = from; h <= to; h += STEP) cuts.push(trainingAge(species, speciesAgeFromHuman(species, h)));
  const shareAt = (t: number): number => npcHoursShare(humanEquivalentAge(species, ageFromTraining(species, t)));
  return {
    factor: (row, t) => base.factor(row, t),
    integral: (row, a, b) => {
      if (!(b > cuts[0]!)) return base.integral(row, a, b);
      let sum = a < cuts[0]! ? base.integral(row, a, cuts[0]!) : 0;
      let x = Math.max(a, cuts[0]!);
      for (const c of [...cuts.filter((t) => t > x && t < b), b]) {
        if (c > x) sum += base.integral(row, x, c) * shareAt((x + c) / 2);
        x = Math.max(x, c);
      }
      return sum;
    },
  };
}
