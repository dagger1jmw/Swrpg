// relationships feature (architecture §2): a value per NPC from AI deltas (-3..+3), engine-scaled
// (D-82). Labels are derived. Drift over time arrives with time advance in M4.
import { z } from 'zod';
import { LIMITS, RELATIONSHIP_POINTS_PER_DELTA, RELATIONSHIP_RANGE } from '../../data/entities.config';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { selectNow } from '../clock/selectors';
import { selectNpc, selectNpcs } from '../npcs/selectors';
import { relationshipsSliceSchema, type RelationshipsSlice } from './relationships';

export const relationshipsFeature: FeatureModule<RelationshipsSlice, GameState> = {
  id: 'relationships',
  version: 1,
  initialState: () => ({ byNpcId: {} }),
  emptyState: () => ({ byNpcId: {} }),
  stateSchema: relationshipsSliceSchema,
  events: {
    relationshipChanged: {
      schema: z.object({
        type: z.literal('relationshipChanged'),
        npcRef: z.string(),
        delta: z.number().int().min(-3).max(3).describe('How the NPC now feels about the player character: -3 much worse .. +3 much better'),
        reason: z.string().max(LIMITS.reason),
      }),
      sources: ['ai'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: { npcRef: ['npc'] },
      narrative: (s) => selectNpcs(s).length > 0,
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        if (!selectNpc(ctx.state, id)) return { reject: `unknown npc ${id}` };
        const prev = slice.byNpcId[id]?.value ?? 0;
        const value = Math.max(-RELATIONSHIP_RANGE, Math.min(RELATIONSHIP_RANGE, prev + Number(e['delta']) * RELATIONSHIP_POINTS_PER_DELTA));
        return {
          slice: { byNpcId: { ...slice.byNpcId, [id]: { value, lastDay: selectNow(ctx.state).day, lastReason: String(e['reason']) } } },
          notes: [`${id} relationship ${prev} -> ${value}`],
        };
      },
    },
  },
  selectors: {},
};
