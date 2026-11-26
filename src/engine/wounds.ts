// Wounds, status and penalties (health.md §5-6, §8). Pure. Status is derived from the wound list on every read
// and never stored (health test 2).
import {
  DYING_TIMER,
  INCAPACITATED_LOAD,
  MINION_OUT_AT,
  SEVERITIES,
  SUPPRESSION_CRASH_MENTAL,
  LOCATION_PENALTY,
  MENTAL_SKILLS,
  PART_TARGETS,
  STATUS_LABELS,
  STATUS_PENALTY_PER_LOAD,
  WILLPOWER_SUPPRESSION,
  WOUND_LOAD,
  WOUND_PENALTY_CAP,
  type BodyPart,
  type PenaltyTarget,
  type Severity,
} from '../data/health.config';
import { SKILL_BY_ID } from '../data/skills';
import type { CareLevel, Toxin, WoundCause, WoundDepth } from '../data/medicine.config';

export interface Wound {
  id: string;
  part: BodyPart;
  severity: Severity;
  W: number;
  /** A mortal wound stabilized into a critical one (health §6). */
  stabilized: boolean;
  /** 0-1; the wound heals at 1. */
  healProgress: number;
  /** Absolute day the wound was taken. */
  day: number;
  source: string;
  /** The limb was severed (health §5): the wound is the cauterized stump; the loss is a lasting injury. */
  severed?: boolean;
  // ---- Medicine (M8 item 6, D-511; all optional, absent on older saves and wounds) ----
  /** What made it (the untreated risks): blade, claw, slug, shrapnel tear; blaster and saber burn. */
  cause?: WoundCause;
  /** How deep a cut goes: a partial cut heals as severe, a severed muscle or a bone as critical. */
  depth?: WoundDepth;
  /** A cut to the bone has been set (it heals only once set). */
  set?: boolean;
  /** Field care or better has dressed it: no untreated risks. */
  treated?: boolean;
  infected?: boolean;
  /** The best care it has had, and that care's operator (Medicine), for the treatment roll. */
  care?: CareLevel;
  operator?: number;
  /** A toxin in the wound: it does not heal until an antidote or a Force purge. */
  toxin?: Toxin;
  /** Shrapnel left in it: it heals at half rate until extracted. */
  fragments?: boolean;
  /** A successful internal surgery: it heals as one band lighter. */
  operated?: boolean;
}

/** A stabilized mortal counts as critical for load and status. */
export const effectiveSeverity = (w: Wound): Severity => (w.stabilized && w.severity === 'mortal' ? 'critical' : w.severity);

export function woundLoad(wounds: readonly Wound[]): number {
  return wounds.reduce((a, w) => a + WOUND_LOAD[effectiveSeverity(w)], 0);
}

export function statusLabel(wounds: readonly Wound[]): string {
  const load = woundLoad(wounds);
  for (const [min, label] of STATUS_LABELS) if (load >= min) return label;
  return 'Healthy';
}

export const isDying = (wounds: readonly Wound[]): boolean => wounds.some((w) => w.severity === 'mortal' && !w.stabilized);

/** Incapacitated: load 20+, or a critical wound (or worse) to the torso or head. Cannot fight. */
export function isIncapacitated(wounds: readonly Wound[]): boolean {
  if (woundLoad(wounds) >= INCAPACITATED_LOAD) return true;
  return wounds.some((w) => (w.part === 'torso' || w.part === 'head') && (effectiveSeverity(w) === 'critical' || effectiveSeverity(w) === 'mortal'));
}

/** Dying timer in minutes = 10 + Endurance / 10 (End 50: 15). */
export const dyingMinutes = (endurance: number): number => DYING_TIMER.baseMinutes + endurance / DYING_TIMER.perEndurance;

/** Stabilizing converts the unstabilized mortal wounds into stabilized critical ones. */
export function stabilize(wounds: readonly Wound[]): Wound[] {
  return wounds.map((w) => (w.severity === 'mortal' && !w.stabilized ? { ...w, stabilized: true, healProgress: 0 } : w));
}

/** Dead: a second mortal wound while Dying (the timer's expiry is checked by the health feature). */
export const killsWhileDying = (before: readonly Wound[], added: Wound): boolean => isDying(before) && added.severity === 'mortal';

/** The penalty targets a skill falls under (Docs/SW_Injury_System_v1.md:72-81 via health.config). */
export function skillTargets(skillId: string): Set<PenaltyTarget | string> {
  const def = SKILL_BY_ID.get(skillId);
  const t = new Set<PenaltyTarget | string>(['all', skillId]);
  if (!def) return t;
  if (def.kind === 'form') t.add('forms');
  if (skillId === 'melee') t.add('melee');
  if (skillId === 'strength') t.add('strength');
  if (skillId === 'agility') t.add('agility');
  if (def.category === 'force' || def.kind === 'forceAbility') t.add('force');
  if (MENTAL_SKILLS.includes(skillId)) t.add('mental');
  return t;
}

export interface PenaltyInputs {
  willpower: number;
  /** Active pain suppression (Control Pain, Battlemind ...; M6), as a fraction 0-0.8. */
  suppression?: number;
}

/**
 * How much of a wound's penalty is still felt (Jared, after combat pass 1; health §6 amended): the share still unhealed,
 * 1 - healProgress. Wound load (status labels, incapacitation) is not scaled.
 */
export const unhealedShare = (w: Wound): number => Math.min(1, Math.max(0, 1 - (w.healProgress ?? 0)));

/** Location penalty for a skill: the sum over wounds whose part targets it, each scaled by its unhealed share. */
export function locationPenalty(wounds: readonly Wound[], skillId: string): number {
  const targets = skillTargets(skillId);
  let p = 0;
  for (const w of wounds) if (PART_TARGETS[w.part].some((x) => targets.has(x))) p += LOCATION_PENALTY[effectiveSeverity(w)] * unhealedShare(w);
  return p;
}

/** Status penalty: 0.75% of effective level per wound-load point, each wound's load scaled by its unhealed share. */
export const statusPenalty = (wounds: readonly Wound[]): number => STATUS_PENALTY_PER_LOAD * wounds.reduce((a, w) => a + WOUND_LOAD[effectiveSeverity(w)] * unhealedShare(w), 0);

/** Passive Willpower resistance: Willpower / 400 of wound penalties, max 25% (Q40). */
export const willpowerSuppression = (willpower: number): number => Math.min(WILLPOWER_SUPPRESSION.max, Math.max(0, willpower) * WILLPOWER_SUPPRESSION.perWillpower);

/**
 * The total wound penalty on a skill (rolls §1): status + location, reduced by Willpower and active suppression
 * (health §8; suppression never changes status or timers), capped at 50% while still able to fight.
 */
export function woundPenalty(wounds: readonly Wound[], skillId: string, i: PenaltyInputs): number {
  const raw = statusPenalty(wounds) + locationPenalty(wounds, skillId);
  const reduced = raw * (1 - willpowerSuppression(i.willpower)) * (1 - Math.min(0.8, Math.max(0, i.suppression ?? 0)));
  return Math.min(WOUND_PENALTY_CAP, reduced);
}

/** Minions leave the fight on a moderate or worse wound (health §9). */
export const takesMinionOut = (sev: Severity): boolean => SEVERITIES.indexOf(sev) >= SEVERITIES.indexOf(MINION_OUT_AT);

/** Suppression crash (Q41): when Battlemind or Force Valor ends while wounded, +0.5 mental load (the penalties return by themselves). */
export const suppressionCrashMental = (wounds: readonly Wound[]): number => (wounds.length > 0 ? SUPPRESSION_CRASH_MENTAL : 0);
