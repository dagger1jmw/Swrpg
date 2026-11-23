// The stat scale (Jared, 2026-11-22; D-423 as revised by D-429; skills-and-activities.md §7 bands). The game's
// progression is the reference scale. The hand-set canon sheets (lore batch 19 and the D-421 lines) were written on
// their own, flatter scale: most values sit at 76-88 whatever the figure's focus. They are converted into the game scale
// at load (CANON_NPCS), in three ways:
//  1. Most stats by one factor per archetype group (Jedi, Sith, careers): the median, over that group's non-fixed
//     hand-set sheets, of the game's progression line for the figure (archetype, rank spans, lived age at the sheet's
//     date, gifted talent: a notable figure) over the sheet value; capped at 1.0, so nothing is inflated.
//  2. Force Knowledge, Meditation, Intelligence and Tactics from the band definitions (D-429): their low factors measure
//     the missing XP sources, not the scale. Each takes the band of the figure's standing at the sheet's date (40 a
//     Knight, Lord or officer; 60 a Master, Darth or general; 80 the Councils and the highest offices; 100 an ancient),
//     one band lower outside the figure's focus, and never above the authored value. Re-measured once the sources exist.
//  3. The apex and focus figures carry hand-set game-scale lines (GAME_SCALE_LINES) over the converted sheet.
// The authored numbers stay in the roster files (an anchor's `authored`); the baseline is in
// docs-v2/reference/calibration-baseline-2026-11-22/. The generator is not tuned to the sheets.
import { archetypeDef } from '../archetypes';
import { SKILL_BY_ID } from '../skills';
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

/** A band-set stat's game-scale value (D-429): the standing's band, one band lower outside the focus, at most as authored. */
export function bandValue(stat: string, authored: number, band: number, archetype: string): number {
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
export function sheetToGame(n: Pick<CanonNpc, 'canonId' | 'archetype' | 'ranks' | 'fixed'>, a: Pick<StatAnchor, 'bby' | 'levels'>): Record<string, number> {
  const group = groupOf(n.archetype);
  const band = standingBand(n, a.bby);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(a.levels)) out[k] = BAND_SET_STATS.includes(k) ? bandValue(k, v, band, n.archetype) : Math.round(v * sheetFactor(k, group) * 10) / 10;
  return { ...out, ...(GAME_SCALE_LINES[n.canonId] ?? {}) };
}
