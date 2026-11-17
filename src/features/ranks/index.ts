// Ranks feature, minimal for M3: the rank chosen at creation, fixed until M7 (promotionProposed,
// trials, standing). No events and no day hook yet.
import { z } from 'zod';
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
  events: {
    /**
     * Engine-only rank change (D-131). Nothing in play emits it before M7 (promotionProposed, trials);
     * the lifetime test uses it for its profiles' rank ages.
     */
    rankSet: {
      schema: z.object({ type: z.literal('rankSet'), rank: z.string() }),
      sources: ['engine'],
      handle: (_slice, e) => (RANK_BY_ID.has(String(e['rank'])) ? { slice: { rank: String(e['rank']) } } : { reject: `unknown rank ${String(e['rank'])}` }),
    },
  },
  selectors: { rank: selectRank, rankName: selectRankName },
};
