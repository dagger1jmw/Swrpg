// Report only (D-256): the rolls §8 table 1 duels with the opponent (B) given a Force user's late morale, against the same
// duels with none (the duel-table test's own fighters carry no morale, so its gates cannot move). 10,000 duels a gap.
import { it } from 'vitest';
import { REAL, forceUser, simulate } from '../support/duelSim';

it('duel table with late morale on the opponent', () => {
  for (const gap of [0, 5, 10, 20, 30, 40, 60]) {
    const plain = simulate(() => ({ a: forceUser('A', 50 + gap), b: forceUser('B', 50) }), 10_000, `gap${gap}`);
    const late = simulate(() => ({ a: forceUser('A', 50 + gap), b: { ...forceUser('B', 50), morale: { group: 'late' as const, surrender: 0.5 } } }), 10_000, `gap${gap}`);
    console.info(`[morale-duels] gap ${gap}: win ${(plain.winRateA * 100).toFixed(1)} -> ${(late.winRateA * 100).toFixed(1)}%, median ${plain.medianExchanges} -> ${late.medianExchanges}`);
  }
  void REAL;
}, 0);
