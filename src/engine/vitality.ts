// Vitality, the short-term buffer (health.md §3). Pure. Vitality can never cause death or incapacitation.
import { VITALITY, VITALITY_RECOVERY } from '../data/health.config';

export interface VitalityInputs {
  endurance: number;
  strength: number;
  /** The Force body-ability level (progression-numbers §11). */
  bodyAbility: number;
}

/** Max Vitality = 20 + 0.6 End + 0.3 Str + 0.2 body ability (youngling 32, Knight 63.5, Master 97). */
export function maxVitality(i: VitalityInputs): number {
  return VITALITY.base + VITALITY.endurance * i.endurance + VITALITY.strength * i.strength + VITALITY.bodyAbility * i.bodyAbility;
}

/**
 * Max Vitality with the lasting injuries' Endurance penalty (Jared, D-255, design default): max x (1 - the combined
 * lasting Endurance penalty), each injury's P x (1 - adaptation) (a lost leg 0.15, burns or lung damage 0.4).
 */
export function maxVitalityWithLasting(max: number, lastingEndurancePenalty: number): number {
  return max * (1 - Math.max(0, Math.min(1, lastingEndurancePenalty)));
}

export type VitalityRecovery = 'rest' | 'light' | 'combat';

/** Recovery over `hours`: rest 50% of max per hour, light activity 15%, none in combat. */
export function recoverVitality(current: number, max: number, hours: number, kind: VitalityRecovery): number {
  const rate = kind === 'rest' ? VITALITY_RECOVERY.restPerHour : kind === 'light' ? VITALITY_RECOVERY.lightPerHour : 0;
  return Math.min(max, current + rate * max * Math.max(0, hours));
}


