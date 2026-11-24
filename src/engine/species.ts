// Species scaling (spec/species.md §1, D-103): every species reuses the Human tables, rescaled by a
// Human-equivalent age h and bodyScale. Pure.
import { FORCE_BOOST, HUMAN_BODY_CAP, NATURAL_CHARISMA, NATURAL_INTELLIGENCE, NATURAL_PHYSICAL_FACTOR, NATURAL_WILLPOWER } from '../data/progression.config';
import { PRIME_H } from '../data/ageing.config';
import { SKILL_BY_ID, type PhysicalStat } from '../data/skills';
import { HUMAN_MATURITY, humanEquivalentAge, speciesAgeFromHuman, speciesDef } from '../data/species';
import { bodyAge, bodyDecline, isPhysicalStat } from './ageing';
import { FORCE_XP_TRIAL } from './forceXpTrial';
import { interp } from './interp';

/** Human-equivalent age and its inverse (species.md §1, D-103); defined in src/data/species (the data layer reads it too). */
export { humanEquivalentAge, speciesAgeFromHuman };

/**
 * Resist Aging (lore L-02; the ability arrives in M6): while maintained, h advances at 0.5x past
 * maturity; after a lapse it catches up at 2x until it reaches the true value. `trueDelta` is how
 * much the unresisted h advanced over the step.
 */
export function resistAgingStep(h: number, trueH: number, trueDelta: number, maintained: boolean): number {
  if (maintained) return h >= HUMAN_MATURITY ? h + 0.5 * trueDelta : Math.min(trueH, h + trueDelta);
  return h < trueH ? Math.min(trueH, h + 2 * trueDelta) : trueH;
}

/** The Human body cap at a body age (Human-equivalent): the growth table, then the decline after prime (D-472). */
export function humanBodyCap(body: number, stat: PhysicalStat = 'strength'): number {
  return interp(HUMAN_BODY_CAP, body) * (1 - bodyDecline(stat, body));
}

/** Body cap for a physical stat at a body age: (Human cap * bodyScale + the species' capBonus), all of it declining after prime. */
export function bodyCapAt(speciesId: string, stat: PhysicalStat, body: number): number {
  const s = speciesDef(speciesId);
  return (interp(HUMAN_BODY_CAP, body) * s.bodyScale + (s.capBonus[stat] ?? 0)) * (1 - bodyDecline(stat, body));
}

/** Body cap for a physical stat at an age, with the Force Control that slows the body's ageing. */
export const bodyCap = (speciesId: string, stat: PhysicalStat, age: number, forceControl = 0): number => bodyCapAt(speciesId, stat, bodyAge(speciesDef(speciesId), age, forceControl));

/** Natural baseline (progression-numbers §11a): physical 0.5 x body cap (its peak from prime on: the age loss is taken off the level, D-472), Willpower, Intelligence and Charisma by h (D-427), others 0. */
export function naturalLevel(skillId: string, speciesId: string, age: number): number {
  const s = speciesDef(speciesId);
  const h = humanEquivalentAge(s, age);
  if (isPhysicalStat(skillId)) return NATURAL_PHYSICAL_FACTOR * bodyCapAt(speciesId, skillId, Math.min(h, PRIME_H));
  if (skillId === 'willpower') return interp(NATURAL_WILLPOWER, h);
  // D-427: a small natural Intelligence and Charisma (schooling and life; invented).
  if (skillId === 'intelligence') return interp(NATURAL_INTELLIGENCE, h);
  if (skillId === 'charisma') return interp(NATURAL_CHARISMA, h);
  return 0;
}

/**
 * Force boost (§11): min(45, 0.3 * max(0, FC - 40) + 0.2 * Force body-ability level). With the Force XP trial on
 * (off in the game until M6 integration; D-335), FC is read capped at 115: the ceiling removal
 * stays for Force abilities and only the physical boost saturates.
 */
export function forceBoost(forceControl: number, bodyAbilityLevel: number): number {
  const fc = FORCE_XP_TRIAL.enabled ? Math.min(forceControl, FORCE_XP_TRIAL.physicalBoostFcCap) : forceControl;
  return Math.min(FORCE_BOOST.max, FORCE_BOOST.fcPer * Math.max(0, fc - FORCE_BOOST.fcFrom) + FORCE_BOOST.bodyPer * Math.max(0, bodyAbilityLevel));
}

/** Physical performance = min(level less the age loss, body cap) + Force boost (§11, D-472). Other skills pass through. */
export function physicalPerformance(skillId: string, level: number, cap: number, boost: number, loss = 0): number {
  if (SKILL_BY_ID.get(skillId)?.category !== 'physical') return level;
  return Math.min(level * (1 - loss), cap) + boost;
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
