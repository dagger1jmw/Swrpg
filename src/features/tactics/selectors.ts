// Tactic selectors (m8-ship-life part G; D-519): known and seen tactics for the battle menu, the recognition bonus and the tab.
import { TACTICS, TACTIC_BY_ID, tacticInUse, type TacticDef } from '../../data/tactics';
import { dateFromAbsDay } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { TacticsSlice } from './tactics';

const slice = (s: GameState): TacticsSlice | undefined => (s as { tactics?: TacticsSlice }).tactics;

export const selectKnownTactics = (s: GameState): ReadonlySet<string> => new Set(Object.keys(slice(s)?.known ?? {}));
/** Seen, not practised (m8-fixes B4): usable in battle at a penalty, marked so on the tab. */
export const selectSeenTactics = (s: GameState): ReadonlySet<string> => {
  const sl = slice(s);
  return new Set(Object.keys(sl?.seen ?? {}).filter((id) => !sl?.known[id]));
};
/** Seen or known: what the character recognises when an enemy uses it. */
export const selectRecognisedTactics = (s: GameState): ReadonlySet<string> => new Set([...Object.keys(slice(s)?.known ?? {}), ...Object.keys(slice(s)?.seen ?? {})]);

export interface TacticRow {
  def: TacticDef;
  status: 'known' | 'seen';
  source: string;
  inUse: boolean;
  practice?: number;
}

/** The Tactics tab: known and seen entries by scale, with how each was learned (spec G). */
export function selectTacticRows(s: GameState): TacticRow[] {
  const sl = slice(s);
  if (!sl) return [];
  const year = dateFromAbsDay(s.clock.now.day).year;
  const rows: TacticRow[] = [];
  for (const def of TACTICS) {
    const k = sl.known[def.id];
    const v = sl.seen[def.id];
    if (k) rows.push({ def, status: 'known', source: k.source, inUse: tacticInUse(def, year) });
    else if (v) rows.push({ def, status: 'seen', source: `${v.source} (${v.count}x)`, inUse: tacticInUse(def, year), ...(sl.practice[def.id] ? { practice: sl.practice[def.id]! } : {}) });
  }
  return rows;
}

/** The narrator's line: how to report learning a tactic, and the ground and story tactics the character can use. */
export function selectTacticLines(s: GameState): string[] {
  const sl = slice(s);
  if (!sl) return [];
  const story = Object.keys(sl.known).map((id) => TACTIC_BY_ID.get(id)).filter((t): t is TacticDef => t !== undefined && !t.engine);
  return [`TACTICS rule: knowledge the engine tracks; report being taught, studying a manual or campaigns, or practising one with the tacticStudied event. ${story.length ? `Story tactics known: ${story.map((t) => t.name).join(', ')}` : 'No story tactics known beyond the battle menu'}.`];
}
