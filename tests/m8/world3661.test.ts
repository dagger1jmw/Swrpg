// M8 Phase B (D-467): the 3,661-3,640 BBY network. The data follows its tag map; the recorded timeline plays through when
// nothing breaks; PP-1, PP-2, the freeze, the recorded deaths and a scene outcome work end to end. Lore tests use real years.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { CANON_DEATH_LINKS } from '../../src/data/canonDeathLinks';
import { controlAt, FACTION_LEADERS, leadersAt, WORLD_CONTROL } from '../../src/data/worldControl';
import { WORLD_NETWORK } from '../../src/data/worldNetwork';
import { absDayFromDate, SECONDS_PER_DAY } from '../../src/engine/calendar';
import { canonOffBoard, canonRankAt } from '../../src/engine/canonRoster';
import { networkProblems } from '../../src/features/world/networkSchema';
import { outcomeState, worldDay } from '../../src/features/world/network';
import { selectNpcLevels } from '../../src/features/npcs/selectors';
import { handoffLines, selectCanonInCampaign, selectControl, selectLeaders, selectNetworkState, selectOrderSeat, selectTimelineHandoff } from '../../src/features/world/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { Registry } from '../../src/state/types';
import { resolveTurn } from '../../src/turn/resolve';
import { mapRows, outcomesIn } from '../support/tagMaps';

const at = (bby: number, month = 1, day = 1): number => absDayFromDate({ year: -bby, month, day });
/** Only the world's time hook, so years pass quickly. */
const REG: Registry<GameState> = REGISTRY.map((f) => {
  if (f.id === 'world') return f;
  const { onTimeAdvanced: _hook, ...rest } = f;
  return rest;
});
const game = (day = at(3661)): GameState =>
  createInitialState<GameState>(REG, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day, second: 8 * 3600 },
    character: { name: 'Kael', birthDay: day - 25 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    rank: 'knight',
  });
const go = (s: GameState, day: number): GameState => advanceTime(REG, s, { seconds: Math.max(0, (day - s.clock.now.day) * SECONDS_PER_DAY), reason: 'test', source: 'turnDraft' }).state;
const engine = (s: GameState, ...events: unknown[]): GameState => {
  const r = applyEvents(REG, s, events, { source: 'engine' });
  expect(r.rejected).toEqual([]);
  return r.state;
};
const meet = (s: GameState, canonId: string): { s: GameState; id: string } => {
  const c = CANON_BY_ID.get(canonId)!;
  let next = applyEvents(REG, s, [{ type: 'npcIntroduced', name: c.name, species: 'human', faction: c.faction, role: 'other', ageApprox: 50, description: '' }], { source: 'ai' }).state;
  const id = Object.values(next.npcs.byId).find((n) => n.name === c.name)!.id;
  next = engine(next, { type: 'npcCanonLinked', npcRef: id, canonId });
  expect(next.npcs.byId[id]!.canonId, canonId).toBe(canonId);
  return { s: next, id };
};
const kill = (s: GameState, ...ids: string[]): GameState =>
  ids.reduce((x, id) => {
    const m = meet(x, `lore:${id}`);
    return engine(m.s, { type: 'npcDied', npcRef: m.id, cause: 'test' });
  }, s);
const net = (s: GameState) => selectNetworkState(s);
const status = (s: GameState, id: string): string | undefined => net(s).events[id]?.status;
const outcome = (s: GameState, id: string) => outcomeState(WORLD_NETWORK, net(s), id);
const breakTag = (s: GameState, key: string): GameState => ({ ...s, world: { ...s.world, network: { ...net(s), tags: { ...net(s).tags, [key]: { day: s.clock.now.day, cause: 'test', toldTurn: null } } } } });
const coruscant = (s: GameState) => selectControl(s, ['Coruscant']).map((c) => c.side);

describe('the data follows world-event-tags-draft.md', () => {
  const rows = mapRows('world-event-tags-draft.md');
  const byId = new Map(WORLD_NETWORK.events.map((e) => [e.id, e]));

  it('every row is encoded, and nothing else', () => {
    expect([...byId.keys()].sort()).toEqual(rows.map((r) => r.id).sort());
    expect(networkProblems(WORLD_NETWORK)).toEqual([]);
  });

  it('each event consumes and produces what the map says (plus the listed additions)', () => {
    // Added outcomes: deaths and fronts the freeze needs to read, and Korriban taken.
    const ADDED = ['O.korriban_fallen', 'O.darnala_dead', 'O.eleena_dead', 'O.adraas_dead', 'O.kilran_dead', 'O.fronts_3641', 'O.council_deaths_3640'];
    for (const r of rows) {
      const e = byId.get(r.id)!;
      expect(e.consumes.map((c) => c.outcome).sort(), `${r.id} consumes`).toEqual(outcomesIn(r.consumes).sort());
      expect(e.produces.map((p) => p.outcome).filter((o) => !ADDED.includes(o)).sort(), `${r.id} produces`).toEqual(outcomesIn(r.produces).sort());
    }
  });

  it('every condition of the map is there with its guard, and every condition has a test that can break it', () => {
    for (const r of rows) {
      const guards = [...r.conditions.matchAll(/(not crucial|crucial|:)[,:]?\s*(very high|high|medium|low)/g)].map((m) => m[2]);
      const mine = byId.get(r.id)!.conditions;
      for (const g of new Set(guards)) expect(mine.some((c) => c.guard === g), `${r.id} ${g}`).toBe(true);
      for (const c of mine) expect(c.breakIf.length, `${r.id}#${c.id}`).toBeGreaterThan(0);
    }
  });

  it('crucial and protagonist roles match the rulings', () => {
    const kinds = (id: string): string[] => byId.get(id)!.roles.map((x) => `${x.label}:${x.protagonist ? 'NPC' : x.kind[0]}`);
    expect(kinds('E.3653.temple_strike')[0]).toBe('Darth Malgus:c');
    expect(kinds('E.3642.maelstrom').slice(0, 2)).toEqual(['Revan:c', 'Darth Malgus:c']);
    expect(kinds('E.3640.ilum')).toEqual(['Darth Malgus:c']);
    expect(WORLD_NETWORK.events.flatMap((e) => e.roles).filter((r) => r.protagonist).every((r) => r.kind === 'replaceable')).toBe(true);
    expect(JSON.stringify(WORLD_NETWORK)).not.toMatch(/malgus_alive/);
  });

  it('every canon id the network and the death links use is on the roster', () => {
    const ids = WORLD_NETWORK.events.flatMap((e) => e.roles.flatMap((r) => (r.canonId ? [r.canonId] : [])));
    for (const id of [...ids, ...Object.keys(CANON_DEATH_LINKS)]) expect(CANON_BY_ID.has(id), id).toBe(true);
    const outcomes = new Set(WORLD_NETWORK.events.flatMap((e) => e.produces.map((p) => p.outcome)));
    const links = [...WORLD_CONTROL, ...FACTION_LEADERS].flatMap((x) => [...(x.dependsOn ?? []), ...(x.endsWith ? [x.endsWith] : [])]);
    for (const o of [...Object.values(CANON_DEATH_LINKS), ...links]) expect(outcomes.has(o), o).toBe(true);
    // A death is linked only where the event falls in the recorded year.
    const producer = new Map(WORLD_NETWORK.events.flatMap((e) => e.produces.map((p) => [p.outcome, e] as const)));
    for (const [id, o] of Object.entries(CANON_DEATH_LINKS)) {
      const died = CANON_BY_ID.get(id)!.deathBby!;
      const year = -(producer.get(o)!.endDate ?? producer.get(o)!.date).year;
      expect(Math.abs(died - year), `${id} ${died} ${o} ${year}`).toBeLessThanOrEqual(1);
    }
  });

  it('the 3,661 and 3,653 chains have invented months in the lore\'s order', () => {
    const day = (id: string): number => worldDay(byId.get(id)!.date);
    const inOrder = (...ids: string[]): void => ids.slice(1).forEach((id, i) => expect(day(id), `${ids[i]!} < ${id}`).toBeGreaterThan(day(ids[i]!)));
    inOrder('E.3661.blockade', 'E.3661.devaron', 'E.3661.satele_recall', 'E.3661.belsavis_shange', 'E.3661.raxxus', 'E.3661.theron', 'E.3661.rim_campaign', 'E.3660.hydian_battle', 'E.3660.riots_end', 'E.3660.ord_radama', 'E.3660.ashas_serenno', 'E.3660.ziost', 'E.3660.korriban', 'E.3660.great_hunt');
    inOrder('E.3654.peace_offer', 'E.3653.alderaan_conference', 'E.3653.temple_strike', 'E.3653.sacking', 'E.3653.treaty', 'E.3653.zym', 'E.3653.chancellor');
    inOrder('E.3643.quesh', 'E.3643.sebaddon', 'E.3643.flesh_raiders', 'E.3643.desolator', 'E.3643.esseles', 'E.3643.council_changes', 'E.3642.balmorra_freed', 'E.3642.taris_invasion', 'E.3642.maelstrom', 'E.3642.plan_zero');
    inOrder('E.3640.corellia', 'E.3640.ilum', 'E.3640.voss', 'E.3640.voice', 'E.3640.council_deaths', 'E.3640.janarus_dies', 'E.3640.karrid'); // Karrid last (D-468 [3])
    for (const e of WORLD_NETWORK.events) if (e.date.month) expect(e.date.placed, e.id).toBeDefined();
  });
});

describe('the recorded timeline', () => {
  const end = go(game(), at(3639));
  it('plays through unchanged when no tag breaks', () => {
    const st = net(end);
    expect(Object.entries(st.events).filter(([, r]) => r.status !== 'recorded' && r.status !== 'standing').map(([id, r]) => `${id}: ${r.status}`)).toEqual([]);
    expect(Object.keys(st.events).length).toBe(WORLD_NETWORK.events.length);
    expect([st.tags, st.plotPoints, st.shifts, st.control]).toEqual([{}, {}, {}, []]);
    const branches = Object.entries(st.outcomes).filter(([, o]) => o.state === 'broken').map(([id]) => id).sort();
    expect(branches).toEqual(['O.korriban_fallen', 'O.temple_saved', 'O.weak_ground_control']); // only what needs a broken tag
  });

  it('control, leaders and the seat read as the dated tables at each year\'s end', () => {
    const places = [...new Set(WORLD_CONTROL.map((c) => c.place))];
    const diff: string[] = [];
    let s = game();
    for (let bby = 3661; bby >= 3640; bby--) {
      s = go(s, at(bby, 12, 30));
      for (const p of places) {
        const now = selectControl(s, [p]).map((c) => `${c.side}${c.held ? ` (${c.held})` : ''}`).sort().join('+');
        const then = controlAt([p], bby).map((c) => c.side).sort().join('+');
        if (now !== then) diff.push(`${bby} ${p}: ${now} / ${then}`);
      }
      const now = selectLeaders(s).map((l) => `${l.office}: ${l.holder}`).join('; ');
      const then = leadersAt(bby).map((l) => `${l.office}: ${l.holder}`).join('; ');
      if (now !== then) diff.push(`${bby} leaders differ: ${selectLeaders(s).length} / ${leadersAt(bby).length}`);
    }
    // In a year of change the table lists both; at its end the campaign has only the new one. Alderaan and Belsavis hold
    // through the months the table leaves blank before their event.
    expect(diff).toEqual([
      '3660 leaders differ: 4 / 5',
      '3653 Coruscant: republic / republic+sithEmpire',
      '3653 Alderaan: republic (notYet) / ',
      '3653 leaders differ: 5 / 7',
      '3640 leaders differ: 6 / 8',
    ]);
    expect(selectOrderSeat(s)).toBe('the Jedi Temple on Tython');
  });

  it('Coruscant falls and is returned inside 3,653', () => {
    const before = go(game(at(3653)), at(3653, 6, 20));
    expect(coruscant(before)).toEqual(['republic']);
    expect(status(before, 'E.3653.temple_strike')).toBe('underway');
    const during = go(before, at(3653, 6, 22));
    expect(coruscant(during)).toEqual(['sithEmpire']);
    const after = go(during, at(3653, 6, 24));
    expect([coruscant(after), status(after, 'E.3653.treaty')]).toEqual([['republic'], 'recorded']);
    expect(selectLeaders(after).filter((l) => l.office === 'Supreme Chancellor')).toEqual([]);
    expect(selectLeaders(go(after, at(3653, 8, 2))).find((l) => l.office === 'Supreme Chancellor')!.holder).toBe('Dorian Janarus');
  });

  it('a campaign in another era carries it as history', () => {
    const s = game(absDayFromDate({ year: -1032, month: 1, day: 1 }));
    expect(Object.values(net(s).events).every((r) => r.status === 'standing')).toBe(true);
    expect(handoffLines(selectTimelineHandoff(s))).toEqual([]);
  });
});

describe('PP-1: the Sacking and the Treaty', () => {
  it('breaking the hinge diverges the Treaty and everything built on it', () => {
    const mid = go(game(at(3653)), at(3653, 6, 22));
    const s = go(breakTag(mid, 'E.3653.sacking#cond.hold'), at(3650, 2, 1));
    expect(status(s, 'E.3653.sacking')).toBe('altered');
    expect([outcome(s, 'O.coruscant_occupied'), outcome(s, 'O.treaty_signed')]).toEqual(['broken', 'broken']);
    expect(status(s, 'E.3653.treaty')).toBe('cancelled');
    expect(net(s).plotPoints['PP-1']?.alternative).toBe('attrition');
    expect(coruscant(s)).toEqual(['republic']);
    for (const id of ['E.3653.zym', 'E.3653.ord_mantell_fleet', 'E.3653.alderaan_secession', 'E.3653.balmorra_ceded', 'E.3650.mindor']) expect(status(s, id), id).toBe('cancelled');
    // Balmorra stays contested, Alderaan stays in the Republic, Berooken and Zym keep their offices.
    expect(selectControl(s, ['Balmorra', 'Alderaan']).map((c) => [c.place, c.side, c.held])).toEqual([['Balmorra', 'contested', 'frozen'], ['Alderaan', 'republic', 'frozen']]);
    expect(selectLeaders(s).filter((l) => /Chancellor|Grand Master/.test(l.office)).map((l) => [l.holder, l.held])).toEqual([['Berooken', 'frozen'], ['Zym', 'frozen']]);
    // PP-2 does not exist without the Treaty.
    const later = go(s, at(3640, 6));
    expect(net(later).plotPoints['PP-2']).toBeUndefined();
    expect(status(later, 'E.3641.treaty_collapse')).toBe('cancelled');
    // Convergence: what never depended on it still comes, adjusted.
    for (const id of ['E.3651.tython', 'E.3645.odacer_sickness', 'E.3643.sebaddon', 'E.3640.voss']) expect(status(later, id), id).toBe('adjusted');
    expect([outcome(later, 'O.tython_found'), outcome(later, 'O.grand_master_set')]).toEqual(['produced', 'broken']);
    expect(selectLeaders(later).find((l) => l.office === 'Mandalore')!.holder).toMatch(/Vindicated/);
  });

  it('saving the Temple alone gives O.weak_ground_control without diverging the Treaty', () => {
    const s = go(breakTag(game(at(3653)), 'E.3653.temple_strike#cond.reach'), at(3650, 2, 1));
    expect(status(s, 'E.3653.temple_strike')).toBe('altered');
    expect([outcome(s, 'O.temple_saved'), outcome(s, 'O.weak_ground_control'), outcome(s, 'O.temple_destroyed')]).toEqual(['produced', 'produced', 'broken']);
    expect([outcome(s, 'O.grid_down'), outcome(s, 'O.coruscant_occupied'), outcome(s, 'O.treaty_signed')]).toEqual(['produced', 'produced', 'produced']);
    expect(net(s).plotPoints).toEqual({});
    expect(status(s, 'E.3653.treaty')).toBe('recorded');
    // The Sacking still happens, adjusted: the Empire's hold is thinner.
    expect(status(s, 'E.3653.sacking')).toBe('adjusted');
    const then = selectTimelineHandoff(go(breakTag(game(at(3653, 6)), 'E.3653.temple_strike#cond.reach'), at(3653, 6, 24))).news.join('\n');
    expect(then).toMatch(/The Sacking of Coruscant .*"The strike on the Jedi Temple" brought about: weak ground control/);
    // What only follows from that (the Senate's mind that July) is not told before its date.
    expect(net(s).tags['E.3653.temple_shelved#cond.hostile']?.cause).toBe('an earlier event');
    expect(selectTimelineHandoff(s).news.join('\n')).not.toMatch(/BROKEN IN PLAY\] The Senate/);
    // The Order stays on Coruscant; Tython is still found.
    expect(status(s, 'E.3653.temple_shelved')).toBe('cancelled');
    expect(status(s, 'E.3650.tython_begun')).toBe('cancelled');
    expect(selectOrderSeat(s)).toBe('the Jedi Temple on Coruscant');
    expect(outcome(s, 'O.tython_found')).toBe('produced');
    // Zallow lives; Zym still dies after the Treaty.
    expect(canonOffBoard(selectCanonInCampaign(s, CANON_BY_ID.get('lore:ven-zallow')!), 3650)).toBeNull();
    expect(canonOffBoard(selectCanonInCampaign(s, CANON_BY_ID.get('lore:zym')!), 3650)).toBe('dead');
  });

  it('a thin occupation opens the hinge: two won fights on Coruscant break it', () => {
    let s = go(breakTag(game(at(3653)), 'E.3653.temple_strike#cond.reach'), at(3653, 6, 21));
    const key = 'E.3653.sacking#cond.hold';
    expect(net(s).progress[key]!.known['know.contestable']!.met).toBe(true);
    const place = applyEvents(REG, s, [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: 'x', moveHere: true }], { source: 'ai' }).state;
    const foe = applyEvents(REG, place, [{ type: 'npcIntroduced', name: 'Lord Vess', species: 'human', faction: 'sithEmpire', role: 'sithLord', ageApprox: 40, description: '' }], { source: 'ai' }).state;
    const foeId = Object.values(foe.npcs.byId).find((n) => n.name === 'Lord Vess')!.id;
    const won = (x: GameState, id: string): GameState => ({ ...x, combat: { ...x.combat, last: { id, stakes: 'lethal', outcome: 'won', reason: 'test', exchanges: 3, seconds: 20, playerFate: null, recorded: false, skillId: 'soresu', day: x.clock.now.day, locationId: x.locations.currentId, duel: { opponents: [{ id: foeId }] } } } });
    s = advanceTime(REG, won(foe, 'fight:1'), { seconds: 3600, reason: 't', source: 'turnDraft' }).state;
    expect(net(s).tags[key]).toBeUndefined();
    s = advanceTime(REG, won(s, 'fight:2'), { seconds: 3600, reason: 't', source: 'turnDraft' }).state;
    expect(net(s).tags[key]).toBeDefined();
    expect(outcome(s, 'O.coruscant_occupied')).toBe('broken');
    expect(net(s).plotPoints['PP-1']).toBeDefined();
  });

  it('the grid kept up breaks the hinge through the Sacking; exposing the offer stops the whole chain', () => {
    const grid = go(breakTag(game(at(3653)), 'E.3653.temple_strike#cond.grid'), at(3653, 7));
    expect(status(grid, 'E.3653.temple_strike')).toBe('adjusted');
    expect([outcome(grid, 'O.temple_destroyed'), status(grid, 'E.3653.sacking'), status(grid, 'E.3653.treaty')]).toEqual(['produced', 'altered', 'cancelled']);
    const offer = go(breakTag(game(at(3655)), 'E.3654.peace_offer#cond.deception'), at(3653, 7));
    expect(['E.3653.alderaan_conference', 'E.3653.temple_strike', 'E.3653.treaty'].map((id) => status(offer, id))).toEqual(['cancelled', 'cancelled', 'cancelled']);
    expect(net(offer).plotPoints['PP-1']).toBeDefined();
  });

  it('Malgus lost: his later story is gone, and only his', () => {
    const s = go(kill(game(at(3655)), 'darth-malgus'), at(3639));
    expect(['E.3653.temple_strike', 'E.3642.maelstrom', 'E.3640.ilum'].map((id) => status(s, id))).toEqual(['altered', 'altered', 'cancelled']);
    expect([outcome(s, 'O.revan_free'), outcome(s, 'O.foundry_malgus'), outcome(s, 'O.treaty_signed')]).toEqual(['produced', 'broken', 'produced']);
    expect(net(s).plotPoints).toEqual({});
  });

  it('the alternative follows the state: losses tip it, and enough of them end a side', () => {
    const alt = (s: GameState): string | undefined => net(go(s, at(3653, 7))).plotPoints['PP-1']?.alternative;
    const open = (): GameState => breakTag(game(at(3653)), 'E.3653.temple_strike#cond.grid');
    expect(alt(open())).toBe('attrition');
    expect(alt(kill(open(), 'darth-marr', 'darth-vowrawn', 'rans'))).toBe('victors-treaty');
    const three = kill(open(), 'darth-marr', 'darth-vowrawn', 'darth-angral');
    expect(alt(three)).toBe('victors-treaty'); // not enough without the capital (D-468 [5])
    expect(alt(engine(three, { type: 'locationControlChanged', place: 'Dromund Kaas', side: 'republic', note: 'taken in play' }))).toBe('total-defeat');
    expect(alt(engine(open(), { type: 'locationControlChanged', place: 'Dromund Kaas', side: 'republic', note: 'taken in play' }))).toBe('attrition'); // nor the capital alone
  });
});

describe('PP-2: the Treaty\'s collapse', () => {
  const FOUR = ['E.3643.desolator#cond.secret', 'E.3642.maelstrom#cond.imprisoned'];
  it('three prevented: on time; four: delayed, and the war\'s first years wait with it', () => {
    const three = kill(FOUR.reduce(breakTag, game(at(3645))), 'darth-baras');
    const s3 = go(three, at(3640, 6));
    expect(net(s3).plotPoints['PP-2']).toBeUndefined();
    expect(net(s3).events['E.3641.treaty_collapse']!.day).toBe(at(3641, 6, 15));
    // The fourth: Xandret never escaped, so there is no Sebaddon affair.
    const four = kill(FOUR.reduce(breakTag, breakTag(game(at(3659, 6)), 'E.3658.xandret#cond.escape')), 'darth-baras');
    const s4 = go(four, at(3640, 6));
    expect(net(s4).plotPoints['PP-2']?.alternative).toBe('delayed');
    expect([outcome(s4, 'O.galactic_war'), status(s4, 'E.3640.corellia')]).toEqual(['pending', undefined]);
    const late = go(s4, at(3636, 6));
    expect(net(late).events['E.3641.treaty_collapse']!.day).toBe(at(3641, 6, 15) + 3 * 368);
    expect(status(late, 'E.3640.corellia')).toBe('adjusted');
  }, 20_000);

  it('any four of the seven delay it: Quesh, Balmorra and Taris can be prevented too (D-468 [2])', () => {
    const keys = ['E.3643.quesh#cond.deal', 'E.3642.balmorra_freed#cond.rising', 'E.3642.taris_invasion#cond.landing', 'E.3643.desolator#cond.secret'];
    const s = go(keys.reduce(breakTag, game(at(3645))), at(3640, 6));
    expect(['O.hutt_treaty_cracked', 'O.balmorra_republic', 'O.taris_imperial', 'O.uphrades_destroyed'].map((o) => outcome(s, o))).toEqual(['broken', 'broken', 'broken', 'broken']);
    expect(net(s).plotPoints['PP-2']?.alternative).toBe('delayed');
    expect(selectControl(s, ['Balmorra', 'Taris']).map((c) => [c.place, c.side, c.held])).toEqual([['Balmorra', 'sithEmpire', 'frozen'], ['Taris', 'republic', 'frozen']]);
  });

  it('two extra incidents bring it early', () => {
    const s = engine(game(at(3646)), { type: 'flagSet', flag: 'sceneOutcome:treaty-incident-balmorra' }, { type: 'flagSet', flag: 'sceneOutcome:treaty-incident-taris' });
    const t = go(s, at(3646, 1, 3));
    expect(net(t).plotPoints['PP-2']?.alternative).toBe('early');
    expect(outcome(t, 'O.galactic_war')).toBe('produced');
    expect(net(go(t, at(3645))).events['E.3641.braga']).toBeUndefined(); // the later events keep their dates
  });
});

describe('rulings', () => {
  it('Hylo Visz breaks the blockade unless stopped or killed first; then another captain does, and takes the fame', () => {
    const led = go(game(), at(3660, 1, 16));
    expect([status(led, 'E.3660.hydian_battle'), net(led).events['E.3660.hydian_battle']!.substitutes]).toEqual(['recorded', []]);
    const s = go(engine(game(), { type: 'flagSet', flag: 'sceneOutcome:visz-stopped' }), at(3658));
    expect(status(s, 'E.3660.hydian_battle')).toBe('substituted');
    const [sub] = net(s).events['E.3660.hydian_battle']!.substitutes;
    expect(CANON_BY_ID.get(sub!.canonId!)!.faction).toBe('underworld');
    expect([outcome(s, 'O.blockade_broken'), outcome(s, 'O.visz_famous'), outcome(s, 'O.riots_ended')]).toEqual(['produced', 'produced', 'produced']);
    expect(status(s, 'E.3659.visz_rumour')).toBe('altered'); // Visz is not the hero who double-crosses the Hutts
  });

  it('a blockade that holds keeps the Hydian Way closed and the riots going', () => {
    const s = go(breakTag(game(), 'E.3660.hydian_battle#cond.hutt_backing'), at(3658));
    expect(selectControl(s, ['Hydian Way']).map((c) => [c.side, c.held])).toEqual([['mandalorians', 'frozen']]);
    expect([status(s, 'E.3660.riots_end'), status(s, 'E.3660.great_hunt')]).toEqual(['cancelled', 'adjusted']);
  });

  it('an assault that succeeds takes Korriban', () => {
    const s = go(breakTag(game(at(3660)), 'E.3660.korriban#cond.defences'), at(3658));
    expect(selectControl(s, ['Korriban']).map((c) => [c.side, c.held])).toEqual([['republic', 'changed']]);
  });

  it('SWTOR protagonists are named as NPCs', () => {
    const s = go(game(at(3643, 3, 20)), at(3643, 4, 2));
    expect(selectTimelineHandoff(s).news.join('\n')).toMatch(/the Hero of Tython: an NPC, never the player character/);
  });
});

describe('recorded deaths', () => {
  const board = (s: GameState, id: string, bby: number) => canonOffBoard(selectCanonInCampaign(s, CANON_BY_ID.get(`lore:${id}`)!), bby);
  it('a death whose event diverged does not happen; the figure keeps office, and can be met', () => {
    const s = go(breakTag(game(at(3653)), 'E.3653.zym#cond.unguarded'), at(3650));
    expect(board(s, 'zym', 3650)).toBeNull();
    expect(canonRankAt(selectCanonInCampaign(s, CANON_BY_ID.get('lore:zym')!), 3650)?.role).toBe('jediMaster');
    const m = meet(s, 'lore:zym');
    expect(selectNpcLevels(m.s, m.id)['forceControl']).toBeGreaterThan(60);
    expect(selectLeaders(s).find((l) => l.office.startsWith('Grand Master'))!.holder).toBe('Zym');
  });
  it('on record it happens on its date, and an unmet figure cannot be linked after it', () => {
    const s = go(game(at(3653)), at(3650));
    expect(board(s, 'zym', 3650)).toBe('dead');
    const r = applyEvents(REG, applyEvents(REG, s, [{ type: 'npcIntroduced', name: 'Zym', species: 'kelDor', faction: 'jediOrder', role: 'jediMaster', ageApprox: 120, description: '' }], { source: 'ai' }).state, [{ type: 'npcCanonLinked', npcRef: 'npc:zym', canonId: 'lore:zym' }], { source: 'engine' });
    expect(r.state.npcs.byId['npc:zym']!.canonId).toBeNull();
  });
  it('a death no event causes still happens, whatever diverged', () => {
    const s = go(breakTag(game(at(3653)), 'E.3653.temple_strike#cond.unaware'), at(3640));
    expect(board(s, 'nok-drayen', 3642)).toBe('dead'); // d. 3,643, on its own account
    expect(board(s, 'darth-angral', 3642)).toBeNull(); // the Desolator crisis needs the Treaty
  });
});

describe('a scene outcome, end to end', () => {
  it('foreknowledge, then a warning believed in a real turn: the engine sets the flag and the strike comes closer to failing', () => {
    const TAG = 'E.3653.temple_strike#cond.unaware';
    let s = game(at(3654, 8));
    // Foreknowledge by a recorded discovery: Darth Angral taken.
    const angral = meet(s, 'lore:darth-angral');
    s = go(engine(angral.s, { type: 'npcCanonDiverged', npcRef: angral.id, reason: 'captured' }), at(3654, 8, 2));
    expect(net(s).progress[TAG]!.known['know.strike']!.met).toBe(true);
    const zym = meet(s, 'lore:zym');
    s = zym.s;
    const warn = { actionType: 'dialogue', targets: [zym.id], references: [], unknownNames: [], skillId: 'charisma' };
    let turns = 0;
    while (!s.flags.set.includes('sceneOutcome:coruscant-warned') && turns < 200) {
      s = go(resolveTurn(REG, s, warn as never).state, s.clock.now.day + 1);
      turns++;
    }
    expect(s.flags.set).toContain('sceneOutcome:coruscant-warned');
    s = go(s, s.clock.now.day + 1);
    expect(net(s).progress[TAG]!.points).toBeGreaterThanOrEqual(3); // the flag is a major fact
  });
  it('without foreknowledge the same warning counts for nothing', () => {
    let s = game(at(3654, 8));
    const zym = meet(s, 'lore:zym');
    s = zym.s;
    for (let i = 0; i < 30; i++) s = go(resolveTurn(REG, s, { actionType: 'dialogue', targets: [zym.id], references: [], unknownNames: [], skillId: 'charisma' } as never).state, s.clock.now.day + 1);
    expect(s.flags.set).toEqual([]);
    expect(net(s).progress['E.3653.temple_strike#cond.unaware']).toBeUndefined();
  });
  it('the narrator cannot set it', () => {
    expect(applyEvents(REG, game(at(3654, 8)), [{ type: 'flagSet', flag: 'sceneOutcome:coruscant-warned' }], { source: 'ai' }).applied).toEqual([]);
  });
});
