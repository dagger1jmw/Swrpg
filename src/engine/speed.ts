// Speed multiplier M (progression-numbers §5, §17; D-21, D-64) and the state-of-mind multiplier. Pure.
import { ACCELERATED_PATH, CROSS_TALENT, GRIEF_MULT, M_CAP, STATE_MULT, TALENT_MULT, type StateOfMind, type TalentLevel } from '../data/progression.config';
import { SPECIES_FORCE_TRAITS } from '../data/forceResistance.config';
import { CATEGORY_RULES, SKILL_BY_ID, type TalentDomain } from '../data/skills';

export type Talents = Partial<Record<TalentDomain, TalentLevel>>;

export function talentMult(talents: Talents, skillId: string): number {
  const s = SKILL_BY_ID.get(skillId);
  if (!s) return 1;
  return TALENT_MULT[talents[CATEGORY_RULES[s.category].domain] ?? 'none'];
}

/** Cross-talent: a Force prodigy or better gets x1.1 on combat (technique) skills. */
export function crossTalentMult(talents: Talents, skillId: string): number {
  const s = SKILL_BY_ID.get(skillId);
  const force = talents.force ?? 'none';
  return s && CATEGORY_RULES[s.category].domain === 'combat' && (force === 'prodigy' || force === 'exceptional') ? CROSS_TALENT : 1;
}

/** Skills that take anger channeling: Force Output, dark-tagged abilities, aggressive forms (§17). */
export function isChannelEligible(skillId: string): boolean {
  const s = SKILL_BY_ID.get(skillId);
  return skillId === 'forceOutput' || s?.side === 'dark' || s?.aggressive === true;
}

/** Light-side techniques and Meditation take x0.80 under fear, anger or hatred. */
export function isLightSkill(skillId: string): boolean {
  return skillId === 'meditation' || SKILL_BY_ID.get(skillId)?.side === 'light';
}

export interface StateMultOptions {
  /** Current grief multiplier (x0.80 easing to x1.00); 1 = no grief. */
  grief?: number;
  /** Current despair multiplier while despair is active (x0.80 easing to x1.00). */
  despair?: number;
  /** Dark pressure (stub 0 until M6, D-56). */
  darkPressure?: number;
}

/** State-of-mind multiplier for a skill. Grief lingers and multiplies on top of any state (D-46). */
export function stateMult(state: StateOfMind, skillId: string, opts: StateMultOptions = {}): number {
  const darkPressure = opts.darkPressure ?? 0;
  let m: number;
  switch (state) {
    case 'fear':
    case 'anger':
    case 'hatred':
      m = isChannelEligible(skillId)
        ? darkPressure > STATE_MULT.passionDarkThreshold
          ? STATE_MULT.passionChannelDark
          : STATE_MULT.passionChannel
        : isLightSkill(skillId)
          ? STATE_MULT.passionLight
          : 1;
      break;
    case 'despair':
      m = opts.despair ?? STATE_MULT.despair;
      break;
    default:
      m = STATE_MULT[state];
  }
  return m * (opts.grief ?? 1);
}

/** The full grief multiplier at onset (for tests and labels). */
export const GRIEF_ONSET = GRIEF_MULT;

export interface SpeedInput {
  talent: number;
  crossTalent: number;
  instruction: number;
  age: number;
  state: number;
  /** Alignment multiplier (stub 1.0 until M6, D-56). */
  alignment: number;
  /** Species learning factor (species.md §3: inside the 2.8 cap). */
  species: number;
}

export function speedM(i: SpeedInput): { m: number; capped: boolean } {
  const raw = i.talent * i.crossTalent * i.instruction * i.age * i.state * i.alignment * i.species;
  return raw > M_CAP ? { m: M_CAP, capped: true } : { m: raw, capped: false };
}

// ---- Special training conditions (D-418; progression-numbers §21) ----

/** A Force skill (the Force stats and abilities): what a Force-rich place speeds up. */
export const isForceSkill = (skillId: string): boolean => SKILL_BY_ID.get(skillId)?.category === 'force';
/** The skills the Force trains (D-447): the Force skills and the Force abilities (powers). */
export const isForceXpSkill = (skillId: string): boolean => isForceSkill(skillId) || SKILL_BY_ID.get(skillId)?.kind === 'forceAbility';
/**
 * Outside the Force (D-447, Jared; Legends: the Yuuzhan Vong were cut off from the Force, SW_Characters_15,
 * SW_Midichlorians_Force_Potential): a species with the forceInvisible trait gains no Force XP and has no Force powers.
 * Force effects can still reach them (lightning and its variants; combatForce.ts).
 */
export const isOutsideForce = (speciesId: string | null | undefined, insideForce = false): boolean => !insideForce && (speciesId ? (SPECIES_FORCE_TRAITS[speciesId] ?? []) : []).includes('forceInvisible');
/** What the accelerated path speeds up: the Force skills and the lightsaber forms. */
export const isAcceleratedSkill = (skillId: string): boolean => isForceSkill(skillId) || SKILL_BY_ID.get(skillId)?.kind === 'form';

/**
 * M with the special conditions (D-418, D-432): a Force-rich place's factor (1 elsewhere; forceBonusAt) multiplies a Force
 * skill's M inside the 2.8 cap; the accelerated path multiplies a Force skill's or form's M on top of the cap (the only
 * condition allowed past it).
 */
export function conditionedM(m: number, skillId: string, c: { forceFactor: number; accelerated: boolean }): number {
  const place = isForceSkill(skillId) ? c.forceFactor : 1;
  const accel = c.accelerated && isAcceleratedSkill(skillId) ? ACCELERATED_PATH.mult : 1;
  return Math.min(M_CAP, m * place) * accel;
}

/** The 4.0x clamp's cap with the accelerated path (D-418): raised x capMult for its skills, unchanged otherwise. */
export const conditionedCap = (cap: number, skillId: string, accelerated: boolean): number => (accelerated && isAcceleratedSkill(skillId) ? cap * ACCELERATED_PATH.capMult : cap);
