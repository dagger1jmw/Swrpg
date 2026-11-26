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
import { AID_DAMAGED_SHARE, TREATMENT, type AidCondition } from '../data/medicine.config';
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
  /** A minor lasting injury (the treatment roll, D-511): TREATMENT.minorPenaltyShare of the kind's penalties. */
  minor?: boolean;
  /** A fitted aid's condition (D-511): damaged halves its adaptation; broken counts as no aid. */
  aidCondition?: AidCondition;
}

export const aidCap = (l: LastingInjury): number => AID_CAP[l.aid];
/** A prosthetic replaces the limb (basic or cybernetic, or the off-hand retraining); none and scar tissue do not. */
export const isFittedAid = (aid: Aid): boolean => aid !== 'none' && aid !== 'scarTissue';

/** The lasting kind a healed wound leaves; a severed limb is always a lost hand, arm or leg. */
export function lastingKindFor(w: Wound): LastingKind {
  if (w.severed) return w.part.endsWith('Hand') ? 'lostHand' : w.part.endsWith('Leg') ? 'lostLeg' : 'lostArm';
  return LASTING_FROM_PART[w.part];
}

/** A lost arm takes its hand with it. */
const LIMB_WITH: Partial<Record<BodyPart, BodyPart>> = { leftArm: 'leftHand', rightArm: 'rightHand' };
const LOST_KINDS: readonly LastingKind[] = ['lostHand', 'lostArm', 'lostLeg'];

/**
 * Limb state for hit location (health §5, D-164): limbs severed earlier in this fight are gone (they cannot be hit or
 * severed again); limbs lost before it carry a prosthetic (their aid), which a hit damages instead of the body
 * (equipment damage arrives with M8; until then such a hit costs Vitality only).
 */
export function limbState(wounds: readonly Wound[], lasting: readonly LastingInjury[]): { gone: Set<BodyPart>; prosthetic: Set<BodyPart> } {
  const add = (set: Set<BodyPart>, part: BodyPart): void => {
    set.add(part);
    const with_ = LIMB_WITH[part];
    if (with_) set.add(with_);
  };
  const gone = new Set<BodyPart>();
  const prosthetic = new Set<BodyPart>();
  for (const w of wounds) if (w.severed) add(gone, w.part);
  // A broken prosthetic (D-511) takes no hits for the body: the limb counts as gone until it is repaired.
  for (const l of lasting) if (LOST_KINDS.includes(l.kind)) add(l.aidCondition === 'broken' ? gone : prosthetic, l.part);
  for (const p of gone) prosthetic.delete(p);
  return { gone, prosthetic };
}

/** The adaptation that counts: a damaged aid's at AID_DAMAGED_SHARE, a broken aid's none (D-511). */
export const effectiveAdaptation = (l: Pick<LastingInjury, 'adaptation' | 'aidCondition'>): number => (l.aidCondition === 'broken' ? 0 : l.aidCondition === 'damaged' ? l.adaptation * AID_DAMAGED_SHARE : l.adaptation);

/** Effective penalty of one injury on a skill: the largest matching P x (1 - A); a minor injury a share of it (D-511). */
export function lastingPenaltyOf(l: LastingInjury, skillId: string): number {
  const targets = skillTargets(skillId);
  let p = 0;
  for (const [t, v] of Object.entries(LASTING_PENALTIES[l.kind])) if (targets.has(t)) p = Math.max(p, v ?? 0);
  return p * (l.minor ? TREATMENT.minorPenaltyShare : 1) * (1 - effectiveAdaptation(l));
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

/** What a fighter's body can no longer do, for the narrator's block and the narration check (D-237). */
export interface LastingState {
  /** A leg is gone and nothing replaces it. */
  cannotStand: boolean;
  /** Limbs that are gone with no prosthetic (a lost arm includes its hand). */
  missing: BodyPart[];
  /** In words: "cannot stand: severed left leg", "no right arm". */
  text: string[];
}

const partWords = (p: BodyPart): string => p.replace(/([A-Z])/g, ' $1').toLowerCase();

/**
 * The lasting state of a body (D-237): limbs severed and not yet replaced (fresh severed wounds, and lost limbs with no
 * aid or only scar tissue). A limb with a prosthetic is not missing: its owner stands and uses it.
 */
export function lastingState(wounds: readonly Wound[], lasting: readonly LastingInjury[]): LastingState {
  const fresh = new Set<BodyPart>();
  const old = new Set<BodyPart>();
  // A severed limb that already has a prosthetic on record (health gives the faction's aid at once, D-164) is not missing.
  // A broken prosthetic (D-511) works no better than none until it is repaired.
  const works = (l: LastingInjury): boolean => isFittedAid(l.aid) && l.aidCondition !== 'broken';
  const fitted = new Set(lasting.filter((l) => LOST_KINDS.includes(l.kind) && works(l)).map((l) => l.part));
  for (const w of wounds) if (w.severed && !fitted.has(w.part)) fresh.add(w.part);
  for (const l of lasting) if (LOST_KINDS.includes(l.kind) && !works(l) && !fresh.has(l.part)) old.add(l.part);
  const text: string[] = [];
  const missing: BodyPart[] = [];
  for (const [set, word] of [[fresh, 'severed'], [old, 'no']] as const) {
    for (const p of set) {
      missing.push(p);
      const with_ = LIMB_WITH[p];
      if (with_ && !missing.includes(with_)) missing.push(with_);
      const leg = p.endsWith('Leg');
      text.push(leg ? `cannot stand: ${word} ${partWords(p)}` : word === 'severed' ? `no ${partWords(p)} (severed)` : `no ${partWords(p)}`);
    }
  }
  return { cannotStand: missing.some((p) => p.endsWith('Leg')), missing, text };
}
