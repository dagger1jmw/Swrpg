// What resists the Force (Jared, D-192; Legends). Almost nothing does. Every Force ability falls in one resolution
// group; only the mind group is a Willpower contest, only the avoidable group can be dodged (and only by a target that
// can react), and only Force users resist the Force itself. Everything else is a difficulty from mass, size and
// distance. The engine reads this file through src/engine/combatForce.ts; every number is tunable.
import type { ObjectSize } from './terrain';

/**
 * Resolution groups (D-192):
 * - mind: mind-affecting abilities (mind trick, mind reading, fear, persuasion, memory). Willpower contest; a Force user
 *   adds a share of their Force resistance; species with a lore immunity (and droids) cannot be affected.
 * - avoidable: a physical manifestation the target can avoid (a telekinetic burst such as Push, lightning, a thrown
 *   object, a thrown saber). Difficulty first; then a target that can react (not surprised) may dodge (Agility).
 *   Cover blocks lightning and thrown objects. A Force user counters with Force resistance; a lightsaber deflects or
 *   absorbs lightning.
 * - grip: a telekinetic hold on a body (choke, grip). Difficulty only, unless the target is a Force user (Force
 *   resistance contest).
 * - object: telekinesis on an object or a body as an object (lift, move). Difficulty only; nobody resists.
 * - unopposed: on the user or an ally (speed, jump, barrier, absorb, healing, battle meditation, revitalize).
 */
export const FORCE_GROUPS = ['mind', 'avoidable', 'grip', 'object', 'unopposed'] as const;
export type ForceGroup = (typeof FORCE_GROUPS)[number];

/** Every Force ability in src/data/skills.ts, by group (the combat kinds map onto these in combatForce.ts). */
export const ABILITY_FORCE_GROUP: Readonly<Record<string, ForceGroup>> = {
  mindTrick: 'mind',
  forcePush: 'avoidable',
  forceLightning: 'avoidable',
  /** Telekinesis throwing an object at someone is avoidable; lifting a body or an object is the object group. */
  telekinesis: 'avoidable',
  forceChoke: 'grip',
  forceBarrier: 'unopposed',
  forceSpeed: 'unopposed',
  forceJump: 'unopposed',
  forceAbsorb: 'unopposed',
  battleMeditation: 'unopposed',
  forceHealSelf: 'unopposed',
  forceHealOthers: 'unopposed',
  revitalize: 'unopposed',
};

/** Traits that change Force resolution. */
export type ForceTrait = 'droid' | 'mindImmune' | 'forceInvisible';

/**
 * Species traits (lore). Force abilities lore, Mind Trick: "does not work on ... beings without conventional minds
 * (droids, Hutts, Toydarians)". Characters_15 era mechanic: the Yuuzhan Vong cannot be sensed, read, mind-tricked or
 * (reliably) touched by telekinesis; objects hurled around them still work (Luke). Entity species ids (camelCase).
 */
export const SPECIES_FORCE_TRAITS: Readonly<Record<string, readonly ForceTrait[]>> = {
  droid: ['droid', 'mindImmune'],
  hutt: ['mindImmune'],
  toydarian: ['mindImmune'],
  yuuzhanVong: ['forceInvisible', 'mindImmune'],
};

/**
 * Force-negating creatures. Ysalamiri: a bubble where the Force cannot be used (Characters_14: Thrawn "used ysalamiri to
 * nullify the Force around him"); a terrain tag in a fight. Taozin: Legends creatures invisible to the Force like the
 * Vong, but NOT in Docs/SWRPG lore (kept as a design default until a lore file covers them; D-192). Voxyn hunt Jedi
 * through the Force (Timeline ~27 ABY): they do not negate it, so they are not here.
 */
export const FORCE_NEGATING_CREATURES: Readonly<Record<string, { effect: 'bubble' | 'forceInvisible'; source: string }>> = {
  ysalamiri: { effect: 'bubble', source: 'SW_Characters_14 (Thrawn)' },
  taozin: { effect: 'forceInvisible', source: 'not in the lore files (design default, D-192)' },
};

/** Minion kinds that are droids (immune to the mind group, no Force resistance). */
export const DROID_MINION_KINDS: readonly string[] = ['battleDroid', 'superBattleDroid', 'droideka'];

/**
 * Difficulty ratings (DC = 10 + rating / 10) for moving a mass by telekinesis: a body as a target (Push, grip) by build,
 * an object by size. Design defaults: a Knight (telekinesis ~45) moves a person about 3 times in 4.
 */
export const BODY_SIZES = ['humanoid', 'heavy'] as const;
export type BodySize = (typeof BODY_SIZES)[number];
export const BODY_DIFFICULTY: Readonly<Record<BodySize, number>> = { humanoid: 10, heavy: 30 };
export const OBJECT_DIFFICULTY: Readonly<Record<ObjectSize, number>> = { small: 10, medium: 20, large: 50 };
/** Minion kinds with a heavy build (harder to move). */
export const HEAVY_MINION_KINDS: readonly string[] = ['superBattleDroid', 'droideka', 'beast'];
/** Lightning has no mass to move: its difficulty is generating it (rating). */
export const LIGHTNING_DIFFICULTY = 10;

/**
 * Dodging (avoidable group, only a target that can react): d20 + Agility / 10 + this modifier vs the user's total.
 * A Push is a wide burst, lightning arcs faster than a body moves, a thrown object can be seen and stepped from.
 */
export const DODGE_MOD: Readonly<Record<string, number>> = { forcePush: -5, forceLightning: -6, telekinesis: 0, saberThrow: 0 };

/** A Force user's resistance (grip, Push, lightning without a saber): the best of these levels. */
export const FORCE_RESISTANCE_SKILLS: readonly string[] = ['forceControl', 'forceBarrier', 'forceAbsorb'];
/** Mind group: a Force user adds this share of their Force resistance level to the Willpower roll. */
export const MIND_FORCE_RESIST_SHARE = 0.5;
/** A fighter counts as a Force user at this Force Control or Force Sense level or more. */
export const FORCE_USER_MIN_LEVEL = 5;

/** Mind trick in a fight (D-192): a minion stands down (out of the fight); a named opponent gives an opening. */
export const MIND_TRICK_COMBAT = { minionOut: true, openingAdvantage: 2, baseLoad: 0.15 } as const;

/**
 * Saber throw (Jared, D-193; lore: Saber Throw, a Telekinesis application, prerequisites Telekinesis 15 and a form 10).
 * Control: telekinesis vs the control difficulty (difficulty only). Then, against minions, one saber strike on each
 * engaged minion in the arc, up to `maxTargets`, each its own roll (d20 + form level / 10 vs d20 + the minion's level /
 * 10) and cut down at `hitMargin`. Against a duelist, one strike they can deflect; a Force user may interrupt it with
 * their own Force (telekinesis or Force Control vs the control total). A failed control roll (or an interrupt) drops the
 * saber nearby: the thrower fights unarmed until a recall (a Force action, telekinesis vs `recallDifficulty`).
 */
export const SABER_THROW = {
  maxTargets: 3,
  /** Rating 15 = DC 11.5 (D-193, Jared): the average Knight at 50 (Telekinesis 46) controls the throw about 70% of the time. */
  controlDifficulty: 15,
  hitMargin: 6,
  minTelekinesis: 15,
  minForm: 10,
  baseLoad: 0.2,
  recallDifficulty: 10,
  recallLoad: 0.1,
  interruptDropsSaber: true,
} as const;
