// The economy (M8 checklist item 5; docs-v2/spec/economy.md section 10). The code owns every credit.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { HUTT_COINS, JEDI_MONEY, LIFESTYLE_DAY, MILITARY_PAY, type Zone } from '../../src/data/economy.config';
import { PRICE_BY_ID, PRICE_CATALOG, resolvePriceId } from '../../src/data/economyPrices';
import { RUNNING_COSTS, SHIP_PRICE_ANCHORS } from '../../src/data/shipPrices';
import { SHIP_SPECS } from '../../src/data/ships';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import {
  acceptanceFor,
  changerCut,
  exchange,
  fenceShare,
  haggleFactor,
  huttCoinBreakdown,
  huttCoinsToCredits,
  isHonest,
  listPrice,
  npcCarried,
  pay,
  sellPrice,
  shipPrice,
  usedShipPrice,
  runningCosts,
  type Market,
} from '../../src/engine/economy';
import { seedRng } from '../../src/engine/rng';
import { selectAcceptance, selectListPrice, selectMarket, selectNpcPurse, selectPlace, selectWageFactor } from '../../src/features/economy/selectors';
import { selectCanBeatNpc, selectPlanWins } from '../../src/features/world/selectors';
import { tryPlan } from '../../src/turn/planning';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { Registry } from '../../src/state/types';

// Only the economy's day hook runs in the time tests: the other hooks are not under test and are slow over months.
const ECON: Registry<GameState> = REGISTRY.map((f) => {
  if (f.id === 'economy') return f;
  const { onTimeAdvanced: _h, ...rest } = f;
  return rest;
});
const day = (year: number, month = 3, d = 1): number => absDayFromDate({ year, month, day: d });

type Start = { optionId: string; faction: 'republic' | 'sithEmpire' | 'jediOrder' | 'underworld' | 'mandalorians'; imperialBorn: boolean };
function fresh(o: { year?: number; path?: 'jedi' | 'outsider' | 'career' | 'sith'; archetype?: string; start?: Start; rank?: string; charisma?: number; month?: number } = {}): GameState {
  const d = day(o.year ?? -3661, o.month ?? 3);
  const path = o.path ?? 'career';
  return createInitialState<GameState>(ECON, {
    campaignId: 'econ',
    branchId: 'b',
    seed: 'econ',
    start: { day: d, second: 8 * 3600 },
    character: { name: 'Tal', birthDay: d - 30 * 368, path, archetype: o.archetype ?? (path === 'jedi' ? 'jediGuardian' : 'smuggler'), ...(path === 'jedi' ? { mainFormId: 'soresu', trainingStartAge: 4 } : {}), ...(o.start ? { start: o.start } : {}) } as never,
    ...(o.charisma !== undefined ? { startingXp: { charisma: xpForLevel(o.charisma) } } : {}),
    rank: o.rank ?? (path === 'jedi' ? 'knight' : 'career'),
  });
}
const ai = (s: GameState, events: object[]) => applyEvents(ECON, s, events, { source: 'ai' });
const at = (s: GameState, name: string, region: string, kind = 'planet'): GameState => ai(s, [{ type: 'locationIntroduced', name, kind, region, description: 'x', moveHere: true }]).state;
const withWallet = (s: GameState, w: Partial<GameState['economy']['wallet']>): GameState => ({ ...s, economy: { ...s.economy, wallet: { republic: 0, imperial: 0, hutt: 0, ...w } } });
const pass = (s: GameState, days: number): ReturnType<typeof advanceTime<GameState>> => advanceTime(ECON, s, { seconds: days * 86_400, reason: 't', source: 'turnDraft', jump: true });
const npc = (s: GameState, name: string, role: string, faction = 'civilian'): { s: GameState; id: string } => {
  const r = ai(s, [{ type: 'npcIntroduced', name, species: 'human', faction, role, ageApprox: 40, description: '' }]);
  return { s: r.state, id: Object.values(r.state.npcs.byId).find((n) => n.name === name)!.id };
};
const MID: Market = { zone: 'mid', events: {} };
const zoneMarket = (zone: Zone): Market => ({ zone, events: {} });

describe('prices: base and modifiers', () => {
  it('every catalog row has a positive base and a source; restricted rows exist', () => {
    for (const p of PRICE_CATALOG) {
      expect(p.base, p.id).toBeGreaterThan(0);
      expect(p.source.length, p.id).toBeGreaterThan(3);
    }
    expect(PRICE_CATALOG.filter((p) => p.legality === 'restricted').length).toBeGreaterThan(5);
  });
  it('location: cheap Core manufactured goods, dearer in the Outer Rim and Hutt space, dearer still on remote worlds', () => {
    const rifle = PRICE_BY_ID.get('rifle')!;
    const by = (['core', 'mid', 'outer', 'hutt', 'remote'] as const).map((z) => listPrice(rifle, zoneMarket(z)));
    for (let i = 1; i < by.length; i++) expect(by[i]!).toBeGreaterThan(by[i - 1]!);
    // Food and services move half as far.
    const meal = PRICE_BY_ID.get('meal')!;
    expect(listPrice(meal, zoneMarket('remote')) / listPrice(meal, MID)).toBeLessThan(by[4]! / by[1]!);
    // Read from the place: Coruscant (Core) against Tatooine (Outer Rim) and Nal Hutta (Hutt Space).
    const s = fresh({ year: -3650 });
    const price = (n: string, r: string) => selectListPrice(at(s, n, r), 'rifle')!;
    expect(price('Corellia', 'Core Worlds')).toBeLessThan(price('Tatooine', 'Outer Rim Territories'));
    expect(price('Tatooine', 'Outer Rim Territories')).toBeLessThan(price('Nal Hutta', 'Hutt Space'));
    expect(selectPlace(at(s, 'Tatooine', 'x')).zone).toBe('outer');
  });
  it('legality: restricted goods only on the black market, at x2 to x5', () => {
    const hold = PRICE_BY_ID.get('holdout')!;
    for (const z of ['core', 'mid', 'outer', 'hutt', 'remote'] as const) {
      const x = listPrice(hold, zoneMarket(z)) / listPrice({ ...hold, legality: 'legal' }, zoneMarket(z));
      expect(x, z).toBeGreaterThanOrEqual(1.99);
      expect(x, z).toBeLessThanOrEqual(5.01);
    }
    // A dealer will not take them: a sale goes to a fence at 25-40% of base.
    let s = withWallet(at(fresh(), 'Ord Mantell', 'Mid Rim'), { republic: 0 });
    s = ai(s, [{ type: 'trade', dir: 'sell', item: 'hold-out blaster' }]).state;
    const got = s.economy.wallet.republic;
    expect(got).toBeGreaterThanOrEqual(Math.round(hold.base * 0.25));
    expect(got).toBeLessThanOrEqual(Math.round(hold.base * 0.4));
    expect(s.economy.log.at(-1)!.reason).toMatch(/a fence/);
  });
  it('the Hydian blockade raises food on Coruscant while it stands, more the longer it lasts', () => {
    const early = at(fresh({ year: -3661, month: 2 }), 'Coruscant', 'Core Worlds');
    const late = at(fresh({ year: -3661, month: 11 }), 'Coruscant', 'Core Worlds');
    const after = at(fresh({ year: -3655 }), 'Coruscant', 'Core Worlds');
    const meal = (s: GameState) => selectListPrice(s, 'meal')!;
    expect(meal(early)).toBeGreaterThan(meal(after));
    expect(meal(late)).toBeGreaterThan(meal(early));
    // Not elsewhere, and not manufactured goods.
    expect(selectMarket(at(fresh({ year: -3661 }), 'Corellia', 'Core Worlds')).events.food ?? 1).toBe(1);
    expect(selectMarket(early).events.manufactured ?? 1).toBe(1);
  });
  it('the post-Treaty depression: dearer goods and lower wages in Republic space, fading over a decade', () => {
    const a = at(fresh({ year: -3652 }), 'Corellia', 'Core Worlds');
    const b = at(fresh({ year: -3646 }), 'Corellia', 'Core Worlds');
    const c = at(fresh({ year: -3640 }), 'Corellia', 'Core Worlds');
    const rifle = (s: GameState) => selectListPrice(s, 'rifle')!;
    expect(rifle(a)).toBeGreaterThan(rifle(b));
    expect(rifle(b)).toBeGreaterThan(rifle(c));
    expect(selectWageFactor(a)).toBeLessThan(selectWageFactor(b));
    expect(selectWageFactor(c)).toBe(1);
    // Not in Hutt space.
    expect(selectMarket(at(fresh({ year: -3652 }), 'Nal Hutta', 'Hutt Space')).events.manufactured ?? 1).toBe(1);
  });
  it('wartime shortages raise military goods, and only those', () => {
    const war = at(fresh({ year: -3660 }), 'Corellia', 'Core Worlds');
    const peace = at(fresh({ year: -3645 }), 'Corellia', 'Core Worlds');
    expect(selectMarket(war).events.military).toBeGreaterThan(1);
    expect(selectMarket(peace).events.military ?? 1).toBe(1);
    expect(selectListPrice(war, 'heavyRifle')!).toBeGreaterThan(selectListPrice(peace, 'heavyRifle')!);
  });
});

describe('haggling and selling', () => {
  it('a Charisma contest moves the price within +/-20%, smoothly, never past the bound', () => {
    for (let m = -200; m <= 200; m += 0.5) {
      expect(haggleFactor(m)).toBeGreaterThanOrEqual(0.8);
      expect(haggleFactor(m)).toBeLessThanOrEqual(1.2);
    }
    expect(haggleFactor(10)).toBeLessThan(haggleFactor(0));
    // Through the event, across seeds: inside list +/-20%.
    const base = withWallet(at(fresh({ charisma: 60 }), 'Ord Mantell', 'Mid Rim'), { republic: 100_000 });
    const list = selectListPrice(base, 'rifle')!;
    const paid = new Set<number>();
    for (let i = 0; i < 30; i++) {
      const s = { ...base, meta: { ...base.meta, rngState: seedRng(`h${i}`) } };
      const r = ai(s, [{ type: 'trade', dir: 'buy', item: 'blaster rifle', haggle: true }]);
      const cost = 100_000 - r.state.economy.wallet.republic;
      paid.add(cost);
      expect(cost).toBeGreaterThanOrEqual(Math.floor(list * 0.8));
      expect(cost).toBeLessThanOrEqual(Math.ceil(list * 1.2));
    }
    expect(paid.size).toBeGreaterThan(3);
  });
  it('a dealer pays about half of base; a fence 25-40%', () => {
    const pistol = PRICE_BY_ID.get('pistol')!;
    expect(sellPrice(pistol, 'mid', 'dealer', null)).toBe(Math.round(pistol.base * 0.5));
    for (const m of [-50, 0, 50]) {
      expect(fenceShare(m)).toBeGreaterThanOrEqual(0.25);
      expect(fenceShare(m)).toBeLessThanOrEqual(0.4);
    }
    expect(sellPrice(pistol, 'mid', 'fence', null)).toBeLessThan(sellPrice(pistol, 'mid', 'dealer', null));
  });
});

describe('currencies', () => {
  it("each credit is refused on the other side's core worlds", () => {
    const imp = withWallet(at(fresh({ year: -3650 }), 'Corellia', 'Core Worlds'), { imperial: 5000 });
    expect(selectAcceptance(imp)).toMatchObject({ republic: true, imperial: false });
    expect(ai(imp, [{ type: 'trade', dir: 'buy', item: 'medpac' }]).applied).toEqual([]);
    const rep = withWallet(at(fresh({ year: -3650 }), 'Dromund Kaas', 'Outer Rim Territories'), { republic: 5000 });
    expect(selectAcceptance(rep)).toMatchObject({ republic: false, imperial: true });
    expect(ai(rep, [{ type: 'trade', dir: 'buy', item: 'medpac' }]).applied).toEqual([]);
    // Border or neutral space takes both at face value.
    const border = withWallet(at(fresh({ year: -3650 }), 'Ord Mantell', 'Mid Rim'), { imperial: 5000 });
    expect(ai(border, [{ type: 'trade', dir: 'buy', item: 'medpac' }]).applied.filter((a) => a.event.type === 'trade').length).toBe(1);
  });
  it('a money changer works only off the core worlds and takes 10-20%', () => {
    const core = withWallet(at(fresh({ year: -3650 }), 'Corellia', 'Core Worlds'), { imperial: 1000 });
    expect(ai(core, [{ type: 'money', kind: 'exchange', to: 'republic' }]).applied).toEqual([]);
    const border = withWallet(at(fresh({ year: -3650 }), 'Ord Mantell', 'Mid Rim'), { imperial: 1000 });
    const w = ai(border, [{ type: 'money', kind: 'exchange', to: 'republic' }]).state.economy.wallet;
    expect(w.imperial).toBe(0);
    expect(w.republic).toBeGreaterThanOrEqual(800);
    expect(w.republic).toBeLessThanOrEqual(900);
    for (const m of [-80, 0, 80]) expect([changerCut(m) >= 0.1, changerCut(m) <= 0.2]).toEqual([true, true]);
    expect(exchange({ republic: 0, imperial: 1000, hutt: 0 }, 'republic', 0.15).wallet.republic).toBe(850);
  });
  it('Hutt coins convert at the WotC rates: peggat 40, trugut 10, wupiupi 0.625', () => {
    expect([huttCoinsToCredits({ peggat: 1 }), huttCoinsToCredits({ trugut: 1 }), huttCoinsToCredits({ wupiupi: 1 })]).toEqual([40, 10, 0.625]);
    expect(HUTT_COINS).toEqual({ peggat: 40, trugut: 10, wupiupi: 0.625 });
    expect(huttCoinBreakdown(64 + 16 + 3)).toEqual({ peggat: 1, trugut: 1, wupiupi: 3 });
    // On Tatooine Hutt coin pays first; credits pass at a markup.
    const a = acceptanceFor({ republicCore: false, imperialCore: false, huttCoin: true, prefer: 'republic' });
    expect(pay({ republic: 0, imperial: 0, hutt: 64 }, 40, a)).toEqual({ republic: 0, imperial: 0, hutt: 0 });
    expect(pay({ republic: 100, imperial: 0, hutt: 0 }, 40, a)!.republic).toBe(50);
    const tat = at(fresh({ year: -3650 }), 'Tatooine', 'Outer Rim Territories');
    expect(selectAcceptance(tat).hutt).toBe(true);
  });
});

describe('income follows the calendar', () => {
  it('military pay arrives on the first of each month, through a time jump', () => {
    const s = fresh({ year: -3661, month: 3, start: { optionId: 'republic-trooper', faction: 'republic', imperialBorn: false } });
    expect(s.economy.job).toMatchObject({ kind: 'military', grade: 'private' });
    expect(s.economy.lifestyle).toBe('provided');
    const before = s.economy.wallet.republic;
    const after = pass(s, 93).state;
    expect(after.economy.wallet.republic - before).toBe(3 * MILITARY_PAY.private);
  });
  it('a wage job pays monthly in its currency; an Imperial officer in Imperial credits', () => {
    const s = fresh({ year: -3661, start: { optionId: 'imperial-officer', faction: 'sithEmpire', imperialBorn: true } });
    const after = pass(s, 31).state;
    expect(after.economy.wallet.imperial - s.economy.wallet.imperial).toBe(MILITARY_PAY.lieutenant);
    expect(after.economy.wallet.republic).toBe(0);
  });
  it('one-off pay is set by the code from kind and size, inside its band', () => {
    const s = withWallet(at(fresh(), 'Ord Mantell', 'Mid Rim'), {});
    for (const [size, lo, hi] of [['small', 500, 5000], ['fair', 10_000, 100_000], ['large', 250_000, 2_000_000]] as const) {
      const got = ai(s, [{ type: 'money', kind: 'bounty', size }]).state.economy.wallet.republic;
      expect(got, size).toBeGreaterThanOrEqual(lo);
      expect(got, size).toBeLessThanOrEqual(hi);
    }
    const low = ai(s, [{ type: 'money', kind: 'job', size: 'fair', risk: 'low' }]).state.economy.wallet.republic;
    const high = ai(s, [{ type: 'money', kind: 'job', size: 'fair', risk: 'high' }]).state.economy.wallet.republic;
    expect(high).toBeGreaterThan(low * 3);
  });
});

describe('the Jedi and money', () => {
  const jedi = () => at(fresh({ path: 'jedi', year: -3655 }), 'Ord Mantell', 'Mid Rim');
  const reward = (s: GameState) => applyEvents(ECON, s, [{ type: 'money', kind: 'reward', size: 'small' }], { source: 'ai' });
  it('the Order keeps a Jedi: no money of their own, room and board provided, gear from the quartermaster', () => {
    const s = jedi();
    expect(s.economy).toMatchObject({ wallet: { republic: 0, imperial: 0, hutt: 0 }, lifestyle: 'provided', job: { kind: 'order' } });
    expect(ai(s, [{ type: 'trade', dir: 'issue', item: 'medpac' }]).applied.filter((a) => a.event.type === 'trade').length).toBe(1);
    expect(ai(s, [{ type: 'trade', dir: 'issue', item: 'thermal detonator' }]).applied).toEqual([]);
    // Mission funds go apart and are returned; a Padawan's are held by the Master.
    const f = ai(s, [{ type: 'money', kind: 'missionFunds', size: 'small' }]).state;
    expect(f.economy.orderFunds).toBeGreaterThan(0);
    expect(f.economy.wallet.republic).toBe(0);
    expect(ai(f, [{ type: 'money', kind: 'returnFunds' }]).state.economy.orderFunds).toBe(0);
    expect(ai(at(fresh({ path: 'jedi', rank: 'padawan', year: -3655 }), 'X', 'Mid Rim'), [{ type: 'money', kind: 'missionFunds' }]).applied).toEqual([]);
  });
  it('a reward kept unseen has no effect; seen by another Jedi it draws at most a reprimand; a pattern costs standing', () => {
    const unseen = reward(jedi());
    expect(unseen.state.flags.set).toEqual([]);
    expect(unseen.state.ranks.reputationPenalty ?? 0).toBe(0);
    expect(unseen.state.economy.rewards).toEqual([expect.objectContaining({ known: false })]);
    expect(unseen.applied[0]!.notes.join(' ')).toMatch(/unseen: no consequence/);
    // Another Jedi present sees it.
    const k = npc(jedi(), 'Master Orgus', 'jediMaster', 'jediOrder');
    let s = ai(k.s, [{ type: 'sceneUpdated', moodTags: [], presentNpcRefs: [k.id] }]).state;
    const seen = reward(s);
    expect(seen.state.economy.rewards.at(-1)!.known).toBe(true);
    expect(seen.applied.flatMap((a) => a.notes).join(' ')).toMatch(/Master Orgus saw it.*reprimand/);
    expect(seen.state.ranks.reputationPenalty ?? 0).toBe(0);
    // Repeated: a reputation among the Jedi (renown is not built: a flag) and standing lost.
    s = seen.state;
    for (let i = 1; i < JEDI_MONEY.patternCount; i++) s = reward(s).state;
    expect(s.flags.set).toContain('jediRewardReputation');
    expect(s.ranks.reputationPenalty).toBe(JEDI_MONEY.patternStanding);
  });
  it('the Order finding out makes an unseen reward count', () => {
    let s = jedi();
    for (let i = 0; i < JEDI_MONEY.patternCount; i++) s = reward(s).state;
    expect(s.flags.set).not.toContain('jediRewardReputation');
    s = ai(s, [{ type: 'money', kind: 'orderLearns' }]).state;
    expect(s.flags.set).toContain('jediRewardReputation');
  });
  it('amassing wealth and possessions is attachment: serious standing consequences', () => {
    let s = withWallet(jedi(), { republic: JEDI_MONEY.wealth - 300 });
    expect(s.flags.set).not.toContain('jediWealth');
    s = ai(s, [{ type: 'trade', dir: 'buy', item: 'fine clothes' }]).state;
    s = ai(s, [{ type: 'money', kind: 'reward', size: 'fair' }]).state;
    expect(s.flags.set).toContain('jediWealth');
    expect(s.ranks.reputationPenalty).toBeGreaterThanOrEqual(JEDI_MONEY.wealthStanding);
  });
  it('stealing or extortion is a dark-side choice, recorded for the alignment system', () => {
    const t = npc(jedi(), 'Gorsk', 'merchant');
    const s = ai(t.s, [{ type: 'money', kind: 'steal', npcRef: t.id }]).state;
    expect(s.economy.darkChoices).toEqual([expect.objectContaining({ kind: 'theft' })]);
  });
});

describe('living costs', () => {
  it('a lifestyle is charged each day; the Temple and barracks are free', () => {
    let s = withWallet(at(fresh({ start: { optionId: 'underworld-smuggler', faction: 'underworld', imperialBorn: false } }), 'Ord Mantell', 'Mid Rim'), { republic: 1000 });
    expect(s.economy.lifestyle).toBe('modest');
    s = pass(s, 10).state;
    expect(s.economy.wallet.republic).toBe(1000 - 10 * LIFESTYLE_DAY.modest);
    const temple = pass(at(fresh({ path: 'jedi' }), 'Ord Mantell', 'Mid Rim'), 10).state;
    expect(temple.economy.wallet.republic).toBe(0);
  });
  it('money running short steps the living down, and nothing at all is destitution', () => {
    let s = withWallet(at(fresh({ start: { optionId: 'underworld-smuggler', faction: 'underworld', imperialBorn: false } }), 'Ord Mantell', 'Mid Rim'), { republic: 90 });
    s = pass(s, 2).state;
    expect(s.economy.lifestyle).toBe('poor');
    s = pass(s, 10).state;
    expect(s.economy.destituteSince).not.toBeNull();
  });
});

describe('debt', () => {
  it('a missed payment escalates: a warning, then collectors, then a bounty on the debtor', () => {
    let s = withWallet(at(fresh({ month: 3 }), 'Nar Shaddaa', 'Hutt Space'), {});
    s = { ...s, economy: { ...s.economy, lifestyle: 'provided' } };
    s = ai(s, [{ type: 'money', kind: 'loan', lender: 'hutt', size: 'small' }]).state;
    expect(s.economy.loans).toHaveLength(1);
    s = withWallet(s, {});
    const stages: string[] = [];
    for (let m = 0; m < 3; m++) {
      s = pass(s, 31).state;
      stages.push(s.economy.loans[0]!.stage);
    }
    expect(stages).toEqual(['warning', 'collectors', 'bounty']);
    expect(s.flags.set).toContain('debtBounty:hutt');
    expect(s.economy.loans[0]!.balance).toBeGreaterThan(1000);
  });
  it('a jump stops when collectors come', () => {
    let s = withWallet(at(fresh({ month: 3 }), 'Nar Shaddaa', 'Hutt Space'), {});
    s = { ...s, economy: { ...s.economy, lifestyle: 'provided' } };
    s = withWallet(ai(s, [{ type: 'money', kind: 'loan', lender: 'exchange', size: 'large' }]).state, {});
    const r = pass(s, 200);
    expect(r.interrupted ?? '').toMatch(/collectors/);
  });
  it('payments made on time clear the debt; a bank lends only against income', () => {
    let s = withWallet(at(fresh({ month: 3 }), 'Ord Mantell', 'Mid Rim'), { republic: 5000 });
    s = { ...s, economy: { ...s.economy, lifestyle: 'provided' } };
    expect(ai(s, [{ type: 'money', kind: 'loan', lender: 'bank', size: 'small' }]).applied).toEqual([]);
    const paid = pass(ai(s, [{ type: 'money', kind: 'loan', lender: 'hutt', size: 'small' }]).state, 31 * 7).state;
    expect(paid.economy.loans).toEqual([]);
    const trooper = fresh({ start: { optionId: 'republic-pilot', faction: 'republic', imperialBorn: false } });
    expect(ai(trooper, [{ type: 'money', kind: 'loan', lender: 'bank', size: 'fair' }]).applied.length).toBe(1);
  });
});

describe('bribes and NPC wealth', () => {
  it('an honest official refuses any amount; a crook can be bought', () => {
    let s = withWallet(at(fresh(), 'Ord Mantell', 'Mid Rim'), { republic: 100_000 });
    let honest: string | null = null;
    for (let i = 0; i < 30 && !honest; i++) {
      const r = npc(s, `Official ${i}`, 'official');
      s = r.s;
      if (isHonest(r.id, 'official')) honest = r.id;
    }
    expect(honest).not.toBeNull();
    const r = ai(s, [{ type: 'money', kind: 'bribe', npcRef: honest, size: 'lavish' }]);
    expect(r.state.economy.wallet.republic).toBe(100_000);
    expect(r.applied[0]!.notes.join(' ')).toMatch(/refuses the bribe/);
    // A criminal is never honest; over seeds some take it, judged against their monthly pay.
    const c = npc(s, 'Vosk', 'criminal');
    const taken = Array.from({ length: 20 }, (_, i) => ai({ ...c.s, meta: { ...c.s.meta, rngState: seedRng(`b${i}`) } }, [{ type: 'money', kind: 'bribe', npcRef: c.id, size: 'large' }]).state.economy.wallet.republic);
    expect(taken.some((w) => w === 100_000 - 1000)).toBe(true);
  });
  it('generated NPCs carry credits by role and archetype; robbery takes what they carry, once', () => {
    const avg = (role: string, arch: string | null) => Array.from({ length: 200 }, (_, i) => npcCarried(`npc:${i}`, role, arch)).reduce((a, b) => a + b, 0) / 200;
    expect(avg('criminal', null)).toBeGreaterThan(avg('civilian', null));
    expect(avg('criminal', 'crimeLord')).toBeGreaterThan(avg('criminal', null) * 5);
    expect(avg('jediKnight', 'jediGuardian')).toBeLessThanOrEqual(50);
    const t = npc(at(fresh(), 'Ord Mantell', 'Mid Rim'), 'Rask', 'smuggler', 'underworld');
    const purse = selectNpcPurse(t.s, t.id);
    expect(purse).toBeGreaterThan(0);
    const robbed = ai(t.s, [{ type: 'money', kind: 'steal', npcRef: t.id }]).state;
    expect(robbed.economy.wallet.republic - t.s.economy.wallet.republic).toBe(purse);
    expect(selectNpcPurse(robbed, t.id)).toBe(0);
  });
});

describe('the narrator decides no amount', () => {
  it('an amount the narrator invents is ignored: the catalog price is charged', () => {
    const s = withWallet(at(fresh(), 'Ord Mantell', 'Mid Rim'), { republic: 10_000 });
    const list = selectListPrice(s, 'pistol')!;
    const r = ai(s, [{ type: 'trade', dir: 'buy', item: 'a blaster pistol', credits: 1, price: 1, amount: 1 }]);
    expect(r.state.economy.wallet.republic).toBe(10_000 - list);
    const paid = ai(s, [{ type: 'money', kind: 'bounty', size: 'small', credits: 9_999_999 }]).state.economy.wallet.republic;
    expect(paid).toBeLessThan(10_000 + 5001);
    // No AI event sets the wallet, the job or a debt directly.
    for (const e of [{ type: 'creditsCharged', credits: 5, reason: 'x' }, { type: 'militaryServiceSet', grade: 'general' }]) expect(ai(s, [e]).applied, e.type).toEqual([]);
  });
  it('plain words map to a catalog row; nothing fits, nothing is sold', () => {
    expect(['a heavy blaster pistol', 'blaster', 'bowl of nelab stew', 'two drinks', 'thermal detonator', 'forged papers'].map(resolvePriceId)).toEqual(['heavyPistol', 'pistol', 'meal', 'drink', 'thermalDetonator', 'forgedPapers']);
    expect(resolvePriceId('a hyperspace widget')).toBeNull();
    const s = withWallet(at(fresh(), 'Ord Mantell', 'Mid Rim'), { republic: 100 });
    expect(ai(s, [{ type: 'trade', dir: 'buy', item: 'a hyperspace widget' }]).applied).toEqual([]);
  });
});

describe('ships and running costs (for item 13)', () => {
  it('recorded prices stand; the rest follow a smooth curve on length within their group', () => {
    for (const [id, a] of Object.entries(SHIP_PRICE_ANCHORS)) expect(shipPrice(SHIP_SPECS.find((x) => x.id === id)!)).toEqual({ price: a.price, recorded: true });
    const caps = SHIP_SPECS.filter((x) => !['fighter', 'freighter'].includes(x.kind) && !SHIP_PRICE_ANCHORS[x.id] && x.len).sort((a, b) => a.len! - b.len!);
    for (let i = 1; i < caps.length; i++) expect(shipPrice(caps[i]!).price, caps[i]!.id).toBeGreaterThanOrEqual(shipPrice(caps[i - 1]!).price);
    for (const sp of SHIP_SPECS) expect(shipPrice(sp).price, sp.id).toBeGreaterThan(0);
    const harrower = SHIP_SPECS.find((x) => x.id === 'harrower')!;
    expect(usedShipPrice(harrower)).toBe(Math.round(shipPrice(harrower).price / 2));
    expect(runningCosts(SHIP_SPECS.find((x) => x.id === 'dynamic')!).dockingPerDay).toBe(RUNNING_COSTS.freighter.dockingPerDay);
    expect(RUNNING_COSTS.freighter.dockingPerDay).toBe(30);
  });
});

describe('what others owe through the economy', () => {
  it("a blockade run's passage comes out of the wallet; what it cannot cover is owed", () => {
    const s0 = createInitialState<GameState>(REGISTRY, { campaignId: 'c', branchId: 'b', seed: 's', start: { day: day(-3661), second: 0 }, character: { name: 'T', birthDay: day(-3690), path: 'career', archetype: 'smuggler' }, rank: 'career' });
    const run = { type: 'blockadeRunRecorded', blockadeId: 'hydian-way-3661', approach: 'ride', direction: 'in', to: 'Eriadu', result: 'through', fame: 0, witnessed: false, credits: 2000, turnsInto: [], penalty: 0, hours: 1, onFoot: false };
    const rich = applyEvents(REGISTRY, withWallet(s0, { republic: 5000 }), [run], { source: 'engine' }).state;
    expect(rich.economy.wallet.republic).toBe(3000);
    const poor = applyEvents(REGISTRY, withWallet(s0, { republic: 500 }), [run], { source: 'engine' }).state;
    expect(poor.economy.wallet.republic).toBe(0);
    expect(poor.economy.loans).toEqual([expect.objectContaining({ lender: 'hutt', balance: 1500 })]);
  });
  it('an old save without the economy loads with the start money and nothing owed', () => {
    const s = fresh({ start: { optionId: 'underworld-smuggler', faction: 'underworld', imperialBorn: false } });
    const env = makeEnvelope(ECON, s, 'x') as unknown as { featureVersions: Record<string, number>; state: Record<string, unknown> };
    delete env.featureVersions['economy'];
    delete env.state['economy'];
    const loaded = loadEnvelope(ECON, JSON.parse(JSON.stringify(env)));
    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.state.economy).toMatchObject({ wallet: { republic: 2000 }, loans: [] });
  });
});

describe('lore rulings of 25 Nov 2026 applied with the economy', () => {
  const game = (): GameState => {
    const d = day(-3650);
    let s = createInitialState<GameState>(REGISTRY, {
      campaignId: 'r3',
      branchId: 'b',
      seed: 'r3',
      start: { day: d, second: 9 * 3600 },
      character: { name: 'Kael', birthDay: d - 50 * 368, path: 'career', archetype: 'bountyHunter', trainingStartAge: 14 } as never,
      startingXp: Object.fromEntries(['blaster', 'stealth', 'tracking', 'tactics', 'endurance', 'agility'].map((k) => [k, xpForLevel(95)])),
      rank: 'career',
    });
    s = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', name: 'Old Quarry', kind: 'building', region: 'Hutta', description: 'x', moveHere: true }], { source: 'ai' }).state;
    for (const [id, role] of [['lore:darth-baras', 'sithLord'], ['lore:darth-malgus', 'sithLord']] as const) {
      const c = CANON_BY_ID.get(id)!;
      s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: c.name, species: 'human', faction: c.faction, role, ageApprox: 45, description: '' }], { source: 'ai' }).state;
      const nid = Object.values(s.npcs.byId).find((n) => n.name === c.name)!.id;
      s = applyEvents(REGISTRY, s, [{ type: 'npcCanonLinked', npcRef: nid, canonId: id }], { source: 'engine' }).state;
    }
    return s;
  };
  const idOf = (s: GameState, name: string) => Object.values(s.npcs.byId).find((n) => n.name === name)!.id;
  // One line a batch: two of the same type and target in one batch are merged.
  const plan = (s: GameState, id: string) => ['ambush', 'trap'].reduce((x, kind) => applyEvents(REGISTRY, x, [{ type: 'planTried', npcRef: id, kind, success: true, total: 20 }], { source: 'engine' }).state, s);
  it('ruling 3: with a plan the best hunters beat a Master-level foe, never a top duelist', () => {
    const s = game();
    const baras = idOf(s, CANON_BY_ID.get('lore:darth-baras')!.name);
    const malgus = idOf(s, CANON_BY_ID.get('lore:darth-malgus')!.name);
    expect([selectCanBeatNpc(s, baras), selectPlanWins(s, baras)]).toEqual([false, false]);
    const ready = plan(plan(s, baras), malgus);
    expect([selectCanBeatNpc(ready, baras), selectPlanWins(ready, baras)]).toEqual([true, true]);
    expect([selectCanBeatNpc(ready, malgus), selectPlanWins(ready, malgus)]).toEqual([false, false]);
    // The planning turn takes a plan against a Master-level foe now (it said "no plan is needed" before).
    const t = tryPlan(s, { actionType: 'other', targets: [], references: [], unknownNames: [], plan: { kind: 'trap', foeRef: baras } } as never);
    expect(t && 'card' in t).toBe(true);
  });
  it('Vrath Xizor is a soldier (a mercenary and ex-Imperial sniper); Karrid\'s sheet is ruled, not for review', () => {
    expect(CANON_BY_ID.get('lore:vrath-xizor')!.archetype).toBe('sniper');
    const k = CANON_BY_ID.get('lore:darth-karrid')!;
    expect(JSON.stringify(k)).not.toMatch(/for review/);
  });
});
