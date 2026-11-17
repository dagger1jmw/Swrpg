// Ranks feature, minimal for M3: the rank chosen at creation, fixed until M7 (promotionProposed,
// trials, standing). No events and no day hook yet.
import { RANK_BY_ID } from '../../data/rankMinimums';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { ranksSliceSchema, type RanksSlice } from './ranks';
import { selectRank, selectRankName } from './selectors';

export const ranksFeature: FeatureModule<RanksSlice, GameState> = {
  id: 'ranks',
  version: 1,
  initialState: (ctx) => ({ rank: ctx.rank && RANK_BY_ID.has(ctx.rank) ? ctx.rank : 'none' }),
  // Saves from M1/M2: the migrated outsider has no rank.
  emptyState: () => ({ rank: 'none' }),
  stateSchema: ranksSliceSchema,
  events: {},
  selectors: { rank: selectRank, rankName: selectRankName },
};
