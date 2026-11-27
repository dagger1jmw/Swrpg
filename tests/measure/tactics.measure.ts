// opt-2 A4 (reports/opt-2.md): generated Tactics by role, archetype and era, and every canon figure's Tactics line, written to
// a JSON file so a run before a change and a run after can be compared. On demand: npx vitest run --config vitest.measure.config.ts tactics
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { CANON_NPCS } from '../../src/data/canonNpcs';
import { absDayFromDate } from '../../src/engine/calendar';
import { rollNpcInputs } from '../../src/engine/npcGen';
import { canonFigureLevelsAt, npcLevelsFor } from '../../src/features/npcs/selectors';

const ROLES: readonly [string, string, number][] = [
  ['padawan', 'jediOrder', 16],
  ['jediKnight', 'jediOrder', 30],
  ['jediMaster', 'jediOrder', 50],
  ['sithLord', 'sith', 40],
  ['soldier', 'republic', 28],
  ['officer', 'republic', 38],
];
/** Years: the Great War, the Galactic War, peace, the New Sith Wars (Ruusan), the Clone Wars, the Civil War, the Vong War. */
const YEARS = [-3661, -3640, -500, -1032, -20, 3, 27];
const N = 60;

it('measures Tactics', () => {
  const generated: Record<string, number> = {};
  for (const year of YEARS) {
    const today = absDayFromDate({ year, month: 1, day: 2 });
    for (const [role, faction0, age] of ROLES) {
      const faction = faction0 === 'sith' && year > -1000 && year < 25 ? 'sith' : faction0;
      const by: Record<string, { t: number[]; w: number[] }> = {};
      for (let i = 0; i < N; i++) {
        const gen = rollNpcInputs({ campaignSeed: 'opt2', npcId: `npc:t${i}`, role, faction, age, year });
        const b = (by[gen.archetype] ??= { t: [], w: [] });
        b.t.push(npcLevelsFor(gen, 'human', age, today)['tactics'] ?? 0);
        b.w.push(gen.warYears);
      }
      for (const [arch, { t, w }] of Object.entries(by)) {
        t.sort((a, b) => a - b);
        generated[`${year}|${role}|${arch}`] = Math.round(t[Math.floor(t.length / 2)]! * 10) / 10;
        generated[`${year}|${role}|${arch}|war`] = Math.round(w[0]! * 10) / 10;
      }
    }
  }
  const canon: Record<string, number> = {};
  for (const n of CANON_NPCS) {
    const reads = new Set<number>();
    for (const age of [25, 35, 45, 60]) reads.add(n.birthBby - age);
    for (const a of n.anchors) reads.add(a.bby);
    reads.add(3661);
    for (const bby of reads) {
      if (bby > n.birthBby - 16 || (n.deathBby !== undefined && bby < n.deathBby)) continue;
      const today = absDayFromDate({ year: -bby, month: 1, day: 2 });
      canon[`${n.name}|${bby}`] = Math.round((canonFigureLevelsAt(n, bby, today)['tactics'] ?? 0) * 10) / 10;
    }
  }
  const out = process.env['TACTICS_OUT'] ?? 'tactics-measure.json';
  writeFileSync(out, JSON.stringify({ generated, canon }, null, 1));
});
