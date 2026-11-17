import type { GameState } from '../../state/gameState';
import type { Chapter, Fact, MemorySlice, ReviewItem } from './memory';

export const selectFacts = (s: GameState): Fact[] => s.memory.facts;
export const selectPlayerPins = (s: GameState): string[] => s.memory.playerPins;
export const selectChapters = (s: GameState): Chapter[] => s.memory.chapters;
export const selectPendingChapters = (s: GameState): Chapter[] => s.memory.chapters.filter((c) => c.status === 'summaryPending');
export const selectArc = (s: GameState): MemorySlice['arc'] => s.memory.arc;
export const selectCurrentChapter = (s: GameState): MemorySlice['current'] => s.memory.current;
export const selectOpenReview = (s: GameState): ReviewItem[] => s.memory.review.filter((r) => r.status === 'open');
export const selectReview = (s: GameState): ReviewItem[] => s.memory.review;

/**
 * Engine pins (architecture §7, D-46): the master and apprentices (ranks, M7), open promises and
 * debts, lasting injuries (health, M5). Derived, never stored. None of those features exist in M2,
 * so this is empty until they do.
 */
export const selectEnginePinnedFactIds = (_s: GameState): string[] => [];
export type { Chapter, Fact, ReviewItem } from './memory';
