// Canon figures' stats with the real closed form (D-414): anchors, rank-shaped growth, generated lines.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import type { CanonNpc } from '../../src/data/canon/types';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';

const get = (id: string) => CANON_BY_ID.get(`lore:${id}`)!;
const day = (bby: number) => absDayFromDate({ year: -bby, month: 1, day: 1 });
const at = (n: CanonNpc, bby: number) => canonFigureLevelsAt(n, bby, day(bby));

describe('canon figures at any date (D-414)', () => {
  it('Satele Shan at three ages: a Padawan at Korriban (3,681), a Knight (3,661), her Galactic War sheet (3,643)', () => {
    const s = get('satele-shan');
    const sheet = s.anchors.find((a) => a.complete)!;
    const [a81, a61, a43] = [at(s, 3681), at(s, 3661), at(s, sheet.bby)];
    expect(a43.ataru).toBeCloseTo(sheet.levels.ataru!, 5);
    expect(a81.ataru!).toBeLessThan(a61.ataru!);
    expect(a61.ataru!).toBeLessThan(a43.ataru!);
    expect(a81.ataru!).toBeLessThan(70);
  });
  it('rank spans shape the curve: the Padawan years follow the Padawan phase, well below the Master sheet', () => {
    const s = get('satele-shan');
    const sheet = s.anchors.find((a) => a.complete)!.levels.ataru!;
    const lateKnight: CanonNpc = { ...s, ranks: s.ranks.map((r) => (r.role === 'jediKnight' ? { ...r, fromBby: 3667 } : r.role === 'padawan' ? { ...r, toBby: 3668 } : r)) };
    expect(at(lateKnight, 3670).ataru!).not.toBeCloseTo(at(s, 3670).ataru!, 1);
    expect(at(s, 3678).ataru!).toBeLessThan(0.75 * sheet);
  });
  it('a figure with no anchor gets a generated line from archetype and rank at the date, growing with the ranks', () => {
    const y = get('yuon-par');
    expect(y.anchors).toEqual([]);
    const pad = at(y, 3675);
    const knight = at(y, 3655);
    const master = at(y, 3643);
    expect(Object.keys(knight).length).toBeGreaterThan(5);
    expect(pad.forceControl!).toBeLessThan(knight.forceControl!);
    expect(knight.forceControl!).toBeLessThan(master.forceControl!);
  });
  it('fixed figures (Vitiate) keep their sheet at any date, over the generated line (D-494)', () => {
    const v = get('vitiate');
    expect(at(v, 3681)).toEqual(at(v, 3645));
    for (const [k, x] of Object.entries(v.anchors[0]!.levels)) expect(at(v, 3681)[k]!, k).toBeGreaterThanOrEqual(Math.min(x, 80));
    for (const k of ['forceControl', 'forceOutput', 'willpower', 'makashi', 'telekinesis']) expect(at(v, 3681)[k], k).toBe(v.anchors[0]!.levels[k]);
  });
});
