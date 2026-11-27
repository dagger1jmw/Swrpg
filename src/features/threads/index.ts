// threads feature (architecture §2): story threads with stakes, notes and an engine-mapped
// deadline. The day hook raises escalation from the deadline (M4, D-135).
import { z } from 'zod';
import { COLD_STORE, DEADLINE_DAYS, DEADLINE_HINTS, LIMITS, THREAD_ESCALATION, THREAD_OUTCOMES, type DeadlineHint } from '../../data/entities.config';
import { fromAbsSecond } from '../../engine/calendar';
import type { GameEvent } from '../../state/types';
import { mintId } from '../../engine/aliases';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { selectNow, selectTurnInPlay } from '../clock/selectors';
import { threadsSliceSchema, type Thread, type ThreadsSlice } from './threads';
import { resolveThreadRef, selectOpenThreads, selectThreads } from './selectors';

const threadRefKinds = { threadRef: ['thread'] } as const;

function openThread(slice: ThreadsSlice, id: string, note: string, turn: number): ThreadsSlice | { reject: string } {
  const t = slice.byId[id];
  if (!t) return { reject: `unknown thread ${id}` };
  if (t.status !== 'open') return { reject: `thread ${id} is ${t.status}` };
  return { ...slice, byId: { ...slice.byId, [id]: { ...t, notes: note ? [...t.notes, note] : t.notes, lastTurn: turn } } };
}

/** The cold store (opt-2 H2): a thread closed a year keeps its last notes (what retrieval shows); older ones move to `cold`. */
function coldThreads(slice: ThreadsSlice, day: number): ThreadsSlice {
  let next = slice;
  for (const t of Object.values(slice.byId)) {
    if (t.status === 'open' || t.closedDay === null || day - t.closedDay < COLD_STORE.afterDays || t.notes.length <= COLD_STORE.threadNotesKept) continue;
    const cut = t.notes.length - COLD_STORE.threadNotesKept;
    next = { ...next, byId: { ...next.byId, [t.id]: { ...t, notes: t.notes.slice(cut) } }, cold: { ...(next.cold ?? {}), [t.id]: [...(next.cold?.[t.id] ?? []), ...t.notes.slice(0, cut)] } };
  }
  return next;
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
        key: z.string().optional(),
        title: z.string().min(1).max(LIMITS.threadTitle),
        stakes: z.string().max(LIMITS.threadStakes),
        deadlineHint: z.enum(DEADLINE_HINTS).optional(),
        entityRefs: z.array(z.string()).max(8),
      }),
      // engine: a start option opens its threads (D-401 [2]).
      sources: ['ai', 'engine'],
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
          openedTurn: selectTurnInPlay(ctx.state),
          closedDay: null,
          lastTurn: selectTurnInPlay(ctx.state),
        };
        return { slice: { ...slice, byId: { ...slice.byId, [id]: t } }, mintedId: id };
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
        const r = openThread(slice, String(e['threadRef']), String(e['note']), selectTurnInPlay(ctx.state));
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
        const r = openThread(slice, id, String(e['note']), selectTurnInPlay(ctx.state));
        if ('reject' in r) return r;
        const t = r.byId[id]!;
        return { slice: { ...r, byId: { ...r.byId, [id]: { ...t, status: e['outcome'] as Thread['status'], closedDay: selectNow(ctx.state).day } } } };
      },
    },
    /** The engine raised a thread's escalation from its deadline (D-60, D-135). */
    threadEscalated: {
      schema: z.object({ type: z.literal('threadEscalated'), threadRef: z.string(), level: z.number().int().min(1).max(3) }),
      sources: ['engine'],
      targetField: 'threadRef',
      handle: (slice, e) => {
        const id = String(e['threadRef']);
        const t = slice.byId[id];
        if (!t || t.status !== 'open') return { reject: `no open thread ${id}` };
        const level = Number(e['level']);
        if (level <= t.escalation) return { reject: `thread ${id} is already at escalation ${t.escalation}` };
        return { slice: { ...slice, byId: { ...slice.byId, [id]: { ...t, escalation: level } } } };
      },
    },
  },
  // Deadlines (architecture §10 slot 6, D-135): once per day, raise the escalation of open threads whose
  // deadline is near, here or past; the deadline day and being overdue interrupt a jump.
  onTimeAdvanced: (slice, step) => {
    if (!step.endsDay) return { slice };
    const day = fromAbsSecond(step.toAbs).day;
    const emit: GameEvent[] = [];
    const notices: string[] = [];
    let interrupt: string | undefined;
    for (const t of Object.values(slice.byId)) {
      if (t.status !== 'open' || t.deadlineDay === null) continue;
      const left = t.deadlineDay - day;
      const level = left <= -THREAD_ESCALATION.overdueDays ? 3 : left <= 0 ? 2 : left <= THREAD_ESCALATION.soonDays ? 1 : 0;
      if (level <= t.escalation) continue;
      emit.push({ type: 'threadEscalated', threadRef: t.id, level });
      const what = level === 3 ? `is ${-left} days overdue` : level === 2 ? 'has reached its deadline' : `is due in ${left} days`;
      notices.push(`"${t.title}" ${what}.`);
      if (level >= 2 && interrupt === undefined) interrupt = `"${t.title}" ${what}`;
    }
    return { slice: coldThreads(slice, day), ...(emit.length ? { emit } : {}), ...(notices.length ? { notices } : {}), ...(interrupt ? { interrupt } : {}) };
  },
  selectors: { all: selectThreads, open: selectOpenThreads },
};
