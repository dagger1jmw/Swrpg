// Medicine rules (M8 checklist item 6; docs-v2/spec/medicine.md; D-511). Pure: no state, no DOM, no network. The health
// feature applies them; the narrator only describes what they decided.
import { healingFluidAt, SEVERITIES, type Severity, type WeaponKind } from '../data/health.config';
import {
  AID_DAMAGE_W,
  BACTA_RARE_AT,
  CARE_BONUS,
  CARE_LEVELS,
  CARE_MULT,
  CAUTERIZING_CAUSES,
  DEPTH_HEALS_AS,
  MEDICAL_PRICE,
  NO_CAUTERIZE_SPECIES,
  PROSTHETIC_PRICE,
  SURGERY,
  TANK_DAY,
  TEARING_CAUSES,
  TOXIN,
  TREATMENT,
  UNTREATED,
  UNTREATED_SCARS_FROM,
  type AidCondition,
  type CareLevel,
  type CarePlace,
  type SurgeryProcedure,
  type WoundCause,
  type WoundDepth,
} from '../data/medicine.config';
import { LASTING_CHANCE } from '../data/health.config';

const sevIndex = (s: Severity): number => SEVERITIES.indexOf(s);
const worse = (a: Severity, b: Severity): Severity => (sevIndex(a) >= sevIndex(b) ? a : b);

// ---------------------------------------------------------------- care levels

/** The better of two care levels. */
export const betterCare = (a: CareLevel | undefined, b: CareLevel): CareLevel => (a && CARE_LEVELS.indexOf(a) >= CARE_LEVELS.indexOf(b) ? a : b);

/** The healing-rate multiplier of a care level (field care does not speed healing). */
export const careMultiplier = (c: CareLevel): number => CARE_MULT[c];

/**
 * The tank a patient gets: the fluid asked for, else the date's standard. Before the switch-over bacta is a rare import, had
 * only in the Core and at the Temple; elsewhere the tank is kolto.
 */
export function tankFluid(year: number, asked: 'kolto' | 'bacta' | undefined, where: { zone: string; place: CarePlace }): 'kolto' | 'bacta' {
  const f = healingFluidAt(year);
  const want = asked ?? f.standard;
  if (want === 'kolto' || f.bacta === 'standard') return want;
  if (f.bacta === 'unknown') return 'kolto';
  return BACTA_RARE_AT.zones.includes(where.zone) || BACTA_RARE_AT.places.includes(where.place) ? 'bacta' : 'kolto';
}

/** A tank's daily price by fluid and date: the standard fluid, bacta as a rare import before the switch-over, kolto cheap after. */
export function tankDayPrice(year: number, fluid: 'kolto' | 'bacta'): number {
  const f = healingFluidAt(year);
  if (fluid === f.standard) return TANK_DAY.standard;
  return fluid === 'bacta' ? TANK_DAY.rare : TANK_DAY.cheap;
}

/** Whether care here is free (Jared): Jedi with the Temple's healers, soldiers in a military medbay. */
export const careIsFree = (place: CarePlace, who: { jedi: boolean; soldier: boolean }): boolean => (place === 'temple' && who.jedi) || (place === 'military' && who.soldier);

// ---------------------------------------------------------------- wound causes

/** What a weapon's wound is, for the untreated risks. */
export function causeOfWeapon(w: WeaponKind): WoundCause | null {
  switch (w) {
    case 'melee':
      return 'blade';
    case 'unarmed':
      return 'blunt';
    case 'blasterPistol':
    case 'blasterRifle':
    case 'heavy':
      return 'blaster';
    case 'slugPistol':
    case 'slugRifle':
    case 'scatterGun':
      return 'slug';
    case 'lightsaber':
      return 'saber';
    default:
      return null;
  }
}

/** A hazard's wound cause: a fall or crash bruises and breaks, an explosion throws shrapnel, fire burns, poison is a toxin. */
export const causeOfHazard = (h: string): WoundCause | null => ({ fall: 'blunt', crash: 'blunt', impact: 'blunt', explosion: 'shrapnel', fire: 'burn', exposure: null, poison: 'toxin' } as Record<string, WoundCause | null>)[h] ?? null;

/**
 * The untreated-risk factor of a wound's cause: 1 for tearing wounds, `cauterizedRisk` for blaster and lightsaber burns (1 for
 * a species they do not cauterize), 0 for the rest (bruises, burns and toxins have their own rules).
 */
export function untreatedRiskFactor(cause: WoundCause | undefined, speciesId: string | null, noCauterize: readonly string[] = NO_CAUTERIZE_SPECIES): number {
  if (!cause) return 0;
  if (TEARING_CAUSES.includes(cause)) return 1;
  if (CAUTERIZING_CAUSES.includes(cause)) return speciesId && noCauterize.includes(speciesId) ? 1 : UNTREATED.cauterizedRisk;
  return 0;
}

export interface UntreatedWound {
  severity: Severity;
  cause?: WoundCause;
  treated?: boolean;
  infected?: boolean;
  /** Absolute day taken. */
  day: number;
}

/**
 * One day's untreated risk for a wound (u1, u2 uniform draws): infection for a moderate or worse wound past a day, bleeding for
 * a severe or worse one (Vitality drained, and maybe a band worse). Treated wounds carry no risk.
 */
export function untreatedDay(w: UntreatedWound, today: number, factor: number, u1: number, u2: number): { infects: boolean; bleeds: boolean; worsens: boolean } {
  if (w.treated || factor <= 0) return { infects: false, bleeds: false, worsens: false };
  const infects = !w.infected && sevIndex(w.severity) >= sevIndex('moderate') && today - w.day >= UNTREATED.infectionAfterDays && u1 < UNTREATED.infectionPerDay * factor;
  // A cauterized wound (factor below 1) does not bleed; only its infection chance is left, at the lower factor.
  const bleeds = factor >= 1 && sevIndex(w.severity) >= sevIndex(UNTREATED.bleedFrom) && w.severity !== 'mortal';
  const worsens = bleeds && u2 < UNTREATED.worsenPerDay;
  return { infects, bleeds, worsens };
}

/** The next band up (mortal stays mortal), with the W at the bottom of that band. */
export function bandWorse(sev: Severity): { severity: Severity; W: number } {
  const next = SEVERITIES[Math.min(SEVERITIES.length - 1, sevIndex(sev) + 1)]!;
  return { severity: next, W: ({ minor: 1, moderate: 10, severe: 20, critical: 35, mortal: 50 } as Record<Severity, number>)[next] };
}

/** A toxin's day (u uniform): Vitality drained, and a band worse at its chance. */
export const toxinDay = (u: number): { vitality: number; worsens: boolean } => ({ vitality: TOXIN.vitalityPerDay, worsens: u < TOXIN.worsenPerDay });

// ---------------------------------------------------------------- wound depth

/** The severity a wound heals as: its own, or what its depth makes it (a partial cut severe, a severed muscle or bone critical). */
export function healsAs(severity: Severity, depth: WoundDepth | undefined): Severity {
  const d = depth ? DEPTH_HEALS_AS[depth] : null;
  return d ? worse(severity, d) : severity;
}

/** A cut to the bone heals only once set (field care or a facility); nothing else needs setting, and nothing needs surgery. */
export const needsSetting = (w: { depth?: WoundDepth; set?: boolean }): boolean => w.depth === 'bone' && !w.set;

// ---------------------------------------------------------------- the treatment roll

export type HealOutcome = 'clean' | 'scar' | 'minorLasting' | 'lasting';

/** The outcome shares of the treatment roll for a severe or worse wound at treatment quality q (spec §5). */
export function outcomeShares(severity: Severity, quality: number): Record<HealOutcome, number> {
  const base = LASTING_CHANCE[severity] ?? 0;
  const d = TREATMENT.difficulty[severity];
  if (d === undefined) return { clean: 1, scar: 0, minorLasting: 0, lasting: 0 };
  const g = 1 / (1 + Math.exp(-(quality - d) / TREATMENT.spread));
  const lasting = base * (1 - g);
  const minorLasting = (TREATMENT.minorBase[severity] ?? 0) * (1 - g);
  const scar = (1 - lasting - minorLasting) * (1 - g * g);
  return { clean: 1 - lasting - minorLasting - scar, scar, minorLasting, lasting };
}

/** Treatment quality: the operator's Medicine plus the best care's bonus. */
export const treatmentQuality = (operator: number, care: CareLevel): number => Math.max(0, operator) + CARE_BONUS[care];

/** One roll (u uniform) on the shares: worst outcomes first, so a better roll never gives a worse outcome. */
export function treatmentOutcome(severity: Severity, quality: number, u: number): HealOutcome {
  const s = outcomeShares(severity, quality);
  if (u < s.lasting) return 'lasting';
  if (u < s.lasting + s.minorLasting) return 'minorLasting';
  if (u < s.lasting + s.minorLasting + s.scar) return 'scar';
  return 'clean';
}

/** An untreated wound (health §7's baseline): a lasting injury at 10 / 35 / 70%, else a scar on a severe or worse wound. */
export function untreatedOutcome(severity: Severity, chance: number, u: number): HealOutcome {
  if (u < chance) return 'lasting';
  return sevIndex(severity) >= sevIndex(UNTREATED_SCARS_FROM) ? 'scar' : 'clean';
}

// ---------------------------------------------------------------- surgery

export type SurgeryResult = 'success' | 'weaker' | 'worse';

/** Why surgery cannot be done here, or null: it needs a facility and a skilled operator. */
export function surgeryRefusal(place: CarePlace, operator: number): string | null {
  if (place === 'field') return 'surgery needs a medical facility (a medcenter, a medbay or the Halls of Healing), not the field';
  if (operator < SURGERY.minOperator) return `surgery needs an operator with Medicine ${SURGERY.minOperator} or more (this one has ${Math.round(operator)})`;
  return null;
}

/** The surgery roll (u uniform): success gives the full benefit, a near miss a weaker one, a bad miss a worse one. */
export function surgeryRoll(procedure: SurgeryProcedure, operator: number, u: number): { result: SurgeryResult; margin: number } {
  const margin = operator + SURGERY.facilityBonus - SURGERY.difficulty[procedure] + SURGERY.spread * (2 * u - 1);
  return { result: margin >= 0 ? 'success' : margin >= SURGERY.badMiss ? 'weaker' : 'worse', margin };
}

// ---------------------------------------------------------------- prosthetics

/** What a hit that would have done wound damage W does to a prosthetic instead (health §5's equipment damage). */
export function aidHit(W: number, current: AidCondition | undefined): AidCondition | undefined {
  if (W >= AID_DAMAGE_W.broken || (current === 'damaged' && W >= AID_DAMAGE_W.damaged)) return 'broken';
  if (W >= AID_DAMAGE_W.damaged) return current ?? 'damaged';
  return current;
}

/** A prosthetic's price by quality and limb (Republic credits, Mid Rim). */
export function prostheticPrice(aid: 'basicProsthetic' | 'qualityCybernetic', part: string): number {
  const limb = part.endsWith('Hand') ? 'hand' : part.endsWith('Leg') ? 'leg' : 'arm';
  return PROSTHETIC_PRICE[aid][limb];
}

/** Repairing a damaged or broken prosthetic: a share of its price. */
export const aidRepairPrice = (aid: 'basicProsthetic' | 'qualityCybernetic', part: string, c: AidCondition): number => Math.round(prostheticPrice(aid, part) * MEDICAL_PRICE.repairShare[c]);

/** The condition field to spread onto a lasting injury: absent when sound. */
export const withCondition = (c: AidCondition | undefined): { aidCondition?: AidCondition } => (c ? { aidCondition: c } : {});
