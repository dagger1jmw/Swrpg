// Starting traits (M8 checklist item 16; spec/traits.md; design: m8-design-notes.md "Starting traits and formative events",
// the catalog agreed by Jared, 25 Nov 2026). A trait is a backstory fact with a small hook and a narrator note; every trait
// cuts both ways. 44 traits: 12 origins, 14 temperaments, 10 scars, 8 ties. One dated catalog (D-438): each trait carries
// its gate (path, species, homeworld, date), and the game resolves what is open from the character's dates.
//
// Every hook value is INVENTED (the catalog gives the direction and the band: +-1-2 on rolls, +-10-20% learning, reaction
// shifts); spec/traits.md section 9 lists them. Traits never touch the duel tiers or the 4.0x pace cap: the hooks are roll
// modifiers, a learning factor inside the M product (capped at 2.8 like every factor) and reaction shifts.

export const TRAIT_KINDS = ['origin', 'temperament', 'scar', 'tie'] as const;
export type TraitKind = (typeof TRAIT_KINDS)[number];

/**
 * The situations a trait's roll hook names. The intent call may name one for a check (`situation`); the code adds the ones it
 * can see itself (a Stealth or Investigation check in a city, a Charisma check with an elite, a mind trick on a target).
 * Combat situations are the duel's own (pressing an attack, defence, a sudden first exchange, a taunt).
 */
export const TRAIT_SITUATIONS = [
  'provocation', // Willpower against provocation or anger
  'persuasion', // resisting persuasion
  'mindTrick', // resisting a mind trick
  'fear', // Willpower against fear
  'battleFear', // fear in battle
  'pain', // pain and hardship
  'domination', // being dominated
  'interrogation',
  'intimidation',
  'despair',
  'taunt', // a taunt in a duel
  'pity', // a pity ploy
  'lies', // sensing lies and deception
  'darkSense', // sensing a dark-side user
  'ambush', // spotting traps and ambushes
  'social', // a social contest (wit, banter)
  'compromise', // a negotiation that needs compromise
  'improvise', // improvising outside doctrine
  'chaos', // when things turn chaotic
  'bold', // a bold, risky move
  'confined', // confined or captured again
  'bombardment',
  'alone', // self-reliance when alone
  'defendWard', // defending the ward
  'lovedOne', // a loved one in danger
  'firstLethal', // a first lethal fight
  'cityStreet', // Stealth and Investigation in a city
  'wild', // tracking and survival in the wild
  'adapt', // adapting to a new place
  'suffering', // with the suffering
  'pressAttack', // duel: pressing an attack (the advantage track)
  'defence', // duel: defending
  'suddenStart', // duel: the first exchange of a sudden fight
] as const;
export type TraitSituation = (typeof TRAIT_SITUATIONS)[number];

/** The situations the intent call may name for a check (the rest the code sees itself, or are the duel's). */
export const INTENT_SITUATIONS = [
  'provocation', 'persuasion', 'fear', 'battleFear', 'pain', 'domination', 'interrogation', 'intimidation', 'despair', 'pity',
  'lies', 'darkSense', 'ambush', 'social', 'compromise', 'improvise', 'chaos', 'bold', 'confined', 'bombardment', 'alone',
  'defendWard', 'lovedOne', 'wild', 'adapt', 'suffering',
] as const satisfies readonly TraitSituation[];

/** Kinds of NPC a trait's reaction names (read from the NPC's role, faction and species; spec/traits.md section 4). */
export const NPC_KINDS = ['elite', 'commoner', 'criminal', 'law', 'jedi', 'imperial', 'republic', 'slaver', 'mandalorian', 'formal', 'suffering'] as const;
export type NpcKind = (typeof NPC_KINDS)[number];

/** Pressures for the alignment system (M6 reads them; spec/traits.md section 5). Multipliers unless named `start`. */
export const PRESSURE_KINDS = [
  'angerDark', // x dark pressure from anger
  'mercyEase', // x dark pressure after an act of mercy (below 1 eases it)
  'attachment', // x attachment pressure (Jedi)
  'griefDark', // x dark pressure at reminders of a loss
  'hatredDark', // x dark pressure around those responsible
  'startDarkPressure', // + dark pressure at the start
  'guilt', // + a weight on a Jedi's alignment (a start offset toward the dark, as guilt)
] as const;
export type PressureKind = (typeof PRESSURE_KINDS)[number];

export interface RollHook {
  situation: TraitSituation;
  /** -2..+2 (the catalog's band). */
  mod: number;
}
export interface LearnHook {
  /** Skill ids, or the groups '$forms' (every lightsaber form) and '$playXp' (XP from deeds: every skill, play XP only). */
  skills: readonly string[];
  /** 0.8..1.2 (the catalog's +-10-20%). */
  factor: number;
}
export interface ReactionHook {
  who: NpcKind;
  /** -2..+2 on social rolls with them; the narrator plays it. */
  shift: number;
}
export interface TraitGate {
  paths?: readonly ('jedi' | 'sith' | 'outsider' | 'career')[];
  notPaths?: readonly ('jedi' | 'sith' | 'outsider' | 'career')[];
  species?: readonly string[];
  /** Temple-raised: arrival at the Temple (the training start age) before this age. */
  templeArrivalBefore?: number;
  /** A dated condition the character must have lived through or in (resolved by the rules from the dates). */
  needs?: 'war' | 'massacre' | 'slavery' | 'sithEmpire' | 'coruscant3653' | 'jediAttachmentRules';
}
export interface TraitDef {
  id: string;
  name: string;
  kind: TraitKind;
  good: string;
  bad: string;
  note: string;
  /** Eligible as the optional fourth trait (a flaw-heavy one; the reading is in spec/traits.md section 2). */
  flawHeavy?: true;
  gate?: TraitGate;
  /**
   * What the character's own creation choices must show (m8-fixes D1; Jared, 26 Nov 2026: War veteran needs war years above 0).
   * Unlike the gates (path, species, dates), these read the numbers the player sets on the form; an unmet one greys the trait out
   * with its short reason, and un-ticks it.
   */
  requires?: readonly TraitRequirement[];
  rolls?: readonly RollHook[];
  learning?: readonly LearnHook[];
  reactions?: readonly ReactionHook[];
  pressure?: Partial<Readonly<Record<PressureKind, number>>>;
  /** Start money (economy): a multiplier on the starting purse (invented). */
  startMoney?: number;
  /** A scar's fear, faced in play (traitMoment fearFaced): after FEAR_FACED_TO_OVERCOME it is overcome (the bad side goes). */
  fear?: string;
  /** A tie: the kind of person it links to, and whether a canon figure may stand in where the lore allows. */
  tie?: { who: string; bond: 'bond' | 'rival' | 'debt' | 'patron' | 'family' | 'ward' | 'love' | 'mentor' };
}

/** A creation number a trait needs (m8-fixes D1): war years, or the age at the start (whole years). */
export interface TraitRequirement {
  field: 'warYears' | 'startAge';
  /** Strictly above this. */
  above?: number;
  /** At least this. */
  atLeast?: number;
  /** The short reason shown beside a greyed-out trait. */
  reason: string;
  /** Who set it: Jared's ruling, or invented. */
  source: string;
}

const ALL_FORCE = ['jedi', 'sith', 'outsider'] as const;

export const TRAITS: readonly TraitDef[] = [
  // ---- Origins (12) ----
  {
    id: 'templeRaised', name: 'Temple-raised', kind: 'origin',
    good: 'Jedi Code and lore study +10%; trusted inside the Temple', bad: '-2 with criminals and the street; naive about money', note: 'Sheltered, formal, knows no other home',
    gate: { paths: ['jedi'], templeArrivalBefore: 10 },
    learning: [{ skills: ['forceKnowledge'], factor: 1.1 }],
    reactions: [{ who: 'jedi', shift: 1 }, { who: 'criminal', shift: -2 }],
    startMoney: 0.5,
  },
  {
    id: 'underlevels', name: 'Coruscant underlevels', kind: 'origin',
    good: '+1 Stealth and Investigation in cities; street contacts', bad: 'Upper-level NPCs cool; low start money', note: 'Streetwise, wary of uniforms',
    rolls: [{ situation: 'cityStreet', mod: 1 }],
    reactions: [{ who: 'elite', shift: -1 }, { who: 'criminal', shift: 1 }, { who: 'law', shift: -1 }],
    startMoney: 0.5,
  },
  {
    id: 'nobleHouse', name: 'Noble house', kind: 'origin',
    good: '+2 Charisma with elites; start money', bad: 'Commoners and criminals distrust; family obligations', note: 'Polished; upholds a name',
    reactions: [{ who: 'elite', shift: 2 }, { who: 'commoner', shift: -1 }, { who: 'criminal', shift: -1 }],
    startMoney: 2,
  },
  {
    id: 'militaryFamily', name: 'Military family', kind: 'origin',
    good: 'Tactics study +10%; +1 Willpower against fear', bad: '-1 improvising outside doctrine', note: 'Respects rank',
    learning: [{ skills: ['tactics'], factor: 1.1 }],
    rolls: [{ situation: 'fear', mod: 1 }, { situation: 'improvise', mod: -1 }],
  },
  {
    id: 'frontierWorld', name: 'Farm or frontier world', kind: 'origin',
    good: 'Endurance training +10%; +1 tracking and survival in the wild', bad: '-1 with Core etiquette and elites', note: 'Plain-spoken, practical',
    learning: [{ skills: ['endurance'], factor: 1.1 }],
    rolls: [{ situation: 'wild', mod: 1 }],
    reactions: [{ who: 'elite', shift: -1 }, { who: 'formal', shift: -1 }],
  },
  {
    id: 'slaveBorn', name: 'Slave-born', kind: 'origin',
    good: '+2 Willpower against domination and pain', bad: 'Slavers may recognise you; distrust of authority', note: 'Freedom above all',
    gate: { needs: 'slavery' },
    rolls: [{ situation: 'domination', mod: 2 }, { situation: 'pain', mod: 2 }],
    reactions: [{ who: 'slaver', shift: -2 }, { who: 'law', shift: -1 }],
  },
  {
    id: 'refugee', name: 'Refugee', kind: 'origin',
    good: '+1 adapting to new places; extra languages', bad: 'Trust comes slowly; low start money', note: 'Has lost a home once',
    rolls: [{ situation: 'adapt', mod: 1 }],
    startMoney: 0.5,
  },
  {
    id: 'spacerBorn', name: 'Spacer-born', kind: 'origin',
    good: 'Piloting and Repair learning +10%', bad: '-1 Charisma with planetside authorities', note: 'At home aboard a ship',
    learning: [{ skills: ['piloting', 'repair'], factor: 1.1 }],
    reactions: [{ who: 'law', shift: -1 }],
  },
  {
    id: 'imperialBorn', name: 'Imperial-born (Sith Empire)', kind: 'origin',
    good: 'Knows Imperial custom; Imperials react better', bad: 'Republic suspicion', note: "Raised under the Emperor's order",
    gate: { needs: 'sithEmpire' },
    reactions: [{ who: 'imperial', shift: 1 }, { who: 'republic', shift: -1 }],
  },
  {
    id: 'academyRaised', name: 'Academy-raised (Sith)', kind: 'origin',
    good: '+2 Willpower against pain', bad: 'Bonds form more slowly', note: 'Trusts no one completely',
    gate: { paths: ['sith'] },
    rolls: [{ situation: 'pain', mod: 2 }],
  },
  {
    id: 'mandalorianClan', name: 'Mandalorian clan-born', kind: 'origin',
    good: 'Melee and armour learning +10%; clan ties', bad: 'Outsiders wary; bound by clan honour', note: 'Measures people by deeds',
    learning: [{ skills: ['melee'], factor: 1.1 }],
    reactions: [{ who: 'mandalorian', shift: 2 }, { who: 'commoner', shift: -1 }],
  },
  {
    id: 'criminalFamily', name: 'Criminal family', kind: 'origin',
    good: 'Fences pay a little more; underworld contacts', bad: 'Law enforcement reacts badly', note: 'Knows how deals work',
    reactions: [{ who: 'criminal', shift: 1 }, { who: 'law', shift: -2 }],
  },
  // ---- Temperaments (14) ----
  {
    id: 'hotHeaded', name: 'Hot-headed', kind: 'temperament', flawHeavy: true,
    good: '+1 on the advantage track when pressing an attack', bad: '-2 Willpower against provocation; more dark pressure when angry', note: 'Quick to anger and act',
    rolls: [{ situation: 'pressAttack', mod: 1 }, { situation: 'provocation', mod: -2 }],
    pressure: { angerDark: 1.25 },
  },
  {
    id: 'patient', name: 'Patient', kind: 'temperament',
    good: 'Meditation +10%; +2 Willpower against provocation', bad: '-1 in the first exchange of a sudden fight', note: 'Waits, watches, then moves',
    learning: [{ skills: ['meditation'], factor: 1.1 }],
    rolls: [{ situation: 'provocation', mod: 2 }, { situation: 'suddenStart', mod: -1 }],
  },
  {
    id: 'curious', name: 'Curious', kind: 'temperament',
    good: 'Study and Investigation +10-15%', bad: 'More temptation hooks (forbidden knowledge)', note: 'Asks one question too many',
    learning: [{ skills: ['intelligence', 'investigation'], factor: 1.12 }],
  },
  {
    id: 'stubborn', name: 'Stubborn', kind: 'temperament', flawHeavy: true,
    good: '+2 against persuasion and mind tricks', bad: '-1 in negotiations needing compromise', note: 'Hard to move once decided',
    rolls: [{ situation: 'persuasion', mod: 2 }, { situation: 'mindTrick', mod: 2 }, { situation: 'compromise', mod: -1 }],
  },
  {
    id: 'compassionate', name: 'Compassionate', kind: 'temperament',
    good: 'Mercy eases dark pressure; +1 with the suffering', bad: 'More attachment pressure; -2 against pity ploys', note: "Can't walk past someone in need",
    rolls: [{ situation: 'suffering', mod: 1 }, { situation: 'pity', mod: -2 }],
    reactions: [{ who: 'suffering', shift: 1 }],
    pressure: { mercyEase: 0.75, attachment: 1.15 },
  },
  {
    // Not a dark trait in itself (Jared): ambition can mean striving to be a great Jedi. No pressure hook: dark pressure comes
    // only from dark acts done for it (sabotage, betrayal), which the alignment system scores as acts.
    id: 'ambitious', name: 'Ambitious', kind: 'temperament',
    good: 'XP from deeds and standing gains +10%', bad: 'Elders and rivals wary of your eagerness', note: 'Wants to rise, and shows it',
    learning: [{ skills: ['$playXp'], factor: 1.1 }],
  },
  {
    id: 'reckless', name: 'Reckless', kind: 'temperament', flawHeavy: true,
    good: '+1 on bold, risky moves', bad: '-1 on defence; more injuries', note: 'Acts first',
    rolls: [{ situation: 'bold', mod: 1 }, { situation: 'defence', mod: -1 }],
  },
  {
    id: 'cautious', name: 'Cautious', kind: 'temperament',
    good: '+1 spotting traps and ambushes', bad: '-1 on bold moves; slow under pressure', note: 'Plans for the worst',
    rolls: [{ situation: 'ambush', mod: 1 }, { situation: 'bold', mod: -1 }],
  },
  {
    id: 'witty', name: 'Witty', kind: 'temperament',
    good: '+1 in social contests', bad: 'Formal and proud NPCs take offence', note: 'Jokes when tense',
    rolls: [{ situation: 'social', mod: 1 }],
    reactions: [{ who: 'formal', shift: -1 }],
  },
  {
    id: 'disciplined', name: 'Disciplined', kind: 'temperament',
    good: 'Drills +5%; less training fatigue', bad: '-1 when things turn chaotic', note: 'Keeps the routine',
    learning: [{ skills: ['$forms', 'strength', 'agility', 'endurance'], factor: 1.05 }],
    rolls: [{ situation: 'chaos', mod: -1 }],
  },
  {
    id: 'proud', name: 'Proud', kind: 'temperament', flawHeavy: true,
    good: '+2 Willpower against intimidation', bad: "-2 against taunts in a duel; can't back down", note: 'Never shows weakness',
    rolls: [{ situation: 'intimidation', mod: 2 }, { situation: 'taunt', mod: -2 }],
  },
  {
    id: 'loyal', name: 'Loyal', kind: 'temperament',
    good: 'Bonds with companions grow faster', bad: 'Can be worked through friends; betrayal cuts deeper', note: 'Stands by their people',
    rolls: [{ situation: 'lovedOne', mod: 1 }],
  },
  {
    id: 'reserved', name: 'Reserved', kind: 'temperament',
    good: 'Meditation and Stealth +5%', bad: 'Relationships grow more slowly', note: 'Quiet, hard to read',
    learning: [{ skills: ['meditation', 'stealth'], factor: 1.05 }],
  },
  {
    id: 'idealistic', name: 'Idealistic', kind: 'temperament',
    good: '+2 Willpower against despair', bad: 'A broken ideal can become a scar', note: 'Believes things can be better',
    rolls: [{ situation: 'despair', mod: 2 }],
  },
  // ---- Scars and experience (10) ----
  {
    id: 'warVeteran', name: 'War veteran', kind: 'scar',
    good: '+2 Willpower against fear in battle', bad: 'Nightmares: a little more fatigue; -1 under bombardment', note: 'Has seen the front',
    requires: [{ field: 'warYears', above: 0, reason: 'needs war years above 0', source: 'Jared, 26 Nov 2026 (m8-fixes D1)' }],
    rolls: [{ situation: 'battleFear', mod: 2 }, { situation: 'bombardment', mod: -1 }],
    fear: 'bombardment',
  },
  {
    id: 'massacreSurvivor', name: 'Massacre survivor', kind: 'scar',
    good: '+1 spotting ambushes', bad: 'Hatred: dark pressure around those responsible', note: "Survived when others didn't",
    gate: { needs: 'massacre' },
    rolls: [{ situation: 'ambush', mod: 1 }],
    pressure: { hatredDark: 1.25 },
  },
  {
    id: 'betrayed', name: 'Betrayed by a friend', kind: 'scar', flawHeavy: true,
    good: '+2 sensing lies and deception', bad: 'Trust and bonds grow more slowly', note: "Doesn't forget",
    rolls: [{ situation: 'lies', mod: 2 }],
  },
  {
    id: 'lostFamily', name: 'Lost family', kind: 'scar',
    good: '+2 Willpower (resolve)', bad: 'Grief: dark pressure at reminders; an attachment test for Jedi', note: 'Carries the loss',
    rolls: [{ situation: 'despair', mod: 2 }, { situation: 'fear', mod: 1 }],
    pressure: { griefDark: 1.2 },
  },
  {
    id: 'formerPrisoner', name: 'Former prisoner', kind: 'scar',
    good: '+2 Willpower against interrogation and hardship', bad: '-1 when confined or captured again', note: 'Knows what a cell is like',
    rolls: [{ situation: 'interrogation', mod: 2 }, { situation: 'pain', mod: 1 }, { situation: 'confined', mod: -1 }],
    fear: 'confined',
  },
  {
    id: 'brushWithDark', name: 'Brush with the dark side', kind: 'scar', flawHeavy: true,
    good: '+2 sensing dark-side users', bad: 'Dark pressure starts a little higher; teachers keep watch', note: 'Knows the pull from inside',
    gate: { paths: ALL_FORCE },
    rolls: [{ situation: 'darkSense', mod: 2 }],
    pressure: { startDarkPressure: 3 },
  },
  {
    id: 'outcast', name: 'Outcast or exile', kind: 'scar', flawHeavy: true,
    good: '+1 self-reliance when alone', bad: 'The group you left is hostile', note: 'Belongs nowhere fully',
    rolls: [{ situation: 'alone', mod: 1 }],
  },
  {
    id: 'firstKill', name: 'First kill, young', kind: 'scar', flawHeavy: true,
    good: 'Steadier in a first lethal fight', bad: "Guilt; weighs on a Jedi's alignment", note: 'Remembers the face',
    requires: [{ field: 'startAge', atLeast: 8, reason: 'needs a start age of 8 or more', source: 'invented (m8-fixes D1)' }],
    rolls: [{ situation: 'firstLethal', mod: 1 }],
    pressure: { guilt: 2 },
  },
  {
    id: 'disgraced', name: 'Disgraced', kind: 'scar', flawHeavy: true,
    good: 'XP +5% from proving yourself', bad: 'Lower starting standing', note: 'Has something to prove',
    learning: [{ skills: ['$playXp'], factor: 1.05 }],
  },
  {
    id: 'disasterSurvivor', name: 'Disaster survivor', kind: 'scar',
    good: '+1 against despair; endurance in hardship', bad: 'A trigger fear tied to the disaster', note: 'Lived through the worst day',
    rolls: [{ situation: 'despair', mod: 1 }, { situation: 'pain', mod: 1 }, { situation: 'fear', mod: -1 }],
    fear: 'the disaster',
  },
  // ---- Ties (8): each a real NPC, generated or canon where the lore allows ----
  {
    id: 'rival', name: 'Rival', kind: 'tie',
    good: 'XP +10% after the rival outdoes you', bad: 'Works against you when they can', note: 'Always measuring against you',
    tie: { who: 'a rival of the same age and path', bond: 'rival' },
  },
  {
    id: 'oldDebt', name: 'Old debt', kind: 'tie',
    good: 'Start money, gear or a ship', bad: 'A creditor (economy debt rules)', note: 'Someone is owed',
    requires: [{ field: 'startAge', atLeast: 16, reason: 'needs a start age of 16 or more (a creditor lends to an adult)', source: 'invented (m8-fixes D1)' }],
    gate: { notPaths: ['jedi'] },
    startMoney: 3,
    tie: { who: 'a creditor', bond: 'debt' },
  },
  {
    id: 'contact', name: 'Contact', kind: 'tie',
    good: 'Information and leads in their trade', bad: 'Favours owed back', note: 'Knows a person who knows',
    tie: { who: 'a contact in a useful trade', bond: 'bond' },
  },
  {
    id: 'patron', name: 'Protector or patron', kind: 'tie',
    good: 'Intercedes once in a crisis', bad: 'Obligation; their enemies become yours', note: 'Someone powerful watches over you',
    tie: { who: 'a powerful protector', bond: 'patron' },
  },
  {
    id: 'familyTie', name: 'Family you still see', kind: 'tie',
    good: 'A safe haven and support', bad: 'Leverage for enemies; attachment pressure for Jedi', note: 'Home still exists',
    pressure: { attachment: 1.2 },
    tie: { who: 'a parent or sibling', bond: 'family' },
  },
  {
    id: 'ward', name: 'Ward', kind: 'tie',
    good: '+2 Willpower defending them', bad: 'They can be threatened or taken', note: 'Someone depends on you',
    requires: [{ field: 'startAge', atLeast: 12, reason: 'needs a start age of 12 or more (someone to look after)', source: 'invented (m8-fixes D1)' }],
    rolls: [{ situation: 'defendWard', mod: 2 }],
    tie: { who: 'a younger sibling or an orphan', bond: 'ward' },
  },
  {
    id: 'forbiddenBond', name: 'Forbidden bond', kind: 'tie', flawHeavy: true,
    good: "Strong motive; Willpower when they're in danger", bad: 'Heavy attachment pressure; must stay secret', note: "A love the Order wouldn't allow",
    requires: [{ field: 'startAge', atLeast: 14, reason: 'needs a start age of 14 or more', source: 'invented (m8-fixes D1)' }],
    gate: { paths: ['jedi'], needs: 'jediAttachmentRules' },
    rolls: [{ situation: 'lovedOne', mod: 2 }],
    pressure: { attachment: 1.5 },
    tie: { who: 'a secret love', bond: 'love' },
  },
  {
    id: 'outsideMentor', name: 'Outside mentor', kind: 'tie',
    good: "Teacher's bonus in their field", bad: 'Their reputation follows you', note: "Taught by someone the Order didn't choose",
    tie: { who: 'a teacher outside the Order or the academy', bond: 'mentor' },
  },
];

export const TRAIT_BY_ID: ReadonlyMap<string, TraitDef> = new Map(TRAITS.map((t) => [t.id, t]));

/** The limits every hook keeps (the catalog's band; Jared's brief). Tested. */
export const TRAIT_LIMITS = {
  /** The total of every trait's roll hooks on one roll, either way. */
  roll: 2,
  /** The product of the learning hooks on one skill. */
  learnMin: 0.8,
  learnMax: 1.2,
  /** The total reaction shift with one NPC. */
  reaction: 2,
} as const;

/** The outside mentor's teacher bonus on the mentor's field (invented, inside the band). */
export const MENTOR_LEARNING = 1.1;
/** The rival's spur: +10% on every skill for this many days after the rival outdoes you (invented span). */
export const RIVAL_SPUR = { factor: 1.1, days: 30 } as const;
/** Fears faced before a scar's fear is overcome (invented; the catalog: "after facing it several times"). */
export const FEAR_FACED_TO_OVERCOME = 3;
/** A temperament shifts after this many recorded moments against it toward one other temperament (invented). */
export const TEMPERAMENT_SHIFT_MOMENTS = 3;

/**
 * Dated conditions for the gates (D-438: plain dated facts). The wars are the one list in data/wars.ts (opt-2 A1); massacres
 * from the catalog's list (the Sacking of Coruscant, the Massacre at Ossus, Order 66). Years: negative = BBY.
 */
export const MASSACRES: readonly { id: string; name: string; year: number; who: 'jedi' | 'coruscant'; source: string }[] = [
  { id: 'sacking', name: 'the Sacking of Coruscant', year: -3653, who: 'coruscant', source: 'OLD_SW_Characters_09 (3,653 BBY)' },
  { id: 'order66', name: 'Order 66', year: -19, who: 'jedi', source: 'SW_Timeline_19BBY_4ABY' },
  { id: 'ossus', name: 'the Massacre at Ossus', year: 130, who: 'jedi', source: 'SW_Characters_18_LegacyEra' },
];

/** The Jedi Order's attachment rules (the Forbidden bond): the Order of the Republic eras and the New Jedi Order before Luke allowed marriage (invented ends: c. 19 ABY lifted). */
export const JEDI_ATTACHMENT_RULE_YEARS: readonly { from: number; to: number }[] = [{ from: -25000, to: 19 }];

/** Names for generated ties and childhood friends (invented, generic). */
export const TIE_NAMES: readonly string[] = [
  'Arlen Voss', 'Tamsin Rook', 'Doran Vey', 'Kessa Marr', 'Jori Tal', 'Brann Okel', 'Sela Dray', 'Veric Hode', 'Mira Coll', 'Talen Drey',
  'Nessa Varn', 'Corin Bast', 'Leda Pryce', 'Oren Kade', 'Ysil Merr', 'Dak Holt', 'Rhea Sorn', 'Pell Arda', 'Kaia Venn', 'Toma Reth',
  'Edra Nol', 'Haldo Crane', 'Sena Vale', 'Garen Oss', 'Lysa Thorne', 'Benn Calder', 'Yara Fen', 'Ozen Malk', 'Tavi Rhee', 'Juno Sarn',
];
