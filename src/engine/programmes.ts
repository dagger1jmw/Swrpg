// Training programmes (m8-skills, D-513; spec/skills-m8.md section 6). Pure: who may enrol, when the programme ends (it
// runs its length in standard years), and its curriculum as the routine's fill shares while enrolled.
import { DAYS_PER_YEAR } from './calendar';
import { programmeYears, type TrainingProgramme } from '../data/trainingProgrammes';
import type { SpeciesId } from '../data/entities.config';

/** Null when the character may enrol, else the reason. */
export function programmeEntry(p: TrainingProgramme, x: { age: number; year: number; species: SpeciesId; archetype: string }): string | null {
  if (p.from !== null && x.year < p.from) return `${p.name} does not exist yet`;
  if (p.to !== null && x.year > p.to) return `${p.name} no longer exists`;
  const e = p.entry;
  if (e.species && !e.species.includes(x.species)) return `${p.name}: ${e.note}`;
  if (e.archetypes && !e.archetypes.includes(x.archetype)) return `${p.name}: ${e.note}`;
  if (e.minAge !== undefined && x.age + 1e-9 < e.minAge) return `${p.name}: from age ${e.minAge}`;
  if (e.maxAge !== undefined && x.age > e.maxAge + 1) return `${p.name}: entry by age ${e.maxAge}`;
  return null;
}

/** The day the programme ends when begun on `startDay`: its length in standard years (368 days). */
export const programmeEndDay = (p: TrainingProgramme, startDay: number): number => startDay + Math.round(programmeYears(p) * DAYS_PER_YEAR);

/** The curriculum as fill shares (sum 1). */
export function programmeShares(p: TrainingProgramme): Record<string, number> {
  const tot = Object.values(p.curriculum).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(p.curriculum).map(([k, v]) => [k, v / tot]));
}
