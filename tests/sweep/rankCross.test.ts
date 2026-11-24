// Report probe (D-460, D-461): the ages the Average crosses each rank minimum (the spread's rank-minimum gate: Padawan
// +/-2 y of 10, Knight of 24, the Master's main of 40). SEEDS (comma list of spread seed numbers, 0 = the profile's own seed; default the gated 9).
import { it } from 'vitest';
import { AVERAGE } from '../lifetime/profiles';
import { runLifetime } from '../support/lifetime';

const SEEDS = (process.env['SEEDS'] ?? '9').split(',').map(Number);

for (const n of SEEDS)
  it(`rank crossings s${n}`, () => {
    const t0 = Date.now();
    const r = runLifetime({ ...AVERAGE, seed: n === 0 ? AVERAGE.seed : `${AVERAGE.seed}-s${n}` }, 44, { crossLevels: { highestForm: [24, 47, 67], forceControl: [19, 44], forceSense: [40], willpower: [58] } });
    console.info(`[cross] s${n} ${Object.entries(r.cross).map(([k, v]) => `${k} ${(v as number).toFixed(2)}`).join(' | ')} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }, 3_600_000);
