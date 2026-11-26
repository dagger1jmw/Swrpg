// Droid rules' numbers (M8 checklist item 7; docs-v2/spec/droids.md). Every number here is `invented` unless its comment
// names a source (Docs/SWRPG lore/SW_Droids_Classes.md, SW_Economy_Prices_Ships_Weapons_Droids.md, SW_Economy_GamePriceLists).
// The spec's section 11 lists them all.

/** The five droid classes (degrees; SW_Droids_Classes, "Droid classes"). */
export const DROID_CLASSES = [1, 2, 3, 4, 5] as const;
export type DroidClass = (typeof DROID_CLASSES)[number];

/**
 * Droid skills. Droids have their own list: their programming, not the organic skill tree. `gameSkill` names the organic skill
 * a droid's rating stands in for when a roll needs one (repair waits for checklist item 12's Repair skill).
 */
export const DROID_SKILLS = ['medicine', 'science', 'repair', 'astrogation', 'slicing', 'languages', 'social', 'blaster', 'melee', 'security', 'labour', 'piloting'] as const;
export type DroidSkill = (typeof DROID_SKILLS)[number];
export const DROID_SKILL_GAME: Readonly<Record<DroidSkill, string | null>> = {
  medicine: 'medicine',
  science: 'intelligence',
  repair: null,
  astrogation: 'piloting',
  slicing: 'investigation',
  languages: 'charisma',
  social: 'charisma',
  blaster: 'blaster',
  melee: 'melee',
  security: 'investigation',
  labour: 'strength',
  piloting: 'piloting',
};

/**
 * The skills each class is programmed for (the lore's five classes; the design notes' list), with a factory rating
 * (invented: a factory specialist at Adept, 41-60; a protocol droid's languages at Master for its "huge database").
 */
export const CLASS_SKILLS: Readonly<Record<DroidClass, Readonly<Partial<Record<DroidSkill, number>>>>> = {
  1: { medicine: 50, science: 45 },
  2: { repair: 45, astrogation: 40, slicing: 30 },
  3: { languages: 70, social: 35 },
  4: { blaster: 35, melee: 30, security: 40 },
  5: { labour: 40 },
};

/** The most a skill reaches by modules and learning: one the class is programmed for, and any other (invented). */
export const SKILL_CAP = { inClass: 90, offClass: 50 } as const;

// ---------------------------------------------------------------- upgrades (spec §3)

/**
 * Modules: a basic module (+5) is a droid customization kit, 400 cr (SW_Economy_GamePriceLists Part 7, game stat, WEG 1995);
 * an advanced module (+10) and reprogramming (a new skill at 20) are invented. Advanced modules and reprogramming are big
 * jobs: they need a shop. The roll is the Repair stand-in against the DC; at a shop the better of the character's and the
 * shop technician's level rolls, and the shop's labour is a share of the parts.
 */
export const MODULES = {
  basic: { gain: 5, price: 400, dc: 30, big: false },
  advanced: { gain: 10, price: 2000, dc: 50, big: true },
} as const;
export type ModuleTier = keyof typeof MODULES;
export const REPROGRAM = { start: 20, price: 1000, dc: 45, big: true } as const;
/** A failed job wastes this share of the parts (invented). */
export const FAILED_PARTS_LOST = 0.5;
/** A shop's technician (invented: an Adept) and its labour as a share of the parts (invented). */
export const SHOP = { technician: 45, labour: 0.5 } as const;
/**
 * The skill that rolls droid jobs (m8-skills, D-513): Repair, which replaced the Intelligence stand-in of D-512. The
 * character's own jobs (not at a shop) need a tool kit (TOOL_KIT); the parts are the job's price, as before.
 */
export const REPAIR_SKILL = 'repair';
/**
 * A tool kit (m8-skills, D-513): a droid or vehicle tool kit, 200 cr (SW_Economy_GamePriceLists Part 7 and 9, game stat,
 * WEG 1987; a ship's engineering kit 350 cr, Part 6). Needed for any job the character does outside a shop; a reboot after
 * an ion overload is a quick fix and needs nothing.
 */
export const TOOL_KIT = { price: 200 } as const;
/** The hours of the character's own upgrade work, for Repair XP (invented). */
export const UPGRADE_HOURS = { basic: 2, advanced: 6, reprogram: 6 } as const;

/** What a droid learns while its memory is not wiped (invented): up to +10 on its programmed skills, 63% of it in 6 years. */
export const LEARNING = { most: 10, years: 6 } as const;

// ---------------------------------------------------------------- memory and personality (spec §4)

/**
 * Personality growth with years since the last wipe (invented): p = 1 - e^(-years x drift / tau). A factory droid starts at 0
 * (basic); a model's drift speeds or slows it (the T3s and G0-T0s grew fast in the lore; labour droids are simple).
 */
export const PERSONALITY = { tauYears: 5 } as const;
/** The stages and where they start on p (invented): quirks at about 1 year unwiped, a full personality at about 9.5. */
export const PERSONALITY_STAGES = [
  { stage: 'basic', from: 0 },
  { stage: 'quirks', from: 0.2 },
  { stage: 'opinions', from: 0.45 },
  { stage: 'independent', from: 0.7 },
  { stage: 'full', from: 0.85 },
] as const;
export type PersonalityStage = (typeof PERSONALITY_STAGES)[number]['stage'];
/** Quirks a droid may develop (narrator colour, invented); one more for each stage past basic, chosen by the droid's seed. */
export const QUIRKS: readonly string[] = [
  'hums or whistles to itself while it works',
  'keeps a running count of its owner\'s mistakes',
  'is fastidious about its own plating',
  'distrusts a particular species or model of droid',
  'offers unrequested odds on everything',
  'has a favourite starship and talks about it',
  'mimics a voice it once recorded',
  'hoards spare parts',
  'is grimly sarcastic',
  'calls organics by nicknames of its own choosing',
  'refuses to enter water',
  'sulks when ignored',
  'is boastful about its manufacturer',
  'gets attached to one crew member',
  'asks philosophical questions at bad moments',
  'keeps old memories it will not explain',
];
/**
 * A droid with a past (second-hand, salvage, a gift, found or stolen): years since its last wipe, drawn from this range
 * (invented). A droid with a past can already be a full personality.
 */
export const PAST_YEARS = { secondHand: [0, 6], salvage: [2, 20], gift: [0, 10], found: [3, 25], stolen: [0, 8] } as const;
export type DroidHow = 'bought' | keyof typeof PAST_YEARS;
/** A second-hand droid's price as a share of new (lore: SE4 2,600 / 1,300 cr; Siak 3,500 / 1,200; HMP 60,000 / 30,000). */
export const USED_SHARE = 0.5;
/** A memory wipe: a flush unit at a shop, 500 cr (SW_Economy_Prices_Ships_Weapons_Droids: Void's wipe, 500 cr, c. 25 ABY). */
export const WIPE_PRICE = 500;
/** Regard (how the droid feels about its owner, from -5 to +5) moved by treatment (invented). */
export const REGARD = { repaired: 1, upgraded: 1, boltOn: -1, forcedByBolt: -1, min: -5, max: 5 } as const;

// ---------------------------------------------------------------- restraining bolts (spec §4)

/**
 * A bolt forces obedience to the caller (lore). A droid built or modified to resist (lore: security droids, a few custom
 * units) may break it; so may a droid with independent judgement (invented). The chance a roll breaks it (invented).
 */
export const BOLT_BREAK = { resistant: 0.35, independent: 0.1, full: 0.2 } as const;
/** A droid with independent judgement and no bolt refuses an order it opposes when its regard is at or below this (invented). */
export const REFUSES_AT_REGARD = 0;

// ---------------------------------------------------------------- damage (spec §5)

export const DROID_LOCATIONS = ['limbs', 'sensors', 'motivator', 'processor', 'weapons'] as const;
export type DroidLocation = (typeof DROID_LOCATIONS)[number];
export const SYSTEM_STATES = ['working', 'damaged', 'disabled', 'destroyed'] as const;
export type SystemState = (typeof SYSTEM_STATES)[number];
/** Where a hit lands (invented weights); a droid with no weapons spreads that share over the rest. */
export const LOCATION_WEIGHT: Readonly<Record<DroidLocation, number>> = { limbs: 35, sensors: 15, motivator: 20, processor: 10, weapons: 20 };
/**
 * Steps of damage a hit does by its power against the droid's toughness (invented): power is the weapon's base damage (the
 * combat table's WEAPON_BASE) times the hit's quality; toughness by chassis. Under `graze` x toughness nothing; then one,
 * two or three steps.
 */
export const DAMAGE_STEPS = { graze: 0.3, one: 1.0, two: 2.5 } as const;
export const TOUGHNESS: Readonly<Record<'light' | 'medium' | 'heavy' | 'war', number>> = { light: 10, medium: 16, heavy: 24, war: 34 };
/** The droid is out when its motivator or processor is disabled, or three locations are destroyed (invented). */
export const DESTROYED_LOCATIONS = 3;
/** What a system state leaves of a skill it serves (invented; ships use the same idea, combat-scales.md). */
export const STATE_FACTOR: Readonly<Record<SystemState, number>> = { working: 1, damaged: 0.7, disabled: 0, destroyed: 0 };
/** Which location serves each skill (invented): processor for the mind, limbs for the hands, sensors for scanning. */
export const SKILL_LOCATION: Readonly<Record<DroidSkill, DroidLocation>> = {
  medicine: 'limbs',
  science: 'processor',
  repair: 'limbs',
  astrogation: 'processor',
  slicing: 'processor',
  languages: 'processor',
  social: 'processor',
  blaster: 'weapons',
  melee: 'limbs',
  security: 'sensors',
  labour: 'limbs',
  piloting: 'processor',
};

/**
 * Ion weapons and Ionize disable rather than wound (lore: makers turned to ion weapons after the Great Droid Revolution;
 * Ionize overloads and damages electronics). Minutes disabled: 4 for each multiple of the droid's toughness in the ion
 * power, at least 1, at most 30 (invented). An Ionize margin of 20 or more also damages the processor a step (invented).
 */
export const ION = { minutesPerPower: 4, minMinutes: 1, maxMinutes: 30, ionizeDamageMargin: 20 } as const;
/** Ion power by source (invented): an ion pistol, an ion rifle, an ion grenade; Ionize is the caster's Force Output. */
export const ION_POWER: Readonly<Record<'ionPistol' | 'ionRifle' | 'ionGrenade', number>> = { ionPistol: 30, ionRifle: 45, ionGrenade: 40 };

/**
 * Personal shields (lore: the Mark I assault droid's bubble "briefly absorbs blaster bolts and lightsaber strikes"): hits it
 * stops before it drops, and the minutes it takes to come back (invented). Ion drains it at once (invented).
 */
export const DROID_SHIELD = { stops: 3, rechargeMinutes: 1 } as const;

// ---------------------------------------------------------------- repair (spec §5)

/**
 * Repairing a location by its state: parts as a share of the model's price (the ship repair shares, shipPrices REPAIR_SHARE,
 * scaled for a droid: invented), the check's difficulty rating for the Repair stand-in (`dc`, on the game's rating scale, as
 * MODULES), and whether it is a big job (a shop).
 */
export const DROID_REPAIR: Readonly<Record<Exclude<SystemState, 'working'>, { share: number; dc: number; big: boolean }>> = {
  damaged: { share: 0.05, dc: 30, big: false },
  disabled: { share: 0.15, dc: 45, big: true },
  destroyed: { share: 0.3, dc: 55, big: true },
};
/** A model with no price (not for sale) is repaired as if it cost this (invented). */
export const UNPRICED_VALUE = 20000;
/** The hours a repair takes per step (invented). */
export const REPAIR_HOURS = { damaged: 1, disabled: 4, destroyed: 8 } as const;

// ---------------------------------------------------------------- ownership (spec §7)

/** Reclaiming an impounded droid: a share of its price (invented). */
export const IMPOUND_FEE_SHARE = 0.2;
/** The astromech's co-pilot bonus (invented): +1 for every 20 points of its piloting-side skill, at most +4. */
export const COPILOT = { per: 20, most: 4 } as const;
