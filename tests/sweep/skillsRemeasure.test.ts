// Re-measure probe (m8-skills, D-513): every canon figure's non-Force skills (Intelligence, Tactics, Charisma, Melee,
// Blaster, Stealth, Gunnery, Repair) and Force Control at its dates: each anchor's date, and for a figure without a sheet
// its lived age 45 (or its death, if earlier). Writes one JSON file (OUT, default node_modules/.cache/swrpg-remeasure.json)
// so the run before and the run after a change can be compared. Report only; nothing is checked. Run with
// `npx vitest run tests/sweep/skillsRemeasure.test.ts` (OUT=path to choose the file).
import { mkdirSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { CANON_NPCS } from '../../src/data/canonNpcs';
import { canonAbsence } from '../../src/engine/canonRoster';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';

export const REMEASURE_STATS = ['intelligence', 'tactics', 'charisma', 'melee', 'blaster', 'stealth', 'gunnery', 'repair', 'forceControl'] as const;

const day = (bby: number): number => absDayFromDate({ year: -bby, month: 1, day: 1 });

it('canon non-Force skills (report)', () => {
  const out: Record<string, { name: string; archetype: string; dates: Record<string, Record<string, number>> }> = {};
  for (const n of CANON_NPCS) {
    const dates = n.anchors.length ? [...new Set(n.anchors.map((a) => a.bby))] : [Math.max(n.deathBby ?? -Infinity, n.birthBby - 45)];
    const rows: Record<string, Record<string, number>> = {};
    for (const bby of dates) {
      if (canonAbsence(n, bby) === 'unborn') continue;
      const lv = canonFigureLevelsAt(n, bby, day(bby));
      rows[String(bby)] = Object.fromEntries(REMEASURE_STATS.map((k) => [k, Math.round((lv[k] ?? 0) * 10) / 10]));
    }
    out[n.canonId] = { name: n.name, archetype: n.archetype, dates: rows };
  }
  const file = process.env['OUT'] ?? 'node_modules/.cache/swrpg-remeasure.json';
  mkdirSync(file.replace(/[\\/][^\\/]*$/, ''), { recursive: true });
  writeFileSync(file, JSON.stringify(out, null, 1));
  console.info(`[remeasure] ${Object.keys(out).length} figures -> ${file}`);
}, 1_800_000);
