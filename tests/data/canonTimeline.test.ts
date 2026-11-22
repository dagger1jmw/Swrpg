// The date-agnostic roster (D-412): dated rank, status and location spans, queried at the campaign date.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { ROLE_MIN_AGE } from '../../src/data/npcGen.config';
import { FACTION_LEADERS, leadersAt } from '../../src/data/worldControl';
import { canonBoardAt, canonFactionAt, canonLivedAgeAt, canonOffBoard, canonRankAt, canonRoleAt } from '../../src/engine/canonRoster';

const get = (id: string) => CANON_BY_ID.get(`lore:${id}`)!;
const DATES = [3681, 3667, 3661, 3653, 3643, 3640, 3630];

describe('rank spans (D-412)', () => {
  it('every rank starts at an age the role allows, and a first Padawan or acolyte span starts by 30 (adult converts noted)', () => {
    const bad: string[] = [];
    for (const n of CANON_NPCS) {
      // On record younger than the role minimum: Thanaton a Lord and Darth from 3,678 (born 3,695, lore); the Barsen'thor
      // made a Master by the Council in the game's story (3,640).
      const early = ['lore:darth-thanaton', 'lore:the-barsenthor'];
      for (const r of n.ranks) {
        const age = n.birthBby - r.fromBby;
        if (age < (ROLE_MIN_AGE[r.role] ?? 0) && !early.includes(n.canonId)) bad.push(`${n.name}: ${r.title} at ${age}`);
      }
      const first = n.ranks.find((r) => r.role === 'padawan' || r.role === 'sithAcolyte');
      const converts = ['lore:sajar', 'lore:praven'];
      if (first && !converts.includes(n.canonId) && n.birthBby - first.fromBby > 30) bad.push(`${n.name}: first ${first.title} at ${n.birthBby - first.fromBby}`);
    }
    expect(bad).toEqual([]);
  });
  it('an estimated birth year carries its basis', () => {
    for (const n of CANON_NPCS) if (n.birthSource === 'estimate') expect(n.birthBasis, n.name).toBeTruthy();
  });
  it('the offices match the leaders table', () => {
    for (const bby of DATES) {
      for (const l of leadersAt(bby)) {
        const n = CANON_NPCS.find((x) => x.ranks.some((r) => r.source.startsWith(`${l.office}:`) && r.fromBby === l.fromBby));
        if (n) expect(canonRankAt(n, bby)?.title, `${n.name} ${bby}`).toMatch(/Grand Master|Chancellor|Supreme Commander|Mandalore|Emperor/);
      }
    }
    expect(FACTION_LEADERS.length).toBeGreaterThan(0);
  });
});

describe('the brief\'s corrections (§4)', () => {
  it('over-ranked in 3,661: Lana a youth, Karrid a Jedi Padawan, Yuon Par and Aryn Knights, Sedoru a Knight, Harkun not in post', () => {
    expect(get('lana-beniko').birthBby - 3661).toBeLessThan(18);
    expect(canonRankAt(get('lana-beniko'), 3661)).toBeNull();
    expect(canonRankAt(get('lana-beniko'), 3637)?.title).toBe('Sith Lord');
    expect(canonRankAt(get('darth-karrid'), 3661)?.title).toBe('Padawan');
    expect(canonFactionAt(get('darth-karrid'), 3661)).toBe('jediOrder');
    expect(canonRankAt(get('darth-karrid'), 3640)?.title).toBe('Darth');
    expect(canonFactionAt(get('darth-karrid'), 3640)).toBe('sithEmpire');
    expect(canonRoleAt(get('yuon-par'), 3661)).toBe('jediKnight');
    expect(canonRoleAt(get('yuon-par'), 3643)).toBe('jediMaster');
    expect(canonRoleAt(get('aryn-leneer'), 3661)).toBe('jediKnight');
    expect(canonRoleAt(get('aryn-leneer'), 3653)).toBe('jediKnight');
    expect(canonRoleAt(get('warren-sedoru'), 3661)).toBe('jediKnight');
    expect(canonRoleAt(get('warren-sedoru'), 3642)).toBe('jediMaster');
    expect(canonRankAt(get('harkun'), 3661)?.title).not.toBe('Overseer');
    expect(canonRankAt(get('harkun'), 3643)).toMatchObject({ title: 'Overseer', role: 'official' });
  });
  it('Parkanas Tark is no 25-year-old Padawan: lost on Malachor III in 3,661, Lord Vivicar when he returns', () => {
    expect(canonOffBoard(get('parkanas-tark'), 3661)).toBe('unavailable');
    expect(canonRankAt(get('parkanas-tark'), 3643)?.title).toBe('Lord Vivicar');
    expect(canonOffBoard(get('parkanas-tark'), 3643)).toBeNull();
  });
  it('plausible birth years: Tremel an Overseer from 3,681 at 35, Ikoral a Darth, the Caderas older, Rusk from the planets file', () => {
    expect(get('tremel').birthBby - 3681).toBeGreaterThanOrEqual(30);
    expect(canonRankAt(get('darth-ikoral'), 3661)?.title).toBe('Darth');
    expect(get('braden').birthBby).toBeGreaterThan(3686);
    expect(get('jicoln-cadera').birthBby).toBeGreaterThan(3686);
    expect(get('fideltin-rusk')).toMatchObject({ birthBby: 3680, birthSource: 'lore' });
    expect(get('darth-vich').birthBby).toBeGreaterThan(get('darth-vich').deathBby!);
  });
  it('Khem Val is a warrior in stasis until the Cold War; Broonmark a warrior, not an official', () => {
    const k = get('khem-val');
    expect(canonRoleAt(k, 3661)).toBe('other');
    expect(canonOffBoard(k, 3661)).toBe('unavailable');
    expect(canonOffBoard(k, 3643)).toBeNull();
    expect(canonLivedAgeAt(k, 3643)).toBeLessThan(600);
    expect(canonRoleAt(get('broonmark'), 3643)).toBe('other');
  });
  it('Galena Rans and Rans are two people: she married the Supreme Commander', () => {
    expect(get('galena-rans').speciesId).not.toBe(get('rans').speciesId);
  });
});

describe('the board by date (D-412)', () => {
  it('the board changes with the date, not a snapshot', () => {
    const sizes = DATES.map((d) => canonBoardAt(d).length);
    for (const s of sizes) expect(s).toBeGreaterThan(40);
    expect(new Set(sizes).size).toBeGreaterThan(3);
  });
  it('on and off by the spans at each date', () => {
    const on = (id: string, bby: number) => canonOffBoard(get(id), bby) === null;
    expect(on('kao-cen-darach', 3681)).toBe(true);
    expect(on('kao-cen-darach', 3667)).toBe(false);
    expect(on('raptus', 3669)).toBe(true);
    expect(canonOffBoard(get('raptus'), 3661)).toBe('imprisoned');
    expect(on('raptus', 3640)).toBe(true);
    expect(on('emperor-wrath', 3653)).toBe(false);
    expect(on('emperor-wrath', 3643)).toBe(true);
    expect(on('nico-okarr', 3661)).toBe(false);
    expect(on('nico-okarr', 3630)).toBe(true);
    expect(on('darth-malgus', 3630)).toBe(false);
    expect(canonRankAt(get('satele-shan'), 3681)?.title).toBe('Padawan');
    expect(canonRankAt(get('satele-shan'), 3661)?.title).toBe('Jedi Knight');
    expect(canonRankAt(get('satele-shan'), 3643)?.title).toBe('Grand Master');
    expect(canonRankAt(get('zym'), 3661)?.title).toBe('Grand Master');
    expect(canonRankAt(get('darth-marr'), 3661)?.title).toBe('Dark Councilor');
  });
  it('an exiled figure stays on the board', () => {
    expect(canonOffBoard(get('tasiele-shan'), 3661)).toBeNull();
  });
});
