// The works table, appearances and hand-set anchors (D-415; brief §3, §4).
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { APPEARANCES, WORK_BY_ID, WORKS } from '../../src/data/canon/works';

describe('the works table (D-415)', () => {
  it('each work has a kind, an ordered range and a date source; undated works are marked', () => {
    expect(new Set(WORKS.map((w) => w.id)).size).toBe(WORKS.length);
    for (const w of WORKS) {
      expect(w.fromBby, w.id).toBeGreaterThanOrEqual(w.toBby);
      expect(w.dateSource.length, w.id).toBeGreaterThan(10);
    }
    expect(WORKS.filter((w) => !w.dated).map((w) => w.id)).toEqual(expect.arrayContaining(['threat-of-peace', 'the-lost-suns']));
  });
  it('appearances name real works and roster figures, each work inside the figure\'s life', () => {
    for (const a of APPEARANCES) {
      const n = CANON_BY_ID.get(a.canonId);
      expect(n, a.canonId).toBeDefined();
      for (const x of a.works) {
        const w = WORK_BY_ID.get(x.work);
        expect(w, `${a.canonId} ${x.work}`).toBeDefined();
        // The work's years overlap the figure's life.
        expect(w!.toBby, `${a.canonId} ${x.work}`).toBeLessThanOrEqual(n!.birthBby);
        if (n!.deathBby !== undefined) expect(w!.fromBby, `${a.canonId} ${x.work}`).toBeGreaterThanOrEqual(n!.deathBby);
      }
    }
  });
});

describe('hand-set anchors first (brief §4)', () => {
  const priority = ['spindrall', 'tremel', 'karagga-the-unyielding', 'rans', 'ven-zallow', 'jace-malcom', 'zym', 'satele-shan', 'ngani-zho', 'darth-angral'];
  it('the priority figures each have an appearances entry', () => {
    for (const id of priority) expect(APPEARANCES.some((a) => a.canonId === `lore:${id}`), id).toBe(true);
  });
  it('every priority figure but Karagga has a complete anchor (hand-set, or a draft for review); each inside the figure\'s life', () => {
    for (const id of priority.filter((x) => x !== 'karagga-the-unyielding')) {
      const n = CANON_BY_ID.get(`lore:${id}`)!;
      const a = n.anchors.find((x) => x.complete);
      expect(a, id).toBeDefined();
      expect(a!.bby, id).toBeLessThan(n.birthBby);
      if (n.deathBby !== undefined) expect(a!.bby, id).toBeGreaterThanOrEqual(n.deathBby);
    }
    expect(CANON_NPCS.filter((n) => n.anchors.some((a) => a.basis === 'draft')).length).toBe(5);
  });
});

describe('dated events in the data (D-414, D-415)', () => {
  it("Warren Sedoru's war injuries weaken his Force stats from 3,654 on", async () => {
    const { eventFactor } = await import('../../src/engine/canonStats');
    const w = CANON_BY_ID.get('lore:warren-sedoru')!;
    expect(eventFactor(w, 'forceControl', 3655)).toBe(1);
    expect(eventFactor(w, 'forceControl', 3650)).toBe(0.8);
    expect(eventFactor(w, 'strength', 3650)).toBe(1);
  });
});
