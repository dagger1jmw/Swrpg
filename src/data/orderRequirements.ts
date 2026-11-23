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
  /**
   * Hours by Human-equivalent age (D-431, Jared: the Padawan's fixed hours scale with age so a young Padawan's day fits
   * under the tiredness limit with some free training time): interpolated, then rounded down to the 0.5 h step. Absent =
   * `hours` at every age. `hours` is the adult value.
   */
  hoursByAge?: readonly (readonly [number, number])[];
}

/** A block's hours at a Human-equivalent age (D-431): `hoursByAge` interpolated and floored to 0.5 h, else `hours`. */
export function blockHours(b: RequirementBlock, age: number): number {
  const t = b.hoursByAge;
  if (!t || !t.length) return b.hours;
  let h = t[t.length - 1]![1];
  if (age <= t[0]![0]) h = t[0]![1];
  else
    for (let i = 1; i < t.length; i++)
      if (age <= t[i]![0]) {
        const [a0, h0] = t[i - 1]!;
        const [a1, h1] = t[i]!;
        h = h0 + ((h1 - h0) * (age - a0)) / (a1 - a0);
        break;
      }
  return Math.floor(h / 0.5 + 1e-9) * 0.5;
}

/** A row's fixed hours at a Human-equivalent age (D-431). */
export const orderHoursAt = (row: string, age: number): number => (ORDER_REQUIREMENTS[row] ?? []).reduce((a, b) => a + blockHours(b, age), 0);

/**
 * The young Padawan's (and apprentice's) scaled hours (D-431, Jared; tuned on the Average's day 2026-11-22): 4 h at 12-16,
 * the Force Control hour back to 1 h at 17 and the solo form hour at 18, so the fixed blocks end a standard day at f 0.86-0.89
 * with 0.5-1.5 h of free training (5 h ended it at 0.92-1.01 to 16, with none). 5 h from 16 still ended 16-16.5 at 0.92.
 */
export const PADAWAN_SOLO_HOURS: readonly (readonly [number, number])[] = [
  [12, 0.5],
  [18, 1],
];
export const PADAWAN_FORCE_HOURS: readonly (readonly [number, number])[] = [
  [12, 0.5],
  [17, 1],
];

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
    { activityId: '$formBasics', hours: 1, instructor: 'solo', primary: '$planSolo', hoursByAge: PADAWAN_SOLO_HOURS },
    { activityId: 'forceControlDrill', hours: 1, instructor: 'master', primary: 'forceControl', hoursByAge: PADAWAN_FORCE_HOURS },
    { activityId: 'senseAwareness', hours: 1, instructor: 'master', intensity: 'standard' },
  ],
  knight: [],
  // D-427 (Jared): the Sith rows mirror the Jedi time structure with the Korriban content (lore batch 12;
  // SW_Korriban_Academy_Part1 curriculum): martial training with the warblade (Form I basics; the lightsaber comes with
  // apprenticeship), Force work and the meditation chambers with the Overseers, the Sith Code and history; then the
  // apprenticeship: forms, Force Control and awareness with the master.
  acolyte: [
    { activityId: 'shiiChoBasics', hours: 2, instructor: 'instructor' },
    { activityId: 'forceControlDrill', hours: 0.5, instructor: 'instructor', primary: 'forceControl' },
    { activityId: 'basicCentering', hours: 0.5, instructor: 'instructor' },
    { activityId: 'forceLore', hours: 1, instructor: 'instructor' },
  ],
  apprentice: [
    { activityId: 'padawanTraining', hours: 2, instructor: 'master', primary: '$planMaster' },
    { activityId: '$formBasics', hours: 1, instructor: 'solo', primary: '$planSolo', hoursByAge: PADAWAN_SOLO_HOURS },
    { activityId: 'forceControlDrill', hours: 1, instructor: 'master', primary: 'forceControl', hoursByAge: PADAWAN_FORCE_HOURS },
    // Channelling with the master (D-431, Jared: the Force Output block is back; the paces are re-measured with it).
    { activityId: 'outputDrill', hours: 1, instructor: 'master', primary: 'forceOutput' },
  ],
};

/** Rank -> Order requirement row (Sith on the Jedi rows until M7). */
export const REQUIREMENT_ROW: Readonly<Record<string, string>> = {
  initiate: 'initiate',
  padawan: 'padawan',
  knight: 'knight',
  master: 'knight',
  acolyte: 'acolyte',
  apprentice: 'apprentice',
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
