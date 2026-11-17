// Order requirements (ranks.md §1a, D-42; activities from skills-and-activities.md §5). Stub until
// M7 (architecture §15, D-56): static data, rank fixed at creation. Sith use the Jedi rows until M7
// (acolyte = Initiate row, apprentice = Padawan row; D-42, D-105).

/** Who instructs a block: Temple instructors (x1.05), the master (x1.15) or nobody (solo x0.90). */
export type Instructor = 'instructor' | 'master' | 'solo';

export interface RequirementBlock {
  activityId: string;
  hours: number;
  instructor: Instructor;
  /** '$planMaster' / '$planSolo': forms of the Padawan form plan (D-118). The Initiate row is always Shii-Cho. */
  primary?: string;
  intensity?: 'standard';
}

export const ORDER_REQUIREMENTS: Readonly<Record<string, readonly RequirementBlock[]>> = {
  initiate: [
    { activityId: 'shiiChoBasics', hours: 2, instructor: 'instructor' },
    { activityId: 'forceControlDrill', hours: 0.5, instructor: 'instructor', primary: 'forceControl' },
    { activityId: 'senseAwareness', hours: 0.5, instructor: 'instructor', intensity: 'standard' },
    { activityId: 'forceLore', hours: 1, instructor: 'instructor' },
  ],
  // D-118: the master session and the solo hour train the forms of the Padawan form plan
  // ('$planMaster': the plan's forms by hours, largest first, for 2 h; '$planSolo': the next 1 h).
  padawan: [
    { activityId: 'padawanTraining', hours: 2, instructor: 'master', primary: '$planMaster' },
    { activityId: '$formBasics', hours: 1, instructor: 'solo', primary: '$planSolo' },
    { activityId: 'forceControlDrill', hours: 1, instructor: 'master', primary: 'forceControl' },
    { activityId: 'senseAwareness', hours: 1, instructor: 'master', intensity: 'standard' },
  ],
  knight: [],
};

/** Rank -> Order requirement row (Sith on the Jedi rows until M7). */
export const REQUIREMENT_ROW: Readonly<Record<string, string>> = {
  initiate: 'initiate',
  padawan: 'padawan',
  knight: 'knight',
  master: 'knight',
  acolyte: 'initiate',
  apprentice: 'padawan',
  lord: 'knight',
  none: 'knight',
};

/** Calibration instruction factors of the Average profile (progression-numbers §12). */
export const AVERAGE_INSTRUCTION: Readonly<Record<Instructor | 'fill', number>> = {
  instructor: 1.05,
  master: 1.15,
  solo: 0.9,
  fill: 1.0,
};
