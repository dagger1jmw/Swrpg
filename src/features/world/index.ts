// World feature (architecture §10 slot 8; D-136). In a montage or time skip it rolls once per day for
// a weighted world event (src/data/worldEvents.config.ts): minor events go into the report; a
// significant one interrupts the jump and the story zooms to a moment. The engine picks the kind and
// who or what is involved; the AI narrates it (worldEventsTold marks them told after the narration).
// Since M8 Phase A (D-466) it also runs the world-event tag network: every time step brings it up to date
// (network.ts), and the AI only ever narrates what it decided.
import { z } from 'zod';
import { WORLD_EVENT_CHANCE, WORLD_EVENT_KINDS, WORLD_LOG_MAX, type WorldEventKind } from '../../data/worldEvents.config';
import { fromAbsSecond } from '../../engine/calendar';
import { nextFloat, type RngState } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import { CONTROL_SIDES, type ControlSide } from '../../data/worldControl';
import { WORLD_NETWORK, type WorldNetwork } from '../../data/worldNetwork';
import { ACTION_TYPES, type ActionType } from '../../data/checks.config';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectPath } from '../character/selectors';
import { selectNpcs } from '../npcs/selectors';
import { selectRank } from '../ranks/selectors';
import { selectOpenThreads } from '../threads/selectors';
import { openNetwork, recordAction, reviewNetwork } from './network';
import { handoffLines, selectTimelineHandoff, selectUntoldWorldEvents, selectWorldAction, selectWorldFacts, selectWorldLog } from './selectors';
import { emptyWorld, migrateWorldV1, worldSliceSchema, type NetworkState, type WorldEvent, type WorldSlice } from './world';

function eligible(k: WorldEventKind, s: GameState, npcs: number, threads: number): boolean {
  if (k.paths && !k.paths.includes(selectPath(s))) return false;
  if (k.ranks && !k.ranks.includes(selectRank(s))) return false;
  if (k.needs === 'npc' && npcs === 0) return false;
  if (k.needs === 'thread' && threads === 0) return false;
  return true;
}

/** One day's roll (pure): the event, if any, and the RNG after it. */
export function rollWorldEvent(s: GameState, rng: RngState, day: number): { event: Omit<WorldEvent, 'id' | 'narratedTurn'> | null; rng: RngState } {
  let r = rng;
  let u: number;
  [u, r] = nextFloat(r);
  const significant = u < WORLD_EVENT_CHANCE.significant;
  if (!significant && u >= WORLD_EVENT_CHANCE.significant + WORLD_EVENT_CHANCE.minor) return { event: null, rng: r };
  const npcs = selectNpcs(s)
    .filter((n) => n.status === 'active')
    .sort((a, b) => a.id.localeCompare(b.id));
  const threads = selectOpenThreads(s).sort((a, b) => a.id.localeCompare(b.id));
  const pool = WORLD_EVENT_KINDS.filter((k) => k.significant === significant && eligible(k, s, npcs.length, threads.length));
  if (!pool.length) return { event: null, rng: r };
  const total = pool.reduce((a, k) => a + k.weight, 0);
  [u, r] = nextFloat(r);
  let pick = pool[pool.length - 1]!;
  let acc = 0;
  for (const k of pool) {
    acc += k.weight / total;
    if (u < acc) {
      pick = k;
      break;
    }
  }
  const refs: string[] = [];
  let summary = pick.summary;
  if (pick.needs === 'npc') {
    [u, r] = nextFloat(r);
    const n = npcs[Math.min(npcs.length - 1, Math.floor(u * npcs.length))]!;
    refs.push(n.id);
    summary = summary.replace('{npc}', n.name);
  } else if (pick.needs === 'thread') {
    [u, r] = nextFloat(r);
    const t = threads[Math.min(threads.length - 1, Math.floor(u * threads.length))]!;
    refs.push(t.id);
    summary = summary.replace('{thread}', t.title);
  }
  return { event: { day, kind: pick.id, significant, refs, summary }, rng: r };
}

/** Marks what a narration told: rolled events, timeline events, broken conditions and plot points. */
function markTold(net: NetworkState, ids: ReadonlySet<string>, turn: number): NetworkState {
  const mark = <T extends { toldTurn: number | null }>(rows: Record<string, T>): Record<string, T> => Object.fromEntries(Object.entries(rows).map(([k, r]) => [k, ids.has(k) && r.toldTurn === null ? { ...r, toldTurn: turn } : r]));
  return { ...net, events: mark(net.events), tags: mark(net.tags), plotPoints: mark(net.plotPoints) };
}

/** The world feature over a network: the shipped one in the game, a fixture in tests. */
export const makeWorldFeature = (network: WorldNetwork): FeatureModule<WorldSlice, GameState> => ({
  id: 'world',
  version: 2,
  migrations: { 2: migrateWorldV1 },
  // A campaign opens with everything up to its start date standing as the lore records it.
  initialState: (ctx) => {
    const w = emptyWorld(ctx.start.day);
    return { ...w, network: openNetwork(network, w.network, ctx.start.day) };
  },
  emptyState: () => emptyWorld(),
  stateSchema: worldSliceSchema,
  events: {
    worldEventRolled: {
      schema: z.object({
        type: z.literal('worldEventRolled'),
        day: z.number().int(),
        kind: z.string(),
        significant: z.boolean(),
        refs: z.array(z.string()),
        summary: z.string().max(200),
      }),
      sources: ['engine'],
      handle: (slice, e) => {
        if (!WORLD_EVENT_KINDS.some((k) => k.id === e['kind'])) return { reject: `unknown world event kind ${String(e['kind'])}` };
        const ev: WorldEvent = {
          id: `world:${slice.nextSeq}`,
          day: Number(e['day']),
          kind: String(e['kind']),
          significant: e['significant'] === true,
          refs: [...(e['refs'] as string[])],
          summary: String(e['summary']),
          narratedTurn: null,
        };
        return { slice: { ...slice, log: [...slice.log, ev].slice(-WORLD_LOG_MAX), nextSeq: slice.nextSeq + 1 } };
      },
    },
    /** The pipeline marks the events a narration told (after the turn commits its reply). */
    worldEventsTold: {
      schema: z.object({ type: z.literal('worldEventsTold'), ids: z.array(z.string()), turn: z.number().int().min(0) }),
      sources: ['engine'],
      handle: (slice, e) => {
        const ids = new Set(e['ids'] as string[]);
        const turn = Number(e['turn']);
        return { slice: { ...slice, log: slice.log.map((x) => (ids.has(x.id) ? { ...x, narratedTurn: turn } : x)), network: markTold(slice.network, ids, turn) } };
      },
    },
    /** Engine (the time hook): the network brought up to a day; what it decided is in the notes and the saved state. */
    worldTimelineReviewed: {
      schema: z.object({ type: z.literal('worldTimelineReviewed'), day: z.number().int() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const r = reviewNetwork(network, slice.network, selectWorldFacts(ctx.state), Number(e['day']));
        return { slice: { ...slice, network: r.state }, notes: r.changes.map((c) => c.note) };
      },
    },
    /**
     * Engine (the turn's resolve step): a check the engine rolled for the player, counted against the open conditions it
     * is about. The roll is the scene's own; the guard sets the DC it is measured against here.
     */
    worldActionRecorded: {
      schema: z.object({
        type: z.literal('worldActionRecorded'),
        actionType: z.enum(ACTION_TYPES),
        skillId: z.string().nullable(),
        total: z.number(),
        targets: z.array(z.string()),
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const s = ctx.state;
        const action = selectWorldAction(s, { actionType: e['actionType'] as ActionType, skillId: e['skillId'] as string | null, total: Number(e['total']), targets: e['targets'] as string[] });
        const day = s.clock.now.day;
        const r = recordAction(network, openNetwork(network, slice.network, day), selectWorldFacts(s), action, day);
        return { slice: { ...slice, network: r.state }, notes: r.notes };
      },
    },
    /** Engine only: a place changes hands in this campaign (a battle the engine resolved). Never from the narrator. */
    locationControlChanged: {
      schema: z.object({ type: z.literal('locationControlChanged'), place: z.string().min(1).max(60), side: z.enum(CONTROL_SIDES), note: z.string().max(300) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const change = { place: String(e['place']), side: e['side'] as ControlSide, day: ctx.state.clock.now.day, note: String(e['note']) };
        return { slice: { ...slice, network: { ...slice.network, control: [...slice.network.control, change] } }, notes: [`control: ${change.place} is now ${change.side}`] };
      },
    },
  },
  onTimeAdvanced: (slice, step, ctx) => {
    const day = fromAbsSecond(step.toAbs).day;
    const emit: GameEvent[] = [];
    const notices: string[] = [];
    let interrupt: string | undefined;
    let next = slice;
    if (network.events.length || slice.network.cursorDay !== day) {
      const review = reviewNetwork(network, slice.network, selectWorldFacts(ctx.state), day);
      // Nothing decided: only the cursor (and partial progress) moves. Otherwise it goes through an event, for the record.
      if (!review.changes.length) next = { ...slice, network: review.state };
      else {
        emit.push({ type: 'worldTimelineReviewed', day });
        for (const c of review.changes) {
          const title = network.events.find((e) => e.id === c.id)?.title;
          if (c.seen && title) notices.push(`World: ${title}.`);
          // A plot point's turn has no title the player should read before the story tells it.
          if (c.interrupt) interrupt ??= title ?? 'News that changes the course of events';
        }
      }
    }
    if (!step.endsDay || !step.jump) return { slice: next, ...(emit.length ? { emit, notices } : {}) };
    // The event belongs to the day that begins at this midnight (the story resumes that morning).
    const r = rollWorldEvent(ctx.state, ctx.state.meta.rngState, day);
    if (r.event) {
      emit.push({ type: 'worldEventRolled', ...r.event });
      notices.push(`World: ${r.event.summary}.`);
      if (r.event.significant) interrupt ??= r.event.summary;
    }
    return { slice: next, rng: r.rng, ...(emit.length ? { emit, notices } : {}), ...(interrupt !== undefined ? { interrupt } : {}) };
  },
  selectors: { log: selectWorldLog, untold: selectUntoldWorldEvents },
  promptSection: (s) => {
    const untold = selectUntoldWorldEvents(s);
    const rolled = untold.length
      ? [`WORLD EVENTS TO TELL (engine-rolled; narrate them, never invent outcomes beyond them): ${untold.map((e) => `${e.id} ${e.significant ? '[significant] ' : ''}${e.summary}${e.refs.length ? ` (${e.refs.join(', ')})` : ''}`).join('; ')}`]
      : [];
    const lines = [...rolled, ...handoffLines(selectTimelineHandoff(s, network))];
    return lines.length ? lines.join('\n') : null;
  },
});

export const worldFeature = makeWorldFeature(WORLD_NETWORK);
