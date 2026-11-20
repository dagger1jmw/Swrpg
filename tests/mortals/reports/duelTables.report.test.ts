// Report only (D-267): the rolls §8 table 1 (10,000 duels a gap) and test 3 under the CANDIDATE.
import { it } from 'vitest';
import { applyCandidate } from '../../support/candidates';
import { REAL, forceUser, simulate } from '../../support/duelSim';

const candidate = applyCandidate(process.env['CANDIDATE']);
const TABLE: readonly [number, number, number][] = [[0, 50, 34], [5, 60, 33], [10, 68, 34], [20, 84, 29], [30, 92, 24], [40, 96, 20], [60, 99, 13]];

it('rolls §8 table 1 and test 3', () => {
  void REAL;
  const rows = TABLE.map(([gap, win, med]) => {
    const st = simulate(() => ({ a: forceUser('A', 50 + gap), b: forceUser('B', 50) }), 10_000, `gap${gap}`);
    return `gap ${gap} win ${(st.winRateA * 100).toFixed(1)} (${win}) median ${st.medianExchanges} (${med})`;
  });
  const t3 = simulate(() => ({ a: forceUser('J', 70, { form: 'soresu' }), b: forceUser('T', 15, { skillId: 'blaster', form: null, weapon: 'blasterRifle', armor: 'medium', forceSense: 0, vitality: 47, maxVitality: 47, minion: true, caps: { p: 4.6, f: 0 } }) }), 10_000, 'test3');
  console.info(`[duel-table] ${candidate}: ${rows.join('; ')}; test 3 win ${(t3.winRateA * 100).toFixed(1)} (99+) median ${t3.medianExchanges} (5 or fewer)`);
}, 0);