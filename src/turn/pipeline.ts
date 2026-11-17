// The turn pipeline (architecture §4): intent -> resolve -> narrate -> validate -> apply -> commit.
// prepareTurn does a (intent call, typed input only) and b (resolve, once). narrateTurn does c-d
// and can be retried with the same PendingTurn: the TurnDraft and its dice are never recomputed.
// Failure policy (D-16 as amended by D-80): one automatic fresh call when the narrative is
// truncated and autoRetry is on, and one automatic call on the next model in the call type's list
// when the API reports the daily quota exhausted. Every other failure (including per-minute 429s)
// surfaces as a TurnError for a Retry button.
import { isDailyQuotaError, type ModelRouter } from '../ai/fallback';
import { CALL_SETTINGS, JSON_OVERHEAD_TOKENS, THINKING_HEADROOM_TOKENS, TRUNCATION_RETRY_FACTOR } from '../ai/models.config';
import { PROMPTS } from '../ai/prompts';
import { AiError, type CallOptions, type CallType, type ModelProvider, type StructuredResult, type Usage } from '../ai/provider';
import { composeNarrativeSchema, narrativeEventTypes, type NarrativeReply } from '../ai/schemas/compose';
import { intentSchema, normalizeIntent, type Intent } from '../ai/schemas/intent';
import type { Settings } from '../ai/settings';
import { PACING_OUTPUT_CAPS } from '../data/pacing.config';
import { selectNow } from '../features/clock/selectors';
import { makeEnvelope } from '../persist/envelope';
import type { CampaignRecord, Storage, TranscriptEntry } from '../persist/storage';
import { applyEvents, type RejectedEvent } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import type { Registry } from '../state/types';
import { intentMessages, narrativeMessages, narrativeSystemPrompt } from './context';
import { expandChoice } from './expandChoice';
import type { CallRecord, TurnInput, TurnRecord } from './record';
import { resolveTurn, type Resolution } from './resolve';

export interface TurnDeps {
  registry: Registry<GameState>;
  provider: ModelProvider;
  /** Picks the model per call type from its ordered list and records exhausted daily quotas (D-80). */
  router: ModelRouter;
  storage: Storage;
  getSettings(): Settings;
  /** Wall-clock time for savedAt and the usage meter (not game time). */
  wallClock(): { ms: number; iso: string };
  /** Called once per model request that reached the API (usage meter). */
  recordCall?(model: string, usage: Usage | null): void;
}

export interface Session {
  state: GameState;
  history: TurnRecord[];
  campaign: CampaignRecord;
}

export interface PendingTurn {
  readonly input: TurnInput;
  readonly intent: Intent | null;
  readonly resolution: Resolution;
  readonly calls: readonly CallRecord[];
  readonly intentNotes: readonly string[];
  /** Set when the narrative arrived but the commit failed: Retry only re-commits. */
  readonly reply?: NarrativeReply;
}

export type TurnStage = 'intent' | 'narrate' | 'commit';

export class TurnError extends Error {
  readonly stage: TurnStage;
  readonly pending: PendingTurn | undefined;
  readonly calls: readonly CallRecord[];
  override readonly cause: unknown;

  constructor(stage: TurnStage, cause: unknown, calls: readonly CallRecord[], pending?: PendingTurn) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = 'TurnError';
    this.stage = stage;
    this.cause = cause;
    this.calls = calls;
    this.pending = pending;
  }
}

type BaseOptions = Omit<CallOptions, 'model'>;

function callOptions(callType: CallType, system: string, maxOutputTokens: number): BaseOptions {
  const cfg = CALL_SETTINGS[callType];
  return {
    callType,
    system,
    maxOutputTokens,
    temperature: cfg.temperature,
    ...(cfg.thinking ? { thinking: cfg.thinking } : {}),
  };
}

const reachedApi = (e: unknown): boolean => !(e instanceof AiError && (e.kind === 'network' || e.kind === 'noKey'));

/** One model call, recorded for the transcript and the usage meter. */
async function tracked<T>(deps: TurnDeps, calls: CallRecord[], opts: CallOptions, run: () => Promise<{ data: T; usage: Usage }>): Promise<T> {
  try {
    const r = await run();
    calls.push({ callType: opts.callType, model: opts.model, usage: r.usage, outcome: 'ok' });
    deps.recordCall?.(opts.model, r.usage);
    return r.data;
  } catch (e) {
    const usage = e instanceof AiError ? (e.usage ?? null) : null;
    const outcome = e instanceof AiError ? (e.kind === 'rateLimit' ? `rateLimit:${e.quotaScope ?? 'unknown'}` : e.kind) : 'error';
    calls.push({ callType: opts.callType, model: opts.model, usage, outcome });
    if (reachedApi(e)) deps.recordCall?.(opts.model, usage);
    throw e;
  }
}

/**
 * One logical model call with daily-quota fallback (D-80): use the router's model; if the API
 * says that model's daily quota is exhausted, mark it and call the next model in the list. Each
 * model is tried at most once; a per-minute or unidentified 429 is rethrown (Retry button).
 */
async function callModel<T>(
  deps: TurnDeps,
  calls: CallRecord[],
  notes: string[],
  base: BaseOptions,
  run: (opts: CallOptions) => Promise<StructuredResult<T>>,
): Promise<T> {
  const tried = new Set<string>();
  let lastDaily: unknown = null;
  for (;;) {
    const choice = deps.router.choose(base.callType);
    if (tried.has(choice.model)) throw lastDaily;
    tried.add(choice.model);
    if (choice.model !== choice.primary) {
      const why = choice.skipped.map((s) => `${s.model} ${s.reason === 'dailyQuota' ? 'daily quota exhausted' : 'requests-per-day limit reached'}`).join(', ');
      const note = `${base.callType}: using fallback ${choice.model} (${why})`;
      if (!notes.includes(note)) notes.push(note);
    }
    const opts: CallOptions = { ...base, model: choice.model };
    try {
      return await tracked(deps, calls, opts, () => run(opts));
    } catch (e) {
      if (!isDailyQuotaError(e)) throw e;
      deps.router.markExhausted(choice.model);
      lastDaily = e;
    }
  }
}

/** a + b: intent (typed input only) and engine resolution. Rolls dice exactly once. */
export async function prepareTurn(deps: TurnDeps, session: Session, input: TurnInput): Promise<PendingTurn> {
  const calls: CallRecord[] = [];
  let intent: Intent | null = null;
  const intentNotes: string[] = [];

  if (input.kind === 'typed') {
    const base = callOptions('intent', PROMPTS.intent, CALL_SETTINGS.intent.maxOutputTokens + THINKING_HEADROOM_TOKENS);
    const messages = intentMessages(session.state, input.text, session.history);
    try {
      intent = normalizeIntent(await callModel(deps, calls, intentNotes, base, (opts) => deps.provider.generateStructured(intentSchema, messages, opts)));
    } catch (e) {
      throw new TurnError('intent', e, calls);
    }
  } else if (input.kind === 'choice') {
    const expanded = expandChoice(input.choice, new Set());
    intent = expanded.intent;
    intentNotes.push(...expanded.notes);
  }

  const resolution = resolveTurn(deps.registry, session.state, intent);
  return { input, intent, resolution, calls, intentNotes };
}

/** c + d: narrate (with the one truncation retry), validate, apply, commit. Safe to retry. */
export async function narrateTurn(deps: TurnDeps, session: Session, pending: PendingTurn): Promise<{ session: Session; record: TurnRecord }> {
  const calls: CallRecord[] = [...pending.calls];
  const settings = deps.getSettings();
  const { draft, state: resolved } = pending.resolution;
  let reply = pending.reply;
  const modelNotes: string[] = [];

  if (!reply) {
    const schemas = composeNarrativeSchema(deps.registry, resolved, { timeAdvancedByDraft: draft.timeAdvanced !== null });
    const system = narrativeSystemPrompt(resolved, pending.input.kind === 'opening');
    const messages = narrativeMessages(resolved, draft, pending.input, session.history);
    const budget = PACING_OUTPUT_CAPS[draft.pacingLevel] + JSON_OVERHEAD_TOKENS + THINKING_HEADROOM_TOKENS;
    const first: BaseOptions = { ...callOptions('narrative', system, budget), wireSchema: schemas.wire };
    const narrate = (opts: CallOptions) => deps.provider.generateStructured(schemas.parse, messages, opts);
    try {
      try {
        reply = await callModel(deps, calls, modelNotes, first, narrate);
      } catch (e) {
        if (!(e instanceof AiError && e.kind === 'truncated' && settings.autoRetry)) throw e;
        const second = { ...first, maxOutputTokens: Math.ceil(budget * TRUNCATION_RETRY_FACTOR) };
        reply = await callModel(deps, calls, modelNotes, second, narrate);
      }
    } catch (e) {
      throw new TurnError('narrate', e, calls, { ...pending, calls });
    }
  }

  // d. Validate and apply the narrative events (AI source), then the scene object. Only the event
  // types legal this turn pass (D-15); e.g. timeElapsed is refused when the draft advanced time (D-30).
  const legal = new Set(narrativeEventTypes(deps.registry, resolved, { timeAdvancedByDraft: draft.timeAdvanced !== null }));
  const notLegal: RejectedEvent[] = [];
  const replyEvents = reply.events.filter((e) => {
    if (legal.has(e.type)) return true;
    notLegal.push({ event: e, reason: `event type ${e.type} is not allowed this turn` });
    return false;
  });
  const events: unknown[] = [...replyEvents, { type: 'sceneUpdated', moodTags: reply.scene.moodTags }];
  const applied = applyEvents(deps.registry, resolved, events, { source: 'ai', resolved: draft.resolvedActions });
  const result = { ...applied, rejected: [...notLegal, ...applied.rejected] };
  const state: GameState = { ...result.state, meta: { ...result.state.meta, turn: result.state.meta.turn + 1 } };

  const record: TurnRecord = {
    input: pending.input,
    draft: {
      intent: draft.intent,
      checks: draft.checks,
      timeAdvanced: draft.timeAdvanced,
      pacingLevel: draft.pacingLevel,
      notices: [...draft.notices, ...result.notices],
      report: [...pending.intentNotes, ...draft.report, ...modelNotes],
      resolvedActions: draft.resolvedActions,
      applied: [...draft.applied],
      rejected: [...draft.rejected],
    },
    narrative: reply.narrative,
    choices: reply.choices,
    moodTags: reply.scene.moodTags,
    applied: result.applied,
    rejected: result.rejected,
    calls,
    clockAfter: { ...selectNow(state) },
  };

  const wall = deps.wallClock();
  const entry: TranscriptEntry<TurnRecord> = {
    campaignId: state.meta.campaignId,
    branchId: state.meta.branchId,
    turn: state.meta.turn,
    savedAt: wall.iso,
    data: record,
  };
  const campaign: CampaignRecord = { ...session.campaign, lastPlayedAt: wall.iso };
  try {
    await deps.storage.commitTurn(makeEnvelope(deps.registry, state, wall.iso), campaign, entry);
  } catch (e) {
    throw new TurnError('commit', e, calls, { ...pending, calls, reply });
  }
  return { session: { state, history: [...session.history, record], campaign }, record };
}

/** The whole turn. On a TurnError with `pending`, retry with narrateTurn(deps, session, error.pending). */
export async function playTurn(deps: TurnDeps, session: Session, input: TurnInput): Promise<{ session: Session; record: TurnRecord }> {
  return narrateTurn(deps, session, await prepareTurn(deps, session, input));
}
