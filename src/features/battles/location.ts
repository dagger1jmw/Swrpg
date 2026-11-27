// Where the player is during and after a battle (m8-fixes C4; Jared's play test: the header said "Jedi Temple" through the Jabiim
// battle and "Jedi Quarters" during a dogfight over Coruscant). Starting a battle moves the player to its site; while it runs the
// site stands; its end puts the player where they end up: still on the field, back at the base they planned from (a defeat or a
// withdrawal), aboard their ship, or held by the enemy. Pure: these are the location events the battles feature emits.
import { PLANETS } from '../../data/galaxyMap';
import type { LocationKind } from '../../data/entities.config';
import type { GameState } from '../../state/gameState';
import type { GameEvent } from '../../state/types';
import { selectCurrentLocationId, selectLocationChain, selectLocations } from '../locations/selectors';

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The map world a site's words name ("Jabiim", "the Jabiim highlands", "Cobalt Station, Jabiim"), the longest name first. */
export function worldNamed(words: string): { name: string; region: string } | null {
  const hit = [...PLANETS].sort((a, b) => b.name.length - a.name.length).find((p) => p.name.length >= 3 && new RegExp(`\\b${esc(p.name)}\\b`, 'i').test(words));
  return hit ? { name: hit.name, region: hit.region } : null;
}

/** The world the player is on now (the outermost planet or moon of the current place), if any. */
function worldHere(s: GameState): { name: string; region: string } | null {
  const top = selectLocationChain(s, selectCurrentLocationId(s)).at(-1);
  return top && (top.kind === 'planet' || top.kind === 'moon') ? { name: top.name, region: top.region } : null;
}

/**
 * The events that put the player at a place: its world first (when the words name a map world other than the place itself), then
 * the place inside it. A place already known by that name is moved to, not made again (locationIntroduced's alias match).
 */
export function moveToPlace(s: GameState, name: string, kind: LocationKind, description: string, worldWords: string = name): GameEvent[] {
  const place = name.trim().slice(0, 60);
  if (!place) return [];
  const world = worldNamed(worldWords) ?? worldHere(s);
  if (world && world.name.toLowerCase() === place.toLowerCase()) return [{ type: 'locationIntroduced', name: world.name, kind: 'planet', region: world.region.slice(0, 60), description: '', moveHere: true }];
  const out: GameEvent[] = [];
  if (world && !selectLocations(s).some((l) => l.name.toLowerCase() === world.name.toLowerCase())) out.push({ type: 'locationIntroduced', name: world.name, kind: 'planet', region: world.region.slice(0, 60), description: '', moveHere: false });
  out.push({ type: 'locationIntroduced', name: place, kind, region: (world?.name ?? 'unknown').slice(0, 60), ...(world ? { parentRef: world.name } : {}), description: description.slice(0, 200), moveHere: true });
  return out;
}

/** A ground battle begins: the player is at its site. */
export const groundSiteEvents = (s: GameState, site: string): GameEvent[] => moveToPlace(s, site, 'wilderness', 'a battlefield');

/** A ship battle begins: the player is aboard their ship, over the world they were on (or the one the battle's place names). */
export const shipSiteEvents = (s: GameState, shipName: string, placeName: string): GameEvent[] => moveToPlace(s, shipName, 'ship', 'the ship the character is aboard in a battle', placeName);

/** Back to a place already known by id (the base a ground battle was planned from). */
export function backTo(s: GameState, placeId: string | null): GameEvent[] {
  if (!placeId || !s.locations.byId[placeId] || s.locations.currentId === placeId) return [];
  return [{ type: 'locationChanged', locationRef: placeId }];
}

/** Held by the enemy after a battle (captivity keeps no place of its own). */
export const heldBy = (s: GameState, enemy: string): GameEvent[] => moveToPlace(s, `held by ${enemy}`.slice(0, 60), 'other', 'where the character is held after a battle lost');
