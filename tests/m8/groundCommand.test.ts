// m8-ground (M8 checklist item 14; D-521, D-522; docs-v2/spec/ground-command.md): the m8-ship-life review fixes (Part B) and
// ground command in play (Part C). Part A (the schema parts) is tests/ai/schemaParts.test.ts.
import { describe, expect, it } from 'vitest';
import { FORCE_USER, MEDITATION } from '../../src/data/ground.config';
import { KNOWN_SITES, MAX_CONTINGENCIES } from '../../src/data/groundCommand.config';
import { RUNNING_COSTS } from '../../src/data/shipPrices';
import { MOD_BATTLE } from '../../src/data/shipLife.config';
import { DOGFIGHT } from '../../src/data/shipCombat.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { newPrice } from '../../src/features/ships';
import { dogfightTurn, pilotingMods, startDogfight } from '../../src/engine/dogfight';
import { sectorMods } from '../../src/engine/groundBattle';
import { seedRng } from '../../src/engine/rng';
import { gunFire, newShip, shipClass } from '../../src/engine/ships';
import { narrativeEventTypes } from '../../src/ai/schemas/compose';
import { buildBattle, type BattleSetup } from '../../src/features/battles/rules';
import { sideOf } from '../../src/features/battles/setup';
import { ownShipState } from '../../src/features/battles/setup';
import { beginGround, drawMap, planProblems, scout, stepGround, type GroundCtx, type GroundPlanning, type GroundState } from '../../src/features/battles/ground';
import { selectGroundBattle, selectGroundPlanning, selectRecentBattle } from '../../src/features/battles/selectors';
import { selectWorldFacts } from '../../src/features/world/selectors';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { resolveTurn } from '../../src/turn/resolve';
import { base, meet } from '../support/schemaSituations';

const ev = (s: GameState, events: object[], source: 'ai' | 'engine' | 'player' | 'dev' = 'ai') => applyEvents(REGISTRY, s, events, { source });
const PLAN = { type: 'groundBattlePlanned', site: 'the Aldera plains', enemy: 'five Sith infantry, armour, artillery', ours: 'four clone infantry, armour, artillery', terrain: 'a ridge, a river with a bridge, ruins' };
const CTX: GroundCtx = { playerCombat: 60, commanderTactics: { player: 50, enemy: 45 } };

/** A Jedi Knight in a briefing with an officer, the planning scene open. */
function planned(over: Partial<typeof PLAN> & { jammed?: boolean; meditator?: string; commandHanded?: string } = {}, s0: GameState = meet(base(), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }])): GameState {
  const r = ev(s0, [{ ...PLAN, ...over }]);
  expect(r.rejected.map((x) => x.reason)).toEqual([]);
  return r.state;
}
const ground = (input: Parameters<typeof resolveTurn>[3] extends infer O ? O : never, s: GameState) => resolveTurn(REGISTRY, s, null, input as never);
const order = (s: GameState, act: 'order' | 'auto' | 'takeBack' | 'begin' | 'scout' | 'standDown', extra: object = {}) => ground({ battle: { ground: { act, ...extra } } }, s);

/** A planning scene with every enemy square scouted (the tests' plans meet the enemy where it is). */
function scoutedPlanning(s: GameState): GroundPlanning {
  const p = selectGroundPlanning(s)!;
  return { ...p, map: { ...p.map, scouted: Object.keys(p.map.squares), seen: Object.keys(p.map.squares) } };
}

// ---------------------------------------------------------------- Part B

describe('Part B: the m8-ship-life review fixes', () => {
  it('B1: freighters and light ships pay about 0.1% of their value a month; warships keep their shares', () => {
    expect(newPrice('xsFreighter')).toBe(615_000);
    expect(Math.round(newPrice('xsFreighter') * RUNNING_COSTS.freighter.upkeepShare)).toBe(615);
    expect(RUNNING_COSTS.freighter.upkeepShare).toBe(0.001);
    expect(RUNNING_COSTS.fighter.upkeepShare).toBe(0.01);
    expect(RUNNING_COSTS.corvette.upkeepShare).toBe(0.008);
  });

  it('B1: missed upkeep still wears the ship instead of becoming a debt', () => {
    let s = ev(base({ path: 'career', archetype: 'smuggler' }), [{ type: 'shipAct', what: 'salvaged a Dynamic-class freighter' }], 'engine').state;
    s = { ...s, economy: { ...s.economy, wallet: { republic: 0, imperial: 0, hutt: 0 } } };
    const id = Object.keys(s.ships.ships)[0]!;
    const before = s.ships.ships[id]!.wear;
    const r = ev(s, [{ type: 'shipCostsDue', items: [{ credits: 615, reason: 'upkeep', shipId: id, upkeep: true }] }], 'engine');
    expect(r.state.ships.ships[id]!.wear).toBeCloseTo(before + 0.03, 6);
    expect(r.state.economy.loans.length).toBe(s.economy.loans.length);
  });

  const owned = (mods: string[]) => ({ id: 'own', name: 'Dawn', classId: 'xsFreighter', mods } as never);
  const crew = { piloting: 50, gunnery: 50, tactics: 40, repair: 20, forceSense: 0 } as never;

  it('B2: weapon mods add barrels and heavier guns on the mount', () => {
    const stock = ownShipState('a', 'xsFreighter', crew, 'Dawn', owned([]), undefined);
    const guns = ownShipState('a', 'xsFreighter', crew, 'Dawn', owned(['weapons']), undefined);
    const mil = ownShipState('a', 'xsFreighter', crew, 'Dawn', owned(['militaryWeapons']), undefined);
    expect(stock.kit).toBeUndefined();
    expect(guns.kit).toMatchObject({ barrels: 1, heavy: 1 });
    expect(mil.kit).toMatchObject({ barrels: 1, heavy: MOD_BATTLE.heavy[2] });
    const m = shipClass('xsFreighter').weapons.find((x) => !x.turret) ?? shipClass('xsFreighter').weapons[0]!;
    const w = { damage: 10, kind: 'energy' };
    expect(gunFire(guns, m, w)).toBeGreaterThan(gunFire(stock, m, w));
    expect(gunFire(mil, m, w)).toBeGreaterThan(gunFire(guns, m, w));
    // Warheads are not guns: no extra barrels.
    expect(gunFire(mil, m, { damage: 80, kind: 'warhead' })).toBe(gunFire(stock, m, { damage: 80, kind: 'warhead' }));
  });

  it('B2: a jammer helps against a torpedo lock (the evasion roll, beside decoys)', () => {
    const a = newShip('a', 'xwing', 60);
    const b0 = newShip('b', 'xsFreighter', 40);
    const b1 = { ...b0, kit: { barrels: 0, heavy: 1, jammer: 1, sensors: 0 } };
    const margin = (target: typeof b0): number | undefined => dogfightTurn(startDogfight({ ship: a }, { ship: target }, seedRng('lock'), { track: 5 }), { shot: 'torpedo' }, {}).log[0]?.shots.find((x) => x.what === 'torpedo')?.margin;
    const m0 = margin(b0);
    const m1 = margin(b1);
    expect(m0).toBeDefined();
    expect(m1).toBe(m0! - MOD_BATTLE.jammer);
    expect(DOGFIGHT.torpedo.decoys).toBe(4);
  });

  it('B2: a sensor suite reads the enemy: position, an ambush spotted sooner, the formation known', () => {
    const plain = { ship: newShip('a', 'xsFreighter', 50) };
    const read = { ship: { ...newShip('a', 'xsFreighter', 50), kit: { barrels: 0, heavy: 1, jammer: 0, sensors: 3 } } };
    const sum = (mods: { value: number }[]): number => mods.reduce((t, m) => t + m.value, 0);
    expect(sum(pilotingMods(read, {}, 'fly', 'fly')) - sum(pilotingMods(plain, {}, 'fly', 'fly'))).toBe(MOD_BATTLE.sensorsPosition);
    const setup = (sensors: boolean, kind: 'dogfight' | 'fleet'): BattleSetup => {
      const cmd = { name: 'Admiral', npcId: null, tactics: 50, traits: [] as string[], jedi: false };
      const own = { ...newShip('a0', kind === 'fleet' ? 'hammerhead' : 'xsFreighter', 45, 'Own'), ...(sensors ? { kit: { barrels: 0, heavy: 1, jammer: 0, sensors: 3 } } : {}) };
      return { id: 't', kind, role: kind === 'fleet' ? 'commander' : 'pilot', trigger: 'ambush', stakes: 'lethal', placeId: null, placeName: 'space', year: -3661, player: sideOf('us', 'republic', 'navy', cmd), enemy: sideOf('them', 'sithEmpire', 'navy', cmd), playerShips: [own], enemyShips: [newShip('b0', kind === 'fleet' ? 'fury' : 'xwing', 45, 'Foe')], ownShipId: 'a0', rng: seedRng('x'), playerCommands: kind === 'fleet' };
    };
    expect(buildBattle(setup(true, 'dogfight')).dog!.track).toBe(buildBattle(setup(false, 'dogfight')).dog!.track + MOD_BATTLE.ambushSpotted);
    expect(buildBattle(setup(false, 'fleet')).fleet!.a.intel).toBe(false);
    expect(buildBattle(setup(true, 'fleet')).fleet!.a.intel).toBe(true);
  });
});

// ---------------------------------------------------------------- Part C

describe('Part C: ground command in play', () => {
  it('a battle starts only from a planning scene and a validated event', () => {
    const s = meet(base(), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]);
    // No planning scene: the word to begin is refused.
    expect(ev(s, [{ type: 'groundBattleBegun' }], 'player').rejected[0]?.reason).toMatch(/only from a planning scene/);
    // Words the code cannot read are refused; so is an enemy of the player's own side.
    expect(ev(s, [{ ...PLAN, enemy: 'a vague threat' }]).rejected[0]?.reason).toMatch(/names no ground unit|no enemy unit/);
    // The event is offered only where a planning scene can happen (an officer present, the player's words of battle plans).
    expect(narrativeEventTypes(REGISTRY, s, { timeAdvancedByDraft: false })).toContain('groundBattlePlanned');
    expect(narrativeEventTypes(REGISTRY, base(), { timeAdvancedByDraft: false, text: 'I walk on' })).not.toContain('groundBattlePlanned');
    const p = planned({}, s);
    expect(selectGroundPlanning(p)).not.toBeNull();
    expect(selectGroundBattle(p)).toBeNull();
    const begun = order(p, 'begin');
    expect(selectGroundBattle(begun.state)).not.toBeNull();
  });

  it('the code alone ends it: no narrator event can end, win or lose a ground battle', () => {
    const s = order(planned(), 'begin').state;
    const types = narrativeEventTypes(REGISTRY, s, { timeAdvancedByDraft: false, text: 'we win the battle' });
    expect(types.filter((t) => t.startsWith('ground') || t === 'combatEnded' || t.startsWith('battle'))).toEqual([]);
  });

  it('the plan fixes objectives, a known manoeuvre, sectors, support, a reserve and at most two contingencies', () => {
    const p = selectGroundPlanning(planned())!;
    expect(planProblems(p)).toEqual([]);
    expect(planProblems(p, { ...p.plan, primary: null })).toContain('a primary objective is needed');
    expect(planProblems(p, { ...p.plan, manoeuvre: 'envelopment' }).join(' ')).toMatch(/not a tactic the character knows/);
    const u = p.plan.sectors[0]!.units[0]!;
    expect(planProblems(p, { ...p.plan, reserve: [...p.plan.reserve, u] }).join(' ')).toMatch(/in two places/);
    expect(planProblems(p, { ...p.plan, support: { ...p.plan.support, air: p.plan.sectors[0]!.square } }).join(' ')).toMatch(/no air free/);
    const c = { when: 'sectorFalling' as const, then: 'fallBack' as const };
    expect(planProblems(p, { ...p.plan, contingencies: [c, c] })).toEqual([]);
    expect(planProblems(p, { ...p.plan, contingencies: [c, c, c] }).join(' ')).toMatch(`at most ${MAX_CONTINGENCIES}`);
    // Fixed once the battle begins.
    const s = order(planned(), 'begin').state;
    expect(ev(s, [{ type: 'groundPlanSet', plan: p.plan }], 'player').rejected[0]?.reason).toMatch(/fixed once the battle begins/);
  });

  it('contingencies carry out without penalty, even with no command post in contact', () => {
    const p0 = scoutedPlanning(planned({ jammed: true }));
    const sq0 = p0.plan.sectors[0]!.square;
    const p: GroundPlanning = { ...p0, plan: { ...p0.plan, contingencies: [{ when: 'strengthHalved', sector: sq0, then: 'commitReserve' }] } };
    let g = beginGround(p, seedRng('c')) as GroundState;
    expect(g.battle.a.contact).toBe(false);
    // Our side worn to under half its strength: the contingency fires after the phase.
    g = { ...g, battle: { ...g.battle, sectors: g.battle.sectors.map((x) => ({ ...x, a: { ...x.a, units: x.a.units.map((u) => ({ ...u, strength: 45, checked: 2 })) } })) } };
    const r = stepGround(g, {}, CTX);
    expect(r.lines.join(' ')).toMatch(/Contingency: our strength falls to half/);
    expect(r.ground.reserve).toEqual([]);
    expect(r.ground.contingencies[0]!.used).toBe(true);
    expect(r.ground.battle.log.at(-1)!.mods.a.some((m) => m.source === 'a change without contact')).toBe(false);
  });

  it('scouting reveals squares and changes the key', () => {
    const p = selectGroundPlanning(planned())!;
    const r = scout(p, 'recon', 90, seedRng('s'));
    expect(r.planning.map.scouted.length).toBeGreaterThan(p.map.scouted.length);
    expect(r.planning.scouting.tries).toBe(1);
    const before = drawMap(p, null, 'PLAN').match(/Unknown: (.*) not yet/)?.[1]?.split(' ').length ?? 0;
    const after = drawMap(r.planning, null, 'PLAN').match(/Unknown: (.*) not yet/)?.[1]?.split(' ').length ?? 0;
    expect(after).toBeLessThan(before);
    // An intelligence read beating the DC well gives the enemy's likely plan.
    expect(scout(p, 'intelligence', 120, seedRng('i')).planning.scouting.planKnown).toBe(true);
  });

  it('a known site takes its features from the lore; elsewhere they are tagged invented', () => {
    const ruusanDay = absDayFromDate({ year: -1001, month: 3, day: 1 });
    const s0 = meet(base(), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]);
    const at = { ...s0, clock: { ...s0.clock, now: { ...s0.clock.now, day: ruusanDay } } };
    const p = selectGroundPlanning(planned({ site: 'the plains of Ruusan' }, at))!;
    const site = KNOWN_SITES.find((k) => k.id === 'ruusan')!;
    expect(p.map.siteId).toBe('ruusan');
    for (const f of site.features) expect(p.map.squares[f.square]).toMatchObject({ feature: f.feature, invented: false });
    const elsewhere = selectGroundPlanning(planned())!;
    expect(elsewhere.map.siteId).toBeNull();
    expect(Object.values(elsewhere.map.squares).filter((x) => x.feature !== 'open').every((x) => x.invented)).toBe(true);
  });

  it('plan changes follow command-post contact: at once with it, a phase later with a penalty without it', () => {
    const known = (p: GroundPlanning): GroundPlanning => ({ ...p, known: [...p.known, 'flanking'] });
    const g1 = beginGround(known(scoutedPlanning(planned())), seedRng('k')) as GroundState;
    const r1 = stepGround(g1, { manoeuvre: 'flanking' }, CTX);
    expect(r1.ground.battle.a.plan).toBe('flanking');
    const g2 = beginGround(known(scoutedPlanning(planned({ jammed: true }))), seedRng('k')) as GroundState;
    const r2 = stepGround(g2, { manoeuvre: 'flanking' }, CTX);
    expect(r2.ground.battle.a.plan).not.toBe('flanking');
    expect(r2.ground.pending.length).toBe(1);
    const r3 = stepGround(r2.ground, {}, CTX);
    expect(r3.ground.battle.a.plan).toBe('flanking');
    expect(r3.ground.battle.log.at(-1)!.mods.a.some((m) => m.source === 'a change without contact')).toBe(true);
    // The player's own sector changes at once without contact (falling back).
    const own = (g2.playerSector ?? g2.battle.sectors.find((x) => !x.decided)!.square);
    const r4 = stepGround({ ...g2, playerSector: own }, { fallBack: true }, CTX);
    expect(r4.ground.battle.sectors.find((x) => x.square === own)!.decided).toBe(true);
  });

  it('a commander at the post sees everything but does not raise morale at the front', () => {
    const p = scoutedPlanning(planned());
    const front = beginGround({ ...p, atPost: false, plan: { ...p.plan, sectors: p.plan.sectors.map((x, i) => ({ ...x, leader: i === 0 ? 'player' : null })) } }, seedRng('m')) as GroundState;
    const post = beginGround({ ...p, atPost: true, plan: { ...p.plan, sectors: p.plan.sectors.map((x) => ({ ...x, leader: null })) } }, seedRng('m')) as GroundState;
    const sq = p.plan.sectors[0]!.square;
    const morale = (g: GroundState): number => sectorMods(g.battle.sectors.find((x) => x.square === sq)!, 'A', g.battle.a, g.battle.b).find((m) => m.source === 'morale')?.value ?? 0;
    expect(morale(front)).toBeGreaterThan(morale(post));
    expect(FORCE_USER.morale).toBeGreaterThan(0);
    expect(post.playerSector).toBeNull();
  });

  it('the player\'s own fight at the front is a modifier for their sector', () => {
    const p = scoutedPlanning(planned());
    const g = beginGround({ ...p, plan: { ...p.plan, sectors: p.plan.sectors.map((x, i) => ({ ...x, leader: i === 0 ? 'player' : null })) } }, seedRng('f')) as GroundState;
    const r = stepGround(g, {}, { ...CTX, playerCombat: 120 });
    const rec = r.ground.battle.log.find((x) => x.sector === g.playerSector)!;
    expect(rec.mods.a.some((m) => m.source === 'your own fight')).toBe(true);
    expect(r.ground.xp.gaps.length).toBe(1);
    // Fighting it out in person hands off to personal combat.
    expect(stepGround(g, { fightInPerson: true }, CTX).handoff).not.toBeNull();
  });

  it('battle meditation counts on every roll, and losing the meditator makes the side check (Mizra)', () => {
    const s0 = meet(base(), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }, { name: 'Master Ela', role: 'jediMaster', faction: 'jediOrder' }]);
    const p0 = scoutedPlanning(planned({ meditator: 'Master Ela' }, s0));
    expect(p0.ours.meditation?.name).toBe('Master Ela');
    const p: GroundPlanning = { ...p0, ours: { ...p0.ours, meditation: { ...p0.ours.meditation!, level: 90 } } };
    const g = beginGround(p, seedRng('med')) as GroundState;
    const s = g.battle.sectors.find((x) => !x.decided)!;
    expect(sectorMods(s, 'A', g.battle.a, g.battle.b).find((m) => m.source === 'battle meditation')?.value).toBeGreaterThan(MEDITATION[1]![1] - 0.01);
    // An enemy raid breaking through reaches the meditator now and then.
    let killed = false;
    for (let i = 0; i < 60 && !killed; i++) {
      // The enemy at the point of a strike everywhere, raiding.
      const r = stepGround({ ...g, battle: { ...g.battle, rng: seedRng(`raid${i}`), b: { ...g.battle.b, plan: 'raid' }, sectors: g.battle.sectors.map((x) => ({ ...x, track: -3 })) } }, {}, CTX);
      if (!r.ground.battle.a.meditation?.alive) {
        killed = true;
        expect(r.big.join(' ')).toMatch(/battle meditator, is killed/);
      }
    }
    expect(killed).toBe(true);
  });

  it('"let it play out" and taking control back', () => {
    const s = order(planned(), 'begin').state;
    const auto = order(s, 'auto');
    const g = selectGroundBattle(auto.state) ?? auto.state.battles.lastGround;
    expect(g.auto).toBe(true);
    expect(g.battle.phase).toBeGreaterThanOrEqual(1);
    if (selectGroundBattle(auto.state)) expect(selectGroundBattle(order(auto.state, 'takeBack').state)!.auto).toBe(false);
  });

  it('a game saved mid-battle loads into the same phase, and the same orders give the same phase', () => {
    let s = order(planned(), 'begin').state;
    s = order(s, 'order').state;
    const env = JSON.parse(JSON.stringify(makeEnvelope(REGISTRY, s, '2026-11-26T00:00:00Z')));
    const loaded = loadEnvelope<GameState>(REGISTRY, env);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(selectGroundBattle(loaded.state)).toEqual(selectGroundBattle(s));
    expect(order(loaded.state, 'order').draft.battle).toEqual(order(s, 'order').draft.battle);
  });

  it('a phase takes an hour and a half; quiet phases are the code\'s lines, big moments go to the narrator', () => {
    let s = order(planned(), 'begin').state;
    let quiet = 0;
    let big = 0;
    for (let i = 0; i < 12 && selectGroundBattle(s); i++) {
      const t = order(s, 'order');
      expect(t.draft.timeAdvanced?.seconds).toBe(5400);
      if (t.draft.battle?.quiet) quiet++;
      else big++;
      s = t.state;
    }
    expect(quiet + big).toBeGreaterThan(0);
  });

  it('the end raises its record, a battle for the world, command XP and the tactics seen', () => {
    let s = order(planned(), 'begin').state;
    const tactics = selectLevelExact(s, 'tactics');
    let applied: string[] = [];
    for (let i = 0; i < 15 && selectGroundBattle(s); i++) {
      const t = order(s, 'order');
      applied = [...applied, ...t.draft.applied.map((a) => a.event.type)];
      s = t.state;
    }
    expect(selectGroundBattle(s)).toBeNull();
    const rec = s.battles.history.at(-1)!;
    expect(rec.kind).toBe('ground');
    expect(rec.objectives?.length).toBeGreaterThan(0);
    expect(selectRecentBattle(s)?.id).toBe(rec.id);
    expect(selectWorldFacts(s).battle?.scale).toBe('ground');
    expect(applied).toContain('playXpEarned');
    expect(applied).toContain('tacticsSeen');
    expect(selectLevelExact(s, 'tactics')).toBeGreaterThan(tactics);
  });

  it('who plans goes by rank; the story can hand command over; Jedi lead from the front', () => {
    expect(selectGroundPlanning(planned())!.role).toBe('commander');
    expect(selectGroundPlanning(planned())!.atPost).toBe(false);
    const padawan = meet(base({ rank: 'padawan' }), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]);
    expect(selectGroundPlanning(planned({}, padawan))!.role).toBe('leader');
    // A sector leader goes into battle under the NPC commander's plan, leading a sector at the front.
    const led = order(planned({}, padawan), 'begin');
    expect(led.draft.rejected).toEqual([]);
    expect(selectGroundBattle(led.state)!.playerSector).not.toBeNull();
    // Someone in the line fights in a sector (their own fight counts) but cannot order it back.
    const civilian = meet(base({ path: 'career', archetype: 'smuggler' }), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]);
    const line = order(planned({}, civilian), 'begin');
    expect(selectGroundPlanning(planned({}, civilian))!.role).toBe('soldier');
    const g = selectGroundBattle(line.state)!;
    expect(g.playerSector).not.toBeNull();
    expect(ev(line.state, [{ type: 'groundOrdered', orders: { fallBack: true } }], 'player').rejected[0]?.reason).toMatch(/only the one leading/);
    expect(selectGroundPlanning(planned({ commandHanded: 'the general is dead' }, padawan))!.role).toBe('commander');
    const officer = meet(base({ path: 'career', army: true }), [{ name: 'Sergeant Holt', role: 'soldier', faction: 'republic' }]);
    const po = selectGroundPlanning(planned({}, officer))!;
    expect(po.role).toBe('commander');
    expect(po.atPost).toBe(true);
  });
});
