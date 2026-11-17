import { uniqueAliasMatch } from '../../engine/aliases';
import type { GameState } from '../../state/gameState';
import type { Thread } from './threads';

export const selectThreads = (s: GameState): Thread[] => Object.values(s.threads.byId);
export const selectOpenThreads = (s: GameState): Thread[] => selectThreads(s).filter((t) => t.status === 'open');
export const selectThread = (s: GameState, id: string): Thread | null => s.threads.byId[id] ?? null;

export const resolveThreadRef = (s: GameState, ref: string): string | null => {
  if (ref.startsWith('thread:')) return s.threads.byId[ref] ? ref : null;
  return uniqueAliasMatch(selectThreads(s), (t) => [t.title], ref)?.id ?? null;
};
