import { CHAPTER_PLACE_KINDS } from '../../data/entities.config';
import { uniqueAliasMatch } from '../../engine/aliases';
import type { GameState } from '../../state/gameState';
import type { Location } from './locations';

export const selectLocations = (s: GameState): Location[] => Object.values(s.locations.byId);
export const selectLocation = (s: GameState, id: string): Location | null => s.locations.byId[id] ?? null;
export const selectCurrentLocationId = (s: GameState): string | null => s.locations.currentId;
export const selectCurrentLocation = (s: GameState): Location | null => (s.locations.currentId ? (s.locations.byId[s.locations.currentId] ?? null) : null);

/** The location and its ancestors, nearest first (cycles cut). */
export function selectLocationChain(s: GameState, id: string | null): Location[] {
  const out: Location[] = [];
  const seen = new Set<string>();
  for (let cur = id ? s.locations.byId[id] : undefined; cur && !seen.has(cur.id); cur = cur.parentId ? s.locations.byId[cur.parentId] : undefined) {
    seen.add(cur.id);
    out.push(cur);
  }
  return out;
}

/** The nearest self-or-ancestor whose kind closes chapters (CHAPTER_PLACE_KINDS); null if none. */
export function selectMajorLocationId(s: GameState, id: string | null): string | null {
  return selectLocationChain(s, id).find((l) => CHAPTER_PLACE_KINDS.includes(l.kind))?.id ?? null;
}

export const resolveLocationRef = (s: GameState, ref: string): string | null => {
  if (ref.startsWith('loc:')) return s.locations.byId[ref] ? ref : null;
  return uniqueAliasMatch(selectLocations(s), (l) => [l.name, ...l.aliases], ref)?.id ?? null;
};
