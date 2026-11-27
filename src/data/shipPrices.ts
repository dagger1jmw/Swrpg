// Ship prices and running costs (M8 checklist item 5, for item 13; docs-v2/spec/economy.md section 2c). The ship classes are
// combat-scales' (ships.ts). A class with a price on record uses it; the rest follow a smooth curve on length through the
// anchors of their group (invented). Lore: SW_Economy_Prices_Ships_Weapons_Droids (tier 1). Running costs: docking and
// departure fees and the uplink rate are on record; fuel, upkeep and repair shares are invented.
import type { ShipKind } from './ships';

export interface ShipPriceAnchor {
  /** New, Republic credits. */
  price: number;
  source: string;
  /** Derived from a recorded ratio rather than stated. */
  inferred?: boolean;
}

const PS = 'SW_Economy_Prices_Ships_Weapons_Droids';

/** Recorded prices by ship class (ships.ts ids). The credit is stable across eras, so a later era's price stands for the class. */
export const SHIP_PRICE_ANCHORS: Readonly<Record<string, ShipPriceAnchor>> = {
  xwing: { price: 150_000, source: `${PS}: T-65 X-wing 149,999 cr new (Fact File)` },
  ywing: { price: 135_000, source: `${PS}: BTL Y-wing 134,999 cr new (Fact File)` },
  tied: { price: 300_000, source: `${PS}: TIE/D Defender 300,000 cr a unit (EGVV)` },
  tieln: { price: 60_000, source: `${PS}: the TIE/D costs more than five TIE fighters (300,000 / 5)`, inferred: true },
  nebulonB: { price: 19_400_000, source: `${PS}: EF76 Nebulon-B 19.4 million cr, 1/20 of a Star Destroyer` },
  isd1: { price: 388_000_000, source: `${PS}: twenty Nebulon-B frigates (19.4 million x 20)`, inferred: true },
  lucrehulk: { price: 40_000_000, source: `${PS}: Lucrehulk not for sale, black-market value 40 million cr` },
  inexpugnable: { price: 70_000_000, source: `${PS}: Courageous (Inexpugnable-class) valued at 70 million cr (c. 3,963)` },
};

/** The curve where no price is on record: price = at x (length / len) ^ power, by group (invented; capital fits the Nebulon-B and ISD). */
export const SHIP_PRICE_CURVE: Readonly<Record<'fighter' | 'freighter' | 'capital', { at: number; len: number; power: number; source: string }>> = {
  fighter: { at: 150_000, len: 12.5, power: 1, source: 'through the X-wing (invented power)' },
  freighter: { at: 85_000, len: 27, power: 1.5, source: `${PS}: YT-1000 85,000 cr new (invented power)` },
  capital: { at: 19_400_000, len: 300, power: 1.79, source: 'through the Nebulon-B (300 m) and the ISD (1,600 m)' },
};

/** A used ship sells for this share of new (invented; on record 24-60%: YT-1000 20,000 of 85,000, X-wing 90,000 of 149,999). */
export const SHIP_USED_SHARE = 0.5;

/** Ship upkeep (the lifestyle covers the crew's food; this is the ship). */
export interface RunningCosts {
  /** A day in a docking bay, Mid Rim. */
  dockingPerDay: number;
  /** Fuel for one hyperspace jump. */
  fuelPerJump: number;
  /** Routine upkeep a month, as a share of the ship's price (freighters 0.1%, Jared; warships unchanged). */
  upkeepShare: number;
}

export const RUNNING_COSTS: Readonly<Record<ShipKind, RunningCosts>> = {
  fighter: { dockingPerDay: 15, fuelPerJump: 50, upkeepShare: 0.01 },
  // Freighters and light ships about 0.1% of their value a month (Jared, 26 Nov 2026; m8-ground Part B1, D-521): the start XS about 615 cr.
  freighter: { dockingPerDay: 30, fuelPerJump: 200, upkeepShare: 0.001 },
  corvette: { dockingPerDay: 200, fuelPerJump: 2000, upkeepShare: 0.008 },
  frigate: { dockingPerDay: 1000, fuelPerJump: 10_000, upkeepShare: 0.006 },
  heavyCruiser: { dockingPerDay: 3000, fuelPerJump: 40_000, upkeepShare: 0.005 },
  starDestroyer: { dockingPerDay: 10_000, fuelPerJump: 150_000, upkeepShare: 0.004 },
  battleship: { dockingPerDay: 15_000, fuelPerJump: 250_000, upkeepShare: 0.004 },
  battlecruiser: { dockingPerDay: 20_000, fuelPerJump: 300_000, upkeepShare: 0.004 },
  dreadnought: { dockingPerDay: 50_000, fuelPerJump: 1_000_000, upkeepShare: 0.003 },
};

/** Fees on record. */
export const SHIP_FEES = {
  /** On arrival at a port that charges by arrival (Ahto City, Czerka at Anchorhead: 100 cr, 3,956). */
  arrival: 100,
  /** Leaving an Exchange-run dock in Hutt space (Lasavvou: 600 cr, 3,956; Nar Shaddaa, 3,951). */
  exchangeDeparture: 600,
  /** Hyperspace coordinates bought at a station, per metric ton of cargo capacity (Crystal Web Station). */
  navUplinkPerTon: 10,
} as const;

/** Repairs as a share of the ship's price by damage (invented; a landing strut on record at 200 cr, c. 22 BBY). */
export const REPAIR_SHARE = { light: 0.02, heavy: 0.1, crippled: 0.3 } as const;
