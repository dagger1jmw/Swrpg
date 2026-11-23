// The Jedi Order's rules on Force powers (D-436; M6 catalog integration with M7 standing; force-catalog-m6.md §2-3,
// D-346). Each ability in the code's catalog has an Order status:
//  - open: the Order teaches it (by rank, as the training rules already gate it);
//  - forbidden (the D-346 learning class): a Padawan or Knight needs a Master's permission; a Master may study it under
//    controlled conditions; the years say when the rule holds (absent = every era);
//  - darkSide: a dark-side power; the Order never teaches or permits it (design default, D-436, until alignment, M6).
// Learning a forbidden or dark-side power without permission is covert: Order teachers refuse it, and each covert session
// risks discovery, which costs Order standing (COVERT_LEARNING). Only Jedi-path characters are bound by these rules.

export type OrderPowerStatus = 'open' | 'forbidden' | 'darkSide';

export interface OrderPowerRule {
  status: OrderPowerStatus;
  /** Forbidden from this year (negative = BBY); before it the power is open (or lore-locked by its own availability). */
  fromYear?: number;
  /** Masters may study it under controlled conditions from this year (D-346: Electric Judgment from 990 BBY); absent = always. */
  masterStudyFromYear?: number;
  /** No longer forbidden from this year (the New Jedi Order uses Electric Judgment openly). */
  untilYear?: number;
  source: string;
}

/** The forbidden powers (D-346) and the dark-side powers in the code's catalog; every other ability is open. */
export const ORDER_POWER_RULES: Readonly<Record<string, OrderPowerRule>> = {
  electricJudgment: { status: 'forbidden', masterStudyFromYear: -990, untilYear: 5, source: 'D-346 (Part3b f7): forbidden to Knights; controlled study by Masters from 990 BBY; used openly by the New Jedi Order (from about 5 ABY: design default)' },
  deadlySight: { status: 'forbidden', source: 'D-346 (Part3b f8): forbidden to Jedi Knights' },
  morichro: { status: 'forbidden', fromYear: -1000, source: 'D-346 (Part3b f10): forbidden by 1000 BBY, Yaddle the exception; lore-locked before (force-catalog-m6 §5)' },
  forceLightning: { status: 'darkSide', source: 'a dark-side power (skills.ts side dark); the Order never teaches it (design default, D-436)' },
  forceChoke: { status: 'darkSide', source: 'a dark-side power (skills.ts side dark); the Order never teaches it (design default, D-436)' },
};

/**
 * Covert learning (D-436; invented): each covert session is discovered with chance perHour x hours (at most maxChance);
 * a discovery costs `standingPenalty` points of Order standing, and the penalty fades by `decayPerYear` points a year.
 */
export const COVERT_LEARNING = { perHour: 0.03, maxChance: 0.25, standingPenalty: 15, decayPerYear: 5 } as const;
