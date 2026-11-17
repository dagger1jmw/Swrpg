// Core contracts (architecture §11). Features import these as types only.
import type { ZodType } from 'zod';
import type { RngState } from '../engine/rng';

export type EventSource = 'ai' | 'player' | 'engine' | 'summary';

/** Every event is a plain object discriminated on `type`. */
export interface GameEvent {
  readonly type: string;
  readonly [field: string]: unknown;
}

export interface Meta {
  schemaVersion: number;
  campaignId: string;
  branchId: string;
  /** +1 per committed turn. */
  turn: number;
  rngState: RngState;
}

/** Any state made of meta plus feature slices keyed by feature id. */
export interface BaseState {
  meta: Meta;
  [sliceId: string]: unknown;
}

/**
 * One step of advancing time (architecture §10). Steps never cross midnight. `kind: 'day'` is a
 * whole day (00:00 to 24:00); `kind: 'subDay'` is part of a day. `endsDay` is true when the step
 * ends exactly at midnight, so per-day hooks run once for every day that ends (D-75).
 */
export interface TimeStep {
  kind: 'subDay' | 'day';
  /** Absolute seconds (day * 86400 + second). */
  fromAbs: number;
  toAbs: number;
  seconds: number;
  endsDay: boolean;
}

/** An action the TurnDraft already resolved; narrative events of the same type and target are rejected (D-29). */
export interface ResolvedAction {
  eventType: string;
  target?: string;
}

export interface ApplyCtx<S extends BaseState = BaseState> {
  /** The full state as it is right before this event or hook (read-only; use selectors). */
  readonly state: S;
  readonly source: EventSource;
}

/** A request to advance the clock, executed by applyEvents through advanceTime in the time phase. */
export interface TimeAdvance {
  seconds: number;
  reason: string;
  source: 'turnDraft' | 'timeElapsed';
  requested?: number;
  clampedFrom?: number;
}

export type HandleResult<Slice> =
  | {
      slice: Slice;
      emit?: GameEvent[];
      /** Only time-phase events may request this (the clock's timeElapsed). */
      advance?: TimeAdvance;
      /** Creation events return the stable ID they minted, for temp-key mapping (D-32). */
      mintedId?: string;
      /** Log notes (e.g. a clamp), kept in the transcript. */
      notes?: string[];
      rng?: RngState;
    }
  | { reject: string };

/** Apply-order class (D-32): creation first, then time, then everything else in reply order. */
export type EventPhase = 'create' | 'time' | 'other';

/** What the schema composer knows about the turn being narrated (D-15). */
export interface NarrativeTurnInfo {
  /** The TurnDraft advanced time, so timeElapsed is left out of the schema (D-30). */
  timeAdvancedByDraft: boolean;
}

export interface EventDef<Slice, S extends BaseState = BaseState> {
  schema: ZodType;
  sources: readonly EventSource[];
  /** Present when the AI may send this event in the narrative reply; true = legal this turn. */
  narrative?: (state: S, turn: NarrativeTurnInfo) => boolean;
  phase?: EventPhase;
  /** Field holding the event's target, for de-duplication, per-target caps and resolved-action checks. */
  targetField?: string;
  /**
   * Fields that may hold a reference (a stable ID, an exact alias, or a same-turn temp key).
   * A scalar field with an unknown ref rejects the event; unknown items of an array field are
   * dropped with a note. Either way the name goes to `unknownRefs` (the review queue, D-13).
   */
  refFields?: readonly string[];
  /** Entity kinds a ref field may resolve to (feature `refKind`s). Absent = any kind. */
  refKinds?: Readonly<Record<string, readonly string[]>>;
  handle(slice: Slice, event: GameEvent, ctx: ApplyCtx<S>): HandleResult<Slice>;
}

export interface HookResult<Slice> {
  slice: Slice;
  emit?: GameEvent[];
  /** A significant event: advanceTime stops after this step (architecture §9). */
  interrupt?: string;
  notices?: string[];
}

export interface InitCtx {
  campaignId: string;
  branchId: string;
  seed: string;
  start: { day: number; second: number };
  character: { name: string; birthDay: number };
}

export interface FeatureModule<Slice = unknown, S extends BaseState = BaseState> {
  id: string;
  version: number;
  initialState(ctx: InitCtx): Slice;
  /**
   * The slice for a save made before this feature existed; `raw` is the save's state so far.
   * Absent = such saves are refused.
   */
  emptyState?(raw: Record<string, unknown>): Slice;
  stateSchema: ZodType<Slice>;
  events: Record<string, EventDef<Slice, S>>;
  onTimeAdvanced?(slice: Slice, step: TimeStep, ctx: ApplyCtx<S>): HookResult<Slice>;
  selectors: Record<string, (state: S) => unknown>;
  /** The entity kind this feature owns ('npc', 'loc', 'thread'); used with EventDef.refKinds. */
  refKind?: string;
  /**
   * Resolves a ref to one of this feature's entities: its own stable ID if it exists, or an
   * exact normalized alias (architecture §3, D-13). Null when it is not this feature's entity.
   */
  resolveRef?(state: S, ref: string): string | null;
  promptSection?(state: S): string | null;
  migrations?: Record<number, (old: unknown) => unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registries hold heterogeneous slices
export type AnyFeature<S extends BaseState = BaseState> = FeatureModule<any, S>;
export type Registry<S extends BaseState = BaseState> = readonly AnyFeature<S>[];
