// Ranks and skill minimums (ranks.md §1-2; D-51, D-66, D-102, D-111, D-120). The ranks slice is a
// stub until M7: the rank is chosen at creation and fixed. Skill keys: '$main' = the archetype's main
// specialty, '$highestForm' = the character's highest lightsaber form (D-118: every "main form"
// minimum reads the highest form; for an Initiate that is Shii-Cho).

import type { CharacterPath } from './archetypes';

export interface RankDef {
  id: string;
  name: string;
  path: CharacterPath;
  /** Order in the ladder (0 = first). */
  order: number;
  /** Youngest age the rank fits (creation filter; design ages, D-108). */
  minAge: number;
  /** Oldest age the rank fits, if any (Initiates not chosen by 13 go to the Service Corps). */
  maxAge?: number;
  /** Skill minimums met by the Average near the typical age (ranks test 1). */
  minimums: Readonly<Record<string, number>>;
  /** Typical Average age, for the "ahead of their time" milestone and the closed-form phases. */
  typicalAge?: number;
}

/**
 * Jedi ladder. Padawan: passed the Initiate Trials (age 10+, highest form 24, Force Control 14).
 * Knight: Knight Trials (age 18+, 6 years as a Padawan, highest form 39 (D-111), Force Control 34,
 * Force Sense 31, Willpower 53 (D-120: the D-51 rule read at 20.3 after the D-118 re-calibration)). D-426: Knight at 25
 * after 13 years as a Padawan; the Knight minimums re-read by the D-51 rule at 24: highest form 47, Force Control 40,
 * Force Sense 36, Willpower 56 (the Average's levels at 24, rounded down). D-431/D-437: re-read after the re-measurement
 * (the age-scaled Padawan hours halve the Force Control hour to 16): the Average at 24 has highest form 47.4, Force Control
 * 38.1, Force Sense 37.1, Willpower 58.2, so 47 / 38 / 37 / 58. D-445: re-read again with the Temple in the calibration (x1.15 on
 * Force skills): the Average at 24 has Force Control 41.4 and Force Sense 40.2 (Force Sense 37 was met at 21.8, outside the
 * +/-2 years), so 47 / 41 / 40 / 58.
 * Master (D-437, Jared): main specialty 64, the Average's at 40 (63.9; 58 before, met at 33.7), typical age 40. The Sith
 * ladder mirrors it (ranks.md §2). D-461 (Jared): re-set to 66 by the same rule after D-460 (the Average at 40: 66.6,
 * gated seed, K 11.64; 64 was met at 37.46). D-462 (Jared): 66 -> 67 by D-437's nearest-level rounding (66.6 -> 67), and
 * the Knight's Force Control 41 -> 44 by the D-426 rule (the Average at 24: 44.6; 41 was met at 21.93-22.14, outside
 * +/-2 years on 13 of 20 seeds). The Master row carries the Knight minimums and the Sith Lord row mirrors them (D-437).
 */
export const RANKS: readonly RankDef[] = [
  { id: 'initiate', name: 'Initiate', path: 'jedi', order: 0, minAge: 0, maxAge: 13, minimums: {} },
  // D-459: Force Control 14 -> 19 with the Initiate curriculum (the D-51 rule; mirrors INITIATE_TRIALS).
  { id: 'padawan', name: 'Padawan', path: 'jedi', order: 1, minAge: 10, minimums: { $highestForm: 24, forceControl: 19 }, typicalAge: 12 },
  { id: 'knight', name: 'Knight', path: 'jedi', order: 2, minAge: 18, minimums: { $highestForm: 47, forceControl: 44, forceSense: 40, willpower: 58 }, typicalAge: 25 },
  { id: 'master', name: 'Master', path: 'jedi', order: 3, minAge: 31, minimums: { $main: 67, $highestForm: 47, forceControl: 44, forceSense: 40, willpower: 58 }, typicalAge: 40 },
  { id: 'acolyte', name: 'Academy acolyte', path: 'sith', order: 0, minAge: 0, minimums: {} },
  { id: 'apprentice', name: 'Apprentice', path: 'sith', order: 1, minAge: 10, minimums: { $highestForm: 24, forceControl: 14 }, typicalAge: 12 },
  { id: 'lord', name: 'Sith Lord', path: 'sith', order: 2, minAge: 18, minimums: { $highestForm: 47, forceControl: 44, forceSense: 40, willpower: 58 }, typicalAge: 25 },
  { id: 'none', name: 'No rank', path: 'outsider', order: 0, minAge: 0, minimums: {} },
  { id: 'career', name: 'Career', path: 'career', order: 0, minAge: 0, minimums: {} },
];

export const RANK_BY_ID: ReadonlyMap<string, RankDef> = new Map(RANKS.map((r) => [r.id, r]));

export function rankDef(id: string): RankDef {
  const r = RANK_BY_ID.get(id);
  if (!r) throw new Error(`Unknown rank id: ${id}`);
  return r;
}

export function ranksForPath(path: CharacterPath): RankDef[] {
  return RANKS.filter((r) => r.path === path).sort((a, b) => a.order - b.order);
}

/** Phase of the closed form and the Order requirements for a rank. */
export const RANK_PHASE: Readonly<Record<string, 'initiate' | 'padawan' | 'knight'>> = {
  initiate: 'initiate',
  padawan: 'padawan',
  knight: 'knight',
  master: 'knight',
  acolyte: 'initiate',
  apprentice: 'padawan',
  lord: 'knight',
  none: 'knight',
  career: 'knight',
};

/** Initiate Trials (ranks.md §1, D-66): checked in M7; kept here with the other minimums. */
/**
 * D-459 (Jared: the Initiate lightsaber curriculum; thresholds by the D-51 rule from the Average, gated seed, K 11.5,
 * 2026-11-23): Form I 24 stays (the Average meets it at about 11.8, inside +/-2 years of 10); Force Control 14 -> 19 (the
 * pre-gate hours bring 14 to about 6.2, so it becomes the Average's level at 10, 19.5, rounded down). The Sith apprentice
 * row keeps 24 / 14 (the acolyte row has no curriculum).
 */
export const INITIATE_TRIALS = { minAge: 10, minimums: { shiiCho: 24, forceControl: 19 } } as const;
/** D-426 (Jared): at least 10 years as a Padawan (6 before); the Average is a Padawan from 12 to 25. */
export const KNIGHT_TRIALS = { minAge: 18, padawanYears: 10 } as const;
/** Calibration rank ages of the Average profile (progression-numbers §12; Sith use them until M7). */
/** D-426 (Jared): the average Jedi Knight at 25 after 13 years as a Padawan (Knight 20.5 before). */
export const AVERAGE_RANK_AGES = { padawan: 12, knight: 25 } as const;
