// Darth Karrid's drafted sheet (Jared, 2026-11-25; D-501).
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { absDayFromDate } from '../../src/engine/calendar';
import { FORM_IDS } from '../../src/data/skills';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';

const n = CANON_BY_ID.get('lore:darth-karrid')!;
const at = (id: string, bby: number): Record<string, number> => canonFigureLevelsAt(CANON_BY_ID.get(`lore:${id}`)!, bby, absDayFromDate({ year: -bby, month: 1, day: 1 }));
const best = (l: Readonly<Record<string, number>>): string => FORM_IDS.filter((f) => f !== 'jarKai').sort((a, b) => (l[b] ?? 0) - (l[a] ?? 0))[0]!;

describe("Darth Karrid's sheet", () => {
  it('is a complete sheet at her death, Willpower 86-88 and below Malgus', () => {
    const a = n.anchors.find((x) => x.complete)!;
    expect([a.bby, n.deathBby]).toEqual([3640, 3640]);
    const w = at('darth-karrid', 3640)['willpower']!;
    expect(w).toBeGreaterThanOrEqual(86);
    expect(w).toBeLessThanOrEqual(88);
    expect(w).toBeLessThan(CANON_BY_ID.get('lore:darth-malgus')!.anchors[0]!.levels['willpower']!);
  });

  it('every number is inside the range of the other Sith Inquisitor sheets', () => {
    const others = CANON_NPCS.filter((x) => x.archetype === 'sithInquisitor' && !x.fixed && x.canonId !== n.canonId).flatMap((x) => x.anchors.filter((a) => a.complete));
    const mine = n.anchors.find((x) => x.complete)!.authored!;
    for (const k of ['strength', 'agility', 'endurance', 'willpower', 'charisma', 'intelligence', 'forceSense', 'meditation', 'forceKnowledge', 'forceControl', 'forceOutput', 'forceLightning', 'telekinesis']) {
      const v = others.map((a) => a.authored![k]).filter((x): x is number => x !== undefined);
      expect(mine[k]!, k).toBeGreaterThanOrEqual(Math.min(...v));
      expect(mine[k]!, k).toBeLessThanOrEqual(Math.max(...v));
    }
  });

  it('plays as the lore has her: Niman, Force lightning, a Falleen; nobody among the top duelists', () => {
    const l = at('darth-karrid', 3640);
    expect([best(l), n.speciesId, n.archetype]).toEqual(['niman', 'falleen', 'sithInquisitor']);
    expect(l['forceLightning']).toBeCloseTo(82, 6);
    expect(l['forceControl']).toBeCloseTo(84, 6);
    expect(l['niman']).toBeCloseTo(80, 6);
    expect(l['forceSpeed']!).toBeGreaterThan(50);
    expect(Math.max(...FORM_IDS.map((f) => l[f] ?? 0))).toBeLessThan(88);
  });

  it('she grows into it: below it as a Padawan in 3,661 and a Darth in 3,649, every stat', () => {
    const young = at('darth-karrid', 3661);
    const mid = at('darth-karrid', 3649);
    const full = at('darth-karrid', 3640);
    // No Force lightning while she is a Jedi; it comes with Malgus.
    expect([young['forceLightning'], at('darth-karrid', 3658)['forceLightning']]).toEqual([0, 0]);
    for (const k of ['willpower', 'forceControl', 'forceOutput', 'niman', 'forceLightning']) {
      expect(young[k]!, k).toBeLessThan(mid[k]!);
      expect(mid[k]!, k).toBeLessThanOrEqual(full[k]!);
    }
  });
});
