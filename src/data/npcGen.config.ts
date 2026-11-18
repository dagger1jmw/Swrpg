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
  /** 'byEra': each one rolls beskar (saber-resistant) by the era's chance (BESKAR_BY_ERA, D-158). */
  saberResistant?: boolean | 'byEra';
  /** Chances of grades 1-5. */
  grades: readonly [number, number, number, number, number];
  /**
   * Coordination (Jared, D-158): the numbers bonus is +1 per extra attacker engaged x coordination, rounded down, max +3.
   * 0 = mass without teamwork (B1 droids, militia, thugs); 0.5 line troopers; 1.0 elite squads and Mandalorians.
   */
  coordination: number;
  /** Accuracy on the kind's attack rolls (D-161; 0 when absent): B1 droids are notoriously poor shots. */
  accuracy?: number;
  /** Vitality multiplier on the stat-derived Vitality (droids are flimsy, beasts are tough). */
  vitalityMult: number;
  /** Lore note (a design default for Jared to check where marked). */
  note: string;
}
/** Years trained by grade at pace 1.0 (npc-generation §6). */
export const MINION_YEARS: readonly [number, number, number, number, number] = [2, 5, 10, 15, 20];
export const MINION_KINDS: readonly MinionKind[] = [
  { id: 'battleDroid', label: 'B1 battle droid', archetype: 'soldier', weapon: 'blasterRifle', armor: 'light', grades: [0.6, 0.35, 0.05, 0, 0], coordination: 0, accuracy: -3, vitalityMult: 0.6, note: 'B1: mass-produced, poorly coordinated; a Knight cutting through dozens is lore-accurate (Jared)' },
  { id: 'militia', label: 'militia fighter', archetype: 'civilian', weapon: 'blasterPistol', armor: 'none', grades: [0.6, 0.35, 0.05, 0, 0], coordination: 0, vitalityMult: 1, note: 'untrained locals with blasters (Jared)' },
  { id: 'thug', label: 'thug', archetype: 'bountyHunter', weapon: 'blasterPistol', armor: 'none', grades: [0.5, 0.35, 0.15, 0, 0], coordination: 0, vitalityMult: 1, note: 'gangsters and enforcers (Jared: 0)' },
  { id: 'brawler', label: 'brawler', archetype: 'civilian', weapon: 'melee', armor: 'none', grades: [0.5, 0.4, 0.1, 0, 0], coordination: 0, vitalityMult: 1, note: 'design default: street fighters, no teamwork' },
  { id: 'trooper', label: 'line trooper', archetype: 'soldier', weapon: 'blasterRifle', armor: 'medium', grades: [0.1, 0.4, 0.35, 0.13, 0.02], coordination: 0.5, vitalityMult: 1, note: 'clones, Republic troopers, Imperial stormtroopers (Jared: 0.5)' },
  { id: 'eliteTrooper', label: 'elite trooper', archetype: 'soldier', weapon: 'blasterRifle', armor: 'heavy', grades: [0, 0.1, 0.4, 0.4, 0.1], coordination: 1, accuracy: 0.5, vitalityMult: 1, note: 'ARC troopers, commandos, Imperial special forces, Havoc Squad-type units (Jared: 1.0)' },
  { id: 'mandalorian', label: 'Mandalorian warrior', archetype: 'mandalorian', weapon: 'blasterPistol', armor: 'heavy', saberResistant: 'byEra', grades: [0, 0.05, 0.3, 0.45, 0.2], coordination: 1, vitalityMult: 1, note: 'heavy armor (beskar by era, else durasteel or duraplast) and the highest grades: the most dangerous minion kind (Jared: 1.0)' },
  { id: 'superBattleDroid', label: 'B2 super battle droid', archetype: 'soldier', weapon: 'heavy', armor: 'heavy', grades: [0.3, 0.5, 0.2, 0, 0], coordination: 0, vitalityMult: 1.2, note: 'design default for Jared: B2s are tougher and better armed than B1s but still droid-brained (0)' },
  { id: 'droideka', label: 'droideka', archetype: 'soldier', weapon: 'heavy', armor: 'heavy', grades: [0.1, 0.4, 0.4, 0.1, 0], coordination: 0.5, vitalityMult: 1.5, note: 'design default for Jared: shielded rollers that work in pairs (0.5); no deflector shield model yet' },
  { id: 'beast', label: 'beast', archetype: 'civilian', weapon: 'melee', armor: 'light', grades: [0.3, 0.4, 0.2, 0.1, 0], coordination: 0, vitalityMult: 1.8, note: 'design default for Jared: predators and war beasts, no teamwork (0), tough hides' },
  { id: 'sithAcolyte', label: 'Sith acolyte', archetype: 'sithWarrior', weapon: 'lightsaber', armor: 'light', grades: [0.3, 0.4, 0.25, 0.05, 0], coordination: 0, vitalityMult: 1, note: 'design default for Jared: rivals who will not cover each other (0)' },
];
/**
 * Beskar by era (Jared, D-158; Legends, Mandalorian armor). The curve is lore: beskar was a crucial part of the armor for
 * millennia until just before the Clone Wars; rare and expensive, so many (Jango and Boba Fett among them) wore durasteel
 * or duraplast; the Empire mined most of it off Mandalore; Yuuzhan Vong bombardment later opened new mines. The rates are
 * design defaults. `toYear` is exclusive (calendar years; negative = BBY). Old Republic years after the Great Galactic
 * War and before the New Sith Wars keep the Old Republic rate.
 */
export const BESKAR_BY_ERA: readonly { toYear: number; chance: number; label: string }[] = [
  { toYear: -2000, chance: 0.6, label: 'Old Republic eras through the Great Galactic War' },
  { toYear: -1000, chance: 0.45, label: 'New Sith Wars' },
  { toYear: -19, chance: 0.15, label: 'the late Republic up to and through the Clone Wars' },
  { toYear: 29, chance: 0.05, label: 'the Galactic Empire through the Yuuzhan Vong War' },
  { toYear: Infinity, chance: 0.35, label: 'after the Vong war (new mines, Legacy era)' },
];
export const beskarChanceAt = (year: number): number => (BESKAR_BY_ERA.find((e) => year < e.toYear) ?? BESKAR_BY_ERA[BESKAR_BY_ERA.length - 1]!).chance;

export const MINION_KIND_IDS: readonly string[] = MINION_KINDS.map((k) => k.id);
/** Minion count per group in combatStarted: a clamped AI amount (D-143 amends architecture §2). */
export const MINION_COUNT = { min: 1, max: 12 } as const;
