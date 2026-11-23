// Report probe (D-460): the ages the Average (gated seed) crosses each rank minimum (the spread's rank-minimum gate:
// Padawan +/-2 y of 10, Knight of 24, the Master's main of 40).
import { it } from 'vitest';
import { AVERAGE, gated } from '../lifetime/profiles';
import { runLifetime } from '../support/lifetime';

it('rank crossings', () => {
  const t0 = Date.now();
  const r = runLifetime(gated(AVERAGE), 40, { crossLevels: { highestForm: [24, 47, 64], forceControl: [19, 41], forceSense: [40], willpower: [58] } });
  console.info(`[cross] ${Object.entries(r.cross).map(([k, v]) => `${k} ${(v as number).toFixed(2)}`).join(' | ')} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}, 3_600_000);
