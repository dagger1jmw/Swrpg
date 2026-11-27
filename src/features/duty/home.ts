// Home base and "does this touch the character" (opt-2 D; spec/duty.md). Pure selectors; no world-feature imports (the world
// feature reads these to decide whether a timeline event stops a skip).
import { ORDER_SEATS } from '../../data/orderSeats';
import { MENTION_ONLY, PLANETS } from '../../data/galaxyMap';
import type { WorldEventDef } from '../../data/worldNetwork';
import { dateFromAbsDay } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import { selectLocationChain } from '../locations/selectors';
import { selectSide } from '../ranks/selectors';

export interface HomeBase {
  /** The place's name ("the Jedi Temple", "Korriban"). */
  name: string;
  /** The world it stands on, when known. */
  planet: string | null;
  /** How the player reads it: the Temple, the academy or the Lord's holdings, the barracks, the home port, the guild hall. */
  label: string;
}

const norm = (t: string): string => ` ${t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^the /, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;
/** One name inside the other, as whole words ("the Jedi Temple" and "Jedi Temple, Coruscant"). */
export const sameNamed = (a: string, b: string): boolean => {
  const x = norm(a);
  const y = norm(b);
  return x.trim().length > 0 && y.trim().length > 0 && (x.includes(y) || y.includes(x));
};

/** The Jedi Order's home at a year (orderSeats.ts; the seat's branches and the freeze are the world feature's, not read here). */
function orderHome(year: number): { name: string; planet: string } | null {
  return ORDER_SEATS.find((r) => year >= r.fromYear && year < r.toYear)?.home ?? null;
}

/** The label for a home base by path (Jared, 26 Nov 2026). */
function labelFor(s: GameState, name: string): string {
  const path = s.character.path;
  if (path === 'jedi') return name;
  if (path === 'sith') return `the academy or your Lord's holdings (${name})`;
  if (s.ranks.service) return `the barracks or base (${name})`;
  const a = s.character.archetype ?? '';
  if (a === 'smuggler' || a === 'starfighterPilot' || a === 'bountyHunter') return `your ship or home port (${name})`;
  return `your guild hall or home (${name})`;
}

/**
 * The character's home base: a Jedi's is the Order's seat of the year (the Temple; none while the Order is homeless); everyone
 * else's is the place recorded when duty first saw them (the start's world: the academy, the barracks, the home port).
 */
export function selectHomeBase(s: GameState): HomeBase | null {
  // While posted (m9-missions B5b), the forward base or flagship; on leave, the Temple (or the path's home) again.
  const posting = s.duty?.posting;
  if (posting && !s.duty.leave) return { name: posting.base.name, planet: posting.base.planet, label: `${posting.base.name} (${posting.front})` };
  if (s.character.path === 'jedi') {
    const h = orderHome(dateFromAbsDay(s.clock.now.day).year);
    return h ? { name: h.name, planet: h.planet, label: h.name } : null;
  }
  const h = s.duty?.home;
  return h ? { name: h.name, planet: h.planet, label: labelFor(s, h.name) } : null;
}

/** The names of where the character is: the current place and every place above it. */
export const selectHereNames = (s: GameState): string[] => selectLocationChain(s, s.locations.currentId).map((l) => l.name);

/**
 * At home: the current place or one above it is the home base, or the character is on the home world at large (the place they
 * stand in is the world itself, with nothing smaller named).
 */
export function selectAtHome(s: GameState): boolean {
  const home = selectHomeBase(s);
  return home ? selectAtPlace(s, home) : false;
}

/** At a base (a mission's, m9-missions B4): the current place or one above it is the base, or the character is on its world at large. */
export function selectAtPlace(s: GameState, home: { name: string; planet: string | null }): boolean {
  const chain = selectLocationChain(s, s.locations.currentId);
  if (chain.some((l) => sameNamed(l.name, home.name))) return true;
  const here = chain[0];
  return home.planet !== null && here !== undefined && (here.kind === 'planet' || here.kind === 'moon') && sameNamed(here.name, home.planet);
}

/**
 * The character's side for duty: the start's faction or the path's (ranks selectSide), else the service the character holds (a
 * soldier of the Republic Army is the Republic's).
 */
export function selectDutySide(s: GameState): string | null {
  const side = selectSide(s);
  if (side) return side;
  const ladder = s.ranks.service?.ladderId ?? '';
  if (/^(republic|alliance|newRepublic|galacticAlliance)/.test(ladder)) return 'republic';
  if (/^(sithImperial|imperial)/.test(ladder)) return 'sithEmpire';
  return null;
}

/** The character's side and its allies (the Order with the Republic, the Sith with the Empire), for faction turns and all hands. */
export function selectSides(s: GameState): string[] {
  const side = selectDutySide(s);
  if (!side) return [];
  const allies: Readonly<Record<string, readonly string[]>> = { jediOrder: ['republic'], republic: ['jediOrder'], sithEmpire: ['sith'], sith: ['sithEmpire'] };
  return [side, ...(allies[side] ?? [])];
}

/**
 * Whether a timeline event touches the character (opt-2 D4): one of its places is where the character is or their home, one of
 * its people is someone the character has met, or it is a major turn for the character's side.
 */
export function touchesCharacter(s: GameState, e: Pick<WorldEventDef, 'places' | 'roles' | 'turnFor'>): string | null {
  const here = selectHereNames(s);
  const home = selectHomeBase(s);
  const mine = [...here, ...(home ? [home.name, ...(home.planet ? [home.planet] : [])] : [])];
  const place = (e.places ?? []).find((p) => mine.some((m) => sameNamed(m, p)));
  if (place) return `at ${place}`;
  const met = new Set(Object.values(s.npcs.byId).map((n) => n.canonId).filter((c): c is string => !!c));
  const who = e.roles.find((r) => r.canonId && met.has(r.canonId));
  if (who) return `${who.label}, someone you know`;
  const sides = selectSides(s);
  if ((e.turnFor ?? []).some((f) => sides.includes(f))) return 'a turn for your side';
  return null;
}

/** The map world the character stands on (m9-missions B4): the first place in the chain, its aliases or region, on the galaxy map. */
export function selectCurrentWorld(s: GameState): string | null {
  for (const l of selectLocationChain(s, s.locations.currentId)) {
    for (const n of [l.name, ...l.aliases]) {
      const w = PLANETS.find((p) => p.name.toLowerCase() === n.toLowerCase()) ?? MENTION_ONLY.find((p) => p.name.toLowerCase() === n.toLowerCase());
      if (w) return w.name;
    }
  }
  return null;
}
