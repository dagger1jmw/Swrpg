// Medicine (M8 checklist item 6; docs-v2/spec/medicine.md; D-511). Every number here that the lore does not give is tagged
// `invented` in its comment and listed in the spec's section 12. Base healing times and the medical-facility multiplier
// stay health §7's (health.config HEAL_DAYS, HEAL_MULT); this file adds the care levels around them.
import type { Severity } from './health.config';

// ---------------------------------------------------------------- care levels (spec §2)

/**
 * The levels of care, worst to best (Jared): none; field care (a medpac, or a medic with supplies); a medical facility
 * (medcenter, ship's medbay, the Temple's Halls of Healing); a kolto tank; a bacta tank. Force healing stacks on any of them.
 */
export const CARE_LEVELS = ['none', 'field', 'facility', 'kolto', 'bacta'] as const;
export type CareLevel = (typeof CARE_LEVELS)[number];

/**
 * Healing-rate multipliers on health §7's base times. Field care does not speed healing (it stabilizes, dresses and stops
 * bleeding). Facility x2 and kolto x4 are health §7's (D-143); bacta x5 is Jared's design default (bacta is the more effective).
 */
export const CARE_MULT: Readonly<Record<CareLevel, number>> = { none: 1, field: 1, facility: 2, kolto: 4, bacta: 5 };

/**
 * Treatment quality the care level adds to the operator's Medicine for the treatment roll (spec §5; invented): bacta, then
 * kolto, then a facility, then field care, then nothing.
 */
export const CARE_BONUS: Readonly<Record<CareLevel, number>> = { none: 0, field: 5, facility: 20, kolto: 35, bacta: 45 };

/** Where care is given (the intent's `at`): who treats there by default, and who is treated free (spec §9). */
export const CARE_PLACES = ['field', 'medcenter', 'temple', 'military', 'ship'] as const;
export type CarePlace = (typeof CARE_PLACES)[number];

/**
 * The operator's Medicine when no healer is named (invented): a medic or the character in the field, the staff of a
 * medcenter, a military medbay or a ship's medbay, the Temple's healers.
 */
export const DEFAULT_OPERATOR: Readonly<Record<CarePlace, number>> = { field: 25, medcenter: 45, temple: 60, military: 45, ship: 35 };

// ---------------------------------------------------------------- the treatment roll (spec §5)

/**
 * How a severe or worse wound heals (Jared): treatment quality q = the operator's Medicine + CARE_BONUS of the best care the
 * wound had, against the wound's difficulty; success g = 1 / (1 + e^-((q - difficulty) / spread)). Then (one roll):
 *   lasting injury     = the untreated baseline (health §7: 10 / 35 / 70%) x (1 - g)
 *   minor lasting      = MINOR_BASE x (1 - g)
 *   scar               = what is left x (1 - g^2)
 *   clean              = the rest.
 * Every number invented: a skilled operator (Medicine 50) with a bacta tank gives clean or scar on a critical wound about 98%
 * of the time; an untreated wound keeps the baseline (no roll here).
 */
export const TREATMENT = {
  difficulty: { severe: 30, critical: 50, mortal: 70 } as Readonly<Partial<Record<Severity, number>>>,
  spread: 12,
  minorBase: { severe: 0.25, critical: 0.35, mortal: 0.3 } as Readonly<Partial<Record<Severity, number>>>,
  /** A minor lasting injury keeps this share of the kind's base penalties (small, and adapted to like any other). */
  minorPenaltyShare: 0.3,
} as const;

/** What an untreated wound that leaves no lasting injury leaves (invented): a severe or worse wound scars. */
export const UNTREATED_SCARS_FROM: Severity = 'severe';

// ---------------------------------------------------------------- untreated wounds (spec §3)

/** What made a wound, for the untreated risks: blades, claws, slugs and shrapnel tear; blasters and lightsabers burn. */
export const WOUND_CAUSES = ['blade', 'claw', 'slug', 'shrapnel', 'blaster', 'saber', 'blunt', 'burn', 'toxin'] as const;
export type WoundCause = (typeof WOUND_CAUSES)[number];
/** Causes that tear the flesh (full risk). */
export const TEARING_CAUSES: readonly WoundCause[] = ['blade', 'claw', 'slug', 'shrapnel'];
/** Causes whose heat cauterizes the wound on most species (the risk x `cauterizedRisk`). */
export const CAUTERIZING_CAUSES: readonly WoundCause[] = ['blaster', 'saber'];

/**
 * Untreated risks, rolled once a day for each untreated wound (invented). Infection: a moderate or worse tearing wound left
 * untreated past `infectionAfterDays`, at `infectionPerDay`; an infected wound heals at `infectedMult`. Bleeding: a severe or
 * worse one also drains `bleedVitality` of max Vitality a day and worsens one band at `worsenPerDay`. Cauterized wounds
 * (blaster, lightsaber) take these chances x `cauterizedRisk`. Field care or better removes every risk and clears infection.
 */
export const UNTREATED = {
  infectionAfterDays: 1,
  infectionPerDay: 0.15,
  infectedMult: 0.5,
  bleedFrom: 'severe' as Severity,
  bleedVitality: 0.25,
  worsenPerDay: 0.1,
  cauterizedRisk: 0.15,
} as const;

/**
 * Species whose wounds a blaster or lightsaber does not cauterize (the species note, spec §3). Empty until the species files
 * say so: no Legends source in the lore files names one. The rule reads the list; tests pass a species in directly.
 */
export const NO_CAUTERIZE_SPECIES: readonly string[] = [];

// ---------------------------------------------------------------- wound depth (spec §4)

/**
 * How deep a cut goes (the design notes' "Realistic damage"). It sets how the wound heals, never a surgery: a partial cut
 * heals as severe, a severed muscle as critical (the muscle does not work until healed), a cut to the bone as critical and
 * it must be set (field care or a facility) before it heals. Combat assigns depth once realistic damage is built.
 */
export const WOUND_DEPTHS = ['graze', 'partial', 'muscle', 'bone'] as const;
export type WoundDepth = (typeof WOUND_DEPTHS)[number];
export const DEPTH_HEALS_AS: Readonly<Record<WoundDepth, Severity | null>> = { graze: null, partial: 'severe', muscle: 'critical', bone: 'critical' };

// ---------------------------------------------------------------- surgery (spec §6)

export const SURGERY_PROCEDURES = ['prosthetic', 'internal', 'extract'] as const;
export type SurgeryProcedure = (typeof SURGERY_PROCEDURES)[number];

/**
 * Surgery (Jared: a roll), invented: it needs a facility (not the field) and an operator with Medicine `minOperator`+. Margin =
 * operator + `facilityBonus` - the procedure's difficulty + `spread` x (2u - 1): 0 or more gives the full benefit, down to
 * `badMiss` a weaker result, below it a worse one.
 */
export const SURGERY = {
  minOperator: 50,
  facilityBonus: 10,
  difficulty: { prosthetic: 50, internal: 60, extract: 45 } as Readonly<Record<SurgeryProcedure, number>>,
  spread: 20,
  badMiss: -15,
  /** A successful internal surgery: the wound heals as one band lighter. */
  internalFrom: 'critical' as Severity,
} as const;

// ---------------------------------------------------------------- prosthetics (spec §7)

/** A fitted aid's condition after hits (health §5 left this to M8): damaged halves its adaptation, broken counts as no aid. */
export const AID_CONDITIONS = ['damaged', 'broken'] as const;
export type AidCondition = (typeof AID_CONDITIONS)[number];
/** Wound damage W a hit would have done that damages or breaks a prosthetic instead (invented: moderate, severe). */
export const AID_DAMAGE_W = { damaged: 10, broken: 20 } as const;
/** A damaged aid's adaptation counts at this share (invented). */
export const AID_DAMAGED_SHARE = 0.5;

/**
 * Prosthetics by date and price (Republic credits, Mid Rim). A basic prosthetic: Repli-Limb arm or leg 2,000, hand 1,000
 * (game stat, The Far Orbit Project, WEG 1998; SW_Economy_GamePriceLists_Part8). A quality cybernetic: 7,500 (the Beemon
 * cybernetic implant, up to 7,500 cr c. 3,956 BBY; SW_Economy_Prices_Goods, tier 1). Available in every year of play: the
 * lore files record prosthetic limbs in the Old Republic and give no first date (not found; an invented "always").
 */
export const PROSTHETIC_PRICE = { basicProsthetic: { arm: 2000, leg: 2000, hand: 1000 }, qualityCybernetic: { arm: 7500, leg: 7500, hand: 7500 } } as const;

// ---------------------------------------------------------------- toxins (spec §8)

export const TOXINS = ['venom', 'poison', 'dart'] as const;
export type Toxin = (typeof TOXINS)[number];
/**
 * A toxin in a wound (invented): the wound does not heal, and each day it drains `vitalityPerDay` of max Vitality and worsens a
 * band at `worsenPerDay`, until an antidote (a medpac or a facility) or a Force purge clears it.
 */
export const TOXIN = { vitalityPerDay: 0.2, worsenPerDay: 0.1 } as const;
/**
 * The Force purge: Detoxify Poison (force-catalog-m6: a Healing ability; spec 05 reads its prerequisites as Meditation 15 and
 * Force Heal (Self) 10). Until the catalog builds it, a character purges with Force Heal (Self) and Meditation at these levels;
 * a healer with Force Heal (Others) at `others`.
 */
export const FORCE_PURGE = { self: 10, meditation: 15, others: 10 } as const;

// ---------------------------------------------------------------- costs and access (spec §9)

/**
 * Medcenter prices (Republic credits, Mid Rim, before the location factor; the economy charges them as services): every one
 * invented but the medpac (500, FastFlesh; the catalog's row) and the antidote (bio-antidote package 75-500 cr, KOTOR, game
 * stat; the catalog's row). A facility a day; a tank a day by fluid and era (`TANK_DAY`); surgery a procedure.
 */
export const MEDICAL_PRICE = {
  facilityDay: 150,
  surgery: { prosthetic: 3000, internal: 5000, extract: 1500 } as Readonly<Record<SurgeryProcedure, number>>,
  /** Repairing a prosthetic: a share of its price (economy.config REPAIR_SHARE's light and heavy, 10% and 30%). */
  repairShare: { damaged: 0.1, broken: 0.3 },
} as const;

/**
 * A tank a day by fluid (Jared, 25 Nov 2026: "about 400 a day for bacta, 600 for kolto, in every era"): bacta is the cheaper
 * in every era. What changes by date is only which fluid can be had where (`RARE_FLUID_AT`).
 */
export const TANK_DAY = { bacta: 400, kolto: 600 } as const;
/**
 * Where the date's rare fluid can be had (Jared, 25 Nov 2026; the places are invented): before the switch-over bacta is the
 * rare one, after it kolto. Either way the rare fluid is had only on Core worlds and at the Temple's Halls of Healing;
 * elsewhere a tank of it asked for is a tank of the date's standard fluid.
 */
export const RARE_FLUID_AT = { zones: ['core'] as readonly string[], places: ['temple'] as readonly CarePlace[] } as const;
/** Hours a tank needs at least (bacta: minor in 6 hours, health §7). */
export const TANK_MIN_HOURS = 6;
