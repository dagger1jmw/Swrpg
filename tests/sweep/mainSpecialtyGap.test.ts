// Main-specialty probe (m8-ship-life Part A1, D-518): every sheeted canon figure's main specialty (its archetype's `main`) at
// each sheet's date, in the game, against what the sheet writes (the anchor's authored value, or an approved draft's authored
// value from the same sheet). The scale rule takes a main specialty as written, so a figure more than GAP below its sheet is
// a fault to find. Report only: writes OUT (default node_modules/.cache/swrpg-main-gap.json) and prints the rows over the gap.
// Run with `npx vitest run tests/sweep/mainSpecialtyGap.test.ts`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { GAP, mainSpecialtyRows } from '../support/mainSpecialty';

it('main specialty against the sheet (report)', () => {
  const rows = mainSpecialtyRows();
  const file = process.env['OUT'] ?? 'node_modules/.cache/swrpg-main-gap.json';
  mkdirSync(file.replace(/[\\/][^\\/]*$/, ''), { recursive: true });
  writeFileSync(file, JSON.stringify(rows, null, 1));
  for (const kind of ['main', 'written'] as const) {
    const all = rows.filter((r) => r.kind === kind);
    const over = all.filter((r) => r.gap > GAP);
    console.info(`[main-gap] ${kind}: ${all.length} figure-stat-dates checked, ${over.length} more than ${GAP} below the sheet`);
    for (const r of over) console.info(`[main-gap] ${kind}: ${r.name} (${r.archetype}) ${r.stat} at ${r.bby} BBY: game ${r.game}, sheet ${r.sheet} (gap ${r.gap})`);
  }
}, 600_000);
