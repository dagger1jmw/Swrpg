// m8-ship-battles (checklist item 13 part 1; D-516, D-517; docs-v2/spec/ship-battles.md): dogfights and fleet battles in play,
// and the three m8-traits fixes (Part A).
import { describe, expect, it } from 'vitest';
import { ARCHETYPES, ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { BOARDING, STANDING_FORCES } from '../../src/data/shipBattles.config';
import { DOGFIGHT, FLEET, FORMATION_BEATS, FORMATION_LABEL } from '../../src/data/shipCombat.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { canBeat, duelTier } from '../../src/engine/who';
import { flown } from '../../src/engine/dogfight';
import { newShip, shipClass } from '../../src/engine/ships';
import { seedRng } from '../../src/engine/rng';
import { battleMenu, boardingFought, buildBattle, stepBattle, type Battle, type BattleSetup, type StepCtx } from '../../src/features/battles/rules';
import { parseProposal, sideOf } from '../../src/features/battles/setup';
import { selectActiveBattle, selectBattleMenu, selectRecentBattle } from '../../src/features/battles/selectors';
import { selectShipCrew } from '../../src/features/combat/selectors';
import { canonFigureLevelsAt, npcLevelsFor } from '../../src/features/npcs/selectors';
import { selectWorldFacts } from '../../src/features/world/selectors';
import { selectDuelTier } from '../../src/features/world/player';
import { narrativeEventTypes } from '../../src/ai/schemas/compose';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { Registry } from '../../src/state/types';
import type { Intent } from '../../src/ai/schemas/intent';
import { resolveTurn } from '../../src/turn/resolve';
import { planTravel } from '../../src/turn/travel';

const day = (bby: number, month = 1, d = 1): number => absDayFromDate({ year: -bby, month, day: d });
const START = day(3661);

/** Only the world's time hook, so the seconds of a battle pass quickly. */
const FAST: Registry<GameState> = REGISTRY.map((f) => {
  if (f.id === 'world') return f;
  const { onTimeAdvanced: _hook, ...rest } = f;
  return rest;
});

const fresh = (over: { path?: 'jedi' | 'career'; archetype?: string; faction?: string; flags?: string[] } = {}, at = START): GameState => {
  const s = createInitialState<GameState>(FAST, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'ships',
    start: { day: at, second: 8 * 3600 },
    character: {
      name: 'Kael',
      birthDay: at - 30 * 368,
      path: over.path ?? 'jedi',
      archetype: over.archetype ?? 'jediGuardian',
      ...(over.path === 'career' ? {} : { mainFormId: 'soresu', trainingStartAge: 4 }),
      ...(over.faction ? { start: { optionId: 'test', faction: over.faction, imperialBorn: over.faction === 'sithEmpire' } } : {}),
    },
    rank: over.path === 'career' ? 'career' : 'knight',
  });
  const placed = applyEvents(FAST, s, [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: '', moveHere: true }], { source: 'ai' }).state;
  return (over.flags ?? []).reduce((x, flag) => applyEvents(FAST, x, [{ type: 'flagSet', flag }], { source: 'engine' }).state, placed);
};

/** The narrator's battle: combatStarted with the one plain-words field. */
const propose = (s: GameState, ships: string) => applyEvents(FAST, s, [{ type: 'combatStarted', opponentRefs: [], stakes: 'lethal', terrainTags: [], ships }], { source: 'ai' });
const order = (s: GameState, orders: Record<string, unknown> = {}, auto?: boolean) => resolveTurn(FAST, s, null, { battle: { orders, ...(auto !== undefined ? { auto } : {}) } });
const CTX: StepCtx = { troopsFor: () => 'sithTrooper', playerJedi: false };

/** A fleet battle built directly (pure), for boarding and evacuation. */
function fleetSetup(over: Partial<BattleSetup> = {}, mineFaction = 'republic', enemyFaction = 'sithEmpire'): BattleSetup {
  const cmd = { name: 'Admiral', npcId: null, tactics: 50, traits: [] as string[], jedi: false };
  const playerShips = [newShip('a0', 'hammerhead', 45, 'Hammerhead 1'), newShip('a1', 'hammerhead', 45, 'Hammerhead 2')];
  const enemyShips = [newShip('b0', 'harrower', 45, 'Harrower 1'), newShip('b1', 'fury', 45, 'Fury 1')];
  return {
    id: 'battle-t',
    kind: 'fleet',
    role: 'crew',
    trigger: 'sighted',
    stakes: 'lethal',
    placeId: null,
    placeName: 'open space',
    year: -3661,
    player: sideOf('the fleet', mineFaction, 'navy', cmd),
    enemy: sideOf('the enemy', enemyFaction, 'navy', { ...cmd, name: 'Moff' }),
    playerShips,
    enemyShips,
    ownShipId: 'a0',
    rng: seedRng('t'),
    playerCommands: false,
    ...over,
  };
}
const withFleet = (b: Battle, f: (x: NonNullable<Battle['fleet']>) => NonNullable<Battle['fleet']>): Battle => ({ ...b, fleet: f(b.fleet!) });
const disable = (b: Battle, side: 'a' | 'b', id: string): Battle => withFleet(b, (f) => ({ ...f, range: 'close', [side]: { ...f[side], ships: f[side].ships.map((s) => (s.id === id ? { ...s, disabledMinutes: 60 } : s)) } }));
/** Steps under many seeds until the test holds (the boarding chance is a roll). */
function seeds(b: Battle, orders: Record<string, unknown>, ctx: StepCtx, until: (r: ReturnType<typeof stepBattle>) => boolean): ReturnType<typeof stepBattle> {
  for (let i = 0; i < 200; i++) {
    const r = stepBattle(withFleet(b, (f) => ({ ...f, rng: seedRng(`s${i}`) })), orders, ctx);
    if (until(r)) return r;
  }
  throw new Error('never in 200 seeds');
}

describe('Part A: the m8-traits fixes', () => {
  it('the field agent has its own main share of 0.35; every other archetype keeps half to the main (D-516)', () => {
    expect(ARCHETYPE_BY_ID.get('intelAgent')!.mainShare).toBe(0.35);
    for (const a of ARCHETYPES) if (a.id !== 'intelAgent') expect(a.mainShare, a.id).toBeUndefined();
  });
  it('the field agent\'s paces: Stealth on top, Blaster at the officer\'s pace or better, Melee and Investigation back, Intelligence and Tactics kept', () => {
    const p = ARCHETYPE_BY_ID.get('intelAgent')!.paces.knight!;
    const officer = ARCHETYPE_BY_ID.get('officer')!.paces.knight!;
    expect(Object.entries(p).sort((a, b) => b[1] - a[1])[0]![0]).toBe('stealth');
    expect(p['blaster']!).toBeGreaterThanOrEqual(officer['blaster']!);
    expect(Math.abs(p['melee']! - 0.19)).toBeLessThan(0.02);
    expect(Math.abs(p['investigation']! - 0.24)).toBeLessThan(0.02);
    expect(Math.abs(p['intelligence']! - 0.956)).toBeLessThan(0.02);
    expect(Math.abs(p['tactics']! - 0.582)).toBeLessThan(0.02);
    expect(p['intelligence']!).toBeGreaterThanOrEqual(officer['intelligence']!);
  });
  it('a generated field agent: Stealth in the 50s 25 years in (the measure: mainAt25) and still the top skill; out-shoots the analyst again', () => {
    const at = (id: string, age: number) => npcLevelsFor({ archetype: id, path: 'career', talents: {}, startAge: ARCHETYPE_BY_ID.get(id)!.startAge, warYears: 0, rank: 'career', seed: `t:${id}`, minionGrade: 1 }, 'human', age, START);
    const ag = at('intelAgent', ARCHETYPE_BY_ID.get('intelAgent')!.startAge + 25);
    expect(ag['stealth']!).toBeGreaterThanOrEqual(45);
    expect(ag['stealth']!).toBeLessThan(62);
    for (const k of ['intelligence', 'tactics', 'blaster', 'melee', 'investigation', 'charisma']) expect(ag['stealth']!, k).toBeGreaterThan(ag[k] ?? 0);
    expect(at('intelAgent', 45)['blaster']!).toBeGreaterThan(at('intelAnalyst', 45)['blaster']!);
  });
  it('Galena Rans: her Piloting and Gunnery hold after her flying career ends (3,653 BBY); the rest of her line moves on', () => {
    const g = CANON_BY_ID.get('lore:galena-rans')!;
    const lv = (bby: number) => canonFigureLevelsAt(g, bby, day(bby));
    expect(lv(3655)['piloting']).toBeCloseTo(60, 6);
    for (const k of ['piloting', 'gunnery']) {
      expect(lv(3640)[k]!, k).toBeCloseTo(lv(3653)[k]!, 6);
      expect(lv(3620)[k]!, k).toBeCloseTo(lv(3653)[k]!, 6);
    }
    expect(lv(3640)['charisma']!).toBeGreaterThan(lv(3653)['charisma']!);
  });
  it('the tier gates do not read traits: a trait never moves a duel tier or what it can beat', () => {
    const s = fresh();
    const withTraits: GameState = { ...s, traits: { ...s.traits, held: [{ id: 'reckless', since: START, source: 'creation' }, { id: 'proud', since: START, source: 'creation' }, { id: 'disciplined', since: START, source: 'creation' }] } };
    expect(selectDuelTier(withTraits)).toBe(selectDuelTier(s));
    // duelTier's inputs are levels and rank only; canBeat compares tiers.
    const t = duelTier({ forceUser: true, masterRank: true, meetsMasterSkills: true, combat: 80, forceControl: 80, willpower: 80 });
    expect([canBeat(t, 'top'), canBeat('apex', 'apex'), canBeat('top', 'apex'), canBeat('below', 'master')]).toEqual([canBeat(t, 'top'), true, false, false]);
  });
});

describe('a battle starts only through a validated event, and ends only by the code', () => {
  it('the narrator\'s combatStarted with ships builds a dogfight from the dated classes', () => {
    const r = propose(fresh(), 'enemy: three Imperial Mark VI Supremacy fighters; mine: Aurek');
    const b = selectActiveBattle(r.state)!;
    expect(b).not.toBeNull();
    expect([b.kind, b.role, b.queue.length, r.state.combat.pending]).toEqual(['dogfight', 'pilot', 2, null]);
    expect(shipClass(b.dog!.a.ship.classId).id).toBe('aurek');
    expect(shipClass(b.dog!.b.ship.classId).id).toBe('supremacy');
  });
  it('a class out of service, the player\'s own side, or no ship at all is refused, and no battle starts', () => {
    const s = fresh();
    for (const words of ['enemy: two Imperial TIE/LN fighters; mine: Aurek', 'enemy: two Republic Aurek fighters; mine: Aurek', 'enemy: nothing much', 'enemy: two Imperial Supremacy fighters']) {
      const r = propose(s, words);
      expect(selectActiveBattle(r.state), words).toBeNull();
    }
  });
  it('the narrator cannot send the battle event itself, nor end a battle', () => {
    const s = fresh();
    expect(narrativeEventTypes(REGISTRY, s, { timeAdvancedByDraft: false })).not.toContain('shipBattleProposed');
    expect(applyEvents(FAST, s, [{ type: 'shipBattleProposed', what: 'enemy: two Imperial Supremacy fighters; mine: Aurek' }], { source: 'ai' }).applied).toEqual([]);
    const on = propose(s, 'enemy: two Imperial Supremacy fighters; mine: Aurek').state;
    const ended = applyEvents(FAST, on, [{ type: 'combatEnded', reason: 'interrupted', why: 'the fight is over' }], { source: 'ai' }).state;
    expect(selectActiveBattle(ended)).not.toBeNull();
  });
  it('command goes by rank; the story can hand it over', () => {
    const words = 'enemy: two Imperial Harrower dreadnoughts; allies: four Thranta corvettes';
    expect(selectActiveBattle(propose(fresh(), words).state)!.role).toBe('crew');
    expect(selectActiveBattle(propose(fresh(), `${words}; role: commander`).state)).toBeNull();
    expect(selectActiveBattle(propose(fresh(), `${words}; command: the admiral is dead`).state)!.role).toBe('commander');
    expect(selectActiveBattle(propose(fresh({ flags: ['fleetCommand'] }), `${words}; role: commander`).state)!.role).toBe('commander');
  });
  it('the plain words read the scale, the side, an ambush and the player\'s ship', () => {
    const p = parseProposal('enemy: a squadron of Imperial Supremacy fighters; mine: Aurek; ambush', 'republic', -3661);
    expect([p.scale, p.trigger, p.enemyFaction, p.playerShip]).toEqual(['dogfight', 'ambush', 'sithEmpire', 'Aurek']);
    expect(parseProposal('enemy: two Harrower dreadnoughts; allies: four Thranta corvettes', 'republic', -3661).scale).toBe('fleet');
  });
});

describe('the tactics menu shows the right moves, and its costs match the engine', () => {
  it('a dogfight: the manoeuvres the engine would fly here, torpedo lock only from the tail, the power costs', () => {
    const b = selectActiveBattle(propose(fresh(), 'enemy: two Imperial Supremacy fighters; mine: Aurek').state)!;
    const m = battleMenu(b);
    for (const o of m.options.filter((x) => x.group === 'manoeuvre')) expect(o.available, o.label).toBe(flown(o.orders, b.dog!.a, b.dog!.track, b.dog!.terrain) === o.orders.manoeuvre);
    expect(m.options.find((o) => o.label === 'Torpedo lock')!.available).toBe(b.dog!.track >= 3);
    expect(m.options.find((o) => o.label === 'Power to lasers')!.strong).toBe(`fire x${DOGFIGHT.boost.lasers}`);
    expect(m.options.find((o) => o.label === 'Power to shields')!.strong).toBe(`shield recovery x${DOGFIGHT.boost.shields}`);
    const tail = { ...b, dog: { ...b.dog!, track: 3 } };
    expect(battleMenu(tail).options.find((o) => o.label === 'Torpedo lock')!.available).toBe(true);
  });
  it('a fleet in command: each formation with what it beats and loses to, the reform cost, rolling\'s cost in guns', () => {
    const b = selectActiveBattle(propose(fresh({ flags: ['fleetCommand'] }), 'enemy: two Imperial Harrower dreadnoughts; allies: four Thranta corvettes; role: commander').state)!;
    const m = battleMenu(b);
    const slash = m.options.find((o) => o.group === 'formation' && o.label.startsWith(FORMATION_LABEL.slash))!;
    expect(slash.strong).toBe(`beats ${FORMATION_BEATS.slash.map((x) => FORMATION_LABEL[x]).join(', ')}`);
    expect(slash.cost).toContain(`${FLEET.reformPenalty}`);
    expect(slash.cost).toContain(`Tactics ${FLEET.reformDc}+`);
    expect(m.options.find((o) => o.label.startsWith('Roll damaged'))!.cost).toBe(`guns x${FLEET.rolled} that round`);
    const faked = { ...b, fleet: { ...b.fleet!, a: { ...b.fleet!.a, formation: 'fake' as const } } };
    expect(battleMenu(faked).options.find((o) => o.label.startsWith(FORMATION_LABEL.exchange))!.cost).toBe('planned: no penalty');
  });
});

describe('playing it', () => {
  it('a dogfight turn moves the clock 5 s; a fleet round 3 minutes', () => {
    const s = propose(fresh(), 'enemy: two Imperial Supremacy fighters; mine: Aurek').state;
    expect(order(s, { manoeuvre: 'fly', shot: 'guns' }).draft.timeAdvanced!.seconds).toBe(5);
    const f = propose(fresh(), 'enemy: two Imperial Harrower dreadnoughts; allies: four Thranta corvettes').state;
    expect(order(f).draft.timeAdvanced!.seconds).toBe(180);
  });
  it('"let it play out" resolves with the character\'s own skills, and the controls can be taken back', () => {
    const s = propose(fresh(), 'enemy: three Imperial Supremacy fighters; mine: Aurek').state;
    expect(selectActiveBattle(s)!.dog!.a.ship.crew.piloting).toBeCloseTo(selectShipCrew(s).piloting, 6);
    const r = order(s, {}, true);
    const b = selectActiveBattle(r.state) ?? r.state.battles.last;
    expect(b.auto || b.end).toBeTruthy();
    expect(b.turn).toBeGreaterThan(0);
    if (selectActiveBattle(r.state)) {
      const back = order(r.state, {}, false);
      expect(selectActiveBattle(back.state)!.auto).toBe(false);
      expect(selectBattleMenu(back.state)!.watching).toBe(false);
    }
  });
  it('the map is redrawn only when something it shows changed', () => {
    const b = buildBattle(fleetSetup());
    const sig = b.mapSig;
    const r = stepBattle(b, {}, CTX);
    expect(r.battle.map).not.toBeNull();
    if (r.battle.mapSig === sig) expect(r.battle.map).toBe(b.map);
  });
});

describe('boarding (Jared, 26 Nov 2026)', () => {
  it('the player\'s own ship boarded hands off to personal combat, and the result comes back', () => {
    const b = disable(buildBattle(fleetSetup()), 'a', 'a0');
    const r = seeds(b, {}, CTX, (x) => x.handoff !== null);
    expect(r.handoff).toMatchObject({ purpose: 'repel', troops: { kind: 'sithTrooper' } });
    expect(r.battle.boarding).toMatchObject({ ofSide: 'player', stage: 'personal' });
    const back = boardingFought({ ...r.battle, boarding: { ...r.battle.boarding!, fightId: 'fight-0' } }, true);
    expect(back.battle.boarding).toBeNull();
    expect(back.battle.out).toBe(false);
  });
  it('through the turn: the boarding fight is ordinary combat, and its win returns to the ship battle', () => {
    let s = propose(fresh(), 'enemy: two Imperial Harrower dreadnoughts; allies: four Thranta corvettes').state;
    for (let i = 0; i < 200 && !s.combat.active; i++) {
      const b = selectActiveBattle(s)!;
      const set = disable(b, 'a', b.ownShipId);
      const t: GameState = { ...s, battles: { ...s.battles, active: withFleet(set, (f) => ({ ...f, rng: seedRng(`t${i}`) })) } };
      const r = order(t);
      if (r.state.combat.active) s = r.state;
    }
    expect(s.combat.active).not.toBeNull();
    const waiting = selectActiveBattle(s)!;
    expect(waiting.boarding!.fightId).toBe(s.combat.active!.id);
    // The fight ends in a win: the next turn hands the result back.
    const won: GameState = { ...s, combat: { ...s.combat, active: null, last: { ...(s.combat.last ?? {}), id: waiting.boarding!.fightId!, outcome: 'won', stakes: 'lethal', day: s.clock.now.day } as never } };
    const r = resolveTurn(FAST, won, null, {});
    expect(selectActiveBattle(r.state)?.boarding ?? null).toBeNull();
  });
  it('a boarding elsewhere in the fleet resolves in the background and does not interrupt', () => {
    const b = disable(buildBattle(fleetSetup()), 'a', 'a1');
    const r = seeds(b, {}, CTX, (x) => /boarded and taken|thrown back/.test([...x.lines, ...x.big].join(' ')));
    expect(r.handoff).toBeNull();
    expect(r.battle.boarding).toBeNull();
  });
  it('a commander stays in command through a boarding; command passes to the first officer only when they are out of the fight', () => {
    const b = disable(buildBattle(fleetSetup({ role: 'commander', playerCommands: true })), 'a', 'a0');
    const r = seeds(b, {}, CTX, (x) => x.battle.boarding !== null);
    expect(r.battle.boarding!.stage).toBe('through');
    expect([r.battle.command, r.handoff]).toEqual(['player', null]);
    const lost = boardingFought({ ...r.battle, boarding: { ...r.battle.boarding!, stage: 'personal', personal: true, fightId: 'fight-0' } }, false);
    expect([lost.battle.command, lost.battle.out]).toEqual(['firstOfficer', true]);
  });
  it('a Jedi commander leaves command at once to save the troops', () => {
    const b = disable(buildBattle(fleetSetup({ role: 'commander', playerCommands: true })), 'a', 'a0');
    const r = seeds(b, {}, { ...CTX, playerJedi: true }, (x) => x.handoff !== null);
    expect(r.battle.command).toBe('firstOfficer');
    expect(r.battle.fleet!.a.tactics).toBe(r.battle.player.firstOfficer.tactics);
    expect(r.big.join(' ')).toMatch(/go to the troops/);
  });
  it('an NPC Jedi commander does the same when the flagship is boarded', () => {
    const set = fleetSetup({}, 'jediOrder');
    const b = disable(buildBattle({ ...set, player: { ...set.player, commander: { ...set.player.commander, jedi: true } }, ownShipId: 'a1' }), 'a', 'a0');
    const r = seeds(b, {}, CTX, (x) => x.battle.player.commanderGone);
    expect(r.big.join(' ')).toMatch(/leaves command/);
  });
  it('the boarders reach a commander\'s bridge: the bridge fight is personal combat', () => {
    const base = disable(buildBattle(fleetSetup({ role: 'commander', playerCommands: true })), 'a', 'a0');
    const boarded: Battle = { ...base, boarding: { shipId: 'a0', ofSide: 'player', stage: 'through', rounds: 0, personal: false, fightId: null, troops: { kind: 'sithTrooper', count: BOARDING.troops['frigate']! } } };
    const r = seeds(boarded, {}, CTX, (x) => x.handoff !== null);
    expect(r.handoff!.bridge).toBe(true);
  });
  it('the player leads a boarding of a disabled enemy ship: personal combat; ordered, it resolves in the background', () => {
    const b = disable(buildBattle(fleetSetup({ role: 'commander', playerCommands: true })), 'b', 'b1');
    const led = stepBattle(withFleet(b, (f) => ({ ...f, range: 'close' })), { board: 'b1', leadBoarding: true }, CTX);
    expect(led.handoff).toMatchObject({ purpose: 'take' });
    const ordered = stepBattle(withFleet(b, (f) => ({ ...f, range: 'close' })), { board: 'b1' }, CTX);
    expect(ordered.handoff).toBeNull();
    expect([...ordered.lines, ...ordered.big].join(' ')).toMatch(/Fury 1/);
  });
});

describe('evacuation (Jared, 26 Nov 2026)', () => {
  it('a ship with no hull left is abandoned and lost; a Republic commander is the last one off', () => {
    const b = withFleet(buildBattle(fleetSetup({ ownShipId: 'a0' })), (f) => ({ ...f, a: { ...f.a, ships: f.a.ships.map((s) => (s.id === 'a1' ? { ...s, hull: -1 } : s)) } }));
    const r = stepBattle(b, {}, CTX);
    expect(r.battle.tally.evacuated.player).toContain('Hammerhead 2');
    expect(r.battle.fleet!.a.ships.find((s) => s.id === 'a1')!.gone).toBe(true);
    const flag = withFleet(buildBattle(fleetSetup({ ownShipId: 'a1' })), (f) => ({ ...f, a: { ...f.a, ships: f.a.ships.map((s) => (s.id === 'a0' ? { ...s, hull: -1 } : s)) } }));
    expect(stepBattle(flag, {}, CTX).big.join(' ')).toMatch(/Admiral is the last one off/);
  });
  it('a Sith or Imperial commander may leave early: the ship fights on under the first officer, and the crew remembers', () => {
    const set = fleetSetup({ role: 'commander', playerCommands: true }, 'sithEmpire', 'republic');
    const b = withFleet(buildBattle(set), (f) => ({ ...f, a: { ...f.a, ships: f.a.ships.map((s) => (s.id === 'a0' ? { ...s, hull: shipClass(s.classId).hull * 0.2 } : s)) } }));
    expect(battleMenu(b).options.some((o) => o.orders.evacuateEarly)).toBe(true);
    const r = stepBattle(b, { evacuateEarly: true }, CTX);
    expect([r.battle.leftCrew, r.battle.out, r.battle.command]).toEqual([true, true, 'firstOfficer']);
    expect(r.battle.fleet!.a.ships.find((s) => s.id === 'a0')!.gone).toBe(false);
    // A Republic commander is never offered it.
    expect(battleMenu(withFleet(buildBattle(fleetSetup({ role: 'commander', playerCommands: true })), (f) => ({ ...f, a: { ...f.a, ships: f.a.ships.map((s) => ({ ...s, hull: shipClass(s.classId).hull * 0.2 })) } }))).options.some((o) => o.orders.evacuateEarly)).toBe(false);
  });
  it('the left crew is remembered, and the dark choice is stored for the alignment system', () => {
    let s = propose(fresh({ path: 'career', archetype: 'navalOfficer', faction: 'sithEmpire', flags: ['fleetCommand'] }), 'enemy: four Republic Thranta corvettes; allies: two Imperial Harrower dreadnoughts; role: commander').state;
    const b = selectActiveBattle(s)!;
    s = { ...s, battles: { ...s.battles, active: withFleet(b, (f) => ({ ...f, a: { ...f.a, ships: f.a.ships.map((x) => (x.id === b.ownShipId ? { ...x, hull: shipClass(x.classId).hull * 0.2 } : x)) } })) } };
    const r = order(s, { evacuateEarly: true });
    expect(r.state.battles.active).toBeNull();
    expect(r.state.battles.reputation.at(-1)).toMatchObject({ kind: 'abandonedCrew' });
    expect(r.state.battles.darkChoices.at(-1)).toMatchObject({ kind: 'abandonedCrew' });
  });
  it('an NPC Sith commander may leave a crippled flagship early; the ship fights on', () => {
    const set = fleetSetup({}, 'republic', 'sith');
    const b = withFleet(buildBattle({ ...set, enemy: { ...set.enemy, commander: { ...set.enemy.commander, traits: ['ambitious'] } } }), (f) => ({ ...f, b: { ...f.b, ships: f.b.ships.map((s) => (s.id === 'b0' ? { ...s, hull: shipClass(s.classId).hull * 0.25 } : s)) } }));
    const r = seeds(b, {}, CTX, (x) => x.battle.enemy.commanderGone);
    expect(r.big.join(' ')).toMatch(/leaves Harrower 1 early/);
    // A Republic NPC commander never does.
    const rep = withFleet(buildBattle(fleetSetup()), (f) => ({ ...f, a: { ...f.a, ships: f.a.ships.map((s) => (s.id === 'a0' ? { ...s, hull: shipClass(s.classId).hull * 0.25 } : s)) } }));
    for (let i = 0; i < 40; i++) expect(stepBattle(withFleet(rep, (f) => ({ ...f, rng: seedRng(`r${i}`) })), {}, CTX).battle.player.commanderGone).toBe(false);
  });
});

describe('saved state, results and XP', () => {
  it('a game saved mid-battle loads back into the same turn', () => {
    const s = order(propose(fresh(), 'enemy: three Imperial Supremacy fighters; mine: Aurek').state, { manoeuvre: 'fly' }).state;
    const env = JSON.parse(JSON.stringify(makeEnvelope(REGISTRY, s, '2026-11-26T00:00:00Z')));
    const loaded = loadEnvelope<GameState>(REGISTRY, env);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.battles.active).toEqual(s.battles.active);
    expect(selectBattleMenu(loaded.state)).toEqual(selectBattleMenu(s));
    // The same orders give the same turn.
    expect(order(loaded.state, { manoeuvre: 'break' }).state.battles.active).toEqual(order(s, { manoeuvre: 'break' }).state.battles.active);
  });
  it('an old save loads with no battles', () => {
    const s = fresh();
    const { battles: _b, ...rest } = s;
    const env = { ...JSON.parse(JSON.stringify(makeEnvelope(REGISTRY, s, 'x'))), state: rest };
    delete env.featureVersions.battles;
    const loaded = loadEnvelope<GameState>(REGISTRY, env);
    expect(loaded.ok && loaded.state.battles.active).toBe(null);
  });
  it('a battle\'s result raises its events: the record, casualties, morale, a major battle for the world, XP through code lines', () => {
    let s = propose(fresh({ flags: ['fleetCommand'] }), 'enemy: two Imperial Fury interceptors; allies: four Thranta corvettes; role: commander').state;
    const applied: string[] = [];
    for (let i = 0; i < 70 && s.battles.active; i++) {
      const r = order(s, { focus: null, move: 'close', warheads: true });
      applied.push(...r.draft.applied.map((a) => (a.event.type === 'playXpEarned' ? `xp:${String(a.event['source'])}` : a.event.type)));
      s = r.state;
    }
    expect(s.battles.active).toBeNull();
    const rec = selectRecentBattle(s)!;
    expect(rec).toMatchObject({ kind: 'fleet', role: 'commander', factions: { enemy: 'sithEmpire' }, major: false });
    expect(rec.casualties.player + rec.casualties.enemy).toBeGreaterThan(0);
    expect(applied).toContain('xp:command');
    expect(selectWorldFacts(s).battle).toMatchObject({ scale: 'fleet', outcome: rec.outcome });
  });
  it('a dogfight pays Gunnery and Piloting through the code lines; a repair pays Repair', () => {
    let s = propose(fresh(), 'enemy: a Imperial Supremacy fighter; mine: Aurek').state;
    const xp: string[] = [];
    for (let i = 0; i < 120 && s.battles.active; i++) {
      const b = selectActiveBattle(s)!;
      const r = order(s, { ...(b.dog!.track >= 3 ? { shot: 'guns' } : { manoeuvre: b.dog!.track < 0 ? 'break' : 'fly', shot: 'guns', snap: true }) });
      xp.push(...r.draft.applied.filter((a) => a.event.type === 'playXpEarned').map((a) => String(a.event['source'])));
      s = r.state;
    }
    expect(s.battles.active).toBeNull();
    expect(xp).toEqual(expect.arrayContaining(['gunnery', 'piloting']));
    expect(s.progression.skills['gunnery']?.xp ?? 0).toBeGreaterThan(0);
  });
  it('damage carries over: the ship the player flew keeps its hull, systems and warheads', () => {
    const s = fresh();
    const cond = { id: 'own-1', classId: 'aurek', name: 'Red Five', hull: 7, systems: { engines: 'damaged' as const }, burnt: {}, ammo: { '1': 2 }, day: START };
    const flown: GameState = { ...s, battles: { ...s.battles, ships: { 'own-1': cond }, lastShipId: 'own-1' } };
    const b = selectActiveBattle(propose(flown, 'enemy: a Imperial Supremacy fighter').state)!;
    expect([b.dog!.a.ship.name, b.dog!.a.ship.hull, b.dog!.a.ship.systems['engines'], b.dog!.a.ship.ammo[1]]).toEqual(['Red Five', 7, 'damaged', 2]);
    // Field repairs after the battle: an hour a system, Repair against 14.
    const r = resolveTurn(FAST, flown, null, { battle: { repairs: true } });
    expect(r.draft.timeAdvanced!.seconds).toBe(3600);
    expect(r.draft.applied.some((a) => a.event.type === 'playXpEarned' && a.event['source'] === 'repair')).toBe(true);
  });
;
});

describe('the stopgaps now run as ship battles', () => {
  const go = (names: string[], blockade?: Intent['blockade']): Intent => ({ actionType: 'travel', targets: [], references: [], unknownNames: names, ...(blockade ? { blockade } : {}) });
  it('the blockade\'s force-through approach starts a ship battle; won, the trip goes on', () => {
    const s = fresh({ flags: ['fleetCommand'] });
    const started = resolveTurn(FAST, s, go(['Malastare'], 'force'));
    const b = selectActiveBattle(started.state)!;
    expect(b).toMatchObject({ kind: 'fleet', trigger: 'blockade', blockade: { id: 'hydian-way-3661', to: 'Malastare' } });
    expect(started.state.world.blockades.runs).toEqual([]);
    // Played to its end with the fleet's own orders.
    let x = started.state;
    for (let i = 0; i < 70 && x.battles.active; i++) x = order(x, {}, true).state;
    expect(x.battles.active).toBeNull();
    const run = x.world.blockades.runs.at(-1)!;
    expect(run.approach).toBe('force');
    // A run forced through lets the trip go on; one that was not leaves the blockade in the way.
    const through: GameState = { ...s, world: { ...s.world, blockades: { ...s.world.blockades, runs: [{ blockadeId: 'hydian-way-3661', day: s.clock.now.day, approach: 'force', direction: 'in', to: 'Malastare', result: 'through', fame: 5, witnessed: true }] } } };
    expect(planTravel(through, go(['Malastare']))!.ok).toBe(true);
    expect(planTravel(s, go(['Malastare']))!.ok).toBe(false);
  });
  it('an ace alone: the pickets\' fighters one by one; breaking off runs the line', () => {
    const s = fresh();
    const pilot: GameState = { ...s, progression: { ...s.progression } };
    const set = applyEvents(FAST, pilot, [{ type: 'shipBattleStarted', blockadeId: 'hydian-way-3661', to: 'Malastare', direction: 'in', fleet: false }], { source: 'engine' }).state;
    const b = selectActiveBattle(set)!;
    expect([b.kind, b.trigger, shipClass(b.dog!.b.ship.classId).id]).toEqual(['dogfight', 'blockade', 'supremacy']);
    const tail: GameState = { ...set, battles: { ...set.battles, active: { ...b, dog: { ...b.dog!, track: 1 } } } };
    const r = order(tail, { breakOff: true });
    expect(r.state.world.blockades.runs.at(-1)).toMatchObject({ approach: 'force', result: 'through' });
  });
  it('the Coruscant occupation: a battle against the armada is built from its data while the Sacking is under way', () => {
    const at = day(3653, 6, 21);
    const s0 = fresh({ flags: ['fleetCommand'] }, at);
    const s: GameState = { ...s0, world: { ...s0.world, network: { ...s0.world.network, events: { ...s0.world.network.events, 'E.3653.sacking': { status: 'underway', day: at, endedDay: null, broken: [] } as never } } } };
    const r = propose(s, 'enemy: the Imperial armada; allies: four Thranta corvettes; role: commander');
    const b = selectActiveBattle(r.state)!;
    const force = STANDING_FORCES.find((f) => f.id === 'angral-armada')!;
    expect(b.forceId).toBe('angral-armada');
    expect(b.fleet!.b.ships.length).toBe(force.ships.reduce((t, x) => t + x.count, 0));
    expect(b.enemy.commander.name).toBe('Darth Angral');
  });
});
