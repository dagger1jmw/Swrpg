// Closed-form skill level (npc-generation §1, D-43, D-105): measured phase paces and the exact
// age-factor integral, on the Human-equivalent age. Mirrors docs-v2/calc/npc-closed-form.mjs. Pure.
import { CLOSED_FORM, CURVE_EXP, PACE_CAP } from '../data/progression.config';
import type { AgeRow } from '../data/skills';
import { ageFactor, ageIntegral } from './ageFactor';

export const A_REF = ageIntegral('technique', CLOSED_FORM.refStart, CLOSED_FORM.refEnd);

export interface PacePhase {
  from: number;
  to: number;
  pace: number;
}

export interface ClosedFormInput {
  row: AgeRow;
  startAge: number;
  age: number;
  phases: readonly PacePhase[];
  /** Talent, species, state: multiplies every phase pace (each phase capped at 4.0). */
  mult?: number;
  warYears?: number;
}

/** level = 41 * ((sum of pace * A(row, phase within [start, age]) + 0.3 * war * pace now * a(age)) / A_ref)^(1/1.75). */
export function closedFormLevel(input: ClosedFormInput): number {
  const { row, startAge, age, phases, mult = 1, warYears = 0 } = input;
  let s = 0;
  let paceNow = 0;
  for (const ph of phases) {
    const p = Math.min(PACE_CAP, ph.pace * mult);
    const a = Math.max(startAge, ph.from);
    const b = Math.min(age, ph.to);
    if (b > a) s += p * ageIntegral(row, a, b);
    if (age > ph.from && age <= ph.to) paceNow = p;
  }
  s += CLOSED_FORM.warFactor * warYears * paceNow * ageFactor(row, age);
  return CLOSED_FORM.referenceLevel * Math.pow(Math.max(0, s / A_REF), 1 / CURVE_EXP);
}

/** Phases from per-phase paces and rank ages (initiate before padawanAge, padawan before knightAge). */
export function phasesFor(
  paces: { initiate?: number | undefined; padawan?: number | undefined; knight?: number | undefined },
  ages: { padawanAge: number; knightAge: number },
  onePhase: boolean,
): PacePhase[] {
  if (onePhase) return [{ from: -Infinity, to: Infinity, pace: paces.knight ?? 0 }];
  return [
    { from: -Infinity, to: ages.padawanAge, pace: paces.initiate ?? 0 },
    { from: ages.padawanAge, to: ages.knightAge, pace: paces.padawan ?? 0 },
    { from: ages.knightAge, to: Infinity, pace: paces.knight ?? 0 },
  ];
}
