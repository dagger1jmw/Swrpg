// M7, the playable 3,661 BBY start (D-400): the default start date, who is on the board, who controls what, and the
// species offered. Lore tests use the real lore year.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { speciesOfferedAt } from '../../src/data/species';
import { controlAt, leadersAt, WORLD_CONTROL } from '../../src/data/worldControl';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonBoardAt, canonOffBoard } from '../../src/engine/canonRoster';
import { xpForLevel } from '../../src/engine/curve';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { DEFAULT_START_AGE, DEFAULT_START_DATE } from '../../src/turn/campaign';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { stateBlock } from '../../src/turn/context';

const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const fresh = (year: number): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: at(year), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(year) - 14 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(20) },
    rank: 'padawan',
  });
const board = new Set(canonBoardAt(3661).map((n) => n.canonId));
const off = (id: string) => canonOffBoard(CANON_BY_ID.get(`lore:${id}`)!, 3661);

describe('the default start (D-400)', () => {
  it('opens on 1 January 3,661 BBY with a 14-year-old', () => {
    expect(DEFAULT_START_DATE).toEqual({ year: -3661, month: 1, day: 1 });
    expect(DEFAULT_START_AGE).toBe(14);
  });
});

describe('who is on the board in 3,661 BBY (lore batches 13-21)', () => {
  it('active and date-placed figures are on it, children as children', () => {
    for (const id of ['zym', 'satele-shan', 'darth-malgus', 'darth-marr', 'ngani-zho', 'theron-shan', 'mandalore-the-lesser', 'orgus-din', 'gnost-dural', 'darth-angral']) {
      expect(board.has(`lore:${id}`), id).toBe(true);
    }
  });
  it('the dead, the unborn, the imprisoned and the lost are off it, with the reason', () => {
    expect(off('kao-cen-darach')).toBe('dead'); // 3681
    expect(off('belth-allusis')).toBe('dead'); // 3671
    expect(off('dread-masters')).not.toBeNull(); // on Belsavis since 3668
    expect(off('wyellett')).toBe('unavailable'); // lost at Hoth, 3665-3642 (D-379)
    expect(off('mandalore-the-vindicated')).toBeNull(); // Artus Lok is alive, not yet Mandalore
    expect(off('torian-cadera')).toBe('unborn'); // c. 3660
    expect(off('hero-of-tython')).toBe('unavailable'); // Cold War protagonists, out of the 3681-3653 setting (D-378 [9])
    expect(off('the-barsenthor')).toBe('unavailable');
  });
  it('the narrator cannot link an NPC to an off-board figure: it stays a story NPC, with the reason', () => {
    let s = fresh(-3661);
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Kao Cen Darach', species: 'zabrak', faction: 'jediOrder', role: 'jediMaster', ageApprox: 60, description: '' }], { source: 'ai' }).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Kao Cen Darach')!.id;
    const r = applyEvents(REGISTRY, s, [{ type: 'npcCanonLinked', npcRef: id, canonId: 'lore:kao-cen-darach' }], { source: 'engine' });
    expect(r.state.npcs.byId[id]!.canonId).toBeNull();
    expect(JSON.stringify(r)).toMatch(/Kao Cen Darach is dead in 3,661 BBY/);
    const z = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Zym', species: 'kelDor', faction: 'jediOrder', role: 'jediMaster', ageApprox: 120, description: '' }], { source: 'ai' }).state;
    const zid = Object.values(z.npcs.byId).find((n) => n.name === 'Zym')!.id;
    expect(applyEvents(REGISTRY, z, [{ type: 'npcCanonLinked', npcRef: zid, canonId: 'lore:zym' }], { source: 'engine' }).state.npcs.byId[zid]!.canonId).toBe('lore:zym');
  });
});

describe('who controls what in 3,661 BBY (D-400)', () => {
  const side = (place: string, bby = 3661) => controlAt([place], bby).map((c) => c.side);
  it('the places the lore states', () => {
    expect(side('Coruscant')).toEqual(['republic']);
    expect(side('Korriban')).toEqual(['sithEmpire']);
    expect(side('Hydian Way')).toEqual(['mandalorians']);
    expect(side('Hydian Way', 3660)).toEqual([]); // broken in 3,660
    expect(side('Nar Shaddaa')).toEqual(['hutts']);
    expect(side('Balmorra')).toEqual(['contested']);
    expect(side('Geonosis')).toEqual(['contested']);
    expect(side('Tython')).toEqual(['unknown to the galaxy']);
    expect(controlAt(['Ryloth'], 3661)[0]!.inferred).toBe(true);
    expect(side('Dantooine')).toEqual([]); // not stated: left blank (D-399 [18])
  });
  it('matches a place inside a longer location name, and the Coruscant Sacking year', () => {
    expect(side('Jedi Temple, Coruscant')).toEqual(['republic']);
    expect(side('Coruscant', 3653)).toEqual(['sithEmpire']);
  });
  it('the leaders in office', () => {
    const l = leadersAt(3661).map((x) => `${x.office}: ${x.holder}`);
    expect(l).toEqual(expect.arrayContaining(['Grand Master of the Jedi Order: Zym', 'Supreme Chancellor: Berooken', 'Mandalore: Mandalore the Lesser (backed by Imperial Intelligence)']));
    expect(leadersAt(3651).map((x) => x.holder)).toContain('Satele Shan');
  });
  it('every entry has a source and a valid span', () => {
    for (const c of WORLD_CONTROL) {
      expect(c.source.length, c.place).toBeGreaterThan(0);
      expect(c.fromBby, c.place).toBeGreaterThanOrEqual(c.toBby);
    }
  });
  it('the narrator sees the leaders and the current place\'s control', () => {
    let s = fresh(-3661);
    s = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: '', moveHere: true }], { source: 'ai' }).state;
    const text = stateBlock(s, makeEstimator(4)).text;
    expect(text).toMatch(/Leaders: .*Grand Master of the Jedi Order: Zym \[inferred\]/);
    expect(text).toMatch(/Control: Coruscant: republic \(the Republic capital/);
    expect(text).toMatch(/Jedi Order: the Jedi Temple on Coruscant/);
  });
});

describe('species at a 3,661 BBY start (lore batch 21)', () => {
  it('36 offered, the Voss and the Kaleesh not yet (D-402 [10])', () => {
    expect(speciesOfferedAt(-3661)).toHaveLength(36);
    expect(speciesOfferedAt(-3661).some((s) => s.id === 'voss')).toBe(false);
  });
});
