// Report only (D-256): the rolls §8 table 1 duels (10,000 a gap) under each severing candidate, to see what the duel
// gates would do if one were adopted (D-244: a severed weapon arm or leg ends about 17% of even duels).
import { it } from 'vitest';
import { LOCATION_WEIGHTS, SEVERING } from '../../../src/data/health.config';
import { forceUser, simulate } from '../../support/duelSim';

const TABLE: readonly [number, number, number][] = [[0, 50, 34], [5, 60, 33], [10, 68, 34], [20, 84, 29], [30, 92, 24], [40, 96, 20], [60, 99, 13]];
const base = { ...LOCATION_WEIGHTS };

function setLimbShare(share: number): void {
  const w = LOCATION_WEIGHTS as Record<string, number>;
  let moved = 0;
  for (const k of ['leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'leftHand', 'rightHand']) {
    w[k] = base[k as keyof typeof base] * share;
    moved += base[k as keyof typeof base] * (1 - share);
  }
  w['torso'] = base.torso + moved;
}

it('duel table under the severing candidates', () => {
  for (const [label, at, share] of [['now (35)', 35, 1], ['A: sever at 50', 50, 1], ['B: sever at 50, limb share x0.5', 50, 0.5]] as const) {
    (SEVERING as { at: number }).at = at;
    setLimbShare(share);
    const rows = TABLE.map(([gap, win, median]) => {
      const st = simulate(() => ({ a: forceUser('A', 50 + gap), b: forceUser('B', 50) }), 10_000, `gap${gap}`);
      return `gap ${gap} win ${(st.winRateA * 100).toFixed(1)} (target ${win}) median ${st.medianExchanges} (target ${median})`;
    });
    console.info(`[sever-duels] ${label}: ${rows.join('; ')}`);
  }
  (SEVERING as { at: number }).at = 35;
  setLimbShare(1);
}, 0);
