// species.md §5 tests 1-5 and npc-generation §7 tests 1 and 8 (M3 step 3).
import { describe, expect, it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CLOSED_FORM_CURRICULUM } from '../../src/data/initiateCurriculum';
import { FORM_TRANSFER_SHARE, K, PACE_CAP } from '../../src/data/progression.config';
import { SPECIES, speciesDef } from '../../src/data/species';
import { ageIntegral } from '../../src/engine/ageFactor';
import { A_REF, closedFormLevel, formXps, phasesFor } from '../../src/engine/closedForm';
import { levelExact } from '../../src/engine/curve';
import { bodyCap, humanBodyCap, humanEquivalentAge, naturalLevel, resistAgingStep, speciesLearning } from '../../src/engine/species';

const S = ARCHETYPE_BY_ID.get('soldier')!.paces;
const main = (paces: typeof S, key: string, ages = { padawanAge: 12, knightAge: 25 }, one = false) =>
  phasesFor({ initiate: paces.initiate?.[key], padawan: paces.padawan?.[key], knight: paces.knight?.[key] }, ages, one);

describe('species (species.md §5)', () => {
  it('test 1: Human tables are unchanged by the scaling code (h = a)', () => {
    const human = speciesDef('human');
    for (const a of [0, 5, 12, 18, 30, 64.5, 100]) expect(humanEquivalentAge(human, a)).toBeCloseTo(a, 9);
    for (const a of [5, 9, 20, 40, 90]) expect(bodyCap('human', 'strength', a)).toBeCloseTo(humanBodyCap(a), 9);
  });

  it('test 2: a 120-year-old Wookiee (adult 18, prime 200; D-472) maps to h 24.7 with its lore ceilings (Strength 120, Agility 100) and its Endurance by size (D-474)', () => {
    const w = speciesDef('wookiee');
    // 18 + 102 * 12 / 182 = 24.73.
    expect(humanEquivalentAge(w, 120)).toBeCloseTo(24.73, 2);
    expect(bodyCap('wookiee', 'strength', 120)).toBeCloseTo(120, 9);
    expect(bodyCap('wookiee', 'agility', 120)).toBeCloseTo(100, 9);
    expect(bodyCap('wookiee', 'endurance', 120)).toBeCloseTo(80 * 1.25, 9);
    // A child's ceiling grows along the Human table.
    expect(bodyCap('wookiee', 'strength', 9)).toBeCloseTo((25 / 80) * 120, 9);
  });

  it('test 3: a Wookiee child of 9 maps to h 9, as childhood runs at the Human pace (adult 18; D-472)', () => {
    expect(humanEquivalentAge(speciesDef('wookiee'), 9)).toBeCloseTo(9, 9);
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

  it('test 1: the reference table reproduces within +/-1 level (variance off; the paces measured on the day loop at the Order seats, D-445/D-456; Knight at 25)', () => {
    const near = (x: number, y: number) => expect(Math.abs(x - y), `${x} vs ${y}`).toBeLessThanOrEqual(1);
    const PLAN = { soresu: 2, ataru: 1 };
    const g = ARCHETYPE_BY_ID.get('jediGuardian')!.formPaces;
    const w = ARCHETYPE_BY_ID.get('sithWarrior')!.formPaces;
    // A Jedi's Initiate years follow the lightsaber curriculum (D-459); the Sith acolyte row does not.
    const CUR = CLOSED_FORM_CURRICULUM;
    const forms = (paces: typeof g, startAge: number, age: number, extra: Partial<Parameters<typeof formXps>[0]> = {}): number =>
      levelExact(
        Math.max(
          0,
          ...Object.values(
            formXps({ formPaces: paces, k: K, startAge, age, padawanAge: 12, knightAge: 25, onePhase: false, padawanPlan: PLAN, knightPlan: PLAN, mult: () => 1, transferShare: FORM_TRANSFER_SHARE, ...(paces === g ? { curriculum: CUR } : {}), ...extra }),
          ),
        ),
      );
    // D-459 (2026-11-23): the Initiate lightsaber curriculum, K 11.5, the paces re-measured (Padawan 16: 33.9 -> 30.1, the loop
    // 30.3; Knight 30: 54.7 -> 53.8; Master 45: 69.5 -> 70.2; Elder 70: 89.0 -> 91.6; Obi-Wan 80.6 -> 78.6; the soldier
    // 51.4 -> 53.9 and the Sith Warrior 80.1 -> 83.9 with K).
    // D-460 (2026-11-23): the gate at 5, Form I at 75% in the survey, the Padawan specialty transfer, K 11.64, the paces
    // re-measured (Padawan 16: 30.1 -> 33.1, the loop 33.1; Knight 30: 53.8 -> 55.6; Master 45: 70.2 -> 71.6; Elder 70:
    // 91.6 -> 92.5; Obi-Wan 78.6 -> 81.2; the soldier 53.9 -> 53.5 and the Sith Warrior 83.9 -> 83.4 with K).
    near(forms(g, 4, 16), 33.1);
    near(forms(g, 4, 30), 55.6);
    near(forms(g, 4, 45), 71.6);
    near(forms(g, 4, 70), 92.5);
    near(forms(g, 3, 39, { padawanAge: 13, knightAge: 25, mult: () => 1.48 }), 81.2);
    near(forms(g, 9, 22.5, { padawanAge: 9, knightAge: 20, mult: () => 3.89 }), 79.7);
    near(closedFormLevel({ row: 'technique', startAge: 17, age: 35, warYears: 5, phases: main(S, 'blaster', undefined, true) }), 53.5);
    near(forms(w, 8, 35, { mult: () => 1.5 * 1.15, warYears: 10 }), 83.4);
  });

  it('each phase pace is capped at 4.0', () => {
    const phases = main(S, 'blaster', undefined, true);
    const capped = closedFormLevel({ row: 'technique', startAge: 17, age: 30, mult: 100, phases });
    const atCap = closedFormLevel({ row: 'technique', startAge: 17, age: 30, phases: phases.map((p) => ({ ...p, pace: PACE_CAP })) });
    expect(capped).toBeCloseTo(atCap, 9);
  });
});
