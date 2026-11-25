// D-489's rules in the engine (m8-world-d, D-491): who the player is, the power bar, no premonitions, closed events.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { DUELISTS, DUELISTS_WITHOUT_ENTRY, duelistBar, GUARDED, TIER_LEVELS } from '../../src/data/duelists';
import { START_OPTIONS } from '../../src/data/startOptions';
import { WORLD_TRUST, type Who } from '../../src/data/who';
import { WORLD_POST_IDS, worldPost } from '../../src/data/worldPosts';
import type { WorldNetwork } from '../../src/data/worldNetwork';
import { FORESEEN_WORDS } from '../../src/data/worldNetwork.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import type { DuelState } from '../../src/engine/duel';
import { barWound } from '../../src/engine/powerBar';
import { canBeat, duelTier, holdAgainst, isTrust, postsHeld, whoHolds } from '../../src/engine/who';
import type { Wound } from '../../src/engine/wounds';
import { selectCanBeat, selectDuelTier, selectWorldPlayer } from '../../src/features/world/player';
import { actionMatters, recordAction, reviewNetwork, type WorldAction, type WorldFacts } from '../../src/features/world/network';
import { networkProblems } from '../../src/features/world/networkSchema';
import { selectActionMatters, selectWorldAction, selectWorldFacts } from '../../src/features/world/selectors';
import { emptyNetworkState } from '../../src/features/world/world';
import { LORE_INDEX } from '../../src/lore';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { playerAs } from '../support/worldPlayer';

const at = (year: number, month = 1, day = 1): number => absDayFromDate({ year, month, day });
type Levels = Readonly<Record<string, number>>;
const game = (rank = 'knight', levels: Levels = {}, over: { seed?: string; day?: number; path?: 'jedi' | 'sith'; archetype?: string } = {}): GameState => {
  const day = over.day ?? at(-3661, 3, 1);
  return createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: over.seed ?? 'gates',
    start: { day, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: day - 45 * 368, path: over.path ?? 'jedi', archetype: (over.archetype ?? 'jediGuardian') as 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: Object.fromEntries(Object.entries(levels).map(([k, v]) => [k, xpForLevel(v)])),
    rank,
  });
};
const meet = (s: GameState, canonId: string): { s: GameState; id: string } => {
  const c = CANON_BY_ID.get(canonId)!;
  let next = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: c.name, species: 'human', faction: c.faction, role: 'other', ageApprox: 50, description: '' }], { source: 'ai' }).state;
  const id = Object.values(next.npcs.byId).find((n) => n.name === c.name)!.id;
  next = applyEvents(REGISTRY, next, [{ type: 'npcCanonLinked', npcRef: id, canonId }], { source: 'engine' }).state;
  return { s: next, id };
};
/** A lethal fight with a canon figure, resolved to its end. */
const fight = (s0: GameState, canonId: string, engagedElsewhere = false): { s: GameState; id: string } => {
  const m = meet(s0, canonId);
  const p = applyEvents(REGISTRY, m.s, [{ type: 'combatStarted', opponentRefs: [m.id], minionGroups: engagedElsewhere ? [{ kind: 'trooper', count: 1 }] : [], stakes: 'lethal', terrainTags: ['flatFloor'], ...(engagedElsewhere ? { engagedElsewhereRefs: [m.id] } : {}) }], { source: 'ai' });
  expect(p.rejected).toEqual([]);
  let s = applyEvents(REGISTRY, p.state, [{ type: 'fightBegun', fromPending: true }], { source: 'engine' }).state;
  for (let i = 0; i < 6 && s.combat.active; i++) s = applyEvents(REGISTRY, s, [{ type: 'combatAction', action: 'resolve' }], { source: 'player' }).state;
  expect(s.combat.active).toBeNull();
  return { s, id: m.id };
};
const SEEDS = Array.from({ length: 20 }, (_, i) => `bar${i}`);
const SWORD = { soresu: 99, djemSo: 99, endurance: 99, strength: 99, agility: 99 };
const MASTER = { ...SWORD, forceControl: 80, forceSense: 99, willpower: 80 };
const TOP = { ...SWORD, forceControl: 95, forceSense: 99, willpower: 95 };

describe('A1: who the player is', () => {
  it('a gate opens on any one entry whose parts all hold', () => {
    const p = playerAs({ side: 'jediOrder', rankStep: 2, posts: ['sis'], places: ['Coruscant'], tier: 'master', standing: () => 60, trusts: (id) => id === 'lore:zym', hasFlag: (f) => f === 'sceneOutcome:x' });
    const yes: Who[] = [{ sides: ['jediOrder'] }, { minRank: 'knight' }, { posts: ['sis', 'senate'] }, { at: ['Coruscant'] }, { minTier: 'master' }, { minStanding: 60 }, { trustOf: ['lore:zym'] }, { flags: ['sceneOutcome:x'] }, { archetypes: ['jediGuardian'] }, { sides: ['jediOrder'], minRank: 'knight', at: ['Coruscant'] }];
    for (const w of yes) expect(whoHolds([w], p), JSON.stringify(w)).toBe(true);
    const no: Who[] = [{ sides: ['sithEmpire'] }, { minRank: 'master' }, { posts: ['senate'] }, { at: ['Alderaan'] }, { minTier: 'top' }, { minStanding: 61 }, { trustOf: ['lore:satele-shan'] }, { flags: ['sceneOutcome:y'] }, { archetypes: ['smuggler'] }, { sides: ['jediOrder'], minRank: 'master' }];
    for (const w of no) expect(whoHolds([w], p), JSON.stringify(w)).toBe(false);
    expect(whoHolds([...no, yes[0]!], p)).toBe(true);
    expect(whoHolds(undefined, p)).toBe(true);
  });

  it('trust is warmth and time, or a master\'s bond: never one warm scene', () => {
    expect([isTrust(39, 400, false), isTrust(40, 29, false), isTrust(40, 30, false), isTrust(0, 0, true)]).toEqual([false, false, true, true]);
    const met = meet(game(), 'lore:adraas');
    const id = met.id;
    let s = met.s;
    expect(selectWorldPlayer(s).trusts('lore:adraas')).toBe(false);
    for (let i = 0; i < 5; i++) s = applyEvents(REGISTRY, s, [{ type: 'relationshipChanged', npcRef: id, delta: 3, reason: 'test' }], { source: 'ai' }).state;
    expect(s.relationships.byNpcId[id]!.value).toBeGreaterThanOrEqual(WORLD_TRUST.relationship);
    expect(selectWorldPlayer(s).trusts('lore:adraas')).toBe(false);
    s = { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: s.clock.now.day + 40 } } };
    expect(selectWorldPlayer(s).trusts('lore:adraas')).toBe(true);
    expect(selectWorldPlayer(s).posts).toEqual(expect.arrayContaining(['adraas-household', 'strike-team']));
    const bound = meet(game(), 'lore:darth-marr');
    expect(selectWorldPlayer({ ...bound.s, ranks: { ...bound.s.ranks, masterId: bound.id } }).posts).toContain('council-staff');
  });

  it('posts come from the start option, a tie or an engine flag, and the narrator can set none of them', () => {
    const none = { bby: 3661, hasFlag: () => false, trusts: () => false };
    expect(postsHeld({ ...none, startId: 'sis-agent' })).toEqual(['sis', 'serving']);
    expect(postsHeld({ ...none, startId: 'imperial-agent' })).toContain('mandalorian-liaison');
    expect(postsHeld({ ...none, bby: 3655, startId: 'imperial-agent' })).not.toContain('mandalorian-liaison');
    expect(postsHeld({ ...none, startId: null, hasFlag: (f) => f === 'worldPost:senate' })).toEqual(['senate']);
    const r = applyEvents(REGISTRY, game(), [{ type: 'flagSet', flag: 'worldPost:senate' }], { source: 'ai' });
    expect(r.applied).toEqual([]);
    for (const id of WORLD_POST_IDS) {
      for (const o of worldPost(id).starts ?? []) expect(START_OPTIONS.some((x) => x.id === o), `${id} ${o}`).toBe(true);
      for (const c of worldPost(id).tiedTo ?? []) expect(CANON_BY_ID.has(c), `${id} ${c}`).toBe(true);
    }
  });

  it('a Lord with a Master\'s strength stands where a Master does', () => {
    expect(selectWorldPlayer(game('lord', { soresu: 50 }, { path: 'sith', archetype: 'sithWarrior' })).rankStep).toBe(2);
    expect(selectWorldPlayer(game('lord', MASTER, { path: 'sith', archetype: 'sithWarrior' })).rankStep).toBe(3);
    expect(selectWorldPlayer(game('padawan')).rankStep).toBe(1);
  });

  it('an action or a fight by someone the gate does not fit counts for nothing', () => {
    const net = small({ who: [{ sides: ['sithEmpire'], posts: ['council-staff'] }] });
    const st = reviewNetwork(net, emptyNetworkState(at(-3661)), facts(), at(-3661)).state;
    const st2 = (p: WorldFacts['player']): number => recordAction(net, st, facts({ player: p }), act(), at(-3661)).state.progress[KEY]?.points ?? 0;
    expect(actionMatters(net, st, facts(), act())).toBe(false);
    expect([st2(playerAs()), st2(playerAs({ side: 'sithEmpire' })), st2(playerAs({ side: 'sithEmpire', posts: ['council-staff'] }))]).toEqual([0, 0, 3]);
    const won = { wonFight: { id: 'f', stakes: 'lethal' as const, canonIds: [], factions: ['republic' as const], places: ['Ziost'] } };
    const points = (p: WorldFacts['player']): number => reviewNetwork(net, st, facts({ ...won, player: p }), at(-3661)).state.progress[KEY]?.points ?? 0;
    expect([points(playerAs()), points(playerAs({ side: 'sithEmpire', posts: ['council-staff'] }))]).toEqual([0, 3]);
  });

  it('a prerequisite can ask for someone else than the condition does', () => {
    const net = small({ guard: 'high', who: [{ sides: ['jediOrder'] }], prerequisites: [{ id: 'know.it', text: 't', who: [{ sides: ['sithEmpire'] }], tests: [{ kind: 'action', actionTypes: ['investigate'], places: ['Ziost'] }], leads: [{ places: ['Ziost'] }] }] });
    const st = reviewNetwork(net, emptyNetworkState(at(-3661)), facts(), at(-3661)).state;
    const learn = (side: 'jediOrder' | 'sithEmpire'): boolean => recordAction(net, st, facts({ player: playerAs({ side }) }), act(), at(-3661)).state.progress[KEY]?.known['know.it']?.met ?? false;
    expect([learn('jediOrder'), learn('sithEmpire')]).toEqual([false, true]);
  });

  it('a test of the battle itself counts only while it is under way', () => {
    const net = small({ breakIf: [{ kind: 'fight', places: ['Ziost'], strength: 'major', during: true }], who: [{ sides: ['jediOrder'] }] }, { endDate: { year: -3661, month: 6, day: 20 } });
    const won = facts({ wonFight: { id: 'f', stakes: 'lethal', canonIds: [], factions: [], places: ['Ziost'] } });
    const before = reviewNetwork(net, emptyNetworkState(at(-3661)), won, at(-3661, 5, 1)).state;
    expect(before.progress[KEY]).toBeUndefined();
    const begun = reviewNetwork(net, before, facts(), at(-3661, 6, 10)).state;
    expect(reviewNetwork(net, begun, won, at(-3661, 6, 11)).state.tags[KEY]).toBeDefined();
  });
});

// ---- A one-event network ----

const KEY = 'E.3661.thing#cond.x';
function small(cond: object, event: object = {}): WorldNetwork {
  const net = {
    standing: [],
    plotPoints: [],
    events: [
      {
        id: 'E.3661.thing',
        title: 'The thing',
        summary: 'It happens.',
        date: { year: -3661, month: 6, day: 10 },
        places: ['Ziost'],
        roles: [{ id: 'role.m', label: 'Darth Malgus', kind: 'crucial', canonId: 'lore:darth-malgus' }],
        conditions: [{ id: 'cond.x', text: 'x holds', brokenText: 'x is broken', crucial: true, guard: 'medium', breakIf: [{ kind: 'action', actionTypes: ['investigate'], places: ['Ziost'] }, { kind: 'fight', places: ['Ziost'], strength: 'major' }], leads: [{ places: ['Ziost'] }], ...cond }],
        consumes: [],
        produces: [{ outcome: 'O.thing' }],
        source: 'test',
        ...event,
      },
    ],
  } as unknown as WorldNetwork;
  return net;
}
function facts(over: Partial<WorldFacts> = {}): WorldFacts {
  return { bby: 3661, player: playerAs(), npcLost: () => null, storyNpcDead: () => false, hasFlag: () => false, hasLead: () => true, wonFight: null, heldFight: null, standIns: () => [], ...over };
}
const act = (over: Partial<WorldAction> = {}): WorldAction => ({ actionType: 'investigate', skillId: 'investigation', total: 40, places: ['Ziost'], canonIds: [], ...over });

describe('A2: the power bar', () => {
  it('the lists: who is a top duelist when', () => {
    const list = (year: number): string[] => [...new Set(DUELISTS.filter((d) => d.bar === 'top' && year >= d.fromYear && year <= d.toYear).map((d) => d.canonId.slice(5)))].sort();
    expect(list(-3655)).toEqual(['darth-malgus', 'darth-marr', 'revan', 'satele-shan', 'scourge', 'ven-zallow', 'zym']);
    expect(list(-3630)).toEqual(['arcann', 'darth-malgus', 'revan', 'the-outlander', 'thexan', 'vaylin']);
    expect(list(-1000)).toEqual(['darth-bane', 'kasim']);
    expect(list(-20)).toEqual(['anakin-skywalker', 'count-dooku', 'darth-maul', 'darth-plagueis', 'darth-vader', 'mace-windu', 'obi-wan-kenobi']);
    expect(['yoda', 'darth-sidious', 'sheev-palpatine', 'emperor-palpatine'].map((x) => duelistBar(`lore:${x}`, -20))).toEqual(['apex', 'apex', 'apex', 'apex']); // D-494
    expect([duelistBar('lore:abeloth', 44), duelistBar('lore:darth-krayt', 137)]).toEqual(['beyond', 'beyond']);
    expect(list(-2)).toContain('galen-marek');
    expect(list(-4000)).toEqual(['darth-nihilus', 'darth-sion', 'darth-traya', 'exar-kun', 'malak', 'meetra-surik', 'naga-sadow', 'revan', 'scourge', 'ulic-qel-droma']);
    expect(duelistBar('lore:vitiate', -3655)).toBe('beyond'); // D-493
    expect([duelistBar('lore:vitiate', -4000), duelistBar('lore:valkorion', -3632), duelistBar('lore:general-grievous', -20), duelistBar('lore:darth-baras', -3645), duelistBar('lore:darth-angral', -3645), duelistBar(null, -3645)]).toEqual(['beyond', 'beyond', 'master', 'master', null, null]);
    const known = new Set([...CANON_BY_ID.keys(), ...LORE_INDEX.entities.map((e) => e.canonId)]);
    for (const d of [...DUELISTS, ...GUARDED]) expect(known.has(d.canonId) || DUELISTS_WITHOUT_ENTRY.includes(d.canonId), d.canonId).toBe(true);
    // One bar per figure and year.
    for (const d of DUELISTS) expect(DUELISTS.filter((x) => x.canonId === d.canonId && x.fromYear <= d.toYear && x.toYear >= d.fromYear).length, d.canonId).toBe(1);
  });

  it('the tiers', () => {
    const t = (over: object): string => duelTier({ forceUser: true, masterRank: false, meetsMasterSkills: false, combat: 99, forceControl: 99, willpower: 99, ...over });
    const { top, apex } = TIER_LEVELS;
    expect([t({}), t({ meetsMasterSkills: true, combat: top.combat - 1 }), t({ masterRank: true, forceControl: top.forceControl - 1 }), t({ masterRank: true, ...top }), t({ masterRank: true, ...apex, forceControl: apex.forceControl - 1 }), t({ masterRank: true, ...apex })]).toEqual(['below', 'master', 'master', 'top', 'top', 'apex']);
    const all = ['below', 'master', 'top', 'apex'] as const;
    expect(all.map((x) => (['master', 'top', 'apex', 'beyond'] as const).map((b) => canBeat(x, b)))).toEqual([[false, false, false, false], [true, false, false, false], [true, true, false, false], [true, true, true, false]]);
    expect(all.map((x) => [holdAgainst(x, 'top'), holdAgainst(x, 'apex'), holdAgainst(x, 'beyond'), holdAgainst(x, null)])).toEqual([[null, null, null, null], ['brief', null, null, null], ['long', 'brief', null, null], ['long', 'long', null, null]]);
    expect([selectDuelTier(game('knight', SWORD)), selectDuelTier(game('knight', MASTER)), selectDuelTier(game('master')), selectDuelTier(game('master', TOP)), selectDuelTier(game('knight', TOP))]).toEqual(['below', 'master', 'master', 'top', 'top']);
  });

  it('a blow that would end someone above the bar lands lighter, and they break off', () => {
    const w = (over: Partial<Wound>): Wound => ({ id: 'w', part: 'torso', severity: 'mortal', W: 60, stabilized: false, healProgress: 0, day: 0, source: 'test', ...over });
    expect(barWound({ wounds: [] }, w({}))).toMatchObject({ wound: { severity: 'severe', W: 34 }, breaksOff: true });
    expect(barWound({ wounds: [] }, w({ severity: 'severe', W: 30, part: 'leftArm', severed: true })).wound).not.toHaveProperty('severed');
    expect(barWound({ wounds: [] }, w({ severity: 'moderate', W: 12 }))).toMatchObject({ wound: { severity: 'moderate' }, breaksOff: false });
    const hurt = [w({ severity: 'severe', W: 30 }), w({ severity: 'severe', W: 30 }), w({ severity: 'severe', W: 30 })];
    expect(barWound({ wounds: hurt }, w({}))).toMatchObject({ wound: { severity: 'minor' }, breaksOff: true });
    expect(barWound({ wounds: [...hurt, w({ severity: 'minor', W: 5 })] }, w({}))).toEqual({ wound: null, breaksOff: true });
  });

  it('below Master the player never beats a top duelist, whatever the rolls', () => {
    let drawn = 0;
    for (const seed of SEEDS) {
      const { s, id } = fight(game('knight', SWORD, { seed }), 'lore:darth-malgus');
      expect(s.combat.last!.outcome, seed).not.toBe('won');
      expect(s.npcs.byId[id]!.status).not.toBe('deceased');
      expect(s.combat.fates).toEqual([]);
      expect(s.combat.last!.heldOff).toBeUndefined();
      expect(selectWorldFacts(s).wonFight).toBeNull();
      if (s.combat.last!.reason === 'brokeOff') drawn++;
    }
    expect(drawn).toBeGreaterThan(10); // a sword this good would otherwise have won most of them
  });

  it('a Master only delays: a short hold, never a win', () => {
    let held = 0;
    for (const seed of SEEDS) {
      const { s, id } = fight(game('master', MASTER, { seed }), 'lore:darth-malgus');
      expect(s.combat.last!.outcome, seed).not.toBe('won');
      expect(s.npcs.byId[id]!.status).not.toBe('deceased');
      const h = s.combat.last!.heldOff ?? [];
      expect(h.every((x) => x.length === 'brief')).toBe(true);
      if (!h.length) continue;
      held++;
      expect(selectWorldFacts(s).heldFight).toMatchObject({ brief: ['lore:darth-malgus'], long: [] });
    }
    expect(held).toBeGreaterThan(5);
  });

  it('a top-tier player can beat one, and it counts', () => {
    let won = 0;
    for (const seed of SEEDS) {
      const { s } = fight(game('master', TOP, { seed }), 'lore:darth-malgus');
      if (s.combat.last!.outcome !== 'won') continue;
      const o = (s.combat.last!.duel as DuelState).opponents[0]!;
      if (o.yielded === 'fled' || o.yielded === 'withdrew') expect(selectWorldFacts(s).wonFight!.canonIds).toEqual([]);
      else {
        won++;
        expect(selectWorldFacts(s).wonFight!.canonIds).toEqual(['lore:darth-malgus']);
      }
    }
    expect(won).toBeGreaterThan(0);
  });

  it('the bar is on the person and the year, and a spar has none', () => {
    const m = meet(game('knight', SWORD), 'lore:darth-malgus');
    expect([selectCanBeat(m.s, 'lore:darth-malgus'), selectCanBeat(m.s, 'lore:darth-decimus'), selectCanBeat(m.s, null)]).toEqual([false, true, true]);
    const spar = applyEvents(REGISTRY, m.s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [m.id], stakes: 'spar', playOut: true }], { source: 'engine' }).state;
    expect((spar.combat.active!.duel as DuelState).opponents[0]!.aboveBar).toBeUndefined();
    const real = applyEvents(REGISTRY, m.s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [m.id], stakes: 'lethal' }], { source: 'engine' }).state;
    expect((real.combat.active!.duel as DuelState).opponents[0]!.aboveBar).toBe(true);
  });

  it('at least a Master for Baras, who must also be within reach; the Emperor of the older map is beyond anyone', () => {
    expect(selectCanBeat(game('knight', SWORD), 'lore:darth-baras')).toBe(false);
    expect(selectCanBeat(game('master', MASTER), 'lore:darth-baras')).toBe(false); // a Jedi with no way in
    expect(selectCanBeat(game('lord', MASTER, { path: 'sith', archetype: 'sithWarrior' }), 'lore:darth-baras')).toBe(true);
    expect(selectCanBeat(game('master', TOP, { day: at(-4000) }), 'lore:vitiate')).toBe(false);
    // Angral: on the ground, not aboard the flagship.
    const s = game('knight', SWORD);
    const ship = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', name: 'Oppressor', kind: 'ship', region: 'Deep space', description: 'x', moveHere: true }], { source: 'ai' }).state;
    const ground = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: 'x', moveHere: true }], { source: 'ai' }).state;
    expect([selectCanBeat(ship, 'lore:darth-angral'), selectCanBeat(ground, 'lore:darth-angral')]).toEqual([false, true]);
  });

  it('a foe an ally fights is never credited, finished or not', () => {
    const { s } = fight(game('master', TOP), 'lore:darth-decimus', true);
    const last = s.combat.last!;
    expect(last.outcome).toBe('won');
    const duel = last.duel as DuelState;
    const ally = (out: boolean): GameState => ({ ...s, combat: { ...s.combat, last: { ...last, duel: { ...duel, opponents: duel.opponents.map((o) => (o.engagedElsewhere ? { ...o, out, dead: out } : o)) } } } });
    expect([selectWorldFacts(ally(false)).wonFight!.canonIds, selectWorldFacts(ally(true)).wonFight!.canonIds]).toEqual([[], []]);
    const mine: GameState = { ...s, combat: { ...s.combat, last: { ...last, duel: { ...duel, opponents: duel.opponents.map((o) => ({ ...o, engagedElsewhere: false, out: true })) } } } };
    expect(selectWorldFacts(mine).wonFight!.canonIds).toEqual(['lore:darth-decimus']);
    const fled: GameState = { ...s, combat: { ...s.combat, last: { ...last, duel: { ...duel, opponents: duel.opponents.map((o) => ({ ...o, engagedElsewhere: false, out: true, yielded: 'fled' })) } } } };
    expect(selectWorldFacts(fled).wonFight!.canonIds).toEqual([]);
  });

  it('a hold meets a test that asks for one, and no test that asks for a win', () => {
    const tests = (hold?: 'brief' | 'long') => ({ who: [{ sides: ['jediOrder'] }], breakIf: [{ kind: 'fight', canonIds: ['lore:darth-malgus'], strength: 'major', ...(hold ? { hold } : {}) }] });
    const brief = facts({ heldFight: { id: 'f', stakes: 'lethal', places: ['Ziost'], brief: ['lore:darth-malgus'], long: [] } });
    const long = facts({ heldFight: { id: 'f', stakes: 'lethal', places: ['Ziost'], brief: [], long: ['lore:darth-malgus'] } });
    const broken = (hold: 'brief' | 'long' | undefined, f: WorldFacts): boolean => reviewNetwork(small(tests(hold)), emptyNetworkState(at(-3661)), f, at(-3661)).state.tags[KEY] !== undefined;
    expect([broken('brief', brief), broken('brief', long), broken('long', brief), broken('long', long), broken(undefined, brief), broken(undefined, long)]).toEqual([true, true, false, true, false, false]);
  });
});

describe('A3: no premonitions', () => {
  it('Force sense is refused as an inquiry, a lead and a deed', () => {
    const net = small({ who: [{ sides: ['jediOrder'] }] });
    const st = reviewNetwork(net, emptyNetworkState(at(-3661)), facts(), at(-3661)).state;
    expect(recordAction(net, st, facts(), act({ skillId: 'forceSense' }), at(-3661)).state).toBe(st);
    expect(actionMatters(net, st, facts(), act({ skillId: 'forceSense' }))).toBe(false);
    expect(actionMatters(net, st, facts(), act())).toBe(true);
  });

  it('no condition of the shipped network takes it', async () => {
    const { WORLD_NETWORK } = await import('../../src/data/worldNetwork');
    expect(JSON.stringify(WORLD_NETWORK)).not.toMatch(/forceSense|mindTrick|forceUse/);
    const s = applyEvents(REGISTRY, game(), [{ type: 'locationIntroduced', name: 'Korriban', kind: 'planet', region: 'x', description: 'x', moveHere: true }], { source: 'ai' }).state;
    expect(selectActionMatters(s, selectWorldAction(s, { actionType: 'investigate', skillId: 'forceSense', total: 40, targets: [] }))).toBe(false);
  });

  it('a fact or thread that came from a vision is no lead', () => {
    const net = small({ who: [{ sides: ['jediOrder'] }] });
    const st = reviewNetwork(net, emptyNetworkState(at(-3661)), facts(), at(-3661)).state;
    const base = applyEvents(REGISTRY, game(), [{ type: 'locationIntroduced', name: 'Ziost', kind: 'planet', region: 'x', description: 'x', moveHere: true }], { source: 'ai' }).state;
    const led = (fact: string, more: object = {}): boolean => {
      const s = applyEvents(REGISTRY, base, [{ type: 'factLearned', aboutRef: 'Ziost', fact, importance: 'major', ...more }], { source: 'ai' }).state;
      return recordAction(net, st, selectWorldFacts(s), act(), at(-3661)).state !== st;
    };
    expect(led('Supply ships have been leaving by night')).toBe(true);
    expect(led('Supply ships have been leaving by night', { vision: true })).toBe(false);
    for (const t of ['A vision of fire over the city', 'Kael sensed something terrible in the Force', 'In a dream the gate stood open', 'There is a disturbance in the Force here']) {
      expect(FORESEEN_WORDS.test(t), t).toBe(true);
      expect(led(t), t).toBe(false);
    }
    for (const t of ['The envoy has a clear vantage over the docks', 'A guard felt ill and left the post', 'Force pikes are stored in the vault']) expect(FORESEEN_WORDS.test(t), t).toBe(false);
  });
});

describe('closed events', () => {
  const closed = small({ who: [{ sides: ['jediOrder'] }] }, { closed: true, endDate: { year: -3661, month: 6, day: 20 } });
  const start = at(-3661, 6, 10);
  it('nothing done inside one counts: not a roll, a won fight, a hold, nor a figure lost in it', () => {
    const begun = reviewNetwork(closed, emptyNetworkState(at(-3661)), facts(), start).state;
    expect(begun.events['E.3661.thing']!.status).toBe('underway');
    expect(recordAction(closed, begun, facts(), act({ total: 60 }), start).state).toBe(begun);
    expect(actionMatters(closed, begun, facts(), act())).toBe(false);
    const all = facts({
      player: playerAs({ tier: 'top', rankStep: 3 }),
      wonFight: { id: 'f', stakes: 'lethal', canonIds: ['lore:darth-malgus'], factions: ['sithEmpire'], places: ['Ziost'] },
      heldFight: { id: 'f', stakes: 'lethal', places: ['Ziost'], brief: [], long: ['lore:darth-malgus'] },
      npcLost: (id, before) => (id === 'lore:darth-malgus' && (before === undefined || start + 1 < before) ? 'dead' : null),
    });
    const after = reviewNetwork(closed, begun, all, start + 2).state;
    expect([after.tags, after.progress]).toEqual([{}, {}]);
    expect(reviewNetwork(closed, after, all, at(-3661, 6, 21)).state.events['E.3661.thing']!.status).toBe('recorded');
  });
  it('who was lost before it began does reach it', () => {
    const gone = facts({ npcLost: (id, before) => (id === 'lore:darth-malgus' && (before === undefined || start - 5 < before) ? 'dead' : null) });
    const s = reviewNetwork(closed, emptyNetworkState(at(-3661)), gone, at(-3661, 6, 21)).state;
    expect(s.events['E.3661.thing']!.status).toBe('altered');
  });
  it('the facts know the day a figure was lost', () => {
    const m = meet(game(), 'lore:darth-decimus');
    const s = applyEvents(REGISTRY, m.s, [{ type: 'npcDied', npcRef: m.id, cause: 'test' }], { source: 'engine' }).state;
    const f = selectWorldFacts(s);
    const today = s.clock.now.day;
    expect([f.npcLost('lore:darth-decimus'), f.npcLost('lore:darth-decimus', today), f.npcLost('lore:darth-decimus', today + 1)]).toEqual(['dead', null, 'dead']);
  });
  it('a closed role is out of reach, and the data checks refuse a step inside a closed event', () => {
    const role = small({ who: [{ sides: ['jediOrder'] }] }, { roles: [{ id: 'role.m', label: 'Revan', kind: 'crucial', canonId: 'lore:revan', closed: true }] });
    expect(reviewNetwork(role, emptyNetworkState(at(-3661)), facts({ npcLost: () => 'dead' }), at(-3661, 7)).state.events['E.3661.thing']!.status).toBe('recorded');
    expect(networkProblems(closed).join()).toMatch(/a closed event has no step inside it/);
    expect(networkProblems(small({ who: [{ sides: ['jediOrder'] }] }))).toEqual([]);
  });
});
