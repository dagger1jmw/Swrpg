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

export type HandleResult<Slice> =
  | {
      slice: Slice;
      emit?: GameEvent[];
      /** Creation events return the stable ID they minted, for temp-key mapping (D-32). */
      mintedId?: string;
      /** Log notes (e.g. a clamp), kept in the transcript. */
      notes?: string[];
      rng?: RngState;
    }
  | { reject: string };

/** Apply-order class (D-32): creation first, then time, then everything else in reply order. */
export type EventPhase = 'create' | 'time' | 'other';

export interface EventDef<Slice, S extends BaseState = BaseState> {
  schema: ZodType;
  sources: readonly EventSource[];
  phase?: EventPhase;
  /** Field holding the event's target, for de-duplication, per-target caps and resolved-action checks. */
  targetField?: string;
  /** Fields that may hold a reference (a stable ID or a same-turn temp key). Arrays allowed. */
  refFields?: readonly string[];
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
  stateSchema: ZodType<Slice>;
  events: Record<string, EventDef<Slice, S>>;
  onTimeAdvanced?(slice: Slice, step: TimeStep, ctx: ApplyCtx<S>): HookResult<Slice>;
  selectors: Record<string, (state: S) => unknown>;
  promptSection?(state: S): string | null;
  migrations?: Record<number, (old: unknown) => unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registries hold heterogeneous slices
export type AnyFeature<S extends BaseState = BaseState> = FeatureModule<any, S>;
export type Registry<S extends BaseState = BaseState> = readonly AnyFeature<S>[];
