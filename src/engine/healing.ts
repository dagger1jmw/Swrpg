// Healing over time (health.md §7; D-150; medicine.md, D-511). Pure. Healing runs day by day through the clock; a minor
// wound also heals overnight on 7h+ sleep. Multipliers: field care x1, medical care x2, a kolto tank x4 or a bacta tank x5
// that replaces medical care, a Force healer on top x(1 + level / 50), training the injured part x0.5; capped at x6.
// A wound's depth sets the severity it heals as; an unset bone, a toxin and retained shrapnel slow or stop it.
import { HEAL_DAYS, HEAL_MULT, LASTING_CHANCE, SEVERITIES, VITALITY_RECOVERY, type Severity } from '../data/health.config';
import { CARE_MULT, SURGERY, UNTREATED } from '../data/medicine.config';
import { healsAs, needsSetting } from './medicine';
import { effectiveSeverity, type Wound } from './wounds';

export type CareKind = 'none' | 'field' | 'medical' | 'kolto' | 'bacta';

export interface HealConditions {
  care: CareKind;
  /** A Force healer's level in Force Heal (Others), or null. */
  healerLevel?: number | null;
  trainingInjured?: boolean;
}

export function healMultiplier(c: HealConditions): number {
  const base = c.care === 'bacta' ? CARE_MULT.bacta : c.care === 'kolto' ? CARE_MULT.kolto : c.care === 'medical' ? CARE_MULT.facility : 1;
  const healer = c.healerLevel ? 1 + c.healerLevel * HEAL_MULT.forceHealerPerLevel : 1;
  const training = c.trainingInjured ? HEAL_MULT.trainingInjured : 1;
  return Math.min(HEAL_MULT.cap, base * healer * training);
}

/** The severity a wound heals as (D-511): its depth's, and one band lighter after a successful internal surgery. */
export function healSeverity(w: Wound): Severity {
  const sev = healsAs(effectiveSeverity(w), w.depth);
  if (!w.operated || SEVERITIES.indexOf(sev) < SEVERITIES.indexOf(SURGERY.internalFrom)) return sev;
  return SEVERITIES[SEVERITIES.indexOf(sev) - 1]!;
}

/** Base healing days at rest. A minor wound's base is one day (bacta: 6 hours, health §7); it also heals overnight. */
export function baseHealDays(w: Wound): number {
  // A stabilized mortal heals in 90 days; a successful internal surgery makes it a critical (D-511).
  if (w.stabilized) return w.operated ? HEAL_DAYS.critical : HEAL_DAYS.stabilizedMortal;
  const sev = healSeverity(w);
  return sev === 'minor' ? 1 : HEAL_DAYS[sev];
}

/**
 * The wound's own factor on the healing rate (D-511): 0 while a bone is unset or a toxin is in it; x0.5 while infected or with
 * shrapnel left in it.
 */
export function woundRateFactor(w: Wound): number {
  if (needsSetting(w) || w.toxin) return 0;
  return (w.infected ? UNTREATED.infectedMult : 1) * (w.fragments ? UNTREATED.infectedMult : 1);
}

/** Heal progress after `days` at multiplier `mult` (1 = healed), with the wound's own factor. */
export function progressHealing(w: Wound, days: number, mult: number): Wound {
  return { ...w, healProgress: Math.min(1, w.healProgress + (Math.max(0, days) * mult * woundRateFactor(w)) / baseHealDays(w)) };
}

/** Healed at 1 (with a small tolerance: seven days of 1/7 must heal a 7-day wound). */
export const isHealed = (w: Wound): boolean => w.healProgress >= 1 - 1e-9;

/** Minor wounds heal overnight on 7h+ sleep. */
export const healsOvernight = (w: Wound, sleptHours: number): boolean => effectiveSeverity(w) === 'minor' && sleptHours >= VITALITY_RECOVERY.fullSleepHours;

/** Chance that a healed wound leaves a lasting injury: severe 10%, critical 35%, mortal (stabilized) 70%. */
export function lastingChance(w: Wound): number {
  if (w.severed) return 0; // the loss is already a lasting injury
  if (w.stabilized) return LASTING_CHANCE.stabilizedMortal;
  return LASTING_CHANCE[w.severity] ?? 0;
}
