// Lasting injuries and adaptation (progression-numbers §18; health §7). Pure. A lasting injury sets base penalties P
// on the skill groups it affects; adaptation A (0-1, capped by the aid) reduces them: effective = P x (1 - A).
import {
  ADAPTATION,
  AID_CAP,
  LASTING_FROM_PART,
  LASTING_PENALTIES,
  type Aid,
  type BodyPart,
  type LastingKind,
} from '../data/health.config';
import { skillTargets, type Wound } from './wounds';

export interface LastingInjury {
  id: string;
  kind: LastingKind;
  part: BodyPart;
  adaptation: number;
  aid: Aid;
  /** Adaptation gained on `adaptDay` (for the 3%/day cap). */
  adaptedToday: number;
  adaptDay: number;
  day: number;
}

export const aidCap = (l: LastingInjury): number => AID_CAP[l.aid];

/** The lasting kind a healed wound leaves; a severed limb is always a lost hand, arm or leg. */
export function lastingKindFor(w: Wound): LastingKind {
  if (w.severed) return w.part.endsWith('Hand') ? 'lostHand' : w.part.endsWith('Leg') ? 'lostLeg' : 'lostArm';
  return LASTING_FROM_PART[w.part];
}

/** Effective penalty of one injury on a skill: the largest matching P x (1 - A). */
export function lastingPenaltyOf(l: LastingInjury, skillId: string): number {
  const targets = skillTargets(skillId);
  let p = 0;
  for (const [t, v] of Object.entries(LASTING_PENALTIES[l.kind])) if (targets.has(t)) p = Math.max(p, v ?? 0);
  return p * (1 - l.adaptation);
}

/** Combined lasting penalty on a skill (multiplicative across injuries). */
export function lastingPenalty(ls: readonly LastingInjury[], skillId: string): number {
  return 1 - ls.reduce((keep, l) => keep * (1 - lastingPenaltyOf(l, skillId)), 1);
}

/** The skills an injury affects (for adaptation training and routine adjustments). */
export function lastingAffects(l: LastingInjury, skillId: string): boolean {
  return lastingPenaltyOf({ ...l, adaptation: 0 }, skillId) > 0;
}

/** +1% per effective hour of training the affected skills, at most 3% a day, up to the aid's cap. */
export function adapt(l: LastingInjury, effectiveHours: number, day: number): LastingInjury {
  const usedToday = l.adaptDay === day ? l.adaptedToday : 0;
  const room = Math.max(0, ADAPTATION.perDayMax - usedToday);
  const gain = Math.min(room, Math.max(0, effectiveHours) * ADAPTATION.perHour, Math.max(0, aidCap(l) - l.adaptation));
  return { ...l, adaptation: l.adaptation + gain, adaptedToday: usedToday + gain, adaptDay: day };
}
