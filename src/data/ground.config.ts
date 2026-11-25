// Ground battles as data (Jared, 2026-11-25; D-505; docs-v2/spec/combat-scales.md section E). Every number is invented unless
// it is Jared's: the sector roll's parts and their sizes (plan +/-2, matchups capped at +/-3, support +1 each, cover +1 / +2,
// high ground +1, a chokepoint -2 to the attacker), the track and the breakthrough bands.
import type { Curve } from './shipCombat.config';

export const PHASE_HOURS = 1.5;

// ---- units ----

/** What a unit is to shoot at. */
export type TargetClass = 'soft' | 'hard' | 'air';
export const UNIT_TYPES = ['infantry', 'droids', 'antiArmour', 'armour', 'artillery', 'antiAir', 'air'] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export interface GroundUnitDef {
  id: string;
  label: string;
  type: UnitType;
  /** Infantry of every sort: the minion kind (data/npcGen.config.ts) its quality, arms, armour and morale come from. */
  kind?: string;
  target: TargetClass;
  /** What it does to each, beside a line company's 2 against infantry; for a kind, worked out from the kind. */
  fire?: Readonly<Record<TargetClass, number>>;
  /** Its crews' level, where there is no kind. */
  level?: number;
  /** How hard it is to hurt; for a kind, from its armour. */
  toughness?: number;
  /** Fights from surprise and behind the lines: guns and vehicles are weak to it. */
  raider?: boolean;
  /** On the map. */
  letter: string;
  note: string;
}

const inf = (id: string, label: string, kind: string, over: Partial<GroundUnitDef> = {}): GroundUnitDef => ({ id, label, type: 'infantry', kind, target: 'soft', letter: 'i', note: '', ...over });

export const GROUND_UNITS: readonly GroundUnitDef[] = [
  inf('militia', 'militia', 'militia'),
  inf('infantry', 'line infantry', 'trooper'),
  inf('eliteInfantry', 'commandos', 'eliteTrooper', { raider: true }),
  inf('mandalorians', 'Mandalorians', 'mandalorian', { raider: true }),
  inf('cloneInfantry', 'clone infantry', 'cloneTrooper'),
  inf('stormtroopers', 'stormtroopers', 'stormtrooper'),
  inf('sithInfantry', 'Sith infantry', 'sithTrooper'),
  inf('vongWarriors', 'Yuuzhan Vong warriors', 'yuuzhanVongWarrior'),
  inf('warBeasts', 'war beasts', 'beast', { letter: 'w' }),
  inf('warDroids', 'war droids', 'warDroid', { type: 'droids', letter: 'd' }),
  inf('battleDroids', 'B1 battle droids', 'battleDroid', { type: 'droids', letter: 'd' }),
  inf('superBattleDroids', 'B2 super battle droids', 'superBattleDroid', { type: 'droids', letter: 'd' }),
  inf('droidekas', 'droidekas', 'droideka', { type: 'droids', letter: 'd' }),
  inf('skytroopers', 'Skytroopers', 'skytrooper', { type: 'droids', letter: 'd' }),
  { id: 'antiArmour', label: 'anti-armour teams', type: 'antiArmour', target: 'soft', fire: { soft: 1, hard: 3, air: 0.6 }, level: 40, toughness: 1, letter: 't', note: 'strong against armour from cover' },
  { id: 'armour', label: 'armour', type: 'armour', target: 'hard', fire: { soft: 3.5, hard: 2.5, air: 0.2 }, level: 40, toughness: 1.8, letter: 'a', note: 'tanks and walkers: strong in the open' },
  { id: 'droidArmour', label: 'droid armour', type: 'armour', target: 'hard', fire: { soft: 3, hard: 2.2, air: 0.2 }, level: 30, toughness: 1.8, letter: 'a', note: 'armour with a droid brain' },
  { id: 'artillery', label: 'artillery', type: 'artillery', target: 'soft', fire: { soft: 3, hard: 1.5, air: 0 }, level: 40, toughness: 0.8, letter: 'g', note: 'strong against massed or entrenched troops, weak to raids and air' },
  { id: 'antiAir', label: 'anti-air', type: 'antiAir', target: 'soft', fire: { soft: 0.6, hard: 0.3, air: 4.5 }, level: 40, toughness: 0.9, letter: 'x', note: 'the answer to air' },
  { id: 'air', label: 'air support', type: 'air', target: 'air', fire: { soft: 2, hard: 3.5, air: 2 }, level: 45, toughness: 1.2, letter: 'v', note: 'strong against armour and artillery, weak to anti-air' },
];

/** Fire and toughness of a kind: its weapon, its grades, its teamwork and aim, its armour. */
export const KIND_FIRE = { base: 1, perGrade: 0.32, coordination: 0.35, accuracy: 0.15, heavy: 0.5, melee: -0.4, hardShare: { heavy: 0.7, other: 0.25 }, airShare: { heavy: 0.3, other: 0.12 }, min: 0.4 } as const;
export const KIND_TOUGHNESS: Readonly<Record<'none' | 'light' | 'medium' | 'heavy', number>> = { none: 0.8, light: 0.95, medium: 1.1, heavy: 1.3 };
/** Troop quality as a Tactics level when no officer leads: the kind's weapon level, and this much for teamwork and aim. */
export const QUALITY = { share: 0.7, coordination: 8, accuracy: 3 } as const;

/** What sorts of fire do where (a factor on the fire above). */
export const FIRE_WHERE = {
  /** Armour's own fire in towns and woods, and on a target in heavy cover. */
  armourClose: 0.25,
  armourOnCover: 0.6,
  /** Against armour from cover: anti-armour teams, and anyone in towns and woods. */
  antiArmourCover: 2,
  infantryOnArmourClose: 4,
  /** Artillery on massed or entrenched troops, and on men spread out. */
  artilleryMassed: 1.6,
  artilleryLoose: 0.8,
  /** Raiders, and air, on guns; anti-air out of the way of anything else. */
  raidOnGuns: 2.2,
  airOnGuns: 1.8,
} as const;
export const MATCHUP = { scale: 1, cap: 3 } as const;

// ---- terrain ----

export interface Terrain {
  /** The defender's. */
  cover?: 'cover' | 'heavy';
  /** The side that holds the high ground. */
  high?: 'A' | 'B';
  chokepoint?: boolean;
  /** Armour cannot cross but at a bridge. */
  river?: boolean;
  bridge?: boolean;
  urban?: boolean;
  forest?: boolean;
}
export const TERRAIN = { cover: 1, heavy: 2, high: 1, chokepoint: -2 } as const;

// ---- plans ----

export const PLANS = ['frontal', 'flanking', 'envelopment', 'defenceInDepth', 'ambush', 'feint', 'siege', 'raid', 'fightingWithdrawal'] as const;
export type Plan = (typeof PLANS)[number];
export const PLAN_LABEL: Readonly<Record<Plan, string>> = { frontal: 'Frontal assault', flanking: 'Flanking', envelopment: 'Envelopment', defenceInDepth: 'Defence in depth', ambush: 'Ambush', feint: 'Feint', siege: 'Siege', raid: 'Infiltration or raid', fightingWithdrawal: 'Fighting withdrawal' };
export const PLAN_MATCHUP = 2;
/** What each beats (readings: the notes say only that each has matchups). */
export const PLAN_BEATS: Readonly<Record<Plan, readonly Plan[]>> = {
  frontal: ['feint', 'raid'],
  flanking: ['frontal', 'siege'],
  envelopment: ['defenceInDepth', 'flanking'],
  defenceInDepth: ['frontal', 'raid'],
  ambush: ['flanking', 'frontal'],
  feint: ['ambush', 'defenceInDepth'],
  siege: ['defenceInDepth', 'ambush'],
  raid: ['siege', 'envelopment'],
  fightingWithdrawal: ['frontal', 'envelopment'],
};

// ---- the roll's other parts ----

export const SUPPORT = 1;
export const MORALE_MOD: Curve = [[0, -3], [30, -1.5], [60, 0], [100, 1.5]];
/** Battle meditation by the coordinator's level: every roll of the side. */
export const MEDITATION: Curve = [[10, 0], [40, 1], [80, 2], [120, 3]];
/** Jedi and Sith at the front: the sector's morale, and a duelist's own threat less the enemy's best there. */
export const FORCE_USER = { morale: 15, duel: { below: 0, master: 1, top: 2, apex: 3 } } as const;
/** The player's own fight in the sector. */
export const OWN_FIGHT = { won: 2, held: 0, lost: -2 } as const;
/** No command post in contact: a bonded unit improvises, an ordinary one loses some, one that follows to the letter more. */
export const NO_CONTACT = { bonded: 0, ordinary: -1, letter: -2 } as const;

// ---- losses, breakthroughs and morale ----

/** Losses a phase (percent of strength) by the side's own margin, before toughness. */
export const LOSSES: Curve = [[-12, 10], [-5, 6], [0, 3.5], [5, 2.5], [12, 1.5]];
/** A breakthrough, by the strike's bands (4-7, 8-11, 12-15, 16+). */
export const BREAKTHROUGH = { light: 6, heavy: 18, rout: 18, collapse: 30, groundToTake: 2, gone: 8 } as const;
export const MORALE = {
  start: 65,
  bonded: 60,
  fear: 60,
  /** Strength (percent) at which a unit checks; each once. */
  thresholds: [75, 50, 30] as readonly number[],
  /** The check: d20 + morale / 10 + (bond - 50) / 15 against this, more for what brought it on. */
  dc: 11,
  perLoss: 0.06,
  leaderDead: 3,
  /** A battle meditator killed (Mizra). */
  meditatorKilled: 7,
  /** Failed by less than this: shaken; by more: routed. */
  routMargin: 4,
  shaken: 18,
  steady: 4,
  /** A fear-ruled unit obeys until it is this worn, then collapses; its commander gone, sooner. */
  fearLimit: 45,
  fearLimitAlone: 70,
  broughtLow: 10,
  meditatorMorale: 15,
  /** Militia and the like check harder, elites easier, by the kind's own morale group. */
  group: { early: -3, average: 0, late: 3, never: 99 } as Readonly<Record<'early' | 'average' | 'late' | 'never', number>>,
} as const;
/** Morale recovers, or falls, a phase by how it went. */
export const MORALE_DRIFT: Curve = [[-10, -8], [0, 0], [10, 5]];
