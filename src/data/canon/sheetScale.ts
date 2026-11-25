// The sheet scale (Jared, 2026-11-25; D-494, D-495; skills-and-activities.md §7). Supersedes D-423's conversion and D-429's factors
// and hand-set lines. A hand-set sheet (lore batch 19, the D-421 lines) is on the game's own tier line (Adept 41-60, Master
// 61-80, High Master 81-100, Legendary 101+). At load (CANON_NPCS) a sheet becomes its game levels like this:
//  1. Main-specialty stats as written: every form, the Force abilities, Force Control, Force Output, Force Sense, Willpower;
//     Force Knowledge and Meditation for a figure whose focus includes them; whatever else the archetype's weights hold.
//  2. Strength, Agility and Endurance come down: the sheets wrote them as they are in combat, with the Force in them
//     (sheetBody). The species' cap at the figure's age is applied with the date (engine/canonStats.ts).
//  3. Force Knowledge and Meditation outside the focus from D-461's measured curves by age, Intelligence and Tactics outside
//     it from the D-429 bands; never above the sheet. Charisma by one curve for everyone (CHARISMA_SCALE).
//  4. Anything else outside the focus is left out: the game builds it, as it does for any figure of that archetype, rank and age.
//  5. Nothing ends below what the game would generate, but never above the sheet (the floor, engine/canonStats.ts).
// The authored numbers stay in the roster files (an anchor's `authored`).
import { archetypeDef } from '../archetypes';
import { FORCE_BOOST } from '../progression.config';
import { SKILL_BY_ID } from '../skills';
import { speciesDef, speciesTableId, trainingAge } from '../species';
import type { CanonNpc, StatAnchor } from './types';

/** Jedi and others trained in the Force, or not (a career). */
const usesForce = (archetype: string): boolean => archetypeDef(archetype).path !== 'career';

/** Stats always taken as written (D-494; Force Sense for every Force user, D-495). */
const AS_WRITTEN: readonly string[] = ['willpower', 'forceControl', 'forceOutput', 'forceSense'];
/**
 * Figures whose focus includes Force Knowledge and Meditation beyond their archetype's weights (D-495; the list past Jared's
 * three is a reading of the sheets): Satele, Revan and Vitiate; then the seers and ritualists of the Sith Inquisitors (the
 * Dread Masters, Ragate's rite, Zash's and Kressh's sorcery, Mekhis's and Nox's alchemy). Scholars are Consulars.
 */
export const KNOWLEDGE_FOCUS: readonly string[] = ['lore:satele-shan', 'lore:revan', 'lore:vitiate', 'lore:dread-masters', 'lore:ragate', 'lore:darth-zash', 'lore:exal-kressh', 'lore:darth-mekhis', 'lore:darth-nox'];
/**
 * A sheet's Charisma on the game's scale (D-495; the anchors are invented): one rising curve for everyone, so the sheets'
 * order holds. The sheets bunch at 70-90; the game's own untrained Charisma is 15 and a career of it about 30, so the
 * ordinary comes down and the great leaders and manipulators stay high.
 */
export const CHARISMA_SCALE: readonly (readonly [number, number])[] = [[0, 0], [40, 25], [60, 40], [75, 55], [90, 82], [100, 95], [122, 118], [150, 150]];
const PHYSICAL: readonly string[] = ['strength', 'agility', 'endurance'];

/** Whether a stat belongs to the figure's focus: its archetype's weights, or Force Knowledge and Meditation by the list. */
function focusHolds(n: Pick<CanonNpc, 'canonId' | 'archetype'>, stat: string): boolean {
  return stat in archetypeDef(n.archetype).weights || ((stat === 'forceKnowledge' || stat === 'meditation') && KNOWLEDGE_FOCUS.includes(n.canonId));
}

/** The Force Body a sheet names (no skill of its own until the Force catalog is built). */
export const namedForceBody = (n: Pick<CanonNpc, 'unmapped'>): number => Math.max(0, ...(n.unmapped ?? []).map((u) => Number(/^Force Body (\d+)/.exec(u)?.[1] ?? 0)));

/**
 * Force Speed for a canon Force user whose sheet lists neither it nor a Force Body (Jared, 2026-11-25; D-497): read from the
 * mean of Force Control and Force Output, rising by tier (Adept 41-60, Master 61-80, High Master 81-100, Legendary 101+).
 * Every anchor is invented; the sheets that list it run at 65 to 86% of that mean, and one that does not stays under most.
 */
export const FORCE_SPEED_FROM_POWER: readonly (readonly [number, number])[] = [[0, 0], [40, 20], [60, 36], [80, 53], [100, 70], [120, 86], [150, 110]];
export function forceSpeedFromPower(levels: Readonly<Record<string, number>>): number {
  const control = levels['forceControl'] ?? 0;
  return Math.round(curveAt(FORCE_SPEED_FROM_POWER, (control + (levels['forceOutput'] ?? control)) / 2) * 10) / 10;
}

/** The levels with a derived Force Speed, for a Force user on record who has none. */
export function withForceSpeed(n: Pick<CanonNpc, 'unmapped'> | null, archetype: string, levels: Readonly<Record<string, number>>): Readonly<Record<string, number>> {
  if (levels['forceSpeed'] || !levels['forceControl'] || archetypeDef(archetype).path === 'outsider' || !usesForce(archetype) || (n && namedForceBody(n) > 0)) return levels;
  return { ...levels, forceSpeed: forceSpeedFromPower(levels) };
}

/** The figure's Force body ability: its sheet's Force Speed or Force Jump, or the Force Body it names. */
function bodyAbility(n: Pick<CanonNpc, 'unmapped'>, levels: Readonly<Record<string, number>>): number {
  return Math.max(levels['forceSpeed'] ?? 0, levels['forceJump'] ?? 0, namedForceBody(n));
}

/**
 * A career's written physical stat against the trained range (invented): above CAREER_BODY.from the sheet's range to 100 is
 * drawn in to the Human cap of 80, so a 100 on the sheet is the body at its limit.
 */
export const CAREER_BODY = { from: 40, per: 2 / 3 } as const;

/**
 * A physical stat's trained level (D-494). A Force-user's sheet wrote the stat in combat with the Force in it, so the Force
 * boost the game gives in play (progression-numbers §11, from the sheet's own Force Control and Force body ability) comes
 * off: no number of its own. A career has no boost and is drawn into the trained range.
 */
export function sheetBody(n: Pick<CanonNpc, 'archetype' | 'unmapped'>, levels: Readonly<Record<string, number>>, written: number): number {
  if (!usesForce(n.archetype)) return written <= CAREER_BODY.from ? written : CAREER_BODY.from + (written - CAREER_BODY.from) * CAREER_BODY.per;
  const boost = Math.min(FORCE_BOOST.max, FORCE_BOOST.fcPer * Math.max(0, (levels['forceControl'] ?? 0) - FORCE_BOOST.fcFrom) + FORCE_BOOST.bodyPer * bodyAbility(n, levels));
  return Math.max(0, written - boost);
}

/** The stats read from the curves and bands when outside the focus (D-429, D-461). */
export const BAND_SET_STATS: readonly string[] = ['forceKnowledge', 'meditation', 'intelligence', 'tactics'];

const TIER_80 = ['Grand Master', 'High Council member', 'Dark Councilor', 'Sith Emperor', 'Supreme Commander', 'Supreme Chancellor', 'Mandalore', 'minister', 'Minister'];
const TIER_60 = ['Jedi Master', 'Darth', 'general', 'Overseer', 'senator', 'crime lord', 'admiral', 'Grand Moff', 'Moff'];
/** The band of a figure's standing at a date: 100 ancient (fixed), 80 the Councils and highest offices, 60, else 40. */
export function standingBand(n: Pick<CanonNpc, 'ranks' | 'fixed'>, bby: number): number {
  if (n.fixed) return 100;
  const held = n.ranks.filter((r) => r.fromBby >= bby && (r.toBby === undefined || r.toBby <= bby)).sort((a, b) => b.fromBby - a.fromBby);
  const titles = held.map((r) => r.title);
  if (titles.some((t) => TIER_80.some((x) => t.includes(x)))) return 80;
  if (titles.some((t) => TIER_60.some((x) => t.includes(x)))) return 60;
  return 40;
}

/** Whether a band-set stat is in the figure's focus (D-429): Consulars and Inquisitors study; officers command. */
function inFocus(stat: string, archetype: string): boolean {
  if (stat === 'forceKnowledge' || stat === 'meditation') return archetype === 'jediConsular' || archetype === 'sithInquisitor';
  if (stat === 'intelligence') return archetype === 'jediConsular' || archetype === 'sithInquisitor' || archetype === 'civilian' || archetype === 'smuggler';
  if (stat === 'tactics') return archetype === 'soldier' || archetype === 'mandalorian';
  return false;
}

/**
 * The canon Force Knowledge and Meditation bands, re-measured on the loop (D-461, Jared; D-429 [2]: "re-measured once the
 * XP sources exist"), as curves by age (D-462: read at the figure's own age). Per Order archetype, the 20-seed median of
 * its npc-test-7 life (Padawan 12, Knight 25, the yearly mission, its Order's seat by date: the life generated NPCs
 * reproduce), at Human-equivalent ages 20-100 (flat outside). Measured 2026-11-23, K 11.64
 * (tests/sweep/bands). The focus rule is in the numbers (Consulars and Inquisitors study more); a Consular's and an
 * Inquisitor's differ too much to share a band.
 */
export const KNOWLEDGE_BAND_CURVES: Readonly<Record<string, Readonly<Record<'forceKnowledge' | 'meditation', readonly (readonly [number, number])[]>>>> = {
  jediGuardian: {
    forceKnowledge: [[20, 14.2], [25, 14.2], [30, 16.0], [32.5, 16.8], [35, 17.7], [40, 19.4], [45, 21.2], [50, 23.0], [55, 24.6], [60, 26.2], [65, 27.6], [70, 29.1], [80, 31.8], [90, 34.3], [100, 36.5]],
    meditation: [[20, 13.1], [25, 16.5], [30, 18.9], [32.5, 20.1], [35, 21.3], [40, 23.7], [45, 25.9], [50, 28.1], [55, 30.2], [60, 32.3], [65, 34.3], [70, 36.1], [80, 39.4], [90, 42.5], [100, 45.0]],
  },
  jediSentinel: {
    forceKnowledge: [[20, 14.1], [25, 14.1], [30, 15.9], [32.5, 16.8], [35, 17.7], [40, 19.5], [45, 21.3], [50, 23.1], [55, 24.7], [60, 26.3], [65, 27.8], [70, 29.2], [80, 32.0], [90, 34.5], [100, 36.7]],
    meditation: [[20, 13.2], [25, 16.4], [30, 18.9], [32.5, 20.0], [35, 21.3], [40, 23.6], [45, 25.8], [50, 27.9], [55, 30.0], [60, 32.1], [65, 34.0], [70, 35.9], [80, 39.3], [90, 42.5], [100, 45.1]],
  },
  jediConsular: {
    forceKnowledge: [[20, 16.9], [25, 18.0], [30, 35.6], [32.5, 42.5], [35, 48.6], [40, 59.5], [45, 69.6], [50, 78.6], [55, 87.4], [60, 95.4], [65, 102.7], [70, 107.2], [80, 113.3], [90, 117.5], [100, 121.5]],
    meditation: [[20, 15.1], [25, 18.8], [30, 25.1], [32.5, 27.8], [35, 30.4], [40, 35.1], [45, 39.6], [50, 44.1], [55, 48.1], [60, 51.9], [65, 55.6], [70, 59.0], [80, 65.7], [90, 71.5], [100, 77.0]],
  },
  sithWarrior: {
    forceKnowledge: [[20, 11.9], [25, 11.9], [30, 13.3], [32.5, 13.9], [35, 14.6], [40, 15.9], [45, 17.2], [50, 18.5], [55, 19.7], [60, 21.1], [65, 22.4], [70, 23.6], [80, 25.8], [90, 27.7], [100, 29.4]],
    meditation: [[20, 9.6], [25, 11.3], [30, 13.2], [32.5, 14.2], [35, 15.1], [40, 16.9], [45, 18.7], [50, 20.5], [55, 22.4], [60, 24.1], [65, 25.5], [70, 26.9], [80, 29.3], [90, 31.3], [100, 33.0]],
  },
  sithInquisitor: {
    forceKnowledge: [[20, 14.3], [25, 15.4], [30, 22.2], [32.5, 25.1], [35, 27.7], [40, 32.6], [45, 37.1], [50, 41.5], [55, 45.7], [60, 49.5], [65, 53.1], [70, 56.6], [80, 63.4], [90, 69.5], [100, 75.0]],
    meditation: [[20, 10.4], [25, 12.2], [30, 15.7], [32.5, 17.3], [35, 18.8], [40, 21.7], [45, 24.4], [50, 26.8], [55, 29.2], [60, 31.5], [65, 33.7], [70, 35.7], [80, 39.6], [90, 43.5], [100, 46.8]],
  },
};

/** The read age of a standing without a known birth year: the midpoint of its span (D-461). */
export const STANDING_MIDPOINT: Readonly<Record<number, number>> = { 40: 32.5, 60: 50, 80: 70 };

/** Linear between the anchors, flat outside (the data layer's copy of engine/interp's rule, kept local: data imports no engine). */
function curveAt(anchors: readonly (readonly [number, number])[], x: number): number {
  if (x <= anchors[0]![0]) return anchors[0]![1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i]!;
    if (x <= x1) {
      const [x0, y0] = anchors[i - 1]!;
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return anchors[anchors.length - 1]![1];
}

/**
 * The age a canon figure's knowledge band is read at (D-462, D-465, Jared): its training age at the sheet's date (real
 * years from adulthood, D-474), from the roster's birth year whether the lore gives it or it is a D-412 estimate (a lore year replaces the estimate when
 * the lore supplies one). Every roster figure has a birth year; the standing midpoint stays as bandValue's fallback.
 */
export function bandReadAge(n: Pick<CanonNpc, 'birthBby' | 'speciesId'>, bby: number): number {
  return trainingAge(speciesDef(speciesTableId(n.speciesId)), Math.max(0, n.birthBby - bby));
}

/**
 * A band-set stat's game-scale value, at most as authored. Force Knowledge and Meditation of an Order archetype at a
 * Knight, Master or Council standing: the archetype's measured curve (D-461), read at the figure's own age (D-462,
 * D-465), else at the standing's midpoint. Otherwise the D-429 rule: the standing's band, one band lower outside the focus
 * (an ancient `fixed` figure, careers, Intelligence and Tactics).
 */
export function bandValue(stat: string, authored: number, band: number, archetype: string, age: number | null = null): number {
  const curve = stat === 'forceKnowledge' || stat === 'meditation' ? KNOWLEDGE_BAND_CURVES[archetype]?.[stat] : undefined;
  const mid = STANDING_MIDPOINT[band];
  if (curve && mid !== undefined) return Math.max(0, Math.min(authored, Math.round(curveAt(curve, age ?? mid))));
  return Math.max(0, Math.min(authored, inFocus(stat, archetype) ? band : band - 20));
}

/** A sheet's levels on the game's scale (rounded to 0.1). A stat left out is the game's own to build. */
export function sheetToGame(n: Pick<CanonNpc, 'canonId' | 'archetype' | 'ranks' | 'fixed' | 'birthBby' | 'speciesId' | 'unmapped'>, a: Pick<StatAnchor, 'bby' | 'levels'>): Record<string, number> {
  const band = standingBand(n, a.bby);
  const age = bandReadAge(n, a.bby);
  const out: Record<string, number> = {};
  // The derived Force Speed is in the body's boost like a listed one, so the stats in combat stay as written.
  const levels = withForceSpeed(n, n.archetype, a.levels);
  for (const [k, v] of Object.entries(levels)) {
    const kind = SKILL_BY_ID.get(k)?.kind;
    if (PHYSICAL.includes(k)) out[k] = Math.round(sheetBody(n, levels, v) * 10) / 10;
    else if (k === 'charisma') out[k] = Math.round(curveAt(CHARISMA_SCALE, v) * 10) / 10;
    else if (AS_WRITTEN.includes(k) || kind === 'form' || kind === 'forceAbility' || focusHolds(n, k)) out[k] = v;
    else if (BAND_SET_STATS.includes(k)) out[k] = bandValue(k, v, band, n.archetype, age);
  }
  return out;
}
