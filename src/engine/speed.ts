// Speed multiplier M (progression-numbers §5, §17; D-21, D-64) and the state-of-mind multiplier. Pure.
import { CROSS_TALENT, GRIEF_MULT, M_CAP, STATE_MULT, TALENT_MULT, type StateOfMind, type TalentLevel } from '../data/progression.config';
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

/** State-of-mind multiplier for a skill (dark pressure stubbed at 0 until M6, D-56). Grief multiplies on top. */
export function stateMult(state: StateOfMind, skillId: string, grief: boolean, darkPressure = 0): number {
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
    default:
      m = STATE_MULT[state];
  }
  return m * (grief ? GRIEF_MULT : 1);
}

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
