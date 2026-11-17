import { RANK_BY_ID } from '../../data/rankMinimums';
import type { GameState } from '../../state/gameState';

export const selectRank = (s: GameState): string => s.ranks.rank;
export const selectRankName = (s: GameState): string => RANK_BY_ID.get(s.ranks.rank)?.name ?? s.ranks.rank;
