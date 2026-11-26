// A long childhood trains no more than a Human's; Tassaa Bareesh an adult in the Cold War; Bowdaar a warrior (Jared, 2026-11-25; D-508).
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { speciesDef } from '../../src/data/species';
import { absDayFromDate } from '../../src/engine/calendar';
import { ageIntegral } from '../../src/engine/ageFactor';
import { trainingIntegral } from '../../src/engine/species';
import { canonLivedAgeAt } from '../../src/engine/canonRoster';
import { canonFigureLevelsAt, npcLevelsFor } from '../../src/features/npcs/selectors';

const day = (bby: number): number => absDayFromDate({ year: -bby, month: 1, day: 1 });
const today = day(3661);
const gen = (archetype: string, path: 'jedi' | 'career', rank: string) => ({ archetype, path, talents: {}, startAge: path === 'jedi' ? 4 : 17, warYears: 0, rank, seed: 'x', minionGrade: 1 });

describe('a long childhood trains no more than a Human child (D-508)', () => {
  it('a Hutt\'s 200 childhood years count as a Human\'s 18; a shorter childhood keeps its own', () => {
    for (const row of ['physical', 'technique', 'academic'] as const) {
      expect(trainingIntegral(speciesDef('hutt'), row, 4, 18)).toBeCloseTo(ageIntegral(row, 4, 18), 9);
      expect(trainingIntegral(speciesDef('chiss'), row, 4, 18)).toBeLessThan(ageIntegral(row, 4, 18));
    }
  });
  it('a generated Hutt Jedi Master ends near a Human Master, not at 133', () => {
    const human = npcLevelsFor(gen('jediGuardian', 'jedi', 'master'), 'human', 85, today);
    for (const age of [300, 500]) {
      const hutt = npcLevelsFor(gen('jediGuardian', 'jedi', 'master'), 'hutt', age, today);
      expect(Math.abs(hutt['soresu']! - human['soresu']!), String(age)).toBeLessThan(3);
      expect(Math.abs(hutt['forceControl']! - human['forceControl']!)).toBeLessThan(3);
      // Willpower's stop counts the same years (it stopped a Hutt child at training age 8).
      expect(Math.abs(hutt['willpower']! - human['willpower']!)).toBeLessThan(3);
    }
    const soldier = (sp: string, age: number): number => npcLevelsFor(gen('soldier', 'career', 'career'), sp, age, today)['blaster']!;
    expect(Math.abs(soldier('hutt', 400) - soldier('human', 85))).toBeLessThan(3);
  });
});

describe('the roster (D-508)', () => {
  it('Tassaa Bareesh is an adult Hutt in the Cold War, about 240 in 3,661', () => {
    const t = CANON_BY_ID.get('lore:tassaa-bareesh')!;
    expect(t.birthBby).toBe(3900);
    expect(canonLivedAgeAt(t, 3661)).toBeCloseTo(239, 0);
    expect(canonLivedAgeAt(t, 3661)).toBeGreaterThan(speciesDef('hutt').maturity);
    for (const bby of [3661, 3640]) {
      const l = canonFigureLevelsAt(t, bby, day(bby));
      expect(l['profession']!, String(bby)).toBeGreaterThan(75);
      expect(l['intelligence']!).toBeGreaterThan(50);
    }
  });
  it('Bowdaar is a melee warrior: a gladiator\'s body and blade', () => {
    const b = CANON_BY_ID.get('lore:bowdaar')!;
    expect(b.archetype).toBe('warrior');
    const l = canonFigureLevelsAt(b, 3661, today);
    expect(l['strength']).toBeGreaterThan(85);
    expect(l['melee']).toBeGreaterThan(85);
  });
});
