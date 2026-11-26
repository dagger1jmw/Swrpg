// An NPC's growth past about 50 (Jared, 2026-11-25; D-497, D-498). Its training years: the species' age-weighted years, each counted by the share of a full
// training day the NPC still keeps at that Human-equivalent age (data/npcHours.ts). Pure.
import { LIFE_EXPERIENCE, NPC_TRAINING_HOURS, NPC_TRAINING_HOURS_UNSHEETED, NPC_WILLPOWER_STOP_AGE } from '../data/npcHours';
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
 * The years of `base` for an NPC without a sheet (D-506): the training day by years trained, read from the NPC's own start
 * (`startTraining`, a training age, and `startAge`, its real age then), and none past the curve's end.
 */
export function npcYearsTrained(_species: SpeciesDef, base: AgeYears, startTraining: number, startAge: number): AgeYears {
  // Years trained from the start of training or adulthood (D-507): a childhood counts at the Human's pace (the training age), so
  // a Hutt's 150 years of it do not use up the allowance; adult years are real years.
  void startAge;
  const h0 = startTraining;
  const hAt = (t: number): number => h0 + Math.max(0, t - startTraining);
  const from = NPC_TRAINING_HOURS_UNSHEETED[0]![0];
  const to = NPC_TRAINING_HOURS_UNSHEETED[NPC_TRAINING_HOURS_UNSHEETED.length - 1]![0];
  const cuts: number[] = [];
  for (let h = from; h <= to; h += STEP) if (h > h0) cuts.push(startTraining + h - h0);
  const shareAt = (t: number): number => interp(NPC_TRAINING_HOURS_UNSHEETED, hAt(t));
  return {
    factor: (row, t) => base.factor(row, t),
    integral: (row, a, b) => {
      const first = cuts[0] ?? -Infinity;
      if (!(b > first)) return base.integral(row, a, b) * (cuts.length ? 1 : shareAt((a + b) / 2));
      let sum = a < first ? base.integral(row, a, first) : 0;
      let x = Math.max(a, first);
      for (const c of [...cuts.filter((t) => t > x && t < b), b]) {
        if (c > x) sum += base.integral(row, x, c) * shareAt((x + c) / 2);
        x = Math.max(x, c);
      }
      return sum;
    },
  };
}

/**
 * A long-lived NPC's experience past the training stop (D-507): what a mental or social stat at `level` gains by `age` (real
 * years). Nothing for the short-lived, before the stop, for a stat it does not have, or for one already at the target.
 */
export function lifeExperience(species: SpeciesDef, skillId: string, level: number, age: number): number {
  const x = LIFE_EXPERIENCE;
  if (species.lifespan <= x.lifespan || !x.skills.includes(skillId) || level < x.from || level >= x.target) return 0;
  const years = age - ageFromTraining(species, x.stopAt);
  if (years <= 0) return 0;
  return Math.min(x.cap, (x.target - level) * (1 - Math.exp(-years / x.tau)));
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
