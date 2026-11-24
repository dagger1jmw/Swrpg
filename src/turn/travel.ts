// Travel in play (m7-start-checklist.md item 26; D-405): a "travel" intent between two worlds on the galaxy map takes the
// engine's trip time (src/engine/travel.ts), or is refused for a closed world or a blockade. The origin is the current
// location (or a place it is in); the destination is the first targeted place, reference or named place that is on the map.
// Places not on the map leave the time to the narrator, as before. A blockade is run with one of its approaches (M8 item 4,
// D-469; src/engine/blockade.ts): the refusal lists what is open, and an intent that names one plays it.
import type { Choice } from '../ai/schemas/compose';
import type { Intent } from '../ai/schemas/intent';
import { OBSERVE } from '../data/blockade.config';
import type { BlockadeApproach, BlockadeDef } from '../data/blockades';
import { closedWorlds, mapSide, MENTION_ONLY, PLANETS, worldsOnRoute, type MapNode } from '../data/galaxyMap';
import { DEFAULT_SHIP, HYPERDRIVE_CLASSES, START_SHIPS } from '../data/travel.config';
import { APPROACH_LABEL, approachOptions, blockadeStateAt, runBlockade, watchBlockade, type ApproachOption } from '../engine/blockade';
import { dateFromAbsDay } from '../engine/calendar';
import type { CheckCard } from '../engine/rolls';
import type { RngState } from '../engine/rng';
import { blocks, inZone, planTrip, type TravelWorld, type TripPlan } from '../engine/travel';
import { selectCharacter } from '../features/character/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectCurrentLocationId, selectLocationChain } from '../features/locations/selectors';
import { selectBlockadeHeat, selectBlockadeRunner, selectPendingBlockade, selectStandingBlockades } from '../features/world/selectors';
import type { GameEvent } from '../state/types';
import type { GameState } from '../state/gameState';

export interface TravelBlockade {
  id: string;
  name: string;
  direction: 'in' | 'out' | 'through';
  options: readonly ApproachOption[];
  /** The rating added when this trip's last attempt failed and one of these can follow it. */
  penalty: number;
}

export interface TravelOutcome {
  from: string;
  to: string;
  ok: boolean;
  hours?: number;
  reason?: string;
  ship: string;
  shipClass: number;
  parts: readonly string[];
  /** Lines for the narrator about the trip (the blockade zone, D-406). */
  notes: readonly string[];
  /** The blockade in the way, or the one just run. */
  blockade?: TravelBlockade;
  /** The run as it came out, for the narrator. */
  run?: { approach: BlockadeApproach; result: string; notes: readonly string[]; turnsInto: readonly BlockadeApproach[] };
}

const WORLDS: readonly MapNode[] = [...PLANETS, ...MENTION_ONLY];
const byName = new Map(WORLDS.map((w) => [w.name.toLowerCase(), w]));
const PATH_FACTION: Readonly<Record<string, string>> = { jedi: 'jediOrder', sith: 'sithEmpire' };
const routeWorlds = new Map<string, ReadonlySet<string>>();
const onRoute = (route: string, w: MapNode): boolean => {
  if (!routeWorlds.has(route)) routeWorlds.set(route, worldsOnRoute(route));
  return routeWorlds.get(route)!.has(w.name.toLowerCase());
};

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

const travelWorld = (w: MapNode, standing: readonly BlockadeDef[], station?: boolean): TravelWorld => ({
  name: w.name,
  region: w.region,
  grid: w.grid,
  ...(station ? { station } : {}),
  onRoutes: standing.flatMap((b) => (b.zone.route && onRoute(b.zone.route, w) ? [b.zone.route] : [])),
});

const factionOf = (state: GameState): string => {
  const c = selectCharacter(state);
  return c.start?.faction ?? PATH_FACTION[c.path] ?? 'unknown';
};

interface Trip {
  from: TravelWorld;
  to: TravelWorld;
  plan: (leave?: string) => TripPlan;
  ship: { name: string; class: number };
  standing: readonly BlockadeDef[];
}

function tripFor(state: GameState, intent: Intent): Trip | null {
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
  const faction = factionOf(state);
  const bby = -dateFromAbsDay(selectNow(state).day).year;
  const name = dest.name;
  const closed = closedWorlds(mapSide(faction), bby).find((g) => g.place.toLowerCase() === name.toLowerCase() || name.toLowerCase().startsWith(`${g.place.toLowerCase()} `));
  const shipId = (c.start && START_SHIPS[c.start.optionId]) ?? DEFAULT_SHIP;
  const ship = HYPERDRIVE_CLASSES[shipId]!;
  const standing = selectStandingBlockades(state);
  const from = travelWorld(origin.world, standing, origin.station);
  const to = travelWorld(dest, standing);
  const base = { from, to, faction, shipClass: ship.class, ...(closed ? { closedReason: `${closed.reason}${closed.storyException ? ` (only with a story reason: ${closed.storyException})` : ''}` } : {}) };
  return { from, to, ship, standing, plan: (leave) => planTrip({ ...base, blockades: standing, ...(leave ? { runs: leave } : {}) }) };
}

/** The trip a travel intent asks for, or null when it names no map world to go to (the narrator sets the time). */
export function planTravel(state: GameState, intent: Intent): TravelOutcome | null {
  const trip = tripFor(state, intent);
  if (!trip) return null;
  const { from, to, ship } = trip;
  const plan = trip.plan();
  const base = { from: from.name, to: to.name, ship: ship.name, shipClass: ship.class };
  if (plan.ok) return { ...base, ok: true, hours: plan.hours, parts: plan.parts, notes: plan.notes };
  const b = trip.standing.find((x) => x.id === plan.blockadeId);
  if (!b) return { ...base, ok: false, reason: plan.reason, parts: [], notes: [] };
  const direction = inZone(b, to) && blocks(b, to) ? 'in' : inZone(b, from) && blocks(b, from) ? 'out' : 'through';
  const day = selectNow(state).day;
  const pending = selectPendingBlockade(state, b.id, to.name);
  const all = approachOptions(b, day, selectBlockadeRunner(state, b), direction);
  // A failed attempt that can still become another offers only what it can become: desperate, so always open.
  const options = pending ? pending.options.map((a) => ({ approach: a, label: APPROACH_LABEL[a], available: true, note: 'at once, with the pickets on guard' })) : all;
  return { ...base, ok: false, reason: plan.reason, parts: [], notes: [], blockade: { id: b.id, name: b.name, direction, options, penalty: pending?.penalty ?? 0 } };
}

export interface BlockadeTurn {
  travel: TravelOutcome;
  cards: readonly CheckCard[];
  rng: RngState;
  events: readonly GameEvent[];
  seconds: number;
}

/** One approach played: the checks, what it cost, and either the trip or how it was stopped. Null when it is not open. */
export function runTravelBlockade(state: GameState, intent: Intent, travel: TravelOutcome): BlockadeTurn | { refused: string } | null {
  const approach = intent.blockade;
  if (!approach || approach === 'observe' || !travel.blockade) return null;
  const trip = tripFor(state, intent);
  const b = trip?.standing.find((x) => x.id === travel.blockade!.id);
  if (!trip || !b) return null;
  const option = travel.blockade.options.find((o) => o.approach === approach);
  if (!option?.available) return { refused: `${APPROACH_LABEL[approach].toLowerCase()}: ${option ? option.note : 'not open now'}` };
  const plan = trip.plan(b.id);
  if (!plan.ok) return { refused: plan.reason };
  const day = selectNow(state).day;
  const run = runBlockade(state.meta.rngState, {
    blockade: b,
    day,
    approach,
    runner: selectBlockadeRunner(state, b),
    direction: travel.blockade.direction,
    heat: selectBlockadeHeat(state, b.id),
    penalty: travel.blockade.penalty,
  });
  const through = run.result === 'through';
  // Turned back for good: there and back. Still at the pickets with another way open: only the way out there; the attempt
  // that follows takes the rest.
  const follows = travel.blockade.penalty > 0;
  const half = follows || (!through && run.turnsInto.length > 0) ? 0.5 : 1;
  const hours = Math.round((plan.hours + (follows ? 0 : run.extraHours)) * half * 4) / 4;
  const events: GameEvent[] = [
    {
      type: 'blockadeRunRecorded',
      blockadeId: b.id,
      approach,
      direction: travel.blockade.direction,
      to: travel.to,
      result: run.result,
      fame: run.fame,
      witnessed: run.witnessed,
      credits: run.credits,
      turnsInto: run.turnsInto,
      penalty: run.penalty,
    },
    ...(run.hazard ? [{ type: 'hazardResolved', hazard: run.hazard.type, severity: run.hazard.severity, cause: run.hazard.type === 'crash' ? `fired on by ${b.name}` : 'the trek on foot' }] : []),
  ];
  const outcome: TravelOutcome = {
    ...travel,
    ok: through,
    ...(through ? { hours } : { reason: `${b.name}: ${run.notes[0] ?? run.result}` }),
    parts: [...plan.parts.filter((p) => !/detour/.test(p)), `+ ${Math.round(run.extraHours)} h (${APPROACH_LABEL[approach].toLowerCase()})`],
    notes: plan.notes,
    run: { approach, result: run.result, notes: run.notes, turnsInto: run.turnsInto },
  };
  return { travel: outcome, cards: run.cards, rng: run.rng, events, seconds: Math.round(hours * 3600) };
}

/** Watching a blockade from inside its strip: counts towards knowing exactly where it is safe to land. */
export function watchTravelBlockade(state: GameState, intent: Intent, hours: number | null): { cards: readonly CheckCard[]; rng: RngState; events: readonly GameEvent[]; seconds: number; note: string } | { refused: string } | null {
  if (intent.blockade !== 'observe') return null;
  const here = worldOf(state, selectCurrentLocationId(state));
  const standing = selectStandingBlockades(state);
  const b = here ? standing.find((x) => inZone(x, travelWorld(here.world, standing))) : undefined;
  if (!b) return { refused: 'there is no blockade to watch from here' };
  const span = Math.min(24, hours ?? OBSERVE.hoursPerWatch);
  const runner = selectBlockadeRunner(state, b);
  const level = runner.levels.stealth.level >= runner.levels.intelligence.level ? runner.levels.stealth : runner.levels.intelligence;
  const w = watchBlockade(state.meta.rngState, b, selectNow(state).day, level, span, selectBlockadeHeat(state, b.id));
  return {
    cards: [w.card],
    rng: w.rng,
    events: [{ type: 'blockadeWatched', blockadeId: b.id, counted: w.counted, noticed: w.noticed }],
    seconds: Math.round(span * 3600),
    note: w.noticed ? `watching ${b.name}: noticed` : `watching ${b.name}: ${w.counted} h counted`,
  };
}

/** Choices for a blockade in the way, so the player can always see what is open. */
export function blockadeChoices(t: TravelOutcome | undefined): Choice[] {
  if (!t?.blockade || t.ok) return [];
  const open = t.run ? t.run.turnsInto.map((a) => ({ approach: a, label: APPROACH_LABEL[a] })) : t.blockade.options.filter((o) => o.available);
  return open.map((o) => ({ label: `${o.label} (${t.to})`, intent: { actionType: 'travel', targetRef: t.to, blockade: o.approach } }));
}

/** The blockade at this place, for the STATE block: public facts only (never a patrol or sensor figure). */
export function blockadeLines(state: GameState): string[] {
  const here = worldOf(state, selectCurrentLocationId(state));
  if (!here) return [];
  const standing = selectStandingBlockades(state);
  const w = travelWorld(here.world, standing);
  return standing
    .filter((b) => inZone(b, w))
    .map((b) => {
      const s = blockadeStateAt(b, selectNow(state).day);
      const level = s.level === 1 ? 'a trade blockade: commercial shipping stopped' : s.level === 2 ? 'an enforced blockade: ships stopped and searched' : 'a military blockade: a full cordon';
      return `Blockade: ${b.name}, run by ${b.runBy} (${level}). ${blocks(b, w) ? 'Leaving this world means running it' : 'It stands across the route nearby'}. ${b.zoneNote}.`;
    });
}

/** The narrator's line for a trip (the time is the engine's; the numbers are invented, D-405). */
export function describeTravel(t: TravelOutcome): string {
  const run = t.run ? ` The blockade was run: ${t.run.notes.join('; ')}.` : '';
  if (t.ok) return `Travel: ${t.from} to ${t.to} takes ${t.hours} hours in ${t.ship} (Class ${t.shipClass}); that time has passed.${t.notes.map((n) => ` ${n.charAt(0).toUpperCase()}${n.slice(1)}.`).join('')}${run} Narrate the journey and the arrival.`;
  if (t.run) {
    const next = t.run.turnsInto.length ? ` It can still turn into: ${t.run.turnsInto.map((a) => APPROACH_LABEL[a].toLowerCase()).join('; ')}.` : '';
    return `The run failed: ${t.from} to ${t.to}: ${t.run.notes.join('; ')}. Narrate it exactly so; the character has not got through.${next}`;
  }
  const ways = t.blockade ? ` Ways past it (offer only the open ones; invent no other): ${t.blockade.options.map((o) => `${o.label} [${o.available ? 'open' : 'not open'}: ${o.note}]`).join('; ')}.` : '';
  return `Travel refused: ${t.from} to ${t.to}: ${t.reason}. The character has not made the trip; narrate why not.${ways}`;
}
