// An NPC's growth past about 50 (Jared, 2026-11-25; D-497, D-498). Its training years: the species' age-weighted years, each counted by the share of a full
// training day the NPC still keeps at that Human-equivalent age (data/npcHours.ts). Pure.
import { NPC_TRAINING_HOURS, NPC_WILLPOWER_STOP_AGE } from '../data/npcHours';
import { ageFromTraining, humanEquivalentAge, speciesAgeFromHuman, trainingAge, type SpeciesDef } from '../data/species';
import type { AgeYears } from './closedForm';
import { interp } from './interp';
import { naturalLevel } from './species';

/** The share of a full training day at a Human-equivalent age. */
export const npcHoursShare = (h: number): number => interp(NPC_TRAINING_HOURS, h);

/** The years of `base` up to a training age, and none after it. */
export const yearsUntil = (base: AgeYears, stop: number): AgeYears => ({ factor: (row, t) => base.factor(row, t), integral: (row, a, b) => (Math.min(b, stop) > a ? base.integral(row, a, Math.min(b, stop)) : 0) });

/**
 * The training age at which an NPC's Willpower stops (D-500): it has trained, in real years from its own start, as many as a
 * Human who starts at `pathStart` has by the stop age.
 */
export const npcWillpowerStop = (species: SpeciesDef, startAge: number, pathStart: number): number => trainingAge(species, startAge + NPC_WILLPOWER_STOP_AGE - pathStart);

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

/**
 * An NPC's natural baseline (D-498): Willpower's own growth past the curve's first age slows on the training day's schedule.
 * Every other stat's is the player's.
 */
export function npcNaturalLevel(skillId: string, species: SpeciesDef, age: number): number {
  const full = (a: number): number => naturalLevel(skillId, species.id, a);
  const from = speciesAgeFromHuman(species, NPC_TRAINING_HOURS[0]![0]);
  if (skillId !== 'willpower' || age <= from) return full(age);
  let level = full(from);
  for (let a = from; a < age; a += STEP) {
    const b = Math.min(age, a + STEP);
    level += (full(b) - full(a)) * npcHoursShare(humanEquivalentAge(species, (a + b) / 2));
  }
  return level;
}
