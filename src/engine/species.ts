// Species scaling (spec/species.md §1, D-103): every species reuses the Human tables, rescaled by a
// Human-equivalent age h and bodyScale. Pure.
import { FORCE_BOOST, HUMAN_BODY_CAP, NATURAL_PHYSICAL_FACTOR, NATURAL_WILLPOWER } from '../data/progression.config';
import { SKILL_BY_ID, type PhysicalStat } from '../data/skills';
import { speciesDef, type SpeciesDef } from '../data/species';
import { interp } from './interp';

const HUMAN_MATURITY = 18;
const HUMAN_SPAN = 82;

/** Human-equivalent age: childhood at the species' own pace, then 82 years spread over the rest of the lifespan. */
export function humanEquivalentAge(species: SpeciesDef, age: number): number {
  if (age < species.maturity) return (age * HUMAN_MATURITY) / species.maturity;
  return HUMAN_MATURITY + ((age - species.maturity) * HUMAN_SPAN) / (species.lifespan - species.maturity);
}

/**
 * Resist Aging (lore L-02; the ability arrives in M6): while maintained, h advances at 0.5x past
 * maturity; after a lapse it catches up at 2x until it reaches the true value. `trueDelta` is how
 * much the unresisted h advanced over the step.
 */
export function resistAgingStep(h: number, trueH: number, trueDelta: number, maintained: boolean): number {
  if (maintained) return h >= HUMAN_MATURITY ? h + 0.5 * trueDelta : Math.min(trueH, h + trueDelta);
  return h < trueH ? Math.min(trueH, h + 2 * trueDelta) : trueH;
}

export function humanBodyCap(h: number): number {
  return interp(HUMAN_BODY_CAP, h);
}

/** Body cap for a physical stat: Human cap(h) * bodyScale + the species' capBonus. */
export function bodyCap(speciesId: string, stat: PhysicalStat, age: number, h = humanEquivalentAge(speciesDef(speciesId), age)): number {
  const s = speciesDef(speciesId);
  return humanBodyCap(h) * s.bodyScale + (s.capBonus[stat] ?? 0);
}

/** Natural baseline (progression-numbers §11a): physical 0.5 x body cap, Willpower by h, others 0. */
export function naturalLevel(skillId: string, speciesId: string, age: number): number {
  const s = speciesDef(speciesId);
  const h = humanEquivalentAge(s, age);
  if (skillId === 'strength' || skillId === 'agility' || skillId === 'endurance') return NATURAL_PHYSICAL_FACTOR * bodyCap(speciesId, skillId, age, h);
  if (skillId === 'willpower') return interp(NATURAL_WILLPOWER, h);
  return 0;
}

/** Force boost (§11): min(45, 0.3 * max(0, FC - 40) + 0.2 * Force body-ability level). */
export function forceBoost(forceControl: number, bodyAbilityLevel: number): number {
  return Math.min(FORCE_BOOST.max, FORCE_BOOST.fcPer * Math.max(0, forceControl - FORCE_BOOST.fcFrom) + FORCE_BOOST.bodyPer * Math.max(0, bodyAbilityLevel));
}

/** Physical performance = min(level, body cap) + Force boost (§11). Other skills pass through. */
export function physicalPerformance(skillId: string, level: number, cap: number, boost: number): number {
  if (SKILL_BY_ID.get(skillId)?.category !== 'physical') return level;
  return Math.min(level, cap) + boost;
}

/** Species learning factor for a skill (species.md §3; inside the 2.8 cap). */
export function speciesLearning(speciesId: string, skillId: string): number {
  const s = speciesDef(speciesId);
  const skill = SKILL_BY_ID.get(skillId);
  let f = 1;
  for (const l of s.learning) {
    const t = l.target;
    if ((t.kind === 'skill' && t.skill === skillId) || (t.kind === 'category' && skill?.category === t.category) || (t.kind === 'side' && skill?.side === t.side)) f *= l.factor;
  }
  return f;
}

/** The inverse of humanEquivalentAge: the species age at which h is reached. */
export function speciesAgeFromHuman(species: SpeciesDef, h: number): number {
  if (h < HUMAN_MATURITY) return (h * species.maturity) / HUMAN_MATURITY;
  return species.maturity + ((h - HUMAN_MATURITY) * (species.lifespan - species.maturity)) / HUMAN_SPAN;
}
