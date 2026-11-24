// The world-event tag network's engine (M8 Phase A, D-466), on a made-up fixture: substitution, divergence, the ripple,
// the freeze, plot points, convergence, guards, the hand-off and the save.
import { describe, expect, it } from 'vitest';
import type { ControlSpan, LeaderSpan } from '../../src/data/worldControl';
import type { OrderSeat } from '../../src/data/orderSeats';
import { WORLD_NETWORK, type WorldNetwork } from '../../src/data/worldNetwork';
import { GUARD_RULES, STRENGTH_POINTS } from '../../src/data/worldNetwork.config';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { absDayFromDate, SECONDS_PER_DAY } from '../../src/engine/calendar';
import { datedFactsAt, type OutcomeState } from '../../src/engine/datedFacts';
import { canonFactionAt, canonRoleAt } from '../../src/engine/canonRoster';
import { makeWorldFeature } from '../../src/features/world';
import { handoffLines, selectControl, selectLeaders, selectNetworkState, selectOrderSeat, selectTimelineHandoff, selectWorldIdsToTell } from '../../src/features/world/selectors';
import { controlNow, outcomeState, recordAction, reviewNetwork, type WorldAction, type WorldFacts } from '../../src/features/world/network';
import { networkProblems, worldNetworkSchema } from '../../src/features/world/networkSchema';
import { emptyNetworkState, type NetworkState } from '../../src/features/world/world';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { Registry } from '../../src/state/types';
import { FIXTURE } from '../support/worldFixture';

const at = (year: number, month = 1, day = 1): number => absDayFromDate({ year, month, day });
/** The full registry over a network. */
const fullRegistry = (net: WorldNetwork): Registry<GameState> => REGISTRY.map((f) => (f.id === 'world' ? makeWorldFeature(net) : f));
/** ...with only the world's time hook, so years pass quickly (the other features' day loops are not under test). */
const registryFor = (net: WorldNetwork): Registry<GameState> =>
  fullRegistry(net).map((f) => {
    if (f.id === 'world') return f;
    const { onTimeAdvanced: _hook, ...rest } = f;
    return rest;
  });
const REG = registryFor(FIXTURE);
const game = (day = at(-3655), reg = REG): GameState =>
  createInitialState<GameState>(reg, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day, second: 8 * 3600 },
    character: { name: 'Kael', birthDay: day - 20 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    rank: 'padawan',
  });
const go = (s: GameState, day: number, reg = REG): GameState => advanceTime(reg, s, { seconds: Math.max(0, day * SECONDS_PER_DAY + 8 * 3600 - (s.clock.now.day * SECONDS_PER_DAY + s.clock.now.second)), reason: 'test', source: 'turnDraft' }).state;
const engine = (s: GameState, ...events: unknown[]): GameState => {
  const r = applyEvents(REG, s, events, { source: 'engine' });
  expect(r.rejected).toEqual([]);
  return r.state;
};
/** A canon figure met and linked, as play does it. */
const meet = (s: GameState, canonId: string): { s: GameState; id: string } => {
  const c = CANON_BY_ID.get(canonId)!;
  let next = applyEvents(REG, s, [{ type: 'npcIntroduced', name: c.name, species: 'human', faction: 'sithEmpire', role: 'sithLord', ageApprox: 50, description: '' }], { source: 'ai' }).state;
  const id = Object.values(next.npcs.byId).find((n) => n.name === c.name)!.id;
  next = engine(next, { type: 'npcCanonLinked', npcRef: id, canonId });
  expect(next.npcs.byId[id]!.canonId).toBe(canonId);
  return { s: next, id };
};
const kill = (s: GameState, canonId: string): GameState => {
  const m = meet(s, canonId);
  return engine(m.s, { type: 'npcDied', npcRef: m.id, cause: 'test' });
};
const net = (s: GameState): NetworkState => selectNetworkState(s, FIXTURE);
const status = (s: GameState, id: string): string | undefined => net(s).events[id]?.status;
const outcome = (s: GameState, id: string): OutcomeState => outcomeState(FIXTURE, net(s), id);
/** The flag a scene outcome sets (engine only): a major fact against the medium guard of the strike's secret. */
const exposed = (s: GameState): GameState => engine(s, { type: 'flagSet', flag: 'sceneOutcome:strike-plan' });

const AFTER_STRIKE = at(-3655, 3, 12);

describe('the schema', () => {
  it('the fixture and the shipped network pass every check', () => {
    expect(networkProblems(FIXTURE)).toEqual([]);
    expect(networkProblems(WORLD_NETWORK)).toEqual([]);
  });

  it('refuses unknown references, AI-settable flags, open-ended tests, unguarded high conditions and loops', () => {
    const strike = FIXTURE.events[1]!;
    const bad = (e: unknown, more: Partial<WorldNetwork> = {}): string => networkProblems({ ...FIXTURE, events: [...FIXTURE.events, e as never], ...more }).join('\n');
    const x = { ...strike, id: 'E.3649.x', produces: [], roles: [], conditions: [], consumes: [] };
    const cond = { id: 'cond.x', text: 't', brokenText: 'b', crucial: true, guard: 'low' };
    expect(bad({ ...x, consumes: [{ outcome: 'O.nothing', required: true }] })).toMatch(/consumes O.nothing, which nothing produces/);
    expect(bad({ ...x, conditions: [{ ...cond, breakIf: [{ kind: 'flag', flag: 'metCouncil' }] }] })).toMatch(/flag metCouncil can be set by the AI/);
    expect(bad({ ...x, conditions: [{ ...cond, breakIf: [{ kind: 'flag', flag: 'noSuchFlag' }] }] })).toMatch(/unregistered flag/);
    expect(bad({ ...x, conditions: [{ ...cond, breakIf: [{ kind: 'flag', flag: 'sceneOutcome:nobody' }] }] })).toMatch(/no scene sets sceneOutcome:nobody/);
    expect(bad({ ...x, conditions: [{ ...cond, breakIf: [{ kind: 'known', tag: 'E.3655.strike#cond.secret' }] }] })).toMatch(/has no foreknowledge to have/);
    // A very high guard: two distinct prerequisites; one, none, or the same step twice will not do.
    const step = (id: string, place: string): unknown => ({ id, text: 't', tests: [{ kind: 'action', actionTypes: ['investigate'], places: [place] }], leads: [{ places: [place] }] });
    expect(bad({ ...x, conditions: [{ ...cond, breakIf: [{ kind: 'action', actionTypes: ['investigate'], places: ['Ziost'] }] }] })).toMatch(/an action on a place needs a lead recorded in play/);
    const vh = (prerequisites: unknown[]): string => bad({ ...x, conditions: [{ ...cond, guard: 'veryHigh', breakIf: [{ kind: 'npc', canonId: 'lore:zym', state: 'dead', strength: 'decisive' }], ...(prerequisites.length ? { prerequisites } : {}) }] });
    for (const p of [[], [step('know.a', 'Ziost')], [step('know.a', 'Ziost'), step('know.b', 'Ziost')]]) expect(vh(p)).toMatch(/needs 2 distinct prerequisites/);
    expect(vh([step('know.a', 'Ziost'), step('know.b', 'Korriban')])).toBe('');
    expect(bad({ ...x, conditions: [{ ...cond, breakIf: [{ kind: 'action', actionTypes: ['investigate'] }] }] })).toMatch(/needs a place or a person/);
    expect(bad({ ...x, conditions: [{ ...cond, guard: 'high', breakIf: [{ kind: 'action', actionTypes: ['investigate'], places: ['Coruscant'] }] }] })).toMatch(/needs a prerequisite/);
    expect(bad({ ...x, produces: [{ outcome: 'O.city_taken' }] })).toMatch(/produced twice/);
    expect(bad({ ...x, roles: [{ id: 'role.a', label: 'a', kind: 'replaceable', canonId: 'lore:darth-marr' }], produces: [{ outcome: 'O.x', when: { intact: ['role.a'] } }] })).toMatch(/not a crucial role/);
    expect(bad({ ...x, guard: 1 })).toMatch(/schema/);
    // An alternative can never bring back what the recorded timeline produces.
    const pp = FIXTURE.plotPoints[0]!;
    expect(networkProblems({ ...FIXTURE, plotPoints: [{ ...pp, alternatives: [{ ...pp.alternatives[0]!, effects: { produces: ['O.pact'] } }] }] }).join('\n')).toMatch(/a broken tag is never reconnected/);
    expect(bad({ ...x, id: 'E.3649.a', consumes: [{ outcome: 'O.loop_b', required: false }], produces: [{ outcome: 'O.loop_a' }] }, { events: [...FIXTURE.events, { ...x, id: 'E.3649.a', consumes: [{ outcome: 'O.loop_b', required: false }], produces: [{ outcome: 'O.loop_a' }] }, { ...x, id: 'E.3649.b', consumes: [{ outcome: 'O.loop_a', required: false }], produces: [{ outcome: 'O.loop_b' }] }] as never })).toMatch(/loop/);
  });

  it('takes ABY dates, circa years and multi-year events', () => {
    const e = { ...FIXTURE.events[0]!, id: 'E.4.x', date: { year: 4, circa: true }, endDate: { year: 5 }, consumes: [], produces: [] };
    expect(worldNetworkSchema.safeParse({ ...FIXTURE, events: [e, { ...e, id: 'E.~990.y', date: { year: -990 } }], plotPoints: [] }).success).toBe(true);
    expect(worldNetworkSchema.safeParse({ ...FIXTURE, events: [{ ...e, date: { year: 4, month: 13 } }], plotPoints: [] }).success).toBe(false);
  });
});

describe('the scheduler', () => {
  it('history before the start stands as recorded and is never told as news', () => {
    const s = game();
    expect(status(s, 'E.3660.muster')).toBe('standing');
    expect(outcome(s, 'O.fleet')).toBe('produced');
    expect(selectWorldIdsToTell(s, FIXTURE)).toEqual([]);
    expect(status(s, 'E.3655.strike')).toBeUndefined();
  });

  it('events fire as play crosses their date, and everything follows the record when no tag breaks', () => {
    let s = go(game(), at(-3655, 3, 9));
    expect(status(s, 'E.3655.strike')).toBeUndefined();
    s = go(s, at(-3655, 3, 10));
    expect(status(s, 'E.3655.strike')).toBe('recorded');
    s = go(s, at(-3649));
    const st = net(s);
    expect(Object.entries(st.events).filter(([, r]) => !['standing', 'recorded'].includes(r.status)).map(([id, r]) => `${id}:${r.status}`)).toEqual(['E.3651.court:waiting']); // only on another branch
    expect(st.plotPoints).toEqual({});
    expect(st.tags).toEqual({});
    expect(outcome(s, 'O.settled')).toBe('produced');
    expect(outcome(s, 'O.gate_held')).toBe('broken'); // the branch that needed a broken tag
    expect(outcome(s, 'O.gate_taken')).toBe('produced');
  });

  it('an event with an end date is under way in between, and its outcomes settle at the end', () => {
    const s = go(game(at(-3651)), at(-3651, 2, 5));
    expect(status(s, 'E.3651.siege')).toBe('underway');
    expect(outcome(s, 'O.siege_begun')).toBe('produced');
    expect(outcome(s, 'O.gate_taken')).toBe('pending');
    expect(outcome(go(s, at(-3651, 2, 21)), 'O.gate_taken')).toBe('produced');
  });

  it('a galaxy-shaking event stops a montage on its day', () => {
    const r = advanceTime(REG, go(game(), at(-3655, 3, 9)), { seconds: 30 * SECONDS_PER_DAY, reason: 'montage', source: 'turnDraft', jump: true });
    expect(r.interrupted).toBe('The strike');
    expect(r.state.clock.now.day).toBe(at(-3655, 3, 10));
  });

  it('runs inside the full day loop', () => {
    const reg = fullRegistry(FIXTURE);
    const s = go(game(at(-3655, 3, 5), reg), at(-3655, 3, 11), reg);
    expect(status(s, 'E.3655.strike')).toBe('recorded');
  });

  it('is one deterministic result however the time is split', () => {
    const steps = go(go(go(game(), at(-3655, 2, 1)), at(-3655, 3, 10)), at(-3654, 2, 1));
    expect(steps.world.network).toEqual(go(game(), at(-3654, 2, 1)).world.network);
  });
});

describe('substitution', () => {
  it('a lost replaceable role is taken by a fitting figure, and nothing downstream changes', () => {
    const s = go(kill(game(), 'lore:darth-angral'), at(-3653, 2, 1));
    expect(status(s, 'E.3655.strike')).toBe('substituted');
    const [sub] = net(s).events['E.3655.strike']!.substitutes;
    const gone = CANON_BY_ID.get('lore:darth-angral')!;
    const by = CANON_BY_ID.get(sub!.canonId!)!;
    expect(sub!.role).toBe('role.captain');
    expect([canonFactionAt(by, 3655), canonRoleAt(by, 3655)]).toEqual([canonFactionAt(gone, 3655), canonRoleAt(gone, 3655)]);
    // Never the dead, nor somebody this or a later event cannot do without.
    expect(['lore:darth-angral', 'lore:darth-malgus']).not.toContain(sub!.canonId);
    for (const o of ['O.city_taken', 'O.gate_open', 'O.blade_alive', 'O.pact', 'O.settled']) expect(outcome(s, o), o).toBe('produced');
    expect(net(s).plotPoints).toEqual({});
    expect(status(s, 'E.3654.pact')).toBe('recorded');
  });

  it('an engine-recorded capture counts; the narrator reporting one does not', () => {
    const m = meet(game(), 'lore:darth-malgus');
    const told = applyEvents(REG, m.s, [{ type: 'npcCanonDiverged', npcRef: m.id, reason: 'captured' }], { source: 'ai' });
    expect(told.rejected).toEqual([]);
    expect(net(go(told.state, at(-3655, 2, 1))).tags).toEqual({});
    // The engine's own record of the capture (the player's fate choice) then does.
    const taken = engine(told.state, { type: 'npcCanonDiverged', npcRef: m.id, reason: 'captured' });
    expect(net(go(taken, at(-3655, 2, 1))).tags['E.3655.strike#role.blade']?.cause).toBe('Darth Malgus captured');
  });
});

describe('divergence and the ripple', () => {
  it('a lost crucial role alters the event; outcomes that do not need it still come', () => {
    const s = go(kill(game(), 'lore:darth-malgus'), AFTER_STRIKE);
    expect(status(s, 'E.3655.strike')).toBe('altered');
    expect(outcome(s, 'O.city_taken')).toBe('broken');
    expect(outcome(s, 'O.blade_alive')).toBe('broken');
    expect(outcome(s, 'O.gate_open')).toBe('produced'); // its own condition holds
  });

  it('the ripple runs two steps: the pact never comes, so the settlement never comes', () => {
    const s = go(exposed(game()), at(-3653, 2, 1));
    expect(status(s, 'E.3655.strike')).toBe('cancelled');
    expect(status(s, 'E.3654.pact')).toBe('cancelled');
    expect(net(s).events['E.3654.pact']!.broken).toEqual(['O.city_taken']);
    expect(status(s, 'E.3653.settlement')).toBe('cancelled');
    for (const o of ['O.city_taken', 'O.pact', 'O.settled', 'O.gate_open', 'O.gate_held']) expect(outcome(s, o), o).toBe('broken');
  });

  it('a minor condition only changes its own outcomes', () => {
    const s = go(engine(game(), { type: 'locationControlChanged', place: 'The Gate', side: 'republic', note: 'relieved' }), AFTER_STRIKE);
    expect(status(s, 'E.3655.strike')).toBe('adjusted');
    expect([outcome(s, 'O.city_taken'), outcome(s, 'O.gate_open'), outcome(s, 'O.gate_held')]).toEqual(['produced', 'broken', 'produced']);
  });

  it('an occupation broken while it is under way diverges then, and what it had already done is undone', () => {
    const before = go(game(at(-3651)), at(-3651, 2, 5));
    const s = go(engine(before, { type: 'locationControlChanged', place: 'The Gate', side: 'republic', note: 'relieved' }), at(-3651, 2, 6));
    expect(status(s, 'E.3651.siege')).toBe('altered');
    expect([outcome(s, 'O.siege_begun'), outcome(s, 'O.gate_taken')]).toEqual(['broken', 'broken']);
    // Held by the republic before it began: the condition is only about the occupation, so nothing breaks early.
    const early = go(engine(game(at(-3651)), { type: 'locationControlChanged', place: 'The Gate', side: 'republic', note: 'held' }), at(-3651, 1, 20));
    expect(net(early).tags).toEqual({});
  });

  it('a broken tag is never reconnected: the dead stay lost and broken outcomes stay broken', () => {
    const s = go(kill(game(), 'lore:darth-malgus'), AFTER_STRIKE);
    const raw = net(s);
    const facts: WorldFacts = { bby: 3655, npcLost: () => null, storyNpcDead: () => false, hasFlag: () => false, hasLead: () => true, wonFight: null, standIns: () => [] };
    const later = reviewNetwork(FIXTURE, raw, facts, at(-3650)).state;
    expect(later.tags['E.3655.strike#role.blade']).toBeDefined();
    expect(later.outcomes['O.blade_alive']!.state).toBe('broken');
  });
});

describe('plot points', () => {
  it('no alternative is chosen until the tracker condition is met', () => {
    // The tag is broken long before the date: the tracker (the city not taken) is not met until the strike is settled.
    let s = go(exposed(game()), at(-3655, 3, 9));
    expect(net(s).tags['E.3655.strike#cond.secret']).toBeDefined();
    expect(net(s).plotPoints).toEqual({});
    s = go(s, at(-3655, 3, 10));
    expect(net(s).plotPoints['PP-9']).toMatchObject({ alternative: 'drained', day: at(-3655, 3, 10) });
  });

  it('the best fit from the current state wins, and its effects apply', () => {
    // The blade lost: the winner's terms are possible, but without the Gate they fit worse than a drained peace.
    const plain = go(kill(game(), 'lore:darth-malgus'), AFTER_STRIKE);
    expect(net(plain).plotPoints['PP-9']?.alternative).toBe('drained');
    const held = engine(kill(game(), 'lore:darth-malgus'), { type: 'locationControlChanged', place: 'The Gate', side: 'republic', note: 'relieved' });
    const s = go(held, AFTER_STRIKE);
    expect(net(s).plotPoints['PP-9']?.alternative).toBe('winner');
    expect(outcome(s, 'O.long_war')).toBe('produced');
    expect(net(s).shifts).toEqual({ 'E.3653.settlement': 100, 'E.3652.harvest': 100 });
    // Moved, not lost: the harvest comes 100 days late; the court, which waited for this branch, now comes.
    const later = go(s, at(-3651, 7, 1));
    expect(net(later).events['E.3652.harvest']!.day).toBe(at(-3652, 6) + 100);
    expect(status(later, 'E.3651.court')).toBe('adjusted');
    // Chosen once.
    expect(net(later).plotPoints['PP-9']!.day).toBe(net(s).plotPoints['PP-9']!.day);
  });

  it('a plot point that does not apply is never chosen', () => {
    const pp = { ...FIXTURE.plotPoints[0]!, appliesIf: { outcome: 'O.pact', is: 'produced' } as const };
    const reg = registryFor({ ...FIXTURE, plotPoints: [pp] });
    const s = go(exposed(game(at(-3655), reg)), at(-3653), reg);
    expect(s.world.network.plotPoints).toEqual({});
    expect(s.world.network.events['E.3655.strike']!.status).toBe('cancelled');
  });
});

describe('convergence', () => {
  it('events whose crucial tags were never touched still fire, adjusted to the new state', () => {
    const s = go(exposed(game()), at(-3649));
    expect(status(s, 'E.3652.storm')).toBe('adjusted'); // its optional input is gone
    expect(net(s).events['E.3652.storm']!.broken).toEqual(['O.pact']);
    expect(outcome(s, 'O.storm')).toBe('produced');
    expect(status(s, 'E.3652.harvest')).toBe('adjusted'); // unrelated, but the plot point has turned
    expect(outcome(s, 'O.harvest')).toBe('produced');
    expect(outcome(s, 'O.city_taken')).toBe('broken'); // and nothing it lost came back
  });
});

describe('the freeze', () => {
  const span = (fromBby: number, toBby: number, side: ControlSpan['side'], links: Partial<ControlSpan> = {}): ControlSpan => ({ place: 'The City', fromBby, toBby, side, note: side, source: 'test', ...links });
  const CITY: ControlSpan[] = [span(3681, 3656, 'republic'), span(3655, 3655, 'sithEmpire', { dependsOn: ['O.city_taken'] }), span(3654, 3640, 'neutral', { dependsOn: ['O.pact'] }), span(3639, 3630, 'hutts')];
  const sides = (st: NetworkState, bby: number): string[] => controlNow(FIXTURE, st, bby, (p) => p === 'The City', CITY).map((c) => `${c.side}${c.held ? `:${c.held}` : ''}`);

  it('control follows the dates when nothing breaks, and waits for the event inside its year', () => {
    const s = go(game(), at(-3655, 3, 9));
    expect(sides(net(s), 3655)).toEqual(['republic:notYet']); // the strike comes in March
    const after = go(s, at(-3655, 3, 10));
    expect(sides(net(after), 3655)).toEqual(['sithEmpire']);
    expect(sides(net(go(after, at(-3654, 1, 2))), 3654)).toEqual(['neutral']);
  });

  it('a diverged outcome holds control where it was, and the facts after it that depend on it stop too', () => {
    const s = go(exposed(game()), at(-3653));
    expect(sides(net(s), 3655)).toEqual(['republic:frozen']);
    expect(sides(net(s), 3648)).toEqual(['republic:frozen']);
    expect(sides(net(s), 3635)).toEqual(['hutts']); // a later fact that depends on nothing broken
  });

  it('a place taken in play holds until an event after it decides otherwise', () => {
    const s = engine(game(), { type: 'locationControlChanged', place: 'The City', side: 'mandalorians', note: 'taken in play' });
    expect(sides(net(s), 3655)).toEqual(['mandalorians:changed']);
    expect(sides(net(go(s, AFTER_STRIKE)), 3655)).toEqual(['sithEmpire']); // the strike, settled after, took it
  });

  it('leaders and seats hold too, and a fact that ends with an event lasts until it comes', () => {
    const leaders: LeaderSpan[] = [
      { office: 'Warden', holder: 'Old', fromBby: 3681, toBby: 3655, endsWith: 'O.city_taken', source: 't' },
      { office: 'Warden', holder: 'New', fromBby: 3655, toBby: 3600, dependsOn: ['O.city_taken'], source: 't' },
    ];
    const seats: OrderSeat[] = [
      { fromYear: -4000, toYear: -3654, seat: 'the Temple', source: 't' },
      { fromYear: -3654, toYear: -3600, seat: 'the new Temple', source: 't', dependsOn: ['O.pact'] },
    ];
    const read = (s: GameState): string[] => [...selectLeaders(s, FIXTURE, leaders).map((l) => `${l.holder}${l.held ? `:${l.held}` : ''}`), String(selectOrderSeat(s, FIXTURE, seats))];
    expect(read(game())).toEqual(['Old', 'the Temple']);
    expect(read(go(game(), at(-3653)))).toEqual(['New', 'the new Temple']);
    expect(read(go(exposed(game()), at(-3653)))).toEqual(['Old:frozen', 'the Temple']);
  });

  it('is the plain date lookup without links or with outcomes the network does not know', () => {
    const facts = [{ fromBby: 10, toBby: 6 }, { fromBby: 5, toBby: 3, dependsOn: ['O.unknown'] }, { fromBby: 5, toBby: 1 }];
    const look = (bby: number): number[] => datedFactsAt(facts, bby, () => 'unknown').map((f) => facts.indexOf(f.fact as never));
    expect([look(8), look(4), look(2), look(0)]).toEqual([[0], [1, 2], [2], []]);
  });

  it('never invents: a lore gap before a frozen fact stays blank', () => {
    const facts = [{ fromBby: 20, toBby: 15 }, { fromBby: 5, toBby: 3, dependsOn: ['O.x'] }];
    expect(datedFactsAt(facts, 4, () => 'broken')).toEqual([]);
  });

  it('at the 3,661 start the shipped tables read the same through the campaign as through the dates', () => {
    const s = game(at(-3661), REGISTRY as Registry<GameState>);
    expect(selectControl(s, ['Coruscant']).map((c) => [c.side, c.held])).toEqual([['republic', null]]);
    expect(selectLeaders(s).every((l) => l.held === null)).toBe(true);
    expect(selectOrderSeat(s)).toBe('the Jedi Temple on Coruscant');
  });
});

describe('guards and player actions', () => {
  const facts = (over: Partial<WorldFacts> = {}): WorldFacts => ({ bby: 3655, npcLost: () => null, storyNpcDead: () => false, hasFlag: () => false, hasLead: () => true, wonFight: null, standIns: () => [], ...over });
  const act = (over: Partial<WorldAction> = {}): WorldAction => ({ actionType: 'investigate', skillId: null, total: 17, places: ['Coruscant'], canonIds: [], ...over });
  const open = reviewNetwork(FIXTURE, emptyNetworkState(at(-3655)), facts(), at(-3655)).state;
  const SECRET = 'E.3655.strike#cond.secret';
  const HIDDEN = 'E.3650.plot#cond.hidden';

  it('a medium guard takes a deliberate effort: several successes on different days', () => {
    let st = open;
    // 17 is a narrow success against the medium guard (DC 17): one point of three.
    st = recordAction(FIXTURE, st, facts(), act(), at(-3655)).state;
    expect(st.progress[SECRET]!.points).toBe(1);
    const same = recordAction(FIXTURE, st, facts(), act({ total: 40 }), at(-3655));
    expect(same.state.progress[SECRET]!.points).toBe(1); // once a day
    expect(same.notes.join()).toMatch(/already counted today/);
    st = recordAction(FIXTURE, st, facts(), act({ total: 8 }), at(-3655, 1, 2)).state; // a bad failure costs a point
    expect(st.progress[SECRET]!.points).toBe(0);
    st = recordAction(FIXTURE, st, facts(), act({ total: 25 }), at(-3655, 1, 3)).state; // strong: two
    expect(st.tags[SECRET]).toBeUndefined();
    st = recordAction(FIXTURE, st, facts(), act(), at(-3655, 1, 4)).state;
    expect(st.tags[SECRET]?.cause).toMatch(/player's action/);
  });

  it('a low guard breaks on one good roll or one recorded fact', () => {
    expect(GUARD_RULES.low.points).toBe(STRENGTH_POINTS.minor);
    const fight = facts({ wonFight: { id: 'fight:1', stakes: 'serious', canonIds: [], factions: [], places: ['Kaas City'] } });
    expect(reviewNetwork(FIXTURE, open, fight, at(-3655)).state.tags['E.3650.plot#cond.calm']).toBeDefined();
    const spar = facts({ wonFight: { id: 'fight:2', stakes: 'serious', canonIds: [], factions: [], places: ['Coruscant'] } });
    expect(reviewNetwork(FIXTURE, open, spar, at(-3655)).state.tags).toEqual({});
  });

  it('a high guard needs foreknowledge first: its own step at a medium guard, over days', () => {
    const ask = act({ actionType: 'dialogue', places: [], canonIds: ['lore:darth-marr'], total: 40 });
    const dig = act({ places: ['Kaas City'], total: 25 }); // strong against the medium guard: two of three
    let st = recordAction(FIXTURE, open, facts(), ask, at(-3655)).state;
    expect(st.progress[HIDDEN]).toBeUndefined();
    st = recordAction(FIXTURE, st, facts(), dig, at(-3655)).state;
    expect(st.progress[HIDDEN]).toMatchObject({ points: 0, known: { 'know.plot': { points: 2, met: false } } });
    expect(recordAction(FIXTURE, st, facts(), dig, at(-3655)).state.progress[HIDDEN]!.known['know.plot']!.points).toBe(2); // once a day
    expect(recordAction(FIXTURE, st, facts(), ask, at(-3655, 1, 2)).state.progress[HIDDEN]!.points).toBe(0); // not yet
    st = recordAction(FIXTURE, st, facts(), dig, at(-3655, 1, 2)).state;
    expect(st.progress[HIDDEN]!.known['know.plot']!.met).toBe(true);
    st = recordAction(FIXTURE, st, facts(), ask, at(-3655, 1, 3)).state;
    expect(st.tags[HIDDEN]).toBeUndefined(); // exceptional: three of six
    st = recordAction(FIXTURE, st, facts(), ask, at(-3655, 1, 4)).state;
    expect(st.tags[HIDDEN]).toBeDefined();
  });

  it('a recorded discovery is foreknowledge in itself', () => {
    const st = reviewNetwork(FIXTURE, open, facts({ npcLost: (id) => (id === 'lore:darth-jadus' ? 'captured' : null) }), at(-3655)).state;
    expect(st.progress[HIDDEN]!.known['know.plot']!.met).toBe(true);
    expect(st.tags[HIDDEN]).toBeUndefined();
  });

  describe('a very high guard', () => {
    const VAULT = 'E.3650.plot#cond.vault';
    const take = act({ actionType: 'forceUse', places: ['Ziost'], total: 60 }); // exceptional even against DC 21
    const where = act({ places: ['Ziost'], total: 60 });
    const captured = facts({ npcLost: (id) => (id === 'lore:darth-baras' ? 'captured' : null) });
    const days = (st0: NetworkState, f: WorldFacts, a: WorldAction, from: number, n: number): NetworkState => {
      let st = st0;
      for (let i = 0; i < n; i++) st = recordAction(FIXTURE, st, f, a, at(-3655, 2, from + i)).state;
      return st;
    };
    it('is DC 21 and 10 points, and cannot break without both prerequisites', () => {
      expect(GUARD_RULES.veryHigh).toEqual({ rating: 110, points: 10 });
      // Neither, then only one: no amount of work counts.
      expect(days(open, facts(), take, 1, 10).tags[VAULT]).toBeUndefined();
      const one = days(days(open, facts(), where, 1, 1), facts(), take, 11, 10);
      expect(one.progress[VAULT]).toMatchObject({ points: 0, known: { 'know.where': { met: true } } });
      expect(one.tags[VAULT]).toBeUndefined();
      // Nor does a decisive fact, alone or with one prerequisite.
      const vowrawn = facts({ npcLost: (id) => (id === 'lore:darth-vowrawn' ? 'dead' : null) });
      expect(reviewNetwork(FIXTURE, one, vowrawn, at(-3655, 3, 1)).state.tags[VAULT]).toBeUndefined();
      // Both: the work counts, several times over.
      const both = reviewNetwork(FIXTURE, one, captured, at(-3655, 3, 1)).state;
      expect(both.tags[VAULT]).toBeUndefined();
      expect(days(both, captured, take, 22, 3).tags[VAULT]).toBeUndefined(); // three exceptional successes: 9 of 10
      expect(days(both, captured, take, 22, 4).tags[VAULT]).toBeDefined();
    });
    it('a decisive fact alone is not enough even with both', () => {
      const f = facts({ npcLost: (id) => (id === 'lore:darth-baras' ? 'captured' : id === 'lore:darth-vowrawn' ? 'dead' : null) });
      const st = reviewNetwork(FIXTURE, days(open, facts(), where, 1, 1), f, at(-3655, 3, 1)).state;
      expect(st.progress[VAULT]!.points).toBe(6);
      expect(st.tags[VAULT]).toBeUndefined();
    });
  });

  it('a scene outcome is a flag the engine sets from a rolled success, and it breaks the condition that reads it', () => {
    let s = applyEvents(REG, game(), [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: 'x', moveHere: true }], { source: 'ai' }).state;
    s = applyEvents(REG, s, [{ type: 'factLearned', aboutRef: 'Coruscant', fact: 'A plan is being drawn', importance: 'major' }], { source: 'ai' }).state;
    const roll = (total: number) => ({ type: 'worldActionRecorded', actionType: 'forceUse', skillId: null, total, targets: [] });
    expect(engine(s, roll(18)).flags.set).toEqual([]); // under DC 19
    s = engine(s, roll(19));
    expect(s.flags.set).toEqual(['sceneOutcome:strike-plan']);
    s = go(s, at(-3655, 1, 2));
    expect(net(s).tags[SECRET]?.cause).toBe('recorded facts');
    expect(status(go(s, AFTER_STRIKE), 'E.3655.strike')).toBe('cancelled');
  });

  it('an action elsewhere, of another kind, or about a settled event counts for nothing', () => {
    expect(recordAction(FIXTURE, open, facts(), act({ places: ['Tython'], total: 40 }), at(-3655)).state).toBe(open);
    expect(recordAction(FIXTURE, open, facts(), act({ actionType: 'heal', total: 40 }), at(-3655)).state).toBe(open);
    const done = reviewNetwork(FIXTURE, open, facts(), AFTER_STRIKE).state;
    expect(recordAction(FIXTURE, done, facts(), act({ total: 40 }), AFTER_STRIKE).state).toBe(done);
  });

  it('the narrator has no event that breaks a tag, moves control or sets a tested flag', () => {
    for (const e of [
      { type: 'worldActionRecorded', actionType: 'investigate', skillId: null, total: 40, targets: [] },
      { type: 'locationControlChanged', place: 'The Gate', side: 'republic', note: '' },
      { type: 'worldTimelineReviewed', day: at(-3600) },
      { type: 'flagSet', flag: 'sceneOutcome:strike-plan' },
    ]) {
      const r = applyEvents(REG, game(), [e], { source: 'ai' });
      expect(r.applied, e.type).toEqual([]);
      expect(r.rejected.length, e.type).toBe(1);
    }
    // The one world event the narrator has ends a captivity (D-470): it touches no tag, and only a prisoner's turn offers it.
    const offered = Object.entries(makeWorldFeature(FIXTURE).events).filter(([, d]) => d.narrative);
    expect(offered.map(([type]) => type)).toEqual(['captivityEnded']);
    expect(offered[0]![1].narrative!(game(), { timeAdvancedByDraft: true })).toBe(false);
  });

  it('an action on a place with no lead recorded in play scores nothing (D-468)', () => {
    const r = recordAction(FIXTURE, open, facts({ hasLead: () => false }), act({ total: 60 }), at(-3655));
    expect(r.state).toBe(open);
    expect(r.notes.join()).toMatch(/no lead recorded in play/);
  });

  it('a lead is a figure met, a fact or thread about the place, or a site found; being there is not', () => {
    const roll = { type: 'worldActionRecorded', actionType: 'investigate', skillId: null, total: 25, targets: [] };
    const here = applyEvents(REG, game(), [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: 'x', moveHere: true }], { source: 'ai' }).state;
    const points = (s: GameState): number => net(engine(s, roll)).progress[SECRET]?.points ?? 0;
    expect(points(here)).toBe(0);
    expect(points(meet(here, 'lore:darth-angral').s)).toBe(2);
    expect(points(applyEvents(REG, here, [{ type: 'factLearned', aboutRef: 'Coruscant', fact: 'Someone is measuring the Temple gates', importance: 'major' }], { source: 'ai' }).state)).toBe(2);
    const opened = (s: GameState, title: string): GameState => applyEvents(REG, s, [{ type: 'threadOpened', title, stakes: 'x', entityRefs: ['Coruscant'] }], { source: 'ai' }).state;
    const later: GameState = { ...here, meta: { ...here.meta, turn: 5 } };
    expect(points(opened(later, 'Strange cargo'))).toBe(2);
    expect(points(opened(here, 'Strange cargo'))).toBe(0); // a start option's thread: backstory until play takes it up
    // Never what is to come, stated outright; nor what was not learned in a scene (D-470 [4]).
    expect(points(applyEvents(REG, here, [{ type: 'factLearned', aboutRef: 'Coruscant', fact: 'Nobody knows the strike is coming to the city', importance: 'major' }], { source: 'ai' }).state)).toBe(0);
    expect(points(opened(later, 'The strike as recorded'))).toBe(0);
    const told = applyEvents(REG, here, [{ type: 'factLearned', aboutRef: 'Coruscant', fact: 'Someone is measuring the Temple gates', importance: 'major' }], { source: 'ai' }).state;
    expect(points({ ...told, memory: { ...told.memory, facts: told.memory.facts.map((f) => ({ ...f, turn: 0 })) } })).toBe(0);
    const vault = applyEvents(REG, here, [{ type: 'locationIntroduced', name: 'Old Vault', kind: 'building', region: 'Coruscant', parentRef: 'Coruscant', description: 'x', moveHere: true }], { source: 'ai' }).state;
    expect(points(vault)).toBe(2);
  });

  it('a rolled action at the scene is recorded through its event', () => {
    let s = applyEvents(REG, game(), [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: 'x', moveHere: true }], { source: 'ai' }).state;
    s = meet(s, 'lore:darth-angral').s;
    s = engine(s, { type: 'worldActionRecorded', actionType: 'investigate', skillId: null, total: 40, targets: [] });
    expect(net(s).progress[SECRET]!.points).toBe(3);
    expect(net(s).tags[SECRET]).toBeDefined();
  });
});

describe('the narrator hand-off', () => {
  it('says what fired, what broke, which alternative applies and what still stands, and only once', () => {
    let s = go(exposed(game()), AFTER_STRIKE);
    const h = selectTimelineHandoff(s, FIXTURE);
    const text = handoffLines(h).join('\n');
    expect(text).toMatch(/\[BROKEN IN PLAY\] The plan of the strike is out/);
    expect(text).toMatch(/\[DOES NOT HAPPEN \(diverged\)\] The strike .*changed by: The plan of the strike is out/);
    expect(text).toMatch(/\[HISTORY TURNS: A WAR THAT DRAGS ON\] The strike and the pact: Both sides are drained/);
    expect(h.standing).toEqual(['The strike and the pact: Both sides are drained', 'The strike (did not happen)']);
    // Nothing that has not happened yet, and no tag that holds.
    expect(text).not.toMatch(/The pact \(|settlement|The gate opens|Nobody knows/);
    s = engine(s, { type: 'worldEventsTold', ids: selectWorldIdsToTell(s, FIXTURE), turn: 3 });
    expect(selectTimelineHandoff(s, FIXTURE).news).toEqual([]);
    expect(selectTimelineHandoff(s, FIXTURE).standing.length).toBe(2); // the divergence keeps standing
  });

  it('names the stand-in and keeps protagonists as NPCs', () => {
    const s = go(kill(game(), 'lore:darth-angral'), AFTER_STRIKE);
    const line = selectTimelineHandoff(s, FIXTURE).news.join('\n');
    expect(line).toMatch(/IN OTHER HANDS\] The strike/);
    expect(line).toMatch(/roles: Darth Angral replaced by [A-Z]/);
    expect(line).not.toMatch(/another of similar standing/);
    expect(line).toMatch(/the Hero: an NPC, never the player character/);
    expect(line).not.toMatch(/changed by/);
  });

  it('says nothing at the start of a campaign', () => {
    const s = game(at(-3661), REGISTRY as Registry<GameState>);
    expect(handoffLines(selectTimelineHandoff(s))).toEqual([]);
  });
});

describe('the save', () => {
  it('the network state survives a save and a load', () => {
    const s = go(exposed(game()), at(-3653));
    const r = loadEnvelope(REG, JSON.parse(JSON.stringify(makeEnvelope(REG, s, 'now'))));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.world).toEqual(s.world);
      expect(r.warnings).toEqual([]);
    }
  });

  it('an older save (v1) opens the network at its own date, with its past as recorded', () => {
    const s = go(game(), at(-3654, 2, 1));
    const env = JSON.parse(JSON.stringify(makeEnvelope(REG, s, 'now')));
    env.featureVersions.world = 1;
    delete env.state.world.network;
    const r = loadEnvelope(REG, env);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(status(r.state, 'E.3655.strike')).toBe('standing'); // read before any time passes
    expect(status(go(r.state, at(-3653, 2, 1)), 'E.3653.settlement')).toBe('recorded');
    expect(selectWorldIdsToTell(r.state, FIXTURE)).toEqual([]);
  });

  it('data added later fits a running save: its past stands, its future fires', () => {
    const none: WorldNetwork = { events: [], plotPoints: [], standing: [] };
    const reg = registryFor(none);
    const s = go(game(at(-3655), reg), at(-3654, 2, 1), reg);
    expect(status(s, 'E.3655.strike')).toBe('standing');
    expect(status(go(s, at(-3653, 2, 1)), 'E.3653.settlement')).toBe('recorded');
  });
});
