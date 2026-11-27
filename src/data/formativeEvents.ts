// Formative events, the growing-up quiz (M8 checklist item 16; spec/traits.md section 7; the five sets agreed by Jared,
// 25 Nov 2026 in m8-design-notes.md). Jedi Initiate 9, Padawan 10, Sith acolyte 9, military 9, civilian 13 (street 4, noble 4,
// spacer 3, anyone 2): 50 distinct events. The design notes' 52 counts the two shared "Anyone" events twice (the military
// childhood stage draws them too). One dated list (D-438): each event names its set, the ages it can happen at and,
// for the dated ones, the condition (the Sacking, a war, a Force-sensitive child).
//
// What an answer gives, never combat stats or skill numbers: a backstory fact; trait leanings (suggested at the end); a small
// alignment and dark-pressure nudge (at most +-2 an event and +-10 overall, the code clamps); a person (bond or rivalry); a
// little standing (the Order, the academy, the unit, the community); flags. The catalog's alignment nudges of 3 (the lesson
// in pain, the illegal order) are clamped to 2 by the rule. Age windows, roll chances and bond sizes are INVENTED (spec/traits.md
// section 9).

export const FORMATIVE_SETS = ['initiate', 'padawan', 'sith', 'military', 'street', 'noble', 'spacer', 'anyone'] as const;
export type FormativeSet = (typeof FORMATIVE_SETS)[number];

/** Standing group per set (S in the catalog's key). */
export const SET_STANDING: Readonly<Record<FormativeSet, 'order' | 'academy' | 'unit' | 'community'>> = {
  initiate: 'order', padawan: 'order', sith: 'academy', military: 'unit', street: 'community', noble: 'community', spacer: 'community', anyone: 'community',
};

/** A person the answer makes: a bond (+) or a rivalry (-) on the relationship scale (invented sizes; see BOND). */
export interface FormativePerson {
  /** Who, in a few words (the narrator gets it; the code names the NPC). */
  who: string;
  bond: number;
  /** The tie trait it points to, suggested at the end. */
  tie?: string;
}

export interface FormativeEffects {
  leans?: readonly string[];
  align?: number;
  dark?: number;
  standing?: number;
  flag?: string;
  person?: FormativePerson;
  /** A scar the answer gives (suggested at the end; Massacre survivor and War veteran are given). */
  scar?: string;
  fact: string;
}

export interface FormativeChoice extends FormativeEffects {
  id: string;
  label: string;
  /** A roll (invented chance): on a failure the `fail` effects replace the named fields. */
  roll?: { chance: number; fail: Partial<FormativeEffects> };
}

export interface FormativeEvent {
  id: string;
  set: FormativeSet;
  title: string;
  text: string;
  /** Ages the scene can happen at (real years). */
  ages: readonly [number, number];
  /** A dated or conditional event. */
  needs?: 'sacking' | 'war' | 'forceSensitive' | 'birthFamily';
  /**
   * What the scene means for the numbers the form records (m8-audit A3): a first battle is war service, so war years at least 1.
   * The form is raised to it after the quiz (shown in its "what changed" line), and a campaign is refused with less.
   */
  implies?: { warYears?: number };
  choices: readonly FormativeChoice[];
}

/** Bond sizes on the relationship scale (+-100; invented). */
export const BOND = { strong: 30, bond: 20, small: 10, resent: -15, rival: -25, hate: -35 } as const;
/** The chance a "caught on a roll" or "a roll decides" goes against the character (invented). */
const ROLL = 0.5;

export const FORMATIVE_EVENTS: readonly FormativeEvent[] = [
  // ---- Jedi Initiate (ages about 5-13) ----
  {
    id: 'init.forbiddenText', set: 'initiate', title: 'The forbidden text', ages: [8, 13],
    text: 'In the Archives you find a text describing a dark-side technique: a choke.',
    choices: [
      { id: 'master', label: 'Take it to a Master', leans: ['disciplined', 'idealistic'], standing: 1, align: 1, fact: 'As an Initiate, found a dark-side text in the Archives and took it to a Master.' },
      { id: 'more', label: 'Look for more in secret', leans: ['curious'], flag: 'knowsOfTechnique:choke', align: -1, fact: 'As an Initiate, read in secret about a dark-side choke in the Archives.' },
      { id: 'try', label: 'Try it on a training droid', leans: ['curious', 'reckless'], flag: 'knowsOfTechnique:choke', dark: 2, align: -2, fact: 'As an Initiate, tried a dark-side choke on a training droid (knows of it, cannot do it).' },
      { id: 'forget', label: 'Put it back and forget it', fact: 'As an Initiate, found a dark-side text and put it back.' },
    ],
  },
  {
    id: 'init.prank', set: 'initiate', title: 'The prank', ages: [6, 13],
    text: 'A friend wants to prank your instructor.',
    choices: [
      { id: 'join', label: 'Join in', leans: ['witty', 'loyal'], person: { who: 'a clanmate, partner in a prank', bond: BOND.bond }, fact: 'Pulled a prank on an instructor with a clanmate.', roll: { chance: ROLL, fail: { standing: -1, fact: 'Pulled a prank on an instructor with a clanmate, and both were caught.' } } },
      { id: 'stay', label: 'Stay out of it', leans: ['cautious', 'reserved'], fact: 'Stayed out of a clanmate\'s prank on an instructor.' },
      { id: 'report', label: 'Report him', leans: ['disciplined'], standing: 1, person: { who: 'a clanmate you reported for a prank', bond: BOND.rival, tie: 'rival' }, fact: 'Reported a clanmate\'s prank; the instructor trusts you, the clanmate does not.' },
      { id: 'talk', label: 'Talk him out of it', leans: ['patient', 'compassionate'], person: { who: 'a clanmate you talked out of a prank', bond: BOND.small }, fact: 'Talked a clanmate out of pranking an instructor.' },
    ],
  },
  {
    id: 'init.curfew', set: 'initiate', title: 'Out after curfew', ages: [7, 13],
    text: 'A friend wants to sneak out of the dormitory at night.',
    choices: [
      { id: 'mischief', label: 'Go and cause mischief', leans: ['reckless', 'witty'], person: { who: 'a clanmate, a night-time accomplice', bond: BOND.bond }, fact: 'Snuck out after curfew with a clanmate to cause mischief.', roll: { chance: ROLL, fail: { standing: -1, fact: 'Snuck out after curfew with a clanmate and was caught.' } } },
      { id: 'explore', label: 'Go, but only explore', leans: ['curious'], fact: 'Snuck out after curfew and found a hidden corner of the Temple few know.' },
      { id: 'refuse', label: 'Refuse', leans: ['disciplined'], fact: 'Refused to break curfew.' },
    ],
  },
  {
    id: 'init.mocked', set: 'initiate', title: 'Lost and mocked', ages: [6, 13],
    text: 'A clanmate beats you sparring and gloats.',
    choices: [
      { id: 'train', label: 'Train harder alone', leans: ['disciplined', 'proud'], person: { who: 'a clanmate who beat you sparring', bond: BOND.resent, tie: 'rival' }, fact: 'Lost a spar to a gloating clanmate and trained harder alone.' },
      { id: 'anger', label: 'Strike back in anger', leans: ['hotHeaded'], dark: 1, align: -1, fact: 'Struck back in anger at a clanmate who gloated over a spar.' },
      { id: 'ask', label: 'Ask the instructor what went wrong', leans: ['patient'], fact: 'Lost a spar and asked the instructor what went wrong.' },
      { id: 'laugh', label: 'Laugh it off', leans: ['witty'], fact: 'Laughed off a lost spar.' },
    ],
  },
  {
    id: 'init.fallingBehind', set: 'initiate', title: 'A friend falling behind', ages: [8, 13],
    text: 'A clanmate is falling behind and may be sent to the Service Corps.',
    choices: [
      { id: 'help', label: 'Help them at your own cost', leans: ['compassionate', 'loyal'], person: { who: 'a clanmate you helped through the lessons', bond: BOND.strong }, fact: 'Helped a struggling clanmate at the cost of their own training.' },
      { id: 'self', label: 'Focus on yourself', leans: ['ambitious'], fact: 'Kept to their own training while a clanmate fell behind.' },
      { id: 'master', label: 'Tell a Master', leans: ['disciplined'], fact: 'Told a Master about a clanmate falling behind.' },
    ],
  },
  {
    id: 'init.gathering', set: 'initiate', title: 'The Gathering', ages: [8, 13],
    text: 'In the crystal cave a vision frightens you.',
    choices: [
      { id: 'face', label: 'Face it and press on', leans: ['idealistic', 'proud'], fact: 'Faced a frightening vision in the crystal cave and pressed on.' },
      { id: 'retry', label: 'Leave, then try again', leans: ['patient', 'cautious'], fact: 'Left the crystal cave after a vision, then went back and finished.' },
      { id: 'secret', label: 'It shows something dark; never tell', leans: ['reserved'], flag: 'visionKeptSecret', fact: 'Saw something dark in the crystal cave and never told anyone.' },
    ],
  },
  {
    id: 'init.outsideTie', set: 'initiate', title: 'A tie from outside', ages: [7, 13],
    text: 'Word comes from your birth family, or a friendship the Masters warn about deepens.',
    choices: [
      { id: 'secret', label: 'Keep in touch in secret', leans: ['loyal'], person: { who: 'someone outside the Order you keep in touch with', bond: BOND.strong, tie: 'familyTie' }, fact: 'Kept in touch in secret with someone outside the Order.' },
      { id: 'letGo', label: 'Tell the Masters and let go', leans: ['disciplined'], align: 1, fact: 'Told the Masters about a tie from outside and let it go.' },
      { id: 'ask', label: 'Ask openly what is allowed', leans: ['idealistic'], fact: 'Asked the Masters openly what ties are allowed.' },
    ],
  },
  {
    id: 'init.notChosen', set: 'initiate', title: 'Not yet chosen', ages: [12, 13],
    text: 'You are nearly 13 and no Knight has taken you as a Padawan.',
    choices: [
      { id: 'shine', label: 'Shine at the tournament', leans: ['ambitious', 'proud'], fact: 'Nearly 13 and unchosen, set out to shine at the Initiate tournament.' },
      { id: 'trust', label: 'Meditate and trust the Force', leans: ['patient'], fact: 'Nearly 13 and unchosen, trusted the Force.' },
      { id: 'approach', label: 'Approach a Knight yourself', leans: ['witty', 'ambitious'], fact: 'Nearly 13 and unchosen, went to a Knight to ask to be taken on.' },
    ],
  },
  {
    id: 'init.sacking', set: 'initiate', title: 'The Sacking of Coruscant', ages: [4, 13], needs: 'sacking',
    text: 'The Sith fall on the Temple in 3,653 BBY.',
    choices: [
      { id: 'hide', label: 'Hide the younger ones', leans: ['compassionate', 'loyal'], scar: 'massacreSurvivor', fact: 'At the Sacking of Coruscant, hid the younger Initiates from the Sith.' },
      { id: 'fight', label: 'Fight', leans: ['reckless', 'hotHeaded'], scar: 'massacreSurvivor', fact: 'At the Sacking of Coruscant, fought the Sith in the Temple halls.' },
      { id: 'flee', label: 'Flee as ordered', leans: ['disciplined'], scar: 'massacreSurvivor', fact: 'At the Sacking of Coruscant, fled the Temple as ordered.' },
    ],
  },
  // ---- Jedi Padawan (ages about 13-20) ----
  {
    id: 'pad.mastersFlaw', set: 'padawan', title: "Your master's flaw", ages: [14, 20],
    text: 'You see your master break a rule: a lie to the Council, too much force, a hidden attachment.',
    choices: [
      { id: 'confront', label: 'Confront them privately', leans: ['idealistic', 'stubborn'], fact: 'Confronted their master in private over a broken rule; the bond was tested.' },
      { id: 'report', label: 'Report it to the Council', leans: ['disciplined'], standing: 1, fact: 'Reported their own master to the Council; the bond cooled.' },
      { id: 'keep', label: 'Keep their secret', leans: ['loyal'], fact: "Kept their master's secret." },
      { id: 'copy', label: 'Copy them', leans: ['reckless'], align: -1, fact: "Learned from their master's broken rule to break it too." },
    ],
  },
  {
    id: 'pad.pirate', set: 'padawan', title: 'The pirate who surrenders', ages: [14, 20],
    text: 'You disarm a pirate who has just killed a villager.',
    choices: [
      { id: 'alive', label: 'Take him in alive', leans: ['disciplined', 'compassionate'], align: 1, fact: 'As a Padawan, took in alive a pirate who had killed a villager.' },
      { id: 'go', label: 'Let him go', leans: ['compassionate'], fact: 'As a Padawan, let a murderous pirate go.' },
      { id: 'kill', label: 'Strike him down in anger', leans: ['hotHeaded'], align: -2, dark: 2, scar: 'firstKill', fact: 'As a Padawan, struck down a disarmed pirate in anger.' },
    ],
  },
  {
    id: 'pad.reward', set: 'padawan', title: 'The grateful stranger', ages: [13, 20],
    text: 'A local offers you a rich reward.',
    choices: [
      { id: 'decline', label: 'Decline', leans: ['disciplined', 'idealistic'], fact: 'Declined a rich reward, as a Jedi should.' },
      { id: 'accept', label: 'Accept quietly', flag: 'keptReward', fact: 'Quietly kept a rich reward as a Padawan.' },
      { id: 'give', label: 'Accept and give it to the needy', leans: ['compassionate'], fact: 'Took a reward and gave it all to the needy.' },
    ],
  },
  {
    id: 'pad.love', set: 'padawan', title: 'Falling for someone', ages: [15, 20],
    text: 'You fall for someone on a mission world, or a fellow Padawan.',
    choices: [
      { id: 'end', label: 'End it', leans: ['disciplined'], align: 1, fact: 'Ended a love affair as a Padawan.' },
      { id: 'secret', label: 'Keep it secret', person: { who: 'a secret love', bond: BOND.strong, tie: 'forbiddenBond' }, fact: 'Has kept a love secret from the Order since Padawan days.' },
      { id: 'tell', label: 'Tell your master', leans: ['idealistic'], fact: 'Told their master about falling in love.' },
    ],
  },
  {
    id: 'pad.withdraw', set: 'padawan', title: 'The order to withdraw', ages: [14, 20],
    text: 'You are ordered to withdraw, leaving villagers behind.',
    choices: [
      { id: 'obey', label: 'Obey', leans: ['disciplined'], fact: 'Obeyed an order to withdraw and left villagers behind.' },
      { id: 'disobey', label: 'Disobey and save them', leans: ['compassionate', 'reckless'], standing: -1, fact: 'Disobeyed an order to withdraw and saved the villagers; the bond with their master was tested.' },
      { id: 'third', label: 'Find a third way', leans: ['witty', 'cautious'], fact: 'Found a third way to save villagers without breaking orders.', roll: { chance: ROLL, fail: { fact: 'Tried a third way to save villagers; it only half worked.' } } },
    ],
  },
  {
    id: 'pad.mistake', set: 'padawan', title: 'Your mistake', ages: [14, 20],
    text: 'People die on a mission because of something you did.',
    choices: [
      { id: 'confess', label: 'Confess everything', leans: ['idealistic'], standing: -1, fact: 'Confessed a fatal mistake on a mission.' },
      { id: 'blame', label: 'Blame circumstances', leans: ['proud'], align: -1, fact: 'Blamed circumstances for deaths on a mission.' },
      { id: 'bury', label: 'Bury yourself in training', leans: ['disciplined', 'reserved'], fact: 'Buried guilt over a fatal mistake in training.', roll: { chance: ROLL, fail: { scar: 'disgraced', fact: 'Made a fatal mistake on a mission that became public; buried the guilt in training.' } } },
    ],
  },
  {
    id: 'pad.darkWarrior', set: 'padawan', title: 'The dark warrior', ages: [15, 20],
    text: 'A dark-side user beats you and offers to teach you.',
    choices: [
      { id: 'refuse', label: 'Refuse and meditate it away', leans: ['patient'], align: 1, fact: 'Refused a dark-side warrior\'s offer to teach them.' },
      { id: 'rematch', label: 'Win the rematch through anger', leans: ['hotHeaded'], dark: 2, scar: 'brushWithDark', fact: 'Beat a dark-side warrior in a rematch by drawing on anger.' },
      { id: 'run', label: 'Run and tell no one', leans: ['cautious', 'reserved'], flag: 'darkEncounterKeptSecret', fact: 'Ran from a dark-side warrior and told no one.' },
    ],
  },
  {
    id: 'pad.rival', set: 'padawan', title: 'The rival Padawan', ages: [14, 20],
    text: 'A rival Padawan is chosen ahead of you for an honour.',
    choices: [
      { id: 'fair', label: 'Beat them fairly next time', leans: ['ambitious', 'proud'], person: { who: 'a rival Padawan', bond: BOND.resent, tie: 'rival' }, fact: 'Swore to beat a rival Padawan fairly.' },
      { id: 'congratulate', label: 'Congratulate them', leans: ['patient', 'compassionate'], person: { who: 'a Padawan friend', bond: BOND.bond }, fact: 'Congratulated a rival Padawan and made a friend.' },
      { id: 'undermine', label: 'Undermine them', leans: ['ambitious'], align: -2, person: { who: 'a rival Padawan you undermined', bond: BOND.hate, tie: 'rival' }, fact: 'Undermined a rival Padawan.' },
    ],
  },
  {
    id: 'pad.injustice', set: 'padawan', title: 'Injustice the Republic tolerates', ages: [15, 20],
    text: 'Slavery is ignored for the sake of a treaty.',
    choices: [
      { id: 'follow', label: 'Follow orders', leans: ['disciplined'], fact: 'Followed orders while slavery was ignored for a treaty.' },
      { id: 'free', label: 'Free them in secret', leans: ['idealistic', 'reckless'], flag: 'freedSlaves', fact: 'Freed slaves in secret against the treaty.', roll: { chance: ROLL, fail: { standing: -1, fact: 'Freed slaves in secret against the treaty, and was found out.' } } },
      { id: 'council', label: 'Take it to the Council', leans: ['idealistic'], standing: 1, fact: 'Took the ignored slavery to the Council.' },
    ],
  },
  {
    id: 'pad.firstBattle', set: 'padawan', title: 'Your first battle', ages: [14, 20], needs: 'war', implies: { warYears: 1 },
    text: 'The Padawan years fall in a war, and you see your first battle.',
    choices: [
      { id: 'front', label: 'Lead from the front', leans: ['reckless', 'proud'], scar: 'warVeteran', fact: 'Led from the front in their first battle as a Padawan.' },
      { id: 'wounded', label: 'Protect the wounded', leans: ['compassionate'], scar: 'warVeteran', fact: 'Protected the wounded in their first battle as a Padawan.' },
      { id: 'hold', label: 'Hold the line as ordered', leans: ['disciplined'], scar: 'warVeteran', fact: 'Held the line as ordered in their first battle as a Padawan.' },
    ],
  },
  // ---- Sith acolyte (Korriban, ages about 8-18) ----
  {
    id: 'sith.plot', set: 'sith', title: "The rival's plot", ages: [9, 18],
    text: 'An acolyte means to frame you for a theft.',
    choices: [
      { id: 'first', label: 'Strike first and frame him', leans: ['ambitious', 'cautious'], align: -1, standing: 1, fact: 'Framed an acolyte who meant to frame them.' },
      { id: 'expose', label: 'Expose him to the overseer', leans: ['disciplined'], standing: 1, person: { who: 'an acolyte you exposed', bond: BOND.rival, tie: 'rival' }, fact: "Exposed a rival acolyte's plot to the overseer." },
      { id: 'confront', label: 'Confront him openly', leans: ['proud', 'hotHeaded'], fact: 'Confronted a plotting acolyte openly and won the duel.', roll: { chance: ROLL, fail: { fact: 'Confronted a plotting acolyte openly and lost the duel.' } } },
      { id: 'warn', label: 'Warn him off quietly', leans: ['witty'], person: { who: 'an acolyte who owes you', bond: BOND.small, tie: 'contact' }, fact: 'Warned off a plotting acolyte, who now owes them.' },
    ],
  },
  {
    id: 'sith.slave', set: 'sith', title: 'The slave who helps', ages: [8, 16],
    text: 'A slave sneaks you food after a punishment.',
    choices: [
      { id: 'protect', label: 'Protect them in return', leans: ['compassionate'], align: 2, person: { who: 'an academy slave you protect', bond: BOND.strong, tie: 'ward' }, fact: 'Protected an academy slave who once fed them.', roll: { chance: ROLL, fail: { standing: -1 } } },
      { id: 'ignore', label: 'Ignore it', leans: ['reserved'], fact: 'Ignored a slave\'s kindness.' },
      { id: 'report', label: 'Report them for favour', leans: ['ambitious'], align: -2, standing: 1, fact: 'Reported a kind slave to win the overseer\'s favour.' },
    ],
  },
  {
    id: 'sith.tomb', set: 'sith', title: "The tomb's whisper", ages: [12, 18],
    text: 'A spirit offers power during a tomb trial.',
    choices: [
      { id: 'bargain', label: 'Bargain with it', leans: ['ambitious', 'curious'], dark: 2, flag: 'spiritBargain', fact: 'Struck a bargain with a spirit in a Korriban tomb.' },
      { id: 'only', label: 'Take only what you came for', leans: ['disciplined', 'cautious'], fact: 'Took only what the tomb trial asked.' },
      { id: 'relic', label: 'Take a relic and hide it', leans: ['curious', 'reserved'], flag: 'hiddenRelic', fact: 'Took a relic from a Korriban tomb and hid it.' },
    ],
  },
  {
    id: 'sith.ambushed', set: 'sith', title: 'Ambushed', ages: [10, 18],
    text: 'A rival attacks you in the dark, and you win.',
    choices: [
      { id: 'kill', label: 'Kill him', leans: ['hotHeaded', 'proud'], align: -2, scar: 'firstKill', fact: 'Killed a rival acolyte who ambushed them.' },
      { id: 'own', label: 'Spare him and own him', leans: ['witty', 'cautious'], person: { who: 'an acolyte you spared and own', bond: BOND.small, tie: 'contact' }, fact: 'Spared an ambushing acolyte and made him their creature.' },
      { id: 'drag', label: 'Drag him before the overseer', leans: ['disciplined'], standing: 1, fact: 'Dragged an ambushing acolyte before the overseer.' },
    ],
  },
  {
    id: 'sith.pain', set: 'sith', title: 'The lesson in pain', ages: [11, 18],
    text: 'An overseer orders you to torture a prisoner.',
    choices: [
      { id: 'obey', label: 'Obey', leans: ['disciplined'], align: -3, standing: 1, fact: 'Tortured a prisoner on an overseer\'s order.' },
      { id: 'refuse', label: 'Refuse', leans: ['idealistic', 'stubborn'], align: 2, standing: -2, scar: 'formerPrisoner', fact: 'Refused to torture a prisoner and was punished in a cell.', roll: { chance: ROLL, fail: { scar: 'betrayed', fact: 'Refused to torture a prisoner; a fellow acolyte informed and they were punished.' } } },
      { id: 'fake', label: 'Fake it convincingly', leans: ['witty', 'compassionate'], align: 1, fact: 'Faked torturing a prisoner convincingly.', roll: { chance: ROLL, fail: { standing: -1, fact: 'Faked torturing a prisoner and was caught.' } } },
    ],
  },
  {
    id: 'sith.runaway', set: 'sith', title: 'The runaway', ages: [9, 18],
    text: 'A fellow acolyte tries to flee the academy.',
    choices: [
      { id: 'help', label: 'Help them escape', leans: ['compassionate', 'loyal'], align: 2, fact: 'Helped a fellow acolyte escape the academy.', roll: { chance: ROLL, fail: { standing: -2, fact: 'Helped a fellow acolyte escape the academy and was caught.' } } },
      { id: 'turn', label: 'Turn them in', leans: ['ambitious', 'disciplined'], align: -1, standing: 1, fact: 'Turned in an acolyte trying to flee.' },
      { id: 'away', label: 'Look away', leans: ['reserved', 'cautious'], fact: 'Looked away as an acolyte fled.' },
    ],
  },
  {
    id: 'sith.holocron', set: 'sith', title: 'The forbidden holocron', ages: [12, 18],
    text: 'A holocron holds a technique beyond your rank.',
    choices: [
      { id: 'hand', label: 'Hand it to the overseer', leans: ['disciplined'], standing: 1, fact: 'Handed a forbidden holocron to the overseer.' },
      { id: 'study', label: 'Study it in secret', leans: ['curious', 'ambitious'], flag: 'knowsOfTechnique:holocron', fact: 'Studied a forbidden holocron in secret (knows of the technique, cannot do it).' },
      { id: 'trade', label: 'Trade it to a Lord', leans: ['witty', 'ambitious'], person: { who: 'a Sith Lord you traded a holocron to', bond: BOND.bond, tie: 'patron' }, fact: 'Traded a forbidden holocron to a Sith Lord for protection.' },
    ],
  },
  {
    id: 'sith.chosen', set: 'sith', title: 'Chosen as an apprentice', ages: [14, 18],
    text: 'A Lord is choosing an apprentice.',
    choices: [
      { id: 'ruthless', label: 'Show ruthlessness', leans: ['hotHeaded', 'proud'], align: -1, fact: 'Showed ruthlessness when a Lord was choosing an apprentice.' },
      { id: 'cunning', label: 'Show cunning', leans: ['witty', 'cautious'], fact: 'Showed cunning when a Lord was choosing an apprentice.' },
      { id: 'control', label: 'Show restraint and control', leans: ['patient', 'disciplined'], fact: 'Showed restraint and control when a Lord was choosing an apprentice.' },
    ],
  },
  {
    id: 'sith.firstBattle', set: 'sith', title: 'Your first battle', ages: [14, 18], needs: 'war', implies: { warYears: 1 },
    text: 'The academy years fall in a war, and you see your first battle.',
    choices: [
      { id: 'charge', label: 'Lead the charge', leans: ['reckless', 'proud'], scar: 'warVeteran', fact: 'Led the charge in their first battle as an acolyte.' },
      { id: 'kill', label: 'Kill without hesitation', leans: ['disciplined'], align: -1, scar: 'warVeteran', fact: 'Killed without hesitation in their first battle.' },
      { id: 'save', label: 'Save a comrade', leans: ['loyal'], align: 1, scar: 'warVeteran', person: { who: 'a comrade you saved in battle', bond: BOND.strong }, fact: 'Saved a comrade in their first battle.' },
    ],
  },
  // ---- Military (cadet and early service, ages about 14-20) ----
  {
    id: 'mil.hazing', set: 'military', title: 'The hazing', ages: [14, 19],
    text: 'Senior cadets torment a struggling recruit.',
    choices: [
      { id: 'join', label: 'Join in', leans: ['proud', 'ambitious'], align: -1, fact: 'Joined senior cadets in hazing a recruit.' },
      { id: 'stop', label: 'Step in and stop it', leans: ['compassionate', 'idealistic'], person: { who: 'a recruit you protected from hazing', bond: BOND.strong, tie: 'ward' }, fact: 'Stopped a hazing; the seniors resent it.' },
      { id: 'report', label: 'Report it', leans: ['disciplined'], standing: 1, fact: 'Reported a hazing; the seniors resent it.' },
      { id: 'stay', label: 'Stay out', leans: ['reserved', 'cautious'], fact: 'Stayed out of a hazing.' },
    ],
  },
  {
    id: 'mil.exam', set: 'military', title: 'The stolen exam', ages: [14, 19],
    text: 'A squadmate has the answers to an exam.',
    choices: [
      { id: 'use', label: 'Use them', leans: ['ambitious', 'reckless'], fact: 'Used stolen exam answers and was never caught.', roll: { chance: ROLL, fail: { scar: 'disgraced', standing: -1, fact: 'Used stolen exam answers and was caught.' } } },
      { id: 'report', label: 'Report it', leans: ['disciplined', 'idealistic'], standing: 1, fact: 'Reported a stolen exam; the squad distrusts them.' },
      { id: 'refuse', label: 'Refuse quietly and study', leans: ['disciplined', 'proud'], fact: 'Refused stolen exam answers and studied.' },
    ],
  },
  {
    id: 'mil.punishment', set: 'military', title: 'The unfair punishment', ages: [14, 19],
    text: "The whole squad is punished for one cadet's mistake.",
    choices: [
      { id: 'blame', label: 'Take the blame', leans: ['loyal'], standing: -1, fact: "Took the blame for a squadmate's mistake; the squad stands by them." },
      { id: 'endure', label: 'Keep quiet and endure', leans: ['disciplined', 'patient'], fact: 'Endured an unfair squad punishment in silence.' },
      { id: 'protest', label: 'Protest', leans: ['stubborn', 'idealistic'], fact: 'Protested an unfair squad punishment.', roll: { chance: ROLL, fail: { standing: -1, fact: 'Protested an unfair squad punishment; the instructor marked them.' } } },
    ],
  },
  {
    id: 'mil.exercise', set: 'military', title: 'The exercise gone wrong', ages: [15, 20],
    text: 'A squadmate is badly hurt in an exercise.',
    choices: [
      { id: 'finish', label: 'Finish the objective', leans: ['disciplined', 'ambitious'], standing: 1, fact: 'Finished the objective while a squadmate lay hurt.' },
      { id: 'carry', label: 'Carry them back', leans: ['loyal', 'compassionate'], person: { who: 'a squadmate you carried back', bond: BOND.strong }, fact: 'Carried a hurt squadmate back and failed the exercise.' },
      { id: 'both', label: 'Improvise and do both', leans: ['witty', 'reckless'], fact: 'Improvised to finish the objective and save a hurt squadmate.', roll: { chance: ROLL, fail: { fact: 'Tried to finish the objective and save a squadmate, and managed neither well.' } } },
    ],
  },
  {
    id: 'mil.illegalOrder', set: 'military', title: 'The illegal order', ages: [17, 20],
    text: 'On a first posting you are ordered to use force against unarmed civilians.',
    choices: [
      { id: 'obey', label: 'Obey', leans: ['disciplined'], align: -3, fact: 'Obeyed an order to use force on unarmed civilians.' },
      { id: 'refuse', label: 'Refuse', leans: ['idealistic', 'stubborn'], align: 2, standing: -2, fact: 'Refused an order to use force on unarmed civilians.', roll: { chance: ROLL, fail: { scar: 'outcast', fact: 'Refused an order to fire on civilians and was cast out of the unit.' } } },
      { id: 'stall', label: 'Stall and find another way', leans: ['witty', 'cautious'], align: 1, fact: 'Stalled an illegal order and found another way.' },
    ],
  },
  {
    id: 'mil.blackMarket', set: 'military', title: 'The barracks black market', ages: [16, 20],
    text: 'A sergeant offers you a cut of the black market.',
    choices: [
      { id: 'take', label: 'Take it', leans: ['ambitious'], person: { who: 'a sergeant who runs the barracks black market', bond: BOND.small, tie: 'contact' }, fact: 'Took a cut of the barracks black market.', roll: { chance: ROLL, fail: { standing: -1, fact: 'Took a cut of the barracks black market and was caught.' } } },
      { id: 'report', label: 'Report it', leans: ['disciplined'], standing: 1, fact: 'Reported the barracks black market; made enemies in the ranks.' },
      { id: 'buy', label: 'Buy, but stay out of the trade', leans: ['witty'], fact: 'Bought from the barracks black market but stayed out of the trade.' },
    ],
  },
  {
    id: 'mil.deserter', set: 'military', title: 'The friend who wants to desert', ages: [15, 20],
    text: 'A friend wants to desert.',
    choices: [
      { id: 'help', label: 'Help them go', leans: ['loyal', 'compassionate'], fact: 'Helped a friend desert.', roll: { chance: ROLL, fail: { standing: -2, fact: 'Helped a friend desert and was found out.' } } },
      { id: 'stay', label: 'Talk them into staying', leans: ['patient', 'loyal'], person: { who: 'a friend you talked out of deserting', bond: BOND.bond }, fact: 'Talked a friend out of deserting.' },
      { id: 'report', label: 'Report them', leans: ['disciplined'], standing: 1, person: { who: 'a friend you reported for trying to desert', bond: BOND.hate, tie: 'rival' }, fact: 'Reported a friend who meant to desert.' },
    ],
  },
  {
    id: 'mil.patron', set: 'military', title: "The patron's offer", ages: [17, 20],
    text: 'A highborn officer offers you advancement for your loyalty.',
    choices: [
      { id: 'accept', label: 'Accept', person: { who: 'a highborn officer who sponsors you', bond: BOND.bond, tie: 'patron' }, fact: 'Accepted a highborn officer\'s patronage.' },
      { id: 'decline', label: 'Decline', leans: ['proud', 'idealistic'], fact: 'Declined a highborn officer\'s patronage.' },
      { id: 'counsel', label: 'Accept and keep your own counsel', leans: ['witty', 'cautious'], person: { who: 'a highborn officer who sponsors you, for now', bond: BOND.small, tie: 'patron' }, fact: 'Accepted a patron but keeps their own counsel.' },
    ],
  },
  {
    id: 'mil.firstBattle', set: 'military', title: 'Your first battle', ages: [16, 20], needs: 'war', implies: { warYears: 1 },
    text: 'Service falls in a war, and you see your first battle.',
    choices: [
      { id: 'front', label: 'Lead from the front', leans: ['reckless', 'proud'], scar: 'warVeteran', fact: 'Led from the front in their first battle.' },
      { id: 'wounded', label: 'Protect the wounded', leans: ['compassionate'], scar: 'warVeteran', fact: 'Protected the wounded in their first battle.' },
      { id: 'hold', label: 'Hold the line', leans: ['disciplined'], scar: 'warVeteran', fact: 'Held the line in their first battle.' },
    ],
  },
  // ---- Civilian: street kid ----
  {
    id: 'civ.gangTest', set: 'street', title: "The gang's test", ages: [9, 17],
    text: 'Steal from a shopkeeper who has been kind to you, and the gang takes you in.',
    choices: [
      { id: 'do', label: 'Do it', leans: ['ambitious', 'reckless'], align: -1, person: { who: 'a gang member who vouched for you', bond: BOND.bond, tie: 'contact' }, fact: 'Robbed a kind shopkeeper to join a street gang.' },
      { id: 'refuse', label: 'Refuse', leans: ['idealistic', 'stubborn'], fact: 'Refused to rob a kind shopkeeper; the gang made life hard.' },
      { id: 'fake', label: 'Fake it and warn the shopkeeper', leans: ['witty', 'compassionate'], person: { who: 'a shopkeeper you warned', bond: BOND.bond, tie: 'patron' }, fact: 'Faked a theft for the gang and warned the shopkeeper.', roll: { chance: ROLL, fail: { person: { who: 'a gang that found out you lied', bond: BOND.rival }, fact: 'Faked a theft for the gang and warned the shopkeeper; the gang found out.' } } },
    ],
  },
  {
    id: 'civ.sweep', set: 'street', title: 'The security sweep', ages: [8, 17],
    text: 'You and a friend are caught in a sweep; only one can run.',
    choices: [
      { id: 'fall', label: 'Take the fall', leans: ['loyal'], scar: 'formerPrisoner', person: { who: 'a friend you took the fall for', bond: BOND.strong }, fact: 'Took the fall for a friend in a security sweep and spent time in a cell.' },
      { id: 'run', label: 'Run yourself', leans: ['cautious'], person: { who: 'a friend you left in a sweep', bond: BOND.resent }, fact: 'Ran from a security sweep and left a friend behind.' },
      { id: 'talk', label: 'Talk your way out', leans: ['witty'], fact: 'Talked their way out of a security sweep.', roll: { chance: ROLL, fail: { scar: 'formerPrisoner', fact: 'Tried to talk their way out of a security sweep and was locked up.' } } },
    ],
  },
  {
    id: 'civ.hungryKid', set: 'street', title: 'The hungry younger kid', ages: [9, 17],
    text: 'A hungry younger kid lives on your street.',
    choices: [
      { id: 'share', label: 'Share what you have', leans: ['compassionate'], person: { who: 'a street kid you look after', bond: BOND.strong, tie: 'ward' }, fact: 'Took a hungry street kid under their wing.' },
      { id: 'teach', label: 'Teach them to survive', leans: ['patient', 'loyal'], person: { who: 'a street kid you taught to survive', bond: BOND.bond, tie: 'ward' }, fact: 'Taught a younger street kid to survive.' },
      { id: 'keep', label: 'Keep your food', leans: ['reserved', 'cautious'], fact: 'Kept their food from a hungry younger kid.' },
    ],
  },
  {
    id: 'civ.errand', set: 'street', title: "The crime lord's errand", ages: [11, 18],
    text: "A Hutt's agent pays well to carry a package.",
    choices: [
      { id: 'do', label: 'Do it', leans: ['ambitious'], person: { who: "a Hutt's agent", bond: BOND.small, tie: 'contact' }, fact: "Ran packages for a Hutt's agent." },
      { id: 'refuse', label: 'Refuse', leans: ['cautious'], fact: "Refused a Hutt's errand." },
      { id: 'open', label: 'Open it first', leans: ['curious'], flag: 'knowsSecret:hutt-package', fact: "Opened a Hutt's package and learned what was inside.", roll: { chance: ROLL, fail: { person: { who: "a Hutt's agent who knows you looked", bond: BOND.rival }, fact: "Opened a Hutt's package; the Hutt's agent knows." } } },
    ],
  },
  // ---- Civilian: noble child ----
  {
    id: 'civ.servant', set: 'noble', title: "The servant's mistake", ages: [7, 16],
    text: 'A servant breaks an heirloom and begs you not to tell.',
    choices: [
      { id: 'cover', label: 'Cover for them', leans: ['compassionate', 'loyal'], person: { who: 'a household servant you covered for', bond: BOND.bond, tie: 'contact' }, fact: 'Covered for a servant who broke an heirloom.' },
      { id: 'tell', label: 'Tell your parents', leans: ['disciplined'], standing: 1, fact: 'Told their parents about a broken heirloom.' },
      { id: 'leverage', label: 'Use it as leverage', leans: ['witty', 'ambitious'], align: -1, person: { who: 'a servant who owes and resents you', bond: BOND.resent, tie: 'contact' }, fact: 'Held a broken heirloom over a servant.' },
    ],
  },
  {
    id: 'civ.match', set: 'noble', title: 'The arranged match', ages: [14, 18],
    text: 'Your family arranges a match to secure an alliance.',
    choices: [
      { id: 'accept', label: 'Accept', leans: ['disciplined', 'loyal'], standing: 1, fact: 'Accepted an arranged match for the family.' },
      { id: 'defy', label: 'Defy them', leans: ['stubborn', 'idealistic'], standing: -2, fact: 'Defied the family over an arranged match.', roll: { chance: ROLL, fail: { scar: 'outcast', fact: 'Defied the family over an arranged match and was cast out.' } } },
      { id: 'undermine', label: 'Agree, then quietly undermine it', leans: ['witty', 'cautious'], fact: 'Agreed to an arranged match and quietly undid it.', roll: { chance: ROLL, fail: { standing: -1, fact: 'Tried to undo an arranged match quietly and was found out.' } } },
    ],
  },
  {
    id: 'civ.rivalHeir', set: 'noble', title: 'The rival heir', ages: [12, 18],
    text: 'A rival heir insults you at court.',
    choices: [
      { id: 'wit', label: 'Answer with wit', leans: ['witty'], person: { who: 'a rival heir', bond: BOND.rival, tie: 'rival' }, fact: 'Answered a rival heir\'s insult with wit at court.' },
      { id: 'duel', label: 'Challenge them to a duel', leans: ['proud', 'hotHeaded'], person: { who: 'a rival heir you duelled', bond: BOND.rival, tie: 'rival' }, fact: 'Duelled a rival heir over an insult and won.', roll: { chance: ROLL, fail: { fact: 'Duelled a rival heir over an insult and lost.' } } },
      { id: 'rise', label: 'Rise above it', leans: ['patient', 'reserved'], standing: 1, fact: 'Rose above a rival heir\'s insult at court.' },
    ],
  },
  {
    id: 'civ.familySecret', set: 'noble', title: 'The family secret', ages: [13, 18],
    text: "Your family's wealth rests on something shameful.",
    choices: [
      { id: 'confront', label: 'Confront them', leans: ['idealistic'], standing: -1, fact: 'Confronted the family over the shameful source of its wealth.' },
      { id: 'silent', label: 'Stay silent', leans: ['loyal', 'reserved'], fact: "Keeps silent about the family's shameful secret." },
      { id: 'use', label: 'Use it later', leans: ['ambitious'], flag: 'knowsSecret:family', fact: "Knows the family's secret and means to use it." },
    ],
  },
  // ---- Civilian: spacer kid ----
  {
    id: 'civ.boarding', set: 'spacer', title: 'The pirate boarding', ages: [8, 17],
    text: 'Pirates board your family\'s ship.',
    choices: [
      { id: 'hide', label: "Hide the crew's valuables", leans: ['cautious', 'witty'], fact: "Hid the crew's valuables when pirates boarded." },
      { id: 'fight', label: 'Fight', leans: ['reckless', 'hotHeaded'], fact: 'Fought pirates who boarded the ship.', roll: { chance: ROLL, fail: { scar: 'firstKill', fact: 'Fought pirates who boarded the ship and killed one.' } } },
      { id: 'bargain', label: 'Bargain', leans: ['witty'], person: { who: 'a pirate you bargained with', bond: BOND.small, tie: 'contact' }, fact: 'Bargained with boarding pirates.' },
    ],
  },
  {
    id: 'civ.engine', set: 'spacer', title: 'The engine failure', ages: [10, 18],
    text: 'The engine fails deep in space and the adults are hurt.',
    choices: [
      { id: 'fix', label: 'Fix it yourself', leans: ['disciplined', 'curious'], fact: 'Fixed a failed engine deep in space as a child: good with machines.' },
      { id: 'call', label: 'Call for help on an open channel', leans: ['cautious'], fact: 'Called for help on an open channel when the engine failed; strangers answered.' },
      { id: 'steady', label: 'Steady the crew while you work', leans: ['patient'], fact: 'Steadied the crew through an engine failure deep in space.' },
    ],
  },
  {
    id: 'civ.port', set: 'spacer', title: 'Port freedom', ages: [11, 18],
    text: 'A night alone on a wild port world.',
    choices: [
      { id: 'explore', label: 'Explore the city', leans: ['curious', 'reckless'], fact: 'Explored a wild port city alone.', roll: { chance: ROLL, fail: { fact: 'Explored a wild port city alone and barely got back.' } } },
      { id: 'stay', label: 'Stay aboard', leans: ['cautious', 'reserved'], fact: 'Stayed aboard on a wild port world.' },
      { id: 'work', label: 'Find work for a few credits', leans: ['ambitious', 'witty'], person: { who: 'a dockmaster who gave you work', bond: BOND.small, tie: 'contact' }, fact: 'Found odd work on a wild port world.' },
    ],
  },
  // ---- Civilian: anyone ----
  {
    id: 'civ.disaster', set: 'anyone', title: 'A disaster', ages: [6, 18],
    text: 'Your world lives through a disaster: plague, bombardment or invasion.',
    choices: [
      { id: 'help', label: 'Help others escape', leans: ['compassionate', 'loyal'], scar: 'disasterSurvivor', fact: 'Helped others escape a disaster on their homeworld.', roll: { chance: 0.25, fail: { scar: 'lostFamily', fact: 'Helped others escape a disaster on their homeworld; their family did not survive.' } } },
      { id: 'family', label: 'Save your family first', leans: ['loyal'], scar: 'disasterSurvivor', person: { who: 'a parent or sibling you saved', bond: BOND.strong, tie: 'familyTie' }, fact: 'Saved their family first in a disaster.' },
      { id: 'alone', label: 'Survive alone', leans: ['reserved', 'cautious'], scar: 'disasterSurvivor', fact: 'Survived a disaster alone.', roll: { chance: 0.25, fail: { scar: 'lostFamily', fact: 'Survived a disaster alone; their family did not.' } } },
    ],
  },
  {
    id: 'civ.forceMoment', set: 'anyone', title: 'A Force moment', ages: [6, 18], needs: 'forceSensitive',
    text: 'You sense danger, move an object, or know a lie.',
    choices: [
      { id: 'hide', label: 'Hide it', leans: ['reserved', 'cautious'], flag: 'hiddenGift', fact: 'Hid a gift in the Force as a child.' },
      { id: 'tell', label: 'Tell someone you trust', leans: ['loyal', 'idealistic'], person: { who: 'someone you trusted with your gift', bond: BOND.strong, tie: 'contact' }, fact: 'Told someone they trust about a gift in the Force.' },
      { id: 'use', label: 'Use it for advantage', leans: ['ambitious', 'witty'], align: -1, fact: 'Used a gift in the Force for advantage as a child.' },
    ],
  },
];

export const FORMATIVE_EVENT_BY_ID: ReadonlyMap<string, FormativeEvent> = new Map(FORMATIVE_EVENTS.map((e) => [e.id, e]));

/** The quiz's limits (the brief): 4-8 scenes; +-2 alignment an event, +-10 overall; the same for dark pressure. */
export const QUIZ_LIMITS = { minScenes: 4, maxScenes: 8, alignPerEvent: 2, alignTotal: 10, darkPerEvent: 2, darkTotal: 10, standingPerEvent: 2, standingTotal: 4, noteMax: 120 } as const;

/**
 * Stages of the beginning a quiz can cover, by path (real years; invented splits of the catalog's ranges, two per set so a
 * single-set start still has stages to draw from). Each covered stage gives two scenes, the total held to 4-8.
 */
/** A stage's sets: '$upbringing' is the civilian list the origin trait names (street, noble or spacer). */
export type StageSet = FormativeSet | '$upbringing';
export type QuizTrack = 'jedi' | 'sith' | 'military' | 'civilian';
export const QUIZ_STAGES: Readonly<Record<QuizTrack, readonly { from: number; to: number; sets: readonly StageSet[] }[]>> = {
  jedi: [
    { from: 5, to: 9, sets: ['initiate'] },
    { from: 9, to: 13, sets: ['initiate'] },
    { from: 13, to: 16.5, sets: ['padawan'] },
    { from: 16.5, to: 20, sets: ['padawan'] },
  ],
  sith: [
    { from: 8, to: 13, sets: ['sith'] },
    { from: 13, to: 18, sets: ['sith'] },
  ],
  military: [
    { from: 6, to: 14, sets: ['$upbringing', 'anyone'] },
    { from: 14, to: 17, sets: ['military'] },
    { from: 17, to: 20, sets: ['military'] },
  ],
  civilian: [
    { from: 6, to: 10, sets: ['$upbringing', 'anyone'] },
    { from: 10, to: 14, sets: ['$upbringing', 'anyone'] },
    { from: 14, to: 18, sets: ['$upbringing', 'anyone'] },
  ],
};
/**
 * A stage counts as lived once this many years of it are behind the character (m8-fixes G1; invented: a quarter year). It replaced
 * "half the stage behind" (0.5 of its length), under which a 14-year-old Padawan drew no Padawan scene.
 */
export const STAGE_LIVED_MIN = 0.25;
/** Careers that take the military set (cadet and early service); every other career and outsider takes the civilian one. */
export const MILITARY_ARCHETYPES: readonly string[] = ['soldier', 'officer', 'navalOfficer', 'starfighterPilot', 'shipGunner', 'sniper', 'intelAgent', 'intelAnalyst'];
/** The civilian upbringing from the origin trait (the catalog: street kid, noble child, spacer kid). */
export const UPBRINGING_BY_ORIGIN: Readonly<Record<string, FormativeSet>> = {
  underlevels: 'street', criminalFamily: 'street', refugee: 'street', slaveBorn: 'street',
  nobleHouse: 'noble', imperialBorn: 'noble',
  spacerBorn: 'spacer',
};
/** A youngling start (the quiz waits for the first long skip): a Jedi Initiate, a Sith acolyte, or anyone under this age (invented). */
export const YOUNGLING_START_AGE = 13;
/** The skip that brings on a youngling's quiz: at least this many days in one unbroken jump (invented: a year). */
export const QUIZ_SKIP_DAYS = 368;
/** Days of play between two skips that still count as one skip (an interruption scene; invented). */
export const QUIZ_SKIP_GAP_DAYS = 7;
