// The economy's rules (M8 checklist item 5; docs-v2/spec/economy.md). Pure: prices, haggling, selling, currencies, pay, debt,
// bribes and what NPCs carry. The feature (src/features/economy) reads the game state and calls these.
import {
  BLACK_MARKET_X,
  BRIBE_CHECK,
  BRIBE_SIZES,
  CARRIED_FLOOR,
  CARRIED_MONTHS,
  ARCHETYPE_CARRIED_X,
  CHANGER_CUT,
  CORUSCANT_FOOD_INDEX,
  DEBT_STAGES,
  DEPRESSION,
  HAGGLE,
  HALF_SWING_KINDS,
  HONEST_SHARE,
  HUTT_COINS,
  HUTT_CREDIT_MARKUP,
  LOAN_TERMS,
  LOCATION_FACTOR,
  PAY_BANDS,
  RISK_X,
  ROLE_PAY,
  SELL,
  WARTIME_MILITARY_X,
  ZONE_BY_REGION,
  type BribeSize,
  type Currency,
  type DebtStage,
  type Lender,
  type PayKind,
  type Risk,
  type Zone,
} from '../data/economy.config';
import type { PriceEntry } from '../data/economyPrices';
import { RUNNING_COSTS, SHIP_PRICE_ANCHORS, SHIP_PRICE_CURVE, SHIP_USED_SHARE, type RunningCosts } from '../data/shipPrices';
import type { ShipSpec } from '../data/ships';
import { DAYS_PER_YEAR } from './calendar';
import { clamp, interp } from './interp';

// ---------------------------------------------------------------- places and prices

/** A region string's zone (the planets files' names, matched by their start), or null when it names none. */
export function zoneOfRegion(region: string): Zone | null {
  const r = region.trim();
  for (const [name, zone] of ZONE_BY_REGION) if (r.startsWith(name)) return zone;
  return null;
}

/** Where a price is paid: its zone and the dated event factors that apply to each kind of good there. */
export interface Market {
  zone: Zone;
  /** Multipliers from dated events (the food index, the depression, wartime), by price kind; absent = 1. */
  events: Readonly<Partial<Record<PriceEntry['kind'], number>>>;
}

/** The location multiplier for a kind of good: full for manufactured and military goods, half the swing for the rest. */
export function locationFactor(kind: PriceEntry['kind'], zone: Zone): number {
  const f = LOCATION_FACTOR[zone];
  return HALF_SWING_KINDS.includes(kind) ? 1 + (f - 1) / 2 : f;
}

/** The black market's markup here (restricted goods are sold nowhere else). */
export const blackMarketX = (zone: Zone): number => BLACK_MARKET_X[zone];

/** The price before haggling: base x location x events, and the black-market markup for restricted goods. */
export function listPrice(item: Pick<PriceEntry, 'base' | 'kind' | 'legality'>, m: Market): number {
  const p = item.base * locationFactor(item.kind, m.zone) * (m.events[item.kind] ?? 1) * (item.legality === 'restricted' ? blackMarketX(m.zone) : 1);
  return Math.max(1, Math.round(p));
}

/** A Charisma contest's margin moves a price inside +/-20% (Jared): the buyer's factor; a seller's is 2 - it. Smooth, never past the bound. */
export const haggleFactor = (margin: number): number => 1 - HAGGLE.maxShift * Math.tanh(margin / HAGGLE.scale);

/** What a buyer pays: the list price, haggled when there was a contest. */
export const buyPrice = (list: number, margin: number | null): number => Math.max(1, Math.round(list * (margin === null ? 1 : haggleFactor(margin))));

/** A fence's share of base, 25-40%, by the haggle (Jared). */
export const fenceShare = (margin: number | null): number => {
  const mid = (SELL.fence.min + SELL.fence.max) / 2;
  const half = (SELL.fence.max - SELL.fence.min) / 2;
  return margin === null ? mid : mid + half * Math.tanh(margin / HAGGLE.scale);
};

/**
 * What a seller gets. A dealer pays about half of base at this market (no event or black-market markup), haggled; a fence pays
 * 25-40% of base for stolen or restricted goods. A dealer never buys those.
 */
export function sellPrice(item: Pick<PriceEntry, 'base' | 'kind'>, zone: Zone, to: 'dealer' | 'fence', margin: number | null): number {
  const local = item.base * locationFactor(item.kind, zone);
  const share = to === 'fence' ? fenceShare(margin) : SELL.dealer * (margin === null ? 1 : 2 - haggleFactor(margin));
  return Math.max(0, Math.round(local * share));
}

// ---------------------------------------------------------------- dated events

/** The Coruscant food index while the Hydian blockade stands, by days since it began (invented numbers). */
export const foodIndex = (daysSinceStart: number): number => interp(CORUSCANT_FOOD_INDEX, Math.max(0, daysSinceStart));

/** The post-Treaty depression's strength, 1 on the Treaty's day falling smoothly (cosine) to 0 after DEPRESSION.years. */
export function depressionWeight(daysSince: number): number {
  const span = DEPRESSION.years * DAYS_PER_YEAR;
  if (daysSince < 0 || daysSince >= span) return 0;
  return (1 + Math.cos((Math.PI * daysSince) / span)) / 2;
}
export const depressionGoods = (w: number): number => 1 + (DEPRESSION.goods - 1) * w;
export const depressionWages = (w: number): number => 1 + (DEPRESSION.wages - 1) * w;
export const wartimeMilitary = (atWar: boolean): number => (atWar ? WARTIME_MILITARY_X : 1);

// ---------------------------------------------------------------- currencies and the wallet

export interface Wallet {
  republic: number;
  imperial: number;
  /** Hutt coin as a count of wupiupi (exact). */
  hutt: number;
}
export const emptyWallet = (): Wallet => ({ republic: 0, imperial: 0, hutt: 0 });

/** Hutt coins to credits at the WotC rates. */
export const huttCoinsToCredits = (c: { peggat?: number; trugut?: number; wupiupi?: number }): number => (c.peggat ?? 0) * HUTT_COINS.peggat + (c.trugut ?? 0) * HUTT_COINS.trugut + (c.wupiupi ?? 0) * HUTT_COINS.wupiupi;
/** A wupiupi count in credits, and the wupiupi a credit sum needs (rounded up). */
export const wupiupiToCredits = (w: number): number => w * HUTT_COINS.wupiupi;
export const creditsToWupiupi = (cr: number): number => Math.ceil(cr / HUTT_COINS.wupiupi - 1e-9);
/** A wupiupi count as peggats, truguts and wupiupi. */
export function huttCoinBreakdown(w: number): { peggat: number; trugut: number; wupiupi: number } {
  const perPeggat = HUTT_COINS.peggat / HUTT_COINS.wupiupi;
  const perTrugut = HUTT_COINS.trugut / HUTT_COINS.wupiupi;
  const peggat = Math.floor(w / perPeggat);
  const trugut = Math.floor((w - peggat * perPeggat) / perTrugut);
  return { peggat, trugut, wupiupi: w - peggat * perPeggat - trugut * perTrugut };
}

/** What a place takes, and at what rate. */
export interface Acceptance {
  republic: boolean;
  imperial: boolean;
  hutt: boolean;
  /** Credits cost this much more where Hutt coin rules. */
  creditMarkup: number;
  /** The credit paid first where both pass. */
  prefer: 'republic' | 'imperial';
  /** A money changer works here (border and neutral space; not on either side's core worlds). */
  changer: boolean;
}

/** A place's acceptance from what it is: the Republic's core, the Empire's, Hutt-coin country, or the border and neutral rest. */
export function acceptanceFor(p: { republicCore: boolean; imperialCore: boolean; huttCoin: boolean; prefer: 'republic' | 'imperial' }): Acceptance {
  if (p.huttCoin) return { republic: true, imperial: true, hutt: true, creditMarkup: HUTT_CREDIT_MARKUP, prefer: p.prefer, changer: true };
  if (p.republicCore) return { republic: true, imperial: false, hutt: false, creditMarkup: 1, prefer: 'republic', changer: false };
  if (p.imperialCore) return { republic: false, imperial: true, hutt: false, creditMarkup: 1, prefer: 'imperial', changer: false };
  return { republic: true, imperial: true, hutt: false, creditMarkup: 1, prefer: p.prefer, changer: true };
}

/** What the wallet is worth here, in credits: only what the place takes, Hutt coin at par, credits after any markup. */
export function spendable(w: Wallet, a: Acceptance): number {
  const credits = (a.republic ? w.republic : 0) + (a.imperial ? w.imperial : 0);
  return (a.hutt ? wupiupiToCredits(w.hutt) : 0) + credits / a.creditMarkup;
}

/** The whole wallet in credits at face value, whatever a place takes (net worth). */
export const walletValue = (w: Wallet): number => w.republic + w.imperial + wupiupiToCredits(w.hutt);

/**
 * Pays a price in credits from the wallet as the place takes it: Hutt coin first where it rules, then the preferred credit,
 * then the other. Null when the wallet cannot cover it here (the refused currency does not count).
 */
export function pay(w: Wallet, price: number, a: Acceptance): Wallet | null {
  if (price <= 0) return w;
  if (spendable(w, a) + 1e-9 < price) return null;
  const next = { ...w };
  let due = price;
  if (a.hutt && next.hutt > 0) {
    const need = creditsToWupiupi(due);
    const used = Math.min(need, next.hutt);
    next.hutt -= used;
    due = Math.max(0, due - wupiupiToCredits(used));
  }
  const order: ('republic' | 'imperial')[] = a.prefer === 'republic' ? ['republic', 'imperial'] : ['imperial', 'republic'];
  for (const c of order) {
    if (due <= 0 || !a[c]) continue;
    const cost = Math.ceil(due * a.creditMarkup - 1e-9);
    const used = Math.min(cost, next[c]);
    next[c] -= used;
    due = Math.max(0, due - used / a.creditMarkup);
  }
  return due > 1e-6 ? null : next;
}

/** A credit sum added to one currency (Hutt coin as wupiupi). */
export function receive(w: Wallet, credits: number, c: Currency): Wallet {
  return c === 'hutt' ? { ...w, hutt: w.hutt + creditsToWupiupi(credits) } : { ...w, [c]: w[c] + Math.round(credits) };
}

/** A changer's cut, 10-20%, the haggle moving it (invented range, Jared). */
export const changerCut = (margin: number | null): number => {
  const mid = (CHANGER_CUT.min + CHANGER_CUT.max) / 2;
  const half = (CHANGER_CUT.max - CHANGER_CUT.min) / 2;
  return margin === null ? mid : mid - half * Math.tanh(margin / HAGGLE.scale);
};

/** Everything not in `to` changed into `to`, less the cut. */
export function exchange(w: Wallet, to: Currency, cut: number): { wallet: Wallet; changed: number; fee: number } {
  const from = (['republic', 'imperial', 'hutt'] as const).filter((c) => c !== to);
  const changed = from.reduce((a, c) => a + (c === 'hutt' ? wupiupiToCredits(w.hutt) : w[c]), 0);
  if (changed <= 0) return { wallet: w, changed: 0, fee: 0 };
  const fee = Math.round(changed * cut);
  const base: Wallet = { ...w };
  for (const c of from) base[c] = 0;
  return { wallet: receive(base, changed - fee, to), changed, fee };
}

// ---------------------------------------------------------------- income

/** One-off pay inside its band, evenly on a log scale; odd jobs times their risk. `u` is a uniform draw. */
export function payFor(kind: PayKind, tier: 1 | 2 | 3, u: number, risk: Risk = 'low'): number {
  const [lo, hi] = PAY_BANDS[kind][tier - 1]!;
  const raw = Math.exp(Math.log(lo) + (Math.log(hi) - Math.log(lo)) * clamp(u, 0, 1));
  const x = kind === 'job' ? RISK_X[risk] : 1;
  const step = raw * x >= 10_000 ? 100 : raw * x >= 1000 ? 50 : 10;
  return Math.round((raw * x) / step) * step;
}

// ---------------------------------------------------------------- debt

export interface Loan {
  id: string;
  lender: Lender;
  principal: number;
  balance: number;
  currency: Currency;
  startDay: number;
  nextDueDay: number;
  missed: number;
  stage: DebtStage;
}

/** This month's payment: an even share of the principal plus a month's interest on the balance, never more than is owed. */
export function monthlyDue(l: Pick<Loan, 'lender' | 'principal' | 'balance'>): number {
  const t = LOAN_TERMS[l.lender];
  const interest = (l.balance * t.yearRate) / 12;
  return Math.ceil(Math.min(l.balance + interest, l.principal / t.months + interest));
}

/** The stage a count of missed payments reaches: a warning, then collectors, then a bounty on the debtor (Jared). */
export const debtStage = (missed: number): DebtStage => DEBT_STAGES[clamp(missed, 0, DEBT_STAGES.length - 1)]!;

/** A payment that came due: paid (the balance falls by the principal share), or missed (the interest is added and the stage climbs). */
export function loanDue(l: Loan, paid: boolean, nextDueDay: number): Loan {
  const t = LOAN_TERMS[l.lender];
  const interest = (l.balance * t.yearRate) / 12;
  const due = monthlyDue(l);
  if (paid) return { ...l, balance: Math.max(0, Math.round(l.balance + interest - due)), nextDueDay, missed: 0, stage: l.stage === 'bounty' ? 'bounty' : 'current' };
  const missed = l.missed + 1;
  return { ...l, balance: Math.round(l.balance + interest), nextDueDay, missed, stage: debtStage(Math.max(missed, DEBT_STAGES.indexOf(l.stage))) };
}

// ---------------------------------------------------------------- bribes and NPCs

/** A stable draw in [0, 1) from a key (FNV-1a), so an NPC's honesty and purse never change between reads. */
export function hashUnit(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0x1_0000_0000;
}

export const rolePay = (role: string): number => ROLE_PAY[role] ?? ROLE_PAY['other']!;
/** Whether this NPC refuses any bribe: every Jedi, a droid, and a share of each role, by the NPC's own seed. */
export const isHonest = (npcId: string, role: string): boolean => hashUnit(`${npcId}:honest`) < (HONEST_SHARE[role] ?? HONEST_SHARE['other']!);
/** A bribe's sum: months of the target's pay, at least 10 cr. */
export const bribeAmount = (role: string, size: BribeSize): number => Math.max(10, Math.round(rolePay(role) * BRIBE_SIZES[size]));
/** The bribe check's modifier: +3 for each doubling over a fair offer, -3 for each halving (invented). */
export const bribeModifier = (size: BribeSize): number => BRIBE_CHECK.modPerDoubling * Math.log2(BRIBE_SIZES[size] / BRIBE_SIZES.fair);

/** Credits a generated NPC carries, from its role's pay, its archetype and its seed (invented ranges). */
export function npcCarried(npcId: string, role: string, archetype: string | null): number {
  const pay = rolePay(role);
  const u = hashUnit(`${npcId}:purse`);
  const x = ARCHETYPE_CARRIED_X[archetype ?? ''] ?? 1;
  if (pay <= 0) {
    const [lo, hi] = CARRIED_FLOOR[role] ?? CARRIED_FLOOR['default']!;
    return Math.round(lo + (hi - lo) * u);
  }
  const [lo, hi] = CARRIED_MONTHS[role] ?? CARRIED_MONTHS['default']!;
  return Math.round(pay * (lo + (hi - lo) * u) * x);
}

// ---------------------------------------------------------------- ships

const shipLength = (s: ShipSpec): number => s.len ?? s.like ?? 20;

/** A ship class's new price: the recorded price, else the curve of its group on length (invented). */
export function shipPrice(s: ShipSpec): { price: number; recorded: boolean } {
  const a = SHIP_PRICE_ANCHORS[s.id];
  if (a) return { price: a.price, recorded: true };
  const group = s.kind === 'fighter' ? 'fighter' : s.kind === 'freighter' ? 'freighter' : 'capital';
  const c = SHIP_PRICE_CURVE[group];
  const raw = c.at * Math.pow(shipLength(s) / c.len, c.power);
  const step = raw >= 1e7 ? 1e5 : raw >= 1e5 ? 1000 : 100;
  return { price: Math.round(raw / step) * step, recorded: false };
}
export const usedShipPrice = (s: ShipSpec): number => Math.round(shipPrice(s).price * SHIP_USED_SHARE);
export const runningCosts = (s: ShipSpec): RunningCosts & { upkeepPerMonth: number } => {
  const r = RUNNING_COSTS[s.kind];
  return { ...r, upkeepPerMonth: Math.round(shipPrice(s).price * r.upkeepShare) };
};
