// D-442: the crystal table (SW_Lightsaber_Crystals.md) and its dated limits.
import { describe, expect, it } from 'vitest';
import { CRYSTALS, crystalAvailability, crystalsAt, crystalsFromWorld } from '../../src/data/crystals';

const byId = (id: string) => CRYSTALS.find((c) => c.id === id)!;
const ids = (year: number): Set<string> => new Set(crystalsAt(year).map((c) => c.id));

describe('crystal table', () => {
  it('has every catalog row once, with a source URL; unique rows are named items, the rest types', () => {
    expect(CRYSTALS).toHaveLength(75);
    expect(new Set(CRYSTALS.map((c) => c.id)).size).toBe(CRYSTALS.length);
    for (const c of CRYSTALS) {
      expect(c.source).toMatch(/^https:\/\/starwars\.fandom\.com\/wiki\//);
      expect(c.item).toBe(c.kind === 'unique' ? 'named' : 'type');
    }
  });

  it('never gates a natural crystal by its earliest dated use (decision 1)', () => {
    for (const c of CRYSTALS.filter((x) => x.kind === 'natural' && x.id !== 'blackwing')) expect(c.limits.availableFrom).toBeUndefined();
    // Dantari first appears in KOTOR (3956) but is obtainable on Dantooine at any date.
    expect(crystalsFromWorld('Dantooine', -25000).map((c) => c.id)).toContain('dantari');
    expect(crystalsFromWorld('Tython', -20000).map((c) => c.id)).toEqual(['meditation-crystal']);
  });

  it('gates synthetic, unique and unknown-origin crystals by their dated year', () => {
    for (const c of CRYSTALS.filter((x) => x.kind !== 'natural')) expect(typeof c.limits.availableFrom).toBe('number');
    expect(ids(-3962).has('synthetic')).toBe(false);
    expect(ids(-3961).has('synthetic')).toBe(true);
    expect(ids(-3661).has('meetra-surik')).toBe(true);
    expect(ids(-3952).has('meetra-surik')).toBe(false);
    expect(ids(-3661).has('banes-heart')).toBe(false);
    expect(ids(-1000).has('banes-heart')).toBe(true);
    expect(ids(-3661).has('kenobis-legacy')).toBe(false);
    expect(ids(0).has('kenobis-legacy')).toBe(true);
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
    for (const id of ['adegan', 'ilum', 'dantari', 'synthetic', 'lignan', 'lorrdian-gemstone', 'heart-of-the-guardian', 'kaiburr', 'ruusan']) expect(s.has(id)).toBe(true);
    for (const id of ['compressed-energy', 'katak', 'impact', 'blackwing', 'enhancement-jewel', 'kuns-blood']) expect(s.has(id)).toBe(false);
  });
});
