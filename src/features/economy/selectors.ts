// Economy reads (docs-v2/spec/economy.md): where the character is as a market, what things cost there, what the wallet is worth
// there, and the lines the narrator gets. Derived values are never stored.
import {
  CURRENCY_NAMES,
  DEFAULT_ZONE,
  DEPRESSION,
  FOOD_INDEX_BLOCKADE,
  FOOD_INDEX_PLACES,
  HUTT_COIN_WORLDS,
  IMPERIAL_CORE_WORLDS,
  JEDI_MONEY,
  LIFESTYLE_DAY,
  LOAN_TERMS,
  MILITARY_PAY,
  REPUBLIC_CORE_ZONE,
  WAGES,
  type Currency,
  type Zone,
} from '../../data/economy.config';
import { PRICE_BY_ID, type PriceEntry } from '../../data/economyPrices';
import { BLOCKADES } from '../../data/blockades';
import { PLANETS } from '../../data/galaxyMap';
import { WARS } from '../../data/npcGen.config';
import { controlAt, type ControlSide } from '../../data/worldControl';
import { blockadeStartDay } from '../../engine/blockade';
import { absDayFromDate, dateFromAbsDay, formatDate } from '../../engine/calendar';
import {
  acceptanceFor,
  blackMarketX,
  depressionGoods,
  depressionWages,
  depressionWeight,
  foodIndex,
  hashUnit,
  huttCoinBreakdown,
  listPrice,
  monthlyDue,
  npcCarried,
  spendable,
  walletValue,
  wartimeMilitary,
  zoneOfRegion,
  type Acceptance,
  type Market,
  type Wallet,
} from '../../engine/economy';
import type { GameState } from '../../state/gameState';
import { selectCharacter, selectPath } from '../character/selectors';
import { selectLocationChain } from '../locations/selectors';
import { selectPresentNpcIds } from '../pacing/selectors';
import { selectStandingBlockades } from '../world/selectors';
import type { EconomySlice } from './economy';

export const selectEconomy = (s: GameState): EconomySlice => s.economy;
export const selectWallet = (s: GameState): Wallet => s.economy.wallet;

// ---------------------------------------------------------------- the place as a market

export interface Place {
  names: string[];
  zone: Zone;
  /** The side holding it on record, or null. */
  side: ControlSide | null;
  republicCore: boolean;
  imperialCore: boolean;
  huttCoin: boolean;
  atWar: boolean;
  /** The Hydian blockade's first day while it stands and the place feels it (the food index), else null. */
  foodIndexFrom: number | null;
  /** The Treaty's day when the place is Republic space inside the depression's span, else null. */
  depressionFrom: number | null;
}

const norm = (x: string): string => x.trim().toLowerCase();
const PLANET_BY_NAME = new Map(PLANETS.map((p) => [norm(p.name), p]));
const hasName = (names: readonly string[], list: readonly string[]): boolean => names.some((n) => list.some((l) => norm(n) === norm(l)));

/** The side a character's own money is in: the Empire's credit for its people, the Republic's for everyone else. */
export function selectHomeCurrency(s: GameState): 'republic' | 'imperial' {
  const c = selectCharacter(s);
  const side = c.start?.faction ?? null;
  return side === 'sithEmpire' || (side === null && c.path === 'sith') ? 'imperial' : 'republic';
}

/** The day the Treaty was signed in this campaign: the network's record, else the lore's year when it stands as history. */
function treatyDay(s: GameState): number | null {
  const o = s.world.network.outcomes[DEPRESSION.outcome];
  if (o) return o.state === 'produced' ? o.day : null;
  const lore = absDayFromDate({ year: -DEPRESSION.loreBby, month: 1, day: 1 });
  return s.clock.now.day >= lore ? lore : null;
}

/** The side on record now for these names: a change made in play first, then the dated table. */
function sideNow(s: GameState, names: readonly string[], bby: number): ControlSide | null {
  const changed = [...s.world.network.control].reverse().find((c) => names.some((n) => norm(n) === norm(c.place)));
  if (changed) return changed.side;
  return controlAt(names, bby)[0]?.side ?? null;
}

const PLACE_CACHE = new Map<string, Place>();

/** The character's place as a market. Cached by place, month and the campaign's control changes (it is read every day). */
export function selectPlace(s: GameState): Place {
  const day = s.clock.now.day;
  const chain = selectLocationChain(s, s.locations.currentId);
  const names = chain.flatMap((l) => [l.name, ...l.aliases]);
  const key = `${names.join('/')}|${chain.map((l) => l.region).join('/')}|${Math.floor(day / 31)}|${s.world.network.control.length}|${Object.keys(s.world.network.outcomes).length}|${selectCharacter(s).start?.faction ?? selectPath(s)}`;
  const hit = PLACE_CACHE.get(key);
  if (hit) return hit;
  const planet = names.map((n) => PLANET_BY_NAME.get(norm(n))).find((p) => p !== undefined);
  const zone = (planet ? zoneOfRegion(planet.region) : null) ?? chain.map((l) => zoneOfRegion(l.region)).find((z) => z !== null) ?? DEFAULT_ZONE;
  const bby = -dateFromAbsDay(day).year;
  const side = sideNow(s, names, bby);
  const huttCoin = zone === 'hutt' || side === 'hutts' || hasName(names, HUTT_COIN_WORLDS);
  const republicCore = !huttCoin && zone === REPUBLIC_CORE_ZONE && (side === null || side === 'republic');
  const imperialCore = !huttCoin && (side === null || side === 'sithEmpire') && (hasName(names, IMPERIAL_CORE_WORLDS) || (planet?.role.startsWith('IMP-CORE') ?? false));
  const warSide = side ?? (republicCore ? 'republic' : imperialCore ? 'sithEmpire' : null);
  const atWar = warSide !== null && WARS.some((w) => w.factions.includes(warSide) && bby <= w.fromBby && bby >= w.toBby);
  const blockade = hasName(names, FOOD_INDEX_PLACES) ? BLOCKADES.find((b) => b.id === FOOD_INDEX_BLOCKADE) : undefined;
  const standing = blockade ? standingNow(s, blockade.id) : false;
  const treaty = treatyDay(s);
  const republicSpace = side === 'republic' || republicCore;
  const place: Place = {
    names,
    zone,
    side,
    republicCore,
    imperialCore,
    huttCoin,
    atWar,
    foodIndexFrom: blockade && standing ? blockadeStartDay(blockade) : null,
    depressionFrom: republicSpace && treaty !== null && depressionWeight(day - treaty) > 0 ? treaty : null,
  };
  if (PLACE_CACHE.size > 256) PLACE_CACHE.delete(PLACE_CACHE.keys().next().value!);
  PLACE_CACHE.set(key, place);
  return place;
}

/** Whether a blockade stands today in this campaign (the world's record). */
const standingNow = (s: GameState, id: string): boolean => selectStandingBlockades(s).some((b) => b.id === id);

/** The market here: zone and the dated event multipliers by kind of good. */
export function selectMarket(s: GameState): Market {
  const p = selectPlace(s);
  const day = s.clock.now.day;
  const events: Partial<Record<PriceEntry['kind'], number>> = {};
  const mul = (k: PriceEntry['kind'], x: number) => {
    if (x !== 1) events[k] = (events[k] ?? 1) * x;
  };
  if (p.foodIndexFrom !== null) mul('food', foodIndex(day - p.foodIndexFrom));
  if (p.depressionFrom !== null) {
    const g = depressionGoods(depressionWeight(day - p.depressionFrom));
    mul('manufactured', g);
    mul('food', g);
  }
  mul('military', wartimeMilitary(p.atWar));
  return { zone: p.zone, events };
}

export const selectAcceptance = (s: GameState): Acceptance => {
  const p = selectPlace(s);
  return acceptanceFor({ republicCore: p.republicCore, imperialCore: p.imperialCore, huttCoin: p.huttCoin, prefer: p.side === 'sithEmpire' ? 'imperial' : p.side === 'republic' ? 'republic' : selectHomeCurrency(s) });
};

/** The currency paid out here: Hutt coin where it rules, else the place's credit. */
export function selectLocalCurrency(s: GameState): Currency {
  const a = selectAcceptance(s);
  return a.hutt ? 'hutt' : a.prefer;
}

/** An item's list price here (before haggling), or null for an unknown id. */
export function selectListPrice(s: GameState, id: string): number | null {
  const item = PRICE_BY_ID.get(id);
  return item ? listPrice(item, selectMarket(s)) : null;
}

/** Wages are lower in Republic space through the depression. */
export function selectWageFactor(s: GameState): number {
  const p = selectPlace(s);
  return p.depressionFrom === null ? 1 : depressionWages(depressionWeight(s.clock.now.day - p.depressionFrom));
}

/** Monthly income from the job (no one-off pay). */
export function selectMonthlyIncome(s: GameState): number {
  const j = s.economy.job;
  if (j.kind === 'military') return MILITARY_PAY[j.grade];
  if (j.kind === 'wage') return Math.round(WAGES[j.tier] * (j.currency === 'republic' ? selectWageFactor(s) : 1));
  return 0;
}

/** A day's living here, in credits. */
export function selectLivingCost(s: GameState): number {
  const base = LIFESTYLE_DAY[s.economy.lifestyle];
  if (base === 0) return 0;
  const m = selectMarket(s);
  const service = listPrice({ base, kind: 'service', legality: 'legal' }, m);
  // Half of living is food (invented): the food index reaches it.
  const food = m.events.food ?? 1;
  return Math.round(service * (0.5 + 0.5 * food));
}

// ---------------------------------------------------------------- the Jedi and money

export const selectIsJedi = (s: GameState): boolean => selectPath(s) === 'jedi';
/** A Jedi present in the scene (a Jedi role or the Order's faction), who would see a reward kept. */
export function selectJediWitness(s: GameState): string | null {
  for (const id of selectPresentNpcIds(s)) {
    const n = s.npcs.byId[id];
    if (n && n.status === 'active' && (n.factionId === 'jediOrder' || ['jediMaster', 'jediKnight', 'padawan', 'initiate'].includes(n.role))) return n.name;
  }
  return null;
}
/** Personal wealth for attachment: the wallet and the goods bought, the Order's funds aside. */
export const selectJediWealth = (s: GameState): number => Math.round(walletValue(s.economy.wallet) + s.economy.possessions);
/** Known rewards inside the pattern window. */
export const selectKnownRewards = (s: GameState): number => s.economy.rewards.filter((r) => r.known && s.clock.now.day - r.day <= JEDI_MONEY.patternDays).length;
/** An NPC Jedi less firmly light, who might keep a reward now and then (rare; by the NPC's own seed). */
export const selectNpcJediMayKeep = (s: GameState, npcId: string): boolean => {
  const n = s.npcs.byId[npcId];
  return !!n && (n.factionId === 'jediOrder' || n.role.startsWith('jedi') || n.role === 'padawan') && hashUnit(`${npcId}:keeps`) < JEDI_MONEY.npcKeepsShare;
};

// ---------------------------------------------------------------- NPCs

/** Credits an NPC has on them now: what they carry less what was taken. */
export function selectNpcPurse(s: GameState, npcId: string): number {
  const n = s.npcs.byId[npcId];
  if (!n) return 0;
  return Math.max(0, npcCarried(n.id, n.role, n.gen?.archetype ?? null) - (s.economy.looted[npcId] ?? 0));
}

// ---------------------------------------------------------------- the narrator's lines

function walletText(w: Wallet): string {
  const parts: string[] = [];
  if (w.republic) parts.push(`${w.republic.toLocaleString('en-US')} ${CURRENCY_NAMES.republic}`);
  if (w.imperial) parts.push(`${w.imperial.toLocaleString('en-US')} ${CURRENCY_NAMES.imperial}`);
  if (w.hutt) {
    const b = huttCoinBreakdown(w.hutt);
    parts.push(`Hutt coin (${b.peggat} peggats, ${b.trugut} truguts, ${b.wupiupi} wupiupi)`);
  }
  return parts.length ? parts.join(', ') : 'no money';
}

/** ECONOMY lines for the state block: the wallet, what the place takes, living, the job, debts, and what is owed now. */
export function selectEconomyLines(s: GameState): string[] {
  const e = s.economy;
  const a = selectAcceptance(s);
  const p = selectPlace(s);
  const takes = [a.hutt ? 'Hutt coin' : null, a.republic ? CURRENCY_NAMES.republic : null, a.imperial ? CURRENCY_NAMES.imperial : null].filter(Boolean).join(', ');
  const refused = !a.republic ? CURRENCY_NAMES.republic : !a.imperial ? CURRENCY_NAMES.imperial : null;
  const lines = [
    `ECONOMY (the engine owns every credit: report trades, pay, bribes, loans and fines with the economy events, and never state an amount the engine did not give): ${walletText(e.wallet)}${e.orderFunds ? `; the Order's mission funds ${e.orderFunds.toLocaleString('en-US')} cr (to be returned)` : ''}; spendable here ${Math.floor(spendable(e.wallet, a)).toLocaleString('en-US')} cr.`,
    `Money here: takes ${takes}${refused ? `; ${refused} refused` : ''}${a.creditMarkup > 1 ? `; credits at a ${Math.round((a.creditMarkup - 1) * 100)}% markup` : ''}${a.changer ? '; a money changer can be found' : ''}; restricted goods only on the black market (x${blackMarketX(p.zone)}).`,
    `Living: ${e.lifestyle}${e.lifestyle === 'provided' ? ' (room and board provided)' : ` (${selectLivingCost(s)} cr a day)`}; job: ${jobText(s)}.`,
  ];
  if (e.destituteSince !== null) lines.push(`Destitute since ${formatDate(e.destituteSince)}: no money even for a poor living.`);
  for (const l of e.loans) lines.push(`Debt: ${l.balance.toLocaleString('en-US')} cr to ${LOAN_TERMS[l.lender].name}, next payment ${monthlyDue(l).toLocaleString('en-US')} cr due ${formatDate(l.nextDueDay)}${l.stage !== 'current' ? `; ${stageText(l.stage)}` : ''}.`);
  const untold = e.log.filter((x) => x.toldTurn === null).slice(-6);
  if (untold.length) lines.push(`Money since last told (engine amounts; narrate these, no others): ${untold.map((x) => `${x.credits > 0 ? '+' : ''}${x.credits.toLocaleString('en-US')} ${x.currency === 'hutt' ? 'cr in Hutt coin' : 'cr'} (${x.reason})`).join('; ')}.`);
  if (selectIsJedi(s)) lines.push("The character is a Jedi: the Order provides room, board and gear (trade dir issue); mission funds are returned; a reward kept is the player's choice (money kind reward).");
  const keepers = selectPresentNpcIds(s).filter((id) => selectNpcJediMayKeep(s, id)).map((id) => s.npcs.byId[id]!.name);
  if (keepers.length) lines.push(`${keepers.join(', ')}: a Jedi less firmly light, who might keep a reward now and then (rare).`);
  return lines;
}

function jobText(s: GameState): string {
  const j = s.economy.job;
  if (j.kind === 'order') return 'the Jedi Order (no pay)';
  if (j.kind === 'military') return `military, ${j.grade} (${MILITARY_PAY[j.grade].toLocaleString('en-US')} ${CURRENCY_NAMES[j.currency]} a month)`;
  if (j.kind === 'wage') return `${j.tier} work (${selectMonthlyIncome(s).toLocaleString('en-US')} cr a month)`;
  return 'none';
}

const stageText = (stage: string): string => (stage === 'warning' ? 'a payment missed: the lender has sent a warning' : stage === 'collectors' ? 'collectors are coming for the money' : 'the lender has put a bounty on the debtor');
