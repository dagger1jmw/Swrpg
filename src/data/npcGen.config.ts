// NPC generation inputs (npc-generation.md §2-6; M5). Code picks the archetype, rolls talents and variance;
// the AI supplies only name, species, faction, role and approximate age (npcIntroduced). Design defaults are
// logged in docs-v2/decisions.md (D-143 onward).
import type { WeaponKind, ArmorKind } from './health.config';

/** Role -> weighted archetypes (seeded pick). A faction override wins where listed. */
export const ROLE_ARCHETYPES: Readonly<Record<string, readonly (readonly [string, number])[]>> = {
  jediMaster: [['jediGuardian', 0.4], ['jediConsular', 0.35], ['jediSentinel', 0.25]],
  jediKnight: [['jediGuardian', 0.4], ['jediConsular', 0.35], ['jediSentinel', 0.25]],
  padawan: [['jediGuardian', 0.4], ['jediConsular', 0.35], ['jediSentinel', 0.25]],
  initiate: [['jediGuardian', 0.4], ['jediConsular', 0.35], ['jediSentinel', 0.25]],
  sithLord: [['sithWarrior', 0.6], ['sithInquisitor', 0.4]],
  sithAcolyte: [['sithWarrior', 0.6], ['sithInquisitor', 0.4]],
  soldier: [['soldier', 1]],
  officer: [['soldier', 1]],
  pilot: [['smuggler', 1]],
  smuggler: [['smuggler', 1]],
  criminal: [['smuggler', 0.5], ['bountyHunter', 0.5]],
  bountyHunter: [['bountyHunter', 1]],
};
/** Faction overrides by role (Mandalorian soldiers and hunters are Mandalorians). */
export const FACTION_ARCHETYPE: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  mandalorians: { soldier: 'mandalorian', officer: 'mandalorian', bountyHunter: 'mandalorian', criminal: 'mandalorian' },
};
/** Everyone else is a civilian (politician, official, merchant, scholar, healer, servant, civilian, droid, other). */
export const DEFAULT_ARCHETYPE = 'civilian';

/** Rank from role (ranks.md ladders; Sith on the Jedi rows until M7). Careers have no rank ('none'). */
export const ROLE_RANK: Readonly<Record<string, string>> = {
  jediMaster: 'master',
  jediKnight: 'knight',
  padawan: 'padawan',
  initiate: 'initiate',
  sithLord: 'lord',
  sithAcolyte: 'acolyte',
};
/** Age when the AI gave none (D-143 design default). */
export const DEFAULT_AGE_BY_ROLE: Readonly<Record<string, number>> = {
  initiate: 9,
  padawan: 16,
  jediKnight: 30,
  jediMaster: 50,
  sithAcolyte: 16,
  sithLord: 40,
  soldier: 28,
  officer: 38,
};
export const DEFAULT_AGE = 35;
/**
 * Youngest age at which a figure can hold a role (D-155 design defaults; ranks.md minimum ages for the Jedi and
 * Sith ladders). A canon figure is present at a date only when old enough for the role held then.
 */
export const ROLE_MIN_AGE: Readonly<Record<string, number>> = {
  initiate: 4,
  padawan: 10,
  jediKnight: 18,
  jediMaster: 31,
  sithAcolyte: 8,
  sithLord: 18,
  soldier: 18,
  officer: 22,
  pilot: 18,
  politician: 25,
  official: 20,
  merchant: 18,
  smuggler: 18,
  criminal: 16,
  bountyHunter: 18,
  scholar: 20,
  healer: 20,
  servant: 14,
  civilian: 0,
  droid: 0,
  other: 0,
};
/** Rank ages for the closed-form phases (D-105: Sith on the Jedi ages until M7). */
export const RANK_AGES = { padawanAge: 12, knightAge: 20.5 } as const;

// ---- Talents (npc-generation §2) ----
export const TALENT_ROLL_ORDERS: Readonly<Record<'order' | 'other', readonly (readonly ['none' | 'gifted' | 'prodigy' | 'exceptional', number])[]>> = {
  /** Force-trained orders (Jedi, Sith). */
  order: [['none', 0.7], ['gifted', 0.22], ['prodigy', 0.07], ['exceptional', 0.01]],
  /** Everyone else. The spec's 80 / 17 / 3 / 0.2 sums to 100.2; "none" takes the 0.2 off (79.8). */
  other: [['none', 0.798], ['gifted', 0.17], ['prodigy', 0.03], ['exceptional', 0.002]],
};
export const ORDER_ROLES: readonly string[] = ['jediMaster', 'jediKnight', 'padawan', 'initiate', 'sithLord', 'sithAcolyte'];

/** Per-skill variance exp(N(0, sigma)), seeded per NPC (npc-generation §1). */
export const NPC_VARIANCE_SIGMA = 0.12;

/**
 * The generation seed is a hash of the campaign seed and the NPC's ID (Jared, D-143), never the order NPCs
 * are met, so generating NPCs in any order gives the same stats.
 */
export const NPC_SEED_SALT = 'npc-gen-v1';

// ---- War years (npc-generation §1 war term; character-creation §2) ----
export interface War {
  id: string;
  fromBby: number;
  toBby: number;
  factions: readonly string[];
  source: string;
}
export const WARS: readonly War[] = [
  {
    id: 'greatGalacticWar',
    fromBby: 3681,
    toBby: 3653,
    factions: ['republic', 'sithEmpire', 'jediOrder', 'sith', 'mandalorians'],
    source: 'Timeline :305-311 (D-01)',
  },
];
/** Roles that fight in a war (combatants gain war years). */
export const COMBATANT_ROLES: readonly string[] = ['jediMaster', 'jediKnight', 'padawan', 'sithLord', 'sithAcolyte', 'soldier', 'officer', 'pilot', 'bountyHunter'];

// ---- Minions (npc-generation §6, health §9) ----
export interface MinionKind {
  id: string;
  label: string;
  archetype: string;
  weapon: WeaponKind;
  armor: ArmorKind;
  /** Chances of grades 1-5. */
  grades: readonly [number, number, number, number, number];
}
/** Years trained by grade at pace 1.0 (npc-generation §6). */
export const MINION_YEARS: readonly [number, number, number, number, number] = [2, 5, 10, 15, 20];
export const MINION_KINDS: readonly MinionKind[] = [
  { id: 'battleDroid', label: 'battle droid', archetype: 'soldier', weapon: 'blasterRifle', armor: 'medium', grades: [0.4, 0.35, 0.2, 0.05, 0] },
  { id: 'trooper', label: 'trooper', archetype: 'soldier', weapon: 'blasterRifle', armor: 'medium', grades: [0.1, 0.4, 0.35, 0.13, 0.02] },
  { id: 'eliteTrooper', label: 'elite trooper', archetype: 'soldier', weapon: 'blasterRifle', armor: 'heavy', grades: [0, 0.1, 0.4, 0.4, 0.1] },
  { id: 'thug', label: 'thug', archetype: 'bountyHunter', weapon: 'blasterPistol', armor: 'none', grades: [0.5, 0.35, 0.15, 0, 0] },
  { id: 'brawler', label: 'brawler', archetype: 'civilian', weapon: 'melee', armor: 'none', grades: [0.5, 0.4, 0.1, 0, 0] },
  { id: 'sithAcolyte', label: 'Sith acolyte', archetype: 'sithWarrior', weapon: 'lightsaber', armor: 'light', grades: [0.3, 0.4, 0.25, 0.05, 0] },
];
export const MINION_KIND_IDS: readonly string[] = MINION_KINDS.map((k) => k.id);
/** Minion count per group in combatStarted: a clamped AI amount (D-143 amends architecture §2). */
export const MINION_COUNT = { min: 1, max: 12 } as const;
