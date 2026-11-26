// Species scaling (spec/species.md §1, D-103): every species reuses the Human tables, rescaled by a
// Human-equivalent age h and bodyScale. Pure.
import { FORCE_BOOST, HUMAN_BODY_CAP, NATURAL_CHARISMA, NATURAL_INTELLIGENCE, NATURAL_PHYSICAL_FACTOR, NATURAL_WILLPOWER } from '../data/progression.config';
import { FULL_LIFE_H, PRIME_H } from '../data/ageing.config';
import { SKILLS, SKILL_BY_ID, type PhysicalStat } from '../data/skills';
import { HUMAN_MATURITY, ageFromTraining, humanEquivalentAge, speciesAgeFromHuman, speciesDef, trainingAge, type SpeciesDef } from '../data/species';
import type { AgeRow } from '../data/skills';
import { ageFactor, ageIntegral } from './ageFactor';
import { bodyAge, bodyDecline, isPhysicalStat } from './ageing';
import { FORCE_XP_TRIAL } from './forceXpTrial';
import { interp } from './interp';

/** Human-equivalent age, training age (D-474) and their inverses (species.md §1); defined in src/data/species (the data layer reads them too). */
export { ageFromTraining, humanEquivalentAge, speciesAgeFromHuman, trainingAge };

/** The learning factor of an age row at a training age: the body's row reads the Human-equivalent age, the rest the training age (D-474). */
export function trainingAgeFactor(species: SpeciesDef, row: AgeRow, t: number): number {
  return ageFactor(row, row === 'physical' ? humanEquivalentAge(species, ageFromTraining(species, t)) : t);
}

/**
 * Age-weighted training between two training ages, in real years (D-474): the integral of the row's factor over the
 * years lived. A childhood shorter than a Human's counts its own years, a longer one a Human's (D-508); the body's row follows h. For a Human
 * it is ageIntegral.
 */
export function trainingIntegral(species: SpeciesDef, row: AgeRow, a: number, b: number): number {
  if (!(b > a)) return 0;
  const mid = Math.min(b, Math.max(a, HUMAN_MATURITY));
  // A childhood counts its own years, but never more than a Human child's (Jared, D-508): a Hutt's 200 years train as 18.
  const w = Math.min(1, species.maturity / HUMAN_MATURITY);
  const child = mid > a ? w * ageIntegral(row, a, mid) : 0;
  if (!(b > mid)) return child;
  if (row !== 'physical') return w === 1 ? ageIntegral(row, a, b) : child + ageIntegral(row, mid, b);
  // Adult years of the body's row: h runs in straight lines between adult, prime and a full life (and on past it).
  const h = (t: number): number => humanEquivalentAge(species, ageFromTraining(species, t));
  const cuts = [PRIME_H, FULL_LIFE_H].map((x) => trainingAge(species, speciesAgeFromHuman(species, x))).filter((t) => t > mid && t < b);
  let sum = child;
  let from = mid;
  for (const to of [...cuts, b]) {
    const dh = h(to) - h(from);
    sum += dh > 0 ? (ageIntegral(row, h(from), h(to)) * (to - from)) / dh : 0;
    from = to;
  }
  return sum;
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

/** The Human body cap at a body age (Human-equivalent): the growth table, then the decline after prime (D-472). */
export function humanBodyCap(body: number, stat: PhysicalStat = 'strength'): number {
  return interp(HUMAN_BODY_CAP, body) * (1 - bodyDecline(stat, body));
}

/** The peak of a Human's growth table. */
const HUMAN_PEAK = HUMAN_BODY_CAP[HUMAN_BODY_CAP.length - 1]![1];

/**
 * Body cap for a physical stat at a body age, declining after prime: the ceiling the lore gives (D-474), reached along the
 * Human growth table, else the Human cap (x bodyScale for Endurance alone) + the species' capBonus.
 */
export function bodyCapAt(speciesId: string, stat: PhysicalStat, body: number): number {
  const s = speciesDef(speciesId);
  const human = interp(HUMAN_BODY_CAP, body);
  const ceiling = s.ceilings?.[stat];
  const grown = ceiling !== undefined ? (human / HUMAN_PEAK) * ceiling : human * (stat === 'endurance' ? s.bodyScale : 1) + (s.capBonus[stat] ?? 0);
  return grown * (1 - bodyDecline(stat, body));
}

/** Body cap for a physical stat at an age, with the Force Control that slows the body's ageing. */
export const bodyCap = (speciesId: string, stat: PhysicalStat, age: number, forceControl = 0): number => bodyCapAt(speciesId, stat, bodyAge(speciesDef(speciesId), age, forceControl));

/** Natural baseline (progression-numbers §11a): physical 0.5 x body cap (its peak from prime on: the age loss is taken off the level, D-472), Willpower, Intelligence and Charisma by the training age (D-427, D-474), others 0. */
export function naturalLevel(skillId: string, speciesId: string, age: number): number {
  const s = speciesDef(speciesId);
  if (isPhysicalStat(skillId)) return NATURAL_PHYSICAL_FACTOR * bodyCapAt(speciesId, skillId, Math.min(humanEquivalentAge(s, age), PRIME_H));
  const t = trainingAge(s, age);
  if (skillId === 'willpower') return interp(NATURAL_WILLPOWER, t);
  // D-427: a small natural Intelligence and Charisma (schooling and life; invented).
  if (skillId === 'intelligence') return interp(NATURAL_INTELLIGENCE, t);
  if (skillId === 'charisma') return interp(NATURAL_CHARISMA, t);
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

const BODY_ABILITIES: readonly string[] = SKILLS.filter((s) => s.bodyAbility).map((s) => s.id);

/**
 * An NPC's physical stat as it performs (D-495): its level, which already holds the body's cap and its age, plus the same
 * Force boost the player has. Nobody without the Force has any. `forceBody`: a canon sheet's Force Body, which has no skill
 * of its own yet (the boost its sheet's stat was lowered by).
 */
export function npcPerformance(levels: Readonly<Record<string, number>>, stat: string, forceBody = 0): number {
  return (levels[stat] ?? 0) + forceBoost(levels['forceControl'] ?? 0, Math.max(forceBody, ...BODY_ABILITIES.map((id) => levels[id] ?? 0)));
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
