// The Order's best duelist in peacetime (Jared, D-163): no missions and no partner above him, only Order members. Group
// sparring three Masters 10 levels below him at once counts as one partner 10 above (the strongest + 10 per extra), a
// stronger partner, so sparring E keeps rising toward his own level - 15 and the drill ceiling (25 + E) stays above his
// form: he still gains main-form levels every year (Legends: Yoda and Cin Drallig sparring several at once).
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { AVERAGE, schedule } from './profiles';

/** The Average from Knight on: weekly group spars against three Masters 10 below, no missions. */
export const SWORDMASTER = {
  ...AVERAGE,
  seed: 'swordmaster',
  fights: schedule([{ from: AVERAGE.knightAge, to: 200, perYear: 50, stakes: 'spar', gap: -10, partners: 3 }]),
};

let r: LifeResult;
beforeAll(() => {
  r = runLifetime(SWORDMASTER, 60);
  const at = (age: number): number => r.mainByYear[age - 4 - 1]!;
  const rate = (a: number, b: number): string => ((at(b) - at(a)) / (b - a)).toFixed(2);
  console.info(`[report swordmaster] main form at 30 ${at(30).toFixed(1)}, 40 ${at(40).toFixed(1)}, 50 ${at(50).toFixed(1)}, 60 ${at(60).toFixed(1)}, 64 ${at(64).toFixed(1)}; levels a year 25-40 ${rate(25, 40)}, 40-60 ${rate(40, 60)}, 60-64 ${rate(60, 64)}; milestones ${JSON.stringify(r.milestones)} E@41/61 ${JSON.stringify(r.eAtMilestone)} bank share ${(r.bankShare * 100).toFixed(1)}%`);
}, 600_000);

describe('the Order\'s best duelist in peacetime (D-163)', () => {
  it('gains main-form levels every year from Knight on through group sparring alone', () => {
    for (let i = 18; i < r.mainByYear.length; i++) expect(r.mainByYear[i]!, `age ${4 + i + 1}`).toBeGreaterThan(r.mainByYear[i - 1]! + 0.1);
  });
});
