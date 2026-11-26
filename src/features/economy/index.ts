// Economy feature (M8 checklist item 5; docs-v2/spec/economy.md). The code owns every credit (Golden Rule 1): the narrator
// reports what happened (bought X, was paid, paid a bribe, took a loan) as schema-checked events with no amounts; the code
// looks up the price, applies the modifiers, rolls the haggle or the bribe, and changes the wallet. Any amount the narrator
// writes is ignored (the schemas have no amount field, and an extra field is stripped). Pay, living costs and debt follow
// the calendar in the day hook, so a time jump pays out and charges too.
import { z } from 'zod';
import {
  BANK_INCOME_MONTHS,
  BRIBE_CHECK,
  BRIBE_SIZES,
  CURRENCIES,
  CURRENCY_NAMES,
  ECONOMY_LOG_MAX,
  FINE_SIZES,
  JEDI_MONEY,
  LENDERS,
  LIFESTYLES,
  LIFESTYLE_DAY,
  LOAN_SIZES,
  LOAN_TERMS,
  MERCHANT_LEVEL,
  MILITARY_GRADES,
  MILITARY_KIT,
  MILITARY_PAY,
  PATH_MONEY,
  PAY_KINDS,
  RISK_X,
  START_MONEY,
  WAGES,
  WAGE_TIERS,
  gradeBand,
  type BribeSize,
  type Currency,
  type Lender,
  type Lifestyle,
  type PayKind,
  type Risk,
  type StartMoney,
} from '../../data/economy.config';
import { PRICE_BY_ID, resolvePriceId } from '../../data/economyPrices';
import { CREW, SHIP_FINANCE } from '../../data/shipLife.config';
import { SHIP_SPECS } from '../../data/ships';
import { SHIP_CLASSES, shipClass } from '../../engine/ships';
import { matchShipClass } from '../../engine/shipLife';
import { selectShips } from '../ships/selectors';
import { addCalendarMonths, dateFromAbsDay, SECONDS_PER_DAY } from '../../engine/calendar';
import {
  bribeAmount,
  bribeModifier,
  buyPrice,
  changerCut,
  emptyWallet,
  exchange,
  isHonest,
  listPrice,
  loanDue,
  monthlyDue,
  pay,
  payFor,
  receive,
  sellPrice,
  shipPrice,
  usedShipPrice,
  type Acceptance,
  type Loan,
  type Wallet,
} from '../../engine/economy';
import { modelForPriceRow, modelRefusal, priceRowOf } from '../../engine/droids';
import { efficiency } from '../../engine/fatigue';
import { basicRoll, checkRating, type LevelInputs } from '../../engine/rolls';
import { nextFloat, type RngState } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import { traitStartMoney } from '../traits/selectors';
import type { ApplyCtx, FeatureModule, GameEvent, HandleResult, InitCtx } from '../../state/types';
import { selectPath } from '../character/selectors';
import { selectDroidForSale } from '../droids/selectors';
import { selectHasFlag } from '../flags/selectors';
import { selectFatigue, selectIsSpent, selectLastingPenalty, selectWoundPenalty } from '../health/selectors';
import { selectNpcLevel } from '../npcs/selectors';
import { selectPerformance, selectRust } from '../progression/selectors';
import { selectRank } from '../ranks/selectors';
import { economySliceSchema, type EconomySlice, type Job } from './economy';
import {
  selectAcceptance,
  selectEconomyLines,
  selectHomeCurrency,
  selectIsJedi,
  selectJediWealth,
  selectJediWitness,
  selectKnownRewards,
  selectLivingCost,
  selectLocalCurrency,
  selectMarket,
  selectMonthlyIncome,
  selectNpcPurse,
  selectPlace,
  selectWageFactor,
  selectWallet,
} from './selectors';

// ---------------------------------------------------------------- setup

function startMoney(ctx: InitCtx): StartMoney {
  return START_MONEY[ctx.character.start?.optionId ?? ''] ?? PATH_MONEY[ctx.character.path ?? 'jedi'] ?? PATH_MONEY['jedi']!;
}

function jobFrom(m: StartMoney): Job {
  if (m.job.kind === 'military') return { kind: 'military', grade: m.job.grade, currency: m.currency };
  if (m.job.kind === 'wage') return { kind: 'wage', tier: m.job.tier, currency: m.currency };
  return m.job.kind === 'order' ? { kind: 'order' } : { kind: 'none' };
}

export function initialEconomy(ctx: InitCtx): EconomySlice {
  const m = startMoney(ctx);
  // Starting traits (M8 item 16; spec/traits.md section 3): a noble's purse, the underlevels' or a refugee's thin one, an old
  // debt's money with its creditor (a Hutt loan on the economy's debt rules for what the debt added).
  const t = ctx.traits?.choice;
  const ids = t ? [t.origin, t.temperament, t.scarOrTie, ...(t.fourth ? [t.fourth] : [])] : [];
  const credits = Math.round(m.credits * traitStartMoney(ids));
  const debt = ids.includes('oldDebt') ? Math.max(0, credits - Math.round(m.credits * traitStartMoney(ids.filter((i) => i !== 'oldDebt')))) : 0;
  const day = ctx.start.day;
  return {
    wallet: receive(emptyWallet(), credits, m.currency),
    orderFunds: 0,
    lifestyle: m.lifestyle,
    job: jobFrom(m),
    loans: debt > 0 ? [{ id: 'loan-1', lender: 'hutt', principal: debt, balance: debt, currency: m.currency, startDay: day, nextDueDay: addCalendarMonths(day, 1), missed: 0, stage: 'current' }] : [],
    nextLoan: debt > 0 ? 2 : 1,
    rewards: [],
    possessions: 0,
    looted: {},
    darkChoices: [],
    destituteSince: null,
    log: [],
  };
}

/** A save made before the economy: the start's money as of now, nothing owed. */
function emptyEconomy(raw: Record<string, unknown>): EconomySlice {
  const c = (raw['character'] ?? {}) as { path?: InitCtx['character']['path']; start?: InitCtx['character']['start']; name?: string; birthDay?: number };
  return initialEconomy({ campaignId: '', branchId: '', seed: '', start: { day: 0, second: 0 }, character: { name: c.name ?? '', birthDay: c.birthDay ?? 0, ...(c.path ? { path: c.path } : {}), ...(c.start ? { start: c.start } : {}) } });
}

// ---------------------------------------------------------------- helpers

const today = (ctx: ApplyCtx<GameState>): number => ctx.state.clock.now.day;
const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');

function logged(slice: EconomySlice, day: number, credits: number, currency: Currency, reason: string): EconomySlice['log'] {
  return [...slice.log, { day, credits: Math.round(credits), currency, reason: reason.slice(0, 120), toldTurn: null }].slice(-ECONOMY_LOG_MAX);
}

function levelOf(s: GameState, skill: string): LevelInputs {
  return {
    level: selectPerformance(s, skill),
    woundPenalty: 1 - (1 - selectWoundPenalty(s, skill)) * (1 - selectLastingPenalty(s, skill)),
    rust: selectRust(s, skill),
    vitalitySpent: selectIsSpent(s),
    fatigueEfficiency: efficiency(selectFatigue(s).p),
  };
}

/** The Charisma contest: the character's roll less the other side's (an NPC's level, or a generic merchant's). */
function charismaContest(s: GameState, rng: RngState, npcId: string | null): { margin: number; rng: RngState; note: string } {
  const own = levelOf(s, 'charisma');
  const theirs = npcId && s.npcs.byId[npcId] ? selectNpcLevel(s, npcId, 'charisma') : MERCHANT_LEVEL;
  const effOwn = own.level * (1 - own.woundPenalty) * (1 - own.rust) * (own.vitalitySpent ? 0.9 : 1) * (1 - 0.25 * (1 - own.fatigueEfficiency));
  const [a, r1] = basicRoll(rng, effOwn, []);
  const [b, r2] = basicRoll(r1, theirs, []);
  const margin = a.total - b.total;
  return { margin, rng: r2, note: `haggle (Charisma): ${a.total.toFixed(1)} vs ${b.total.toFixed(1)}, margin ${margin.toFixed(1)}` };
}

/** The currency a payer pays in: their side's credit, Hutt coin from the underworld where it rules, else the local one. */
function payerCurrency(s: GameState, npcId: string | null): Currency {
  const n = npcId ? s.npcs.byId[npcId] : undefined;
  const local = selectLocalCurrency(s);
  if (!n) return local;
  if (n.factionId === 'sithEmpire' || n.factionId === 'sith') return 'imperial';
  if (n.factionId === 'republic' || n.factionId === 'jediOrder') return 'republic';
  return local;
}

/** Debts are settled by transfer: any currency counts at face value, the loan's own first. */
const TRANSFER: Acceptance = { republic: true, imperial: true, hutt: true, creditMarkup: 1, prefer: 'republic', changer: false };

/** A Jedi's consequences after a reward is known or wealth grows (Jared): reprimand, then a reputation, then attachment. */
function jediConsequences(s: GameState, slice: EconomySlice, notes: string[]): GameEvent[] {
  if (selectPath(s) !== 'jedi') return [];
  const emit: GameEvent[] = [];
  const known = slice.rewards.filter((r) => r.known && s.clock.now.day - r.day <= JEDI_MONEY.patternDays).length;
  const was = selectKnownRewards(s);
  if (known > was) {
    if (known >= JEDI_MONEY.patternCount && !selectHasFlag(s, 'jediRewardReputation')) {
      emit.push({ type: 'flagSet', flag: 'jediRewardReputation' }, { type: 'orderStandingLost', cause: 'a reputation among the Jedi for keeping rewards', points: JEDI_MONEY.patternStanding });
      notes.push(`consequence to narrate: keeping rewards has become a pattern other Jedi talk about (a reputation; Order standing -${JEDI_MONEY.patternStanding})`);
    } else notes.push('consequence to narrate: at most a reprimand from a Jedi who knows of the reward');
  }
  const wealth = walletWorth(slice.wallet) + slice.possessions;
  if (wealth >= JEDI_MONEY.wealth && !selectHasFlag(s, 'jediWealth')) {
    emit.push({ type: 'flagSet', flag: 'jediWealth' }, { type: 'orderStandingLost', cause: 'amassing wealth and possessions (attachment)', points: JEDI_MONEY.wealthStanding });
    notes.push(`consequence to narrate: the Order sees attachment in the wealth and possessions gathered (${fmt(wealth)} cr): serious standing consequences (Order standing -${JEDI_MONEY.wealthStanding})`);
  }
  return emit;
}
const walletWorth = (w: Wallet): number => w.republic + w.imperial + w.hutt * 0.625;
const specOf = (classId: string) => SHIP_SPECS.find((x) => x.id === classId)!;
const newShipPrice = (classId: string): number => shipPrice(specOf(classId)).price;

// ---------------------------------------------------------------- handlers

type R = HandleResult<EconomySlice>;

/**
 * A ship bought, sold or fenced (m8-ship-life, D-519): the item names a class ("a used Dynamic-class freighter", "an Aurek on
 * credit"). Priced from the ship price curve (shipPrices, economy.md 2c) at the local market, military classes only on the black
 * market, haggled as any trade; financed: a deposit from the wallet and the rest a loan (a bank's if it would lend, else a
 * Hutt's). The ships feature records the ship (shipAcquired, shipSold). Null when the words name no ship.
 */
function tradeShip(slice: EconomySlice, e: GameEvent, ctx: ApplyCtx<GameState>): R | null {
  const s = ctx.state;
  const words = String(e['item']);
  const year = dateFromAbsDay(today(ctx)).year;
  const m = matchShipClass(words, year, SHIP_CLASSES, (c) => newShipPrice(c.id));
  if (!m) return null;
  if ('reject' in m) return { reject: m.reject };
  const cls = shipClass(m.classId);
  const dir = String(e['dir']);
  const day = today(ctx);
  if (dir === 'issue') return { slice, emit: [{ type: 'shipAct', what: `issued ${words}` }] };
  const military = cls.kind !== 'freighter' && cls.role !== 'freighter';
  const used = /\b(used|second-?hand|old)\b/i.test(words);
  const npcId = typeof e['npcRef'] === 'string' ? (e['npcRef'] as string) : null;
  let rng = s.meta.rngState;
  const notes: string[] = [];
  let margin: number | null = null;
  if (e['haggle'] === true) {
    const c = charismaContest(s, rng, npcId);
    rng = c.rng;
    margin = c.margin;
    notes.push(c.note);
  }
  if (dir === 'sell') {
    const ship = selectShips(s).filter((x) => x.classId === m.classId && !x.impounded).sort((a, b) => Number(b.id === s.ships.activeId) - Number(a.id === s.ships.activeId))[0];
    if (!ship) return { reject: `no ${cls.name} owned to sell` };
    if (ship.hold === 'issued') return { reject: `${ship.name} belongs to ${ship.issuer ?? 'its issuer'}: an issued ship is not the character's to sell` };
    const fence = ship.hold === 'stolen' || e['stolen'] === true || ship.transponder !== 'real';
    const total = sellPrice({ base: usedShipPrice(specOf(m.classId)), kind: military ? 'military' : 'manufactured' }, selectMarket(s).zone, fence ? 'fence' : 'dealer', margin);
    const cur = selectLocalCurrency(s);
    notes.push(`sold ${ship.name} (${cls.name}) to ${fence ? 'a fence' : 'a dealer'} for ${fmt(total)} cr`);
    return { slice: { ...slice, wallet: receive(slice.wallet, total, cur), log: logged(slice, day, total, cur, `sold ${ship.name} to ${fence ? 'a fence' : 'a dealer'}`) }, rng, notes, emit: [{ type: 'shipSold', shipId: ship.id }] };
  }
  const base = used ? usedShipPrice(specOf(m.classId)) : newShipPrice(m.classId);
  const total = buyPrice(listPrice({ base, kind: military ? 'military' : 'manufactured', legality: military ? 'restricted' : 'legal' }, selectMarket(s)), margin);
  const a = selectAcceptance(s);
  const financed = /\b(on credit|financ\w*|on finance|on a loan|on loan)\b/i.test(words);
  let next: EconomySlice;
  if (financed) {
    const deposit = Math.round(total * SHIP_FINANCE.deposit);
    const wallet = pay(slice.wallet, deposit, a);
    if (!wallet) return { reject: `cannot pay the deposit on ${cls.name}: ${fmt(deposit)} cr (a fifth of ${fmt(total)} cr)` };
    const principal = total - deposit;
    const lender: Lender = principal <= selectMonthlyIncome(s) * BANK_INCOME_MONTHS ? 'bank' : 'hutt';
    const loan: Loan = { id: `loan-${slice.nextLoan}`, lender, principal, balance: principal, currency: a.prefer, startDay: day, nextDueDay: addCalendarMonths(day, 1), missed: 0, stage: 'current' };
    next = { ...slice, wallet, loans: [...slice.loans, loan], nextLoan: slice.nextLoan + 1, log: logged(slice, day, -deposit, a.prefer, `deposit on ${cls.name}; ${fmt(principal)} cr financed by ${LOAN_TERMS[lender].name}`) };
    notes.push(`bought ${cls.name}${used ? ' (used)' : ''} for ${fmt(total)} cr: ${fmt(deposit)} cr down, ${fmt(principal)} cr financed by ${LOAN_TERMS[lender].name} (${fmt(monthlyDue(loan))} cr a month)`);
  } else {
    const wallet = pay(slice.wallet, total, a);
    if (!wallet) return { reject: `cannot afford ${cls.name}: ${fmt(total)} cr here${military ? ' on the black market' : ''} (finance it: "on credit")` };
    next = { ...slice, wallet, log: logged(slice, day, -total, a.prefer, `bought ${cls.name}${used ? ' (used)' : ''}${military ? ' (black market)' : ''}`) };
    notes.push(`bought ${cls.name}${used ? ' (used)' : ''} for ${fmt(total)} cr${military ? ' on the black market' : ''}`);
  }
  // A ship a Jedi buys is a personal holding at its price; issued ships and ships taken in play never are (D-511, Jared).
  if (selectIsJedi(s)) next = { ...next, possessions: next.possessions + total };
  return { slice: next, rng, notes, emit: [{ type: 'shipAcquired', classId: m.classId, how: financed ? 'financed' : used ? 'boughtUsed' : 'bought', ...(used ? { wear: 0.3 } : {}) }, ...jediConsequences(s, next, notes)] };
}

function handleTrade(slice: EconomySlice, e: GameEvent, ctx: ApplyCtx<GameState>): R {
  const ship = tradeShip(slice, e, ctx);
  if (ship) return ship;
  const s = ctx.state;
  const id = resolvePriceId(String(e['item']));
  let item = id ? PRICE_BY_ID.get(id) : undefined;
  if (!item) return { reject: `no price for "${String(e['item'])}": name a common good or service in plain words` };
  let qty = Math.max(1, Math.min(20, Number(e['qty'] ?? 1)));
  const dir = String(e['dir']);
  const day = today(ctx);
  const npcId = typeof e['npcRef'] === 'string' ? (e['npcRef'] as string) : null;
  // Droids (D-512): a generic row is the date's model of its kind; a model must be made in this year; a sale needs an owned
  // droid (a stolen one goes to a fence). The droids feature records the unit (droidAcquired, droidSold).
  const droid = modelForPriceRow(item.id, dateFromAbsDay(day).year);
  const droidEmit: GameEvent[] = [];
  if (droid) {
    if (dir === 'issue') return { reject: 'droids are not issued' };
    if (dir === 'buy') {
      const refusal = modelRefusal(droid, dateFromAbsDay(day).year, true);
      if (refusal) return { reject: refusal };
      item = PRICE_BY_ID.get(priceRowOf(droid)) ?? item;
      for (let i = 0; i < qty; i++) droidEmit.push({ type: 'droidAcquired', modelId: droid.id });
    } else {
      const unit = selectDroidForSale(s, item.id);
      if (!unit) return { reject: `no ${droid.name} owned to sell` };
      if (unit.stolen && e['stolen'] !== true) return handleTrade(slice, { ...e, stolen: true }, ctx);
      qty = 1;
      item = PRICE_BY_ID.get(priceRowOf({ id: unit.modelId })) ?? item;
      droidEmit.push({ type: 'droidSold', unitId: unit.id });
    }
  }
  if (dir === 'issue') {
    const j = slice.job;
    const jedi = j.kind === 'order' && (JEDI_MONEY.quartermaster.includes(item.id) || (['knight', 'master'].includes(selectRank(s)) && JEDI_MONEY.quartermasterKnight.includes(item.id)));
    const kit = j.kind === 'military' && MILITARY_KIT[gradeBand(j.grade)].includes(item.id);
    if (!jedi && !kit) return { reject: `${item.name} is not issued to this character` };
    return { slice: { ...slice, log: logged(slice, day, 0, 'republic', `issued: ${item.name}${qty > 1 ? ` x${qty}` : ''} (${jedi ? 'the quartermaster' : 'military kit'})`) }, notes: [`issued free: ${item.name}`], emit: [{ type: 'itemAcquired', priceId: item.id, qty, issued: true }] };
  }
  let rng = s.meta.rngState;
  const notes: string[] = [];
  let margin: number | null = null;
  if (e['haggle'] === true) {
    const c = charismaContest(s, rng, npcId);
    rng = c.rng;
    margin = c.margin;
    notes.push(c.note);
  }
  const a = selectAcceptance(s);
  if (dir === 'sell') {
    const fence = item.legality === 'restricted' || e['stolen'] === true;
    const each = sellPrice(item, selectMarket(s).zone, fence ? 'fence' : 'dealer', margin);
    const total = each * qty;
    const cur = selectLocalCurrency(s);
    const next = { ...slice, wallet: receive(slice.wallet, total, cur), log: logged(slice, day, total, cur, `sold ${item.name}${qty > 1 ? ` x${qty}` : ''} to ${fence ? 'a fence' : 'a dealer'}`) };
    notes.push(`sold ${item.name} x${qty} to ${fence ? 'a fence' : 'a dealer'} for ${fmt(total)} cr`);
    return { slice: next, rng, notes, emit: [...droidEmit, ...(droid ? [] : [{ type: 'itemRemoved', priceId: item.id, qty }]), ...jediConsequences(s, next, notes)] };
  }
  // Buying.
  const list = listPrice(item, selectMarket(s));
  const total = buyPrice(list, margin) * qty;
  const jedi = selectIsJedi(s);
  // A Jedi's mission purchases come out of the Order's funds first (Republic credits).
  const fromFunds = jedi ? Math.min(slice.orderFunds, a.republic ? total : 0) : 0;
  const wallet = pay(slice.wallet, total - fromFunds, a);
  if (!wallet) return { reject: `cannot afford ${item.name} x${qty}: ${fmt(total)} cr here${item.legality === 'restricted' ? ' on the black market' : ''}` };
  const own = total - fromFunds;
  // A droid (or a ship) taken in play is never a personal holding (D-511); issued gear and mission funds never reach here.
  const counts = jedi && own > 0 && (item.kind === 'manufactured' || item.kind === 'military' || item.kind === 'luxury') && !JEDI_MONEY.notHoldings.includes(item.id) && !droid;
  const next: EconomySlice = {
    ...slice,
    wallet,
    orderFunds: slice.orderFunds - fromFunds,
    possessions: slice.possessions + (counts ? own : 0),
    log: logged(slice, day, -total, a.hutt && slice.wallet.hutt > wallet.hutt ? 'hutt' : a.prefer, `bought ${item.name}${qty > 1 ? ` x${qty}` : ''}${item.legality === 'restricted' ? ' (black market)' : ''}${fromFunds ? ' (mission funds)' : ''}`),
  };
  notes.push(`bought ${item.name} x${qty} for ${fmt(total)} cr${item.legality === 'restricted' ? ' on the black market' : ''}`);
  // A tool kit goes to the droids slice, which holds the character's mechanical work (m8-skills, D-513).
  const kit: GameEvent[] = item.id === 'toolKit' ? [{ type: 'toolKitAcquired' }] : [];
  return { slice: next, rng, notes, emit: [...droidEmit, ...kit, ...(droid ? [] : [{ type: 'itemAcquired', priceId: item.id, qty }]), ...jediConsequences(s, next, notes)] };
}

/** Pay by size: small, fair, large (lavish counts as large). */
const SIZE_TIER: Readonly<Record<string, 1 | 2 | 3>> = { small: 1, fair: 2, large: 3, lavish: 3 };

function handleEarned(slice: EconomySlice, e: GameEvent, ctx: ApplyCtx<GameState>): R {
  const s = ctx.state;
  const kind = e['kind'] as PayKind;
  const tier = SIZE_TIER[String(e['size'] ?? 'small')] ?? 1;
  const risk = (typeof e['risk'] === 'string' && e['risk'] in RISK_X ? e['risk'] : 'low') as Risk;
  const npcId = typeof e['npcRef'] === 'string' ? (e['npcRef'] as string) : null;
  const day = today(ctx);
  const [u, rng] = nextFloat(s.meta.rngState);
  const amount = payFor(kind, tier, u, risk);
  if (kind === 'missionFunds') {
    if (!selectIsJedi(s)) return { reject: 'only a Jedi draws mission funds from the Order' };
    if (['initiate', 'padawan'].includes(selectRank(s))) return { reject: "a Padawan is not entrusted with mission funds: the Master holds them" };
    return { slice: { ...slice, orderFunds: slice.orderFunds + amount, log: logged(slice, day, amount, 'republic', "the Order's mission funds (to be returned)") }, rng, notes: [`mission funds from the Order: ${fmt(amount)} cr`] };
  }
  const cur = payerCurrency(s, npcId);
  // Crew who serve for a share take their cut of smuggling, contract and bounty pay (m8-ship-life; CREW.share, invented).
  const sharers = kind === 'smuggling' || kind === 'contract' || kind === 'bounty' ? selectShips(s).reduce((n, x) => n + x.crew.filter((c) => c.pay === 'share').length, 0) : 0;
  const cut = Math.round(amount * Math.min(0.5, CREW.share * sharers));
  const notes: string[] = [`paid (${kind}, tier ${tier}${kind === 'job' ? `, ${risk} risk` : ''}): ${fmt(amount)} ${CURRENCY_NAMES[cur]}${cut ? `; the crew's shares take ${fmt(cut)}` : ''}`];
  let next: EconomySlice = { ...slice, wallet: receive(slice.wallet, amount - cut, cur), log: logged(slice, day, amount - cut, cur, `${kind} paid${cut ? ' (less the crew shares)' : ''}`) };
  if (kind === 'reward' && selectIsJedi(s)) {
    const witness = selectJediWitness(s);
    next = { ...next, rewards: [...next.rewards, { day, credits: amount, known: witness !== null }].slice(-50) };
    notes.push(witness ? `a Jedi kept a reward, and ${witness} saw it` : 'a Jedi kept a reward unseen: no consequence unless the Order finds out');
  }
  return { slice: next, rng, notes, emit: jediConsequences(s, next, notes) };
}

function handleDeal(slice: EconomySlice, e: GameEvent, ctx: ApplyCtx<GameState>): R {
  const s = ctx.state;
  const kind = String(e['kind']);
  const day = today(ctx);
  const npcId = typeof e['npcRef'] === 'string' ? (e['npcRef'] as string) : null;
  const npc = npcId ? s.npcs.byId[npcId] : undefined;
  const a = selectAcceptance(s);
  let rng = s.meta.rngState;
  if ((PAY_KINDS as readonly string[]).includes(kind)) return handleEarned(slice, e, ctx);
  switch (kind) {
    case 'bribe': {
      if (!npc) return { reject: 'a bribe needs the NPC offered it' };
      const size = (typeof e['size'] === 'string' && e['size'] in BRIBE_SIZES ? e['size'] : 'fair') as BribeSize;
      const amount = bribeAmount(npc.role, size);
      if (!pay(slice.wallet, amount, a)) return { reject: `cannot afford the bribe: ${fmt(amount)} cr` };
      if (isHonest(npc.id, npc.role)) return { slice, notes: [`${npc.name} refuses the bribe (${fmt(amount)} cr): honest, no sum would do; no credits change hands`] };
      const [card, r] = checkRating(rng, { label: `bribe ${npc.name}`, skillId: 'charisma', levelInputs: levelOf(s, 'charisma'), modifiers: [{ source: `offer: ${size}`, value: bribeModifier(size) }], rating: BRIBE_CHECK.rating });
      rng = r;
      if (!card.success) return { slice, rng, notes: [`${npc.name} turns the bribe down (${fmt(amount)} cr; Charisma ${card.total.toFixed(1)} vs DC ${card.dc}): no credits change hands`] };
      const wallet = pay(slice.wallet, amount, a)!;
      return { slice: { ...slice, wallet, log: logged(slice, day, -amount, a.prefer, `bribe to ${npc.name}`) }, rng, notes: [`${npc.name} takes the bribe: ${fmt(amount)} cr (Charisma ${card.total.toFixed(1)} vs DC ${card.dc})`] };
    }
    case 'fine': {
      const size = (typeof e['size'] === 'string' && e['size'] in FINE_SIZES ? e['size'] : 'fair') as keyof typeof FINE_SIZES;
      return settle(slice, s, FINE_SIZES[size], 'a fine', 'bank', day, 'the authorities');
    }
    case 'loan': {
      const lender = (typeof e['lender'] === 'string' && (LENDERS as readonly string[]).includes(e['lender'] as string) ? e['lender'] : 'hutt') as Lender;
      const size = (typeof e['size'] === 'string' && e['size'] in LOAN_SIZES ? e['size'] : 'small') as keyof typeof LOAN_SIZES;
      const principal = LOAN_SIZES[size];
      if (lender === 'bank' && principal > selectMonthlyIncome(s) * BANK_INCOME_MONTHS) return { reject: `a bank will not lend ${fmt(principal)} cr on ${fmt(selectMonthlyIncome(s))} cr a month` };
      const cur: Currency = lender === 'bank' ? a.prefer : a.hutt ? 'hutt' : 'republic';
      const loan: Loan = { id: `loan-${slice.nextLoan}`, lender, principal, balance: principal, currency: cur, startDay: day, nextDueDay: addCalendarMonths(day, 1), missed: 0, stage: 'current' };
      const next = { ...slice, wallet: receive(slice.wallet, principal, cur), loans: [...slice.loans, loan], nextLoan: slice.nextLoan + 1, log: logged(slice, day, principal, cur, `loan from ${LOAN_TERMS[lender].name}`) };
      return { slice: next, notes: [`borrowed ${fmt(principal)} cr from ${LOAN_TERMS[lender].name} at ${Math.round(LOAN_TERMS[lender].yearRate * 100)}% a year; ${fmt(monthlyDue(loan))} cr due monthly`], emit: jediConsequences(s, next, []) };
    }
    case 'repay': {
      const want = typeof e['lender'] === 'string' ? e['lender'] : null;
      const loan = slice.loans.find((l) => want === null || l.lender === want);
      if (!loan) return { reject: 'no debt to repay' };
      const wallet = pay(slice.wallet, loan.balance, TRANSFER);
      if (wallet) return { slice: { ...slice, wallet, loans: slice.loans.filter((l) => l.id !== loan.id), log: logged(slice, day, -loan.balance, loan.currency, `debt to ${LOAN_TERMS[loan.lender].name} repaid`) }, notes: [`repaid ${fmt(loan.balance)} cr to ${LOAN_TERMS[loan.lender].name} in full`] };
      const all = Math.floor(walletWorth(slice.wallet));
      if (all <= 0) return { reject: 'nothing to repay with' };
      const after = pay(slice.wallet, all, TRANSFER) ?? emptyWallet();
      return { slice: { ...slice, wallet: after, loans: slice.loans.map((l) => (l.id === loan.id ? { ...l, balance: l.balance - all } : l)), log: logged(slice, day, -all, loan.currency, `part of a debt repaid`) }, notes: [`repaid ${fmt(all)} cr of ${fmt(loan.balance)} cr`] };
    }
    case 'exchange': {
      const to = (typeof e['to'] === 'string' && (CURRENCIES as readonly string[]).includes(e['to'] as string) ? e['to'] : null) as Currency | null;
      if (!to) return { reject: 'an exchange needs the currency wanted' };
      if (!a.changer) return { reject: "no money changer works on this side's core worlds" };
      const c = charismaContest(s, rng, npcId);
      const cut = changerCut(c.margin);
      const x = exchange(slice.wallet, to, cut);
      if (x.changed <= 0) return { reject: `nothing to change into ${CURRENCY_NAMES[to]}` };
      return { slice: { ...slice, wallet: x.wallet, log: logged(slice, day, -x.fee, to, `money changer's cut (${Math.round(cut * 100)}%)`) }, rng: c.rng, notes: [c.note, `changed ${fmt(x.changed)} cr into ${CURRENCY_NAMES[to]}, less a ${Math.round(cut * 100)}% cut (${fmt(x.fee)} cr)`] };
    }
    case 'steal':
    case 'extort': {
      if (!npc) return { reject: `${kind === 'steal' ? 'theft' : 'extortion'} needs the NPC robbed` };
      const purse = selectNpcPurse(s, npc.id);
      const cur = payerCurrency(s, npc.id);
      const choice = kind === 'steal' ? ('theft' as const) : ('extortion' as const);
      const next: EconomySlice = {
        ...slice,
        wallet: receive(slice.wallet, purse, cur),
        looted: { ...slice.looted, [npc.id]: (slice.looted[npc.id] ?? 0) + purse },
        darkChoices: [...slice.darkChoices, { day, kind: choice, credits: purse }].slice(-50),
        log: logged(slice, day, purse, cur, `${choice} from ${npc.name}`),
      };
      const notes = [`${choice} from ${npc.name}: ${fmt(purse)} cr (what they carried)`, `a dark-side choice, recorded for the alignment system`];
      return { slice: next, notes, emit: jediConsequences(s, next, notes) };
    }
    case 'orderLearns': {
      // The Order learns of rewards a Jedi kept unseen.
      if (!slice.rewards.some((r) => !r.known)) return { reject: 'no reward kept unseen' };
      const next = { ...slice, rewards: slice.rewards.map((r) => ({ ...r, known: true })) };
      const notes = ['the Order learns of the rewards kept'];
      return { slice: next, notes, emit: jediConsequences(s, next, notes) };
    }
    case 'returnFunds': {
      if (slice.orderFunds <= 0) return { reject: 'no mission funds to return' };
      return { slice: { ...slice, orderFunds: 0, log: logged(slice, day, -slice.orderFunds, 'republic', 'mission funds returned to the Temple') }, notes: [`returned ${fmt(slice.orderFunds)} cr of mission funds to the Temple`] };
    }
    default:
      return { reject: `unknown money deal ${kind}` };
  }
}

/** A sum the character owes now: paid as far as the wallet goes, the rest a debt to `lender` (a blockade's fee, a fine, a ransom). */
function settle(slice: EconomySlice, s: GameState, credits: number, reason: string, lender: Lender, day: number, owedTo?: string): R {
  const a = selectAcceptance(s);
  const full = pay(slice.wallet, credits, a);
  if (full) return { slice: { ...slice, wallet: full, log: logged(slice, day, -credits, a.prefer, reason) }, notes: [`${reason}: ${fmt(credits)} cr paid`] };
  const have = Math.floor(walletWorth(slice.wallet));
  const wallet = have > 0 ? (pay(slice.wallet, have, TRANSFER) ?? emptyWallet()) : slice.wallet;
  const owed = credits - Math.max(0, have);
  const loan: Loan = { id: `loan-${slice.nextLoan}`, lender, principal: owed, balance: owed, currency: a.prefer, startDay: day, nextDueDay: addCalendarMonths(day, 1), missed: 0, stage: 'current' };
  return {
    slice: { ...slice, wallet, loans: [...slice.loans, loan], nextLoan: slice.nextLoan + 1, log: logged(slice, day, -Math.max(0, have), a.prefer, `${reason} (${fmt(owed)} cr owed)`) },
    notes: [`${reason}: ${fmt(credits)} cr; ${fmt(Math.max(0, have))} paid, ${fmt(owed)} owed to ${owedTo ?? LOAN_TERMS[lender].name}`],
  };
}

function handleLiving(slice: EconomySlice, e: GameEvent, ctx: ApplyCtx<GameState>): R {
  const s = ctx.state;
  let next = slice;
  const notes: string[] = [];
  if (typeof e['lifestyle'] === 'string') {
    const l = e['lifestyle'] as Lifestyle;
    const housed = slice.job.kind === 'order' || slice.job.kind === 'military' || (selectPath(s) === 'sith' && selectRank(s) === 'acolyte');
    if (l === 'provided' && !housed) return { reject: 'room and board are provided only at the Temple, in barracks or at the Academy' };
    next = { ...next, lifestyle: l };
    notes.push(`lifestyle: ${l}`);
  }
  if (typeof e['job'] === 'string') {
    const j = e['job'];
    if (slice.job.kind === 'order' || slice.job.kind === 'military') return { reject: 'Order or military service ends only through the engine or the player' };
    next = { ...next, job: j === 'none' ? { kind: 'none' } : { kind: 'wage', tier: j as (typeof WAGE_TIERS)[number], currency: selectLocalCurrency(s) === 'imperial' ? 'imperial' : 'republic' } };
    notes.push(`job: ${j}${j !== 'none' ? ` (${fmt(WAGES[j as (typeof WAGE_TIERS)[number]] * selectWageFactor(s))} cr a month)` : ''}`);
  }
  return notes.length ? { slice: next, notes } : { reject: 'nothing changed' };
}

// ---------------------------------------------------------------- the day hook

function dayHook(slice: EconomySlice, ended: number, ctx: ApplyCtx<GameState>): { slice: EconomySlice; notices: string[]; interrupt?: string; emit: GameEvent[] } {
  const s = ctx.state;
  const next = ended + 1;
  const notices: string[] = [];
  const emit: GameEvent[] = [];
  let interrupt: string | undefined;
  let e = slice;
  // Living, for the day that ended.
  if (e.lifestyle !== 'provided') {
    const cost = selectLivingCost(s);
    const a = selectAcceptance(s);
    const paid = pay(e.wallet, cost, a);
    if (paid) e = { ...e, wallet: paid, destituteSince: null };
    else {
      // Step down to what the wallet covers; nothing at all is destitution (invented rule).
      const tiers = LIFESTYLES.filter((l) => l !== 'provided' && LIFESTYLE_DAY[l] < LIFESTYLE_DAY[e.lifestyle]).reverse();
      const ratio = cost / LIFESTYLE_DAY[e.lifestyle];
      const fit = tiers.find((l) => pay(e.wallet, Math.round(LIFESTYLE_DAY[l] * ratio), a) !== null);
      if (fit) {
        e = { ...e, wallet: pay(e.wallet, Math.round(LIFESTYLE_DAY[fit] * ratio), a)!, lifestyle: fit, destituteSince: null };
        notices.push(`money ran short: living drops to ${fit}`);
      } else if (e.destituteSince === null) {
        e = { ...e, lifestyle: 'poor', destituteSince: ended };
        notices.push('destitute: no money even for a poor living');
      }
    }
  }
  // Pay, on the first of each month.
  if (dateFromAbsDay(next).day === 1) {
    const income = selectMonthlyIncome(s);
    const j = e.job;
    if (income > 0 && (j.kind === 'military' || j.kind === 'wage')) {
      e = { ...e, wallet: receive(e.wallet, income, j.currency), log: logged(e, next, income, j.currency, j.kind === 'military' ? `military pay (${j.grade})` : `wages (${j.tier} work)`) };
    }
  }
  // Debts that come due.
  const loans: Loan[] = [];
  for (const l of e.loans) {
    if (l.nextDueDay > next) {
      loans.push(l);
      continue;
    }
    const due = monthlyDue(l);
    const paid = pay(e.wallet, due, TRANSFER);
    const after = loanDue(l, paid !== null, addCalendarMonths(l.nextDueDay, 1));
    if (paid) e = { ...e, wallet: paid, log: logged(e, next, -due, l.currency, `debt payment to ${LOAN_TERMS[l.lender].name}`) };
    if (after.stage !== l.stage) {
      const text = after.stage === 'warning' ? `${LOAN_TERMS[l.lender].name} sends a warning: a payment of ${fmt(due)} cr was missed` : after.stage === 'collectors' ? `collectors from ${LOAN_TERMS[l.lender].name} come for ${fmt(after.balance)} cr` : `${LOAN_TERMS[l.lender].name} puts a bounty on the debtor (${fmt(after.balance)} cr owed)`;
      notices.push(text);
      if (after.stage === 'collectors' || after.stage === 'bounty') interrupt = text;
      if (after.stage === 'bounty') emit.push({ type: 'flagSet', flag: `debtBounty:${l.lender}` });
    }
    if (after.balance > 0) loans.push(after);
    else notices.push(`the debt to ${LOAN_TERMS[l.lender].name} is paid off`);
  }
  e = { ...e, loans };
  return { slice: e, notices, emit, ...(interrupt !== undefined ? { interrupt } : {}) };
}

// ---------------------------------------------------------------- the module

export const economyFeature: FeatureModule<EconomySlice, GameState> = {
  id: 'economy',
  version: 1,
  initialState: initialEconomy,
  emptyState: emptyEconomy,
  stateSchema: economySliceSchema,
  events: {
    /** AI or player: a purchase, a sale, or gear issued. The code prices it; no amount is taken from the narrator. */
    trade: {
      schema: z.object({
        type: z.literal('trade'),
        dir: z.enum(['buy', 'sell', 'issue']),
        item: z.string().max(40),
        qty: z.number().int().min(1).max(20).optional(),
        haggle: z.boolean().optional(),
        npcRef: z.string().optional(),
        stolen: z.boolean().optional(),
      }),
      sources: ['ai', 'player', 'engine'],
      narrative: () => true,
      refFields: ['npcRef'],
      refKinds: { npcRef: ['npc'] },
      handle: handleTrade,
    },
    /**
     * AI: money changing hands. Pay (bounty, contract, smuggling, job, reward, missionFunds) by size (small, fair, large) and
     * risk for odd jobs; a bribe by size; a fine; a loan from a lender; a repayment; a money changer; theft or extortion;
     * mission funds returned; the Order learning of rewards a Jedi kept. The code sets every sum.
     */
    money: {
      schema: z.object({
        type: z.literal('money'),
        kind: z.enum([...PAY_KINDS, 'bribe', 'fine', 'loan', 'repay', 'exchange', 'steal', 'extort', 'returnFunds', 'orderLearns']),
        size: z.enum(['small', 'fair', 'large', 'lavish']).optional(),
        risk: z.enum(['low', 'medium', 'high']).optional(),
        npcRef: z.string().optional(),
        lender: z.enum(LENDERS).optional(),
        to: z.enum(CURRENCIES).optional(),
      }),
      sources: ['ai', 'player', 'engine'],
      narrative: () => true,
      refFields: ['npcRef'],
      refKinds: { npcRef: ['npc'] },
      handle: handleDeal,
    },
    /** AI: the lifestyle or a civilian job changed. */
    living: {
      schema: z.object({ type: z.literal('living'), lifestyle: z.enum(LIFESTYLES).optional(), job: z.enum(['none', ...WAGE_TIERS]).optional() }),
      sources: ['ai', 'player', 'engine'],
      narrative: () => true,
      handle: handleLiving,
    },
    /** Engine or player: military service, by grade, or its end. */
    militaryServiceSet: {
      schema: z.object({ type: z.literal('militaryServiceSet'), grade: z.enum(MILITARY_GRADES).nullable(), currency: z.enum(['republic', 'imperial']).optional() }),
      sources: ['engine', 'player'],
      handle: (slice, e, ctx) => {
        const grade = e['grade'] as (typeof MILITARY_GRADES)[number] | null;
        if (grade === null) return { slice: { ...slice, job: { kind: 'none' }, lifestyle: slice.lifestyle === 'provided' ? 'modest' : slice.lifestyle }, notes: ['military service ends'] };
        const currency = (e['currency'] as 'republic' | 'imperial' | undefined) ?? selectHomeCurrency(ctx.state);
        return { slice: { ...slice, job: { kind: 'military', grade, currency }, lifestyle: 'provided' }, notes: [`military service: ${grade}, ${fmt(MILITARY_PAY[grade])} ${CURRENCY_NAMES[currency]} a month`] };
      },
    },
    /**
     * Engine (the ships' day hook; m8-ship-life): running costs on the calendar: crew wages, docking, upkeep. Each is paid if the
     * wallet covers it; an unpaid wage costs the crew member's loyalty (crewUnpaid), missed upkeep wears the ship
     * (shipUpkeepMissed), other unpaid costs (docking) are owed (bank terms).
     */
    shipCostsDue: {
      schema: z.object({ type: z.literal('shipCostsDue'), items: z.array(z.object({ credits: z.number().int().min(0), reason: z.string().max(120), shipId: z.string().optional(), crewId: z.string().optional(), upkeep: z.boolean().optional() })).max(60) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const day = today(ctx);
        let next = slice;
        const emit: GameEvent[] = [];
        let owed = 0;
        for (const it of e['items'] as { credits: number; reason: string; shipId?: string; crewId?: string; upkeep?: boolean }[]) {
          if (it.credits <= 0) continue;
          const wallet = pay(next.wallet, it.credits, TRANSFER);
          if (wallet) next = { ...next, wallet, log: logged(next, day, -it.credits, 'republic', it.reason) };
          else if (it.crewId && it.shipId) emit.push({ type: 'crewUnpaid', shipId: it.shipId, crewId: it.crewId });
          else if (it.upkeep && it.shipId) emit.push({ type: 'shipUpkeepMissed', shipId: it.shipId });
          else owed += it.credits;
        }
        if (owed > 0) {
          const r = settle(next, ctx.state, owed, 'ship running costs', 'bank', day, 'the port authorities');
          if ('slice' in r) return { slice: r.slice, emit, notes: r.notes ?? [] };
        }
        return { slice: next, emit };
      },
    },
    /** Engine: a sum owed now (a blockade's passage or fine, a ransom): paid as far as the wallet goes, the rest a debt. */
    creditsCharged: {
      schema: z.object({ type: z.literal('creditsCharged'), credits: z.number().int().min(0), reason: z.string().max(120), lender: z.enum(LENDERS).optional() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => settle(slice, ctx.state, Number(e['credits']), String(e['reason']), (e['lender'] as Lender | undefined) ?? 'hutt', today(ctx)),
    },
    /** Engine: the narration was shown the oldest `count` untold money lines (those made by its own reply wait for the next). */
    economyTold: {
      schema: z.object({ type: z.literal('economyTold'), count: z.number().int().min(1), turn: z.number().int() }),
      sources: ['engine'],
      handle: (slice, e) => {
        let left = Number(e['count']);
        const log = slice.log.map((x) => (x.toldTurn === null && left-- > 0 ? { ...x, toldTurn: Number(e['turn']) } : x));
        return { slice: { ...slice, log } };
      },
    },
  },
  onTimeAdvanced: (slice, step, ctx) => {
    if (!step.endsDay) return { slice };
    const ended = Math.floor(step.toAbs / SECONDS_PER_DAY) - 1;
    const r = dayHook(slice, ended, ctx);
    return { slice: r.slice, ...(r.notices.length ? { notices: r.notices } : {}), ...(r.emit.length ? { emit: r.emit } : {}), ...(r.interrupt !== undefined ? { interrupt: r.interrupt } : {}) };
  },
  selectors: { wallet: selectWallet, lines: selectEconomyLines, place: selectPlace, wealth: selectJediWealth },
};
