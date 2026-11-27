// The economy's numbers (M8 checklist item 5; docs-v2/spec/economy.md). Lore: Docs/SWRPG lore/SW_Economy_* with the D-464
// rulings. Every number not on record is marked invented, here and in the spec's table. Prices are in economyPrices.ts, ships
// in shipPrices.ts; the rules that read these are in src/engine/economy.ts.

// ---------------------------------------------------------------- places

/** Price zones by where a world lies: cheap Core manufactured goods, dearer in the Outer Rim and Hutt space, dearer still on remote worlds. */
export const ZONES = ['core', 'mid', 'outer', 'hutt', 'remote'] as const;
export type Zone = (typeof ZONES)[number];

/** Region names in the planets files (galaxyMap.generated.ts), matched by their start. */
export const ZONE_BY_REGION: readonly (readonly [string, Zone])[] = [
  ['Core Worlds', 'core'],
  ['Deep Core', 'core'],
  ['Colonies', 'core'],
  ['Inner Rim', 'core'],
  ['Expansion Region', 'mid'],
  ['Mid Rim', 'mid'],
  ['The Slice', 'mid'],
  ['Hutt Space', 'hutt'],
  ['Outer Rim', 'outer'],
  ['Wild Space', 'remote'],
  ['Unknown Regions', 'remote'],
];
/** A world whose region is not known prices as the Mid Rim. */
export const DEFAULT_ZONE: Zone = 'mid';

/** The location multiplier (invented). Manufactured and military goods take it in full; food, services and luxuries take half the swing. */
export const LOCATION_FACTOR: Readonly<Record<Zone, number>> = { core: 0.85, mid: 1, outer: 1.25, hutt: 1.3, remote: 1.6 };
export const HALF_SWING_KINDS: readonly string[] = ['food', 'service', 'luxury'];

/** Restricted goods: the black market only, at x2-5 by how hard the law presses (Jared's range; the split by zone is invented). */
export const BLACK_MARKET_X: Readonly<Record<Zone, number>> = { hutt: 2, remote: 2.5, outer: 3, mid: 4, core: 5 };

// ---------------------------------------------------------------- haggling and selling

/** A Charisma contest moves the price within +/-20% (Jared): factor = 1 - maxShift x tanh(margin / scale); scale invented. */
export const HAGGLE = { maxShift: 0.2, scale: 10 } as const;
/** A merchant with no NPC sheet haggles at this level (invented: a Journeyman's Charisma). */
export const MERCHANT_LEVEL = 40;
/** A dealer pays about half the base (Jared); a fence 25-40% for stolen or restricted goods (Jared), the haggle moving it. */
export const SELL = { dealer: 0.5, fence: { min: 0.25, max: 0.4 } } as const;

// ---------------------------------------------------------------- currencies

export const CURRENCIES = ['republic', 'imperial', 'hutt'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const CURRENCY_NAMES: Readonly<Record<Currency, string>> = { republic: 'Republic credits', imperial: 'Imperial credits', hutt: 'Hutt coin' };

/**
 * Hutt coins in credits (game stat: Secrets of Tatooine, WotC 2001; SW_Economy_Currencies). The wallet holds Hutt coin as a
 * count of wupiupi, so every sum is exact: a trugut is 16 wupiupi, a peggat 64.
 */
export const HUTT_COINS = { peggat: 40, trugut: 10, wupiupi: 0.625 } as const;
/** Credits are taken in Hutt space at this markup (invented). */
export const HUTT_CREDIT_MARKUP = 1.25;
/** Worlds that deal in Hutt coin besides Hutt space itself (SW_Economy_Currencies: Tatooine prefers it). */
export const HUTT_COIN_WORLDS: readonly string[] = ['Tatooine'];

/**
 * The Republic credit and the Imperial credit: equal face value (no rate on record), each refused on the other side's core
 * worlds (Jared). Republic core: a Core region world the Republic holds or that has no control on record. Imperial core: the
 * Empire's own worlds below, or a world the planets file marks IMP-CORE, while the Empire holds it.
 */
export const REPUBLIC_CORE_ZONE: Zone = 'core';
export const IMPERIAL_CORE_WORLDS: readonly string[] = ['Dromund Kaas', 'Kaas City', 'Korriban', 'Ziost'];
/** A money changer in border and neutral space takes 10-20% (Jared, invented); the haggle moves it inside the range. */
export const CHANGER_CUT = { min: 0.1, max: 0.2 } as const;

// ---------------------------------------------------------------- dated events

/**
 * The Hydian blockade's Coruscant food index (invented numbers; the lore has only "risen dramatically" and "highly inflated
 * prices": SW_Coruscant_City_GGW_Part1). Food on Coruscant, by days since the blockade began, while it stands.
 */
export const CORUSCANT_FOOD_INDEX: readonly (readonly [number, number])[] = [
  [0, 1.3],
  [90, 2],
  [200, 3],
  [368, 4],
];
export const FOOD_INDEX_PLACES: readonly string[] = ['Coruscant'];
export const FOOD_INDEX_BLOCKADE = 'hydian-way-3661';

/**
 * The post-Treaty depression in Republic space, "at least a decade" from 3,653 (SW_Economy_Events). From the Treaty's day,
 * fading smoothly to nothing over `years` (invented): goods dearer by scarcity, wages lower.
 */
export const DEPRESSION = { outcome: 'O.treaty_signed', loreBby: 3653, years: 10, goods: 1.15, wages: 0.8 } as const;

/** Military goods in wartime, on worlds of a side at war (data/wars.ts): dearer by shortage (invented). */
export const WARTIME_MILITARY_X = 1.5;

// ---------------------------------------------------------------- income

/**
 * Military pay a month by grade (invented ladder, through the game anchors: 500 cr scouts, 2,000 cr a pilot, 3,200 cr a
 * smuggler's salary; SW_Economy_Wages_Bounties, game stat). Equal for the Republic and the Empire, each in its own credit.
 */
export const MILITARY_GRADES = ['private', 'corporal', 'sergeant', 'lieutenant', 'captain', 'major', 'colonel', 'general'] as const;
export type MilitaryGrade = (typeof MILITARY_GRADES)[number];
export const MILITARY_PAY: Readonly<Record<MilitaryGrade, number>> = { private: 500, corporal: 700, sergeant: 1000, lieutenant: 2000, captain: 2600, major: 3200, colonel: 4500, general: 8000 };
/** Kit the military issues free by grade (invented), on top of rations and quarters (barracks: the lifestyle is provided). */
export const MILITARY_KIT: Readonly<Record<'enlisted' | 'nco' | 'officer', readonly string[]>> = {
  enlisted: ['rifle', 'armorMedium', 'fragGrenade', 'medpac', 'comlink', 'powerPack', 'rations', 'clothes', 'utilityBelt', 'backpack', 'breathMask', 'glowrod'],
  nco: ['rifle', 'pistol', 'armorMedium', 'fragGrenade', 'medpac', 'comlink', 'powerPack', 'rations', 'clothes', 'utilityBelt', 'backpack', 'breathMask', 'glowrod', 'macrobinoculars', 'lightRepeater', 'binders'],
  officer: ['pistol', 'armorMedium', 'medpac', 'comlink', 'powerPack', 'rations', 'clothes', 'utilityBelt', 'backpack', 'breathMask', 'glowrod', 'macrobinoculars', 'datapad'],
};
export const gradeBand = (g: MilitaryGrade): keyof typeof MILITARY_KIT => (MILITARY_GRADES.indexOf(g) <= 1 ? 'enlisted' : g === 'sergeant' ? 'nco' : 'officer');

/** Wages a month by job (game defaults, Jared: GG8 scouts 500, WotC Core pilot 2,000, AJ8 smuggler's salary 3,200). */
export const WAGE_TIERS = ['menial', 'skilled', 'professional'] as const;
export type WageTier = (typeof WAGE_TIERS)[number];
export const WAGES: Readonly<Record<WageTier, number>> = { menial: 500, skilled: 2000, professional: 3200 };

/** One-off pay by tier 1-3. Each is drawn inside its band, evenly on a log scale (the engine's roll). */
export const PAY_KINDS = ['bounty', 'contract', 'smuggling', 'job', 'reward', 'missionFunds'] as const;
export type PayKind = (typeof PAY_KINDS)[number];
export const PAY_BANDS: Readonly<Record<PayKind, readonly (readonly [number, number])[]>> = {
  // Street, notable, galaxy-class (Game notes bands; Taris 300-1,500 in 3,956, Bowdaar 30,000 by 3,643, Gault over 2 million in 3,643).
  bounty: [[500, 5000], [10_000, 100_000], [250_000, 2_000_000]],
  // A mercenary job (Khoonda 1,000 cr a fighter, 3,951; Dharus 30,000 cr a day to command an army, 19 ABY); the middle invented.
  contract: [[800, 1500], [3000, 8000], [20_000, 40_000]],
  // A smuggler's cut of a run (a passenger run 500, 3,951; a crew's 5,000 on the Sisar Run, c. 3 ABY; a 10,000 cargo run, c. 2 BBY).
  smuggling: [[300, 800], [3000, 7000], [8000, 15_000]],
  // Odd jobs before risk (Czerka's 200 for Batono, 3,951; farmer Jon's 1,000 reward, 3,956); the top band invented.
  job: [[100, 300], [400, 1200], [1500, 4000]],
  // A reward offered (Shaelas turned down 500, 3,956; farmer Jon's 1,000); the top band invented.
  reward: [[150, 400], [500, 1500], [3000, 8000]],
  // The Order's expense funds for a mission, returned when it ends (Power of the Jedi Sourcebook, game stat); amounts invented.
  missionFunds: [[300, 600], [1500, 3000], [8000, 15_000]],
};
/** Odd jobs pay by risk (invented). */
export const RISK_X = { low: 1, medium: 2, high: 4 } as const;
export type Risk = keyof typeof RISK_X;

// ---------------------------------------------------------------- living costs

/** A day's living by tier, anchored on the 50 cr/day budget traveller (SW_Economy_Prices_Goods); the other tiers invented. */
export const LIFESTYLES = ['provided', 'poor', 'modest', 'comfortable', 'wealthy'] as const;
export type Lifestyle = (typeof LIFESTYLES)[number];
export const LIFESTYLE_DAY: Readonly<Record<Lifestyle, number>> = { provided: 0, poor: 20, modest: 50, comfortable: 120, wealthy: 400 };

// ---------------------------------------------------------------- debt

/**
 * Lenders (SW_Economy_Institutions_Debt): a bank's 15% (Zygian's, game stat) against loan sharks' 300% or more (game stat);
 * the Exchange's rate and every term invented. The sizes: the Exchange's 100,000 cr advance to Zeerid Korr (3,653) is a large one.
 */
export const LENDERS = ['bank', 'hutt', 'exchange'] as const;
export type Lender = (typeof LENDERS)[number];
export const LOAN_TERMS: Readonly<Record<Lender, { yearRate: number; months: number; name: string }>> = {
  bank: { yearRate: 0.15, months: 24, name: 'a bank' },
  hutt: { yearRate: 3, months: 6, name: 'a Hutt' },
  exchange: { yearRate: 3.5, months: 6, name: 'the Exchange' },
};
export const LOAN_SIZES = { small: 1000, fair: 10_000, large: 100_000 } as const;
/** A bank lends no more than this many months of the borrower's pay (invented); Hutts and the Exchange lend to anyone. */
export const BANK_INCOME_MONTHS = 6;
/** Missed payments: a warning, then collectors, then a bounty on the debtor (Jared), by count missed. */
export const DEBT_STAGES = ['current', 'warning', 'collectors', 'bounty'] as const;
export type DebtStage = (typeof DEBT_STAGES)[number];

// ---------------------------------------------------------------- fines, bribes and NPC wealth

/** Fines by size (invented; a spice-smuggling fine up to 5,000 cr, game stat; a boarding fine 1,000, blockade.config). */
export const FINE_SIZES = { small: 100, fair: 1000, large: 5000 } as const;

/** A bribe as months of the target's pay (invented): a token, a fair price, generous, lavish. */
export const BRIBE_SIZES = { small: 0.1, fair: 0.5, large: 1, lavish: 3 } as const;
export type BribeSize = keyof typeof BRIBE_SIZES;
/** The check: Charisma against this rating, +modPerDoubling per doubling of the offer over a fair one (invented). */
export const BRIBE_CHECK = { rating: 50, modPerDoubling: 3 } as const;

/** Monthly pay by NPC role (invented, on the wage and military ladders): what a bribe is judged against. */
export const ROLE_PAY: Readonly<Record<string, number>> = {
  soldier: 500, officer: 2600, pilot: 2000, politician: 10_000, official: 2000, merchant: 3200, smuggler: 3200, criminal: 1000, bountyHunter: 3200,
  scholar: 2000, healer: 3200, servant: 300, civilian: 1000, other: 1000,
  jediMaster: 0, jediKnight: 0, padawan: 0, initiate: 0, sithLord: 5000, sithAcolyte: 0, darkJedi: 1000, darkAcolyte: 0, inquisitor: 3200, droid: 0,
};
/** The share of each role that refuses any bribe (invented); every Jedi refuses, and a droid cannot be bribed. */
export const HONEST_SHARE: Readonly<Record<string, number>> = {
  official: 0.3, officer: 0.4, soldier: 0.3, pilot: 0.3, politician: 0.2, merchant: 0.2, healer: 0.5, scholar: 0.4, civilian: 0.3, servant: 0.2,
  criminal: 0, smuggler: 0.05, bountyHunter: 0.1, sithLord: 0.1, darkJedi: 0.05, inquisitor: 0.2, sithAcolyte: 0.1, darkAcolyte: 0.05,
  jediMaster: 1, jediKnight: 1, padawan: 1, initiate: 1, droid: 1, other: 0.3,
};

/** Credits a generated NPC carries: months of its pay, drawn from its seed (invented); a floor for the unpaid. */
export const CARRIED_MONTHS: Readonly<Record<string, readonly [number, number]>> = {
  criminal: [0.3, 1.5], smuggler: [0.2, 1], bountyHunter: [0.2, 1], merchant: [0.1, 0.5], politician: [0.05, 0.2], default: [0.05, 0.3],
};
export const CARRIED_FLOOR: Readonly<Record<string, readonly [number, number]>> = { jediMaster: [0, 50], jediKnight: [0, 50], padawan: [0, 10], initiate: [0, 0], droid: [0, 0], default: [5, 50] };
/** A crime lord's archetype carries far more than its role's pay says (invented). */
export const ARCHETYPE_CARRIED_X: Readonly<Record<string, number>> = { crimeLord: 10 };

// ---------------------------------------------------------------- the Jedi and money (Jared)

export const JEDI_MONEY = {
  /** Known acceptances in this many days that make a pattern (invented). */
  patternDays: 2 * 368,
  patternCount: 3,
  /** Order standing lost when the pattern is known (invented). */
  patternStanding: 5,
  /**
   * Personal holdings past this count as amassing wealth (Jared, D-511: 25,000, was 10,000). Order-issued gear, mission funds and
   * Order ships never count, and neither does a personal ship or droid taken in play (`notHoldings`).
   */
  wealth: 25_000,
  /** Catalog rows a Jedi may come to own in play that are never personal holdings (D-511): droids; ships are not sold through `trade`. */
  notHoldings: ['protocolDroid', 'astromech', 'medDroid'] as readonly string[],
  /** Order standing lost for amassing wealth (invented, as covert learning's 15). */
  wealthStanding: 15,
  /** Basic gear the quartermaster issues to any Jedi; armour too from Knight (invented). */
  quartermaster: ['clothes', 'rations', 'medpac', 'comlink', 'glowrod', 'breathMask', 'utilityBelt', 'backpack', 'macrobinoculars', 'datapad'] as readonly string[],
  quartermasterKnight: ['armorLight', 'armorMedium', 'armorHeavy'] as readonly string[],
  /** The share of NPC Jedi less firmly light who might keep a reward now and then (invented: rare, Jared). */
  npcKeepsShare: 0.03,
} as const;

// ---------------------------------------------------------------- starts

/** Money, job and lifestyle by start option (invented; Jedi and Sith acolytes own nothing, the Order or the Academy keeps them). */
export interface StartMoney {
  credits: number;
  currency: Currency;
  job: { kind: 'none' } | { kind: 'order' } | { kind: 'military'; grade: MilitaryGrade } | { kind: 'wage'; tier: WageTier };
  lifestyle: Lifestyle;
}
export const START_MONEY: Readonly<Record<string, StartMoney>> = {
  'jedi-temple': { credits: 0, currency: 'republic', job: { kind: 'order' }, lifestyle: 'provided' },
  'jedi-front': { credits: 0, currency: 'republic', job: { kind: 'order' }, lifestyle: 'provided' },
  'korriban-acolyte': { credits: 0, currency: 'imperial', job: { kind: 'none' }, lifestyle: 'provided' },
  'kaas-imperial-born': { credits: 2000, currency: 'imperial', job: { kind: 'none' }, lifestyle: 'provided' },
  'korriban-slave': { credits: 0, currency: 'imperial', job: { kind: 'none' }, lifestyle: 'provided' },
  'mandalorian-blockade': { credits: 1500, currency: 'imperial', job: { kind: 'wage', tier: 'skilled' }, lifestyle: 'provided' },
  'mandalorian-nomad': { credits: 800, currency: 'republic', job: { kind: 'none' }, lifestyle: 'poor' },
  'underworld-smuggler': { credits: 2000, currency: 'republic', job: { kind: 'none' }, lifestyle: 'modest' },
  'underworld-orphan': { credits: 20, currency: 'republic', job: { kind: 'none' }, lifestyle: 'poor' },
  'underworld-mechanic': { credits: 300, currency: 'republic', job: { kind: 'wage', tier: 'skilled' }, lifestyle: 'modest' },
  'coruscant-lower-levels': { credits: 50, currency: 'republic', job: { kind: 'wage', tier: 'menial' }, lifestyle: 'poor' },
  'republic-trooper': { credits: 200, currency: 'republic', job: { kind: 'military', grade: 'private' }, lifestyle: 'provided' },
  'republic-pilot': { credits: 500, currency: 'republic', job: { kind: 'military', grade: 'lieutenant' }, lifestyle: 'provided' },
  'sis-agent': { credits: 1000, currency: 'republic', job: { kind: 'wage', tier: 'professional' }, lifestyle: 'modest' },
  'imperial-soldier': { credits: 200, currency: 'imperial', job: { kind: 'military', grade: 'private' }, lifestyle: 'provided' },
  'imperial-officer': { credits: 1000, currency: 'imperial', job: { kind: 'military', grade: 'lieutenant' }, lifestyle: 'provided' },
  'imperial-agent': { credits: 1000, currency: 'imperial', job: { kind: 'wage', tier: 'professional' }, lifestyle: 'modest' },
};
/** No start option (tests, old saves): by path. */
export const PATH_MONEY: Readonly<Record<string, StartMoney>> = {
  jedi: START_MONEY['jedi-temple']!,
  sith: START_MONEY['korriban-acolyte']!,
  outsider: { credits: 100, currency: 'republic', job: { kind: 'none' }, lifestyle: 'modest' },
  career: { credits: 500, currency: 'republic', job: { kind: 'none' }, lifestyle: 'modest' },
};

/** The log keeps this many entries. */
export const ECONOMY_LOG_MAX = 50;
