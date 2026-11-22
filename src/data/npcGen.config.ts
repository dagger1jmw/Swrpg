// NPC generation inputs (npc-generation.md Â§2-6; M5). Code picks the archetype, rolls talents and variance;
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
  // Non-Sith darksiders (D-311, D-320): the Sith numbers, so an era correction never changes balance.
  darkJedi: [['sithWarrior', 0.6], ['sithInquisitor', 0.4]],
  darkAcolyte: [['sithWarrior', 0.6], ['sithInquisitor', 0.4]],
  inquisitor: [['sithWarrior', 0.6], ['sithInquisitor', 0.4]],
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
/**
 * Species overrides by role (Jared, D-224): a Yuuzhan Vong in a fighting role is of the warrior caste, whatever the
 * narrator's faction. Other Vong roles (shapers, priests, workers) stay civilian until the M6 catalog.
 */
export const SPECIES_ARCHETYPE: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  yuuzhanVong: { soldier: 'yuuzhanVongWarrior', officer: 'yuuzhanVongWarrior', pilot: 'yuuzhanVongWarrior', bountyHunter: 'yuuzhanVongWarrior', criminal: 'yuuzhanVongWarrior', other: 'yuuzhanVongWarrior' },
  // Melee warrior species (Jared, D-422): a Talz or Dashade in a fighting role is a warrior.
  talz: { soldier: 'warrior', bountyHunter: 'warrior', criminal: 'warrior', other: 'warrior' },
  dashade: { soldier: 'warrior', bountyHunter: 'warrior', criminal: 'warrior', other: 'warrior' },
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
  darkJedi: 'lord',
  darkAcolyte: 'acolyte',
  inquisitor: 'lord',
};
/** Age when the AI gave none (D-143 design default). */
export const DEFAULT_AGE_BY_ROLE: Readonly<Record<string, number>> = {
  initiate: 9,
  padawan: 16,
  jediKnight: 30,
  jediMaster: 50,
  sithAcolyte: 16,
  sithLord: 40,
  darkJedi: 40,
  darkAcolyte: 16,
  inquisitor: 40,
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
  darkJedi: 18,
  darkAcolyte: 8,
  inquisitor: 18,
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
export const RANK_AGES = { padawanAge: 12, knightAge: 25 } as const;

// ---- Talents (npc-generation Â§2) ----
export const TALENT_ROLL_ORDERS: Readonly<Record<'order' | 'other', readonly (readonly ['none' | 'gifted' | 'prodigy' | 'exceptional', number])[]>> = {
  /** Force-trained orders (Jedi, Sith). */
  order: [['none', 0.7], ['gifted', 0.22], ['prodigy', 0.07], ['exceptional', 0.01]],
  /** Everyone else. The spec's 80 / 17 / 3 / 0.2 sums to 100.2; "none" takes the 0.2 off (79.8). */
  other: [['none', 0.798], ['gifted', 0.17], ['prodigy', 0.03], ['exceptional', 0.002]],
};
export const ORDER_ROLES: readonly string[] = ['jediMaster', 'jediKnight', 'padawan', 'initiate', 'sithLord', 'sithAcolyte', 'darkJedi', 'darkAcolyte', 'inquisitor'];

/** Per-skill variance exp(N(0, sigma)), seeded per NPC (npc-generation Â§1). */
export const NPC_VARIANCE_SIGMA = 0.12;

/**
 * The generation seed is a hash of the campaign seed and the NPC's ID (Jared, D-143), never the order NPCs
 * are met, so generating NPCs in any order gives the same stats.
 */
export const NPC_SEED_SALT = 'npc-gen-v1';

// ---- War years (npc-generation Â§1 war term; character-creation Â§2) ----
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
    source: 'Timeline slice Part 1 (Great Galactic War; D-01)',
  },
];
/** Roles that fight in a war (combatants gain war years). */
export const COMBATANT_ROLES: readonly string[] = ['jediMaster', 'jediKnight', 'padawan', 'sithLord', 'sithAcolyte', 'darkJedi', 'darkAcolyte', 'inquisitor', 'soldier', 'officer', 'pilot', 'bountyHunter'];

// ---- Era gating of the dark-side roles (D-320; lore: SW_Sith_Training_AllEras_Part2.md, D-311) ----
// Years as [from, to) ranges, negative = BBY, like the minion kinds (D-213). From 1,000 BBY to c. 25 ABY only the Rule
// of Two pair are Sith (to 4 ABY); everyone else who uses the dark side is not (D-311). The One Sith are founded
// "before 27 ABY", so generic Sith return at 25 ABY (design default, Jared).
const SITH_ERAS: readonly (readonly [number, number])[] = [[-100000, -999], [25, 100000]];
/** Dooku's Dark Acolytes: the Clone Wars (22-19 BBY). */
const DARK_ACOLYTE_ERAS: readonly (readonly [number, number])[] = [[-22, -18]];
/** The Inquisitorius: 19 BBY to c. 11 ABY. */
const INQUISITOR_ERAS: readonly (readonly [number, number])[] = [[-19, 12]];
/** Roles with era limits; absent = every era (Dark Jedi exist in any era: the default fallback). */
export const ROLE_ERAS: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  sithLord: SITH_ERAS,
  sithAcolyte: SITH_ERAS,
  darkAcolyte: DARK_ACOLYTE_ERAS,
  inquisitor: INQUISITOR_ERAS,
};
/** The next role to try outside a role's years; the chain ends at darkJedi, which has no limit. */
export const ROLE_ERA_FALLBACK: Readonly<Record<string, string>> = {
  sithLord: 'darkJedi',
  sithAcolyte: 'darkAcolyte',
  darkAcolyte: 'darkJedi',
  inquisitor: 'darkJedi',
};
const ROLE_LABEL: Readonly<Record<string, string>> = { sithLord: 'Sith Lord', sithAcolyte: 'Sith acolyte', darkJedi: 'Dark Jedi', darkAcolyte: 'Dark Acolyte', inquisitor: 'Inquisitor' };

const inEras = (eras: readonly (readonly [number, number])[] | undefined, year: number): boolean => !eras || eras.some(([from, to]) => year >= from && year < to);
const yearLabel = (year: number): string => (year < 0 ? `${-year} BBY` : `${year} ABY`);

export function roleInEra(role: string, year: number): boolean {
  return inEras(ROLE_ERAS[role], year);
}

/**
 * The role a generic (non-canon) NPC holds in a year (D-320): the role asked for, or the first role along its fallback
 * chain that exists then, with a note when it changed. Named canon figures are exempt; the caller checks the canon match.
 */
export function roleForYear(role: string, year: number): { role: string; note: string | null } {
  let r = role;
  for (let i = 0; i < 4 && !roleInEra(r, year); i++) r = ROLE_ERA_FALLBACK[r] ?? 'darkJedi';
  if (r === role) return { role, note: null };
  const why = year >= -999 && year < 25 ? '; only the Rule of Two Master and apprentice are Sith in these years' : '';
  return { role: r, note: `no ${ROLE_LABEL[role] ?? role} in ${yearLabel(year)}: a ${ROLE_LABEL[r] ?? r} instead (D-320${why})` };
}

// ---- Minions (npc-generation Â§6, health Â§9) ----
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
  /** The weapon's and the armor's own names, where the kind's are generic (pass 4 issue 12). */
  weaponName?: string;
  armorName?: string;
  /** Lore note (a design default for Jared to check where marked). */
  note: string;
  /**
   * The calendar years the kind exists in (D-213), as [from, to) ranges (negative = BBY; to is exclusive); absent = every
   * era. A kind asked for outside them becomes MINION_ERA_FALLBACK's kind.
   */
  eras?: readonly (readonly [number, number])[];
  /** The plural, where adding an s is wrong ("Dark Jedi"). */
  plural?: string;
}
/** Years trained by grade at pace 1.0 (npc-generation Â§6). */
export const MINION_YEARS: readonly [number, number, number, number, number] = [2, 5, 10, 15, 20];
export const MINION_KINDS: readonly MinionKind[] = [
  { id: 'battleDroid', label: 'B1 battle droid', eras: [[-32, -18]], archetype: 'soldier', weapon: 'blasterRifle', armor: 'light', grades: [0.6, 0.35, 0.05, 0, 0], coordination: 0, accuracy: -3, vitalityMult: 0.6, note: 'B1: mass-produced, poorly coordinated; a Knight cutting through dozens is lore-accurate (Jared)' },
  { id: 'militia', label: 'militia fighter', archetype: 'civilian', weapon: 'blasterPistol', armor: 'none', grades: [0.6, 0.35, 0.05, 0, 0], coordination: 0, accuracy: -1, vitalityMult: 1, note: 'untrained locals with blasters (Jared)' },
  { id: 'thug', label: 'thug', archetype: 'bountyHunter', weapon: 'blasterPistol', armor: 'none', grades: [0.5, 0.35, 0.15, 0, 0], coordination: 0, vitalityMult: 1, note: 'gangsters and enforcers (Jared: 0)' },
  { id: 'brawler', label: 'brawler', archetype: 'civilian', weapon: 'melee', armor: 'none', grades: [0.5, 0.4, 0.1, 0, 0], coordination: 0, vitalityMult: 1, note: 'design default: street fighters, no teamwork' },
  { id: 'trooper', label: 'line trooper', archetype: 'soldier', weapon: 'blasterRifle', armor: 'medium', grades: [0.1, 0.4, 0.35, 0.13, 0.02], coordination: 0.5, vitalityMult: 1, note: 'clones, Republic troopers, Imperial stormtroopers (Jared: 0.5)' },
  { id: 'eliteTrooper', label: 'elite trooper', archetype: 'soldier', weapon: 'blasterRifle', armor: 'heavy', grades: [0, 0.1, 0.4, 0.4, 0.1], coordination: 1, accuracy: 0.5, vitalityMult: 1, note: 'ARC troopers, commandos, Imperial special forces, Havoc Squad-type units (Jared: 1.0)' },
  { id: 'mandalorian', label: 'Mandalorian warrior', archetype: 'mandalorian', weapon: 'blasterPistol', armor: 'heavy', saberResistant: 'byEra', grades: [0, 0.05, 0.3, 0.45, 0.2], coordination: 1, accuracy: 0.5, vitalityMult: 1, note: 'heavy armor (beskar by era, else durasteel or duraplast) and the highest grades: the most dangerous minion kind (Jared: 1.0)' },
  { id: 'superBattleDroid', label: 'B2 super battle droid', eras: [[-22, -18]], archetype: 'soldier', weapon: 'heavy', armor: 'heavy', grades: [0.3, 0.5, 0.2, 0, 0], coordination: 0, vitalityMult: 1.2, note: 'design default for Jared: B2s are tougher and better armed than B1s but still droid-brained (0)' },
  { id: 'droideka', label: 'droideka', eras: [[-32, -18]], archetype: 'soldier', weapon: 'heavy', armor: 'heavy', grades: [0.1, 0.4, 0.4, 0.1, 0], coordination: 0.5, vitalityMult: 1.5, note: 'design default for Jared: shielded rollers that work in pairs (0.5); no deflector shield model yet' },
  { id: 'beast', label: 'beast', archetype: 'civilian', weapon: 'melee', armor: 'light', grades: [0.3, 0.4, 0.2, 0.1, 0], coordination: 0, vitalityMult: 1.8, note: 'design default for Jared: predators and war beasts, no teamwork (0), tough hides' },
  // Era kinds (D-213). War droid: era-neutral, the B1's numbers (the Krath war droids of 3,997 BBY and the Mandalorian
  // Basilisk war droids are in the lore files; Timeline :176, Characters_04-05). Troopers by era: the line trooper stays
  // era-neutral (Republic troopers, planetary forces); these name the era's own soldiers with the line trooper's numbers.
  { id: 'warDroid', label: 'war droid', archetype: 'soldier', weapon: 'blasterRifle', armor: 'light', grades: [0.6, 0.35, 0.05, 0, 0], coordination: 0, accuracy: -3, vitalityMult: 0.6, note: 'design default (D-213): any era; the B1 battle droid\'s numbers for every droid infantry that is not of a named model' },
  { id: 'cloneTrooper', label: 'clone trooper', eras: [[-22, -18]], archetype: 'soldier', weapon: 'blasterRifle', armor: 'medium', grades: [0.1, 0.4, 0.35, 0.13, 0.02], coordination: 0.5, vitalityMult: 1, note: 'Clone Wars only (D-213); the line trooper\'s numbers' },
  { id: 'stormtrooper', label: 'stormtrooper', eras: [[-19, 200]], archetype: 'soldier', weapon: 'blasterRifle', armor: 'medium', grades: [0.1, 0.4, 0.35, 0.13, 0.02], coordination: 0.5, vitalityMult: 1, note: 'the Empire from 19 BBY through the Imperial Remnant and the Fel Empire (D-213); the line trooper\'s numbers' },
  { id: 'sithTrooper', label: 'Sith trooper', eras: [[-3960, -3627]], archetype: 'soldier', weapon: 'blasterRifle', armor: 'medium', grades: [0.1, 0.4, 0.35, 0.13, 0.02], coordination: 0.5, vitalityMult: 1, note: 'the Sith Empire from the Jedi Civil War through the Great Galactic War and the Cold War (D-213; Characters_08 :265 "Sith trooper"); the line trooper\'s numbers' },
  { id: 'skytrooper', label: 'Skytrooper', eras: [[-3636, -3627]], archetype: 'soldier', weapon: 'blasterRifle', armor: 'medium', grades: [0.1, 0.4, 0.35, 0.13, 0.02], coordination: 0.5, vitalityMult: 1, note: 'the Eternal Empire\'s droid soldiers, war against Zakuul (D-213; Characters_09B :342 "Skytrooper"); the line trooper\'s numbers, a droid' },
  // Yuuzhan Vong warriors (D-239): the D-224 archetype as a minion kind, melee (the amphistaff) in vonduun crab armor that
  // resists a lightsaber (Characters_15 :34), outside the Force (D-192); warriors fight in squads (0.5). From the
  // invasion (25 ABY) on: design default; out of era a brawler.
  { id: 'yuuzhanVongWarrior', label: 'Yuuzhan Vong warrior', eras: [[25, 1000]], archetype: 'yuuzhanVongWarrior', weapon: 'melee', weaponName: 'amphistaff', armor: 'heavy', armorName: 'vonduun crab armor', saberResistant: true, grades: [0, 0.2, 0.45, 0.3, 0.05], coordination: 0.5, vitalityMult: 1.2, note: 'design default (D-239): the warrior caste, trained from youth; tough (1.2)' },
  // Sith acolytes are era-gated with the Sith roles (D-320): none from 1,000 BBY to 25 ABY, where only the Rule of Two
  // pair are Sith (D-311). Out of era: Dark Acolytes (22-19 BBY), else Dark Jedi, both with the acolyte's numbers.
  { id: 'sithAcolyte', label: 'Sith acolyte', eras: SITH_ERAS, archetype: 'sithWarrior', weapon: 'lightsaber', armor: 'light', grades: [0.3, 0.4, 0.25, 0.05, 0], coordination: 0, vitalityMult: 1, note: 'design default for Jared: rivals who will not cover each other (0)' },
  { id: 'darkAcolyte', label: 'Dark Acolyte', eras: DARK_ACOLYTE_ERAS, archetype: 'sithWarrior', weapon: 'lightsaber', armor: 'light', grades: [0.3, 0.4, 0.25, 0.05, 0], coordination: 0, vitalityMult: 1, note: 'D-320: the Sith acolyte numbers; Dooku\'s Dark Acolytes (Sith AE2, Era 7)' },
  { id: 'darkJedi', label: 'Dark Jedi', plural: 'Dark Jedi', archetype: 'sithWarrior', weapon: 'lightsaber', armor: 'light', grades: [0.3, 0.4, 0.25, 0.05, 0], coordination: 0, vitalityMult: 1, note: 'D-320: the Sith acolyte numbers; any era, the default fallback for a dark-side group' },
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

/**
 * Weapon-skill profile per minion kind (Jared, D-195): each kind's main weapon has a trained level from the kind, not
 * from an archetype that never trains it. 'archetype': the kind's archetype measures that skill (soldier, bounty
 * hunter, Mandalorian blaster; Sith Warrior forms), so the level is the archetype's closed form as before. Otherwise a
 * pace for the weapon skill over the grade's years (closed form, technique row, one phase), as a share of the soldier's
 * Knight+ blaster pace (1.326): militia get basic blaster training (a grade-1 militia fighter is a poor shot, not level
 * 0), brawlers street melee, beasts their natural fighting. Design defaults.
 */
export const SOLDIER_BLASTER_PACE = 1.326;
export type MinionWeaponProfile = { source: 'archetype' } | { source: 'kind'; skill: 'blaster' | 'melee'; share: number };
export const MINION_WEAPON_PROFILE: Readonly<Record<string, MinionWeaponProfile>> = {
  battleDroid: { source: 'archetype' },
  militia: { source: 'kind', skill: 'blaster', share: 0.25 },
  thug: { source: 'archetype' },
  brawler: { source: 'kind', skill: 'melee', share: 0.5 },
  trooper: { source: 'archetype' },
  eliteTrooper: { source: 'archetype' },
  mandalorian: { source: 'archetype' },
  superBattleDroid: { source: 'archetype' },
  droideka: { source: 'archetype' },
  beast: { source: 'kind', skill: 'melee', share: 0.6 },
  sithAcolyte: { source: 'archetype' },
  darkAcolyte: { source: 'archetype' },
  darkJedi: { source: 'archetype' },
  warDroid: { source: 'archetype' },
  cloneTrooper: { source: 'archetype' },
  stormtrooper: { source: 'archetype' },
  sithTrooper: { source: 'archetype' },
  skytrooper: { source: 'archetype' },
  // The Vong warrior trains melee at the soldier's blaster pace (data/archetypes.ts); minionInputs' young grade-1
  // ages fall before the archetype's start age (17), so the pace is given here (D-239).
  yuuzhanVongWarrior: { source: 'kind', skill: 'melee', share: 1 },
};

/** The era-appropriate kind for a kind asked for outside its years (D-213): droids become war droids, troopers line troopers. */
export const MINION_ERA_FALLBACK: Readonly<Record<string, string>> = {
  battleDroid: 'warDroid',
  superBattleDroid: 'warDroid',
  droideka: 'warDroid',
  skytrooper: 'warDroid',
  cloneTrooper: 'trooper',
  stormtrooper: 'trooper',
  sithTrooper: 'trooper',
  yuuzhanVongWarrior: 'brawler',
  sithAcolyte: 'darkAcolyte',
  darkAcolyte: 'darkJedi',
};

/** Whether a kind exists in a calendar year (D-213). */
export function minionKindInEra(kindId: string, year: number): boolean {
  return inEras(MINION_KINDS.find((k) => k.id === kindId)?.eras, year);
}

/** The kind to field in a year: the kind asked for, or its era fallback, with a note when it changed (D-213). */
export function minionKindForYear(kindId: string, year: number): { kind: string; note: string | null } {
  if (minionKindInEra(kindId, year)) return { kind: kindId, note: null };
  // The fallback chain (D-320: Sith acolyte -> Dark Acolyte -> Dark Jedi) ends at a kind with no era limit.
  let to = MINION_ERA_FALLBACK[kindId] ?? 'trooper';
  for (let i = 0; i < 4 && !minionKindInEra(to, year); i++) to = MINION_ERA_FALLBACK[to] ?? 'trooper';
  return { kind: to, note: `no ${minionKindPlural(kindId)} in ${yearLabel(year)}: ${minionKindPlural(to)} instead (D-213)` };
}

/** A kind's plural label ("B1 battle droids", "Dark Jedi"). */
export function minionKindPlural(kindId: string): string {
  const k = MINION_KINDS.find((x) => x.id === kindId);
  return k ? (k.plural ?? `${k.label}s`) : `${kindId}s`;
}

export const MINION_KIND_IDS: readonly string[] = MINION_KINDS.map((k) => k.id);
/** Minion count per group in combatStarted: a clamped AI amount (D-143 amends architecture Â§2). */
export const MINION_COUNT = { min: 1, max: 12 } as const;
