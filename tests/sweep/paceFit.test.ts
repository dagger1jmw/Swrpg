// Report probe (D-460, Jared: the Mandalorian's npc test 7 pace fit): a career archetype's main-specialty level on the day
// loop (npc test 7's life, 60 years) against the closed form from its measured single pace, year by year, and the pace
// that would match the loop exactly at each checkpoint. ARCH (default mandalorian).
import { it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CATEGORY_RULES, SKILL_BY_ID } from '../../src/data/skills';
import { closedFormLevel } from '../../src/engine/closedForm';
import { runLifetime } from '../support/lifetime';

const ID = process.env['ARCH'] ?? 'mandalorian';

it(`pace fit ${ID}`, () => {
  const t0 = Date.now();
  const a = ARCHETYPE_BY_ID.get(ID)!;
  const r = runLifetime({ archetype: a.id, path: a.path, main: a.main, startAge: a.startAge, padawanAge: a.startAge, knightAge: a.startAge, daysPerYear: 300, effort: 'standard', mainForm: 'soresu', secondForm: 'ataru', seed: a.id }, 60);
  const row = CATEGORY_RULES[SKILL_BY_ID.get(a.main)!.category].ageRow;
  const pace = a.paces.knight![a.main]!;
  const closed = (p: number, y: number): number => closedFormLevel({ row, startAge: a.startAge, age: a.startAge + y, phases: [{ from: -Infinity, to: Infinity, pace: p }] });
  // The pace that matches the loop at year y (bisection; level rises with pace).
  const fit = (y: number): number => {
    let lo = 0;
    let hi = 4;
    for (let i = 0; i < 50; i++) {
      const m = (lo + hi) / 2;
      if (closed(m, y) < r.mainByYear[y - 1]!) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  for (const y of [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60])
    console.info(`[fit] ${ID} year ${y} (age ${a.startAge + y}): loop ${r.mainByYear[y - 1]!.toFixed(2)} closed ${closed(pace, y).toFixed(2)} (pace ${pace}); matching pace ${fit(y).toFixed(3)}`);
  // Each single pace's error against the loop over the measured life (years 1-60), and at npc test 7's year 25.
  let best = { p: pace, max: Infinity };
  for (let p = 1.2; p <= 1.5001; p += 0.005) {
    const errs = Array.from({ length: 60 }, (_, i) => closed(p, i + 1) - r.mainByYear[i]!);
    const max = Math.max(...errs.map(Math.abs));
    if (max < best.max) best = { p, max };
  }
  const errsAt = (p: number): string => [1, 5, 10, 25, 40, 60].map((y) => `y${y} ${(closed(p, y) - r.mainByYear[y - 1]!).toFixed(2)}`).join(', ');
  console.info(`[fit] ${ID} measured pace ${pace}: ${errsAt(pace)}`);
  console.info(`[fit] ${ID} minimax pace ${best.p.toFixed(3)} (max error ${best.max.toFixed(2)}): ${errsAt(best.p)}`);
  console.info(`[fit-runtime] ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}, 3_600_000);
