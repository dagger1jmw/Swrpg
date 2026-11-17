// threads feature (architecture §2): story threads with stakes, notes and an engine-mapped
// deadline. Escalation and deadline consequences come with the thread day hook in M4.
import { z } from 'zod';
import { DEADLINE_DAYS, DEADLINE_HINTS, LIMITS, THREAD_OUTCOMES, type DeadlineHint } from '../../data/entities.config';
import { mintId } from '../../engine/aliases';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { selectNow } from '../clock/selectors';
import { threadsSliceSchema, type Thread, type ThreadsSlice } from './threads';
import { resolveThreadRef, selectOpenThreads, selectThreads } from './selectors';

const threadRefKinds = { threadRef: ['thread'] } as const;

function openThread(slice: ThreadsSlice, id: string, note: string, turn: number): ThreadsSlice | { reject: string } {
  const t = slice.byId[id];
  if (!t) return { reject: `unknown thread ${id}` };
  if (t.status !== 'open') return { reject: `thread ${id} is ${t.status}` };
  return { byId: { ...slice.byId, [id]: { ...t, notes: note ? [...t.notes, note] : t.notes, lastTurn: turn } } };
}

export const threadsFeature: FeatureModule<ThreadsSlice, GameState> = {
  id: 'threads',
  version: 1,
  initialState: () => ({ byId: {} }),
  emptyState: () => ({ byId: {} }),
  stateSchema: threadsSliceSchema,
  refKind: 'thread',
  resolveRef: resolveThreadRef,
  events: {
    threadOpened: {
      schema: z.object({
        type: z.literal('threadOpened'),
        key: z.string().optional().describe('Same-turn temp key like tmp:3'),
        title: z.string().min(1).max(LIMITS.threadTitle).describe('A short name for the story thread, e.g. "The missing holocron"'),
        stakes: z.string().max(LIMITS.threadStakes).describe('What is at stake if it goes well or badly'),
        deadlineHint: z.enum(DEADLINE_HINTS).optional().describe('Only when the story sets a time pressure'),
        entityRefs: z.array(z.string()).max(8).describe('IDs (or temp keys) of the people and places involved'),
      }),
      sources: ['ai'],
      phase: 'create',
      refFields: ['entityRefs'],
      narrative: () => true,
      handle: (slice, e, ctx) => {
        const title = String(e['title']).trim();
        const dup = resolveThreadRef(ctx.state, title);
        if (dup && slice.byId[dup]?.status === 'open') return { slice, mintedId: dup, notes: [`"${title}" matched open ${dup}; not opened again`] };
        const day = selectNow(ctx.state).day;
        const hint = e['deadlineHint'] as DeadlineHint | undefined;
        const id = mintId('thread', title, (x) => x in slice.byId);
        const t: Thread = {
          id,
          title,
          stakes: String(e['stakes']),
          status: 'open',
          deadlineDay: hint ? day + DEADLINE_DAYS[hint] : null,
          escalation: 0,
          notes: [],
          entityRefs: [...(e['entityRefs'] as string[])],
          openedDay: day,
          openedTurn: ctx.state.meta.turn,
          closedDay: null,
          lastTurn: ctx.state.meta.turn,
        };
        return { slice: { byId: { ...slice.byId, [id]: t } }, mintedId: id };
      },
    },
    threadProgressed: {
      schema: z.object({ type: z.literal('threadProgressed'), threadRef: z.string(), note: z.string().min(1).max(LIMITS.note) }),
      sources: ['ai'],
      targetField: 'threadRef',
      refFields: ['threadRef'],
      refKinds: threadRefKinds,
      narrative: (s) => selectOpenThreads(s).length > 0,
      handle: (slice, e, ctx) => {
        const r = openThread(slice, String(e['threadRef']), String(e['note']), ctx.state.meta.turn);
        return 'reject' in r ? r : { slice: r };
      },
    },
    threadResolved: {
      schema: z.object({
        type: z.literal('threadResolved'),
        threadRef: z.string(),
        outcome: z.enum(THREAD_OUTCOMES),
        note: z.string().max(LIMITS.note),
      }),
      sources: ['ai'],
      targetField: 'threadRef',
      refFields: ['threadRef'],
      refKinds: threadRefKinds,
      narrative: (s) => selectOpenThreads(s).length > 0,
      handle: (slice, e, ctx) => {
        const id = String(e['threadRef']);
        const r = openThread(slice, id, String(e['note']), ctx.state.meta.turn);
        if ('reject' in r) return r;
        const t = r.byId[id]!;
        return { slice: { byId: { ...r.byId, [id]: { ...t, status: e['outcome'] as Thread['status'], closedDay: selectNow(ctx.state).day } } } };
      },
    },
  },
  selectors: { all: selectThreads, open: selectOpenThreads },
};
