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
  /** Explicit movement only (D-191): a position contest. */
  { id: 'drive', words: ['push back', 'push him back', 'push her back', 'push them back', 'drive back', 'drive him back', 'drive her back', 'drive them back', 'take ground', 'gain ground', 'force them back'], takePosition: true },
];

/**
 * Attack verbs (Jared, D-191): a strike step, never a position contest. Against minions a strike step is a strike roll.
 * Whole words or phrases, lower case; 'attack' and 'press' stay stance words (the attack group above).
 */
export const STRIKE_WORDS: readonly string[] = [
  'strike', 'strikes', 'striking', 'heavy strikes', 'heavy strike', 'cut', 'cuts', 'cutting', 'cut down', 'carve', 'carve through', 'carving', 'slash', 'slashes', 'slashing', 'hack', 'hacks', 'hacking', 'cleave', 'cleaves', 'swing', 'swings', 'swinging', 'thrust', 'thrusts', 'lunge', 'lunges', 'stab', 'stabs', 'slice', 'slices', 'hew', 'chop', 'chops', 'bisect', 'behead', 'hit', 'hits',
];

/** Words that name a Force action in a clause (so an attack verb in it is not a separate strike), by step action. */
export const FORCE_CLAUSE_WORDS: Readonly<Record<string, readonly string[]>> = {
  saberThrow: ['saber throw', 'throw my saber', 'throw my lightsaber', 'throw the saber', 'throw the lightsaber', 'hurl my saber', 'hurl my lightsaber', 'saber toss', 'toss my saber'],
  recall: ['recall my saber', 'call my saber', 'summon my saber', 'call the saber back', 'recall the saber', 'pull my saber back'],
  push: ['force push', 'force-push', 'force pushes', 'push with the force', 'telekinetic push', 'force wave'],
  choke: ['choke', 'force choke', 'grip', 'force grip'],
  lightning: ['lightning', 'force lightning'],
  throw: ['throw a rock', 'throw rocks', 'hurl a rock', 'throw a log', 'throw debris', 'throw a crate', 'telekinesis', 'telekinetically', 'fling', 'hurl'],
  mindTrick: ['mind trick', 'jedi mind trick', 'force persuasion'],
};

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

/** Words that end a sparring session like the Stop sparring button (Jared, D-199); "solah" is the Legends call to yield a bout. */
export const STOP_SPAR_WORDS: readonly string[] = ['end the sparring session', 'end the session', 'end the spar', 'end the bout', 'end the match', 'stop sparring', 'stop the spar', 'stop the session', 'stop the bout', "that's enough", 'that is enough', 'enough for today', 'enough for now', 'i yield', 'yield', 'solah', 'call it a day', 'we are done', "we're done", 'i am done', "i'm done"];

/** Words that mean "go on as before" (Continue; in a sparring session, play the bout out). */
export const CONTINUE_WORDS: readonly string[] = ['continue', 'keep fighting', 'fight on', 'keep going', 'carry on', 'go on'];
