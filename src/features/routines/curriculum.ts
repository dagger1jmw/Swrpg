// The Jedi Initiate lightsaber curriculum in the day plan (D-459): the Order's saber block by phase. Pure.
//   before the gate (basic Force Control and study minimums): the saber hours go to Force Control, physical training
//     and meditation;
//   from the gate: Form I (Shii-Cho) only;
//   the survey (from the Initiate Trials' minimum age): Form I keeps 75% of the hours (D-460), Forms II-VI rotate a day
//     each through the rest (Form V alternating Shien and Djem So by week). Total hours unchanged.
import { DEFAULT_ACTIVITY } from '../../data/activities';
import { INITIATE_CURRICULUM, saberGateOpen } from '../../data/initiateCurriculum';
import { STEP_HOURS } from '../../data/progression.config';

export type CurriculumPhase = 'preGate' | 'formI' | 'survey';

export interface CurriculumInput {
  /** Human-equivalent age. */
  age: number;
  /** Absolute day (the rotations). */
  day: number;
  /** The saber block's hours. */
  hours: number;
  /** Level (natural baseline included) of a skill. */
  level(skillId: string): number;
}

/** The phase of the curriculum the Initiate is in. */
export function curriculumPhase(i: Pick<CurriculumInput, 'age' | 'level'>): CurriculumPhase {
  if (!saberGateOpen(i.level)) return 'preGate';
  return i.age >= INITIATE_CURRICULUM.surveyFromAge ? 'survey' : 'formI';
}

/** The saber block as day blocks (activity, skill, hours in 0.5 h steps; the last block takes the rounding). */
export function initiateSaberBlocks(i: CurriculumInput): { phase: CurriculumPhase; blocks: { activityId: string; skillId: string; hours: number }[] } {
  const c = INITIATE_CURRICULUM;
  const phase = curriculumPhase(i);
  const step = (h: number): number => Math.floor(h / STEP_HOURS + 1e-9) * STEP_HOURS;
  const split = (parts: readonly { activityId: string; skillId: string; share: number }[]): { activityId: string; skillId: string; hours: number }[] => {
    const out: { activityId: string; skillId: string; hours: number }[] = [];
    let left = i.hours;
    parts.forEach((p, n) => {
      const h = n === parts.length - 1 ? left : Math.min(left, step(i.hours * p.share));
      left -= h;
      if (h > 0) out.push({ activityId: p.activityId, skillId: p.skillId, hours: h });
    });
    return out;
  };
  if (phase === 'preGate') {
    const phys = c.physicalRotation[((i.day % c.physicalRotation.length) + c.physicalRotation.length) % c.physicalRotation.length]!;
    return { phase, blocks: split(c.preGate.map((b) => (b.activityId === '$physical' ? { ...b, activityId: phys.activityId, skillId: phys.skillId } : b))) };
  }
  if (phase === 'formI') return { phase, blocks: [{ activityId: 'shiiChoBasics', skillId: 'shiiCho', hours: i.hours }] };
  const n = c.surveyForms.length;
  const group = c.surveyForms[((i.day % n) + n) % n]!;
  // Form V's variant alternates by week (absolute days are negative before 0 BBY: a non-negative modulo).
  const mod = (x: number, m: number): number => ((x % m) + m) % m;
  const form = group[mod(Math.floor(i.day / 7), group.length)]!;
  return {
    phase,
    blocks: split([
      { activityId: 'shiiChoBasics', skillId: 'shiiCho', share: c.surveyFormIShare },
      { activityId: DEFAULT_ACTIVITY[form] ?? 'shiiChoBasics', skillId: form, share: 1 - c.surveyFormIShare },
    ]),
  };
}
