// Retrieval scoring (architecture §7): Score = tag overlap (weighted per kind) + recency decay +
// open-thread bonus. The scorer is an interface combined by a CompositeScorer, so an embedding
// scorer can be added later without changing callers. Pure.
import { MEMORY_SCORES } from '../data/memory.config';

export type MemoryItemKind = 'fact' | 'chapter' | 'npc' | 'location' | 'thread';

export interface MemoryItem {
  kind: MemoryItemKind;
  /** Stable ID of the record (fact:3, chapter:2, npc:orren-vash, ...). */
  id: string;
  /** Entity IDs the item is about or mentions. */
  tags: readonly string[];
  /** Turn of the item's latest relevance (fact turn, chapter end, last seen / introduced). */
  turn: number;
  text: string;
  importance?: 'minor' | 'major';
}

export type QuerySource = keyof typeof MEMORY_SCORES.overlap;

export interface MemoryQuery {
  /** The turn being played. */
  turn: number;
  /** Entity ID -> the strongest reason it is in the query. */
  tags: ReadonlyMap<string, QuerySource>;
  openThreadIds: ReadonlySet<string>;
}

export interface Scorer {
  score(item: MemoryItem, query: MemoryQuery): number;
}

export const tagOverlapScorer: Scorer = {
  score: (item, q) => item.tags.reduce((sum, t) => sum + (q.tags.has(t) ? MEMORY_SCORES.overlap[q.tags.get(t)!] : 0), 0),
};

export const recencyScorer: Scorer = {
  score: (item, q) => MEMORY_SCORES.recencyMax * 0.5 ** (Math.max(0, q.turn - item.turn) / MEMORY_SCORES.recencyHalfLifeTurns),
};

export const openThreadScorer: Scorer = {
  score: (item, q) => (item.tags.some((t) => q.openThreadIds.has(t)) || q.openThreadIds.has(item.id) ? MEMORY_SCORES.openThreadBonus : 0),
};

export const importanceScorer: Scorer = {
  score: (item) => (item.importance === 'major' ? MEMORY_SCORES.majorFactBonus : 0),
};

export class CompositeScorer implements Scorer {
  constructor(private readonly scorers: readonly Scorer[]) {}
  score(item: MemoryItem, query: MemoryQuery): number {
    return this.scorers.reduce((sum, s) => sum + s.score(item, query), 0);
  }
}

export const DEFAULT_SCORER: Scorer = new CompositeScorer([tagOverlapScorer, recencyScorer, openThreadScorer, importanceScorer]);

/** Adds `id` with `source`, keeping the stronger source when it is already present. */
export function addTag(tags: Map<string, QuerySource>, id: string, source: QuerySource): void {
  const prev = tags.get(id);
  if (!prev || MEMORY_SCORES.overlap[source] > MEMORY_SCORES.overlap[prev]) tags.set(id, source);
}
