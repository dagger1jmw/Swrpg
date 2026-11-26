// Crime lords: Tassaa Bareesh and Suudaa Nemro (Jared, 2026-11-25; D-509).
import { describe, expect, it } from 'vitest';
import { archetypeDef, NPC_ARCHETYPES, PATH_ARCHETYPES } from '../../src/data/archetypes';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonFigureLevelsAt, npcLevelsFor } from '../../src/features/npcs/selectors';

const day = (bby: number): number => absDayFromDate({ year: -bby, month: 1, day: 1 });

describe('crime lords (D-509)', () => {
  it('an NPC career that trains Charisma, Intelligence, Profession and Tactics', () => {
    const a = archetypeDef('crimeLord');
    expect(a.path).toBe('career');
    for (const k of ['charisma', 'intelligence', 'profession', 'tactics']) expect(a.paces.knight?.[k], k).toBeGreaterThan(0.6);
    expect(NPC_ARCHETYPES.career).toContain('crimeLord');
    expect(PATH_ARCHETYPES.career).not.toContain('crimeLord');
    // A Human crime lord of 50 against a civilian of 50.
    const gen = (archetype: string) => ({ archetype, path: 'career' as const, talents: {}, startAge: 16, warYears: 0, rank: 'career', seed: 'x', minionGrade: 1 });
    const lord = npcLevelsFor(gen('crimeLord'), 'human', 50, day(3661));
    const civ = npcLevelsFor(gen('civilian'), 'human', 50, day(3661));
    expect(lord['charisma']!).toBeGreaterThan(civ['charisma']! + 20);
    expect(lord['tactics']!).toBeGreaterThan(30);
  });
  it('Tassaa Bareesh and Suudaa Nemro are crime lords at Master in Charisma and Intelligence, 3,661 and 3,640', () => {
    for (const id of ['tassaa-bareesh', 'suudaa-nemro']) {
      const n = CANON_BY_ID.get(`lore:${id}`)!;
      expect(n.archetype).toBe('crimeLord');
      for (const bby of [3661, 3640]) {
        const l = canonFigureLevelsAt(n, bby, day(bby));
        for (const k of ['charisma', 'intelligence']) {
          expect(l[k]!, `${id} ${k} ${bby}`).toBeGreaterThanOrEqual(61);
          expect(l[k]!, `${id} ${k} ${bby}`).toBeLessThanOrEqual(80);
        }
      }
    }
  });
});
