// Travel in play (m7-start-checklist.md item 26; D-405): a "travel" intent between two worlds on the galaxy map takes the
// engine's trip time (src/engine/travel.ts), or is refused for a closed world or the blockade. The origin is the current
// location (or a place it is in); the destination is the first targeted place, reference or named place that is on the map.
// Places not on the map leave the time to the narrator, as before.
import type { Intent } from '../ai/schemas/intent';
import { closedWorlds, mapSide, MENTION_ONLY, PLANETS, type MapNode } from '../data/galaxyMap';
import { DEFAULT_SHIP, HYPERDRIVE_CLASSES, START_SHIPS } from '../data/travel.config';
import { dateFromAbsDay } from '../engine/calendar';
import { planTrip, type TravelWorld } from '../engine/travel';
import { selectCharacter } from '../features/character/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectCurrentLocationId, selectLocationChain } from '../features/locations/selectors';
import type { GameState } from '../state/gameState';

export interface TravelOutcome {
  from: string;
  to: string;
  ok: boolean;
  hours?: number;
  reason?: string;
  ship: string;
  shipClass: number;
  parts: readonly string[];
}

const WORLDS: readonly MapNode[] = [...PLANETS, ...MENTION_ONLY];
const byName = new Map(WORLDS.map((w) => [w.name.toLowerCase(), w]));
const PATH_FACTION: Readonly<Record<string, string>> = { jedi: 'jediOrder', sith: 'sithEmpire' };

/** The map world a location lies on: the first name in its chain (name, aliases, region) that is a map world. */
function worldOf(state: GameState, locationId: string | null): { world: MapNode; station: boolean } | null {
  const chain = selectLocationChain(state, locationId);
  for (const l of chain) {
    for (const n of [l.name, ...l.aliases, l.region ?? '']) {
      const w = n ? byName.get(n.toLowerCase()) : undefined;
      if (w) return { world: w, station: chain[0]?.kind === 'station' || chain[0]?.kind === 'ship' };
    }
  }
  return null;
}

/** The trip a travel intent asks for, or null when it names no map world to go to (the narrator sets the time). */
export function planTravel(state: GameState, intent: Intent): TravelOutcome | null {
  if (intent.actionType !== 'travel') return null;
  const origin = worldOf(state, selectCurrentLocationId(state));
  if (!origin) return null;
  let dest: MapNode | undefined;
  for (const ref of [...intent.targets, ...intent.references]) {
    const w = state.locations.byId[ref] ? worldOf(state, ref)?.world : byName.get(ref.toLowerCase());
    if (w && w.name !== origin.world.name) {
      dest = w;
      break;
    }
  }
  dest ??= intent.unknownNames.map((n) => byName.get(n.toLowerCase())).find((w) => w && w.name !== origin.world.name);
  if (!dest) return null;
  const c = selectCharacter(state);
  const faction = c.start?.faction ?? PATH_FACTION[c.path] ?? 'unknown';
  const bby = -dateFromAbsDay(selectNow(state).day).year;
  const closed = closedWorlds(mapSide(faction), bby).find((g) => g.place.toLowerCase() === dest.name.toLowerCase() || dest.name.toLowerCase().startsWith(`${g.place.toLowerCase()} `));
  const shipId = (c.start && START_SHIPS[c.start.optionId]) ?? DEFAULT_SHIP;
  const ship = HYPERDRIVE_CLASSES[shipId]!;
  const from: TravelWorld = { name: origin.world.name, region: origin.world.region, grid: origin.world.grid, station: origin.station };
  const to: TravelWorld = { name: dest.name, region: dest.region, grid: dest.grid };
  const plan = planTrip({ from, to, bby, faction, shipClass: ship.class, ...(closed ? { closedReason: `${closed.reason}${closed.storyException ? ` (only with a story reason: ${closed.storyException})` : ''}` } : {}) });
  return plan.ok
    ? { from: from.name, to: to.name, ok: true, hours: plan.hours, ship: ship.name, shipClass: ship.class, parts: plan.parts }
    : { from: from.name, to: to.name, ok: false, reason: plan.reason, ship: ship.name, shipClass: ship.class, parts: [] };
}

/** The narrator's line for a trip (the time is the engine's; the numbers are invented, D-405). */
export function describeTravel(t: TravelOutcome): string {
  return t.ok
    ? `Travel: ${t.from} to ${t.to} takes ${t.hours} hours in ${t.ship} (Class ${t.shipClass}); that time has passed. Narrate the journey and the arrival.`
    : `Travel refused: ${t.from} to ${t.to}: ${t.reason}. The character has not made the trip; narrate why not.`;
}
