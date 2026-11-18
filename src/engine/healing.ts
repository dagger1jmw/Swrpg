// Healing over time (health.md §7; D-150). Pure. Healing runs day by day through the clock; a minor wound also heals
// overnight on 7h+ sleep. Multipliers: medical care x2, a bacta tank x4 that replaces medical care, a Force healer on
// top x(1 + level / 50), training the injured part x0.5; the combined multiplier is capped at x6.
import { HEAL_DAYS, HEAL_MULT, LASTING_CHANCE, VITALITY_RECOVERY } from '../data/health.config';
import { effectiveSeverity, type Wound } from './wounds';

export type CareKind = 'none' | 'medical' | 'bacta';

export interface HealConditions {
  care: CareKind;
  /** A Force healer's level in Force Heal (Others), or null. */
  healerLevel?: number | null;
  trainingInjured?: boolean;
}

export function healMultiplier(c: HealConditions): number {
  const base = c.care === 'bacta' ? HEAL_MULT.bacta : c.care === 'medical' ? HEAL_MULT.medical : 1;
  const healer = c.healerLevel ? 1 + c.healerLevel * HEAL_MULT.forceHealerPerLevel : 1;
  const training = c.trainingInjured ? HEAL_MULT.trainingInjured : 1;
  return Math.min(HEAL_MULT.cap, base * healer * training);
}

/** Base healing days at rest. A minor wound's base is one day (bacta: 6 hours, health §7); it also heals overnight. */
export function baseHealDays(w: Wound): number {
  if (w.stabilized) return HEAL_DAYS.stabilizedMortal;
  const sev = effectiveSeverity(w);
  return sev === 'minor' ? 1 : HEAL_DAYS[sev];
}

/** Heal progress after `days` at multiplier `mult` (1 = healed). */
export function progressHealing(w: Wound, days: number, mult: number): Wound {
  return { ...w, healProgress: Math.min(1, w.healProgress + (Math.max(0, days) * mult) / baseHealDays(w)) };
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
