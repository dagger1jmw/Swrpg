// The Jedi Initiate lightsaber curriculum (D-459, Jared): the saber gate, Form I, the survey of Forms I-VI.
import { describe, expect, it } from 'vitest';
import { CLOSED_FORM_CURRICULUM, INITIATE_CURRICULUM, surveyShares } from '../../src/data/initiateCurriculum';
import { curriculumPhase, initiateSaberBlocks } from '../../src/features/routines/curriculum';
import { formXps } from '../../src/engine/closedForm';
import { K, FORM_TRANSFER_SHARE } from '../../src/data/progression.config';
import { TRIALS } from '../../src/data/ranks.config';
import { INITIATE_TRIALS } from '../../src/data/rankMinimums';
import { rollTrial } from '../../src/features/ranks/rules';
import { seedRng } from '../../src/engine/rng';

const g = INITIATE_CURRICULUM.gate;
const lv = (fc: number, fk: number) => (id: string): number => (id === 'forceControl' ? fc : id === 'forceKnowledge' ? fk : 0);

describe('the Initiate saber curriculum (D-459)', () => {
  it('opens the saber classes only past basic Force Control and study, by level, not age', () => {
    expect(curriculumPhase({ age: 9, level: lv(g.forceControl - 0.1, 99) })).toBe('preGate');
    expect(curriculumPhase({ age: 9, level: lv(99, g.forceKnowledge - 0.1) })).toBe('preGate');
    expect(curriculumPhase({ age: 5, level: lv(g.forceControl, g.forceKnowledge) })).toBe('formI');
    expect(curriculumPhase({ age: INITIATE_CURRICULUM.surveyFromAge, level: lv(99, 99) })).toBe('survey');
  });

  it('before the gate the saber hours go to Force Control, physical training and meditation; total unchanged', () => {
    const r = initiateSaberBlocks({ age: 5, day: 0, hours: 2, level: lv(0, 0) });
    expect(r.blocks.map((b) => b.skillId)).toEqual(['forceControl', 'agility', 'meditation']);
    expect(r.blocks.reduce((a, b) => a + b.hours, 0)).toBe(2);
    expect(initiateSaberBlocks({ age: 5, day: 1, hours: 2, level: lv(0, 0) }).blocks[1]!.skillId).toBe('strength');
    expect(initiateSaberBlocks({ age: 5, day: 2, hours: 2, level: lv(0, 0) }).blocks[1]!.skillId).toBe('endurance');
  });

  it('Form I only for the first saber years', () => {
    expect(initiateSaberBlocks({ age: 7, day: 3, hours: 2, level: lv(99, 99) }).blocks).toEqual([{ activityId: 'shiiChoBasics', skillId: 'shiiCho', hours: 2 }]);
  });

  it('the survey: Form I keeps 75% (D-460); Forms II-VI rotate a day each (Form V alternating); about 5% each over time', () => {
    const hours: Record<string, number> = {};
    // Days before 0 BBY are negative (the variant index needs a non-negative modulo).
    for (let d = -700; d < 700; d++) for (const b of initiateSaberBlocks({ age: 11, day: d, hours: 2, level: lv(99, 99) }).blocks) hours[b.skillId] = (hours[b.skillId] ?? 0) + b.hours;
    const total = Object.values(hours).reduce((a, b) => a + b, 0);
    expect(total).toBe(2800);
    expect(hours['shiiCho']! / total).toBeCloseTo(0.75, 9);
    for (const f of ['makashi', 'soresu', 'ataru', 'niman']) expect(hours[f]! / total).toBeCloseTo(0.05, 9);
    expect((hours['shien']! + hours['djemSo']!) / total).toBeCloseTo(0.05, 9);
    expect(hours['shien']! / total).toBeCloseTo(0.025, 2);
    expect(hours['djemSo']! / total).toBeCloseTo(0.025, 2);
    expect(hours['juyo']).toBeUndefined();
    expect(surveyShares()).toEqual({ shiiCho: 0.75, makashi: 0.05, soresu: 0.05, ataru: 0.05, shien: 0.025, djemSo: 0.025, niman: 0.05 });
  });

  it('the closed form follows it: no form XP before the gate age; Form I alone; the survey forms start with their transfer', () => {
    const base = { formPaces: { initiate: { order: 1 } }, k: K, startAge: 4, padawanAge: 12, knightAge: 25, onePhase: false, padawanPlan: { soresu: 2, ataru: 1 }, knightPlan: { soresu: 2, ataru: 1 }, mult: () => 1, transferShare: FORM_TRANSFER_SHARE };
    const cur = CLOSED_FORM_CURRICULUM;
    expect(formXps({ ...base, age: INITIATE_CURRICULUM.gateAge - 0.1, curriculum: cur })['shiiCho'] ?? 0).toBe(0);
    const at9 = formXps({ ...base, age: 9, curriculum: cur });
    expect(at9['shiiCho']).toBeGreaterThan(0);
    expect(at9['makashi'] ?? 0).toBe(0);
    const at10 = formXps({ ...base, age: 10.001, curriculum: cur });
    for (const f of ['makashi', 'soresu', 'ataru', 'shien', 'djemSo']) expect(at10[f]!).toBeGreaterThan(0.7 * at10['shiiCho']!);
    // Niman last: its transfer averages Forms I, III, IV and V, already started.
    expect(at10['niman']!).toBeGreaterThan(0.5 * at10['shiiCho']!);
    // Without the curriculum (the Sith acolyte row) every Initiate form hour is Shii-Cho from the start.
    expect(formXps({ ...base, age: INITIATE_CURRICULUM.gateAge - 0.1 })['shiiCho']!).toBeGreaterThan(0);
    // The Padawan specialty transfer (D-460): at the Padawan start the plan's main form starts at 0.75 x Form I.
    const pre = formXps({ ...base, age: 12, curriculum: cur });
    const post = formXps({ ...base, age: 12.0001, curriculum: cur });
    expect(post['soresu']!).toBeCloseTo(FORM_TRANSFER_SHARE * pre['shiiCho']!, 0);
    expect(post['ataru']!).toBeLessThan(0.7 * pre['shiiCho']!);
  });

  it('the Initiate Trials: Form I and Force Control rolls, and 4 of Forms II-VI at the floor (D-459)', () => {
    const def = TRIALS.initiate;
    expect(def.checks.map((c) => c.skill)).toEqual(['shiiCho', 'forceControl']);
    expect(INITIATE_TRIALS.minimums).toEqual({ shiiCho: 24, forceControl: 19 });
    const floor = def.competence!.floor;
    // Rolls that cannot fail (level 500), so only the competence decides.
    const levels = (forms: Record<string, number>) => (k: string): number => (k === 'shiiCho' || k === 'forceControl' ? 500 : (forms[k] ?? 0));
    const four = { makashi: floor, soresu: floor, ataru: floor, djemSo: floor };
    expect(rollTrial(seedRng('t'), def, levels(four), 0).passed).toBe(true);
    expect(rollTrial(seedRng('t'), def, levels({ makashi: floor, soresu: floor, ataru: floor, niman: floor - 0.1 }), 0).passed).toBe(false);
    expect(rollTrial(seedRng('t'), def, levels(four), 0).competence).toEqual({ met: 4, need: 4, floor, of: 5 });
    // Form V counts once, by its better variant; Juyo is not in the curriculum.
    expect(rollTrial(seedRng('t'), def, levels({ makashi: floor, soresu: floor, shien: floor, djemSo: floor, juyo: 99 }), 0).passed).toBe(false);
  });
});

describe('the survey covers the forms that exist at the date (D-463)', () => {
  // 3990 BBY: Djem So exists (from 4000 BBY), Ataru (3976) and Shien (3959) do not yet.
  const YEAR = -3990;
  it('the day plan rotates only through the existing forms, the hours split across them', async () => {
    const { absDayFromDate } = await import('../../src/engine/calendar');
    const { surveyGroupsAt } = await import('../../src/data/initiateCurriculum');
    expect(surveyGroupsAt(YEAR)).toEqual([['makashi'], ['soresu'], ['djemSo'], ['niman']]);
    expect(surveyGroupsAt(-4100)).toEqual([['makashi'], ['soresu'], ['niman']]);
    expect(surveyGroupsAt(-3661).flat()).toEqual(INITIATE_CURRICULUM.surveyForms.flat());
    const d0 = absDayFromDate({ year: YEAR, month: 1, day: 1 });
    const hours: Record<string, number> = {};
    for (let d = d0; d < d0 + 360; d++) for (const b of initiateSaberBlocks({ age: 11, day: d, hours: 2, level: lv(99, 99) }).blocks) hours[b.skillId] = (hours[b.skillId] ?? 0) + b.hours;
    expect(hours['ataru']).toBeUndefined();
    expect(hours['shien']).toBeUndefined();
    const total = Object.values(hours).reduce((a, b) => a + b, 0);
    expect(hours['shiiCho']! / total).toBeCloseTo(0.75, 9);
    for (const f of ['makashi', 'soresu', 'djemSo', 'niman']) expect(hours[f]! / total).toBeCloseTo(0.0625, 9);
    expect(surveyShares(YEAR)).toEqual({ shiiCho: 0.75, makashi: 0.0625, soresu: 0.0625, djemSo: 0.0625, niman: 0.0625 });
  });
  it('the closed form starts only the existing forms; the Trials need all but one of the existing groups', async () => {
    const { closedFormCurriculum } = await import('../../src/data/initiateCurriculum');
    const cur = closedFormCurriculum('jedi', YEAR)!;
    expect(cur.order).toEqual(['makashi', 'soresu', 'djemSo', 'niman']);
    const base = { formPaces: { initiate: { order: 1 } }, k: K, startAge: 4, padawanAge: 12, knightAge: 25, onePhase: false, padawanPlan: { soresu: 2, djemSo: 1 }, knightPlan: { soresu: 2, djemSo: 1 }, mult: () => 1, transferShare: FORM_TRANSFER_SHARE };
    const at11 = formXps({ ...base, age: 11, curriculum: cur });
    expect(at11['ataru'] ?? 0).toBe(0);
    expect(at11['shien'] ?? 0).toBe(0);
    expect(at11['djemSo']!).toBeGreaterThan(0);
    const { competenceOf } = await import('../../src/features/ranks/rules');
    const c = TRIALS.initiate.competence!;
    const lv3 = (k: string): number => (['makashi', 'soresu', 'djemSo'].includes(k) ? c.floor : 0);
    expect(competenceOf(c, lv3, YEAR)).toEqual({ met: 3, need: 3, floor: c.floor, of: 4 });
    expect(competenceOf(c, lv3, -3661)).toEqual({ met: 3, need: 4, floor: c.floor, of: 5 });
  });
});
