// Average lifetime test (M3 plan step 9; progression-targets test 4, progression-numbers §12 and
// §5 Y_avg, npc-generation tests 2 and 7, ranks test 1). The Average profile runs 95 in-game years
// through the src engine and computeXp (tests/support/profileRunner.ts): Shii-Cho as an Initiate,
// then main Soresu 2 h + second Ataru 1 h from Padawan, with the 0.75 fundamentals transfer; the
// targets apply to the highest form (D-118, D-119). The other three profiles and the four-profile
// lifetime test come in M4 with combat XP (D-49).
import { beforeAll, describe, expect, it } from 'vitest';
import { ARCHETYPES, ARCHETYPE_BY_ID, type ArchetypeDef } from '../../src/data/archetypes';
import { FORM_TRANSFER_SHARE, K, Y_AVG } from '../../src/data/progression.config';
import { RANK_BY_ID } from '../../src/data/rankMinimums';
import { CATEGORY_RULES, SKILL_BY_ID } from '../../src/data/skills';
import { closedFormLevel, formXps, phasesFor } from '../../src/engine/closedForm';
import { levelExact } from '../../src/engine/curve';
import { runProfile, type Profile, type RunResult } from '../support/profileRunner';

const GUARDIAN = ARCHETYPE_BY_ID.get('jediGuardian')!;
const AVERAGE: Profile = { archetype: GUARDIAN, mainForm: 'soresu', secondForm: 'ataru', startAge: 4, padawanAge: 12, knightAge: 20.5, order: true, trainingDays: 300, seed: 'average' };
const TARGETS: Record<number, number> = { 21: 5.0, 41: 16.0, 61: 32.1, 81: 52.7, 101: 77.5 };
const PLAN = { soresu: 2, ataru: 1 };

let avg: RunResult;
beforeAll(() => {
  avg = runProfile(AVERAGE, 95, { crossLevels: { highestForm: [24, 39, 58], forceControl: [14, 34], forceSense: [31], willpower: [53] } });
}, 120_000);

/** The form closed form (D-118 / D-119): the highest form of an archetype on the Average plan. */
function closedHighestForm(a: ArchetypeDef, startAge: number, age: number, jedi: boolean): number {
  const xp = formXps({
    formPaces: a.formPaces,
    k: K,
    startAge,
    age,
    padawanAge: jedi ? 12 : startAge,
    knightAge: jedi ? 20.5 : startAge,
    onePhase: !jedi,
    padawanPlan: PLAN,
    knightPlan: PLAN,
    mult: () => 1,
    transferShare: FORM_TRANSFER_SHARE,
  });
  return levelExact(Math.max(0, ...Object.values(xp)));
}

describe('Average lifetime (95 years through the src engine)', () => {
  it('targets test 4: the config K gives 41 (highest form) at 16.0 +/- 0.1 years', () => {
    expect(Math.abs(avg.milestones[41]! - 16.0)).toBeLessThanOrEqual(0.1);
  });

  it('every milestone of the highest form is within +/-20% of its target (progression-numbers §12)', () => {
    for (const [tier, target] of Object.entries(TARGETS)) {
      const got = avg.milestones[Number(tier)];
      expect(got, `tier ${tier}`).toBeDefined();
      expect(Math.abs(got! / target - 1), `tier ${tier}: ${got} vs ${target}`).toBeLessThanOrEqual(0.2);
    }
  });

  it('the fundamentals transfer starts the main and second form at 0.75 x Shii-Cho at age 12', () => {
    expect(Object.keys(avg.transfers).sort()).toEqual(['ataru', 'soresu']);
    for (const t of Object.values(avg.transfers)) expect(t.age).toBeCloseTo(12, 1);
  });

  it('the Y_avg table matches the run within +/-5% (D-48 clamp input)', () => {
    for (const [age, y] of Y_AVG) {
      const got = avg.yearMain[age - 4];
      expect(got, `age ${age}`).toBeDefined();
      expect(Math.abs(got! / y - 1), `age ${age}: ${got} vs ${y}`).toBeLessThanOrEqual(0.05);
    }
  });

  it('npc test 2: the closed form matches the day loop within +/-2 levels at 10, 30 and 60 years (highest form)', () => {
    for (const years of [10, 30, 60]) {
      const day = avg.mainByYear[years - 1]!;
      expect(Math.abs(closedHighestForm(GUARDIAN, 4, 4 + years, true) - day), `${years} years: day ${day}`).toBeLessThanOrEqual(2);
    }
  });

  it('ranks test 1: the Average meets each rank minimum within +/-2 years of the stated age (highest form, D-120 values)', () => {
    const at = (key: string): number => avg.cross[key]!;
    // Initiate Trials (age 10): highest form (Shii-Cho) 24, Force Control 14.
    for (const k of ['highestForm>=24', 'forceControl>=14']) expect(Math.abs(at(k) - 10), k).toBeLessThanOrEqual(2);
    // Knight (stated age 20.3): highest form 39, Force Control 34, Force Sense 31, Willpower 53.
    expect(RANK_BY_ID.get('knight')!.minimums).toEqual({ $highestForm: 39, forceControl: 34, forceSense: 31, willpower: 53 });
    for (const k of ['highestForm>=39', 'forceControl>=34', 'forceSense>=31', 'willpower>=53']) expect(Math.abs(at(k) - 20.3), k).toBeLessThanOrEqual(2);
    // Master (about 35): main specialty (the highest form) 58.
    expect(Math.abs(at('highestForm>=58') - 35)).toBeLessThanOrEqual(2);
  });

  it('the day-end tiredness of the standard routine stays near the limit (training-routines §2)', () => {
    expect(avg.maxDayEndF).toBeLessThan(1.1);
  });
});

describe('npc test 7: every archetype is reachable by its own routine', () => {
  // Each archetype's default routine through the day loop matches its closed form within +/-2 levels
  // in the main specialty (the highest form for form archetypes), so no NPC or created character has a
  // level the player could not earn.
  for (const a of ARCHETYPES) {
    it(`${a.name}`, () => {
      const jedi = a.path === 'jedi' || a.path === 'sith';
      const years = 25;
      const p: Profile = { archetype: a, mainForm: 'soresu', secondForm: 'ataru', startAge: a.startAge, padawanAge: jedi ? 12 : a.startAge, knightAge: jedi ? 20.5 : a.startAge, order: jedi, trainingDays: 300, seed: a.id };
      const r = runProfile(p, years);
      let closed: number;
      if (a.main === '$mainForm') closed = closedHighestForm(a, a.startAge, a.startAge + years, jedi);
      else {
        const row = CATEGORY_RULES[SKILL_BY_ID.get(a.main)!.category].ageRow;
        closed = closedFormLevel({
          row,
          startAge: a.startAge,
          age: a.startAge + years,
          phases: phasesFor({ initiate: a.paces.initiate?.[a.main], padawan: a.paces.padawan?.[a.main], knight: a.paces.knight?.[a.main] }, { padawanAge: 12, knightAge: 20.5 }, !jedi),
        });
      }
      expect(Math.abs(r.mainByYear[years - 1]! - closed), `${a.id}: day loop ${r.mainByYear[years - 1]} vs closed ${closed}`).toBeLessThanOrEqual(2);
    }, 60_000);
  }
});
