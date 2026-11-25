// Holds against a duelist and getting away (Jared, 2026-11-25; D-496; docs-v2/spec/holds.md).
import { describe, expect, it } from 'vitest';
import { EXCHANGE_SECONDS } from '../../src/data/combat.config';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { DUEL_PACE } from '../../src/data/duelPace';
import { HOLD_NEED, PAST_CHANCE, SEARCH_SUPPORT, type EscapeStep, type HoldSetting } from '../../src/data/holds';
import { absDayFromDate, toAbsSecond } from '../../src/engine/calendar';
import { levelExact, xpForLevel } from '../../src/engine/curve';
import { abilityGap, barrierSeconds, boughtSeconds, chase, holdSetting, losePursuer, pastChance, planEscape, runPace, runSustain, searchSupport, senseRange, standSeconds, trailChance, type Pursuer, type Runner } from '../../src/engine/holds';
import { seedRng } from '../../src/engine/rng';
import { computeCreation } from '../../src/features/character/selectors';
import { beginHold, npcPursuer, npcSupport, resolveHoldTurn } from '../../src/features/combat/holds';
import { applyEvents } from '../../src/state/applyEvents';
import { advanceTime } from '../../src/state/advanceTime';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { resolvedBlock } from '../../src/turn/context';
import { describeHold, duelPace, holdChoices, holdLine, pursuitLine } from '../../src/turn/holdFacts';
import { resolveTurn } from '../../src/turn/resolve';

type Levels = Record<string, number>;
const line = (age: number): Levels => {
  const r = computeCreation({ name: 'x', birthDay: 0, startDay: Math.round(age * 368), speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: 'master', trainingStartAge: 4, talents: {}, dominantHand: 'right', npc: true } as Parameters<typeof computeCreation>[0]);
  return Object.fromEntries(Object.entries(r.startingXp).map(([k, v]) => [k, levelExact(v)]));
};
/** An average Guardian Master of 45, one at Malgus's level, and Chancellor Sidious as his sheet has him. */
const MASTER = line(45);
const NEAR: Levels = { ...line(60), soresu: 92, forceControl: 88, forceSense: 88, willpower: 94, telekinesis: 80, forceSpeed: 80 };
const SIDIOUS: Levels = { juyo: 98, makashi: 96, soresu: 95, forceControl: 118, forceOutput: 125, forceSense: 100, willpower: 120, strength: 45, agility: 60, endurance: 55, forceSpeed: 80, telekinesis: 100 };

const PLACES: Record<HoldSetting, { name: string; kind: string; parent?: { name: string; kind: string } }> = {
  interior: { name: 'Crew Corridor', kind: 'room', parent: { name: 'the Resolute', kind: 'ship' } },
  building: { name: 'Archive Hall', kind: 'room', parent: { name: 'the Old Library', kind: 'building' } },
  hangar: { name: 'Docking Bay 94', kind: 'room', parent: { name: 'the Port', kind: 'building' } },
  street: { name: 'the Lower Market', kind: 'district' },
  open: { name: 'the Salt Flats', kind: 'wilderness' },
};
const game = (seed: string, setting: HoldSetting = 'interior', player: Levels = {}, over: { year?: number; path?: 'jedi' | 'career' } = {}): GameState => {
  const day = absDayFromDate({ year: over.year ?? -3653, month: 3, day: 1 });
  let s = createInitialState<GameState>(REGISTRY, {
    campaignId: `c-${seed}`,
    branchId: 'b1',
    seed,
    start: { day, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: day - 22 * 368, path: over.path ?? 'jedi', archetype: over.path === 'career' ? 'soldier' : 'jediGuardian', ...(over.path === 'career' ? {} : { mainFormId: 'soresu' }), trainingStartAge: over.path === 'career' ? 17 : 4 } as never,
    startingXp: Object.fromEntries(Object.entries(player).map(([k, v]) => [k, xpForLevel(v)])),
    rank: over.path === 'career' ? 'career' : 'padawan',
  });
  const p = PLACES[setting];
  const events = p.parent
    ? [
        { type: 'locationIntroduced', key: 'tmp:p', name: p.parent.name, kind: p.parent.kind, region: 'x', description: 'x', moveHere: false },
        { type: 'locationIntroduced', name: p.name, kind: p.kind, region: 'x', parentRef: 'tmp:p', description: 'x', moveHere: true },
      ]
    : [{ type: 'locationIntroduced', name: p.name, kind: p.kind, region: 'x', description: 'x', moveHere: true }];
  const l = applyEvents(REGISTRY, s, events, { source: 'ai' });
  expect(l.rejected).toEqual([]);
  s = l.state;
  for (const [name, role, faction] of [['Master Ven', 'jediMaster', 'jediOrder'], ['Darth Foe', 'sithLord', 'sithEmpire']] as const) s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name, species: 'human', faction, role, ageApprox: 45, description: '' }], { source: 'ai' }).state;
  return s;
};
const id = (s: GameState, name: string): string => Object.values(s.npcs.byId).find((n) => n.name === name)!.id;
const VEN = (s: GameState): string => id(s, 'Master Ven');
const FOE = (s: GameState): string => id(s, 'Darth Foe');
const patch = (s: GameState, npcId: string, x: object): GameState => ({ ...s, npcs: { ...s.npcs, byId: { ...s.npcs.byId, [npcId]: { ...s.npcs.byId[npcId]!, ...x } } } });
/** The holder at these levels against Malgus (the roster's) or Sidious (the sheet's). */
const set = (s: GameState, holder: Levels, foe: 'malgus' | 'sidious' | 'thug'): GameState => {
  const h = patch(s, VEN(s), { devLevels: holder });
  return patch(h, FOE(h), foe === 'malgus' ? { canonId: 'lore:darth-malgus' } : foe === 'sidious' ? { canonId: 'lore:darth-sidious', devLevels: SIDIOUS } : { devLevels: { djemSo: 30, forceControl: 20, willpower: 30, forceSense: 20 } });
};
/** Of so many holds, the share that buy what the setting needs. */
const N = 120;
const share = (holder: Levels, foe: 'malgus' | 'sidious', setting: HoldSetting, N = 120): number => {
  let n = 0;
  for (let i = 0; i < N; i++) {
    const s = set(game(`h${i}`, setting, {}, { year: foe === 'sidious' ? -25 : -3653 }), holder, foe);
    const { hold } = beginHold(s, VEN(s), FOE(s), null);
    const b = boughtSeconds(hold);
    if (b === null || b >= HOLD_NEED[setting]) n++;
  }
  return n / N;
};

describe('the hold', () => {
  it('the duelist gets past sooner the wider the gap, and an apex duelist sooner still', () => {
    expect(pastChance(-10, false)).toBe(pastChance(0, true));
    for (let i = 1; i < PAST_CHANCE.length; i++) expect(PAST_CHANCE[i]![1]).toBeGreaterThan(PAST_CHANCE[i - 1]![1]);
    for (let gap = 0; gap <= 70; gap++) expect(pastChance(gap, true), `${gap}`).toBeGreaterThanOrEqual(pastChance(gap, false));
    for (const gap of [5, 15, 25, 33]) expect(pastChance(gap, true), `${gap}`).toBeGreaterThan(pastChance(gap, false));
    expect(abilityGap({ combat: 70, forceControl: 60, willpower: 70 }, { combat: 92, forceControl: 88, willpower: 94 })).toBeCloseTo(74 / 3, 6);
  });

  it('one clock: an exchange of a hold is 5-10 s, as everywhere (D-497)', () => {
    for (let i = 0; i < 60; i++) {
      const s = set(game(`h${i}`), MASTER, 'malgus');
      const { hold } = beginHold(s, VEN(s), FOE(s), null);
      expect(hold.seconds!).toBeGreaterThanOrEqual(hold.exchanges * EXCHANGE_SECONDS.min);
      expect(hold.seconds!).toBeLessThanOrEqual(hold.exchanges * EXCHANGE_SECONDS.max);
      const b = boughtSeconds(hold);
      if (b !== null) expect(b).toBe(hold.seconds);
    }
    // A hold saved before D-497 has its exchanges only.
    expect(boughtSeconds({ exchanges: 4, end: 'fell' })).toBe(30);
    // The player's own stand: the same clock, to the exchange the way past opened.
    const clock = [5, 10, 7, 8];
    expect(standSeconds(clock, 0, seedRng('x'))).toBe(30);
    expect(standSeconds(clock, 1, seedRng('x'))).toBe(5);
    expect([5, 15, 22, 30]).toContain(standSeconds(clock, 0.4, seedRng('y')));
  });

  it('a duelist who gets past has struck the holder down or aside', () => {
    const ends: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
      const s = set(game(`h${i}`), MASTER, 'malgus');
      const { hold } = beginHold(s, VEN(s), FOE(s), null);
      ends[hold.end] = (ends[hold.end] ?? 0) + 1;
      if (hold.end === 'past') {
        expect(hold.holder).toBe('standing');
        expect(hold.hits[hold.hits.length - 1]).toContain('Darth Foe');
      }
      if (hold.end === 'fell') expect(hold.holder).not.toBe('standing');
    }
    expect(ends['fell']!).toBeGreaterThan(N * 0.8);
  });

  it('a Knight buys a corridor against Malgus in about one hold in ten (D-498)', () => {
    const r = computeCreation({ name: 'x', birthDay: 0, startDay: 30 * 368, speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: 'knight', trainingStartAge: 4, talents: {}, dominantHand: 'right', npc: true } as Parameters<typeof computeCreation>[0]);
    const knight = Object.fromEntries(Object.entries(r.startingXp).map(([k, v]) => [k, levelExact(v)]));
    const s = share(knight, 'malgus', 'interior', 500);
    expect(s).toBeGreaterThan(0.06);
    expect(s).toBeLessThan(0.14);
  });

  it('a High Master comes out of a hold against Malgus struck aside and standing about one time in five (D-498); a regular Master rarely', () => {
    const aside = (l: Levels): number => {
      let n = 0;
      for (let i = 0; i < 300; i++) {
        const s = set(game(`a${i}`), l, 'malgus');
        const { hold } = beginHold(s, VEN(s), FOE(s), null);
        if (hold.end === 'past' && hold.holder === 'standing') n++;
      }
      return n / 300;
    };
    const high = aside(line(60));
    expect(high).toBeGreaterThan(0.13);
    expect(high).toBeLessThan(0.28);
    expect(aside(MASTER)).toBeLessThan(0.1);
  });

  it('a High Master holds a top duelist for a corridor most of the time, and an apex one far less often', () => {
    const high = line(60);
    expect(share(high, 'malgus', 'interior')).toBeGreaterThan(0.65);
    expect(share(high, 'sidious', 'interior')).toBeLessThan(0.3);
  });

  it('about half of regular Masters hold a top duelist long enough to matter; the rest are cut down sooner, some at once', () => {
    const corridor = share(MASTER, 'malgus', 'interior');
    expect(corridor).toBeGreaterThan(0.35);
    expect(corridor).toBeLessThan(0.65);
    const times: number[] = [];
    for (let i = 0; i < N; i++) {
      const s = set(game(`h${i}`), MASTER, 'malgus');
      const { hold } = beginHold(s, VEN(s), FOE(s), null);
      const b = boughtSeconds(hold);
      if (b !== null) times.push(b);
    }
    expect(Math.min(...times)).toBeLessThanOrEqual(10);
  });

  it('a corridor is bought more often than a hangar; a Master near the duelist does better in each; against an apex everyone does worse', () => {
    for (const setting of ['interior', 'hangar'] as const) {
      const regular = share(MASTER, 'malgus', setting);
      const near = share(NEAR, 'malgus', setting);
      expect(near, setting).toBeGreaterThan(regular);
      expect(share(MASTER, 'sidious', setting), setting).toBeLessThan(regular);
      expect(share(NEAR, 'sidious', setting), setting).toBeLessThan(near);
    }
    expect(share(MASTER, 'malgus', 'interior')).toBeGreaterThan(share(MASTER, 'malgus', 'hangar'));
  });

  it('the setting is the recorded location', () => {
    const of = (kind: string, name = 'x', ...up: string[]) => holdSetting([{ kind, name, aliases: [] }, ...up.map((k) => ({ kind: k, name: 'y', aliases: [] }))] as Parameters<typeof holdSetting>[0]);
    expect([of('ship'), of('station'), of('room', 'x', 'ship'), of('room', 'x', 'building', 'planet'), of('building'), of('room', 'Hangar Two', 'ship'), of('building', 'Anchorhead Spaceport'), of('district'), of('city'), of('wilderness'), of('planet')]).toEqual(['interior', 'interior', 'interior', 'building', 'building', 'hangar', 'hangar', 'street', 'street', 'open', 'open']);
    expect(holdSetting([])).toBe('open');
  });
});

describe('doors and plans', () => {
  it('a top or apex duelist is through a blast door faster than an ordinary foe, and it still takes time', () => {
    const t = (tier: 'below' | 'master' | 'top' | 'apex' | 'beyond', saber = true) => barrierSeconds('interior', { tier, saber });
    expect([t('apex') < t('top'), t('top') < t('master'), t('master') < t('below'), t('below') < t('below', false)]).toEqual([true, true, true, true]);
    expect(t('beyond')).toBeGreaterThan(3);
    expect(barrierSeconds('building', { tier: 'below', saber: true })).toBeLessThan(t('below'));
    expect(barrierSeconds('open', { tier: 'below', saber: true })).toBe(0);
  });

  it('each step costs time, checked against the time bought; a step left out but needed is done on the way', () => {
    const foe = { tier: 'top', saber: true } as const;
    const p = (steps: EscapeStep[], setting: HoldSetting, b: number | null) => planEscape(steps, setting, b, foe);
    expect(p(['sealDoor'], 'interior', 13)).toMatchObject({ end: 'clear', used: 13, steps: [{ step: 'reachExit', result: 'done' }, { step: 'sealDoor', result: 'done' }] });
    expect(p(['sealDoor'], 'interior', 12)).toMatchObject({ steps: [{ step: 'reachExit', result: 'done' }, { step: 'sealDoor', result: 'late' }] });
    // The closed door gives time for the console, which gives more.
    expect(p(['sealDoor', 'wreckConsole'], 'interior', 13).lead!).toBeGreaterThan(p(['sealDoor'], 'interior', 13).lead!);
    expect(p(['reachShip', 'startShip'], 'hangar', 42).end).toBe('away');
    expect(p(['reachShip', 'startShip'], 'hangar', 41).end).toBe('caught');
    expect(p(['startShip'], 'interior', 500)).toMatchObject({ steps: [{ step: 'reachShip', result: 'notHere' }, { step: 'startShip', result: 'notHere' }], end: 'caught' });
    expect(p([], 'interior', 500).end).toBe('caught');
    expect(p(['vehicle'], 'open', 500).end).toBe('caught');
    expect(p(['vehicle'], 'street', 18).end).toBe('away');
    expect(p(['vehicle'], 'street', 17).end).toBe('caught');
    expect(p(['run', 'evasive'], 'open', null)).toMatchObject({ lead: null, evasive: true });
  });
});

describe('open ground', () => {
  const runner = (x: Partial<Runner> = {}): Runner => ({ forceSpeed: 40, endurance: 40, concealment: 0, slip: 50, ...x });
  const foe = (x: Partial<Pursuer> = {}): Pursuer => ({ forceSpeed: 85, endurance: 90, forceSense: 84, search: 84, ...x });
  const how = { evasive: true, conceal: false };

  it('a faster, tireless pursuer catches a slower runner even with a head start, whatever the route', () => {
    for (const lead of [5, 20, 60]) for (const evasive of [true, false]) expect(chase(runner(), foe(), lead, 'open', { evasive, conceal: false }).end, `${lead}`).toBe('caught');
  });
  it('an equal or slower pursuer can lose a runner who breaks line of sight on an evasive route', () => {
    const fast = runner({ forceSpeed: 85, endurance: 90 });
    const r = chase(fast, foe({ forceSpeed: 60, endurance: 60 }), 20, 'open', how);
    expect(r.end).toBe('clear');
    expect(chase(fast, foe(), 25, 'open', how).end).toBe('clear');
    let lost = 0;
    let rng = seedRng('lose');
    for (let i = 0; i < 400; i++) {
      const l = losePursuer(fast, foe({ search: 60 }), { evasive: true, concealed: false, cover: false, ran: r.ran }, rng);
      rng = l.rng;
      if (l.lost) lost++;
    }
    expect(lost).toBeGreaterThan(120); // a real chance
    expect(lost).toBeLessThan(380); // not a certainty
    let straight = 0;
    for (let i = 0; i < 400; i++) {
      const l = losePursuer(fast, foe({ search: 60 }), { evasive: false, concealed: false, cover: false, ran: r.ran }, rng);
      rng = l.rng;
      if (l.lost) straight++;
    }
    expect(straight).toBeLessThan(lost - 80);
  });
  it('without Force Speed a runner is caught on open ground; a vehicle in reach is the way out', () => {
    const plain = runner({ forceSpeed: 0, endurance: 60 });
    for (const lead of [5, 20, 60]) expect(chase(plain, foe(), lead, 'open', how).end).toBe('caught');
    expect(planEscape(['vehicle'], 'street', 20, { tier: 'top', saber: true }).end).toBe('away');
    expect(planEscape(['cover'], 'open', 20, { tier: 'top', saber: true }).end).toBe('hidden');
  });
  it('concealment: the senses lose them sooner, they cover less ground, and the search past that point is much harder', () => {
    expect(senseRange(84, 60)).toBeLessThan(senseRange(84, 0) * 0.6);
    expect(senseRange(84, 90)).toBeLessThan(senseRange(84, 30));
    expect(senseRange(0, 0)).toBe(0);
    const a = runner({ forceSpeed: 85, endurance: 90, concealment: 70 });
    const strong = foe({ forceSpeed: 70, endurance: 70, forceSense: 100 });
    const open = chase(a, strong, 30, 'open', how);
    const hid = chase(a, strong, 30, 'open', { evasive: true, conceal: true });
    expect([open.end, hid.end]).toEqual(['clear', 'clear']);
    expect(hid.gap).toBeLessThan(open.gap);
    expect(hid.ran).toBeLessThan(open.ran);
    const found = (concealed: boolean, ran: number): number => {
      let n = 0;
      let rng = seedRng('find');
      for (let i = 0; i < 500; i++) {
        const l = losePursuer(a, strong, { evasive: true, concealed, cover: false, ran }, rng);
        rng = l.rng;
        if (!l.lost) n++;
      }
      return n / 500;
    };
    expect(found(true, hid.ran)).toBeLessThan(found(false, open.ran) - 0.2);
    // A pursuer who outruns them follows any route; hidden, they can still get clear.
    expect(chase(a, foe({ forceSpeed: 120, endurance: 120 }), 30, 'open', how).end).toBe('caught');
    expect(chase(a, foe({ forceSpeed: 120, endurance: 120 }), 30, 'open', { evasive: true, conceal: true }).end).toBe('clear');
  });
  it('pace and stamina rise with Force Speed and Endurance; the trail is colder for one who hid', () => {
    expect(runPace({ forceSpeed: 80, endurance: 0 })).toBeGreaterThan(runPace({ forceSpeed: 20, endurance: 0 }));
    expect(runSustain({ forceSpeed: 50, endurance: 80 })).toBeGreaterThan(runSustain({ forceSpeed: 50, endurance: 20 }));
    expect(trailChance(84, true)).toBeLessThan(trailChance(84, false));
  });
  it('a pursuer with a service behind them searches better than a lone hunter (D-497)', () => {
    const t = (faction: string, role: string, over: { cutOff?: boolean; scattered?: boolean } = {}) => searchSupport({ faction, role, cutOff: false, scattered: false, ...over });
    expect([t('sithEmpire', 'sithLord'), t('republic', 'officer'), t('sithEmpire', 'soldier'), t('jediOrder', 'jediKnight'), t('jediOrder', 'jediKnight', { scattered: true }), t('mandalorians', 'soldier'), t('mandalorians', 'bountyHunter'), t('independent', 'other'), t('sithEmpire', 'sithLord', { cutOff: true })]).toEqual(['service', 'service', 'organisation', 'order', 'lone', 'organisation', 'lone', 'lone', 'lone']);
    expect(SEARCH_SUPPORT.service > SEARCH_SUPPORT.order && SEARCH_SUPPORT.order > SEARCH_SUPPORT.organisation && SEARCH_SUPPORT.organisation > SEARCH_SUPPORT.lone).toBe(true);
    // Malgus keeps his 8% a day.
    const s = set(game('mal'), MASTER, 'malgus');
    expect(npcSupport(s, FOE(s))).toBe('service');
    const daily = trailChance(npcPursuer(s, FOE(s)).search, false, npcSupport(s, FOE(s)));
    expect(daily).toBeGreaterThan(0.075);
    expect(daily).toBeLessThan(0.085);
    expect(trailChance(npcPursuer(s, FOE(s)).search, false, 'lone')).toBeCloseTo(daily / 2, 6);
    // Two Sith in hiding have no Order behind them.
    const bane = game('bane', 'interior', {}, { year: -990 });
    expect(npcSupport(patch(bane, FOE(bane), { factionId: 'sith', canonId: null }), FOE(bane))).toBe('lone');
  });
});

const begin = (s: GameState, source: 'ai' | 'engine' = 'ai') => applyEvents(REGISTRY, s, [{ type: 'holdBegun', holderRef: VEN(s), foeRef: FOE(s) }], { source });
const intent = (plan?: EscapeStep[], over: object = {}) => ({ actionType: 'other', targets: [], references: [], unknownNames: [], ...(plan ? { escapePlan: plan } : {}), ...over }) as never;

describe('an NPC holds while the player gets away', () => {
  it('the result is fixed when they engage, before any plan, and hidden until it is told', () => {
    const s = set(game('hidden'), MASTER, 'malgus');
    const r = begin(s);
    expect(r.rejected).toEqual([]);
    const held = r.state.combat.hold!;
    expect(held.exchanges).toBeGreaterThan(0);
    // Nothing said or shown gives it away: the notes, the state line, the choices; nobody is hurt yet.
    const shown = [...r.applied.flatMap((a) => a.notes), holdLine(r.state)!, JSON.stringify(holdChoices(r.state))].join(' ');
    for (const word of ['falls', 'killed', 'dies', 'dead', `${held.exchanges} exchange`]) expect(shown).not.toContain(word);
    expect([r.state.npcs.byId[VEN(s)]!.status, r.state.npcs.byId[VEN(s)]!.health]).toEqual(['active', null]);
    // Whatever the plan, the duel is the same; only the escape differs.
    const plans: EscapeStep[][] = [[], ['reachExit', 'sealDoor'], ['run', 'evasive']];
    const told = plans.map((p) => resolveTurn(REGISTRY, r.state, intent(p)).draft.hold!);
    expect(new Set(told.map((t) => JSON.stringify([t.exchanges, t.bought, t.end, t.holderFate, t.hits]))).size).toBe(1);
    expect(told[0]!.exchanges).toBe(held.exchanges);
    // The narrator cannot tell it, change it or start another.
    expect(applyEvents(REGISTRY, r.state, [{ type: 'holdTold', escaped: true, pursuit: null }], { source: 'ai' }).applied).toEqual([]);
    expect(begin(r.state).applied).toEqual([]);
  });

  it('the plan meets the time there was; the turn tells both, and the world takes the result', () => {
    const ends = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const s = set(game(`t${i}`), MASTER, 'malgus');
      const b = begin(s).state;
      const hold = b.combat.hold!;
      const bought = boughtSeconds(hold);
      const r = resolveTurn(REGISTRY, b, intent(['reachExit', 'sealDoor', 'wreckConsole']));
      const t = r.draft.hold!;
      expect(r.state.combat.hold).toBeNull();
      if (bought === null || bought >= 13) expect(t.escaped, `${i}`).toBe(true);
      if (bought !== null && bought < 8) {
        expect(t.escaped, `${i}`).toBe(false);
        expect(r.state.combat.pending?.opponentRefs).toEqual([FOE(s)]);
      }
      expect(r.state.npcs.byId[VEN(s)]!.status).toBe(t.holderFate === 'dead' ? 'deceased' : 'active');
      const block = resolvedBlock(r.draft);
      expect(block).toContain('HOLD (ground truth');
      if (t.felt) expect(block).toContain('feels Master Ven die');
      expect(t.felt).toBe(t.holderFate === 'dead');
      ends.add(`${t.escaped}`);
    }
    expect([...ends].sort()).toEqual(['false', 'true']);
  });

  it('a player without the Force feels nothing; doing nothing is being overtaken', () => {
    for (let i = 0; i < 20; i++) {
      const s = set(game(`n${i}`, 'interior', {}, { path: 'career' }), MASTER, 'malgus');
      const r = resolveTurn(REGISTRY, begin(s).state, intent());
      expect(r.draft.hold!.felt).toBe(false);
      if (r.draft.hold!.bought !== null) expect(r.draft.hold!.escaped).toBe(false);
    }
  });

  it('only people who are here and able to fight; a fight with the foe passes to the holder', () => {
    const s = set(game('v'), MASTER, 'malgus');
    const gone = patch(s, VEN(s), { lastSeenDay: s.clock.now.day - 3 });
    expect(begin(gone).rejected.length).toBe(1);
    expect(applyEvents(REGISTRY, s, [{ type: 'holdBegun', holderRef: FOE(s), foeRef: FOE(s) }], { source: 'ai' }).rejected.length).toBe(1);
    const f = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [FOE(s)], stakes: 'lethal' }], { source: 'engine' }).state;
    const r = begin(f);
    expect(r.rejected).toEqual([]);
    expect([r.state.combat.active, r.state.combat.last?.outcome]).toEqual([null, 'interrupted']);
    const p = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [FOE(s)], stakes: 'lethal', terrainTags: [] }], { source: 'ai' }).state;
    expect(begin(p).state.combat.pending).toBeNull();
    // Attacking the foe instead does not start a second fight: the hold is told first.
    const t = resolveTurn(REGISTRY, begin(s).state, intent(undefined, { actionType: 'fight', targets: [FOE(s)] }));
    expect(t.draft.hold).toBeDefined();
  });

  it('a pursuer behind the door comes through if the player stays, and loses them if not', () => {
    let through = 0;
    let trail = 0;
    for (let i = 0; i < 30; i++) {
      const s = set(game(`d${i}`), MASTER, 'malgus');
      const r = resolveTurn(REGISTRY, begin(s).state, intent(['sealDoor']));
      const p = r.state.combat.pursuits?.[0];
      if (!p) continue;
      expect(p.kind).toBe('barred');
      expect(pursuitLine(r.state)).toContain('cutting through a closed door');
      const wait = p.untilAbs! - toAbsSecond(r.state.clock.now) + 1;
      const stay = advanceTime(REGISTRY, r.state, { seconds: wait, reason: 'x', source: 'turnDraft', requested: wait, occupation: 'rest' });
      if (stay.state.combat.pending?.opponentRefs[0] === FOE(s)) through++;
      const left = applyEvents(REGISTRY, r.state, [{ type: 'locationIntroduced', name: 'Dorin', kind: 'planet', region: 'y', description: 'x', moveHere: true }], { source: 'ai' }).state;
      const gone = advanceTime(REGISTRY, left, { seconds: wait, reason: 'x', source: 'turnDraft', requested: wait, occupation: 'rest' });
      expect(gone.state.combat.pending).toBeNull();
      if (gone.state.combat.pursuits?.[0]?.kind === 'trail') trail++;
    }
    expect([through > 5, trail === through]).toEqual([true, true]);
  });

  it('a lost trail can be found again within days, and goes cold after', () => {
    let found = 0;
    for (let i = 0; i < 60; i++) {
      const s = set(game(`l${i}`, 'open'), MASTER, 'malgus');
      let t: GameState = { ...s, combat: { ...s.combat, pursuits: [{ foeId: FOE(s), kind: 'trail', untilAbs: null, withinId: null, day: s.clock.now.day, search: 84, concealed: false }] } };
      let notice = false;
      for (let d = 0; d < 9; d++) {
        const a = advanceTime(REGISTRY, t, { seconds: 86_400, reason: 'x', source: 'turnDraft', requested: 86_400, occupation: 'rest' });
        t = a.state;
        if (a.notices.some((n) => n.includes('found the player character\'s trail'))) notice = true;
      }
      expect(t.combat.pursuits).toEqual([]);
      if (notice) found++;
    }
    expect(found).toBeGreaterThan(5);
    expect(found).toBeLessThan(55);
  });

  it('a save keeps the hold and the pursuers', () => {
    const s = begin(set(game('save'), MASTER, 'malgus')).state;
    const kept = REGISTRY.find((f) => f.id === 'combat')!.stateSchema.parse(JSON.parse(JSON.stringify(s.combat))) as GameState['combat'];
    expect(kept.hold).toEqual(s.combat.hold);
    expect(resolveHoldTurn({ ...s, combat: kept }, kept.hold!, ['sealDoor']).exchanges).toBe(s.combat.hold!.exchanges);
  });
});

describe('the player holds', () => {
  it('the fight is fought as ever; the time it bought is told, and it counts only when it was enough there', () => {
    const seen = { enough: 0, short: 0 };
    for (let i = 0; i < 24; i++) {
      let s = set(game(`p${i}`, 'interior', MASTER), MASTER, 'malgus');
      s = { ...s, ranks: { ...s.ranks, rank: 'master' } };
      s = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [FOE(s)], stakes: 'lethal' }], { source: 'engine' }).state;
      let last = resolveTurn(REGISTRY, s, null, { beat: { action: 'resolve' } as never });
      for (let k = 0; k < 6 && last.state.combat.active; k++) last = resolveTurn(REGISTRY, last.state, null, { beat: { action: 'resolve' } as never });
      const l = last.state.combat.last!;
      expect(l.hold).toMatchObject({ npcId: FOE(s), need: 20, setting: 'interior' });
      expect(l.hold!.enough || l.hold!.seconds < 20).toBe(true);
      expect((l.heldOff ?? []).length > 0).toBe(l.hold!.enough);
      expect(resolvedBlock(last.draft)).toContain('Time bought:');
      seen[l.hold!.enough ? 'enough' : 'short']++;
    }
    expect([seen.enough > 3, seen.short > 3]).toEqual([true, true]);
  });
});

describe('how a duel reads (narration only)', () => {
  it('the pace follows the weaker blade, up to the apex, and only lightsabers have one', () => {
    for (let i = 1; i < DUEL_PACE.length; i++) expect(DUEL_PACE[i]!.from).toBeLessThan(DUEL_PACE[i - 1]!.from);
    const draft = (a: number, b: number, weapon = 'lightsaber') => ({ fighters: [{ id: 'pc', weapon: 'lightsaber' }, { id: 'x', weapon }], narrate: [{ kind: 'strike', effA: a, effB: b }] }) as never;
    expect(duelPace(draft(100, 104))).toContain('blur of light');
    expect(duelPace(draft(100, 50))).toContain('three or four');
    expect(duelPace(draft(100, 100, 'blaster'))).toBeNull();
  });
  it('the block is the engine\'s words only', () => {
    const s = set(game('w'), MASTER, 'malgus');
    const t = resolveTurn(REGISTRY, begin(s).state, intent(['sealDoor'])).draft.hold!;
    const text = describeHold(t).join('\n');
    expect(text).toContain('never make it longer'.replace('never', 'Never'));
    expect(text).toContain('close the door behind them');
    expect(CANON_BY_ID.has('lore:darth-malgus')).toBe(true);
  });
});
