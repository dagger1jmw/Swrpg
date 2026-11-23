// D-442, D-444: the crystal table (SW_Lightsaber_Crystals.md) and its dated limits.
import { describe, expect, it } from 'vitest';
import { CRYSTALS, crystalAvailability, crystalNameAt, crystalsAt, crystalsFromWorld } from '../../src/data/crystals';

const byId = (id: string) => CRYSTALS.find((c) => c.id === id)!;
const ids = (year: number): Set<string> => new Set(crystalsAt(year).map((c) => c.id));

describe('crystal table', () => {
  it('has the 56 rows in use (75 in the catalog less the 19 NOT USED), once each, with a source URL', () => {
    expect(CRYSTALS).toHaveLength(56);
    expect(new Set(CRYSTALS.map((c) => c.id)).size).toBe(CRYSTALS.length);
    for (const c of CRYSTALS) {
      expect(c.source).toMatch(/^https:\/\/starwars\.fandom\.com\/wiki\//);
      expect(c.item).toBe(c.kind === 'unique' ? 'named' : 'type');
      expect(['natural', 'synthetic', 'unique']).toContain(c.kind);
    }
  });

  it('leaves out every NOT USED row', () => {
    for (const id of ['katak', 'vexxtal', 'amplification', 'impact', 'incineration', 'corrosion', 'life-drain', 'blackwing', 'kenobis-legacy', 'kuns-blood', 'sunriders-destiny', 'bnars-sacrifice']) expect(CRYSTALS.some((c) => c.id === id)).toBe(false);
  });

  it('keeps the TYPE ONLY rows as natural types; Windu\'s Guile is Hurrikaine before Mace Windu\'s time', () => {
    for (const id of ['lava', 'permafrost', 'windus-guile']) expect(byId(id)).toMatchObject({ kind: 'natural', item: 'type', limits: {} });
    expect(crystalsFromWorld('Hurikane', -3661).map((c) => c.id)).toEqual(['hurrikaine', 'windus-guile']);
    expect(crystalNameAt(byId('windus-guile'), -3661)).toBe('Hurrikaine (Hurikane)');
    expect(crystalNameAt(byId('windus-guile'), 0)).toBe("Windu's Guile");
  });

  it('never gates a natural crystal by its earliest dated use (decision 1); Lambent waits for Vong contact', () => {
    for (const c of CRYSTALS.filter((x) => x.kind === 'natural' && x.id !== 'lambent')) expect(c.limits.availableFrom).toBeUndefined();
    expect(crystalsFromWorld('Dantooine', -25000).map((c) => c.id)).toContain('dantari');
    expect(crystalsFromWorld('Tython', -20000).map((c) => c.id)).toEqual(['meditation-crystal']);
    expect(ids(24).has('lambent')).toBe(false);
    expect(ids(25).has('lambent')).toBe(true);
  });

  it('gates synthetic and unique crystals by their dated year', () => {
    for (const c of CRYSTALS.filter((x) => x.kind !== 'natural')) expect(typeof c.limits.availableFrom).toBe('number');
    expect(ids(-3962).has('synthetic')).toBe(false);
    expect(ids(-3961).has('synthetic')).toBe(true);
    expect(ids(-3661).has('meetra-surik')).toBe(true);
    expect(ids(-3952).has('meetra-surik')).toBe(false);
    expect(ids(-3661).has('banes-heart')).toBe(false);
    expect(ids(-1000).has('banes-heart')).toBe(true);
  });

  it('applies lost, rare, controlled and extinct', () => {
    expect(crystalAvailability(byId('ruusan'), -1000).obtainable).toBe(true);
    expect(crystalAvailability(byId('ruusan'), -999)).toMatchObject({ obtainable: false, reason: 'lost' });
    expect(crystalAvailability(byId('eralam'), -3661)).toMatchObject({ obtainable: true, rare: true });
    expect(crystalAvailability(byId('rubat'), -3661)).toMatchObject({ obtainable: true, controlled: true });
    expect(crystalAvailability(byId('sapith'), -3661)).toMatchObject({ obtainable: true, fossilOnly: true, rare: true });
  });

  it('resolves a start year: 3661 BBY has the Old Republic set but nothing from the Empire era', () => {
    const s = ids(-3661);
    for (const id of ['adegan', 'ilum', 'dantari', 'synthetic', 'lignan', 'lorrdian-gemstone', 'heart-of-the-guardian', 'kaiburr', 'ruusan', 'lava', 'permafrost']) expect(s.has(id)).toBe(true);
    for (const id of ['compressed-energy', 'enhancement-jewel', 'lambent']) expect(s.has(id)).toBe(false);
  });
});
