// Travel between worlds (m7-start-checklist.md item 26; D-402 [3], D-405). Pure: given two map worlds, the date, the
// traveller's side and ship class, the trip's hours or the reason it can't be made. Numbers in data/travel.config.ts
// (all invented).
import { ASTEROID_FACTOR, BLOCKADE, CLIMB_OUT_HOURS, DEEP_CORE, MAELSTROM_SUBLIGHT_HOURS, OFF_LANE, REGION_RATES, type RegionRate } from '../data/travel.config';

export interface TravelWorld {
  name: string;
  region: string;
  grid: string;
  /** A station or ship (shorter climb-out) rather than a planet or moon. */
  station?: boolean;
  /** On the blockaded route (the Hydian Way; from the map's route data, D-406). */
  onBlockadeRoute?: boolean;
}

export interface TripInput {
  from: TravelWorld;
  to: TravelWorld;
  /** Campaign year as BBY (positive). */
  bby: number;
  /** The traveller's faction (for the blockade). */
  faction: string;
  shipClass: number;
  offLane?: boolean;
  /** A closed world's reason (src/data/galaxyMap.ts closedWorlds), when the destination is closed to this side. */
  closedReason?: string;
}

export type TripPlan =
  | { ok: true; hours: number; squares: number; rate: string; parts: readonly string[]; notes: readonly string[] }
  | { ok: false; reason: string };

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

function inBlockadeCorridor(grid: string): boolean {
  const g = parseGrid(grid);
  return !!g && (BLOCKADE.columns as readonly string[]).includes(g.letter) && g.row >= BLOCKADE.rowFrom && g.row <= BLOCKADE.rowTo;
}

/** A trip along the blockaded route through the strip: both ends on it, with the strip's rows between them. */
function alongRouteThrough(from: TravelWorld, to: TravelWorld): boolean {
  const a = parseGrid(from.grid);
  const b = parseGrid(to.grid);
  if (!from.onBlockadeRoute || !to.onBlockadeRoute || !a || !b) return false;
  return Math.min(a.row, b.row) <= BLOCKADE.rowTo && Math.max(a.row, b.row) >= BLOCKADE.rowFrom;
}

const round = (h: number): number => Math.round(h * 4) / 4;

/**
 * A trip's hours. Hop time = the slower region's minimum, plus its per-square time for each grid square beyond the first
 * (D-405); × the ship's class; × 3 for a Deep Core end; × 1.5 for an asteroid field end; × 4 and a plot off the lanes.
 * Climb-out is added at both ends. The Maelstrom is sublight only. Closed worlds refuse the trip; the blockade refuses
 * the Hydian Way inside the strip and adds a detour for the strip's other worlds (D-406).
 */
export function planTrip(t: TripInput): TripPlan {
  if (t.closedReason) return { ok: false, reason: `${t.to.name} is closed to this character: ${t.closedReason}` };
  const blockadeYear = t.bby <= BLOCKADE.fromBby && t.bby >= BLOCKADE.toBby;
  const inZone = blockadeYear && (inBlockadeCorridor(t.from.grid) || inBlockadeCorridor(t.to.grid));
  const passes = (BLOCKADE.passes as readonly string[]).includes(t.faction);
  if (blockadeYear && !passes) {
    const routeEnd = [t.from, t.to].find((w) => w.onBlockadeRoute && inBlockadeCorridor(w.grid));
    if (routeEnd || alongRouteThrough(t.from, t.to)) {
      return {
        ok: false,
        reason: `the Mandalorian blockade closes the Hydian Way between Devaron and the Minos Cluster${routeEnd ? ` (${routeEnd.name} is on it)` : ''}; running it is a story event, not a routine trip`,
      };
    }
  }
  const notes: string[] = inZone ? [BLOCKADE.zoneNote] : [];
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
  if (inZone && !passes) {
    hours *= BLOCKADE.detourFactor;
    parts.push(`× ${BLOCKADE.detourFactor} detour around the blockade`);
  }
  if (t.offLane) {
    hours = hours * OFF_LANE.factor + OFF_LANE.plotHours;
    parts.push(`× ${OFF_LANE.factor} off the lanes, + ${OFF_LANE.plotHours} h plotting`);
  }
  const c = climb(t.from) + climb(t.to);
  parts.push(`+ ${c} h climb-out`);
  return { ok: true, hours: round(hours + c), squares, rate: slow.label, parts, notes };
}
