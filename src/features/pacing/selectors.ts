import { SETTLING, type PacingLevel } from '../../data/pacing.config';
import type { GameState } from '../../state/gameState';
import { selectCurrentLocationId, selectLocation, selectLocations, selectMajorLocationId } from '../locations/selectors';
import { selectNpcs } from '../npcs/selectors';
import { selectThreads } from '../threads/selectors';

export const selectPacingLevel = (s: GameState): PacingLevel => s.pacing.level;
export const selectMoodTags = (s: GameState): readonly string[] => s.pacing.scene.moodTags;
export const selectPresentNpcIds = (s: GameState): readonly string[] => s.pacing.scene.presentNpcIds;

export interface SettlingIn {
  active: boolean;
  placeId: string | null;
  sinceDay: number | null;
  daysLeft: number;
}

/**
 * Settling-in (architecture §8; derived, not stored, D-138): the first 14 days after the first arrival at
 * a major place (the campaign's starting place counts). A life-stage change will start one too once ranks
 * change in play (M7).
 */
export function selectSettlingIn(s: GameState): SettlingIn {
  const cur = selectCurrentLocationId(s);
  const placeId = selectMajorLocationId(s, cur) ?? cur;
  const first = placeId ? (selectLocation(s, placeId)?.firstVisitDay ?? null) : null;
  if (first === null) return { active: false, placeId, sinceDay: null, daysLeft: 0 };
  const left = SETTLING.settlingInDays - (s.clock.now.day - first);
  return { active: left > 0, placeId, sinceDay: first, daysLeft: Math.max(0, left) };
}

/** The last day something new entered the story: a new NPC, thread or place visited (derived, D-138). */
export function selectLastNoveltyDay(s: GameState): number | null {
  let best: number | null = null;
  const take = (d: number | null): void => {
    if (d !== null && (best === null || d > best)) best = d;
  };
  for (const n of selectNpcs(s)) take(n.firstMetDay);
  for (const t of selectThreads(s)) take(t.openedDay);
  for (const l of selectLocations(s)) take(l.firstVisitDay);
  return best;
}

export interface Staleness {
  stale: boolean;
  /** Days with nothing new at the current place. */
  days: number;
}

/**
 * Staleness (architecture §8, D-18): 21+ days at one place with no new NPC, thread or place. Never during
 * settling-in. Derived, never stored (D-138).
 */
export function selectStaleness(s: GameState): Staleness {
  const novelty = selectLastNoveltyDay(s);
  const arrived = s.locations.currentSinceDay;
  if (novelty === null && arrived === null) return { stale: false, days: 0 };
  const since = Math.max(novelty ?? -Infinity, arrived ?? -Infinity);
  const days = s.clock.now.day - since;
  return { stale: days >= SETTLING.staleDays && !selectSettlingIn(s).active, days };
}
