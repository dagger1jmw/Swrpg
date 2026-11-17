// Chapter close policy (architecture §7, D-17). Code decides; the AI's sceneEnded is only a hint.
// Pure: reads state through selectors and the chapter's applied events.
import { CHAPTER_CLOSE } from '../data/memory.config';
import { selectNow } from '../features/clock/selectors';
import { selectCurrentLocationId, selectLocations, selectMajorLocationId } from '../features/locations/selectors';
import { selectCurrentChapter } from '../features/memory/selectors';
import { selectNpcs } from '../features/npcs/selectors';
import { selectThreads } from '../features/threads/selectors';
import type { GameState } from '../state/gameState';
import type { GameEvent } from '../state/types';

/** One committed turn of the open chapter, as the memory code needs it (from the transcript). */
export interface ChapterTurn {
  turn: number;
  /** In-game day after the turn. */
  day: number;
  /** The events applied in that turn (engine and AI), with refs already resolved to IDs. */
  events: readonly GameEvent[];
}

export interface CloseDecision {
  reason: string;
  /** The last turn of the closing chapter (the turn just committed, or the one before it). */
  lastTurn: number;
}

/** Turns in the open chapter up to and including `turn` (turn 0 is the campaign start, not a turn). */
export function chapterTurnCount(state: GameState, turn: number): number {
  return turn - Math.max(1, selectCurrentChapter(state).startTurn) + 1;
}

/**
 * Called after turn `before.meta.turn + 1` was applied (`after` is the committed state).
 * A move to a different major location, or a jump of 7+ days, ends the chapter BEFORE this turn,
 * so the new place or the jump starts the next chapter (montages and skips are their own chapter,
 * Q56). A sceneEnded hint with 8+ turns, or 30 turns, ends it WITH this turn.
 */
export function decideChapterClose(before: GameState, after: GameState, timeAdvancedSeconds: number): CloseDecision | null {
  const turn = after.meta.turn;
  const start = Math.max(1, selectCurrentChapter(after).startTurn);
  const previous = turn - 1;

  const fromMajor = selectMajorLocationId(before, selectCurrentLocationId(before));
  const toMajor = selectMajorLocationId(after, selectCurrentLocationId(after));
  if (fromMajor !== null && toMajor !== null && fromMajor !== toMajor && previous >= start) {
    return { reason: `major location changed (${fromMajor} -> ${toMajor})`, lastTurn: previous };
  }
  if (timeAdvancedSeconds >= CHAPTER_CLOSE.skipDays * 86_400 && previous >= start) {
    return { reason: `time jump of ${Math.floor(timeAdvancedSeconds / 86_400)} days`, lastTurn: previous };
  }
  const count = chapterTurnCount(after, turn);
  // Only a hint sent in this turn counts; an early one does not close the chapter turns later.
  const ended = selectCurrentChapter(after).signals.find((s) => s.kind === 'sceneEnded' && s.turn === turn);
  if (ended && count >= CHAPTER_CLOSE.sceneEndedMinTurns) return { reason: `scene ended (${ended.reason}) after ${count} turns`, lastTurn: turn };
  if (count >= CHAPTER_CLOSE.maxTurns) return { reason: `${count} turns`, lastTurn: turn };
  return null;
}

const REF_FIELDS = ['npcRef', 'aboutRef', 'locationRef', 'parentRef', 'threadRef', 'entityRefs', 'presentNpcRefs', 'npcIds', 'entityRef'];

/** IDs referenced by a set of applied events. */
export function referencedIds(events: readonly GameEvent[]): Set<string> {
  const out = new Set<string>();
  for (const e of events) {
    for (const f of REF_FIELDS) {
      const v = e[f];
      for (const x of Array.isArray(v) ? v : [v]) if (typeof x === 'string' && /^(npc|loc|thread):/.test(x)) out.add(x);
    }
  }
  return out;
}

/**
 * The chapterClosed event for turns [startTurn, lastTurn]. Tags are computed by code (D-17):
 * everything the chapter's events referenced plus the entities created in it.
 */
export function buildChapterClosed(state: GameState, decision: CloseDecision, turns: readonly ChapterTurn[]): GameEvent {
  const current = selectCurrentChapter(state);
  const from = current.startTurn;
  const inRange = turns.filter((t) => t.turn >= from && t.turn <= decision.lastTurn);
  const ids = referencedIds(inRange.flatMap((t) => t.events));
  const created = (turn: number): boolean => turn >= Math.max(1, from) && turn <= decision.lastTurn;
  for (const n of selectNpcs(state)) if (created(n.introducedTurn)) ids.add(n.id);
  for (const l of selectLocations(state)) if (created(l.introducedTurn)) ids.add(l.id);
  for (const t of selectThreads(state)) if (created(t.openedTurn)) ids.add(t.id);
  const sorted = [...ids].sort();
  const lastDay = inRange.length ? inRange[inRange.length - 1]!.day : selectNow(state).day;
  return {
    type: 'chapterClosed',
    reason: decision.reason,
    turnRange: [from, decision.lastTurn],
    dayRange: [current.startDay, lastDay],
    locationIds: sorted.filter((x) => x.startsWith('loc:')),
    entityIds: sorted.filter((x) => x.startsWith('npc:')),
    threadIds: sorted.filter((x) => x.startsWith('thread:')),
  };
}
