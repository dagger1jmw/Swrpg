// D-441: the holocron catalog (SW_Holocrons.md) resolved at a start year.
import { describe, expect, it } from 'vitest';
import { HOLOCRONS, holocronLine, holocronsAt } from '../../src/data/holocrons';

const at = (year: number): Map<string, string | null> => new Map(holocronsAt(year).map((h) => [h.id, h.holder]));

describe('holocron catalog', () => {
  it('has unique ids, a Legends source URL and year-ordered status events on every row', () => {
    expect(new Set(HOLOCRONS.map((h) => h.id)).size).toBe(HOLOCRONS.length);
    for (const h of HOLOCRONS) {
      expect(h.source).toMatch(/^https:\/\/starwars\.fandom\.com\/wiki\//);
      const years = h.statusEvents.map((e) => e.year);
      expect(years).toEqual([...years].sort((a, b) => a - b));
      if (h.firstAppearance === null) expect(h.statusEvents).toEqual([]);
    }
  });

  it('keeps the 15 undated rows out by default and in on request', () => {
    const undated = HOLOCRONS.filter((h) => h.firstAppearance === null);
    expect(undated).toHaveLength(15);
    const ids = new Set(holocronsAt(0).map((h) => h.id));
    for (const h of undated) expect(ids.has(h.id)).toBe(false);
    expect(holocronsAt(0, { includeUndated: true }).length).toBe(holocronsAt(0).length + 15);
  });
});

describe('holocrons at the start year (D-441)', () => {
  it('4000 BBY: the ancient holocrons, nothing made later', () => {
    const m = at(-4000);
    expect(m.get('king-adas')).toBe('King Adas, its maker');
    expect(m.get('rajivari')).toBe('Tython');
    expect(m.get('king-nakgru')).toBe('Sorzus Syn, who found it');
    expect(m.get('ductavis')).toMatch(/stored on Ossus/);
    expect(m.get('dark-holocron')).toMatch(/^Odan-Urr/);
    expect(m.get('darth-drear')).toBe('Darth Drear');
    expect(m.has('tedryn')).toBe(true);
    expect(m.get('tascollan-nebula')).toBeNull(); // first event is 7 ABY: no holder on record yet
    expect(m.has('arca-jeth')).toBe(false); // 3999
    expect(m.has('odan-urr')).toBe(false); // 3996
    expect(m.has('darth-revan')).toBe(false);
  });

  it('3661 BBY: the Great Sith War moves, the Great Galactic War entries, nothing from the Cold War', () => {
    const m = at(-3661);
    expect(m.get('dark-holocron')).toBe('Exar Kun, who stole it');
    expect(m.get('ductavis')).toMatch(/lost in the Ossus evacuation/);
    expect(m.get('odan-urr')).toBe('lost');
    expect(m.get('rajivari')).toBe('Tython'); // Nalen Raloch finds it only in 3643
    expect(m.get('darth-revan')).toBe('the Temple of the Ancients, Lehon');
    expect(m.get('darth-drear')).toBe('Darth Drear'); // destroyed 3645, later
    expect(m.get('qel-droma')).toBe('studied by Darth Malgus');
    expect(m.get('tulak-hord-ragnos')).toBe('the Tomb of Marka Ragnos, Korriban');
    for (const id of ['shining-man-vitalicron', 'darth-angral', 'master-satele', 'third-barsenthor', 'darth-nul']) expect(m.has(id)).toBe(false);
  });

  it('3630 BBY: Cold War finds resolved; Drear destroyed', () => {
    const m = at(-3630);
    expect(m.has('darth-drear')).toBe(false);
    expect(m.get('dramath')).toBe('found by Lana Beniko and the Alliance Commander');
    expect(m.get('odan-urr')).toBe('Yuon Par, who found it');
    expect(m.get('rajivari')).toMatch(/^found by the Twi'lek colonist Nalen Raloch/);
    expect(m.get('tulak-hord-ragnos')).toMatch(/former slave/);
    expect(m.get('darth-nihilus')).toMatch(/^the Lightspring, Tatooine/);
    expect(m.has('master-satele')).toBe(true);
    expect(m.has('third-barsenthor')).toBe(true);
    expect(m.has('darth-nul')).toBe(false); // 3625
  });

  it('1000 BBY: Revan destroyed by Bane; the Rule of Two holocrons; Heresies not yet found', () => {
    const m = at(-1000);
    expect(m.has('darth-revan')).toBe(false);
    expect(m.get('freedon-nadd')).toBe('Darth Bane, who found it');
    expect(m.get('syn')).toMatch(/^back with the Sith/);
    expect(m.get('belia-darzu')).toBe('her stronghold on Tython');
    expect(m.has('darth-bane')).toBe(true);
    expect(m.has('heresies')).toBe(false); // 980
    expect(m.has('tedryn')).toBe(true); // destroyed 11 ABY
    expect(m.get('odan-urr')).toBe('the Great Jedi Library, Ossus (endangered by the invasion)');
  });

  it('formats a narrator line with the side and holder', () => {
    const h = holocronsAt(-3661).find((x) => x.id === 'dark-holocron')!;
    expect(holocronLine(h)).toBe('Dark Holocron (Sith; Exar Kun, who stole it)');
    const none = holocronsAt(-3661).find((x) => x.id === 'bo-vanda')!;
    expect(holocronLine(none)).toBe("Bo Vanda's holocron (Sith; whereabouts not on record)");
  });
});
