// The stat scale (Jared, 2026-11-22; D-423; skills-and-activities.md §7 bands). The game's progression is the reference
// scale. The hand-set canon sheets (lore batch 19 and the D-421 lines) were written on their own, flatter scale: most
// values sit at 76-88 whatever the figure's focus. They are converted into the game scale stat by stat at load: each
// stat's factor is the median, over the non-fixed hand-set sheets, of the game's progression line for that figure
// (archetype, rank spans, lived age at the sheet's date, gifted talent: a notable figure) divided by the sheet value;
// factors are capped at 1.0, so no stat is inflated. The authored sheet numbers stay in the roster files; the baseline
// copy is in docs-v2/reference/calibration-baseline-2026-11-22/. The generator is not tuned to the sheets.
import { SKILL_BY_ID } from '../skills';

/**
 * Sheet -> game factors (measured 2026-11-22 over 43 sheets, 31 for the Force stats; the median ratio, capped at 1.0).
 * Forms share one factor (the highest form's), Force abilities one (telekinesis's), stealth the blaster's.
 */
export const SHEET_TO_GAME: Readonly<Record<string, number>> = {
  strength: 0.68,
  agility: 0.63,
  endurance: 0.68,
  willpower: 1.0,
  charisma: 0.27,
  intelligence: 0.2,
  forceSense: 0.52,
  meditation: 0.24,
  forceKnowledge: 0.28,
  forceControl: 0.64,
  forceOutput: 0.75,
  $forms: 0.83,
  $abilities: 0.53,
  blaster: 0.6,
  stealth: 0.6,
  melee: 0.24,
  tactics: 0.48,
};

/** A stat's factor: its own, its group's (forms, Force abilities), else 1 (unmeasured stays as authored). */
export function sheetFactor(stat: string): number {
  const own = SHEET_TO_GAME[stat];
  if (own !== undefined) return own;
  const kind = SKILL_BY_ID.get(stat)?.kind;
  if (kind === 'form') return SHEET_TO_GAME['$forms']!;
  if (kind === 'forceAbility') return SHEET_TO_GAME['$abilities']!;
  return 1;
}

/** A sheet's levels in the game scale (rounded to 0.1). */
export function sheetToGame(levels: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(levels).map(([k, v]) => [k, Math.round(v * sheetFactor(k) * 10) / 10]));
}
