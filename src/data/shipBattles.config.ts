// Ship battles in play (m8-ship-battles, checklist item 13 part 1; Jared's brief, 26 Nov 2026; D-517;
// docs-v2/spec/ship-battles.md). The rolls, shields, damage and the dogfight and fleet engines are combat-scales' (D-505);
// these are the numbers of the battle as it is played: who starts one, how a boarding and an evacuation go, when the
// narrator is called. Every number is invented unless a comment says otherwise.
import type { Formation, Manoeuvre } from './shipCombat.config';

/** How a battle can start (the narrator's proposal names one). */
export const BATTLE_TRIGGERS = ['sighted', 'ambush', 'blockade', 'pursuit', 'attack', 'defence'] as const;
export type BattleTrigger = (typeof BATTLE_TRIGGERS)[number];

/** The player's place in a battle. */
export const BATTLE_ROLES = ['pilot', 'gunner', 'commander', 'crew'] as const;
export type BattleRole = (typeof BATTLE_ROLES)[number];

/** How a battle ends (the code decides; Jared's brief B). */
export const BATTLE_ENDS = ['destroyed', 'disabled', 'brokenOff', 'withdrawn', 'surrendered', 'captured', 'evacuated', 'time'] as const;
export type BattleEnd = (typeof BATTLE_ENDS)[number];

/** The most ships a proposal may name a side (a cap on what the narrator can conjure; invented). */
export const BATTLE_LIMITS = { capitalPerSide: 40, fightersPerSide: 24, queue: 24 } as const;

/** An ambush starts with the ambusher this far up the track (a dogfight) or with the strike's intel (a fleet). */
export const AMBUSH_TRACK = 2;

/** A crew with no named figure: its level by the side's kind (invented: a navy's line crews 45, pirates 30). */
export const GENERIC_CREW: Readonly<Record<string, number>> = { navy: 45, elite: 65, militia: 30, pirate: 30, droid: 35 };

/** The first officer's Tactics when no named officer is aboard: the commander's less this, at least the crews' (invented). */
export const FIRST_OFFICER_GAP = 15;

/**
 * A fleet round while the player flies in it (Jared's brief C: the player's dogfight results feed the fleet roll): the fleet
 * rolls a round when the player's engagement ends, or after a round's worth of dogfight turns (3 min / 5 s).
 */
export const TURNS_PER_FLEET_ROUND = 36;

/**
 * Boarding (Jared, 26 Nov 2026; design notes: disabled ships can be boarded). A side with a ship that can act boards each
 * disabled enemy at close range with this chance a round; the hidden roll is d20 + crew level / 10 + the side's edge each,
 * boarders against defenders. A ship taken is captured; a boarding beaten off is repelled.
 */
export const BOARDING = {
  chance: 0.5,
  /** Ranges at which boarding craft cross (close only). */
  ranges: ['close'] as const,
  /** Boarders' edge: they pick the place (+2); defenders' edge: they know the ship (+1). */
  boardersEdge: 2,
  defendersEdge: 1,
  /** A commander's boarded ship: the boarders reach the bridge when they win a round by this much. */
  bridgeMargin: 4,
  /** Rounds of fighting through the ship before the boarders are beaten off for good if they never win one. */
  maxRounds: 3,
  /** Boarders in the personal fight: a group of the side's troops (counts by ship kind). */
  troops: { freighter: 3, corvette: 4, frigate: 5, heavyCruiser: 6, starDestroyer: 6, battleship: 6, battlecruiser: 6, dreadnought: 6, fighter: 0 } as Readonly<Record<string, number>>,
  /** A boarding the player leads: the enemy crew's defenders, by the ship's kind. */
  defenders: { freighter: 3, corvette: 4, frigate: 5, heavyCruiser: 6, starDestroyer: 6, battleship: 6, battlecruiser: 6, dreadnought: 6, fighter: 0 } as Readonly<Record<string, number>>,
} as const;

/**
 * Forced evacuation (Jared, 26 Nov 2026): a ship with no hull left is abandoned and lost. A Republic or Jedi commander is
 * last off: the hulk breaking up while they are aboard is a serious hazard (the break-up chance, combat-scales section 2).
 * A Sith or Imperial NPC commander may leave early, weighted by side and traits.
 */
export const EVACUATION = {
  /** The hazard a commander last off takes when the hulk breaks up around them (health hazard severity). */
  lastOffSeverity: 3,
  /** An NPC Sith or Imperial commander leaving early, a round its ship is crippled or boarded (side base, then traits). */
  earlyBase: { sith: 0.35, sithEmpire: 0.2, empire: 0.2 } as Readonly<Record<string, number>>,
  earlyTraits: { ambitious: 0.15, proud: 0.1, reckless: -0.1, loyal: -0.25, disciplined: -0.15, idealistic: -0.2 } as Readonly<Record<string, number>>,
  /** A crew whose commander left them: shaken for this many rounds (guns as combat-scales' shaken crew). */
  abandonedShakenRounds: 2,
  /** Relationship with a crew the player abandoned (-3 is the narrator's largest step; Jared: the crew remembers). */
  abandonedRegard: -3,
} as const;

/** Sides whose commanders may leave a ship early (Jared: Sith and Imperial). */
export const EARLY_EVACUATION_SIDES: readonly string[] = ['sith', 'sithEmpire', 'empire'];

/**
 * Surrender: an NPC side whose fleet is down to this share of its strength, outnumbered this much in what is left, gives
 * up rather than die (a pirate or a militia; a navy fights on or withdraws). A Sith side never surrenders.
 */
export const SURRENDER = { strengthBelow: 0.25, outnumbered: 3, sides: ['pirate', 'militia', 'underworld', 'civilian'] as readonly string[] } as const;

/** Narration (Jared's brief E): a code line after each choice; the narrator at the big moments and the wrap-up. */
export const NARRATION = {
  /** Hull lost in one turn, as a share of the ship's hull, that counts as a shot landing big. */
  bigHit: 0.25,
  /** Lines kept in the battle's own log (the saved state). */
  logKept: 40,
} as const;

/** XP from a battle (m8-skills' code lines; Jared's brief F). Sizes for command by what the player commanded. */
export const COMMAND_SIZE_BY_SHIPS: readonly (readonly [number, 'ship' | 'squadron' | 'taskForce' | 'fleet'])[] = [
  [1, 'ship'],
  [3, 'squadron'],
  [8, 'taskForce'],
  [20, 'fleet'],
];

/** The default formation of an NPC side by its kind of fleet (invented: navies line up; raiders brawl). */
export const NPC_FORMATION: Readonly<Record<string, Formation>> = { navy: 'exchange', elite: 'exchange', militia: 'brawl', pirate: 'brawl', droid: 'exchange' };

/** A manoeuvre's strong and weak points for the tactics menu (the counters as combat-scales section 3 sets them). */
export const MANOEUVRE_WEAK: Readonly<Partial<Record<Manoeuvre, string>>> = {
  break: 'a Reverse Throttle Hop or a Tallon Roll',
  stall: 'a Tallon Roll; goes wrong easily',
  scissors: 'a Tallon Roll',
  trap: 'a Reverse Throttle Hop or a Tallon Roll',
  jink: 'the pursuer keeps the position; your own shots suffer',
  koiogran: 'dangerous near terrain',
  terrain: 'a collision if it goes wrong',
  slipJaws: 'goes wrong easily',
};

/**
 * Attack runs on a capital ship (Jared's brief C: hull skimming and trench runs as the player's manoeuvres; combat-scales
 * section 7). The fighter closes from long range through the ship's fire, then strikes a shield facing. Invented.
 */
export const ATTACK_RUN = {
  /** Steps of the approach: long, medium, close, under the guns. */
  steps: 3,
  /** The ship's defensive fire: its gunners at their level, by how many point-defence and light guns bear. */
  defenceDc: 10,
  /** Hull skimming: under the big guns (their tracking can't follow), harder to hit, but a collision when it goes wrong. */
  skim: { evasion: 3, approach: 1, risk: 5, collision: 12 },
  /** A trench run: only a ship with a trench (a battle station); +4 on the shot at a system, the pursuers get free shots. */
  trench: { shot: 4, approach: 0, risk: 6, pursuerShot: 2 },
  /** A strafing pass at the shields: plain approach. */
  pass: { evasion: 0, approach: 0 },
  /** Point defence fire on a fighter in reach, by the share of the ship's point-defence weight that bears on it. */
  pdShare: 0.02,
  /** The fighter's torpedoes on one facing: all of a volley lands on it (the design notes: torpedo volleys on one facing). */
  volley: 2,
} as const;

/** Classes the narrator may name by a plain word, by side kind and date (a lookup for "a Sith frigate"). */
export const CLASS_WORDS: Readonly<Record<string, readonly string[]>> = {
  fighter: ['fighter', 'starfighter', 'interceptor'],
  bomber: ['bomber'],
  freighter: ['freighter', 'transport', 'smuggler'],
  corvette: ['corvette'],
  frigate: ['frigate', 'destroyer', 'cruiser'],
  heavyCruiser: ['heavy cruiser', 'dreadnought', 'dreadnaught'],
  starDestroyer: ['star destroyer', 'battlecruiser'],
};

/**
 * Who flies a class (for the narrator's plain words, "a Sith frigate"): the factions as the world reads them. The Galactic
 * Empire's ships read as sithEmpire and the Alliance's and the New Republic's as republic (the factions list has no other
 * names for them; a reading). The Confederacy reads as independent. Read from the lore's operators; invented where marked.
 */
export const CLASS_SIDES: Readonly<Record<string, readonly string[]>> = {
  aurek: ['republic', 'jediOrder'],
  sithFighter: ['sith'],
  davaab: ['mandalorians'],
  liberator: ['republic', 'jediOrder'],
  supremacy: ['sithEmpire', 'sith'],
  extinction: ['sithEmpire', 'sith'],
  vulture: ['independent'],
  arc170: ['republic', 'jediOrder'],
  vwing: ['republic', 'jediOrder'],
  xwing: ['republic'],
  ywing: ['republic'],
  awing: ['republic'],
  bwing: ['republic'],
  tieln: ['sithEmpire'],
  tiein: ['sithEmpire'],
  tiesa: ['sithEmpire'],
  tied: ['sithEmpire'],
  dynamic: ['underworld', 'independent', 'civilian'],
  xsFreighter: ['underworld', 'independent', 'civilian'],
  lethisk: ['underworld', 'independent'],
  ebonHawk: ['underworld'],
  hammerhead: ['republic', 'jediOrder'],
  derriphan: ['republic'],
  interdictorCruiser: ['sith'],
  centurion: ['sith'],
  inexpugnable: ['republic'],
  kandosii: ['mandalorians'],
  thranta: ['republic', 'jediOrder'],
  defender: ['republic', 'jediOrder', 'underworld'],
  fury: ['sithEmpire', 'sith'],
  valor: ['republic', 'jediOrder'],
  harrower: ['sithEmpire', 'sith'],
  terminus: ['sithEmpire', 'sith', 'mandalorians'],
  dreadnaught: ['republic', 'sithEmpire'],
  acclamator: ['republic', 'jediOrder'],
  venator: ['republic', 'jediOrder'],
  victory1: ['republic', 'sithEmpire'],
  victory2: ['sithEmpire'],
  lucrehulk: ['independent'],
  providence: ['independent'],
  munificent: ['independent'],
  recusant: ['independent'],
  isd1: ['sithEmpire'],
  isd2: ['sithEmpire'],
  executor: ['sithEmpire'],
  interdictorSd: ['sithEmpire'],
  immobilizer: ['sithEmpire'],
  lancer: ['sithEmpire'],
  nebulonB: ['republic', 'sithEmpire'],
  tonFalk: ['sithEmpire'],
  secutor: ['sithEmpire'],
  cr90: ['republic', 'civilian', 'underworld'],
  mc80Liberty: ['republic'],
  mc80a: ['republic'],
  quasarFire: ['republic'],
};

/** Crew aboard, by kind, for the casualties a battle raises (invented round numbers in the lore's range: a CR90 30-165, a Venator 7,400, an ISD 37,000). */
export const CREW_BY_KIND: Readonly<Record<string, number>> = { fighter: 1, freighter: 4, corvette: 80, frigate: 900, heavyCruiser: 3000, starDestroyer: 9000, battleship: 20000, battlecruiser: 25000, dreadnought: 280000 };
/** Share of a crew lost with a ship destroyed, abandoned or taken (invented). */
export const CASUALTY_SHARE = { destroyed: 0.6, evacuated: 0.15, captured: 0.05 } as const;
/** Morale a battle's result leaves the side's forces (for postings, later; invented): won, drawn, lost; a major battle doubles it. */
export const BATTLE_MORALE = { won: 5, drawn: 0, lost: -8 } as const;

/** A field repair after a battle: an hour a system (invented), Repair against REPAIR_DC; the player's own earn Repair XP. */
export const FIELD_REPAIR_HOURS = 1;
/** A patch in a fight is a short job; for Repair XP it counts as this many hours (invented). */
export const FIGHT_PATCH_HOURS = 0.25;
/** The rating of a field repair for Repair XP (REPAIR_DC on the rating scale; invented reading). */
export const FIELD_REPAIR_RATING = 40;

/**
 * Standing forces the code builds a battle against (Jared's brief B: the Coruscant ground-fight stand-in becomes a real ship
 * battle). The armada that holds Coruscant during the Sacking: the lore names Darth Angral's armada and no counts; the classes
 * are the Empire's of the date and every count is invented.
 */
export interface StandingForce {
  id: string;
  name: string;
  place: string;
  faction: string;
  kind: string;
  commander: string;
  commanderCanonId?: string;
  /** Calendar dates (negative years = BBY), inclusive; read with the world event's own shift. */
  event: string;
  ships: readonly { classId: string; count: number }[];
  wings: readonly { classId: string; count: number }[];
  formation: Formation;
  source: string;
}
export const STANDING_FORCES: readonly StandingForce[] = [
  {
    id: 'angral-armada',
    name: "Darth Angral's armada",
    place: 'Coruscant',
    faction: 'sithEmpire',
    kind: 'navy',
    commander: 'Darth Angral',
    commanderCanonId: 'lore:darth-angral',
    event: 'E.3653.sacking',
    ships: [{ classId: 'harrower', count: 2 }, { classId: 'terminus', count: 6 }, { classId: 'fury', count: 4 }],
    wings: [{ classId: 'supremacy', count: 48 }, { classId: 'extinction', count: 12 }],
    formation: 'exchange',
    source: 'SW_Great_Galactic_War (the Sacking: Angral\'s armada takes Coruscant); classes the Empire\'s of 3,653, counts invented',
  },
];

/**
 * A blockade's pickets when a ship forces its way through (Jared's brief B: the force-through approach becomes a ship battle):
 * by the blockade's picket strength (1-5). The Hydian Way blockade is Mandalore the Lesser's cruisers for the Sith Empire; the
 * lore gives no classes, so they are the Empire's of 3,661 (invented, flagged in the spec).
 */
export const BLOCKADE_PICKETS: Readonly<Record<string, { capital: string; fighter: string; faction: string; kind: string; capitalPer: number; fightersPer: number; source: string }>> = {
  // The Terminus enters service only in 3,653 (data/ships.ts); the Fury-class is the Empire's warship of 3,661 nearest a picket cruiser.
  'hydian-way-3661': { capital: 'fury', fighter: 'supremacy', faction: 'mandalorians', kind: 'elite', capitalPer: 0.6, fightersPer: 1.2, source: 'the lore names cruisers; the classes are invented (the Empire\'s of 3,661)' },
};
/** A blockade with no pickets on record: the side's ships of the date (invented). */
export const DEFAULT_PICKETS = { capitalPer: 0.5, fightersPer: 1 } as const;
