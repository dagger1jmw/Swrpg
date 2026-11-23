// Diagnosis probe (Phase B, D-456): a career archetype's yearly hours, trims, day-end tiredness and Willpower XP.
import { it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { runLifetime } from '../support/lifetime';

it('career probe', () => {
  const a = ARCHETYPE_BY_ID.get(process.env['ARCH'] ?? 'soldier')!;
  const rows: Record<number, { h: number; trim: number; endF: number; n: number; wp: number; forced: number }> = {};
  let wp0 = 0;
  runLifetime({ archetype: a.id, path: a.path, main: a.main, startAge: a.startAge, padawanAge: a.startAge, knightAge: a.startAge, daysPerYear: 300, effort: 'standard', mainForm: 'soresu', secondForm: 'ataru', seed: a.id }, 8, {
    onRoutineDays: (days, { age, state }) => {
      const y = Math.floor(age);
      const r = (rows[y] ??= { h: 0, trim: 0, endF: 0, n: 0, wp: 0, forced: 0 });
      for (const d of days) {
        r.h += d.hoursTrained;
        r.endF += d.endF;
        r.n += 1;
        const t = d.notes.find((x) => x.startsWith('fill trimmed by '));
        if (t) r.trim += Number(t.split(' ')[3]);
        if (d.notes.some((x) => x.includes('D-456'))) r.forced += 1;
      }
      const wp = state.progression.skills['willpower']?.xp ?? 0;
      r.wp += wp - wp0;
      wp0 = wp;
    },
  });
  for (const [y, r] of Object.entries(rows)) console.info(`[career] ${a.id} ${y}: hours ${r.h.toFixed(0)}, trimmed ${r.trim} h, forced-rest days ${r.forced}, mean endF ${(r.endF / r.n).toFixed(3)}, willpower XP ${r.wp.toFixed(0)}`);
}, 3_600_000);
