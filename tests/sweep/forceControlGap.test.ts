// Report probe (m8-skills, D-513; the calibration queue's Force Control gap): for every sheeted Force user, the sheet's
// Force Control against the generated line's (the closed form for its archetype, ranks and age, no talent) at the sheet's
// date. Report only; nothing is checked or changed.
import { it } from 'vitest';
import { CANON_NPCS } from '../../src/data/canonNpcs';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonProgressionLineAt } from '../../src/features/npcs/selectors';

it('Force Control: sheet vs the generated line (report)', () => {
  const rows: { name: string; arch: string; bby: number; sheet: number; line: number }[] = [];
  for (const n of CANON_NPCS) {
    for (const a of n.anchors) {
      const sheet = a.levels['forceControl'];
      if (sheet === undefined || sheet <= 0) continue;
      const line = canonProgressionLineAt(n, a.bby, absDayFromDate({ year: -a.bby, month: 1, day: 1 }))['forceControl'] ?? 0;
      rows.push({ name: n.name, arch: n.archetype, bby: a.bby, sheet, line });
    }
  }
  rows.sort((x, y) => y.sheet - y.line - (x.sheet - x.line));
  const gaps = rows.map((r) => r.sheet - r.line);
  console.info(`[fcgap] ${rows.length} anchors; gap (sheet - line) min ${Math.min(...gaps).toFixed(1)}, median ${gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)]!.toFixed(1)}, max ${Math.max(...gaps).toFixed(1)}`);
  for (const r of rows) console.info(`[fcgap] | ${r.name} | ${r.arch} | ${r.bby} | ${r.sheet} | ${r.line.toFixed(1)} | ${(r.sheet - r.line).toFixed(1)} |`);
});
