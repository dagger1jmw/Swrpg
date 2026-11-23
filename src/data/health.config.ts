// Health numbers (health.md §3-9, progression-numbers §18; M5). Spec values are marked with their section;
// design defaults are logged in docs-v2/decisions.md (D-143 onward). Every value is tunable.

// ---- Vitality (health §3) ----
/** Max Vitality = base + 0.6 End + 0.3 Str + 0.2 Force body-ability level. */
export const VITALITY = { base: 20, endurance: 0.6, strength: 0.3, bodyAbility: 0.2 } as const;
/** Recovery per hour as a fraction of max: rest 50%, light activity 15%, none in combat; sleep 7h+ full. */
export const VITALITY_RECOVERY = { restPerHour: 0.5, lightPerHour: 0.15, fullSleepHours: 7 } as const;
/** Effective level x0.9 while Vitality is spent (rolls §1). */
export const SPENT_LEVEL_FACTOR = 0.9;

// ---- Damage (health §4) ----
export const WEAPON_KINDS = ['unarmed', 'melee', 'blasterPistol', 'blasterRifle', 'heavy', 'slugPistol', 'slugRifle', 'scatterGun', 'lightsaber', 'trainingSaber'] as const;
export type WeaponKind = (typeof WEAPON_KINDS)[number];
/** Weapon base damage. A training saber deals Vitality-only hits (sparring mode, D-143); its base is a lightsaber's. */
export const WEAPON_BASE: Record<WeaponKind, number> = {
  unarmed: 5,
  melee: 12,
  blasterPistol: 15,
  blasterRifle: 20,
  heavy: 30,
  // Slugthrowers (D-200; design defaults near the blasters; rules in data/weapons.ts).
  slugPistol: 13,
  slugRifle: 18,
  scatterGun: 22,
  lightsaber: 40,
  trainingSaber: 40,
};
export const HIT_MULT = { graze: 0.5, solid: 1.0, clean: 1.5, critical: 2.5 } as const;
export const ARMOR_KINDS = ['none', 'light', 'medium', 'heavy'] as const;
export type ArmorKind = (typeof ARMOR_KINDS)[number];
export const ARMOR_VALUE: Record<ArmorKind, number> = { none: 0, light: 3, medium: 6, heavy: 10 };
/** Against lightsabers, armor counts x0.25 unless lightsaber-resistant (cortosis, beskar). */
export const SABER_ARMOR_FACTOR = 0.25;
/** Fraction of D a lightsaber sends straight to wounds (Vitality bypass); a clean saber hit maims or kills (health §4). */
export const BYPASS = {
  lightsaber: { graze: 0, solid: 0.5, clean: 1.0, critical: 1.0 },
} as const;
/**
 * Every other weapon (blasters, slugthrowers, vibroblades, melee, unarmed, heavy weapons, droid weapons) and hazards
 * (D-161, Jared): the wound damage W of a hit follows the strike margin, as a multiple of the weapon's base damage
 * (interpolated; bands use the rounded margin, D-156), scaled down with D by armor. With a blaster rifle's base 20 and
 * the severity thresholds below: hits below margin 8 are Vitality-only, low margins give minor wounds, the middle
 * moderate, severe or worse only at high margins. The rest of D goes to Vitality; overflow below 0 keeps the band (D-161 option C). Tuned to about 50% minor, 35%
 * moderate, 15% severe or worse of the wounding hits these weapons land on a Force user.
 */
export const NONSABER_WOUND_BY_MARGIN: readonly (readonly [number, number])[] = [
  [7, 0],
  [8, 0.1],
  [12, 0.5],
  [17, 1.0],
  [25, 2.5],
];
/** Non-saber overflow is banded too (Jared, D-161 option C): a hit past an empty Vitality is at least this wound damage (minor). */
export const NONSABER_OVERFLOW_MIN_W = 1;
/**
 * The non-saber mortal band (Jared, D-267): a non-saber hit is mortal only from this rounded strike margin; below it
 * the wound stops at critical (W 49). Tunable (npm run mortals sets it with CANDIDATE=b<margin>).
 */
export const NONSABER_MORTAL = { minMargin: 30 };
/**
 * A hazard's severity hint read as a strike margin on the non-saber curve (D-161): hazards hurt the body directly (a
 * dislocation, a burn), so severity 1 gives a minor wound (Jared: sparring accidents are "minor wounds usually"), 2
 * moderate, 3 severe for a fall.
 */
export const HAZARD_MARGIN: Record<1 | 2 | 3, number> = { 1: 10, 2: 15, 3: 21 };
/** Force Lightning damage = this x Force Output level x effort (health §4). */
export const LIGHTNING_PER_OUTPUT = 0.4;

// ---- Wounds (health §5) ----
export const SEVERITIES = ['minor', 'moderate', 'severe', 'critical', 'mortal'] as const;
export type Severity = (typeof SEVERITIES)[number];
/** W at or above -> severity (1-9 minor, 10-19 moderate, 20-34 severe, 35-49 critical, 50+ mortal). */
export const SEVERITY_FROM_W: readonly (readonly [number, Severity])[] = [
  [50, 'mortal'],
  [35, 'critical'],
  [20, 'severe'],
  [10, 'moderate'],
  [1, 'minor'],
];
export const BODY_PARTS = ['torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'head', 'leftHand', 'rightHand'] as const;
export type BodyPart = (typeof BODY_PARTS)[number];
/** Hit location weights (health §5): torso 35, arms 25, legs 25, head 10, hands 5 (pairs split evenly). */
export const LOCATION_WEIGHTS: Record<BodyPart, number> = {
  torso: 35,
  leftArm: 12.5,
  rightArm: 12.5,
  leftLeg: 12.5,
  rightLeg: 12.5,
  head: 10,
  leftHand: 2.5,
  rightHand: 2.5,
};
/** Fall hazards favour the legs (D-143 design default). */
export const FALL_LOCATION_WEIGHTS: Record<BodyPart, number> = {
  torso: 25,
  leftArm: 10,
  rightArm: 10,
  leftLeg: 20,
  rightLeg: 20,
  head: 10,
  leftHand: 2.5,
  rightHand: 2.5,
};
/** A lightsaber wound of W >= this to a limb or hand severs it (a lasting injury) instead of critical / mortal. */
export const SEVER_AT = 35;
/** The same threshold as an object a measurement can vary (D-256 sever counts); the engine reads this one. */
export const SEVERING = {
  at: SEVER_AT,
  /**
   * The chance a qualifying limb hit severs (else it stays a critical or mortal-band wound, capped at critical). 1 is the
   * rule as it is (no die drawn); lower values were measured for D-256's proposal only, not adopted.
   */
  chance: 1,
};
export const LIMBS: readonly BodyPart[] = ['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'leftHand', 'rightHand'];

/**
 * Location penalty targets (health §5, from Docs/SW_Injury_System_v1.md:72-81): arm or hand -> lightsaber
 * forms, melee and Strength; leg -> Agility (and footwork forms); head -> Force skills and mental skills;
 * torso -> everything. `forms` covers every lightsaber form; `force` every Force skill.
 */
export type PenaltyTarget = 'forms' | 'melee' | 'strength' | 'agility' | 'force' | 'mental' | 'all';
export const PART_TARGETS: Record<BodyPart, readonly PenaltyTarget[]> = {
  torso: ['all'],
  leftArm: ['forms', 'melee', 'strength'],
  rightArm: ['forms', 'melee', 'strength'],
  leftHand: ['forms', 'melee', 'strength'],
  rightHand: ['forms', 'melee', 'strength'],
  leftLeg: ['agility'],
  rightLeg: ['agility'],
  head: ['force', 'mental'],
};
/** Location penalty per wound on its targets, by severity (D-143 design default; health §5 gives no numbers). */
export const LOCATION_PENALTY: Record<Severity, number> = { minor: 0.02, moderate: 0.05, severe: 0.1, critical: 0.15, mortal: 0.2 };
/** Mental skills for head wounds. */
export const MENTAL_SKILLS: readonly string[] = ['willpower', 'intelligence', 'charisma', 'meditation', 'forceKnowledge', 'investigation', 'tactics', 'medicine'];

// ---- Status (health §6) ----
export const WOUND_LOAD: Record<Severity, number> = { minor: 1, moderate: 3, severe: 6, critical: 10, mortal: 20 };
export const STATUS_LABELS: readonly (readonly [number, string])[] = [
  [12, 'Badly wounded'],
  [6, 'Wounded'],
  [1, 'Hurt'],
  [0, 'Healthy'],
];
export const STATUS_PENALTY_PER_LOAD = 0.0075;
export const INCAPACITATED_LOAD = 20;
/**
 * Wounds that change how, or whether, a fighter fights (Jared, D-198; lore-required for the leg).
 * severedLegOut: a fighter whose leg is severed, or who has lost a leg with no prosthetic, cannot stand or duel: out of
 * the fight (a prosthetic or cybernetic leg is exempt). weaponArm: a wound of `minSeverity` or worse to the weapon arm
 * or hand (not yet healed) forces the off hand, at `offHandPenalty` on the fighting skill (the unadapted lost-hand
 * penalty on forms, LASTING_PENALTIES.lostHand.forms); a severed weapon arm or hand puts the fighter out of the fight
 * until there is a second weapon (items, M8). Minions already leave on a moderate wound.
 */
// weaponArmLost (Jared, D-244; lore): a severed weapon arm or hand ends the duel unless the fighter has an off-hand weapon,
// which they then use at offHandPenalty. weaponArm (the severe-wound hand switch of D-198) stays off.
export const WOUND_FIGHTING = { severedLegOut: true, weaponArmLost: true, weaponArm: false, minSeverity: 'severe' as Severity, offHandPenalty: 0.4 };

/** Total wound penalty (status + location) cap while still able to fight. */
export const WOUND_PENALTY_CAP = 0.5;
/** Dying timer = base + Endurance / perEndurance minutes. */
export const DYING_TIMER = { baseMinutes: 10, perEndurance: 10 } as const;

// ---- Healing (health §7; multipliers amended by D-143, Jared) ----
/** Base days at rest by severity; minor heals overnight on 7h+ sleep. A stabilized mortal is a critical that heals in 90. */
export const HEAL_DAYS: Record<Exclude<Severity, 'minor'>, number> & { stabilizedMortal: number } = {
  moderate: 7,
  severe: 21,
  critical: 45,
  mortal: 90,
  stabilizedMortal: 90,
};
/**
 * Rate multipliers (D-143): medical care x2 while under care; a bacta tank x4 for its hours and REPLACES
 * medical care (no stacking); a Force healer multiplies on top: x(1 + healer level / 50). Training the
 * injured part x0.5. The combined multiplier is capped at x6.
 */
export const HEAL_MULT = { medical: 2, bacta: 4, forceHealerPerLevel: 1 / 50, trainingInjured: 0.5, cap: 6 } as const;
/** Bacta: minor in 6 hours, moderate in 1 day (health §7) follow from x4 on the base times. */
export const LASTING_CHANCE: Partial<Record<Severity, number>> & { stabilizedMortal: number } = { severe: 0.1, critical: 0.35, mortal: 0.7, stabilizedMortal: 0.7 };
/** Training the injured part risks making it worse (health §7): chance per day of training it (D-143 design default). */
export const TRAIN_INJURED_WORSEN_CHANCE = 0.02;

// ---- Stabilizing (D-143) ----
/** Medicine check difficulty to stabilize a mortal wound; Force Heal (Self) and NPC healers roll the same check. */
export const STABILIZE_DIFFICULTY = 'moderate' as const;

// ---- Pain suppression (health §8) ----
/** Passive Willpower resistance: Willpower / 400 of wound penalties, max 25% (Q40). */
export const WILLPOWER_SUPPRESSION = { perWillpower: 1 / 400, max: 0.25 } as const;
/** Suppression crash (Q41): +0.5 mental load when Battlemind or Force Valor ends while wounded. */
export const SUPPRESSION_CRASH_MENTAL = 0.5;

// ---- Force meter (health §2) ----
export const FORCE_METER = {
  /** Above 1.0: +0.5 mental load per extra Force load point. */
  backlashMentalPerPoint: 0.5,
  collapseChance: 0.05,
  collapseHours: { min: 1, max: 3 },
  /** Channeling anger lets the meter go to 1.3 without backlash. */
  angerLimit: 1.3,
} as const;
/** Effort multipliers on Force load (health §2). */
export const FORCE_EFFORT = { light: 0.5, standard: 1.0, heavy: 2.0, allOut: 3.5 } as const;
export type ForceEffort = keyof typeof FORCE_EFFORT;
/** Base Force load per use for combat abilities (health §2; every catalog ability declares one in M6). */
export const FORCE_BASE_LOAD: Readonly<Record<string, number>> = {
  telekinesis: 0.15,
  forcePush: 0.15,
  forceChoke: 0.2,
  forceLightning: 0.3,
  forceBarrier: 0.2,
  forceAbsorb: 0.2,
  forceSpeed: 0.15,
  forceJump: 0.1,
  battleMeditation: 0.5,
};

// ---- Lasting injuries (progression-numbers §18) ----
export const AIDS = ['none', 'scarTissue', 'basicProsthetic', 'qualityCybernetic', 'offHand'] as const;
export type Aid = (typeof AIDS)[number];
/** Maximum adaptation by aid. */
export const AID_CAP: Record<Aid, number> = { none: 0.7, scarTissue: 0.7, basicProsthetic: 0.8, qualityCybernetic: 1.0, offHand: 0.9 };
/** Adaptation per effective hour of training the affected skills, at most `perDayMax` a day. */
export const ADAPTATION = { perHour: 0.01, perDayMax: 0.03 } as const;
/**
 * Lightsaber form hours toward a lost leg (Jared, D-230): forms are footwork, so a form's practice hours count at this
 * share beside Agility and Endurance (full rate). Target: a quality cybernetic leg fully adapted in about 45-60 days on
 * the default routine (a leg is harder than a hand); 0.5 gave 41 days, 0.3 gives 51 (measured, D-230). A lost hand or
 * arm already counts every form hour in full, since its penalty is on the forms themselves.
 */
export const LEG_FORM_SHARE = 0.3;
/**
 * Other practice hours toward a lost arm or hand (Jared, 2026-11-20; M5 balance table row 6): while the severed limb
 * heals, the routine trains no forms (the injured skill), so only strength reached it (3% at day 30, 7% at day 60). A
 * fitted arm or hand is used in every drill, so every other practice hour counts at this share; its forms and strength
 * count in full as before. Target: the hand's 30-40 day reference for a quality cybernetic on the default routine
 * (tuned, the share only, as in D-230). Measured (Knight at 30): 21% at day 10, 48% at 20, 72% at 30, 98% at 40, 100% on
 * day 41; 1.15 gives the same (99% at 40), since the 3%-a-day cap and the rest days bind, so 1 it is.
 */
export const ARM_OTHER_SHARE = 1;
/**
 * A lost or prosthetic leg slows form strikes (Jared, D-251, design default): forms P = this x the leg's Agility P, so the
 * effective form penalty is 0.5 x 0.35 x (1 - adaptation). The adaptation that cures it is still D-230's (form hours at
 * LEG_FORM_SHARE beside Agility and Endurance in full).
 */
export const LEG_FORM_PENALTY_SHARE = 0.5;
/** The lost leg's base penalties (progression-numbers §18). */
const LEG_AGILITY_P = 0.35;
/**
 * Lasting kinds whose Endurance penalty cuts the fatigue meters' capacity, x (1 - A), in and out of fights: the leg
 * (Jared, D-252) and burns or lung damage (Jared, D-254). Every lasting kind with an Endurance penalty is on it.
 */
export const CAPACITY_ENDURANCE_KINDS: readonly string[] = ['lostLeg', 'burnsOrLungs'];
export const LASTING_KINDS = ['lostHand', 'lostArm', 'lostLeg', 'jointDamage', 'burnsOrLungs', 'headTrauma'] as const;
export type LastingKind = (typeof LASTING_KINDS)[number];
/** Base penalties P by kind on skill groups (progression-numbers §18; head trauma is a D-143 design default). */
export const LASTING_PENALTIES: Record<LastingKind, Readonly<Partial<Record<PenaltyTarget | 'endurance' | 'forceOutput', number>>>> = {
  lostHand: { forms: 0.4, strength: 0.2 },
  lostArm: { forms: 0.4, strength: 0.3 },
  lostLeg: { agility: LEG_AGILITY_P, endurance: 0.15, forms: LEG_FORM_PENALTY_SHARE * LEG_AGILITY_P },
  jointDamage: { agility: 0.15 },
  burnsOrLungs: { endurance: 0.4, forceOutput: 0.1 },
  headTrauma: { mental: 0.1, force: 0.1 },
};
/** Lasting kind from a healed wound's part (a severed limb is always lostHand / lostArm / lostLeg). */
export const LASTING_FROM_PART: Record<BodyPart, LastingKind> = {
  torso: 'burnsOrLungs',
  head: 'headTrauma',
  leftArm: 'jointDamage',
  rightArm: 'jointDamage',
  leftLeg: 'jointDamage',
  rightLeg: 'jointDamage',
  leftHand: 'jointDamage',
  rightHand: 'jointDamage',
};

// ---- Hazards (D-143 design default; hazardOccurred, intent.risk, sparring accidents, thrown objects) ----
export const HAZARD_TYPES = ['fall', 'fire', 'explosion', 'crash', 'poison', 'exposure', 'impact'] as const;
export type HazardType = (typeof HAZARD_TYPES)[number];
/** D = base x severity multiplier. */
export const HAZARD_BASE: Record<HazardType, number> = { fall: 14, fire: 12, explosion: 25, crash: 22, poison: 10, exposure: 8, impact: 12 };
export const HAZARD_SEVERITY_MULT: Record<1 | 2 | 3, number> = { 1: 0.5, 2: 1, 3: 2 };

// ---- Physical exhaustion in a fight (D-208) ----
/**
 * A fighter whose physical meter passes hardLimit x capacity collapses from exhaustion: out of the fight, no wound
 * (the physical twin of the Force meter's collapse, health §2). progression-numbers §3 sets no physical hard limit, so
 * the value is a design default (overnight decision, Jared to confirm). 4.0, not the first choice of 2.0: Anakin's war
 * days chain fights with the meter carried over, and 2.0 dropped his Clone Wars combat share to 24.5% (gate 25-35%),
 * 3.0 put his 81 milestone 0.01 y past its limit; at 4.0 every lifetime gate gives D-207's numbers exactly, and the
 * pass-2 case (26.4 / 5.1 = 5.2x) still collapses. The 200-exchange safety cap (FIGHT_SAFETY_CAP) bounds one fight.
 */
export const PHYSICAL_COLLAPSE = { hardLimit: 4.0 } as const;
/**
 * The fight level factor past 1.0 x physical capacity (Jared, D-234): below 1.0 it is 1 - 0.25 x (1 - e(f)) (rolls §1),
 * 0.825 at 1.0; past 1.0 it keeps falling in a straight line to `atHardLimit` at PHYSICAL_COLLAPSE.hardLimit, where the
 * fighter collapses (was a step to 0.775 and flat to the limit). 0.68 at 2x, 0.54 at 3x.
 */
export const FATIGUE_PAST_CAPACITY = { atHardLimit: 0.4 } as const;

// ---- Minions (health §9) ----
/**
 * A wound of this severity or worse takes a minion out of the fight; so does being Spent (Vitality 0; D-157, Jared:
 * minion groups from combatStarted only, named NPCs and the player keep the normal rule). How a folded minion goes
 * down (knocked out, disarmed, flees, killed) is the narration's; whether it counts as dead follows the stakes.
 */
export const MINION_FOLDS_WHEN_SPENT = true;
/** A wound of this severity or worse takes a minion out of the fight. */
export const MINION_OUT_AT: Severity = 'moderate';

/**
 * The healing fluid by date (D-440; SW_Kolto_Bacta). The engine's tank care kind is `bacta` (an immersion tank, x4);
 * which fluid fills it is a dated fact: kolto (Manaan only) is the standard until its decline, which the sources leave
 * undated; bacta (Thyferra) is known galaxy-wide from c. 4100 BBY, a rarer import before the switch-over and the
 * standard after it, with kolto then a cheaper, less trusted alternative. Calendar years (negative = BBY).
 */
export const BACTA_KNOWN_FROM_YEAR = -4100;
/**
 * PENDING Jared's ruling: the year bacta becomes the standard. Placeholder: 2000 BBY, the lore file's best fit (the New
 * Sith Wars [inferred]; SW_Kolto_Bacta decision 1). Supported range 3600-1000 BBY: kolto stays standard through the
 * KOTOR and SWTOR years, and is the cheap option by Bane's era.
 */
export const BACTA_STANDARD_FROM_YEAR = -2000;
export const BACTA_SWITCH_PENDING = true;

export interface HealingFluid {
  /** The fluid in tanks and medpacs at this date. */
  standard: 'kolto' | 'bacta';
  bacta: 'unknown' | 'rare import' | 'standard';
  kolto: 'standard' | 'cheaper alternative';
}

export function healingFluidAt(year: number): HealingFluid {
  if (year >= BACTA_STANDARD_FROM_YEAR) return { standard: 'bacta', bacta: 'standard', kolto: 'cheaper alternative' };
  return { standard: 'kolto', bacta: year >= BACTA_KNOWN_FROM_YEAR ? 'rare import' : 'unknown', kolto: 'standard' };
}

/** Dated kolto supply events for the economy work (D-440; not read by any rule yet). Calendar years. */
export const KOLTO_SUPPLY_EVENTS: readonly { year: number; event: string; effect: 'scarcity'; source: string }[] = [
  { year: -3625, event: 'the Sith Empire invades Manaan to seize its kolto', effect: 'scarcity', source: 'SW_Timeline_3700_3600BBY_Part2 (3,625); SW_Kolto_Bacta decision 2' },
];
