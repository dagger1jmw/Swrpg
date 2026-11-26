// Ground command in play (m8-ground, M8 checklist item 14; Jared, 26 Nov 2026; D-522; docs-v2/spec/ground-command.md). The
// sector rolls, matchups, breakthroughs and morale are the engine's (data/ground.config.ts, engine/groundBattle.ts; D-505);
// this file holds what play adds: the map grid and its terrain key, the known battle sites from the lore files, scouting,
// plan changes, contingencies, the player's own fight, and the record. Every number is invented unless marked lore or Jared.
import type { Plan, Terrain } from './ground.config';

// ---- the map (Jared: a lettered and numbered grid, A-F by 1-6 typically, larger when needed, within the keyboard-map width) ----

export const GRID = {
  /** The usual battle (Jared). */
  cols: 6,
  rows: 6,
  /** Larger when the forces are (invented: a side of more than 10 units gets 7 x 7, more than 16 gets 8 x 8). */
  largeAt: [10, 16] as readonly number[],
  max: 8,
  /** Characters per column on the map (the fleet map stays under 41 columns; 8 columns x 4 + 4 = 36). */
  cell: 4,
} as const;

export const FEATURES = ['open', 'ridge', 'hills', 'forest', 'river', 'bridge', 'marsh', 'structure', 'ruins', 'town', 'chokepoint', 'caves'] as const;
export type Feature = (typeof FEATURES)[number];

/** Each feature's map symbol, what it does in the sector roll (combat-scales section 5) and its line in the key. */
export const FEATURE_DEF: Readonly<Record<Feature, { symbol: string; terrain: Terrain; key: string }>> = {
  open: { symbol: '.', terrain: {}, key: 'open ground' },
  ridge: { symbol: '^', terrain: { cover: 'cover', high: 'B' }, key: 'ridge: high ground, cover, slows armour' },
  hills: { symbol: 'n', terrain: { high: 'B' }, key: 'hills: high ground' },
  forest: { symbol: 'f', terrain: { cover: 'cover', forest: true }, key: 'forest: cover; armour weak, infantry strong against it' },
  river: { symbol: '~', terrain: { river: true }, key: 'river: armour cannot cross but at a bridge' },
  bridge: { symbol: '=', terrain: { river: true, bridge: true, chokepoint: true }, key: 'bridge: the crossing; a chokepoint' },
  marsh: { symbol: ',', terrain: { cover: 'cover', river: true }, key: 'marsh: cover; armour bogs down' },
  structure: { symbol: '#', terrain: { cover: 'heavy', urban: true }, key: 'fortified structure: heavy cover' },
  ruins: { symbol: '%', terrain: { cover: 'heavy', urban: true }, key: 'ruins: heavy cover' },
  town: { symbol: 'H', terrain: { cover: 'cover', urban: true }, key: 'town: cover; armour weak, infantry strong against it' },
  chokepoint: { symbol: 'X', terrain: { chokepoint: true }, key: 'pass or chokepoint: hard to attack through' },
  caves: { symbol: 'O', terrain: { cover: 'heavy' }, key: 'caves: heavy cover' },
};

/** Words in the narrator's terrain line, read to features (the first match wins). */
export const FEATURE_WORDS: readonly (readonly [RegExp, Feature])[] = [
  [/\bbridges?\b/i, 'bridge'],
  [/\brivers?\b|\bstreams?\b|\bcanals?\b/i, 'river'],
  [/\bridges?\b|\bcliffs?\b|\bescarpments?\b|\bmesas?\b|\bspires?\b/i, 'ridge'],
  [/\bhills?\b|\bhighlands?\b|\bdunes?\b/i, 'hills'],
  [/\bforests?\b|\bwoods?\b|\bjungles?\b|\btrees\b/i, 'forest'],
  [/\bmarsh\w*|\bswamps?\b|\bmud\b|\bbogs?\b/i, 'marsh'],
  [/\bruins?\b|\brubble\b/i, 'ruins'],
  [/\bfort\w*|\bbunkers?\b|\bbase\b|\bstation\b|\bfoundr\w*|\bfactory\b|\barena\b|\bcompound\b|\bwalls?\b|\btemple\b|\bstructures?\b/i, 'structure'],
  [/\btowns?\b|\bcity\b|\bvillages?\b|\bsettlements?\b|\bstreets?\b/i, 'town'],
  [/\bpass(?:es)?\b|\bchokepoints?\b|\bdefiles?\b|\bgorges?\b|\bcanyons?\b|\bgates?\b/i, 'chokepoint'],
  [/\bcaves?\b|\bcaverns?\b|\btunnels?\b|\bcatacombs?\b/i, 'caves'],
];

/** Weather as a modifier (invented): to the attacker, to air support, to raids and ambushes. */
export const WEATHER = {
  clear: { attacker: 0, air: true, hidden: 0, label: 'clear' },
  rain: { attacker: -1, air: true, hidden: 0, label: 'rain: the attacker slowed' },
  storm: { attacker: -1, air: false, hidden: 1, label: 'storm: no air support; raids and ambushes +1' },
  fog: { attacker: 0, air: false, hidden: 1, label: 'fog: no air support; raids and ambushes +1' },
  snow: { attacker: -1, air: true, hidden: 0, label: 'snow: the attacker slowed' },
  night: { attacker: 0, air: true, hidden: 1, label: 'night: raids and ambushes +1' },
} as const;
export type Weather = keyof typeof WEATHER;

// ---- known sites (Jared: a battle at a known site takes its features from the lore files) ----

export interface KnownSite {
  id: string;
  names: RegExp;
  label: string;
  /** Campaign years the site's features hold (D-438: dated facts). */
  from: number;
  to: number;
  features: readonly { square: string; feature: Feature; note: string }[];
  /** Where the objectives are, in the lore. */
  objectives: readonly string[];
  source: string;
}

export const KNOWN_SITES: readonly KnownSite[] = [
  {
    id: 'ruusan',
    names: /\bruusan\b/i,
    label: 'Ruusan',
    from: -1002,
    to: -1000,
    // Lore: the Brotherhood's lightning storm "sets the Jedi's forest ablaze and drives the Jedi onto the plains"
    // (SW_Timeline_2000_1000BBY_Part2); Hoth took "one hundred Jedi, all volunteers" into the caves
    // (SW_Jedi_Ranks_Councils_Roles_AllEras_Part2); the thought bomb's valley (the Valley of the Jedi, SW_Force_Nexus_Vergence).
    // Placement on the grid is invented; the features are the lore's.
    features: [
      { square: 'A1', feature: 'forest', note: 'the Jedi\'s forest (lore: set ablaze by the Brotherhood\'s storm)' },
      { square: 'A2', feature: 'forest', note: 'the Jedi\'s forest' },
      { square: 'B1', feature: 'forest', note: 'the Jedi\'s forest' },
      { square: 'C3', feature: 'open', note: 'the plains (lore: the Jedi driven onto them)' },
      { square: 'D3', feature: 'open', note: 'the plains' },
      { square: 'C4', feature: 'open', note: 'the plains' },
      { square: 'D4', feature: 'open', note: 'the plains' },
      { square: 'F1', feature: 'caves', note: 'the caves (lore: Hoth\'s volunteers went into them)' },
      { square: 'E5', feature: 'ridge', note: 'the valley\'s walls (lore: the thought bomb\'s valley)' },
      { square: 'F6', feature: 'structure', note: 'the Brotherhood\'s camp (lore: Kaan\'s planning sessions on Ruusan)' },
    ],
    objectives: ['D4', 'F6'],
    source: 'SW_Timeline_2000_1000BBY_Part2.md; SW_Jedi_Ranks_Councils_Roles_AllEras_Part2.md (Hoth\'s caves); SW_Force_Nexus_Vergence.md (the valley)',
  },
  {
    id: 'geonosis',
    names: /\bgeonosis\b/i,
    label: 'Geonosis',
    from: -22,
    to: -19,
    // Lore: the Jedi strike team "storms the Petranaki arena"; Delta Squad "destroys foundries"
    // (SW_Timeline_32_19BBY_Part2); the second battle lands "at Point Rain" and destroys "the new droid foundry"
    // (SW_Timeline_32_19BBY_Part3). Placement invented.
    features: [
      { square: 'B2', feature: 'structure', note: 'the Petranaki arena (lore)' },
      { square: 'E2', feature: 'structure', note: 'a droid foundry (lore: Delta Squad destroyed foundries; the new droid foundry of the second battle)' },
      { square: 'E5', feature: 'structure', note: 'a droid foundry' },
      { square: 'A6', feature: 'open', note: 'Point Rain, the landing zone (lore: the second battle)' },
      { square: 'C3', feature: 'ridge', note: 'rock spires (invented: the planet\'s rocky ground)' },
      { square: 'D4', feature: 'ridge', note: 'rock spires (invented)' },
    ],
    objectives: ['E2', 'E5'],
    source: 'SW_Timeline_32_19BBY_Part2.md; SW_Timeline_32_19BBY_Part3.md',
  },
  {
    id: 'jabiim',
    names: /\bjabiim\b/i,
    label: 'Jabiim',
    from: -22,
    to: -19,
    // Lore: the Twelfth Army's advance "grinds to a halt on Jabiim", whose civil war the Republic joined "to protect its mining
    // interests"; "all the Padawans die holding Cobalt Station"; the Nationalist leader Alto Stratus (SW_Timeline_32_19BBY_Part3).
    // Placement invented.
    features: [
      { square: 'C3', feature: 'structure', note: 'Cobalt Station (lore: the Padawan Pack held it to the last)' },
      { square: 'E4', feature: 'structure', note: 'the mines (lore: the Republic\'s mining interests)' },
      { square: 'F2', feature: 'structure', note: 'the Nationalists\' stronghold (lore: Alto Stratus\'s forces)' },
      { square: 'B5', feature: 'marsh', note: 'churned ground where the advance stalled (lore: "grinds to a halt"; the ground is invented)' },
    ],
    objectives: ['C3', 'E4'],
    source: 'SW_Timeline_32_19BBY_Part3.md',
  },
];

// ---- scouting and intelligence (Jared: Stealth, Intelligence, recon units) ----

export const SCOUTING = {
  /** At most this many scouting tries before a battle. */
  tries: 3,
  /** Each takes this long. */
  hours: 1,
  /** The roll's DC; heavy terrain hides more. */
  dc: 13,
  /** Recon units (commandos, Mandalorians and other raiders) among the force add this. */
  reconUnits: 3,
  /** Squares revealed: this many, and one more for each 3 of margin. */
  squares: 2,
  perMargin: 3,
  /** An intelligence read beating the DC by this reveals the enemy's likely plan. */
  planAt: 3,
  /** Failed by this much: the scouts are seen (told in the scouting line and kept for the narrator; no rule effect yet). */
  noticed: 5,
} as const;

// ---- the plan ----

export const CONTINGENCY_TRIGGERS = ['sectorFalling', 'positionLost', 'leaderKilled', 'meditatorKilled', 'strengthHalved', 'objectiveTaken'] as const;
export type ContingencyTrigger = (typeof CONTINGENCY_TRIGGERS)[number];
export const CONTINGENCY_ACTIONS = ['commitReserve', 'reinforce', 'fallBack', 'switchPlan', 'withdraw'] as const;
export type ContingencyAction = (typeof CONTINGENCY_ACTIONS)[number];
export const TRIGGER_LABEL: Readonly<Record<ContingencyTrigger, string>> = {
  sectorFalling: 'a sector is losing (the track at -2 or worse)',
  positionLost: 'a position is lost',
  leaderKilled: 'a sector leader falls',
  meditatorKilled: 'the battle meditator falls',
  strengthHalved: 'our strength falls to half',
  objectiveTaken: 'the primary objective is taken',
};
export const ACTION_LABEL: Readonly<Record<ContingencyAction, string>> = {
  commitReserve: 'commit the reserve there',
  reinforce: 'shift a unit there from the strongest sector',
  fallBack: 'that sector falls back (fighting withdrawal)',
  switchPlan: 'switch the manoeuvre',
  withdraw: 'withdraw from the field',
};
/** Jared: up to two contingencies. */
export const MAX_CONTINGENCIES = 2;
/** The track at which a sector counts as falling. */
export const FALLING_AT = -2;

/** The ground manoeuvres in the tactics catalogue (data/tactics.ts) and the engine's plan ids. */
export const TACTIC_PLAN: Readonly<Record<string, Plan>> = {
  frontalAssault: 'frontal',
  flanking: 'flanking',
  envelopment: 'envelopment',
  defenceInDepth: 'defenceInDepth',
  ambush: 'ambush',
  feint: 'feint',
  siege: 'siege',
  infiltration: 'raid',
  fightingWithdrawal: 'fightingWithdrawal',
};
/** What any commander can order without ground training (a reading, invented, like the fleet's line and brawl). */
export const GROUND_COMMAND_BASICS: readonly string[] = ['frontalAssault', 'fightingWithdrawal'];
/** Manoeuvres for a side that holds the positions, and for one that attacks them (the NPC commander picks from these). */
export const DEFENDING_PLANS: readonly Plan[] = ['defenceInDepth', 'ambush', 'fightingWithdrawal', 'feint'];
export const ATTACKING_PLANS: readonly Plan[] = ['frontal', 'flanking', 'envelopment', 'feint', 'siege', 'raid'];

// ---- changing the plan (Jared: real time with a command post in contact; without, a whole phase and a penalty) ----

export const CHANGE = {
  /** Without contact, a wider change lands a phase later and the side rolls this much worse that phase. */
  delayPhases: 1,
  penalty: -1,
  /** Units this bonded improvise in their sector: a delayed change to their own sector lands at once. */
  improviseBond: 60,
} as const;

// ---- the fight ----

export const GROUND_LIMITS = {
  /** A battle ends after this many phases (1.5 h each: 18 hours). */
  maxPhases: 12,
  /** Units a side, after reading the words. */
  unitsPerSide: 24,
  /** Front positions on the map. */
  positions: { min: 2, max: 6 },
} as const;

/** The player's own fight in their sector each phase: the better of their combat levels against the enemy troops' quality. */
export const OWN_FIGHT_ROLL = { won: 3, lost: -3 } as const;
/** A sector leader caught in a rout or a collapse falls (invented). */
export const LEADER_DEATH = { rout: 0.2, collapse: 0.45 } as const;
/** An enemy infiltration or raid that breaks through anywhere reaches the battle meditator at the post this often (invented). */
export const MEDITATOR_RAID = 0.25;
/** Men in a full unit, for the casualty count (a unit is a battalion, company or squad alike; invented by the command's size). */
export const MEN_PER_UNIT: Readonly<Record<string, number>> = { squad: 8, platoon: 30, company: 120, battalion: 500, regiment: 1500, army: 6000 };
/** Command size by the units commanded (invented; COMMAND.size's keys). */
export const GROUND_SIZE_BY_UNITS: readonly (readonly [number, string])[] = [
  [1, 'squad'],
  [2, 'platoon'],
  [3, 'company'],
  [5, 'battalion'],
  [9, 'regiment'],
  [16, 'army'],
];
/** A major battle for the world (invented): this many units on the field in all, or a known site. */
export const GROUND_MAJOR_UNITS = 12;
/** Morale after a battle, as the fleets' (+5 / 0 / -8, doubled for a major battle). */
export const GROUND_BATTLE_MORALE = { won: 5, drawn: 0, lost: -8 } as const;
