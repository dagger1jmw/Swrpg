// Long life counts for the mind; a species' strength in growth (Jared, 2026-11-25; D-507).
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { LIFE_EXPERIENCE } from '../../src/data/npcHours';
import { speciesDef } from '../../src/data/species';
import { absDayFromDate } from '../../src/engine/calendar';
import { lifeExperience } from '../../src/engine/npcHours';
import { naturalLevel } from '../../src/engine/species';
import { canonFigureLevelsAt, npcLevelsFor } from '../../src/features/npcs/selectors';

const day = (bby: number): number => absDayFromDate({ year: -bby, month: 1, day: 1 });
const today = day(3661);
const gen = (archetype: string, path: 'jedi' | 'career', rank = path === 'jedi' ? 'master' : 'career') => ({ archetype, path, talents: {}, startAge: path === 'jedi' ? 4 : 17, warYears: 0, rank, seed: 'x', minionGrade: 1 });
const at = (id: string, bby: number): Record<string, number> => canonFigureLevelsAt(CANON_BY_ID.get(`lore:${id}`)!, bby, day(bby));

describe('long life counts for the mind (D-507)', () => {
  it('training years run from the start of training or adulthood: a Hutt\'s long childhood does not use up the allowance', () => {
    const hutt = npcLevelsFor(gen('jediGuardian', 'jedi'), 'hutt', 400, today)['soresu']!;
    const human = npcLevelsFor(gen('jediGuardian', 'jedi'), 'human', 85, today)['soresu']!;
    expect(hutt).toBeGreaterThanOrEqual(human);
    // The career that starts as an adult stops after the Human's years too.
    expect(npcLevelsFor(gen('soldier', 'career'), 'hutt', 800, today)['blaster']).toBeCloseTo(npcLevelsFor(gen('soldier', 'career'), 'hutt', 500, today)['blaster']!, 6);
  });
  it('past the stop: mind and social stats only, by real years, toward Master, capped, never down', () => {
    const hutt = speciesDef('hutt');
    expect(lifeExperience(hutt, 'strength', 40, 600)).toBe(0);
    expect(lifeExperience(hutt, 'soresu', 40, 600)).toBe(0);
    expect(lifeExperience(hutt, 'blaster', 40, 600)).toBe(0);
    expect(lifeExperience(hutt, 'charisma', 40, 250)).toBe(0);
    expect(lifeExperience(hutt, 'charisma', 40, 400)).toBeGreaterThan(0);
    expect(lifeExperience(hutt, 'charisma', 40, 600)).toBeGreaterThan(lifeExperience(hutt, 'charisma', 40, 400));
    expect(lifeExperience(hutt, 'charisma', 40, 5000)).toBe(LIFE_EXPERIENCE.cap);
    expect(lifeExperience(hutt, 'charisma', 50, 5000)).toBeCloseTo(LIFE_EXPERIENCE.target - 50, 6);
    expect(lifeExperience(hutt, 'intelligence', 79, 600)).toBe(0);
    expect(lifeExperience(hutt, 'tactics', 0, 600)).toBe(0);
    expect(lifeExperience(speciesDef('human'), 'charisma', 40, 110)).toBe(0);
  });
  it('Suudaa Nemro, a Hutt crime lord, is at Master in Charisma and Intelligence; his body and arms stay stopped', () => {
    for (const bby of [3661, 3641]) {
      const n = at('suudaa-nemro', bby);
      for (const k of ['charisma', 'intelligence']) {
        expect(n[k]!, `${k} ${bby}`).toBeGreaterThanOrEqual(61);
        expect(n[k]!, `${k} ${bby}`).toBeLessThanOrEqual(80);
      }
    }
    expect(at('suudaa-nemro', 3661)['strength']).toBeLessThan(80);
    // Bowdaar, a warrior since D-508: his Intelligence grows with the years, his body does not.
    expect(at('bowdaar', 3641)['intelligence']).toBeGreaterThan(at('bowdaar', 3681)['intelligence']!);
    expect(at('bowdaar', 3641)['strength']).toBeCloseTo(at('bowdaar', 3681)['strength']!, 0);
  });
});

describe('a species\' strength reaches growth (D-507)', () => {
  it('the edge is in the natural baseline: half the ceiling, so a Wookiee at peak starts 20 over a Human', () => {
    expect(naturalLevel('strength', 'wookiee', 200)).toBeCloseTo(60, 6);
    expect(naturalLevel('strength', 'human', 30)).toBeCloseTo(40, 6);
  });
  it('a Wookiee ends stronger than a Human with the same training, on every path', () => {
    for (const [a, p] of [['civilian', 'career'], ['warrior', 'career'], ['soldier', 'career'], ['jediGuardian', 'jedi']] as const)
      for (const age of [30, 40, 60]) {
        const w = npcLevelsFor(gen(a, p), 'wookiee', age, today)['strength']!;
        const h = npcLevelsFor(gen(a, p), 'human', age, today)['strength']!;
        expect(w, `${a} ${age}`).toBeGreaterThan(h + 8);
      }
  });
});
