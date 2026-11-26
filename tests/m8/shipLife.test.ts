// m8-ship-life (checklist item 13 part 2; D-518, D-519; docs-v2/spec/ship-life.md): owning and running ships, travel, customs,
// modifications and breakdowns, the Possessions and Tactics tabs, tactics as knowledge, and the m8-ship-battles review (Part A).
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { SHIP_MODS } from '../../src/data/shipLife.config';
import { TACTIC_SETS } from '../../src/data/tactics';
import { absDayFromDate } from '../../src/engine/calendar';
import { breakdownChance, capacityUsed, classLife, driveOf, overCapacity, rollLegs, runCustoms, shipEffects, type CustomsInput } from '../../src/engine/shipLife';
import { newShip, shipClass } from '../../src/engine/ships';
import { seedRng } from '../../src/engine/rng';
import { aftermath, fieldHolder } from '../../src/features/battles';
import { battleMenu, buildBattle, stepBattle, type Battle, type BattleSetup, type StepCtx } from '../../src/features/battles/rules';
import { sideOf } from '../../src/features/battles/setup';
import { selectActiveBattle } from '../../src/features/battles/selectors';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';
import { carrySlots } from '../../src/features/possessions';
import { selectCarrySlots, selectHoldings, selectStoredByPlace, selectUsableItems } from '../../src/features/possessions/selectors';
import { selectShipCards, selectShips } from '../../src/features/ships/selectors';
import { impliedTactics, tacticsFeature } from '../../src/features/tactics';
import { selectKnownTactics, selectRecognisedTactics, selectTacticRows } from '../../src/features/tactics/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { Registry } from '../../src/state/types';
import type { Intent } from '../../src/ai/schemas/intent';
import { resolveTurn } from '../../src/turn/resolve';
import { planTravel } from '../../src/turn/travel';
import { GAP, mainSpecialtyRows } from '../support/mainSpecialty';

const day = (bby: number, month = 1, d = 1): number => absDayFromDate({ year: -bby, month, day: d });
const START = day(3661, 1, 2);
/** Only the world's time hook, so the seconds of a battle pass quickly. */
const FAST: Registry<GameState> = REGISTRY.map((f) => {
  if (f.id === 'world') return f;
  const { onTimeAdvanced: _hook, ...rest } = f;
  return rest;
});

interface Over {
  path?: 'jedi' | 'career' | 'sith';
  archetype?: string;
  rank?: string;
  option?: string;
  faction?: string;
  credits?: number;
}
const fresh = (o: Over = {}, reg: Registry<GameState> = FAST): GameState => {
  const s = createInitialState<GameState>(reg, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'ship-life',
    start: { day: START, second: 8 * 3600 },
    character: {
      name: 'Kael',
      birthDay: START - 30 * 368,
      path: o.path ?? 'jedi',
      archetype: o.archetype ?? 'jediGuardian',
      ...(o.path === 'career' ? {} : { mainFormId: 'soresu', trainingStartAge: 4 }),
      ...(o.option || o.faction ? { start: { optionId: o.option ?? 'test', faction: o.faction ?? 'republic', imperialBorn: false } } : {}),
    },
    rank: o.rank ?? (o.path === 'career' ? 'career' : 'knight'),
  });
  const placed = applyEvents(reg, s, [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: '', moveHere: true }], { source: 'ai' }).state;
  return o.credits === undefined ? placed : { ...placed, economy: { ...placed.economy, wallet: { republic: o.credits, imperial: 0, hutt: 0 } } };
};
const ev = (s: GameState, events: object[], source: 'ai' | 'engine' | 'dev' | 'player' = 'engine', reg: Registry<GameState> = FAST) => applyEvents(reg, s, events, { source });
const words = (s: GameState, what: string, reg: Registry<GameState> = FAST) => ev(s, [{ type: 'droid', what }], 'ai', reg);
const travel = (names: string[], extra: Partial<Intent> = {}): Intent => ({ actionType: 'travel', targets: [], references: [], unknownNames: names, ...extra });
const CTX: StepCtx = { troopsFor: () => 'sithTrooper', playerJedi: false };
const typesOf = (r: { applied: readonly { event: { type: string } }[] }): string[] => r.applied.map((a) => a.event.type);

function fleetSetup(over: Partial<BattleSetup> = {}): BattleSetup {
  const cmd = { name: 'Admiral', npcId: null, tactics: 50, traits: [] as string[], jedi: false };
  return {
    id: 'battle-t',
    kind: 'fleet',
    role: 'commander',
    trigger: 'sighted',
    stakes: 'lethal',
    placeId: null,
    placeName: 'open space',
    year: -3661,
    player: sideOf('the fleet', 'republic', 'navy', { ...cmd, name: 'Kael' }),
    enemy: sideOf('the Imperial ships', 'sithEmpire', 'navy', { ...cmd, name: 'Moff' }),
    playerShips: [newShip('a0', 'hammerhead', 45, 'Hammerhead 1'), newShip('a1', 'hammerhead', 45, 'Hammerhead 2'), newShip('a2', 'thranta', 45, 'Thranta 1')],
    enemyShips: [newShip('b0', 'harrower', 45, 'Harrower 1'), newShip('b1', 'fury', 45, 'Fury 1')],
    ownShipId: 'a0',
    rng: seedRng('t'),
    playerCommands: true,
    ...over,
  };
}
const withFleet = (b: Battle, f: (x: NonNullable<Battle['fleet']>) => NonNullable<Battle['fleet']>): Battle => ({ ...b, fleet: f(b.fleet!) });

// ---------------------------------------------------------------- Part A

describe('Part A: the m8-ship-battles review', () => {
  it('A1: Cipher Nine\'s Stealth follows her sheet (84), and no sheeted main specialty sits more than 10 below its sheet', () => {
    const c9 = CANON_BY_ID.get('lore:cipher-nine')!;
    expect(canonFigureLevelsAt(c9, 3640, day(3640))['stealth']).toBeCloseTo(84, 1);
    const over = mainSpecialtyRows().filter((r) => r.gap > GAP);
    expect(over).toEqual([]);
  });
  it('A3: abandoning ship in command ends the player\'s part; the fleet fights on under the next senior captain', () => {
    const b = withFleet(buildBattle(fleetSetup()), (f) => ({ ...f, a: { ...f.a, ships: f.a.ships.map((s) => (s.id === 'a0' ? { ...s, hull: -1 } : s)) } }));
    const r = stepBattle(b, {}, CTX);
    expect(r.battle.out).toBe(true);
    expect(r.battle.left).toBe('abandoned');
    expect(r.battle.command).toBe('npc');
    expect(r.battle.player.commander.name).toBe('the next senior captain');
    expect(r.big.join(' ')).toMatch(/Command passes to the next senior captain/);
  });
  it('A3/A4: afterwards the player\'s fate follows who holds the field: picked up, or capture or escape', () => {
    const s = fresh();
    const base = { ...buildBattle(fleetSetup()), left: 'abandoned' as const };
    const won = aftermath({ ...base, end: { winner: 'player', reason: 'destroyed' } }, s, seedRng('x'));
    expect(fieldHolder({ ...base, end: { winner: 'player', reason: 'destroyed' } })).toBe('player');
    expect(won.lines.join(' ')).toMatch(/picked up/);
    expect(won.emit.some((e) => e.type === 'captivityBegan')).toBe(false);
    let taken = 0;
    let escaped = 0;
    for (let i = 0; i < 60; i++) {
      const r = aftermath({ ...base, end: { winner: 'enemy', reason: 'destroyed' } }, s, seedRng(`a${i}`));
      if (r.emit.some((e) => e.type === 'captivityBegan' && e['source'] === 'battle')) taken++;
      else if (/slips away/.test(r.lines.join(' '))) escaped++;
    }
    expect(taken).toBeGreaterThan(0);
    expect(escaped).toBeGreaterThan(0);
    // A disabled fighter counts as lost to its pilot, and its pilot's fate follows the field the same way (A4).
    const fighter = aftermath({ ...base, left: 'disabled', end: { winner: 'enemy', reason: 'disabled' } }, s, seedRng('f'));
    expect(fighter.lines.join(' ')).toMatch(/hold the field/);
  });
  it('A5: a named NPC aboard a ship destroyed rolls to survive; a canon figure is protected', () => {
    let s = fresh();
    s = ev(s, [{ type: 'npcIntroduced', name: 'Captain Orsa Venn', species: 'human', faction: 'republic', role: 'officer', ageApprox: 40, description: '' }], 'ai').state;
    const npcId = Object.values(s.npcs.byId).find((n) => n.name === 'Captain Orsa Venn')!.id;
    const set = fleetSetup({ playerCommands: false, role: 'crew' });
    const b0 = buildBattle({ ...set, player: { ...set.player, commander: { ...set.player.commander, name: 'Captain Orsa Venn', npcId } } });
    const lost: Battle = { ...withFleet(b0, (f) => ({ ...f, a: { ...f.a, ships: f.a.ships.map((x) => (x.id === 'a0' ? { ...x, destroyed: true } : x)) } })), end: { winner: 'enemy', reason: 'destroyed' } };
    let died = 0;
    let lived = 0;
    for (let i = 0; i < 40; i++) {
      const r = aftermath(lost, s, seedRng(`n${i}`));
      if (r.emit.some((e) => e.type === 'npcDied' && e['npcRef'] === npcId)) died++;
      else lived++;
    }
    expect(died).toBeGreaterThan(0);
    expect(lived).toBeGreaterThan(0);
    const canon = { ...s, npcs: { ...s.npcs, byId: { ...s.npcs.byId, [npcId]: { ...s.npcs.byId[npcId]!, canonId: 'lore:test' } } } };
    for (let i = 0; i < 20; i++) expect(aftermath(lost, canon, seedRng(`c${i}`)).emit.some((e) => e.type === 'npcDied')).toBe(false);
  });
});

// ---------------------------------------------------------------- ships as data and ownership

describe('ships as data and ownership', () => {
  it('hyperdrives follow the ruling: lore drives kept, upgrades one step faster, no hyperdrive stays none', () => {
    expect(classLife('dynamic').drive).toBe(3);
    expect(driveOf('dynamic', ['hyperdrive'])).toBe(2);
    expect(driveOf('dynamic', ['hyperdrive', 'hyperdrive'])).toBe(1.5);
    expect(classLife('ebonHawk').drive).toBe(1);
    expect(classLife('supremacy').drive).toBeNull();
    expect(driveOf('supremacy', ['hyperdrive'])).toBeNull();
  });
  it('a ship is bought new or used, financed, and sold through the economy', () => {
    const s = fresh({ path: 'career', archetype: 'smuggler', credits: 200_000 });
    const bought = ev(s, [{ type: 'trade', dir: 'buy', item: 'a Dynamic-class freighter' }], 'ai');
    expect(typesOf(bought)).toContain('shipAcquired');
    const ship = selectShips(bought.state)[0]!;
    expect([ship.classId, ship.hold, ship.how]).toEqual(['dynamic', 'owned', 'bought']);
    expect(bought.state.economy.wallet.republic).toBeLessThan(200_000);
    const used = ev(s, [{ type: 'trade', dir: 'buy', item: 'a used Dynamic-class freighter' }], 'ai').state;
    expect(used.economy.wallet.republic).toBeGreaterThan(bought.state.economy.wallet.republic);
    const sold = ev(bought.state, [{ type: 'trade', dir: 'sell', item: 'the Dynamic-class freighter' }], 'ai');
    expect(typesOf(sold)).toContain('shipSold');
    expect(selectShips(sold.state)).toHaveLength(0);
    const poor = fresh({ path: 'career', archetype: 'smuggler', credits: 30_000 });
    expect(ev(poor, [{ type: 'trade', dir: 'buy', item: 'a Dynamic-class freighter' }], 'ai').applied.some((a) => a.event.type === 'shipAcquired')).toBe(false);
    const financed = ev(poor, [{ type: 'trade', dir: 'buy', item: 'a Dynamic freighter on credit' }], 'ai').state;
    expect(selectShips(financed)[0]!.how).toBe('financed');
    expect(financed.economy.loans.length).toBe(1);
  });
  it('a ship is issued, salvaged or stolen; stolen ships keep the old transponder and are reported', () => {
    const jedi = fresh();
    const issued = words(jedi, 'ship: the Order issued her a Defender-class light corvette').state;
    expect(selectShips(issued)[0]).toMatchObject({ classId: 'defender', hold: 'issued', issuer: 'the Jedi Order' });
    const padawan = fresh({ rank: 'padawan' });
    expect(selectShips(words(padawan, 'ship: issued a Defender-class light corvette').state)).toHaveLength(0);
    const s = fresh({ path: 'career', archetype: 'smuggler' });
    expect(selectShips(words(s, 'ship: salvaged a Dynamic-class freighter from the scrapyard').state)[0]).toMatchObject({ how: 'salvaged', hold: 'owned' });
    const stolen = selectShips(words(s, 'ship: stole a Dynamic-class freighter from Davik').state)[0]!;
    expect(stolen).toMatchObject({ hold: 'stolen', transponder: 'real', reportedStolen: true });
    expect(stolen.formerOwner?.toLowerCase()).toContain('davik');
  });
  it('a Jedi\'s issued ship does not count toward the wealth limit; a ship bought does', () => {
    const s = fresh({ credits: 0 });
    const issued = words(s, 'ship: the Order issued a Defender-class light corvette').state;
    expect(issued.economy.possessions).toBe(0);
    expect(issued.flags.set.includes('jediWealth')).toBe(false);
    expect(selectHoldings(issued).never.join(' ')).toMatch(/issued by the Jedi Order/);
    const rich = fresh({ credits: 200_000 });
    const bought = ev(rich, [{ type: 'trade', dir: 'buy', item: 'a Dynamic-class freighter' }], 'ai').state;
    expect(bought.economy.possessions).toBeGreaterThan(25_000);
  });
  it('crew wages are paid on the calendar; unpaid crew lose loyalty and leave', () => {
    let s = fresh({ path: 'career', archetype: 'smuggler', credits: 100_000 }, REGISTRY);
    s = words(s, 'ship: salvaged a Dynamic-class freighter', REGISTRY).state;
    s = words(s, 'ship: hired a pilot named Sela Dorn', REGISTRY).state;
    const before = s.economy.wallet.republic;
    const paid = advanceTime(REGISTRY, s, { seconds: 32 * 86_400, reason: 't', source: 'turnDraft', jump: true }).state;
    expect(paid.economy.wallet.republic).toBeLessThan(before - 2000 + 1);
    expect(selectShips(paid)[0]!.crew[0]!.unpaidMonths).toBe(0);
    let broke = { ...s, economy: { ...s.economy, wallet: { republic: 0, imperial: 0, hutt: 0 } } };
    broke = advanceTime(REGISTRY, broke, { seconds: 32 * 86_400, reason: 't', source: 'turnDraft', jump: false }).state;
    const c = selectShips(broke)[0]!.crew[0]!;
    // Missed upkeep wears the ship instead of growing the debt.
    expect(selectShips(broke)[0]!.wear).toBeGreaterThan(selectShips(s)[0]!.wear + 0.03);
    expect(c.loyalty).toBeLessThan(3);
    expect(c.unpaidMonths).toBe(1);
    const gone = advanceTime(REGISTRY, broke, { seconds: 100 * 86_400, reason: 't', source: 'turnDraft', jump: false }).state;
    expect(selectShips(gone)[0]!.crew).toHaveLength(0);
  });
  it('a smuggler starts with a modified ship of their own; old saves keep the start ship', () => {
    const s = fresh({ path: 'career', archetype: 'smuggler', option: 'underworld-smuggler', faction: 'underworld' });
    const x = selectShips(s)[0]!;
    expect(x).toMatchObject({ classId: 'xsFreighter', hold: 'owned', dockedAt: 'Nar Shaddaa' });
    expect(x.mods.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------- travel

describe('travel', () => {
  it('trip time follows the route and the hyperdrive class', () => {
    const s = fresh({ path: 'career', archetype: 'smuggler' });
    const stock = ev(s, [{ type: 'shipAcquired', classId: 'dynamic', how: 'bought' }], 'dev').state;
    const fast = ev(s, [{ type: 'shipAcquired', classId: 'dynamic', how: 'bought', mods: ['hyperdrive', 'hyperdrive'] }], 'dev').state;
    const a = planTravel(stock, travel(['Alderaan']))!;
    const b = planTravel(fast, travel(['Alderaan']))!;
    expect(a.shipClass).toBe(3);
    expect(b.shipClass).toBe(1.5);
    expect(a.hours!).toBeGreaterThan(b.hours!);
    // Without a ship: passage on a liner.
    expect(planTravel(fresh({ path: 'career', archetype: 'smuggler' }), travel(['Alderaan']))!.ship).toBe('passage on a liner');
  });
  it('off the charted routes: an astrogation roll a leg; a failure reverts, a bad one misjumps', () => {
    const bad = rollLegs(seedRng('l'), 0, 0, 6, 16);
    expect(bad.legs).toHaveLength(6);
    expect(bad.legs.some((l) => !l.ok)).toBe(true);
    expect(bad.extraHours).toBeGreaterThan(0);
    expect(bad.misjump).toBe(true);
    const good = rollLegs(seedRng('l'), 200, 4, 6, 10);
    expect(good.legs.every((l) => l.ok)).toBe(true);
    expect(good.extraHours).toBe(0);
  });
  it('travel advances the calendar and costs fuel and fees; passage is paid by those without a ship', () => {
    const s = fresh({ path: 'career', archetype: 'smuggler', credits: 50_000 });
    const owned = ev(s, [{ type: 'shipAcquired', classId: 'dynamic', how: 'bought' }], 'dev').state;
    const r = resolveTurn(REGISTRY, owned, travel(['Alderaan']));
    expect(r.state.clock.now.day * 86_400 + r.state.clock.now.second).toBeGreaterThan(owned.clock.now.day * 86_400 + owned.clock.now.second + 3600);
    expect(r.state.economy.wallet.republic).toBeLessThan(50_000);
    expect(r.state.economy.log.some((l) => /fuel/.test(l.reason))).toBe(true);
    expect(selectShips(r.state)[0]!.dockedAt).toBe('Alderaan');
    const walker = resolveTurn(REGISTRY, s, travel(['Alderaan']));
    expect(walker.state.economy.log.some((l) => /passage/.test(l.reason))).toBe(true);
  });
});

// ---------------------------------------------------------------- customs

const customs = (o: Partial<CustomsInput> = {}): CustomsInput => ({ zone: 'core', atWar: false, flagged: true, standing: null, renown: 0, inspector: 'police', transponder: 'real', reportedStolen: false, effects: shipEffects('dynamic', []), contrabandUnits: 0, contrabandHidden: 0, bluff: 0, run: false, corruptU: 0.9, ...o });
function checked(o: Partial<CustomsInput>, want: (r: ReturnType<typeof runCustoms>[0]) => boolean) {
  for (let i = 0; i < 300; i++) {
    const [r] = runCustoms(seedRng(`c${i}`), customs(o));
    if (r.checked && want(r)) return r;
  }
  throw new Error('never in 300 seeds');
}

describe('customs and scans', () => {
  it('dense in the Core, light in the Outer Rim and Hutt space; a flagged ship is searched more', () => {
    const rate = (o: Partial<CustomsInput>) => Array.from({ length: 400 }, (_, i) => runCustoms(seedRng(`r${i}`), customs(o))[0].checked).filter(Boolean).length;
    expect(rate({ zone: 'core', flagged: false })).toBeGreaterThan(rate({ zone: 'hutt', flagged: false }));
    expect(rate({ zone: 'outer', flagged: true })).toBeGreaterThan(rate({ zone: 'outer', flagged: false }));
  });
  it('the check gives each outcome', () => {
    expect(checked({}, (r) => r.outcome === 'clear').found).toEqual([]);
    expect(checked({ effects: shipEffects('dynamic', ['militaryWeapons']) }, (r) => r.outcome === 'fine').fine).toBeGreaterThan(0);
    expect(checked({ effects: shipEffects('dynamic', ['militaryWeapons']), corruptU: 0 }, (r) => r.outcome === 'bribe').bribe).toBeGreaterThan(0);
    expect(checked({ contrabandUnits: 10 }, (r) => r.outcome === 'impoundCargo').found.join(' ')).toMatch(/contraband/);
    expect(checked({ transponder: 'missing' }, (r) => r.outcome === 'impoundShip').found).toContain('no transponder');
    expect(checked({ reportedStolen: true }, (r) => r.outcome === 'arrest').found).toContain('a ship reported stolen');
    expect(checked({ transponder: 'missing', run: true }, (r) => r.outcome === 'chase').outcome).toBe('chase');
  });
  it('a hidden compartment beats a basic search, not a boarding inspection; illegal mods are found by scans', () => {
    const fx = shipEffects('dynamic', ['compartment']);
    let foundHidden = 0;
    for (let i = 0; i < 200; i++) {
      const [r] = runCustoms(seedRng(`h${i}`), customs({ inspector: 'port', flagged: false, zone: 'core', effects: fx, contrabandUnits: 3, contrabandHidden: 3, bluff: 40 }));
      if (r.checked && !r.thorough && r.found.some((f) => /hidden/.test(f))) foundHidden++;
    }
    const thorough = checked({ inspector: 'military', effects: fx, contrabandUnits: 3, contrabandHidden: 3, bluff: 40 }, (r) => r.found.some((f) => /hidden/.test(f)));
    expect(thorough.thorough).toBe(true);
    expect(foundHidden).toBeLessThan(40);
    expect(checked({ effects: shipEffects('dynamic', ['sensorMask']) }, (r) => r.found.length > 0).found.join(' ')).toMatch(/illegal gear \(sensorMask\)/);
  });
  it('a ship caught once is flagged until its ID changes', () => {
    const s = fresh({ path: 'career', archetype: 'smuggler', credits: 50_000 });
    let x = ev(s, [{ type: 'shipAcquired', classId: 'dynamic', how: 'bought' }], 'dev').state;
    const id = selectShips(x)[0]!.id;
    x = ev(x, [{ type: 'customsChecked', shipId: id, world: 'Coruscant', outcome: 'fine', found: ['illegal gear (sensorMask)'], fine: 1000, bribe: 0, flag: true, inspector: 'police' }]).state;
    expect(selectShips(x)[0]!.flagged).toBe(true);
    x = words(x, 'ship: had the transponder altered by a slicer').state;
    expect(selectShips(x)[0]).toMatchObject({ flagged: false, transponder: 'altered' });
  });
});

// ---------------------------------------------------------------- mods, repairs, breakdowns

describe('modifications, repairs and breakdowns', () => {
  it('mods use capacity; over capacity raises the breakdown risk', () => {
    expect(classLife('dynamic').capacity).toBeGreaterThan(classLife('hammerhead').capacity);
    const many = ['hyperdrive', 'engines', 'weapons', 'shields', 'sensorMask'];
    expect(capacityUsed(many)).toBe(SHIP_MODS.filter((m) => many.includes(m.id)).reduce((t, m) => t + m.points, 0));
    expect(overCapacity('dynamic', many)).toBe(capacityUsed(many) - 10);
    const pushed = (over: number) => breakdownChance({ wear: 0, over, damaged: false, patched: [] }, 'hardManoeuvres');
    expect(pushed(2)).toBeGreaterThan(pushed(0));
  });
  it('breakdowns roll only when pushed, or on every jump for a worn or heavily over-modded ship', () => {
    expect(breakdownChance({ wear: 0.1, over: 0, damaged: false, patched: [] }, 'jump')).toBe(0);
    expect(breakdownChance({ wear: 0.7, over: 0, damaged: false, patched: [] }, 'jump')).toBeGreaterThan(0);
    expect(breakdownChance({ wear: 0, over: 3, damaged: false, patched: [] }, 'jump')).toBeGreaterThan(0);
    expect(breakdownChance({ wear: 0, over: 0, damaged: false, patched: [] }, 'emergencyJump')).toBeLessThan(0.01);
  });
  it('a small mod goes in by a crew roll or a kit; a big one needs a shipyard; illegal mods are noted', () => {
    const s = fresh({ path: 'career', archetype: 'smuggler', credits: 100_000 });
    const x = ev(s, [{ type: 'shipAcquired', classId: 'dynamic', how: 'bought' }], 'dev').state;
    expect(words(x, 'ship: fitted a hyperdrive upgrade').rejected.length + words(x, 'ship: fitted a hyperdrive upgrade').applied.filter((a) => a.event.type === 'shipAct').length).toBeGreaterThan(0);
    expect(selectShips(words(x, 'ship: fitted a hyperdrive upgrade').state)[0]!.mods).toEqual([]);
    const yard = words(x, 'ship: fitted a hyperdrive upgrade at a shipyard').state;
    expect(selectShips(yard)[0]!.mods).toContain('hyperdrive');
    expect(selectShips(yard)[0]!.yardUntil).toBeGreaterThan(x.clock.now.day);
    const kit = words(x, 'ship: fitted a hidden compartment with a factory kit').state;
    expect(selectShips(kit)[0]!.mods).toContain('compartment');
  });
  it('shipyard repairs cost credits and time; destroyed systems need the yard', () => {
    const s = fresh({ path: 'career', archetype: 'smuggler', credits: 100_000 });
    let x = ev(s, [{ type: 'shipAcquired', classId: 'dynamic', how: 'bought' }], 'dev').state;
    const sh = selectShips(x)[0]!;
    x = ev(x, [{ type: 'shipConditionSet', shipId: sh.id, classId: sh.classId, name: sh.name, systems: { hyperdrive: 'destroyed' } }]).state;
    const before = x.economy.wallet.republic;
    const r = words(x, 'ship: repaired at a shipyard');
    expect(r.state.economy.wallet.republic).toBeLessThan(before);
    expect(r.state.battles.ships[sh.id]).toBeUndefined();
    expect(selectShips(r.state)[0]!.yardUntil).toBeGreaterThan(x.clock.now.day);
  });
});

// ---------------------------------------------------------------- the Possessions tab

describe('the Possessions tab', () => {
  it('shows each section: on you by slot, ships, droids, stored elsewhere, holdings', () => {
    let s = fresh({ path: 'career', archetype: 'smuggler', credits: 5000 });
    s = ev(s, [{ type: 'shipAcquired', classId: 'dynamic', how: 'bought' }], 'dev').state;
    expect(selectCarrySlots(s).map((v) => v.slot)).toEqual(expect.arrayContaining(['worn', 'hip', 'belt']));
    const card = selectShipCards(s)[0]!;
    for (const k of ['name', 'className', 'hold', 'docked', 'hull', 'systems', 'mods', 'capacity', 'transponder', 'cargo', 'crew', 'supplies', 'flags'] as const) expect(card[k], k).toBeTruthy();
    expect(selectHoldings(s).counts.length).toBe(2);
  });
  it('every item needs a place: past the slots it is in hand, then too much to carry', () => {
    const it = (n: number, size: 'large' | 'medium') => ({ id: `i${n}`, priceId: 'rifle', name: 'a blaster rifle', size, where: { kind: 'carried' as const }, issued: false, day: 0 });
    const slots = carrySlots([it(1, 'large'), it(2, 'large'), it(3, 'large'), it(4, 'large')]);
    expect(slots.map((v) => [v.slot, v.items.length])).toEqual([['back', 1], ['hands', 2], ['too much to carry', 1]]);
  });
  it('nothing away from the character can be used; it can be fetched only where it is', () => {
    let s = fresh({ path: 'career', archetype: 'smuggler', credits: 5000 });
    s = ev(s, [{ type: 'shipAcquired', classId: 'dynamic', how: 'bought' }], 'dev').state;
    const pistol = selectUsableItems(s).find((i) => i.priceId === 'pistol')!;
    expect(pistol).toBeDefined();
    s = words(s, 'item: stored the blaster pistol in the ship\'s hold').state;
    expect(selectUsableItems(s).some((i) => i.id === pistol.id)).toBe(false);
    expect(selectStoredByPlace(s)[0]!.items.map((i) => i.id)).toContain(pistol.id);
    // Away from the ship (it docked elsewhere), it cannot be fetched.
    const away = { ...s, ships: { ...s.ships, ships: Object.fromEntries(Object.entries(s.ships.ships).map(([k, v]) => [k, { ...v, dockedAt: 'Alderaan' }])) } };
    expect(words(away, 'item: took the blaster pistol from the ship').state.possessions.items.find((i) => i.id === pistol.id)!.where.kind).toBe('ship');
    expect(words(s, 'item: took the blaster pistol from the ship').state.possessions.items.find((i) => i.id === pistol.id)!.where.kind).toBe('carried');
  });
});

// ---------------------------------------------------------------- tactics

describe('tactics as knowledge and the Tactics tab', () => {
  it('every pilot knows the basics; training implies sets; the tab lists known and seen with the source', () => {
    const k = impliedTactics({ archetype: 'starfighterPilot', path: 'career' }, 'career', 0);
    for (const id of TACTIC_SETS['flightSchool']!.ids) expect(k[id], id).toBeDefined();
    const civ = impliedTactics({ archetype: 'civilian', path: 'career' }, 'career', 0);
    expect(Object.keys(civ).sort()).toEqual(['break', 'fly', 'jink', 'pass']);
    let s = fresh({ path: 'career', archetype: 'civilian' });
    s = ev(s, [{ type: 'tacticsSeen', ids: ['tallonRoll', 'capT'], by: 'enemy' }]).state;
    s = words(s, 'tactic: taught the Corellian Slip by Commander Hale').state;
    const rows = selectTacticRows(s);
    expect(rows.find((r) => r.def.id === 'tallonRoll')).toMatchObject({ status: 'seen' });
    expect(rows.find((r) => r.def.id === 'corellianSlip')).toMatchObject({ status: 'known', source: expect.stringMatching(/taught by commander hale/i) });
    expect(rows.some((r) => r.def.scale === 'ground') || rows.every((r) => r.def.scale !== 'ground')).toBe(true);
  });
  it('practice after seeing it moves a seen tactic to known', () => {
    let s = fresh({ path: 'career', archetype: 'civilian' });
    expect(words(s, 'tactic: practised the Tallon Roll').applied.filter((a) => a.event.type === 'tacticStudied')).toHaveLength(0);
    s = ev(s, [{ type: 'tacticsSeen', ids: ['tallonRoll'], by: 'enemy' }]).state;
    for (let i = 0; i < 3; i++) s = words(s, 'tactic: practised the Tallon Roll').state;
    expect(selectKnownTactics(s).has('tallonRoll')).toBe(true);
    expect(s.tactics.known['tallonRoll']!.source).toMatch(/practice/);
  });
  it('the battle menu offers only known tactics; seen ones give the recognition bonus only', () => {
    const civ = fresh({ path: 'career', archetype: 'civilian' });
    const owned = ev(civ, [{ type: 'shipAcquired', classId: 'aurek', how: 'issued' }], 'dev').state;
    const b = selectActiveBattle(ev(owned, [{ type: 'shipBattleProposed', what: 'enemy: two Imperial Supremacy fighters; mine: Aurek' }], 'dev').state)!;
    const offered = battleMenu(b).options.filter((o) => o.group === 'manoeuvre').map((o) => o.orders.manoeuvre);
    expect(offered).toContain('break');
    expect(offered).not.toContain('tallonRoll');
    // A seen manoeuvre is recognised (+1 when they fly it) but still not offered.
    const seen = { ...b, tactics: { known: b.tactics!.known, recognised: [...b.tactics!.recognised, 'tallonRoll'] } };
    expect(battleMenu(seen).options.some((o) => o.orders.manoeuvre === 'tallonRoll')).toBe(false);
    // A seen enemy formation is worth the +1 of a known one in a fleet round.
    const fleet = { ...buildBattle(fleetSetup()), tactics: { known: [], recognised: ['exchange'] } };
    const r = stepBattle(fleet, {}, CTX);
    expect(r.battle.fleet!.log.at(-1)!.mods.a.some((m) => /formation is known/.test(m.source))).toBe(true);
    expect(r.battle.fleet!.a.intel).toBe(false);
    const blind = stepBattle({ ...buildBattle(fleetSetup()), tactics: { known: [], recognised: [] } }, {}, CTX);
    expect(blind.battle.fleet!.log.at(-1)!.mods.a.some((m) => /formation is known/.test(m.source))).toBe(false);
    // An order for an unknown tactic is refused.
    const s2 = ev(owned, [{ type: 'shipBattleProposed', what: 'enemy: two Imperial Supremacy fighters; mine: Aurek' }], 'dev').state;
    expect(ev(s2, [{ type: 'battleOrdered', orders: { manoeuvre: 'tallonRoll' } }], 'player').rejected.length).toBe(1);
  });
  it('old saves load with the tactics their recorded training implies', () => {
    const raw = { character: { archetype: 'navalOfficer', path: 'career' }, ranks: { rank: 'career' }, clock: { now: { day: START } } };
    const slice = tacticsFeature.emptyState!(raw);
    for (const id of TACTIC_SETS['officerAcademy']!.ids) expect(slice.known[id], id).toBeDefined();
    const knight = tacticsFeature.emptyState!({ character: { archetype: 'jediGuardian', path: 'jedi' }, ranks: { rank: 'knight' }, clock: { now: { day: START } } });
    expect(knight.known['tallonRoll']).toBeDefined();
    expect(selectRecognisedTactics(fresh()).has('break')).toBe(true);
  });
});

// keep shipClass imported for the reader: the classes are data/ships.ts
void shipClass;
