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
};

/** Ranks that train with a training saber (Initiates, Sith acolytes). */
export const TRAINING_SABER_RANKS: readonly string[] = ['initiate', 'acolyte'];

/** Weapons that use the ranged exchange (rolls §4). */
export const RANGED_WEAPONS: readonly WeaponKind[] = ['blasterPistol', 'blasterRifle', 'heavy'];

/** The skill a weapon fights with: forms for sabers, blaster for ranged, melee for melee, Agility unarmed. */
export function weaponSkillKind(w: WeaponKind): 'form' | 'blaster' | 'melee' | 'unarmed' {
  if (w === 'lightsaber' || w === 'trainingSaber') return 'form';
  if (RANGED_WEAPONS.includes(w)) return 'blaster';
  if (w === 'melee') return 'melee';
  return 'unarmed';
}

export function loadoutFor(archetype: string, rank: string | null): Loadout {
  const base = LOADOUT_BY_ARCHETYPE[archetype] ?? NONE;
  if (base.weapon === 'lightsaber' && rank !== null && TRAINING_SABER_RANKS.includes(rank)) return { ...base, weapon: 'trainingSaber' };
  return base;
}
