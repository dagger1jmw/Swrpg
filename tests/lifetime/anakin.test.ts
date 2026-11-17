// Anakin lifetime test (70 years; the max profile; progression-targets §2, §6 tests 1, 2, 5; combat-xp §5).
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { TIERS, combatShare, expectMilestones, expectWithin4x } from './checks';
import { ANAKIN, TARGETS } from './profiles';

let r: LifeResult;
beforeAll(() => {
  r = runLifetime(ANAKIN, 70);
}, 600_000);

describe('Anakin lifetime (70 years)', () => {
  it('every milestone within +/-20%', () => expectMilestones(r, TARGETS.anakin));
  it('the max profile: every milestone at or before 1.2 x its target (the bound the others are held to)', () => {
    for (const t of TIERS) expect(r.milestones[t]!).toBeLessThanOrEqual(TARGETS.anakin[t] * 1.2);
  });
  it('never beyond 4.0x the Average pace', () => expectWithin4x(r));
  it('Clone Wars years (ages 19-22): combat is 25-35% of the yearly main-form XP', () => {
    for (const i of [10, 11, 12]) {
      expect(combatShare(r, i), `age ${9 + i}`).toBeGreaterThanOrEqual(0.25);
      expect(combatShare(r, i), `age ${9 + i}`).toBeLessThanOrEqual(0.35);
    }
  });
});
