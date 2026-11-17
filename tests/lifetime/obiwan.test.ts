// Obi-Wan lifetime test (70 years; progression-targets §2, §6 tests 1, 2, 5; combat-xp §5).
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { combatShare, expectMilestones, expectNotFasterThanAnakin, expectWithin4x } from './checks';
import { OBIWAN, TARGETS } from './profiles';

let r: LifeResult;
beforeAll(() => {
  r = runLifetime(OBIWAN, 70);
}, 600_000);

describe('Obi-Wan lifetime (70 years)', () => {
  it('every milestone within +/-20%', () => expectMilestones(r, TARGETS.obiwan));
  it('never faster than Anakin, never beyond 4.0x', () => {
    expectNotFasterThanAnakin(r);
    expectWithin4x(r);
  });
  it('Clone Wars years (ages 35-38): combat is 20-30% of the yearly main-form XP', () => {
    for (const i of [32, 33, 34]) {
      expect(combatShare(r, i), `age ${3 + i}`).toBeGreaterThanOrEqual(0.2);
      expect(combatShare(r, i), `age ${3 + i}`).toBeLessThanOrEqual(0.3);
    }
  });
  it('peacetime: combat under 10%', () => {
    for (let i = 0; i < r.yearMain.length; i++) if (i < 32 || i > 34) expect(combatShare(r, i), `age ${3 + i}`).toBeLessThan(0.1);
  });
});
