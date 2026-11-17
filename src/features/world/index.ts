// World feature (architecture §10 slot 8; D-136). In a montage or time skip it rolls once per day for
// a weighted world event (src/data/worldEvents.config.ts): minor events go into the report; a
// significant one interrupts the jump and the story zooms to a moment. The engine picks the kind and
// who or what is involved; the AI narrates it (worldEventsTold marks them told after the narration).
import { z } from 'zod';
import { WORLD_EVENT_CHANCE, WORLD_EVENT_KINDS, WORLD_LOG_MAX, type WorldEventKind } from '../../data/worldEvents.config';
import { fromAbsSecond } from '../../engine/calendar';
import { nextFloat, type RngState } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { selectPath } from '../character/selectors';
import { selectNpcs } from '../npcs/selectors';
import { selectRank } from '../ranks/selectors';
import { selectOpenThreads } from '../threads/selectors';
import { emptyWorld, worldSliceSchema, type WorldEvent, type WorldSlice } from './world';
import { selectUntoldWorldEvents, selectWorldLog } from './selectors';

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

export const worldFeature: FeatureModule<WorldSlice, GameState> = {
  id: 'world',
  version: 1,
  initialState: () => emptyWorld(),
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
        return { slice: { log: [...slice.log, ev].slice(-WORLD_LOG_MAX), nextSeq: slice.nextSeq + 1 } };
      },
    },
    /** The pipeline marks the events a narration told (after the turn commits its reply). */
    worldEventsTold: {
      schema: z.object({ type: z.literal('worldEventsTold'), ids: z.array(z.string()), turn: z.number().int().min(0) }),
      sources: ['engine'],
      handle: (slice, e) => {
        const ids = new Set(e['ids'] as string[]);
        return { slice: { ...slice, log: slice.log.map((x) => (ids.has(x.id) ? { ...x, narratedTurn: Number(e['turn']) } : x)) } };
      },
    },
  },
  onTimeAdvanced: (slice, step, ctx) => {
    if (!step.endsDay || !step.jump) return { slice };
    // The event belongs to the day that begins at this midnight (the story resumes that morning).
    const day = fromAbsSecond(step.toAbs).day;
    const r = rollWorldEvent(ctx.state, ctx.state.meta.rngState, day);
    if (!r.event) return { slice, rng: r.rng };
    const ev = r.event;
    return {
      slice,
      rng: r.rng,
      emit: [{ type: 'worldEventRolled', ...ev }],
      notices: [`World: ${ev.summary}.`],
      ...(ev.significant ? { interrupt: ev.summary } : {}),
    };
  },
  selectors: { log: selectWorldLog, untold: selectUntoldWorldEvents },
  promptSection: (s) => {
    const untold = selectUntoldWorldEvents(s);
    if (!untold.length) return null;
    return `WORLD EVENTS TO TELL (engine-rolled; narrate them, never invent outcomes beyond them): ${untold.map((e) => `${e.id} ${e.significant ? '[significant] ' : ''}${e.summary}${e.refs.length ? ` (${e.refs.join(', ')})` : ''}`).join('; ')}`;
  },
};
