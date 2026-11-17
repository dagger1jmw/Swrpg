// Story memory config (architecture §7; D-17, D-19 defaults approved by Jared). Tunable.

/** Chapter close policy (D-17). */
export const CHAPTER_CLOSE = {
  /** Close when a chapter reaches this many turns. */
  maxTurns: 30,
  /** An AI sceneEnded hint closes the chapter only once it has at least this many turns. */
  sceneEndedMinTurns: 8,
  /** A time jump of at least this many days closes the chapter (montage / skip, M4). */
  skipDays: 7,
} as const;

/** Pending summaries retried per chapter close, oldest first (D-89). */
export const SUMMARY_RETRIES_PER_CLOSE = 2;

/** Text limits. */
export const MEMORY_LIMITS = {
  fact: 300,
  chapterSummary: 2400,
  /** ~1,000 tokens (architecture §7). */
  arc: 4000,
  reviewContext: 200,
} as const;

/**
 * Retrieval scoring (architecture §7): tag overlap weighted per kind + recency decay +
 * open-thread bonus. Design values (D-83).
 */
export const MEMORY_SCORES = {
  /** Per overlapping tag, by the tag's source in the query. */
  overlap: { scene: 30, referenced: 40, mentioned: 40, location: 15, thread: 20 },
  /** Recency: + recencyMax * 0.5^(turnsAgo / recencyHalfLifeTurns). */
  recencyMax: 10,
  recencyHalfLifeTurns: 30,
  /** Items tied to an open thread. */
  openThreadBonus: 10,
  /** Major facts weigh more than minor ones. */
  majorFactBonus: 10,
  /**
   * An item that shares no tag with the query is sent only while its recency score is at least
   * this (the last 30 turns), so old unrelated records stay out (D-83).
   */
  minRecencyWithoutOverlap: 5,
} as const;
