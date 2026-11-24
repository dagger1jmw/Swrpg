// Ageing (species.md section 1; D-472): body age, the physical decline after prime, the Force's stretch of it. Pure.
import { AGE_TRAINING, ASSUMED_TRAINING, BODY_DECLINE, FORCE_EXTENSION, FULL_LIFE_H, PRIME_H } from '../data/ageing.config';
import { PHYSICAL_STATS, type PhysicalStat } from '../data/skills';
import { humanEquivalentAge, type SpeciesDef } from '../data/species';
import { interp } from './interp';

export const isPhysicalStat = (id: string): id is PhysicalStat => (PHYSICAL_STATS as readonly string[]).includes(id);

/** The Human-equivalent years Force Control adds to the span after prime. */
export const forceExtension = (forceControl: number): number => interp(FORCE_EXTENSION, forceControl);

/** Body age = prime + (h - prime) x (normal decline span / extended decline span); the years up to prime never stretch. */
export function bodyAgeFromH(h: number, forceControl: number, lifespanIncludesForce = false): number {
  if (h <= PRIME_H) return h;
  const span = FULL_LIFE_H - PRIME_H;
  return PRIME_H + ((h - PRIME_H) * span) / (span + (lifespanIncludesForce ? 0 : forceExtension(forceControl)));
}

/** A character's body age (Human-equivalent) at an age, with its Force Control. */
export const bodyAge = (species: SpeciesDef, age: number, forceControl: number): number =>
  bodyAgeFromH(humanEquivalentAge(species, age), forceControl, species.lifespanIncludesForce === true);

/** The share of the peak the body itself has lost (0 up to prime). */
export const bodyDecline = (stat: PhysicalStat, body: number): number => interp(BODY_DECLINE[stat], body);

/** What training leaves of a loss: all of it untrained, less the kept share at full training. */
const lossKept = (share: number): number => 1 - AGE_TRAINING.keeps * Math.min(1, Math.max(0, share));

/** The share of a trained level lost to age, for a life trained at `share` (NPCs, and a character's life before play). */
export const ageLoss = (stat: PhysicalStat, body: number, share: number = ASSUMED_TRAINING): number => bodyDecline(stat, body) * lossKept(share);

export interface Ageing {
  /** The oldest body age reached: gaining Force Control later slows ageing, it never undoes it. */
  bodyAge: number;
  loss: Readonly<Record<PhysicalStat, number>>;
}

/** Ageing for a life lived before play. */
export const assumedAgeing = (body: number): Ageing => ({
  bodyAge: body,
  loss: { strength: ageLoss('strength', body), agility: ageLoss('agility', body), endurance: ageLoss('endurance', body) },
});

/** One day on: the loss grows with the body's decline, slowed by the last year's training of each stat, and never falls. */
export function ageingStep(prev: Ageing, bodyNow: number, hoursPerYear: (stat: PhysicalStat) => number): Ageing {
  const body = Math.max(prev.bodyAge, bodyNow);
  if (body === prev.bodyAge) return prev;
  const loss = { ...prev.loss };
  for (const s of PHYSICAL_STATS) {
    const d = bodyDecline(s, body) - bodyDecline(s, prev.bodyAge);
    if (d > 0) loss[s] = Math.min(1, loss[s] + d * lossKept(hoursPerYear(s) / AGE_TRAINING.fullHoursPerYear));
  }
  return { bodyAge: body, loss };
}
