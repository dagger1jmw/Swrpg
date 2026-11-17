// species.md §5 tests 1-5 and npc-generation §7 tests 1 and 8 (M3 step 3).
import { describe, expect, it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { FORM_TRANSFER_SHARE, K, PACE_CAP } from '../../src/data/progression.config';
import { SPECIES, speciesDef } from '../../src/data/species';
import { ageIntegral } from '../../src/engine/ageFactor';
import { A_REF, closedFormLevel, formXps, phasesFor } from '../../src/engine/closedForm';
import { levelExact } from '../../src/engine/curve';
import { bodyCap, humanBodyCap, humanEquivalentAge, naturalLevel, resistAgingStep, speciesLearning } from '../../src/engine/species';

const S = ARCHETYPE_BY_ID.get('soldier')!.paces;
const main = (paces: typeof S, key: string, ages = { padawanAge: 12, knightAge: 20.5 }, one = false) =>
  phasesFor({ initiate: paces.initiate?.[key], padawan: paces.padawan?.[key], knight: paces.knight?.[key] }, ages, one);

describe('species (species.md §5)', () => {
  it('test 1: Human tables are unchanged by the scaling code (h = a)', () => {
    const human = speciesDef('human');
    for (const a of [0, 5, 12, 18, 30, 64.5, 100]) expect(humanEquivalentAge(human, a)).toBeCloseTo(a, 9);
    for (const a of [5, 9, 20, 40, 90]) expect(bodyCap('human', 'strength', a)).toBeCloseTo(humanBodyCap(a), 9);
  });

  it('test 2: a 120-year-old Wookiee maps to h 32.5 with that cap x 1.25 plus the Strength bonus', () => {
    const w = speciesDef('wookiee');
    // 18 + 60 * 82 / 340 = 32.47 (the spec rounds to 32.5).
    expect(humanEquivalentAge(w, 120)).toBeCloseTo(32.5, 1);
    expect(bodyCap('wookiee', 'strength', 120)).toBeCloseTo(80 * 1.25 + 20, 9);
    expect(bodyCap('wookiee', 'agility', 120)).toBeCloseTo(80 * 1.25, 9);
  });

  it('test 3: a Wookiee child of 30 maps to h 9', () => {
    expect(humanEquivalentAge(speciesDef('wookiee'), 30)).toBeCloseTo(9, 9);
  });

  it('test 4: Resist Aging halves the advance past maturity and catches up at 2x after lapsing', () => {
    let h = 30;
    let trueH = 30;
    for (let i = 0; i < 10; i++) {
      trueH += 1;
      h = resistAgingStep(h, trueH, 1, true);
    }
    expect(h).toBeCloseTo(35, 9);
    for (let i = 0; i < 4; i++) {
      trueH += 1;
      h = resistAgingStep(h, trueH, 1, false);
    }
    expect(h).toBeCloseTo(43, 9);
    for (let i = 0; i < 5; i++) {
      trueH += 1;
      h = resistAgingStep(h, trueH, 1, false);
    }
    expect(h).toBe(trueH);
  });

  it('test 5: no trait pushes a learning factor outside 0.9..1.1 (the clamp applies on top)', () => {
    for (const s of SPECIES) for (const skill of ['forceControl', 'forceSense', 'tactics', 'intelligence', 'forceLightning', 'shiiCho', 'charisma', 'willpower']) {
      const f = speciesLearning(s.id, skill);
      expect(f).toBeGreaterThanOrEqual(0.9);
      expect(f).toBeLessThanOrEqual(1.1);
    }
    expect(speciesLearning('sith_pureblood', 'forceLightning')).toBe(1.05);
    expect(speciesLearning('sith_pureblood', 'forceHealOthers')).toBe(1);
    // D-113: Twi'lek Charisma and Zabrak Willpower learning x1.05 (they replace cap bonuses on uncapped stats).
    expect(speciesLearning('twilek', 'charisma')).toBe(1.05);
    expect(speciesLearning('zabrak', 'willpower')).toBe(1.05);
    expect(speciesLearning('human', 'charisma')).toBe(1);
  });

  it('natural baseline (progression-numbers §11a)', () => {
    expect(naturalLevel('endurance', 'human', 20)).toBeCloseTo(0.5 * humanBodyCap(20), 9);
    expect(naturalLevel('willpower', 'human', 16)).toBe(25);
    expect(naturalLevel('willpower', 'human', 2)).toBe(10);
    expect(naturalLevel('shiiCho', 'human', 30)).toBe(0);
    expect(naturalLevel('strength', 'wookiee', 120)).toBeCloseTo(0.5 * 120, 9);
  });
});

describe('closed form (npc-generation §7)', () => {
  it('test 8: the age-factor integral is exact; A(technique, 4, 20) = 17.98', () => {
    expect(A_REF).toBeCloseTo(17.98, 2);
    // 4-6 flat 1.25 (2.5), 6-10 trapezoid (4.8), 10-15 (5.5), 15-20 partial: 1.05 -> 1.0222 (5.18).
    expect(ageIntegral('technique', 4, 6)).toBeCloseTo(2.5, 9);
    expect(ageIntegral('academic', 3, 50)).toBeCloseTo(47, 9);
  });

  it('test 1: the reference table reproduces within +/-1 level (variance off; D-118 / D-119 / D-133 values)', () => {
    const near = (x: number, y: number) => expect(Math.abs(x - y), `${x} vs ${y}`).toBeLessThanOrEqual(1);
    const PLAN = { soresu: 2, ataru: 1 };
    const g = ARCHETYPE_BY_ID.get('jediGuardian')!.formPaces;
    const w = ARCHETYPE_BY_ID.get('sithWarrior')!.formPaces;
    const forms = (paces: typeof g, startAge: number, age: number, extra: Partial<Parameters<typeof formXps>[0]> = {}): number =>
      levelExact(
        Math.max(
          0,
          ...Object.values(
            formXps({ formPaces: paces, k: K, startAge, age, padawanAge: 12, knightAge: 20.5, onePhase: false, padawanPlan: PLAN, knightPlan: PLAN, mult: () => 1, transferShare: FORM_TRANSFER_SHARE, ...extra }),
          ),
        ),
      );
    near(forms(g, 4, 16), 34.2);
    near(forms(g, 4, 30), 53.6);
    near(forms(g, 4, 45), 68.4);
    near(forms(g, 4, 70), 87.8);
    near(forms(g, 3, 39, { padawanAge: 13, knightAge: 25, mult: () => 1.48 }), 80.2);
    near(forms(g, 9, 22.5, { padawanAge: 9, knightAge: 20, mult: () => 3.89 }), 79.7);
    near(closedFormLevel({ row: 'technique', startAge: 17, age: 35, warYears: 5, phases: main(S, 'blaster', undefined, true) }), 50.3);
    near(forms(w, 8, 35, { mult: () => 1.5 * 1.15, warYears: 10 }), 75.5);
  });

  it('each phase pace is capped at 4.0', () => {
    const phases = main(S, 'blaster', undefined, true);
    const capped = closedFormLevel({ row: 'technique', startAge: 17, age: 30, mult: 100, phases });
    const atCap = closedFormLevel({ row: 'technique', startAge: 17, age: 30, phases: phases.map((p) => ({ ...p, pace: PACE_CAP })) });
    expect(capped).toBeCloseTo(atCap, 9);
  });
});
