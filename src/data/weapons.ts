// Weapons and armor until the equipment spec (M8): STUB_WEAPONS (architecture §15, D-143). The weapon and
// armor a combatant carries come from path, archetype and role. Items replace this in M8.
import type { ArmorKind, WeaponKind } from './health.config';

export interface Loadout {
  weapon: WeaponKind;
  armor: ArmorKind;
  /** Cortosis or beskar: armor counts in full against lightsabers. */
  saberResistant: boolean;
}

const NONE: Loadout = { weapon: 'unarmed', armor: 'none', saberResistant: false };

/** By archetype (characters and generated NPCs). Jedi and Sith with a form carry a lightsaber. */
export const LOADOUT_BY_ARCHETYPE: Readonly<Record<string, Loadout>> = {
  jediGuardian: { weapon: 'lightsaber', armor: 'none', saberResistant: false },
  jediConsular: { weapon: 'lightsaber', armor: 'none', saberResistant: false },
  jediSentinel: { weapon: 'lightsaber', armor: 'none', saberResistant: false },
  sithWarrior: { weapon: 'lightsaber', armor: 'light', saberResistant: false },
  sithInquisitor: { weapon: 'lightsaber', armor: 'none', saberResistant: false },
  soldier: { weapon: 'blasterRifle', armor: 'medium', saberResistant: false },
  // Beskar is rolled per Mandalorian by era (D-158; npcGen.config BESKAR_BY_ERA) or set by canon armor; heavy armor either way.
  mandalorian: { weapon: 'blasterPistol', armor: 'heavy', saberResistant: false },
  smuggler: { weapon: 'blasterPistol', armor: 'none', saberResistant: false },
  bountyHunter: { weapon: 'blasterPistol', armor: 'light', saberResistant: false },
  civilian: NONE,
  // A sniper's long rifle and light armour (D-511, design default).
  sniper: { weapon: 'blasterRifle', armor: 'light', saberResistant: false },
  // A crime lord keeps guards to fight for them (D-509).
  crimeLord: NONE,
  // m8-skills (D-513; design defaults): officers and staff carry a sidearm; a field agent a pistol and light armour; a
  // politician and a scholar nothing; a pilot, a gunner and a mechanic a sidearm.
  officer: { weapon: 'blasterPistol', armor: 'light', saberResistant: false },
  navalOfficer: { weapon: 'blasterPistol', armor: 'none', saberResistant: false },
  intelAnalyst: { weapon: 'blasterPistol', armor: 'none', saberResistant: false },
  intelAgent: { weapon: 'blasterPistol', armor: 'light', saberResistant: false },
  politician: NONE,
  scholar: NONE,
  starfighterPilot: { weapon: 'blasterPistol', armor: 'none', saberResistant: false },
  shipGunner: { weapon: 'blasterPistol', armor: 'light', saberResistant: false },
  engineer: { weapon: 'blasterPistol', armor: 'none', saberResistant: false },
  // The amphistaff and vonduun crab armor, both lightsaber-resistant (Characters_15 :34; D-224).
  yuuzhanVongWarrior: { weapon: 'melee', armor: 'heavy', saberResistant: true },
  // The melee warrior (D-422): a blade or a heavy close weapon, light armor; canon armor or weapon overrides it.
  warrior: { weapon: 'melee', armor: 'light', saberResistant: false },
};

/** Ranks that train with a training saber (Initiates, Sith acolytes). */
export const TRAINING_SABER_RANKS: readonly string[] = ['initiate', 'acolyte'];

/** Energy weapons: a lightsaber can send their bolts back, and the forms' vs-blaster matchups apply (rolls §4). */
export const BLASTER_WEAPONS: readonly WeaponKind[] = ['blasterPistol', 'blasterRifle', 'heavy'];

/**
 * Slugthrowers (Jared, D-200; Legends): solid projectiles. Non-saber weapons (wounds by margin, D-161), fired with the
 * blaster skill until the equipment system (M8). Against a lightsaber: the blade can block slugs (they melt on it) but
 * never redirect them, so there is no Shien or Soresu redirect and no vs-blaster form matchup. Rapid fire (the
 * slugthrower rifle) and scatter shot (the scatter gun) are more projectiles than a blade can meet: a defender with a
 * saber takes `SLUG_SPREAD_DEFENSE` on the defense (design default).
 */
export const SLUGTHROWERS: readonly WeaponKind[] = ['slugPistol', 'slugRifle', 'scatterGun'];
export const SLUG_SPREAD: Readonly<Partial<Record<WeaponKind, string>>> = { slugRifle: 'rapid slugthrower fire', scatterGun: 'scatter shot' };
export const SLUG_SPREAD_DEFENSE = -1;
export const isSlugthrower = (w: WeaponKind): boolean => SLUGTHROWERS.includes(w);

/**
 * Mandalorians carrying a slugthrower instead of a blaster, by era (D-200; design defaults: a favoured answer to Jedi,
 * more so once fighting them became a trade). `toYear` is exclusive (negative = BBY). The kind is rolled by weight.
 */
export const MANDALORIAN_SLUGTHROWERS: readonly { toYear: number; share: number; label: string }[] = [
  { toYear: -1000, share: 0.15, label: 'Old Republic eras' },
  { toYear: -19, share: 0.2, label: 'the late Republic and the Clone Wars' },
  { toYear: Infinity, share: 0.25, label: 'the Empire and after' },
];
export const MANDALORIAN_SLUG_KINDS: readonly (readonly [WeaponKind, number])[] = [['slugPistol', 0.5], ['slugRifle', 0.3], ['scatterGun', 0.2]];
export const slugthrowerShareAt = (year: number): number => (MANDALORIAN_SLUGTHROWERS.find((e) => year < e.toYear) ?? MANDALORIAN_SLUGTHROWERS[MANDALORIAN_SLUGTHROWERS.length - 1]!).share;
/** A Mandalorian's weapon from two uniform draws (the share by era, then the kind), or null to keep the blaster. */
export function mandalorianSlugthrower(year: number, u1: number, u2: number): WeaponKind | null {
  if (u1 >= slugthrowerShareAt(year)) return null;
  let acc = 0;
  for (const [w, weight] of MANDALORIAN_SLUG_KINDS) {
    acc += weight;
    if (u2 < acc) return w;
  }
  return MANDALORIAN_SLUG_KINDS[0]![0];
}

/** Weapons that use the ranged exchange (rolls §4). */
export const RANGED_WEAPONS: readonly WeaponKind[] = [...BLASTER_WEAPONS, ...SLUGTHROWERS];
/** A weapon kind in plain words (the captors' line in later scenes; pass 4 issue 4). */
export const WEAPON_NAMES: Readonly<Record<WeaponKind, string>> = { unarmed: 'no weapon', melee: 'melee weapons', blasterPistol: 'blaster pistols', blasterRifle: 'blaster rifles', heavy: 'heavy blasters', slugPistol: 'slugthrower pistols', slugRifle: 'slugthrower rifles', scatterGun: 'scatter guns', lightsaber: 'a lightsaber', trainingSaber: 'a training saber' };

/** The skill a weapon fights with: forms for sabers, blaster for ranged, melee for melee, Agility unarmed. */
export function weaponSkillKind(w: WeaponKind): 'form' | 'blaster' | 'melee' | 'unarmed' {
  if (w === 'lightsaber' || w === 'trainingSaber') return 'form';
  if (RANGED_WEAPONS.includes(w)) return 'blaster';
  if (w === 'melee') return 'melee';
  return 'unarmed';
}

/**
 * Lightsaber blade colours (Jared, after combat pass 1, D-205; design default): a Jedi's blade is blue or green (a
 * Guardian blue, a Consular green, any other Jedi by a seeded pick), a Sith's red. Canon figures use the colour the
 * lore files give (CanonNpc.bladeColor). The narrator may use only the listed colour; a training saber lists none.
 */
export const BLADE_COLORS = { jedi: ['blue', 'green'], sith: ['red'] } as const;
const JEDI_COLOR_BY_ARCHETYPE: Readonly<Record<string, string>> = { jediGuardian: 'blue', jediConsular: 'green' };
export function bladeColorFor(path: string | null, archetype: string, key: string): string | null {
  if (path === 'sith') return BLADE_COLORS.sith[0];
  if (path !== 'jedi') return null;
  const fixed = JEDI_COLOR_BY_ARCHETYPE[archetype];
  if (fixed) return fixed;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return BLADE_COLORS.jedi[h % BLADE_COLORS.jedi.length]!;
}

export function loadoutFor(archetype: string, rank: string | null): Loadout {
  const base = LOADOUT_BY_ARCHETYPE[archetype] ?? NONE;
  if (base.weapon === 'lightsaber' && rank !== null && TRAINING_SABER_RANKS.includes(rank)) return { ...base, weapon: 'trainingSaber' };
  return base;
}
