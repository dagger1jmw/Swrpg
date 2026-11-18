// Natural combat words mapped to mechanics (Jared, D-179). The intent call is told the same mapping (intent.md); the
// engine applies this list to the player's typed text (or a choice's label) when the intent carries no combat move, so
// "parry the strike" never falls back to Continue. Grow the lists here; whole words or phrases, lower case.
import type { Stance } from './combat.config';

export interface CombatWordGroup {
  id: string;
  words: readonly string[];
  /** The stance the words ask for. */
  stance?: Stance;
  /** A take-position attempt (the position maneuver on the next strike exchange). */
  takePosition?: boolean;
}

export const COMBAT_WORD_GROUPS: readonly CombatWordGroup[] = [
  { id: 'defend', words: ['parry', 'parries', 'parrying', 'block', 'blocks', 'blocking', 'defend', 'defends', 'defending', 'hold', 'hold my ground', 'guard', 'on guard', 'deflect', 'give ground', 'fall back', 'back away'], stance: 'defensive' },
  { id: 'attack', words: ['press', 'press the attack', 'attack', 'attacks', 'push forward', 'overwhelm', 'go on the offensive'], stance: 'aggressive' },
  { id: 'evade', words: ['dodge', 'dodges', 'evade', 'evades', 'sidestep', 'sidesteps', 'roll', 'roll away', 'duck'], stance: 'defensive', takePosition: true },
  { id: 'reposition', words: ['circle', 'circles', 'reposition', 'high ground', 'get behind', 'flank', 'outflank'], takePosition: true },
];

/**
 * Form names and well-known Legends techniques -> form id ("use Shii-Cho fundamentals" keeps or switches to Shii-Cho).
 * Form numbers count too (Form I .. Form VII; Form V is Djem So unless Shien is named).
 */
export const FORM_WORDS: Readonly<Record<string, string>> = {
  'shii-cho': 'shiiCho',
  'shii cho': 'shiiCho',
  shiicho: 'shiiCho',
  'form i': 'shiiCho',
  'sun djem': 'shiiCho',
  makashi: 'makashi',
  'form ii': 'makashi',
  soresu: 'soresu',
  'form iii': 'soresu',
  ataru: 'ataru',
  'form iv': 'ataru',
  'hawk-bat swoop': 'ataru',
  shien: 'shien',
  'djem so': 'djemSo',
  'djem-so': 'djemSo',
  'form v': 'djemSo',
  niman: 'niman',
  'form vi': 'niman',
  juyo: 'juyo',
  vaapad: 'vaapad',
  'form vii': 'juyo',
};

/** Words that mean "go on as before" (Continue; in a sparring session, play the bout out). */
export const CONTINUE_WORDS: readonly string[] = ['continue', 'keep fighting', 'fight on', 'keep going', 'carry on', 'go on'];
