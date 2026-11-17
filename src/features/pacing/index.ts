// Pacing feature (architecture §8). M1: moment and scene only.
import { z } from 'zod';
import { DEFAULT_PACING, M1_PACING_LEVELS, PACING_LEVELS, type PacingLevel } from '../../data/pacing.config';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { moodTagsSchema, pacingSliceSchema, type PacingSlice } from './pacing';
import { selectMoodTags, selectPacingLevel, selectPresentNpcIds } from './selectors';

/** Until M4, montage and timeSkip requests fall back to scene (logged). */
export function playableLevel(requested: PacingLevel): { level: PacingLevel; note?: string } {
  if ((M1_PACING_LEVELS as readonly string[]).includes(requested)) return { level: requested };
  return { level: 'scene', note: `pacing ${requested} is not available until M4; using scene` };
}

export const pacingFeature: FeatureModule<PacingSlice, GameState> = {
  id: 'pacing',
  version: 2,
  initialState: () => ({ level: DEFAULT_PACING, scene: { moodTags: [], presentNpcIds: [] } }),
  migrations: {
    // v2 (M2): scene.presentNpcIds.
    2: (old) => {
      const o = old as { level: unknown; scene: { moodTags: unknown } };
      return { ...o, scene: { ...o.scene, presentNpcIds: [] } };
    },
  },
  stateSchema: pacingSliceSchema,
  events: {
    // AI hint: applied only when it asks for moment; anything else is shown as a choice (architecture §3).
    pacingSuggested: {
      schema: z.object({ type: z.literal('pacingSuggested'), level: z.enum(PACING_LEVELS), reason: z.string().max(200) }),
      sources: ['ai'],
      narrative: () => true,
      handle: (slice, e) => {
        if (e['level'] !== 'moment') return { reject: `pacingSuggested ${String(e['level'])}: only moment applies automatically` };
        return { slice: { ...slice, level: 'moment' } };
      },
    },
    // Engine sets the level from the intent's requestedPacing (or a clicked choice's pacingHint).
    pacingSet: {
      schema: z.object({ type: z.literal('pacingSet'), level: z.enum(PACING_LEVELS) }),
      sources: ['engine', 'player'],
      handle: (slice, e) => {
        const p = playableLevel(e['level'] as PacingLevel);
        return { slice: { ...slice, level: p.level }, ...(p.note ? { notes: [p.note] } : {}) };
      },
    },
    // Built by the turn pipeline from the narrative reply's `scene` object (AI text and refs).
    // Unknown present refs are dropped (and queued for review); everyone present is marked seen.
    sceneUpdated: {
      schema: z.object({ type: z.literal('sceneUpdated'), moodTags: moodTagsSchema, presentNpcRefs: z.array(z.string()).max(12) }),
      sources: ['ai'],
      refFields: ['presentNpcRefs'],
      refKinds: { presentNpcRefs: ['npc'] },
      handle: (slice, e) => {
        const present = [...new Set(e['presentNpcRefs'] as string[])].filter((id) => id.startsWith('npc:'));
        return {
          slice: { ...slice, scene: { moodTags: [...(e['moodTags'] as string[])], presentNpcIds: present } },
          ...(present.length ? { emit: [{ type: 'npcsSeen', npcIds: present }] } : {}),
        };
      },
    },
  },
  selectors: { level: selectPacingLevel, moodTags: selectMoodTags, presentNpcIds: selectPresentNpcIds },
};
