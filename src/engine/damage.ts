// Damage, the Vitality bypass, hit location and severity (health.md §4-5). Pure.
import type { HitQuality } from '../data/combat.config';
import {
  ARMOR_VALUE,
  BYPASS,
  HAZARD_BASE,
  HAZARD_BYPASS,
  HAZARD_SEVERITY_MULT,
  HIT_MULT,
  LIMBS,
  SABER_ARMOR_FACTOR,
  SEVER_AT,
  SEVERITY_FROM_W,
  WEAPON_BASE,
  type ArmorKind,
  type BodyPart,
  type HazardType,
  type Severity,
  type WeaponKind,
} from '../data/health.config';
import { nextFloat, type RngState } from './rng';

export const isSaber = (w: WeaponKind): boolean => w === 'lightsaber' || w === 'trainingSaber';

export interface HitInput {
  weapon: WeaponKind;
  quality: HitQuality;
  armor: ArmorKind;
  saberResistant: boolean;
  /** Overrides the weapon base (Force attacks: Lightning = 0.4 x Force Output x effort). */
  base?: number;
}

/** D = weapon base x hit quality - armor (min 0); against sabers armor counts x0.25 unless saber-resistant. */
export function damageOf(i: HitInput): number {
  const base = i.base ?? WEAPON_BASE[i.weapon];
  const armor = ARMOR_VALUE[i.armor] * (isSaber(i.weapon) && !i.saberResistant ? SABER_ARMOR_FACTOR : 1);
  return Math.max(0, base * HIT_MULT[i.quality] - armor);
}

/** Fraction of D sent straight to wounds. A training saber (or low-power setting) never bypasses. */
export function bypassFraction(weapon: WeaponKind, quality: HitQuality): number {
  if (weapon === 'trainingSaber') return 0;
  return weapon === 'lightsaber' ? BYPASS.lightsaber[quality] : BYPASS.other[quality];
}

export interface DamageResult {
  vitality: number;
  /** Wound damage W (0 = no wound). */
  W: number;
  vitalityLost: number;
}

/**
 * Resolution (health §4): the bypass part becomes wound damage; the rest reduces Vitality; any overflow below 0
 * also becomes wound damage. `vitalityOnly` (training sabers, D-144): no bypass and no overflow wounds.
 */
export function applyDamage(vitality: number, D: number, bypass: number, vitalityOnly = false): DamageResult {
  const direct = vitalityOnly ? 0 : D * bypass;
  const rest = D - direct;
  const after = vitality - rest;
  const overflow = after < 0 ? -after : 0;
  const v = Math.max(0, after);
  return { vitality: v, W: direct + (vitalityOnly ? 0 : overflow), vitalityLost: vitality - v };
}

/** W -> severity (1-9 minor ... 50+ mortal); null below 1. */
export function severityOf(W: number): Severity | null {
  for (const [min, sev] of SEVERITY_FROM_W) if (W >= min) return sev;
  return null;
}

/** Weighted location roll. */
export function rollLocation(rng: RngState, weights: Readonly<Record<BodyPart, number>>): [BodyPart, RngState] {
  const entries = Object.entries(weights) as [BodyPart, number][];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  const [f, next] = nextFloat(rng);
  let x = f * total;
  for (const [part, w] of entries) {
    if (x < w) return [part, next];
    x -= w;
  }
  return [entries[entries.length - 1]![0], next];
}

/** The limb rule (health §5): a lightsaber wound of 35+ to a limb or hand severs it. */
export function severs(weapon: WeaponKind, part: BodyPart, W: number): boolean {
  return weapon === 'lightsaber' && LIMBS.includes(part) && W >= SEVER_AT;
}

/** Hazard damage (D-149): D = base x severity multiplier, with the hazard bypass. */
export function hazardDamage(type: HazardType, severity: 1 | 2 | 3): { D: number; bypass: number } {
  return { D: HAZARD_BASE[type] * HAZARD_SEVERITY_MULT[severity], bypass: HAZARD_BYPASS[severity] };
}
