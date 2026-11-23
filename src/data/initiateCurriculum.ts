// The Jedi Initiate lightsaber curriculum (D-459, Jared's ruling; source: The Jedi Path, via Jedi training / Legends, Jedi
// instructor / Legends and Jedi Initiate / Legends: Initiates take courses in Forms I-VI with training sabers; Form VII is
// excluded, it needs mastery of several forms). Post-Ruusan academy practice, the default for every era (lore batch 13's
// ruling). Sith acolytes keep their own row (orderRequirements.ts). Every number is invented (design defaults, D-459).

export interface CurriculumBlock {
  activityId: string;
  skillId: string;
  /** Share of the saber block's hours. */
  share: number;
}

export const INITIATE_CURRICULUM = {
  /**
   * The saber gate: an Initiate starts saber training after proving themselves in other classes: basic Force Control and
   * study (Force Knowledge) at these levels (natural baselines included). Set from the Average (D-459): its levels at the
   * design gate age, so the Average starts at about that age and a faster learner sooner. Measured 2026-11-23 (gated
   * seed, the saber hours on the pre-gate blocks to 6): Force Control 13.7, Force Knowledge 6.0 at 6; rounded down
   * (Force Knowledge one lower, 6.0 sat on the line), so the Average opens the saber classes at about 5.9.
   */
  gate: { forceControl: 13, forceKnowledge: 5 },
  /** The design gate age the minimums are set from (Human-equivalent), and the closed form's gate for NPCs. */
  gateAge: 6,
  /** Before the gate the saber hours go to Force Control, physical training and meditation (physical rotates by day). */
  preGate: [
    { activityId: 'forceControlDrill', skillId: 'forceControl', share: 0.5 },
    { activityId: '$physical', skillId: '$physical', share: 0.25 },
    { activityId: 'basicCentering', skillId: 'meditation', share: 0.25 },
  ] as readonly CurriculumBlock[],
  physicalRotation: [
    { activityId: 'agilityFlexibility', skillId: 'agility' },
    { activityId: 'strengthTraining', skillId: 'strength' },
    { activityId: 'cardio', skillId: 'endurance' },
  ] as const,
  /** The survey of the final Initiate years starts at the Initiate Trials' minimum age (rankMinimums INITIATE_TRIALS). */
  surveyFromAge: 10,
  /** In the survey, Form I keeps this share of the saber hours; Forms II-VI rotate through the rest, a day each. */
  surveyFormIShare: 0.5,
  /** Forms II-VI in rotation order (Niman last: its fundamentals transfer averages Forms I, III, IV and V, D-121). Form V
   * alternates its two variants from one rotation to the next. */
  surveyForms: [['makashi'], ['soresu'], ['ataru'], ['shien', 'djemSo'], ['niman']] as readonly (readonly string[])[],
} as const;

/** Each form's share of the Initiate saber hours in the survey (Form I 0.5; the others share the rest; Form V halved). */
export function surveyShares(): Record<string, number> {
  const c = INITIATE_CURRICULUM;
  const out: Record<string, number> = { shiiCho: c.surveyFormIShare };
  const each = (1 - c.surveyFormIShare) / c.surveyForms.length;
  for (const group of c.surveyForms) for (const f of group) out[f] = each / group.length;
  return out;
}

/**
 * The curriculum as the closed form reads it (D-459): one shared value for creation, the NPC generator and the tests, so
 * every caller of formXps models a Jedi Initiate the same way.
 */
export const CLOSED_FORM_CURRICULUM = {
  gateAge: INITIATE_CURRICULUM.gateAge,
  surveyAge: INITIATE_CURRICULUM.surveyFromAge,
  shares: surveyShares(),
  order: INITIATE_CURRICULUM.surveyForms.flat(),
} as const;

/** The closed form's curriculum for a path: the Jedi's (D-459); none for the Sith acolyte row and everyone else. */
export const closedFormCurriculum = (path: string): typeof CLOSED_FORM_CURRICULUM | undefined => (path === 'jedi' ? CLOSED_FORM_CURRICULUM : undefined);
