// Core contracts (architecture §11). Features import these as types only.
import type { ZodType } from 'zod';
import type { RngState } from '../engine/rng';

/** dev: a dev sandbox command (D-180), test campaigns only; dev-only events also check the test mark themselves. */
export type EventSource = 'ai' | 'player' | 'engine' | 'summary' | 'dev';

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
  /** What the time is spent on (M3; default rest). */
  occupation: Occupation;
  /** Part of a montage or time skip (M4): world events roll and significant events interrupt (D-134). */
  jump: boolean;
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
  /** The events applied so far in this applyEvents call (the same reply), emitted ones included (D-196). */
  readonly batch?: readonly { readonly event: GameEvent; readonly source: EventSource }[];
  /** The state at the start of this applyEvents call (before the reply), for checks against what the reply changed. */
  readonly batchStart?: S;
}

/** A request to advance the clock, executed by applyEvents through advanceTime in the time phase. */
export interface TimeAdvance {
  seconds: number;
  reason: string;
  source: 'turnDraft' | 'timeElapsed';
  requested?: number;
  clampedFrom?: number;
  /** What the span is spent on (M3; default rest, D-52). */
  occupation?: Occupation;
  /** A montage or time skip (M4, D-134): only jumps roll world events and stop on an interruption. */
  jump?: boolean;
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

/**
 * Apply-order class (D-32): creation first, then time, then everything else in reply order. 'last' events apply after
 * all the others of the reply, so their handler can see what the reply did (combatEnded and its cause, D-196).
 */
export type EventPhase = 'create' | 'time' | 'other' | 'last';

/** What the schema composer knows about the turn being narrated (D-15). */
export interface NarrativeTurnInfo {
  /** The TurnDraft advanced time, so timeElapsed is left out of the schema (D-30). */
  timeAdvancedByDraft: boolean;
  /** The player's own words this turn (the input's text or label), read for the situational parts (D-520). */
  text?: string;
  /** The resolved intent's action type, when the turn had one (D-520). */
  intentAction?: string;
  /** The schema parts already worked out for this turn (ai/schemas/parts.ts); absent = worked out from the state (D-520). */
  parts?: ReadonlySet<string>;
}

export interface EventDef<Slice, S extends BaseState = BaseState> {
  schema: ZodType;
  sources: readonly EventSource[];
  /** Present when the AI may send this event in the narrative reply; true = legal this turn. */
  narrative?: (state: S, turn: NarrativeTurnInfo) => boolean;
  /** The schema part the event belongs to (ai/schemas/parts.ts; D-520); absent = the core, sent every turn. */
  part?: string;
  /**
   * Fields sent only when their part applies (D-520): left out of the wire schema otherwise; still valid when present. A dotted
   * path reaches a field of an array's items ("minionGroups.wantAlive", m8-fixes A2).
   */
  partFields?: Readonly<Record<string, string | readonly string[]>>;
  /**
   * The wire schema for this state, when it is narrower than `schema` (opt-1 A2: traitMoment's moments filtered to the character's
   * traits). Only what is sent to the model; the reply is still checked against `schema` and the handler.
   */
  wire?: (state: S) => ZodType;
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
  /** A significant event: advanceTime stops after this step in a jump (architecture §9, D-134). */
  interrupt?: string;
  notices?: string[];
  /** The RNG state after the hook's rolls (world events). */
  rng?: RngState;
}

export interface InitCtx {
  campaignId: string;
  branchId: string;
  seed: string;
  start: { day: number; second: number };
  /** Computed creation (M3) fills the optional fields; absent ones take the feature defaults. */
  character: {
    name: string;
    birthDay: number;
    speciesId?: string;
    path?: 'jedi' | 'sith' | 'outsider' | 'career';
    archetype?: string;
    focusWeights?: Readonly<Record<string, number>>;
    mainFormId?: string | null;
    secondFormId?: string | null;
    trainingStartAge?: number | null;
    talents?: Readonly<Partial<Record<'combat' | 'force' | 'physical' | 'mind', 'none' | 'gifted' | 'prodigy' | 'exceptional'>>>;
    dominantHand?: 'left' | 'right';
    /** The talent limit was ignored at creation (D-116). */
    unbalanced?: boolean;
    /** A dev-only test start (D-178): marked in the save. */
    testCharacter?: boolean;
    /** Form plans (D-118). */
    formPlan?: { padawan: Readonly<Record<string, number>>; knight: Readonly<Record<string, number>> } | null;
    /** The start option taken (D-401 [2]). */
    start?: { optionId: string; faction: string; imperialBorn: boolean };
    /** The accelerated path (D-418). */
    trainingPath?: 'standard' | 'accelerated';
  };
  /** Starting trained XP per skill from computed creation (character-creation §2). */
  startingXp?: Readonly<Record<string, number>>;
  /** Starting applied experience and combat integration (character-creation §2; M5). */
  startingE?: Readonly<Record<string, { E: number; eSpar: number }>>;
  startingCI?: Readonly<Record<string, { CI: number; ciSpar: number }>>;
  /** The rank chosen at creation (ranks stub until M7). */
  rank?: string;
  /** Backstory facts from computed creation (character-creation §4), recorded as memory facts about pc. */
  backstoryFacts?: readonly string[];
  /**
   * Starting traits (M8 item 16; spec/traits.md): the choice, how the formative quiz runs (taken at creation, pending for a
   * youngling start, or declined), its seed and the start age. Absent = no traits and no quiz.
   */
  traits?: {
    choice: { origin: string; temperament: string; scarOrTie: string; fourth?: string; homeworld?: string; mentorField?: string };
    quiz: 'creation' | 'pending' | 'declined';
    seed: string;
    startAge: number;
  };
}

/** What a span of time is spent on (M3): health recovers meters only on rest steps (D-52). */
/** combat (M5): fighting; no Vitality or meter recovery (health §3). */
export type Occupation = 'rest' | 'activity' | 'sleep' | 'combat';

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
  /** Slice migrations; `state` is the whole raw save being loaded (other slices as stored), for a migration that reads them. */
  migrations?: Record<number, (old: unknown, state?: Record<string, unknown>) => unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registries hold heterogeneous slices
export type AnyFeature<S extends BaseState = BaseState> = FeatureModule<any, S>;
export type Registry<S extends BaseState = BaseState> = readonly AnyFeature<S>[];
