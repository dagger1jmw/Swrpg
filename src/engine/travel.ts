// Travel between worlds (m7-start-checklist.md item 26; D-402 [3], D-405). Pure: given two map worlds, the date, the
// traveller's side and ship class, the trip's hours or the reason it can't be made. Numbers in data/travel.config.ts
// (all invented).
import type { BlockadeDef } from '../data/blockades';
import { ASTEROID_FACTOR, CLIMB_OUT_HOURS, DEEP_CORE, MAELSTROM_SUBLIGHT_HOURS, OFF_LANE, REGION_RATES, type RegionRate } from '../data/travel.config';

export interface TravelWorld {
  name: string;
  region: string;
  grid: string;
  /** A station or ship (shorter climb-out) rather than a planet or moon. */
  station?: boolean;
  /** The blockaded routes it lies on (from the map's route data, D-406). */
  onRoutes?: readonly string[];
}

export interface TripInput {
  from: TravelWorld;
  to: TravelWorld;
  /** The blockades standing now (M8 item 4, D-469). */
  blockades?: readonly BlockadeDef[];
  /** The blockade this trip runs (its approach was played): it neither refuses the trip nor lengthens it. */
  runs?: string;
  /** The traveller's faction (for a blockade). */
  faction: string;
  shipClass: number;
  offLane?: boolean;
  /** A closed world's reason (src/data/galaxyMap.ts closedWorlds), when the destination is closed to this side. */
  closedReason?: string;
}

export type TripPlan =
  | { ok: true; hours: number; squares: number; rate: string; parts: readonly string[]; notes: readonly string[] }
  | { ok: false; reason: string; blockadeId?: string };

/** "L-9" -> { col: 11, row: 9 }; null for a missing or Canon-only grid. */
export function parseGrid(grid: string): { col: number; row: number; letter: string } | null {
  const m = /^([A-Z])-(\d+)$/.exec(grid.trim());
  return m ? { col: m[1]!.charCodeAt(0) - 64, row: Number(m[2]), letter: m[1]! } : null;
}

/** Grid squares between two worlds (moving one square in any direction, diagonals included). */
export function gridDistance(a: string, b: string): number | null {
  const p = parseGrid(a);
  const q = parseGrid(b);
  return p && q ? Math.max(Math.abs(p.col - q.col), Math.abs(p.row - q.row)) : null;
}

function regionRate(region: string): { index: number; label: string; rate: RegionRate; deep: boolean } | null {
  if (DEEP_CORE.match.test(region)) {
    const core = REGION_RATES[0]!;
    return { index: 0, label: 'Deep Core', rate: core.rate, deep: true };
  }
  const i = REGION_RATES.findIndex((r) => r.match.test(region));
  return i < 0 ? null : { index: i, label: REGION_RATES[i]!.label, rate: REGION_RATES[i]!.rate, deep: false };
}

/** Whether a world lies in the blockade's strip, or is one of the worlds it closes. */
export function inZone(b: BlockadeDef, w: TravelWorld): boolean {
  if (b.zone.worlds?.includes(w.name)) return true;
  const g = parseGrid(w.grid);
  if (!g || !b.zone.columns || b.zone.rowFrom === undefined || b.zone.rowTo === undefined) return false;
  return b.zone.columns.includes(g.letter) && g.row >= b.zone.rowFrom && g.row <= b.zone.rowTo;
}

/** Whether the world itself is closed by it: a listed world, or one on the route inside the strip. */
export const blocks = (b: BlockadeDef, w: TravelWorld): boolean => b.zone.worlds?.includes(w.name) === true || (inZone(b, w) && b.zone.route !== undefined && (w.onRoutes ?? []).includes(b.zone.route));

/** A trip along the blockaded route through the strip: both ends on it, with the strip's rows between them. */
function alongRouteThrough(bl: BlockadeDef, from: TravelWorld, to: TravelWorld): boolean {
  const a = parseGrid(from.grid);
  const b = parseGrid(to.grid);
  const { route, rowFrom, rowTo } = bl.zone;
  if (!route || rowFrom === undefined || rowTo === undefined || !a || !b) return false;
  if (!(from.onRoutes ?? []).includes(route) || !(to.onRoutes ?? []).includes(route)) return false;
  return Math.min(a.row, b.row) <= rowTo && Math.max(a.row, b.row) >= rowFrom;
}

const round = (h: number): number => Math.round(h * 4) / 4;

/**
 * A trip's hours. Hop time = the slower region's minimum, plus its per-square time for each grid square beyond the first
 * (D-405); × the ship's class; × 3 for a Deep Core end; × 1.5 for an asteroid field end; × 4 and a plot off the lanes.
 * Climb-out is added at both ends. The Maelstrom is sublight only. Closed worlds refuse the trip; a blockade refuses its
 * worlds and its route through the strip, and adds a detour for the strip's other worlds (D-406, D-469).
 */
export function planTrip(t: TripInput): TripPlan {
  if (t.closedReason) return { ok: false, reason: `${t.to.name} is closed to this character: ${t.closedReason}` };
  const others = (t.blockades ?? []).filter((b) => !(b.passes as readonly string[]).includes(t.faction) && b.id !== t.runs);
  for (const b of others) {
    const end = [t.from, t.to].find((w) => blocks(b, w));
    if (end || alongRouteThrough(b, t.from, t.to)) return { ok: false, reason: `${b.closes}${end ? ` (${end.name} is on it)` : ''}`, blockadeId: b.id };
  }
  const zones = (t.blockades ?? []).filter((b) => inZone(b, t.from) || inZone(b, t.to));
  const detours = zones.filter((b) => others.includes(b));
  const notes: string[] = zones.map((b) => b.zoneNote);
  const climb = (w: TravelWorld): number => (w.station ? CLIMB_OUT_HOURS.station : CLIMB_OUT_HOURS.planet);
  const parts: string[] = [];
  if (/maelstrom/i.test(t.to.name) || /maelstrom/i.test(t.from.name)) {
    const hours = MAELSTROM_SUBLIGHT_HOURS + climb(t.from) + climb(t.to);
    return { ok: true, hours, squares: 0, rate: 'Maelstrom (sublight)', parts: ['the Maelstrom Nebula forces sublight travel'], notes };
  }
  const squares = gridDistance(t.from.grid, t.to.grid);
  const ra = regionRate(t.from.region);
  const rb = regionRate(t.to.region);
  if (squares === null || !ra || !rb) return { ok: false, reason: `no grid or region on record for ${squares === null ? 'one end' : !ra ? t.from.name : t.to.name}; the narrator sets the time` };
  const slow = ra.index >= rb.index ? ra : rb;
  let hours = slow.rate.minHours + slow.rate.perSquareHours * Math.max(0, squares - 1);
  parts.push(`${slow.label} hop: ${slow.rate.minHours} h + ${slow.rate.perSquareHours} h × ${Math.max(0, squares - 1)} extra squares`);
  hours *= t.shipClass;
  parts.push(`× Class ${t.shipClass}`);
  if (ra.deep || rb.deep) {
    hours *= DEEP_CORE.factor;
    parts.push(`× ${DEEP_CORE.factor} Deep Core`);
  }
  if (/asteroid/i.test(t.from.name) || /asteroid/i.test(t.to.name)) {
    hours *= ASTEROID_FACTOR;
    parts.push(`× ${ASTEROID_FACTOR} asteroid field`);
  }
  for (const b of detours) {
    hours *= b.detourFactor;
    parts.push(`× ${b.detourFactor} detour around the blockade`);
  }
  if (t.offLane) {
    hours = hours * OFF_LANE.factor + OFF_LANE.plotHours;
    parts.push(`× ${OFF_LANE.factor} off the lanes, + ${OFF_LANE.plotHours} h plotting`);
  }
  const c = climb(t.from) + climb(t.to);
  parts.push(`+ ${c} h climb-out`);
  return { ok: true, hours: round(hours + c), squares, rate: slow.label, parts, notes };
}
