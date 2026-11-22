// Era 09 roster after the character redo (lore batch 19, D-391): every figure in the new lore files is in the roster,
// every roster entry is in the lore index, statuses cover everyone, and former canon IDs still resolve.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID, CANON_ERAS } from '../../src/data/canonNpcs';
import { LORE_INDEX } from '../../src/lore';

const era09 = CANON_ERAS.find((e) => e.id === 'era09')!;
const loreIds = new Set(LORE_INDEX.entities.filter((e) => /^c09p/.test(e.chunkId)).map((e) => e.canonId));

describe('Era 09 roster (lore batch 19)', () => {
  it('matches the new lore files one to one: 184 figures (183 and Ragate, D-421), each in the lore index, none twice', () => {
    const ids = era09.npcs.map((n) => n.canonId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(loreIds.size).toBe(184);
    expect(ids.filter((id) => !loreIds.has(id))).toEqual([]);
    expect([...loreIds].filter((id) => !ids.includes(id))).toEqual([]);
  });
  it('reads the new lore files, and Darth Nyriss has moved to Era 08', () => {
    expect(era09.loreFile).toBe('Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Index.md');
    expect(era09.npcs.some((n) => n.name === 'Darth Nyriss')).toBe(false);
  });
  it('every figure has rank spans (D-412), each dated and sourced, none before birth', () => {
    for (const n of era09.npcs) {
      expect(n.ranks.length, n.name).toBeGreaterThan(0);
      for (const r of n.ranks) {
        expect(r.fromBby, `${n.name} ${r.title}`).toBeLessThanOrEqual(n.birthBby);
        if (r.toBby !== undefined) expect(r.toBby, `${n.name} ${r.title}`).toBeLessThanOrEqual(r.fromBby);
        expect(r.source.length, n.name).toBeGreaterThan(0);
      }
    }
  });
  it('former canon IDs resolve to the renamed entries', () => {
    expect(CANON_BY_ID.get('lore:grand-master-zym')?.canonId).toBe('lore:zym');
    expect(CANON_BY_ID.get('lore:master-ngani-zho')?.canonId).toBe('lore:ngani-zho');
    expect(CANON_BY_ID.get('lore:grand-moff-kilran')?.canonId).toBe('lore:rycus-kilran');
    expect(CANON_BY_ID.get('lore:lord-scourge')?.canonId).toBe('lore:scourge');
  });
  it('anchors carry their date and sources; a complete anchor sets levels', () => {
    for (const n of era09.npcs) {
      for (const a of n.anchors) {
        expect(a.sources.length, n.name).toBeGreaterThan(0);
        if (a.complete) expect(Object.keys(a.levels).length, n.name).toBeGreaterThan(0);
      }
    }
  });
  it('settles the batch 7 mismatches from the new files', () => {
    const get = (id: string) => CANON_BY_ID.get(id)!;
    expect(get('lore:syo-bakarn').birthBby).toBe(3678);
    expect(get('lore:mandalore-the-lesser')).toBeDefined();
    expect(get('lore:satele-shan').ranks.find((r) => r.role === 'jediKnight')?.toBby).toBe(3652);
    expect(get('lore:darth-malgus').ranks.find((r) => r.role === 'sithAcolyte')?.toBby).toBe(3681);
    expect(get('lore:gnost-dural').ranks.map((r) => r.role)).toEqual(['initiate', 'padawan', 'jediKnight', 'jediMaster']);
    expect(get('lore:zym').note).toMatch(/Braden/);
    expect(get('lore:darth-angral').note).toMatch(/led the Sacking fleet/);
  });
});

describe('species conflicts (lore batch 21, D-399 rulings 9-13)', () => {
  const npc = (id: string) => CANON_BY_ID.get(`lore:${id}`)!;
  it('the character pages win, and each conflict is noted', () => {
    expect(npc('yuun').birthBby).toBe(3670);
    expect(npc('xalek').birthBby).toBe(3665);
    expect(npc('exal-kressh').speciesId).toBe('other'); // a Sith hybrid
    expect(npc('exal-kressh').note).toMatch(/Pureblood in its Cold War section \[conflict\]/);
    for (const id of ['yuun', 'xalek', 'broonmark', 'ula-vii']) expect(npc(id).facts?.conflicts, id).toMatch(/\[conflict\]/);
  });
});
