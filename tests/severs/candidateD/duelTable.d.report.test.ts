// Report only (D-256): candidate D, a sever chance on a qualifying limb hit: the per-duel chance of losing a limb and
// the rolls §8 table 1 (10,000 duels a gap) at chance 0.1 and 0.05.
import { it } from 'vitest';
import { SEVERING } from '../../../src/data/health.config';
import { runUntilBeat, startDuel } from '../../../src/engine/duel';
import { seedRng } from '../../../src/engine/rng';
import { REAL, forceUser, simulate } from '../../support/duelSim';

const TABLE: readonly [number, number, number][] = [[0, 50, 34], [5, 60, 33], [10, 68, 34], [20, 84, 29], [30, 92, 24], [40, 96, 20], [60, 99, 13]];

it('candidate D: per-duel limb loss and the duel table', () => {
  for (const chance of [0.1, 0.05]) {
    (SEVERING as { chance: number }).chance = chance;
    const per: string[] = [];
    for (const gap of [-20, -10, 0, 10]) {
      let lost = 0;
      let rng = seedRng(`limb${gap}`);
      for (let i = 0; i < 4000; i++) {
        const d = runUntilBeat(startDuel(forceUser('A', 60), [forceUser('B', 60 + gap)], rng), REAL, 0, 'toEnd', 3000).state;
        rng = d.rng;
        if (d.a.wounds.some((w) => w.severed)) lost++;
      }
      per.push(`gap ${gap}: ${((lost / 4000) * 100).toFixed(1)}%`);
    }
    console.info(`[limb-per-duel] D: chance ${chance}: ${per.join(', ')}`);
    const rows = TABLE.map(([gap, win, median]) => {
      const st = simulate(() => ({ a: forceUser('A', 50 + gap), b: forceUser('B', 50) }), 10_000, `gap${gap}`);
      return `gap ${gap} win ${(st.winRateA * 100).toFixed(1)} (target ${win}) median ${st.medianExchanges} (target ${median})`;
    });
    console.info(`[sever-duels] D: chance ${chance}: ${rows.join('; ')}`);
  }
  (SEVERING as { chance: number }).chance = 1;
}, 0);