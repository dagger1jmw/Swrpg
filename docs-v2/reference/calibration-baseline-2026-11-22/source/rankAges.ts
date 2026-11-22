// Typical ages at which a rank starts, for estimating what the sources don't date (date-agnostic refactor, D-412;
// invented, tagged `estimate` wherever used). A birth year the lore doesn't give is estimated from the figure's dated
// rank facts with these ages, and a rank whose start isn't on record starts at its typical age. Not mechanics: the
// player's rank ladder lives in rankMinimums.ts.
import type { NpcRole } from '../entities.config';
import { ROLE_MIN_AGE } from '../npcGen.config';

/** The typical starting age of a rank or title (years). */
export const RANK_TYPICAL_AGE: Readonly<Record<string, number>> = {
  // Jedi: Padawan at 13 (the era profile's default), Knight at 25 (the Obi-Wan check, npc-generation §3), Master at 40.
  Initiate: 4,
  Padawan: 13,
  'Jedi Knight': 25,
  'Jedi Master': 40,
  'High Council member': 45,
  'Grand Master': 55,
  // Sith: acolyte at 15, apprentice or Lord at 22, Darth at 35, Dark Councilor at 45.
  acolyte: 15,
  apprentice: 20,
  'Sith Lord': 22,
  Darth: 35,
  'Dark Councilor': 45,
  Overseer: 35,
  // Careers.
  soldier: 18,
  officer: 25,
  general: 40,
  'Supreme Commander': 50,
  senator: 35,
  'Supreme Chancellor': 50,
  official: 25,
  agent: 22,
  minister: 45,
  'bounty hunter': 20,
  smuggler: 20,
  criminal: 20,
  'crime lord': 35,
  Mandalore: 35,
  civilian: 18,
};

/** The default title for a role, when the data gives none. */
export const ROLE_TITLE: Readonly<Record<NpcRole, string>> = {
  jediMaster: 'Jedi Master',
  jediKnight: 'Jedi Knight',
  padawan: 'Padawan',
  initiate: 'Initiate',
  sithLord: 'Sith Lord',
  sithAcolyte: 'acolyte',
  darkJedi: 'Dark Jedi',
  darkAcolyte: 'acolyte',
  inquisitor: 'Sith Lord',
  soldier: 'soldier',
  officer: 'officer',
  pilot: 'soldier',
  politician: 'senator',
  official: 'official',
  merchant: 'civilian',
  smuggler: 'smuggler',
  criminal: 'criminal',
  bountyHunter: 'bounty hunter',
  scholar: 'civilian',
  healer: 'civilian',
  servant: 'civilian',
  civilian: 'civilian',
  droid: 'civilian',
  other: 'civilian',
};

/** The typical starting age for a rank span's title (else its role's default title; else 18), never below the role's minimum. */
export function typicalAge(title: string, role: NpcRole): number {
  return Math.max(RANK_TYPICAL_AGE[title] ?? RANK_TYPICAL_AGE[ROLE_TITLE[role]] ?? 18, ROLE_MIN_AGE[role] ?? 0);
}
