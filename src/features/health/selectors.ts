import { tirednessLabel, type Meters } from '../../engine/fatigue';
import { forceFraction } from '../../engine/forceMeter';
import type { GameState } from '../../state/gameState';
import { SKILL_IDS } from '../../data/skills';
import { aidCap, lastingAffects, lastingPenalty, type LastingInjury } from '../../engine/lasting';
import { maxVitality } from '../../engine/vitality';
import { isDying, isIncapacitated, locationPenalty, statusLabel, woundLoad, woundPenalty, type Wound } from '../../engine/wounds';
import { selectBodyAbilityLevel, selectCapacities, selectLevelExact, selectPerformance } from '../progression/selectors';
import type { HealthSlice } from './health';

export const selectMeters = (s: GameState): Meters => s.health.meters;

export interface Fatigue {
  p: number;
  m: number;
  f: number;
  capacity: { p: number; m: number; f: number };
  labels: { p: string; m: string; f: string };
}

/** Meter fractions f = meter / capacity and their labels (derived, never stored). */
export function selectFatigue(s: GameState): Fatigue {
  const caps = selectCapacities(s);
  const m = s.health.meters;
  const p = m.p / caps.p;
  const mm = m.m / caps.m;
  const f = forceFraction(m.f, caps.f);
  return { p, m: mm, f, capacity: caps, labels: { p: tirednessLabel(p), m: tirednessLabel(mm), f: tirednessLabel(f) } };
}

/** Day-end tiredness for the overtraining streak: the higher of the physical and mental fractions. */
export const selectMaxFraction = (s: GameState): number => {
  const f = selectFatigue(s);
  return Math.max(f.p, f.m);
};

// ---- Vitality, wounds and status (health §3-6; M5). All derived; nothing here is stored. ----

export function selectMaxVitality(s: GameState): number {
  return maxVitality({ endurance: selectPerformance(s, 'endurance'), strength: selectPerformance(s, 'strength'), bodyAbility: selectBodyAbilityLevel(s) });
}
export const selectVitality = (s: GameState): number => Math.max(0, selectMaxVitality(s) - s.health.vitalityLost);
export const selectIsSpent = (s: GameState): boolean => selectVitality(s) <= 0;
export const selectWounds = (s: GameState): readonly Wound[] => s.health.wounds as readonly Wound[];
export const selectLasting = (s: GameState): readonly LastingInjury[] => s.health.lasting as readonly LastingInjury[];
export const selectStatusLabel = (s: GameState): string => (s.health.death ? 'Dead' : statusLabel(selectWounds(s)));
export const selectWoundLoad = (s: GameState): number => woundLoad(selectWounds(s));
export const selectIsDying = (s: GameState): boolean => s.health.death === null && isDying(selectWounds(s));
export const selectIsIncapacitated = (s: GameState): boolean => isIncapacitated(selectWounds(s));
export const selectDeath = (s: GameState): HealthSlice['death'] => s.health.death;
/** The total wound penalty on a skill (rolls §1): status + location, less Willpower resistance, capped at 50%. */
export const selectWoundPenalty = (s: GameState, skillId: string): number => woundPenalty(selectWounds(s), skillId, { willpower: selectLevelExact(s, 'willpower') });
/** The lasting-injury penalty on a skill (progression-numbers §18). */
export const selectLastingPenalty = (s: GameState, skillId: string): number => lastingPenalty(selectLasting(s), skillId);

/**
 * Skills the routine must not train normally (training-routines §6): those a moderate-or-worse wound penalizes
 * (rest until healed), and those a lasting injury affects (adaptation training).
 */
export function selectInjuredSkills(s: GameState): { rest: string[]; adapt: string[] } {
  const wounds = selectWounds(s).filter((w) => w.severity !== 'minor');
  const rest = SKILL_IDS.filter((id) => wounds.some((w) => locationPenalty([w], id) > 0));
  const adapt = SKILL_IDS.filter((id) => !rest.includes(id) && selectLasting(s).some((l) => lastingAffects(l, id) && l.adaptation < aidCap(l) - 1e-9));
  return { rest, adapt };
}

/** The wound and lasting-injury schemas, shared with NPC health (npcs feature; the same shape, health §9). */
export { lastingSchema, woundSchema } from './health';
