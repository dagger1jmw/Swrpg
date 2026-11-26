// The main-specialty rows (m8-ship-life Part A1, D-518): every sheeted canon figure's main specialty (its archetype's `main`, or
// a Force user's own sheet form) and every stat its sheet's conversion takes as written, at each sheet's date, in the game
// against the sheet. Shared by the probe (tests/sweep/mainSpecialtyGap.test.ts) and the m8-ship-life test.
import { archetypeDef } from '../../src/data/archetypes';
import { CANON_NPCS } from '../../src/data/canonNpcs';
import { SKILL_DRAFTS } from '../../src/data/canon/skillDrafts';
import { SKILL_BY_ID } from '../../src/data/skills';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonAbsence } from '../../src/engine/canonRoster';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';

export const GAP = 10;
const day = (bby: number): number => absDayFromDate({ year: -bby, month: 1, day: 1 });

export interface GapRow {
  canonId: string;
  name: string;
  archetype: string;
  stat: string;
  /** main: the archetype's main or the figure's own sheet form; written: any other stat the conversion takes as written. */
  kind: 'main' | 'written';
  bby: number;
  sheet: number;
  game: number;
  gap: number;
}

export function mainSpecialtyRows(): GapRow[] {
  const rows: GapRow[] = [];
  for (const n of CANON_NPCS) {
    const main = archetypeDef(n.archetype).main;
    // What each sheet writes, by date and stat (sheet scale), and what its conversion kept as written.
    const sheets = new Map<number, Map<string, { v: number; written: boolean }>>();
    const put = (bby: number, k: string, v: number, written: boolean): void => {
      const m = sheets.get(bby) ?? new Map<string, { v: number; written: boolean }>();
      const was = m.get(k);
      if (!was || v > was.v) m.set(k, { v, written: written || (was?.written ?? false) });
      sheets.set(bby, m);
    };
    for (const a of n.anchors) {
      if (a.basis !== 'sheet' || !a.complete) continue;
      const src = a.authored ?? a.levels;
      for (const [k, v] of Object.entries(src)) put(a.bby, k, v, a.levels[k] === v);
    }
    for (const d of SKILL_DRAFTS) if (d.canonId === n.canonId) for (const [k, v] of Object.entries(d.authored)) put(-d.year, k, v, k === main);
    for (const [bby, m] of sheets) {
      if (canonAbsence(n, bby) === 'unborn') continue;
      const lv = canonFigureLevelsAt(n, bby, day(bby));
      const forms = [...m.entries()].filter(([k]) => SKILL_BY_ID.get(k)?.kind === 'form' && k !== 'jarKai').sort((a, b) => b[1].v - a[1].v);
      const own = forms[0]?.[0];
      for (const [stat, { v: sheet, written }] of m) {
        const isMain = stat === main || stat === own;
        if (!isMain && !written) continue;
        const game = Math.round((lv[stat] ?? 0) * 10) / 10;
        rows.push({ canonId: n.canonId, name: n.name, archetype: n.archetype, stat, kind: isMain ? 'main' : 'written', bby, sheet, game, gap: Math.round((sheet - game) * 10) / 10 });
      }
    }
  }
  return rows;
}

