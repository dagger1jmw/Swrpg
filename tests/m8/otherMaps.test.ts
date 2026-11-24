// M8 Phase B (D-467): the schema can hold the two tag maps that are not shipped, 3,640-1,000 BBY (PP-9 to PP-13, very
// high guards) and 1,000 BBY-4 ABY (PP-0 to PP-8). Nothing here ships: the events are read from the maps, and the plot
// points are skeletons that use every construct the maps ask for. What the schema cannot hold is listed as gaps.
import { describe, expect, it } from 'vitest';
import { WORLD_NETWORK, type ConditionTag, type PlotPointDef, type WorldEventDef, type WorldExpr, type WorldNetwork } from '../../src/data/worldNetwork';
import { networkProblems, worldNetworkSchema } from '../../src/features/world/networkSchema';
import { endsIn, mapRows, rowToEvent } from '../support/tagMaps';

const load = (file: string): { events: WorldEventDef[]; undated: string[] } => {
  const rows = mapRows(file);
  const events = rows.map(rowToEvent);
  return { events: events.filter((e): e is WorldEventDef => e !== null), undated: rows.filter((_, i) => events[i] === null).map((r) => r.id) };
};
const LATER = load('world-event-tags-3640-1000BBY-draft.md');
const LAST = load('world-event-tags-1000BBY-4ABY-draft.md');

const broken = (outcome: string): WorldExpr => ({ outcome, is: 'broken' });
const made = (outcome: string): WorldExpr => ({ outcome, is: 'produced' });
const pp = (n: number, title: string, events: string[], tracker: WorldExpr, alternatives: string[], requires: Record<string, WorldExpr> = {}): PlotPointDef => ({
  id: `PP-${n}`,
  title,
  events,
  tracker,
  alternatives: alternatives.map((t, i) => ({ id: `a${i + 1}`, title: t, heading: t, parameters: [], base: i === alternatives.length - 1 ? 0 : 1, criteria: [], ...(requires[`a${i + 1}`] ? { requires: requires[`a${i + 1}`]! } : {}) })),
});

/** PP-13 alternative 3: Bane held in a duel within the bomb's range; the one very high condition the maps set outright. */
const HOLD_BANE: ConditionTag = {
  id: 'cond.bane_escapes',
  text: 'Bane is clear of the bomb',
  brokenText: 'Bane is held within the thought bomb\'s reach',
  crucial: true,
  guard: 'veryHigh',
  prerequisites: [
    { id: 'know.bomb', text: 'What Kaan means to do', tests: [{ kind: 'action', actionTypes: ['investigate'], places: ['Ruusan'] }], leads: [{ places: ['Ruusan'] }] },
    { id: 'know.bane', text: 'Where Bane is', tests: [{ kind: 'action', actionTypes: ['forceUse'], places: ['Ruusan'] }, { kind: 'npc', canonId: 'lore:qordis', state: 'captured' }], leads: [{ canonIds: ['lore:darth-bane'] }] },
  ],
  breakIf: [{ kind: 'fight', canonIds: ['lore:darth-bane'], minStakes: 'lethal', strength: 'decisive' }, { kind: 'action', actionTypes: ['forceUse'], places: ['Ruusan'] }],
};

/** The thought-bomb branch: the bomb does not destroy the Brotherhood, and two Sith lineages go on. */
const withBranches = (events: WorldEventDef[]): WorldEventDef[] =>
  events.map((e) =>
    e.id === 'E.1000.thought_bomb'
      ? { ...e, conditions: [...e.conditions, HOLD_BANE], produces: [...e.produces.map((p) => ({ ...p, when: { intact: [HOLD_BANE.id, ...e.conditions.map((c) => c.id)] } })), { outcome: 'O.two_sith_lineages', when: { broken: e.conditions.map((c) => c.id) } }] }
      : e,
  );

const PLOT_POINTS: PlotPointDef[] = [
  // PP-0's per-reform triggers: each reform turns on its own, so each is its own point (gap 1).
  pp(100, 'PP-0 R1: the army', ['E.1000.reformation'], broken('O.sith_believed_extinct'), ['The Republic keeps a standing army']),
  pp(101, 'PP-0 R2: Jedi independence', ['E.1000.reformation'], broken('O.jedi_lords'), ['The Jedi stay independent']),
  pp(102, 'PP-0 R3: infant training', ['E.1000.reformation'], { all: [broken('O.jedi_from_birth'), { not: made('O.child_recruits') }] }, ['Infant training is not adopted']),
  pp(3, 'Palpatine becomes Chancellor', ['E.32.election'], broken('O.palpatine_chancellor'), ['Valorum survives the vote', 'Another candidate wins', 'Sidious is exposed'].reverse()),
  pp(4, 'The Clone Wars begin', ['E.22.powers_vote', 'E.22.geonosis'], broken('O.grand_army'), ['No clone army', 'A settlement', 'War without clones']),
  pp(5, 'The fall of the Jedi', ['E.19.windu', 'E.19.order66', 'E.19.new_order'], { any: [broken('O.vader'), broken('O.jedi_purged'), broken('O.empire')] }, ['Sidious killed', 'No Vader', 'Order 66 fails'], { a2: broken('O.vader') }),
  pp(6, 'The Alliance forms', ['E.2.corellian_treaty'], broken('O.alliance'), ['Fragmented cells', 'No trap']),
  pp(7, 'Yavin', ['E.0.plans', 'E.0.yavin'], broken('O.death_star_destroyed'), ['The Death Star survives', 'The plans are never stolen'], { a2: broken('O.plans_stolen') }),
  pp(8, 'Endor', ['E.4.endor'], broken('O.emperor_dead'), ['The Emperor survives', 'Vader lives']),
  // PP-9 (ruled): the vessel never reaches the throne room, or gets away from it (a very high guard).
  pp(9, 'The Eternal Empire', ['E.3636.korriban', 'E.3636.thexan', 'E.3636.expedition', 'E.3636.eternal_empire'], { any: [broken('O.outlander_before_throne'), broken('O.outlander_frozen'), broken('O.vitiate_awake')] }, ['No vessel', 'The Outlander escapes', 'The spirit is not restored'], { a1: broken('O.outlander_before_throne'), a2: broken('O.outlander_frozen') }),
  pp(10, 'The fall of Vitiate', ['E.3636.lana_search', 'E.3631.rescue', 'E.3630.zakuul'], { any: [broken('O.rescue_network'), broken('O.outlander_free')] }, ['The Outlander stays frozen', 'A weaker Alliance', 'Vitiate takes the Commander', 'The Alliance keeps the Fleet'], { a2: { atLeast: 1, of: [broken('O.gravestone_free'), broken('O.alliance_zakuul')] } }),
  pp(12, 'The Fourth Great Schism', ['E.2000.schism'], broken('O.new_sith'), ['Stopped before he leaves', 'Stopped before the clans unite', 'A Sith player unites the clans', 'Ruin exposed after the fact'], { a4: made('O.new_sith') }),
  pp(13, 'Ruusan', ['E.1000.bane_lehon', 'E.1002.ruusan'], { any: [broken('O.thought_bomb_known'), broken('O.rule_of_two'), { atLeast: 2, of: [broken('O.ruusan_endgame'), broken('O.army_of_light'), broken('O.child_recruits')] }] }, ['The Brotherhood wins', 'No thought bomb', 'Bane is caught in the bomb'], { a3: { tag: `E.1000.thought_bomb#${HOLD_BANE.id}`, is: 'broken' } }),
];

const ALL: WorldNetwork = {
  standing: [],
  scenes: WORLD_NETWORK.scenes ?? [],
  events: [...WORLD_NETWORK.events, ...LATER.events, ...withBranches(LAST.events)],
  plotPoints: [...WORLD_NETWORK.plotPoints, ...PLOT_POINTS],
};

describe('the maps that are not shipped', () => {
  it('very high guards in the maps load with their two steps, and are refused without', () => {
    const high = LATER.events.filter((e) => e.conditions.some((c) => c.guard === 'veryHigh'));
    expect(high.map((e) => e.id)).toContain('E.3636.eternal_empire');
    const bare = { ...ALL, events: ALL.events.map((e) => (high.includes(e) ? { ...e, conditions: e.conditions.map(({ prerequisites: _p, ...c }) => c) } : e)) };
    expect(networkProblems(bare).join('\n')).toMatch(/E\.3636\.eternal_empire.*needs 2 distinct prerequisites/);
  });

  it('every dated row of both maps loads', () => {
    expect(LATER.events.length).toBeGreaterThan(60);
    expect(LAST.events.length).toBeGreaterThan(50);
    expect(worldNetworkSchema.safeParse({ ...ALL, plotPoints: [] }).error?.issues ?? []).toEqual([]);
  });

  it('gap: the undated rows have no year to fall on', () => {
    expect([...LATER.undated, ...LAST.undated]).toEqual(['E.?.empire_vanishes', 'E.?.tython_ruined']);
  });

  it('the three maps join, and their plot points load; only the undated events are missing', () => {
    // Without the two undated events their consumers have no producer; everything else resolves across the maps.
    expect(networkProblems(ALL)).toEqual([
      'E.>3522.desolous: consumes O.sith_empire_gone, which nothing produces',
      'E.2000.schism: consumes O.sith_empire_gone, which nothing produces',
      'E.1250.sictis: consumes O.tython_dark, which nothing produces',
    ]);
    expect(networkProblems({ ...ALL, standing: [{ outcome: 'O.sith_empire_gone', note: 'undated' }, { outcome: 'O.tython_dark', note: 'undated' }] })).toEqual([]);
  });

  it('gap: an event cannot end an outcome', () => {
    expect(mapRows('world-event-tags-3640-1000BBY-draft.md').flatMap((r) => endsIn(r).map((o) => `${r.id}: ${o}`))).toEqual(['E.3630.zakuul: O.zakuul_dominant']);
  });

  it('none of it ships', () => {
    const ids = new Set(WORLD_NETWORK.events.map((e) => e.id));
    for (const e of [...LATER.events, ...LAST.events]) expect(ids.has(e.id), e.id).toBe(false);
  });

  it('gap: a plot point must have an alternative (PP-11 has none by ruling)', () => {
    expect(worldNetworkSchema.safeParse({ ...ALL, plotPoints: [{ id: 'PP-11', title: 'x', events: ['E.3641.braga'], tracker: broken('O.galactic_war'), alternatives: [] }] }).success).toBe(false);
  });
});
