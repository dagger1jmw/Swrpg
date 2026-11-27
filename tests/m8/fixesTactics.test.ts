// m8-fixes Part B (Jared, 26 Nov 2026): one list of tactics per character, read by the Tactics tab and every battle menu; the Jedi
// initiate set and the background sets; learning from a teacher by the teacher's own Tactics; learning in the field (seen, then
// used well or taught); seen tactics ordered at a penalty; old saves given their background's set and what they used.
import { describe, expect, it } from 'vitest';
import { COMMAND_BASICS, COMMON_GROUND, SEEN_TACTIC_PENALTY, TACTIC_SETS } from '../../src/data/tactics';
import { absDayFromDate } from '../../src/engine/calendar';
import { seedRng } from '../../src/engine/rng';
import { newShip } from '../../src/engine/ships';
import { knownGround } from '../../src/features/battles/groundSetup';
import { battleMenu, buildBattle, stepBattle, type Battle, type BattleSetup, type StepCtx } from '../../src/features/battles/rules';
import { sideOf } from '../../src/features/battles/setup';
import { selectActiveBattle } from '../../src/features/battles/selectors';
import { impliedTactics, tacticsFeature, usedInOldBattles } from '../../src/features/tactics';
import { selectKnownTactics, selectSeenTactics, selectTacticRows } from '../../src/features/tactics/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { Registry } from '../../src/state/types';

const START = absDayFromDate({ year: -3661, month: 1, day: 2 });
const FAST: Registry<GameState> = REGISTRY.map((f) => {
  if (f.id === 'world') return f;
  const { onTimeAdvanced: _hook, ...rest } = f;
  return rest;
});
const fresh = (o: { path?: 'jedi' | 'career' | 'sith'; archetype?: string; rank?: string; option?: string; age?: number } = {}): GameState => {
  const s = createInitialState<GameState>(FAST, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'fixes-b',
    start: { day: START, second: 8 * 3600 },
    character: {
      name: 'Kael',
      birthDay: START - (o.age ?? 30) * 368,
      path: o.path ?? 'jedi',
      archetype: o.archetype ?? 'jediGuardian',
      ...(o.path === 'career' ? {} : { mainFormId: 'soresu', trainingStartAge: 4 }),
      ...(o.option ? { start: { optionId: o.option, faction: 'republic', imperialBorn: false } } : {}),
    },
    rank: o.rank ?? (o.path === 'career' ? 'career' : 'knight'),
  });
  return applyEvents(FAST, s, [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: '', moveHere: true }], { source: 'ai' }).state;
};
const ev = (s: GameState, events: object[], source: 'ai' | 'engine' | 'dev' | 'player' = 'engine') => applyEvents(FAST, s, events, { source });
const CTX: StepCtx = { troopsFor: () => 'sithTrooper', playerJedi: false };
const meet = (s0: GameState, name: string, role: string, faction: string, age = 45): { s: GameState; id: string } => {
  const s = ev(s0, [{ type: 'npcIntroduced', name, species: 'human', faction, role, ageApprox: age, description: '' }], 'ai').state;
  const id = Object.values(s.npcs.byId).find((n) => n.name === name)!.id;
  return { s: { ...s, pacing: { ...s.pacing, scene: { ...s.pacing.scene, presentNpcIds: [...s.pacing.scene.presentNpcIds, id] } } }, id };
};
const groundIds = (s: GameState): string[] => selectTacticRows(s).filter((r) => r.def.scale === 'ground').map((r) => r.def.id).sort();

describe('B1: one list, read by the tab and the battle menus', () => {
  it('the ground tactics the tab shows are exactly what a ground battle offers (known, then seen)', () => {
    for (const s of [fresh({ rank: 'padawan', age: 14 }), fresh({ path: 'career', archetype: 'civilian' }), fresh({ path: 'career', archetype: 'soldier' })]) {
      const g = knownGround(s);
      expect([...g.known, ...g.seenOnly].sort()).toEqual(groundIds(s));
      // What anyone can order is on the tab too (the old menu added it behind the tab's back).
      for (const id of COMMON_GROUND) expect(groundIds(s)).toContain(id);
    }
  });
  it('a ship battle offers only the list\'s tactics; the basics a commander orders are in the list', () => {
    const civ = fresh({ path: 'career', archetype: 'civilian' });
    for (const id of COMMAND_BASICS) expect(selectKnownTactics(civ).has(id)).toBe(true);
    const owned = ev(civ, [{ type: 'shipAcquired', classId: 'aurek', how: 'issued' }], 'dev').state;
    const b = selectActiveBattle(ev(owned, [{ type: 'shipBattleProposed', what: 'enemy: two Imperial Supremacy fighters; mine: Aurek' }], 'dev').state)!;
    const offered = battleMenu(b).options.filter((o) => o.group === 'manoeuvre').map((o) => o.orders.manoeuvre!);
    const list = new Set(selectTacticRows(owned).map((r) => r.def.id));
    for (const id of offered) expect(list.has(id), id).toBe(true);
  });
});

describe('B2: starting sets', () => {
  it('a Padawan has the initiate years\' basic ground and fleet set; an initiate does not yet; promotion gives it', () => {
    const set = TACTIC_SETS['jediInitiate']!.ids;
    expect(set).toEqual(['frontalAssault', 'defenceInDepth', 'fightingWithdrawal', 'exchange', 'screen', 'withdraw']);
    const pad = fresh({ rank: 'padawan', age: 14 });
    for (const id of set) expect(selectKnownTactics(pad).has(id), id).toBe(true);
    expect(pad.tactics.known['defenceInDepth']!.source).toMatch(/initiate years/);
    const ini = fresh({ rank: 'initiate', age: 9 });
    expect(selectKnownTactics(ini).has('defenceInDepth')).toBe(false);
    expect(selectKnownTactics(ini).has('screen')).toBe(false);
    const promoted = ev(ini, [{ type: 'rankSet', rank: 'padawan' }]).state;
    expect(selectKnownTactics(promoted).has('defenceInDepth')).toBe(true);
    expect(selectKnownTactics(promoted).has('screen')).toBe(true);
  });
  it('backgrounds: a soldier more ground, a pilot and a naval officer more fleet', () => {
    const ground = (k: Record<string, unknown>): number => Object.keys(k).filter((id) => ['frontalAssault', 'flanking', 'envelopment', 'defenceInDepth', 'ambush', 'feint', 'siege', 'infiltration', 'fightingWithdrawal'].includes(id)).length;
    const fleet = (k: Record<string, unknown>): number => Object.keys(k).filter((id) => ['exchange', 'capT', 'slash', 'fake', 'brawl', 'pincer', 'screen', 'feignedRetreat', 'withdraw', 'rollShip'].includes(id)).length;
    const soldier = impliedTactics({ archetype: 'soldier', path: 'career', start: { optionId: 'republic-trooper' } }, 'career', 0);
    const pilot = impliedTactics({ archetype: 'starfighterPilot', path: 'career', start: { optionId: 'republic-pilot' } }, 'career', 0);
    const naval = impliedTactics({ archetype: 'navalOfficer', path: 'career', start: { optionId: 'imperial-officer' } }, 'career', 0);
    expect(ground(soldier)).toBeGreaterThan(ground(pilot));
    expect(fleet(naval)).toBeGreaterThan(fleet(soldier));
    expect(pilot['screen']).toBeDefined();
  });
});

describe('B3: learning more', () => {
  it('a teacher passes on what their own Tactics allows: a Jedi Master without military experience the basics, an officer more', () => {
    const { s, id } = meet(fresh({ rank: 'padawan', age: 14 }), 'Master Orren Vash', 'jediMaster', 'jediOrder', 60);
    const withMaster = { ...s, ranks: { ...s.ranks, masterId: id } };
    // Flanking is basic: any teacher. Ambush is standard: needs military experience.
    expect(ev(withMaster, [{ type: 'tacticStudied', what: 'taught flanking by Master Orren Vash' }], 'ai').rejected).toEqual([]);
    const r = ev(withMaster, [{ type: 'tacticStudied', what: 'taught the ambush by Master Orren Vash' }], 'ai');
    expect(r.rejected[0]?.reason).toMatch(/military experience/);
    const { s: s2 } = meet(withMaster, 'General Tarsk', 'officer', 'republic', 60);
    const taught = ev(s2, [{ type: 'tacticStudied', what: 'taught envelopment by General Tarsk' }], 'ai');
    expect(taught.rejected).toEqual([]);
    expect(taught.state.tactics.known['envelopment']!.source).toMatch(/General Tarsk/);
  });
  it('in the field: seen tactics are listed as seen, offered at a penalty, and learned when used well', () => {
    const s = ev(fresh({ path: 'career', archetype: 'civilian' }), [{ type: 'tacticsSeen', ids: ['capT', 'ambush'], by: 'enemy' }]).state;
    expect(selectSeenTactics(s).has('capT')).toBe(true);
    expect(selectTacticRows(s).find((r) => r.def.id === 'capT')).toMatchObject({ status: 'seen' });
    expect(knownGround(s).seenOnly).toContain('ambush');
    // A fleet battle under the player's command: capping the T is offered with its penalty, flown at -2, learned on a won round.
    const cmd = { name: 'Admiral', npcId: null, tactics: 60, traits: [] as string[], jedi: false };
    const setup: BattleSetup = {
      id: 'battle-b', kind: 'fleet', role: 'commander', trigger: 'sighted', stakes: 'lethal', placeId: null, placeName: 'open space', year: -3661,
      player: sideOf('the fleet', 'republic', 'navy', { ...cmd, name: 'Kael' }), enemy: sideOf('the Imperial ships', 'sithEmpire', 'navy', { ...cmd, name: 'Moff', tactics: 30 }),
      playerShips: [newShip('a0', 'hammerhead', 45, 'Hammerhead 1'), newShip('a1', 'hammerhead', 45, 'Hammerhead 2'), newShip('a2', 'thranta', 45, 'Thranta 1')],
      enemyShips: [newShip('b0', 'fury', 45, 'Fury 1')], ownShipId: 'a0', rng: seedRng('b4'), playerCommands: true,
    };
    let b: Battle = { ...buildBattle(setup), tactics: { known: [...selectKnownTactics(s), 'capT'], recognised: [], seenOnly: ['capT'], learned: [], used: [] } };
    const opt = battleMenu(b).options.find((o) => o.orders.formation === 'capT');
    expect(opt?.cost).toMatch(new RegExp(`seen, not practised: -${SEEN_TACTIC_PENALTY}`));
    let penalised = false;
    for (let i = 0; i < 12 && !b.end; i++) {
      const r = stepBattle(b, i === 0 ? { formation: 'capT' } : {}, CTX);
      b = r.battle;
      if (b.fleet!.log.at(-1)!.mods.a.some((m) => m.source === 'a tactic seen, not practised' && m.value === -SEEN_TACTIC_PENALTY)) penalised = true;
    }
    expect(penalised).toBe(true);
    expect(b.tactics!.used).toContain('capT');
    expect(b.tactics!.learned).toContain('capT');
  });
  it('learned in battle reaches the list at the battle\'s end (tacticsLearned "used successfully in battle")', () => {
    const s = ev(fresh({ path: 'career', archetype: 'civilian' }), [{ type: 'tacticsSeen', ids: ['capT'], by: 'enemy' }, { type: 'tacticsLearned', ids: ['capT'], source: 'used successfully in battle' }]).state;
    expect(selectKnownTactics(s).has('capT')).toBe(true);
    expect(selectSeenTactics(s).has('capT')).toBe(false);
  });
});

describe('B6: old saves', () => {
  it('get the starting set for their background plus every tactic already used in a battle', () => {
    const raw = {
      character: { archetype: 'jediGuardian', path: 'jedi' },
      ranks: { rank: 'padawan' },
      clock: { now: { day: START } },
      battles: { lastGround: { planning: { role: 'commander', plan: { manoeuvre: 'ambush' } }, battle: { a: { plan: 'flanking' } } }, last: { role: 'commander', fleet: { a: { formation: 'capT' } } }, history: [] },
    };
    expect(usedInOldBattles(raw.battles).sort()).toEqual(['ambush', 'capT', 'flanking']);
    const migrated = tacticsFeature.migrations![2]!({ known: { fly: { source: 'x', day: 0 } }, seen: {}, practice: {} }, raw) as GameState['tactics'];
    for (const id of [...TACTIC_SETS['jediInitiate']!.ids, 'ambush', 'capT', 'flanking']) expect(migrated.known[id], id).toBeDefined();
    expect(migrated.known['ambush']!.source).toBe('used in a battle');
    expect(migrated.known['fly']!.source).toBe('x');
  });
});
