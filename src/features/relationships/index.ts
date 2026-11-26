// relationships feature (architecture §2): a value per NPC from AI deltas (-3..+3), engine-scaled
// (D-82). Labels are derived. Drift toward neutral and shared-training gains with time advance (M4, D-137).
import { z } from 'zod';
import { LIMITS, RELATIONSHIP_DRIFT, RELATIONSHIP_POINTS_PER_DELTA, RELATIONSHIP_RANGE } from '../../data/entities.config';
import { fromAbsSecond } from '../../engine/calendar';
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
        // A relationship that changes is a social line the code logs (m8-skills, D-513): Charisma XP, falling off by the day.
        const delta = Math.abs(Number(e['delta']));
        return {
          slice: { byNpcId: { ...slice.byNpcId, [id]: { value, lastDay: selectNow(ctx.state).day, lastReason: String(e['reason']) } } },
          ...(value !== prev && delta > 0 ? { emit: [{ type: 'playXpEarned', source: 'socialLine', stakes: delta >= 3 ? 'major' : delta >= 2 ? 'notable' : 'minor', why: 'a relationship changed' }] } : {}),
          notes: [`${id} relationship ${prev} -> ${value}`],
        };
      },
    },
    /** Hours of a routine session shared with a teacher or partner (D-137); routines emit it in jumps. */
    sharedTraining: {
      schema: z.object({ type: z.literal('sharedTraining'), npcId: z.string(), hours: z.number().min(0).max(24) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const id = String(e['npcId']);
        if (!selectNpc(ctx.state, id)) return { reject: `unknown npc ${id}` };
        const prev = slice.byNpcId[id];
        const before = prev?.value ?? 0;
        const gain = Number(e['hours']) * RELATIONSHIP_DRIFT.perSharedHour;
        const value = before >= RELATIONSHIP_DRIFT.sharedCap ? before : Math.min(RELATIONSHIP_DRIFT.sharedCap, before + gain);
        return { slice: { byNpcId: { ...slice.byNpcId, [id]: { value, lastDay: selectNow(ctx.state).day, lastReason: prev?.lastReason ?? 'trained together' } } } };
      },
    },
  },
  // Drift toward neutral without contact (architecture §9; D-82 deferred it to M4).
  onTimeAdvanced: (slice, step) => {
    if (!step.endsDay) return { slice };
    const day = fromAbsSecond(step.toAbs).day;
    let changed = false;
    const byNpcId = { ...slice.byNpcId };
    for (const [id, r] of Object.entries(slice.byNpcId)) {
      const since = day - r.lastDay;
      if (since < RELATIONSHIP_DRIFT.graceDays || (since - RELATIONSHIP_DRIFT.graceDays) % RELATIONSHIP_DRIFT.everyDays !== 0) continue;
      if (Math.abs(r.value) <= RELATIONSHIP_DRIFT.floor) continue;
      const toward = r.value > 0 ? -RELATIONSHIP_DRIFT.points : RELATIONSHIP_DRIFT.points;
      const value = r.value > 0 ? Math.max(RELATIONSHIP_DRIFT.floor, r.value + toward) : Math.min(-RELATIONSHIP_DRIFT.floor, r.value + toward);
      byNpcId[id] = { ...r, value };
      changed = true;
    }
    return { slice: changed ? { byNpcId } : slice };
  },
  selectors: {},
};
