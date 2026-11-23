// Average lifetime test (progression-targets test 4, progression-numbers §12 and §5 Y_avg, npc-generation
// test 2 (closedForm.test.ts), ranks test 1, combat-xp §5). The Average profile runs 95 in-game years through the real game:
// the default routine (Shii-Cho as an Initiate, then main Soresu 2 h + second Ataru 1 h from Padawan,
// with the 0.75 fundamentals transfer; targets on the highest form, D-118, D-119), advanceByRoutine,
// and one skirmish a year from Knight (D-40). npc test 7 (every archetype reachable) is in archetypes*.test.ts.
import { beforeAll, describe, expect, it } from 'vitest';
import { Y_AVG, Y_AVG_FROZEN_AGES } from '../../src/data/progression.config';
import { RANK_BY_ID } from '../../src/data/rankMinimums';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { combatShare, expectMilestones, expectNotFasterThanAnakin, expectWithin4x } from './checks';
import { AVERAGE, TARGETS, gated } from './profiles';


let avg: LifeResult;
beforeAll(() => {
  avg = runLifetime(gated(AVERAGE), 95, { crossLevels: { highestForm: [24, 47, 64], forceControl: [14, 38], forceSense: [37], willpower: [58] } });
  console.info(`[report ${'average'}] milestones ${JSON.stringify(avg.milestones)} E@41/61 ${JSON.stringify(avg.eAtMilestone)} bank share ${(avg.bankShare * 100).toFixed(1)}% wounded days by age ${JSON.stringify(avg.woundedDaysByAge)} combat share by year ${JSON.stringify(avg.yearCombat.map((c, i) => Math.round((c / Math.max(1, avg.yearMain[i]!)) * 100)))}`);
}, 600_000);


describe('Average lifetime (95 years through the routine day loop)', () => {
  it('targets test 4: the config K gives 41 (highest form) at 16.0 +/- 0.1 years', () => {
    expect(Math.abs(avg.milestones[41]! - 16.0)).toBeLessThanOrEqual(0.1);
  });

  it('every milestone of the highest form is within +/-20% of its target (progression-numbers §12)', () => {
    expectMilestones(avg, TARGETS.average);
  });

  it('is never faster than Anakin and never beyond 4.0x (targets test 2)', () => {
    expectNotFasterThanAnakin(avg);
    expectWithin4x(avg);
  });

  it('peacetime combat stays under 10% of the yearly main-form XP (combat-xp §5)', () => {
    for (let i = 0; i < avg.yearMain.length; i++) expect(combatShare(avg, i), `year ${i}`).toBeLessThan(0.1);
  });

  it('the fundamentals transfer starts the main and second form at 0.75 x Shii-Cho at age 12', () => {
    expect(Object.keys(avg.transfers).sort()).toEqual(['ataru', 'soresu']);
    for (const t of Object.values(avg.transfers)) expect(t.age).toBeCloseTo(12, 1);
  });

  // The calibration gate (+/-5%) is judged on the 20-seed median in npm run spread (D-159 amended, Jared 2026-11-20);
  // the gated seed keeps this sanity check: one seed's long recovery can move its own years past 5%.
  it('the Y_avg table matches the run within +/-10% on the gated seed (sanity; the +/-5% gate is the spread median)', () => {
    for (const [age, y] of Y_AVG.filter(([a]) => !Y_AVG_FROZEN_AGES.includes(a))) {
      const got = avg.yearMain[age - 4];
      expect(got, `age ${age}`).toBeDefined();
      expect(Math.abs(got! / y - 1), `age ${age}: ${got} vs ${y}`).toBeLessThanOrEqual(0.1);
    }
  });


  it('ranks test 1: the Average meets each rank minimum within +/-2 years of the stated age', () => {
    const at = (key: string): number => avg.cross[key]!;
    for (const k of ['highestForm>=24', 'forceControl>=14']) expect(Math.abs(at(k) - 10), k).toBeLessThanOrEqual(2);
    expect(RANK_BY_ID.get('knight')!.minimums).toEqual({ $highestForm: 47, forceControl: 38, forceSense: 37, willpower: 58 });
    expect(RANK_BY_ID.get('master')!.minimums['$main']).toBe(64);
    for (const k of ['highestForm>=47', 'forceControl>=38', 'forceSense>=37', 'willpower>=58']) expect(Math.abs(at(k) - 24), k).toBeLessThanOrEqual(2);
    expect(Math.abs(at('highestForm>=64') - 40)).toBeLessThanOrEqual(2);
  });

  // D-159 amended (Jared, 2026-11-20): days with a serious fight are left out; the check is for training-routine
  // overload, and a fight's exhaustion is the combat system working as intended.
  it('the day-end tiredness of the standard routine stays near the limit (training-routines §2)', () => {
    expect(avg.maxDayEndFNoSeriousFight).toBeLessThan(1.1);
  });
});
