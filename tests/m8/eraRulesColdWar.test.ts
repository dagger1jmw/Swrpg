// Era rules for the Cold War years (M8 checklist item 9; D-475): each rule on both sides of each boundary.
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { ERA_RULES, TEMPLE_VOTE, TREATY_COLLAPSE, TREATY_SIGNED, eraRuleHolds, eraRulesAt, type MonthDay } from '../../src/data/eraRules';
import { WORLD_NETWORK } from '../../src/data/worldNetwork';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { stateBlock } from '../../src/turn/context';
import { controlAt } from '../../src/data/worldControl';
import { selectEraRules, selectNetworkState, selectOrderSeat } from '../../src/features/world/selectors';
import { advanceTime } from '../../src/state/advanceTime';
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
    ['Coruscant', ['coruscant-security', 'coruscant-places'], ['coruscant-treaty', 'coruscant-security-cold-war', 'coruscant-underworld-cold-war', 'coruscant-places-cold-war']],
    ['Nar Shaddaa', ['nar-shaddaa-districts', 'nar-shaddaa-sis'], ['nar-shaddaa-cold-war', 'nar-shaddaa-sis']],
    ['Tatooine', ['tatooine-rule', 'tatooine-mos-ila'], ['tatooine-rule', 'tatooine-cold-war']],
    ['Korriban', ['korriban-academy'], ['korriban-academy', 'korriban-cold-war']],
  ];
  it.each(pairs)('%s', (place, war, cold) => {
    for (const b of [[3654, EARLY], [3653, EARLY], [3653, { month: 6, day: 22 }]] as const) expect(at(b[0], place, b[1]).sort(), `${b[0]}`).toEqual([...war].sort());
    for (const b of [[3653, { month: 6, day: 23 }], [3653, LATE], [3652, EARLY]] as const) expect(at(b[0], place, b[1]).filter((r) => !r.startsWith('coruscant-temple')).sort(), `${b[0]}`).toEqual([...cold].sort());
  });
  it('Jedi life', () => {
    for (const b of [3654, 3653]) expect(jedi(b)).toEqual(['jedi-life', 'jedi-dress']);
    expect(jedi(3653, LATE)).toEqual(['jedi-dress', 'jedi-homeless']);
    expect(jedi(3652)).toEqual(['jedi-dress', 'jedi-homeless']);
  });
});

describe('3,653: the Senate shelves the Temple (D-476)', () => {
  it('a ruin from the Treaty, shelved from the vote that July, before Zym dies', () => {
    const temple = (bby: number, date: MonthDay = EARLY) => at(bby, 'Coruscant', date).filter((r) => r.startsWith('coruscant-temple'));
    expect(temple(3653)).toEqual([]);
    expect(temple(3653, { month: 7, day: 9 })).toEqual(['coruscant-temple-ruins']);
    expect(temple(3653, { month: 7, day: 10 })).toEqual(['coruscant-temple-shelved']);
    for (const b of [3652, 3651, 3650, 3649]) expect(temple(b)).toEqual(['coruscant-temple-shelved']);
    const day = (id: string) => {
      const d = WORLD_NETWORK.events.find((e) => e.id === id)!.date;
      return d.month! * 100 + (d.day ?? 1);
    };
    expect(day('E.3653.senate_blame')).toBeLessThan(day('E.3653.temple_shelved'));
    expect(day('E.3653.temple_shelved')).toBeLessThan(day('E.3653.zym'));
  });
});

describe('3,650: building begins on Tython (3,651 vs 3,649)', () => {
  it('Coruscant: some Jedi stay', () => {
    expect(at(3651, 'Coruscant')).not.toContain('coruscant-jedi-remaining');
    for (const b of [3650, 3649]) expect(at(b, 'Coruscant')).toEqual(expect.arrayContaining(['coruscant-jedi-remaining', 'coruscant-treaty']));
  });
  it('Jedi life', () => {
    expect(jedi(3651)).toEqual(['jedi-dress', 'jedi-homeless']);
    for (const b of [3650, 3649]) expect(jedi(b)).toEqual(['jedi-dress', 'jedi-tython-building', 'jedi-training-cold-war', 'jedi-forge']);
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
    expect(jedi(3648)).toEqual(['jedi-dress', 'jedi-tython-building', 'jedi-training-cold-war', 'jedi-forge']);
    for (const b of [3647, 3646]) expect(jedi(b)).toEqual(['jedi-dress', 'jedi-tython-temple', 'jedi-training-cold-war', 'jedi-forge']);
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
    expect(jedi(3641)).toEqual(['jedi-dress', 'jedi-tython-temple', 'jedi-training-cold-war']);
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
    expect(date('E.3653.temple_shelved')).toMatchObject(TEMPLE_VOTE);
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

describe('the rules follow the campaign (D-476)', () => {
  const day = (year: number, month = 1, d = 1) => absDayFromDate({ year: -year, month, day: d });
  const game = (start: number): GameState =>
    createInitialState<GameState>(REGISTRY, { campaignId: 'eraNet', branchId: 'b', seed: 'eraNet', start: { day: start, second: 36_000 }, character: { name: 'T', birthDay: start - 25 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 }, rank: 'knight' });
  const go = (s: GameState, to: number): GameState => advanceTime(REGISTRY, s, { seconds: (to - s.clock.now.day) * 86_400, reason: 't', source: 'turnDraft' }).state;
  const breakTag = (s: GameState, key: string): GameState => ({ ...s, world: { ...s.world, network: { ...selectNetworkState(s), tags: { ...selectNetworkState(s).tags, [key]: { day: s.clock.now.day, cause: 'test', toldTurn: null } } } } });
  const now = (s: GameState, place: string | null, factions: string[] = []): string[] => selectEraRules(s, place ? [place] : [], factions).filter((r) => !r.always && !r.id.startsWith('tython-') && r.id !== 'imperial-forces').map((r) => r.id);

  it('an undisturbed campaign has the lore rules, through every boundary', () => {
    let s = game(day(3655));
    for (const [y, m, d] of [[3654, 9, 1], [3653, 6, 25], [3653, 8, 1], [3652, 2, 1], [3650, 2, 1], [3647, 2, 1], [3643, 2, 1], [3641, 2, 1], [3641, 10, 1], [3640, 11, 1]] as const) {
      s = go(s, day(y, m, d));
      for (const p of ['Coruscant', 'Nar Shaddaa', 'Tatooine', 'Korriban']) {
        // The underworld's rule waits for the riots (1 July 3,653).
        const lore = at(y, p, { month: m, day: d }).filter((r) => !(y === 3653 && m === 6 && r === 'coruscant-underworld-cold-war'));
        expect(now(s, p), `${p} ${y}/${m}`).toEqual(lore);
      }
      expect(now(s, null, ['jediOrder']), `Jedi ${y}/${m}`).toEqual(at(y, null, { month: m, day: d }, ['jediOrder']));
    }
  });
  it('a campaign that starts in the Cold War has them too', () => {
    const s = game(day(3646, 5, 1));
    for (const p of ['Coruscant', 'Nar Shaddaa', 'Tatooine', 'Korriban']) expect(now(s, p), p).toEqual(at(3646, p));
    expect(now(s, null, ['jediOrder'])).toEqual(jedi(3646));
  });
  it('the Sacking fails: no Treaty, so no Cold War rule switches on and the war rules hold', () => {
    const s = go(breakTag(go(game(day(3653)), day(3653, 6, 22)), 'E.3653.sacking#cond.hold'), day(3652, 3, 1));
    expect(now(s, 'Coruscant')).toEqual(expect.arrayContaining(['coruscant-security', 'coruscant-places']));
    expect(now(s, 'Coruscant').filter((r) => /cold-war|treaty/.test(r))).toEqual([]);
    expect(now(s, 'Nar Shaddaa').filter((r) => r !== 'nar-shaddaa-sis')).toEqual(['nar-shaddaa-districts']);
    expect(now(s, 'Tatooine')).toEqual(['tatooine-rule', 'tatooine-mos-ila']);
    expect(now(s, 'Korriban')).toEqual(['korriban-academy']);
    expect(now(s, null, ['jediOrder'])).toEqual(['jedi-life', 'jedi-dress']);
    const later = go(s, day(3645));
    expect(now(later, 'Coruscant')).toEqual(expect.arrayContaining(['coruscant-security', 'coruscant-places']));
    expect(now(later, 'Nar Shaddaa')).toEqual(['nar-shaddaa-districts']);
  });
  it('the Temple is saved: the Treaty rules come, the Temple and Tython rules do not', () => {
    const s = go(breakTag(game(day(3653)), 'E.3653.temple_strike#cond.reach'), day(3649));
    expect(now(s, 'Coruscant')).toEqual(expect.arrayContaining(['coruscant-treaty', 'coruscant-security-cold-war']));
    for (const r of ['coruscant-temple-ruins', 'coruscant-temple-shelved', 'coruscant-jedi-remaining']) expect(now(s, 'Coruscant')).not.toContain(r);
    expect(now(s, null, ['jediOrder'])).toEqual(['jedi-life', 'jedi-dress']);
    expect(selectOrderSeat(s)).toBe('the Jedi Temple on Coruscant');
  });
  it('the Senate agrees to rebuild: the Order stays and lives in the Temple during repairs; Tython is found, not moved to (D-477)', () => {
    const s = go(breakTag(go(game(day(3653)), day(3653, 7, 5)), 'E.3653.temple_shelved#cond.hostile'), day(3653, 7, 20));
    for (const [y, x] of [[3653, s], [3652, go(s, day(3652, 2, 1))], [3648, go(s, day(3648))], [3645, go(s, day(3645))]] as const) {
      expect(selectOrderSeat(x), String(y)).toBe('the Jedi Temple on Coruscant (under repair)');
      expect(now(x, null, ['jediOrder']), String(y)).toEqual(['jedi-dress', 'jedi-temple-repairs']);
      expect(now(x, 'Coruscant').filter((r) => /temple|remaining/.test(r)), String(y)).toEqual(['jedi-temple-repairs']);
    }
    const net = selectNetworkState(go(s, day(3648)));
    expect([net.outcomes['O.tython_found']?.state, net.outcomes['O.order_on_tython']?.state]).toEqual(['produced', 'broken']);
  });
  it('the Order has no seat from the Treaty until it is on Tython in 3,650; before the Treaty it has the Temple', () => {
    let s = go(game(day(3655)), day(3653, 6, 1));
    expect(selectOrderSeat(s)).toBe('the Jedi Temple on Coruscant');
    for (const [y, m] of [[3653, 8], [3652, 2], [3651, 6]] as const) {
      s = go(s, day(y, m));
      expect(selectOrderSeat(s), `${y}`).toMatch(/scattered and without a seat/);
    }
    expect(selectOrderSeat(go(s, day(3650, 2)))).toMatch(/^Tython .*not finished/);
    expect(selectOrderSeat(go(s, day(3647, 2)))).toBe('the Jedi Temple on Tython');
  });
  it('a branch rule never comes from the lore dates alone', () => {
    const branches = ERA_RULES.filter((r) => r.branch);
    expect(branches.map((r) => r.id)).toEqual(['jedi-temple-repairs']);
    for (const r of branches) for (let b = 3655; b >= 3640; b--) expect(eraRuleHolds(r, b, LATE)).toBe(false);
  });
  it('the Treaty falls early or never: the Cold War rules end that day, or hold', () => {
    const s = go(game(day(3655)), day(3645, 3, 1));
    const treaty = selectNetworkState(s).outcomes['O.treaty_signed']!;
    const set = (x: GameState, state: 'produced' | 'broken', d: number): GameState => ({ ...x, world: { ...x.world, network: { ...selectNetworkState(x), outcomes: { ...selectNetworkState(x).outcomes, 'O.galactic_war': { ...treaty, state, day: d } } } } });
    expect(now(s, 'Coruscant')).toContain('coruscant-treaty');
    expect(now(set(s, 'produced', day(3645, 2, 1)), 'Korriban')).toEqual(['korriban-academy']);
    expect(now(set(s, 'produced', day(3645, 2, 1)), 'Coruscant')).not.toContain('coruscant-treaty');
    const late = { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: day(3638) } } };
    expect(now(set(late, 'broken', day(3641, 6, 15)), 'Coruscant')).toEqual(expect.arrayContaining(['coruscant-treaty', 'coruscant-security-cold-war']));
    expect(now(set(late, 'produced', day(3641, 6, 15)), 'Coruscant')).not.toContain('coruscant-treaty');
  });
  it('the links name outcomes the network produces, and every Cold War rule hangs on one', () => {
    const made = new Set(WORLD_NETWORK.events.flatMap((e) => e.produces.map((p) => p.outcome)));
    for (const r of ERA_RULES) for (const o of [...(r.dependsOn ?? []), ...(r.endsWith ? [r.endsWith] : [])]) expect(made.has(o), `${r.id} ${o}`).toBe(true);
    for (const r of ERA_RULES.filter((x) => /D-47[56]/.test(x.source) && x.fromBby <= 3653)) expect(r.dependsOn?.length, r.id).toBeGreaterThan(0);
  });
});

describe('the other answers of D-476', () => {
  it('the Exchange falls to the Shadow Syndicate c. 3,643', () => {
    expect(WORLD_NETWORK.events.find((e) => e.id === 'E.3643.exchange_out')!.date.year).toBe(-3643);
    expect(WORLD_NETWORK.events.some((e) => e.id === 'E.3653.exchange_out')).toBe(false);
  });
  it('the Hutts hold Nar Shaddaa and Nal Hutta through 3,640, tagged inferred', () => {
    for (const p of ['Nar Shaddaa', 'Nal Hutta']) {
      for (const b of [3654, 3653, 3652, 3645, 3640]) expect(controlAt([p], b).map((c) => c.side), `${p} ${b}`).toEqual(['hutts']);
      expect(controlAt([p], 3645)[0]!.inferred).toBe(true);
      expect(controlAt([p], 3639)).toEqual([]);
    }
  });
  it('Padawan dress: plain tunics and no braid through the Cold War; nothing changes on the day of the Treaty (D-477)', () => {
    for (const [b, d] of [[3661, EARLY], [3653, { month: 6, day: 22 }], [3653, { month: 6, day: 23 }], [3647, EARLY], [3641, EARLY]] as const) expect(jedi(b, d)).toContain('jedi-dress');
    expect(ERA_RULES.filter((r) => /braid/.test(r.text)).map((r) => r.id)).toEqual(['jedi-dress']);
    expect(jedi(3641, LATE)).not.toContain('jedi-dress');
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
