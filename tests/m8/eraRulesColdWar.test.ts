// Era rules for the Cold War years (M8 checklist item 9; D-475): each rule on both sides of each boundary.
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { ERA_RULES, TREATY_COLLAPSE, TREATY_SIGNED, eraRuleHolds, eraRulesAt, type MonthDay } from '../../src/data/eraRules';
import { WORLD_NETWORK } from '../../src/data/worldNetwork';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { stateBlock } from '../../src/turn/context';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { GameState } from '../../src/state/gameState';

const EARLY: MonthDay = { month: 2, day: 1 };
const LATE: MonthDay = { month: 10, day: 1 };
const at = (bby: number, place: string | null, date: MonthDay = EARLY, factions: string[] = []): string[] => eraRulesAt(bby, place ? [place] : [], factions, date).filter((r) => !r.always && !r.id.startsWith('tython-') && r.id !== 'imperial-forces').map((r) => r.id);
const jedi = (bby: number, date: MonthDay = EARLY): string[] => at(bby, null, date, ['jediOrder']);

describe('3,653: the Treaty (3,654 vs 3,652, and either side of it)', () => {
  const pairs: [string, string[], string[]][] = [
    ['Coruscant', ['coruscant-security', 'coruscant-places'], ['coruscant-treaty', 'coruscant-security-cold-war', 'coruscant-underworld-cold-war', 'coruscant-places-cold-war', 'coruscant-temple-ruins']],
    ['Nar Shaddaa', ['nar-shaddaa-districts', 'nar-shaddaa-sis'], ['nar-shaddaa-cold-war', 'nar-shaddaa-sis']],
    ['Tatooine', ['tatooine-rule', 'tatooine-mos-ila'], ['tatooine-rule', 'tatooine-cold-war']],
    ['Korriban', ['korriban-academy'], ['korriban-academy', 'korriban-cold-war']],
  ];
  it.each(pairs)('%s', (place, war, cold) => {
    for (const b of [[3654, EARLY], [3653, EARLY], [3653, { month: 6, day: 22 }]] as const) expect(at(b[0], place, b[1]).sort(), `${b[0]}`).toEqual([...war].sort());
    for (const b of [[3653, { month: 6, day: 23 }], [3653, LATE], [3652, EARLY]] as const) expect(at(b[0], place, b[1]).sort(), `${b[0]}`).toEqual([...cold].sort());
  });
  it('Jedi life', () => {
    expect(jedi(3654)).toEqual(['jedi-life']);
    expect(jedi(3653)).toEqual(['jedi-life']);
    expect(jedi(3653, LATE)).toEqual(['jedi-homeless']);
    expect(jedi(3652)).toEqual(['jedi-homeless']);
  });
});

describe('3,650: the Temple shelved, the Order on Tython (3,651 vs 3,649)', () => {
  it('Coruscant', () => {
    expect(at(3651, 'Coruscant')).toContain('coruscant-temple-ruins');
    expect(at(3651, 'Coruscant')).not.toContain('coruscant-temple-shelved');
    for (const b of [3650, 3649]) {
      expect(at(b, 'Coruscant')).toEqual(expect.arrayContaining(['coruscant-temple-shelved', 'coruscant-jedi-remaining', 'coruscant-treaty']));
      expect(at(b, 'Coruscant')).not.toContain('coruscant-temple-ruins');
    }
  });
  it('Jedi life', () => {
    expect(jedi(3651)).toEqual(['jedi-homeless']);
    for (const b of [3650, 3649]) expect(jedi(b)).toEqual(['jedi-tython-building', 'jedi-training-cold-war', 'jedi-forge']);
  });
  it('Nar Shaddaa: the SIS bureau chief leaves; Shadow Town from 3,649', () => {
    expect(at(3651, 'Nar Shaddaa')).toContain('nar-shaddaa-sis');
    expect(at(3650, 'Nar Shaddaa')).toEqual(['nar-shaddaa-cold-war']);
    expect(at(3649, 'Nar Shaddaa')).toEqual(['nar-shaddaa-cold-war', 'nar-shaddaa-shadow-town']);
  });
  it('Tatooine and Korriban do not change here', () => {
    for (const b of [3651, 3649]) {
      expect(at(b, 'Tatooine')).toEqual(['tatooine-rule', 'tatooine-cold-war']);
      expect(at(b, 'Korriban')).toEqual(['korriban-academy', 'korriban-cold-war']);
    }
  });
});

describe('3,647: the Tython Temple is finished (3,648 vs 3,646)', () => {
  it('the Order and Tython', () => {
    expect(jedi(3648)).toEqual(['jedi-tython-building', 'jedi-training-cold-war', 'jedi-forge']);
    for (const b of [3647, 3646]) expect(jedi(b)).toEqual(['jedi-tython-temple', 'jedi-training-cold-war', 'jedi-forge']);
    expect(at(3648, 'Tython')).toContain('jedi-tython-building');
    expect(at(3646, 'Tython')).toContain('jedi-tython-temple');
  });
  it('no other rule changes', () => {
    for (const p of ['Coruscant', 'Nar Shaddaa', 'Tatooine', 'Korriban']) expect(at(3648, p), p).toEqual(at(3646, p));
  });
});

describe('mid-3,641: the Treaty collapses (early vs late)', () => {
  it('each place', () => {
    const early = (p: string) => at(3641, p, EARLY);
    const late = (p: string) => at(3641, p, LATE);
    expect(early('Coruscant')).toEqual(['coruscant-treaty', 'coruscant-security-cold-war', 'coruscant-underworld-cold-war', 'coruscant-places-cold-war', 'coruscant-temple-shelved', 'coruscant-jedi-remaining']);
    expect(late('Coruscant')).toEqual(['coruscant-places-cold-war', 'coruscant-temple-shelved']);
    expect(early('Nar Shaddaa')).toEqual(['nar-shaddaa-cold-war', 'nar-shaddaa-shadow-town', 'nar-shaddaa-shadow-syndicate']);
    expect(late('Nar Shaddaa')).toEqual([]);
    expect(early('Tatooine')).toEqual(['tatooine-rule', 'tatooine-cold-war']);
    expect(late('Tatooine')).toEqual(['tatooine-rule']);
    expect(early('Korriban')).toEqual(['korriban-cold-war', 'korriban-acolytes-late']);
    expect(late('Korriban')).toEqual([]);
  });
  it('Jedi life', () => {
    expect(jedi(3641)).toEqual(['jedi-tython-temple', 'jedi-training-cold-war']);
    expect(jedi(3641, LATE)).toEqual(['jedi-tython-temple']);
  });
  it('the last day is the day before the collapse', () => {
    expect(jedi(3641, { month: 6, day: 14 })).toContain('jedi-training-cold-war');
    expect(jedi(3641, { month: 6, day: 15 })).not.toContain('jedi-training-cold-war');
  });
  it('the Cold War versions end by 3,640; the Galactic War years are later work', () => {
    for (const p of ['Coruscant', 'Nar Shaddaa', 'Tatooine', 'Tython']) expect(at(3639, p), p).toEqual([]);
    expect(at(3639, 'Korriban')).toEqual([]);
    expect(jedi(3639)).toEqual([]);
  });
});

describe('the Korriban rule and the Academy staff', () => {
  it('runs to 3,644, the last year Tremel and Spindrall are placed there', () => {
    for (const id of ['lore:tremel', 'lore:spindrall']) expect(CANON_BY_ID.get(id)!.locations!.find((l) => l.place === 'Korriban')!.toBby, id).toBe(3644);
    expect(ERA_RULES.find((r) => r.id === 'korriban-academy')!.toBby).toBe(3644);
    expect(at(3644, 'Korriban')).toContain('korriban-academy');
    expect(at(3643, 'Korriban')).toEqual(['korriban-cold-war', 'korriban-acolytes-late']);
  });
  it('"Harkun is not on the staff" stops when the roster makes him an Overseer', () => {
    const from = CANON_BY_ID.get('lore:harkun')!.ranks.find((r) => r.title === 'Overseer')!.fromBby;
    expect(from).toBe(3655);
    expect(at(3656, 'Korriban')).toContain('korriban-not-on-staff');
    expect(at(3655, 'Korriban')).not.toContain('korriban-not-on-staff');
  });
});

describe('dates', () => {
  it('the mid-year boundaries are the world network\'s own dates', () => {
    const date = (id: string) => WORLD_NETWORK.events.find((e) => e.id === id)!.date;
    expect(date('E.3653.treaty')).toMatchObject(TREATY_SIGNED);
    expect(date('E.3641.treaty_collapse')).toMatchObject(TREATY_COLLAPSE);
  });
  it('no war rule and Cold War rule of the same place contradict each other on one day', () => {
    for (const [war, cold] of [['coruscant-security', 'coruscant-security-cold-war'], ['coruscant-places', 'coruscant-places-cold-war'], ['nar-shaddaa-districts', 'nar-shaddaa-cold-war'], ['tatooine-mos-ila', 'tatooine-cold-war'], ['jedi-life', 'jedi-homeless'], ['coruscant-temple-ruins', 'coruscant-temple-shelved'], ['jedi-homeless', 'jedi-tython-building'], ['jedi-tython-building', 'jedi-tython-temple']] as const) {
      const r = (id: string) => ERA_RULES.find((x) => x.id === id)!;
      for (let bby = 3655; bby >= 3640; bby--) for (let month = 1; month <= 12; month++) for (const day of [1, 14, 15, 22, 23]) expect(eraRuleHolds(r(war), bby, { month, day }) && eraRuleHolds(r(cold), bby, { month, day }), `${war} ${cold} ${bby}/${month}/${day}`).toBe(false);
    }
  });
  it('a year-less reading is the start of the year', () => {
    expect(eraRulesAt(3653, ['Coruscant'], []).map((r) => r.id)).toContain('coruscant-security');
    expect(eraRulesAt(3641, ['Korriban'], []).map((r) => r.id)).toContain('korriban-cold-war');
  });
  it('every rule is sourced and short', () => {
    for (const r of ERA_RULES) {
      expect(r.source.length, r.id).toBeGreaterThan(5);
      expect(r.fromBby, r.id).toBeGreaterThanOrEqual(r.toBby);
    }
    expect(new Set(ERA_RULES.map((r) => r.id)).size).toBe(ERA_RULES.length);
  });
});

describe('the state block reads the day', () => {
  const est = makeEstimator(4);
  const block = (month: number, year = -3641, place = 'Coruscant', region = 'Core Worlds'): string => {
    const start = absDayFromDate({ year, month, day: 1 });
    const s = createInitialState<GameState>(REGISTRY, { campaignId: 'era', branchId: 'b', seed: 'era', start: { day: start, second: 36_000 }, character: { name: 'T', birthDay: start - 25 * 368, path: 'career', archetype: 'smuggler', trainingStartAge: 15 } });
    return stateBlock(applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name: place, kind: 'planet', region, description: '', moveHere: true }], { source: 'ai' }).state, est).text;
  };
  it('a scene on Coruscant in early 3,641 is under the Treaty; in late 3,641 it is not', () => {
    expect(block(2)).toMatch(/Era rule: Coruscant lives under the Treaty/);
    expect(block(10)).not.toMatch(/Era rule: Coruscant lives under the Treaty/);
  });
});
