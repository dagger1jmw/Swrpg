// memory feature (architecture §2, §7): facts, pins, chapters, the arc, the open chapter's
// signals and the review queue. Policy and retrieval are pure code in src/memory/ (D-17).
import { z } from 'zod';
import { MEMORY_LIMITS } from '../../data/memory.config';
import { normalizeAlias } from '../../engine/aliases';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { selectNow, selectTurnInPlay } from '../clock/selectors';
import { memorySliceSchema, type Chapter, type MemorySlice, type ReviewItem } from './memory';
import { selectFacts, selectOpenReview } from './selectors';

const emptyMemory = (startTurn: number, startDay: number): MemorySlice => ({
  facts: [],
  playerPins: [],
  chapters: [],
  arc: null,
  current: { startTurn, startDay, signals: [] },
  review: [],
  nextSeq: 1,
});

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const ids = z.array(z.string());

export const memoryFeature: FeatureModule<MemorySlice, GameState> = {
  id: 'memory',
  version: 1,
  initialState: (ctx) => emptyMemory(0, ctx.start.day),
  // A save from before M2: the first chapter starts at that save's turn and day.
  emptyState: (raw) => {
    const meta = raw['meta'] as { turn?: unknown } | undefined;
    const clock = raw['clock'] as { now?: { day?: unknown } } | undefined;
    return emptyMemory(num(meta?.turn, 0), num(clock?.now?.day, 0));
  },
  stateSchema: memorySliceSchema,
  events: {
    factLearned: {
      schema: z.object({
        type: z.literal('factLearned'),
        aboutRef: z.string().describe('ID (or temp key) of who or what the fact is about; "pc" for the player character'),
        fact: z.string().min(1).max(MEMORY_LIMITS.fact).describe('One lasting fact worth remembering, in one sentence'),
        importance: z.enum(['minor', 'major']),
      }),
      sources: ['ai'],
      refFields: ['aboutRef'],
      narrative: () => true,
      handle: (slice, e, ctx) => {
        const text = String(e['fact']).trim();
        const aboutRef = String(e['aboutRef']);
        if (slice.facts.some((f) => f.aboutRef === aboutRef && f.text === text)) return { slice, notes: ['the same fact is already recorded'] };
        const fact = {
          id: `fact:${slice.nextSeq}`,
          aboutRef,
          text,
          turn: selectTurnInPlay(ctx.state),
          day: selectNow(ctx.state).day,
          importance: e['importance'] as 'minor' | 'major',
        };
        return { slice: { ...slice, facts: [...slice.facts, fact], nextSeq: slice.nextSeq + 1 } };
      },
    },
    factPinned: {
      schema: z.object({ type: z.literal('factPinned'), factId: z.string(), pinned: z.boolean() }),
      sources: ['player'],
      handle: (slice, e) => {
        const id = String(e['factId']);
        if (!slice.facts.some((f) => f.id === id)) return { reject: `unknown fact ${id}` };
        const without = slice.playerPins.filter((p) => p !== id);
        return { slice: { ...slice, playerPins: e['pinned'] === true ? [...without, id] : without } };
      },
    },
    // AI hint for chapter close only (architecture §3).
    sceneEnded: {
      schema: z.object({ type: z.literal('sceneEnded'), reason: z.string().max(200) }),
      sources: ['ai'],
      narrative: () => true,
      handle: (slice, e, ctx) => ({
        slice: { ...slice, current: { ...slice.current, signals: [...slice.current.signals, { kind: 'sceneEnded' as const, turn: selectTurnInPlay(ctx.state), reason: String(e['reason']) }] } },
      }),
    },
    // Engine: an unknown name the player resolves in the People tab (architecture §7).
    reviewQueued: {
      schema: z.object({ type: z.literal('reviewQueued'), name: z.string().min(1).max(80), context: z.string().max(MEMORY_LIMITS.reviewContext) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const name = String(e['name']).trim();
        if (slice.review.some((r) => r.status === 'open' && normalizeAlias(r.name) === normalizeAlias(name))) return { slice, notes: [`"${name}" is already awaiting review`] };
        const item: ReviewItem = { id: `review:${slice.nextSeq}`, name, turn: selectTurnInPlay(ctx.state), context: String(e['context']), status: 'open', entityId: null };
        return { slice: { ...slice, review: [...slice.review, item], nextSeq: slice.nextSeq + 1 } };
      },
    },
    // Player (or engine, exact match only): the review item was mapped to an entity, created as one, or dismissed.
    reviewResolved: {
      schema: z.object({
        type: z.literal('reviewResolved'),
        reviewId: z.string(),
        resolution: z.enum(['mapped', 'created', 'dismissed']),
        entityRef: z.string().optional(),
      }),
      // Engine: an open name that now matches an entity exactly (D-94).
      sources: ['player', 'engine'],
      refFields: ['entityRef'],
      handle: (slice, e) => {
        const id = String(e['reviewId']);
        const item = slice.review.find((r) => r.id === id);
        if (!item) return { reject: `unknown review item ${id}` };
        if (item.status !== 'open') return { reject: `review item ${id} is already ${item.status}` };
        const entityId = typeof e['entityRef'] === 'string' ? e['entityRef'] : null;
        if (e['resolution'] !== 'dismissed' && entityId === null) return { reject: 'mapped or created needs an entity' };
        const resolved: ReviewItem = { ...item, status: e['resolution'] as ReviewItem['status'], entityId };
        return { slice: { ...slice, review: slice.review.map((r) => (r.id === id ? resolved : r)) } };
      },
    },
    // Engine: the chapter-close policy (src/memory/chapterClose.ts) decided to close; tags are code-computed.
    chapterClosed: {
      schema: z.object({
        type: z.literal('chapterClosed'),
        reason: z.string(),
        turnRange: z.tuple([z.number().int(), z.number().int()]),
        dayRange: z.tuple([z.number().int(), z.number().int()]),
        locationIds: ids,
        entityIds: ids,
        threadIds: ids,
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const [from, to] = e['turnRange'] as [number, number];
        if (from !== slice.current.startTurn || to < from) return { reject: `chapter range ${from}-${to} does not start the open chapter at ${slice.current.startTurn}` };
        const chapter: Chapter = {
          id: `chapter:${slice.nextSeq}`,
          turnRange: [from, to],
          dayRange: e['dayRange'] as [number, number],
          locationIds: e['locationIds'] as string[],
          entityIds: e['entityIds'] as string[],
          threadIds: e['threadIds'] as string[],
          closeReason: String(e['reason']),
          summary: null,
          status: 'summaryPending',
        };
        return {
          slice: { ...slice, chapters: [...slice.chapters, chapter], current: { startTurn: to + 1, startDay: selectNow(ctx.state).day, signals: [] }, nextSeq: slice.nextSeq + 1 },
          mintedId: chapter.id,
        };
      },
    },
    // Summary call (D-57): written once, never rewritten; the arc is replaced with each summary.
    chapterSummarized: {
      schema: z.object({
        type: z.literal('chapterSummarized'),
        chapterId: z.string(),
        chapterSummary: z.string().min(1).max(MEMORY_LIMITS.chapterSummary),
        arcSummary: z.string().min(1).max(MEMORY_LIMITS.arc),
      }),
      sources: ['summary'],
      handle: (slice, e) => {
        const id = String(e['chapterId']);
        const ch = slice.chapters.find((c) => c.id === id);
        if (!ch) return { reject: `unknown chapter ${id}` };
        if (ch.status !== 'summaryPending') return { reject: `chapter ${id} already has its summary` };
        const done: Chapter = { ...ch, summary: String(e['chapterSummary']), status: 'closed' };
        // A retried older chapter never overwrites an arc written after a newer chapter.
        const arcIndex = slice.arc ? slice.chapters.findIndex((c) => c.id === slice.arc!.atChapter) : -1;
        const thisIndex = slice.chapters.findIndex((c) => c.id === id);
        const arc = thisIndex >= arcIndex ? { text: String(e['arcSummary']), atChapter: id } : slice.arc;
        return { slice: { ...slice, chapters: slice.chapters.map((c) => (c.id === id ? done : c)), arc } };
      },
    },
  },
  selectors: { facts: selectFacts, openReview: selectOpenReview },
};
