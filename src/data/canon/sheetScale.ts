// The stat scale (Jared, 2026-11-22; D-423 as revised by D-429; skills-and-activities.md §7 bands). The game's
// progression is the reference scale. The hand-set canon sheets (lore batch 19 and the D-421 lines) were written on
// their own, flatter scale: most values sit at 76-88 whatever the figure's focus. They are converted into the game scale
// at load (CANON_NPCS), in three ways:
//  1. Most stats by one factor per archetype group (Jedi, Sith, careers): the median, over that group's non-fixed
//     hand-set sheets, of the game's progression line for the figure (archetype, rank spans, lived age at the sheet's
//     date, gifted talent: a notable figure) over the sheet value; capped at 1.0, so nothing is inflated.
//  2. Force Knowledge, Meditation, Intelligence and Tactics from the band definitions (D-429; Force Knowledge and
//     Meditation of the Order archetypes re-measured on the loop, D-461, as curves by age read at the figure's own age, D-462: KNOWLEDGE_BAND_CURVES): their low factors measure
//     the missing XP sources, not the scale. Each takes the band of the figure's standing at the sheet's date (40 a
//     Knight, Lord or officer; 60 a Master, Darth or general; 80 the Councils and the highest offices; 100 an ancient),
//     one band lower outside the figure's focus, and never above the authored value. Re-measured once the sources exist.
//  3. The apex and focus figures carry hand-set game-scale lines (GAME_SCALE_LINES) over the converted sheet.
// The authored numbers stay in the roster files (an anchor's `authored`); the baseline is in
// docs-v2/reference/calibration-baseline-2026-11-22/. The generator is not tuned to the sheets.
import { archetypeDef } from '../archetypes';
import { SKILL_BY_ID } from '../skills';
import { humanEquivalentAge, speciesDef, speciesTableId } from '../species';
import type { CanonNpc, StatAnchor } from './types';

export type SheetGroup = 'jedi' | 'sith' | 'career';

/** Factors per group (measured 2026-11-22 on the hand-set sheets; the median ratio, capped at 1.0). */
export const SHEET_TO_GAME_BY_GROUP: Readonly<Record<SheetGroup, Readonly<Record<string, number>>>> = {
  jedi: { strength: 0.72, agility: 0.63, endurance: 0.71, willpower: 1.0, charisma: 0.19, forceSense: 0.73, forceControl: 0.71, forceOutput: 0.71, $forms: 0.9, $abilities: 0.51, blaster: 0.6, stealth: 0.6, melee: 0.24 },
  sith: { strength: 0.62, agility: 0.6, endurance: 0.6, willpower: 1.0, charisma: 0.18, forceSense: 0.46, forceControl: 0.57, forceOutput: 0.75, $forms: 0.8, $abilities: 0.5, blaster: 0.6, stealth: 0.6, melee: 0.24 },
  career: { strength: 0.68, agility: 0.72, endurance: 0.67, willpower: 0.77, charisma: 0.19, forceSense: 0.5, forceControl: 0.6, forceOutput: 0.6, $forms: 0.8, $abilities: 0.5, blaster: 0.6, stealth: 0.6, melee: 0.24 },
};
/** The stats set from the bands, not a factor (D-429). */
export const BAND_SET_STATS: readonly string[] = ['forceKnowledge', 'meditation', 'intelligence', 'tactics'];

export const groupOf = (archetype: string): SheetGroup => {
  const p = archetypeDef(archetype).path;
  return p === 'jedi' || p === 'outsider' ? 'jedi' : p === 'sith' ? 'sith' : 'career';
};

/** A stat's factor in a group: its own, its kind's (forms, Force abilities), else 1 (unmeasured stays as authored). */
export function sheetFactor(stat: string, group: SheetGroup = 'jedi'): number {
  const g = SHEET_TO_GAME_BY_GROUP[group];
  const own = g[stat];
  if (own !== undefined) return own;
  const kind = SKILL_BY_ID.get(stat)?.kind;
  if (kind === 'form') return g['$forms']!;
  if (kind === 'forceAbility') return g['$abilities']!;
  return 1;
}

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
 * The age a canon figure's knowledge band is read at (D-462, D-465, Jared): its Human-equivalent age at the sheet's date,
 * from the roster's birth year whether the lore gives it or it is a D-412 estimate (a lore year replaces the estimate when
 * the lore supplies one). Every roster figure has a birth year; the standing midpoint stays as bandValue's fallback.
 */
export function bandReadAge(n: Pick<CanonNpc, 'birthBby' | 'speciesId'>, bby: number): number {
  return humanEquivalentAge(speciesDef(speciesTableId(n.speciesId)), Math.max(0, n.birthBby - bby));
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

/**
 * Hand-set game-scale lines for the apex and focus figures (Jared, D-429): written on the game's bands (skills-and-
 * activities §7: 80 the elite of an era, 100 legendary, 120 apex), over the converted sheet. Invented.
 */
export const GAME_SCALE_LINES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'lore:vitiate': { forceOutput: 125, forceControl: 120, forceSense: 120, forceKnowledge: 125, meditation: 115, willpower: 135, intelligence: 100, charisma: 90, makashi: 100, niman: 98, soresu: 95, shiiCho: 93, telekinesis: 115, forcePush: 109, forceLightning: 120 },
  'lore:scourge': { djemSo: 98, shien: 98, juyo: 90, shiiCho: 90, ataru: 85, soresu: 85, forceControl: 80, forceSense: 70, forceOutput: 85, forceKnowledge: 50, meditation: 40, willpower: 100, telekinesis: 72, forceLightning: 70 },
  'lore:darth-malgus': { djemSo: 88, shien: 88, juyo: 76, shiiCho: 74, ataru: 70, forceControl: 70, forceSense: 58, forceOutput: 75, forceKnowledge: 35, meditation: 28, willpower: 94, telekinesis: 64, forceChoke: 58, forceLightning: 66, forceBarrier: 58 },
  'lore:darth-marr': { soresu: 88, djemSo: 84, shien: 84, shiiCho: 78, makashi: 72, forceControl: 78, forceSense: 70, forceOutput: 75, forceKnowledge: 55, meditation: 50, willpower: 100, forceBarrier: 74, forceAbsorb: 60, telekinesis: 66, forceLightning: 62 },
  'lore:dread-masters': { forceOutput: 100, forceControl: 92, forceSense: 95, forceKnowledge: 95, meditation: 85, battleMeditation: 105, willpower: 100, intelligence: 75, makashi: 62, shiiCho: 58, soresu: 58, telekinesis: 70 },
  'lore:satele-shan': { ataru: 86, soresu: 80, niman: 78, shiiCho: 76, forceControl: 86, forceSense: 88, forceOutput: 72, forceKnowledge: 72, meditation: 80, battleMeditation: 90, forceBarrier: 86, forceAbsorb: 72, forceSpeed: 68, telekinesis: 76, forcePush: 60, willpower: 105 },
  'lore:revan': { niman: 105, ataru: 100, djemSo: 100, shien: 100, soresu: 96, makashi: 96, shiiCho: 96, juyo: 94, jarKai: 100, forceControl: 105, forceSense: 100, forceOutput: 95, forceKnowledge: 100, meditation: 90, battleMeditation: 95, telekinesis: 95, forcePush: 85, forceLightning: 85, forceSpeed: 75, willpower: 110, intelligence: 90 },
  // The Consular-type Masters: Force Knowledge and Meditation at their focus bands.
  'lore:zym': { forceKnowledge: 110, meditation: 100, forceSense: 92, forceControl: 72, forceOutput: 60, battleMeditation: 85, soresu: 60, shiiCho: 54, telekinesis: 60, willpower: 120, intelligence: 60 },
  'lore:darnala': { forceKnowledge: 88, meditation: 72, forceSense: 78, forceControl: 62, forceOutput: 58, battleMeditation: 75, soresu: 60, makashi: 56, willpower: 102 },
  'lore:ngani-zho': { forceKnowledge: 95, meditation: 82, forceSense: 80, forceControl: 60, forceOutput: 55, soresu: 56, shiiCho: 52, willpower: 115 },
  'lore:tol-braga': { forceKnowledge: 98, meditation: 85, forceSense: 82, forceControl: 66, forceOutput: 60, battleMeditation: 80, forceBarrier: 70, soresu: 60, niman: 58, willpower: 118 },
  'lore:gnost-dural': { forceKnowledge: 85, meditation: 60, forceSense: 65, forceControl: 58, forceOutput: 52, soresu: 56, djemSo: 52, juyo: 50, shiiCho: 48, telekinesis: 55, forceSpeed: 40, intelligence: 55, willpower: 90 },
  'lore:the-barsenthor': { forceKnowledge: 70, meditation: 66, forceSense: 72, forceControl: 70, forceOutput: 60, forceHealOthers: 75, forceBarrier: 68, soresu: 62, niman: 60, shiiCho: 56, telekinesis: 64, willpower: 85 },
};

/** A sheet's levels in the game scale (rounded to 0.1). */
export function sheetToGame(n: Pick<CanonNpc, 'canonId' | 'archetype' | 'ranks' | 'fixed' | 'birthBby' | 'speciesId'>, a: Pick<StatAnchor, 'bby' | 'levels'>): Record<string, number> {
  const group = groupOf(n.archetype);
  const band = standingBand(n, a.bby);
  const age = bandReadAge(n, a.bby);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(a.levels)) out[k] = BAND_SET_STATS.includes(k) ? bandValue(k, v, band, n.archetype, age) : Math.round(v * sheetFactor(k, group) * 10) / 10;
  return { ...out, ...(GAME_SCALE_LINES[n.canonId] ?? {}) };
}
