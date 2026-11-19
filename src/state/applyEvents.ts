// applyEvents (architecture §3 rules, §11): routes each event to its single owning feature.
// Validation is Zod then the handler; failures are rejected with a reason, never repaired.
// Pure: no I/O, randomness only through meta.rngState.
import { EVENT_CAPS, MAX_EMIT_DEPTH, TEMP_KEY_PATTERN, type EventCap } from '../data/events.config';
import { advanceTime } from './advanceTime';
import type { AnyFeature, BaseState, EventDef, EventSource, GameEvent, Registry, ResolvedAction } from './types';

export interface AppliedEvent {
  event: GameEvent;
  source: EventSource;
  notes: string[];
}

export interface RejectedEvent {
  event: unknown;
  reason: string;
}

/** A reference no feature could resolve (no ID, no exact alias): it goes to the review queue. */
export interface UnknownRef {
  name: string;
  eventType: string;
  field: string;
}

export interface ApplyResult<S extends BaseState> {
  state: S;
  applied: AppliedEvent[];
  rejected: RejectedEvent[];
  /** Same-turn temp key -> minted ID (D-32), for scene refs and later lookups. */
  tempMap: Record<string, string>;
  /** Notices from time advances (birthdays, ...), for the report. */
  notices: string[];
  /** Refs that matched no entity (D-13); the pipeline queues them for player review. */
  unknownRefs: UnknownRef[];
  /** Set when a time advance was stopped by an interruption. */
  interrupted?: string;
}

export interface ApplyOptions {
  source: EventSource;
  /** Actions the TurnDraft already resolved (D-29). */
  resolved?: readonly ResolvedAction[];
  caps?: Readonly<Record<string, EventCap>>;
}

interface Owner<S extends BaseState> {
  feature: AnyFeature<S>;
  def: EventDef<unknown, S>;
}

export function eventOwners<S extends BaseState>(registry: Registry<S>): Map<string, Owner<S>> {
  const owners = new Map<string, Owner<S>>();
  for (const feature of registry) {
    for (const [type, def] of Object.entries(feature.events)) {
      const existing = owners.get(type);
      if (existing) throw new Error(`Event ${type} has two owners: ${existing.feature.id} and ${feature.id}`);
      owners.set(type, { feature, def: def as EventDef<unknown, S> });
    }
  }
  return owners;
}

function isEventLike(e: unknown): e is GameEvent {
  return typeof e === 'object' && e !== null && typeof (e as { type?: unknown }).type === 'string';
}

function targetOf(def: { targetField?: string | undefined }, e: GameEvent): string | undefined {
  if (!def.targetField) return undefined;
  const v = e[def.targetField];
  return typeof v === 'string' ? v : undefined;
}

interface Pending {
  event: GameEvent;
  index: number;
}

export function applyEvents<S extends BaseState>(
  registry: Registry<S>,
  initial: S,
  events: readonly unknown[],
  opts: ApplyOptions,
): ApplyResult<S> {
  const owners = eventOwners(registry);
  const caps = opts.caps ?? EVENT_CAPS;
  const applied: AppliedEvent[] = [];
  const rejected: RejectedEvent[] = [];
  const tempMap: Record<string, string> = {};
  const notices: string[] = [];
  const unknownRefs: UnknownRef[] = [];
  let interrupted: string | undefined;
  let state = initial;
  const resolvers = registry.filter((f) => f.resolveRef);

  // 1. Shape, owner, source and Zod validation.
  const valid: Pending[] = [];
  events.forEach((raw, index) => {
    const checked = validate(owners, raw, opts.source);
    if ('reason' in checked) rejected.push({ event: raw, reason: checked.reason });
    else valid.push({ event: checked.event, index });
  });

  // 2. De-duplicate (same type and target; exact duplicates when there is no target), first kept.
  const seen = new Set<string>();
  const deduped = valid.filter((p) => {
    const def = owners.get(p.event.type)!.def;
    const key = `${p.event.type}|${targetOf(def, p.event) ?? JSON.stringify(p.event)}`;
    if (seen.has(key)) {
      rejected.push({ event: p.event, reason: 'duplicate of an earlier event with the same type and target (merged, first kept)' });
      return false;
    }
    seen.add(key);
    return true;
  });

  // 3. Per-turn caps and 4. one entry point per action.
  const perType = new Map<string, number>();
  const perTarget = new Map<string, number>();
  const capped = deduped.filter((p) => {
    const { type } = p.event;
    const def = owners.get(type)!.def;
    const target = targetOf(def, p.event);
    const resolvedHit = (opts.resolved ?? []).some((r) => r.eventType === type && (r.target === undefined || r.target === target));
    if (resolvedHit) {
      rejected.push({ event: p.event, reason: 'already resolved by the TurnDraft (one entry point per action)' });
      return false;
    }
    const cap = caps[type];
    const nType = (perType.get(type) ?? 0) + 1;
    const tKey = `${type}|${target ?? ''}`;
    const nTarget = (perTarget.get(tKey) ?? 0) + 1;
    if (cap?.perTurn !== undefined && nType > cap.perTurn) {
      rejected.push({ event: p.event, reason: `cap exceeded: ${type} at most ${cap.perTurn} per turn` });
      return false;
    }
    if (cap?.perTarget !== undefined && target !== undefined && nTarget > cap.perTarget) {
      rejected.push({ event: p.event, reason: `cap exceeded: ${type} at most ${cap.perTarget} per target per turn` });
      return false;
    }
    perType.set(type, nType);
    perTarget.set(tKey, nTarget);
    return true;
  });

  // 5. Temp-key creation positions (D-32).
  const createdAt = new Map<string, number>();
  const ordered: Pending[] = [];
  for (const p of capped) {
    const def = owners.get(p.event.type)!.def;
    const key = p.event['key'];
    if (def.phase === 'create' && typeof key === 'string') {
      if (!TEMP_KEY_PATTERN.test(key)) {
        rejected.push({ event: p.event, reason: `invalid temp key ${key}` });
        continue;
      }
      if (createdAt.has(key)) {
        rejected.push({ event: p.event, reason: `temp key ${key} created twice` });
        continue;
      }
      createdAt.set(key, p.index);
    }
    ordered.push(p);
  }

  // 6. Apply order: creation, time, everything else, then 'last' events; reply order within each phase.
  const phaseRank = { create: 0, time: 1, other: 2, last: 3 } as const;
  ordered.sort((a, b) => {
    const pa = phaseRank[owners.get(a.event.type)!.def.phase ?? 'other'];
    const pb = phaseRank[owners.get(b.event.type)!.def.phase ?? 'other'];
    return pa - pb || a.index - b.index;
  });

  const applyOne = (event: GameEvent, source: EventSource, depth: number, index: number): void => {
    if (depth > MAX_EMIT_DEPTH) throw new Error(`Emitted events deeper than ${MAX_EMIT_DEPTH} (at ${event.type}): a handler loop`);
    const { feature, def } = owners.get(event.type)!;

    const substituted = substituteRefs(def, event, index, createdAt, tempMap, (ref, field) => {
      if (resolvers.length === 0) return ref; // no entity features: refs pass through unchanged
      const kinds = def.refKinds?.[field];
      for (const f of resolvers) {
        if (kinds && (!f.refKind || !kinds.includes(f.refKind))) continue;
        const id = f.resolveRef!(state, ref);
        if (id !== null) return id;
      }
      return null;
    });
    unknownRefs.push(...substituted.unknown.map((u) => ({ ...u, eventType: event.type })));
    if ('reason' in substituted) {
      rejected.push({ event, reason: substituted.reason });
      return;
    }
    const e = substituted.event;
    const result = def.handle(state[feature.id], e, { state, source, batch: applied, batchStart: initial });
    if ('reject' in result) {
      rejected.push({ event: e, reason: result.reject });
      return;
    }
    state = { ...state, [feature.id]: result.slice };
    if (result.rng) state = { ...state, meta: { ...state.meta, rngState: result.rng } };
    applied.push({ event: e, source, notes: [...substituted.notes, ...(result.notes ?? [])] });
    if (result.advance) {
      if (def.phase !== 'time') throw new Error(`${event.type} requested a time advance but is not a time-phase event`);
      const adv = advanceTime(registry, state, result.advance);
      state = adv.state;
      applied.push(...adv.applied);
      rejected.push(...adv.rejected);
      notices.push(...adv.notices);
      unknownRefs.push(...adv.unknownRefs);
      if (adv.interrupted !== undefined) interrupted ??= adv.interrupted;
    }
    const key = event['key'];
    if (def.phase === 'create' && typeof key === 'string' && result.mintedId) tempMap[key] = result.mintedId;

    for (const emitted of result.emit ?? []) {
      const checked = validate(owners, emitted, 'engine');
      if ('reason' in checked) {
        rejected.push({ event: emitted, reason: `emitted by ${event.type}: ${checked.reason}` });
        continue;
      }
      applyOne(checked.event, 'engine', depth + 1, index);
    }
  };

  for (const p of ordered) applyOne(p.event, opts.source, 0, p.index);
  return { state, applied, rejected, tempMap, notices, unknownRefs, ...(interrupted !== undefined ? { interrupted } : {}) };
}

function validate<S extends BaseState>(
  owners: Map<string, Owner<S>>,
  raw: unknown,
  source: EventSource,
): { event: GameEvent } | { reason: string } {
  if (!isEventLike(raw)) return { reason: 'not an event object with a string type' };
  const owner = owners.get(raw.type);
  if (!owner) return { reason: `unknown event type ${raw.type}` };
  if (!owner.def.sources.includes(source)) return { reason: `source ${source} may not send ${raw.type}` };
  const parsed = owner.def.schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { reason: `schema: ${issue ? `${issue.path.join('.') || '(root)'}: ${issue.message}` : 'invalid'}` };
  }
  return { event: parsed.data as GameEvent };
}

type Substituted =
  | { event: GameEvent; notes: string[]; unknown: Omit<UnknownRef, 'eventType'>[] }
  | { reason: string; unknown: Omit<UnknownRef, 'eventType'>[] };

/**
 * Maps temp keys to minted IDs (D-32) and resolves other refs through the entity features
 * (IDs or exact aliases, D-13). Unknown scalar refs reject the event; unknown array items are
 * dropped with a note.
 */
function substituteRefs(
  def: { refFields?: readonly string[] | undefined },
  event: GameEvent,
  index: number,
  createdAt: Map<string, number>,
  tempMap: Record<string, string>,
  resolve: (ref: string, field: string) => string | null,
): Substituted {
  const unknown: Omit<UnknownRef, 'eventType'>[] = [];
  const notes: string[] = [];
  if (!def.refFields?.length) return { event, notes, unknown };
  const out: Record<string, unknown> = { ...event };
  for (const field of def.refFields) {
    const v = out[field];
    if (v === undefined) continue;
    const isArray = Array.isArray(v);
    const values: unknown[] = isArray ? v : [v];
    const mapped: unknown[] = [];
    for (const ref of values) {
      if (typeof ref !== 'string') {
        mapped.push(ref);
        continue;
      }
      if (TEMP_KEY_PATTERN.test(ref)) {
        const r = resolveTempRef(ref, index, createdAt, tempMap);
        if ('reason' in r) return { reason: r.reason, unknown };
        mapped.push(r.id);
        continue;
      }
      const id = resolve(ref, field);
      if (id !== null) {
        if (id !== ref) notes.push(`${field} "${ref}" matched ${id} by exact alias`);
        if (!mapped.includes(id)) mapped.push(id);
        continue;
      }
      unknown.push({ name: ref, field });
      if (!isArray) return { reason: `unknown reference ${field} "${ref}" (sent to the review queue)`, unknown };
      notes.push(`${field}: unknown reference "${ref}" dropped (sent to the review queue)`);
    }
    out[field] = isArray ? mapped : mapped[0];
  }
  return { event: out as GameEvent, notes, unknown };
}

/** Resolves a temp key used at reply position `index`. */
export function resolveTempRef(
  ref: string,
  index: number,
  createdAt: ReadonlyMap<string, number>,
  tempMap: Readonly<Record<string, string>>,
): { id: string } | { reason: string } {
  const at = createdAt.get(ref);
  if (at === undefined) return { reason: `temp key ${ref} was never created` };
  if (at > index) return { reason: `temp key ${ref} used before its creation event` };
  const id = tempMap[ref];
  if (id === undefined) return { reason: `temp key ${ref}: its creation event was rejected` };
  return { id };
}
