// Applied experience E (per lightsaber form group), combat integration CI (per combat Force ability), the drill
// ceiling and the bank (progression-numbers §7, §8; combat-xp §3; D-45; D-143 A). Pure.
import {
  CI_GAIN,
  DRILL_CEILING,
  E_GAIN,
  E_SCALE,
  E_STRONGER_GAP,
  SPAR_CI_CAP,
  SPAR_E_CAP,
  type CombatStakes,
  type ESource,
} from '../data/progression.config';
import { levelExact, xpForLevel } from './curve';

export interface EState {
  E: number;
  /** The part of E that came from sparring (capped at 15). */
  eSpar: number;
}

/** One E gain, scaled by (1 - E/120); sparring sources stop once sparring E reaches 15. */
export function gainE(s: EState, source: ESource): EState {
  const sparring = source === 'sparPeer' || source === 'sparMaster';
  let g = E_GAIN[source] * Math.max(0, 1 - s.E / E_SCALE);
  if (sparring) g = Math.min(g, Math.max(0, SPAR_E_CAP - s.eSpar));
  return { E: s.E + g, eSpar: s.eSpar + (sparring ? g : 0) };
}

/** The E source of a fight by stakes (combat-xp §3); a spar is with a peer or a master. */
export function eSourceFor(stakes: CombatStakes, opts: { opponentGap: number; master?: boolean }): ESource {
  if (stakes === 'spar') return opts.master ? 'sparMaster' : 'sparPeer';
  if (stakes === 'lethal') return opts.opponentGap >= E_STRONGER_GAP ? 'lethalStronger' : 'lethal';
  return stakes;
}

export interface CIState {
  CI: number;
  ciSpar: number;
}

/** CI per Force ability use, scaled by (1 - CI/120); sparring CI capped at 20. */
export function gainCI(s: CIState, stakes: CombatStakes): CIState {
  let g = CI_GAIN[stakes === 'spar' ? 'spar' : stakes] * Math.max(0, 1 - s.CI / E_SCALE);
  if (stakes === 'spar') g = Math.min(g, Math.max(0, SPAR_CI_CAP - s.ciSpar));
  return { CI: s.CI + g, ciSpar: s.ciSpar + (stakes === 'spar' ? g : 0) };
}

/** Drill ceiling = 25 + E. */
export const drillCeiling = (E: number): number => DRILL_CEILING.base + E;

/** Bank cap: the XP needed for 15 levels above the current level. */
export function bankCap(xp: number): number {
  const lvl = levelExact(xp);
  return xpForLevel(lvl + DRILL_CEILING.bankLevels) - xp;
}

export interface DrillSplit {
  applied: number;
  banked: number;
  /** XP lost because the bank was full. */
  overflow: number;
}

/**
 * Splits drill XP for a lightsaber form against the ceiling (progression-numbers §7; D-45: sparring counts as drill).
 * Below the ceiling it applies in full; past it, 25% applies and 75% goes to the bank, up to the bank cap.
 */
export function splitDrillXp(xp: number, wanted: number, E: number, bank: number): DrillSplit {
  if (wanted <= 0) return { applied: 0, banked: 0, overflow: 0 };
  const ceilXp = xpForLevel(drillCeiling(E));
  const below = Math.max(0, Math.min(wanted, ceilXp - xp));
  const above = wanted - below;
  const appliedAbove = above * DRILL_CEILING.aboveShare;
  const toBank = above - appliedAbove;
  const room = Math.max(0, bankCap(xp + below + appliedAbove) - bank);
  const banked = Math.min(toBank, room);
  return { applied: below + appliedAbove, banked, overflow: toBank - banked };
}

/**
 * One day of bank release (progression-numbers §7): while the release window is open, 10% of the remaining bank,
 * up to the new ceiling. Returns the XP released (outside the 4.0x clamp).
 */
export function releaseBank(xp: number, bank: number, E: number): number {
  if (bank <= 0) return 0;
  const room = Math.max(0, xpForLevel(drillCeiling(E)) - xp);
  return Math.min(bank * DRILL_CEILING.releaseShare, room);
}

/** Any skirmish or higher opens a new 60-day release window (D-45). */
export const releaseUntil = (day: number): number => day + DRILL_CEILING.releaseDays;
