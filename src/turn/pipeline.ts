// The turn pipeline (architecture §4): intent -> resolve -> narrate -> validate -> apply -> commit.
// prepareTurn does a (intent call, typed input only) and b (resolve, once). narrateTurn does c-d
// and can be retried with the same PendingTurn: the TurnDraft and its dice are never recomputed.
// summarizeChapters is e: after a commit that closed a chapter, the light-model summary call,
// applied through applyEvents and committed in its own transaction (D-57).
// Failure policy (D-16 as amended by D-80): one automatic fresh call when the narrative is
// truncated and autoRetry is on, and one automatic call on the next model in the call type's list
// when the API reports the daily quota exhausted. Every other failure (including per-minute 429s)
// surfaces as a TurnError for a Retry button. A failed summary leaves the chapter summaryPending.
import type { ZodType } from 'zod';
import { isDailyQuotaError, type ModelRouter } from '../ai/fallback';
import { toGeminiSchema } from '../ai/jsonSchema';
import { CALL_SETTINGS, JSON_OVERHEAD_TOKENS, THINKING_HEADROOM_TOKENS, TRUNCATION_RETRY_FACTOR } from '../ai/models.config';
import { AiError, type CallOptions, type CallType, type Message, type ModelProvider, type StructuredResult, type Usage } from '../ai/provider';
import { composeNarrativeSchema, narrativeEventTypes, type NarrativeReply } from '../ai/schemas/compose';
import { intentSchema, normalizeIntent, type Intent } from '../ai/schemas/intent';
import { summaryReplySchema } from '../ai/schemas/summary';
import type { Settings } from '../ai/settings';
import { ratioFor, type TokenRatios } from '../ai/tokenRatio';
import { SUMMARY_RETRIES_PER_CLOSE } from '../data/memory.config';
import { PACING_OUTPUT_CAPS } from '../data/pacing.config';
import { normalizeAlias } from '../engine/aliases';
import { dateFromAbsDay } from '../engine/calendar';
import { selectNow } from '../features/clock/selectors';
import { selectPendingChapters } from '../features/memory/selectors';
import { selectNpcs } from '../features/npcs/selectors';
import { LORE_INDEX } from '../lore';
import { findCanonEntity } from '../lore/retrieve';
import { buildChapterClosed, decideChapterClose, type ChapterTurn } from '../memory/chapterClose';
import { makeEnvelope } from '../persist/envelope';
import type { CampaignRecord, Storage, TranscriptEntry } from '../persist/storage';
import { applyEvents, type AppliedEvent, type RejectedEvent, type UnknownRef } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import type { GameEvent, Registry } from '../state/types';
import { buildIntentRequest, buildNarrativeRequest, buildSummaryRequest, type BuiltRequest, type ContextReport } from './context';
import { expandChoice } from './expandChoice';
import type { CallRecord, TurnInput, TurnRecord } from './record';
import { refResolver, resolveIntentRefs } from './refs';
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
  /** Calibrated characters-per-token per model (D-86); default 4. */
  getTokenRatios?(): TokenRatios;
  /** One calibration observation: characters sent and Gemini's promptTokenCount. */
  recordTokenRatio?(model: string, chars: number, promptTokens: number): void;
  /** Every request as built (debug view; kept in memory only, D-87). */
  onRequest?(request: DebugRequest): void;
}

export interface DebugRequest {
  callType: CallType;
  system: string;
  messages: readonly Message[];
  report: ContextReport;
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
  readonly intentReport?: ContextReport;
  /** Set when the narrative arrived but the commit failed: Retry only re-commits. */
  readonly reply?: NarrativeReply;
  readonly narrativeReport?: ContextReport;
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

const schemaChars = (schema: ZodType): number => JSON.stringify(toGeminiSchema(schema)).length;

/** Build options for a call type: the ratio of the model the router will use first. */
function buildOpts(deps: TurnDeps, callType: CallType, schema: ZodType): { model: string; ratio: number; schemaChars: number } {
  const model = deps.router.choose(callType).model;
  return { model, ratio: ratioFor(deps.getTokenRatios?.() ?? {}, model), schemaChars: schemaChars(schema) };
}

/** After a call: actual prompt tokens into the report, and one ratio calibration sample (D-86). */
function settleReport(deps: TurnDeps, req: BuiltRequest, calls: readonly CallRecord[], callType: CallType): ContextReport {
  const last = [...calls].reverse().find((c) => c.callType === callType && c.outcome === 'ok' && c.usage);
  if (!last?.usage) return req.report;
  deps.recordTokenRatio?.(last.model, req.report.chars, last.usage.inputTokens);
  return { ...req.report, model: last.model, actualInputTokens: last.usage.inputTokens };
}

/** a + b: intent (typed input only) and engine resolution. Rolls dice exactly once. */
export async function prepareTurn(deps: TurnDeps, session: Session, input: TurnInput): Promise<PendingTurn> {
  const calls: CallRecord[] = [];
  let intent: Intent | null = null;
  const intentNotes: string[] = [];
  let intentReport: ContextReport | undefined;
  const resolve = refResolver(deps.registry, session.state);

  if (input.kind === 'typed') {
    const req = buildIntentRequest(session.state, input.text, session.history, buildOpts(deps, 'intent', intentSchema));
    deps.onRequest?.({ callType: 'intent', ...req });
    const base = callOptions('intent', req.system, CALL_SETTINGS.intent.maxOutputTokens + THINKING_HEADROOM_TOKENS);
    try {
      const raw = normalizeIntent(await callModel(deps, calls, intentNotes, base, (opts) => deps.provider.generateStructured(intentSchema, req.messages, opts)));
      const checked = resolveIntentRefs(raw, resolve);
      intent = checked.intent;
      intentNotes.push(...checked.notes);
    } catch (e) {
      throw new TurnError('intent', e, calls);
    }
    intentReport = settleReport(deps, req, calls, 'intent');
  } else if (input.kind === 'choice') {
    const expanded = expandChoice(input.choice, resolve);
    intent = expanded.intent;
    intentNotes.push(...expanded.notes);
  }

  const resolution = resolveTurn(deps.registry, session.state, intent);
  return { input, intent, resolution, calls, intentNotes, ...(intentReport ? { intentReport } : {}) };
}

/** Unknown refs become review-queue entries (architecture §7: nothing is created silently). */
function reviewEvents(unknown: readonly UnknownRef[]): GameEvent[] {
  return unknown.map((u) => ({ type: 'reviewQueued', name: u.name.slice(0, 80), context: `${u.eventType}.${u.field}` }));
}

/** New NPCs whose exact name matches an in-era lore person get their canon ID (D-81). */
function canonEvents(before: GameState, after: GameState): GameEvent[] {
  const year = dateFromAbsDay(selectNow(after).day).year;
  const out: GameEvent[] = [];
  for (const n of selectNpcs(after)) {
    if (before.npcs.byId[n.id] || n.canonId) continue;
    const hit = findCanonEntity(LORE_INDEX, normalizeAlias(n.name), year);
    if (hit) out.push({ type: 'npcCanonLinked', npcRef: n.id, canonId: hit.canonId });
  }
  return out;
}

/** The chapter's committed turns, as the memory code reads them. */
export function chapterTurns(history: readonly TurnRecord[]): ChapterTurn[] {
  return history.map((r, i) => ({
    turn: r.turn ?? i + 1,
    day: r.clockAfter.day,
    events: [...r.draft.applied, ...r.applied].map((a) => a.event),
  }));
}

/** c + d: narrate (with the one truncation retry), validate, apply, commit. Safe to retry. */
export async function narrateTurn(deps: TurnDeps, session: Session, pending: PendingTurn): Promise<{ session: Session; record: TurnRecord }> {
  const calls: CallRecord[] = [...pending.calls];
  const settings = deps.getSettings();
  const { draft, state: resolved } = pending.resolution;
  let reply = pending.reply;
  let narrativeReport = pending.narrativeReport;
  const modelNotes: string[] = [];

  if (!reply) {
    const turnInfo = { timeAdvancedByDraft: draft.timeAdvanced !== null };
    const schemas = composeNarrativeSchema(deps.registry, resolved, turnInfo);
    const req = buildNarrativeRequest(resolved, draft, pending.input, session.history, buildOpts(deps, 'narrative', schemas.wire));
    deps.onRequest?.({ callType: 'narrative', ...req });
    const budget = PACING_OUTPUT_CAPS[draft.pacingLevel] + JSON_OVERHEAD_TOKENS + THINKING_HEADROOM_TOKENS;
    const first: BaseOptions = { ...callOptions('narrative', req.system, budget), wireSchema: schemas.wire };
    const narrate = (opts: CallOptions) => deps.provider.generateStructured(schemas.parse, req.messages, opts);
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
    narrativeReport = settleReport(deps, req, calls, 'narrative');
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
  const events: unknown[] = [...replyEvents, { type: 'sceneUpdated', moodTags: reply.scene.moodTags, presentNpcRefs: reply.scene.presentNpcRefs }];
  const result = applyEvents(deps.registry, resolved, events, { source: 'ai', resolved: draft.resolvedActions });
  const rejected: RejectedEvent[] = [...notLegal, ...result.rejected];
  const appliedAll: AppliedEvent[] = [...result.applied];

  // Engine follow-ups: unknown names to the review queue, canon links for new NPCs.
  const followUps = [...reviewEvents(result.unknownRefs), ...canonEvents(resolved, result.state)];
  let state: GameState = result.state;
  if (followUps.length) {
    const f = applyEvents(deps.registry, state, followUps, { source: 'engine' });
    state = f.state;
    appliedAll.push(...f.applied);
    rejected.push(...f.rejected);
  }
  state = { ...state, meta: { ...state.meta, turn: state.meta.turn + 1 } };

  const record: TurnRecord = {
    turn: state.meta.turn,
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
    applied: appliedAll,
    rejected,
    calls,
    clockAfter: { ...selectNow(state) },
    context: { ...(pending.intentReport ? { intent: pending.intentReport } : {}), ...(narrativeReport ? { narrative: narrativeReport } : {}) },
  };

  // Chapter close (D-17): decided by code, applied in this same commit.
  const decision = decideChapterClose(session.state, state, draft.timeAdvanced?.seconds ?? 0);
  if (decision) {
    const closeEvent = buildChapterClosed(state, decision, chapterTurns([...session.history, record]));
    const c = applyEvents(deps.registry, state, [closeEvent], { source: 'engine' });
    if (c.rejected.length) record.rejected.push(...c.rejected);
    else {
      state = c.state;
      const chapter = state.memory.chapters[state.memory.chapters.length - 1]!;
      record.applied.push(...c.applied);
      record.chapterClosed = { chapterId: chapter.id, reason: decision.reason, turnRange: chapter.turnRange };
    }
  }

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
    throw new TurnError('commit', e, calls, { ...pending, calls, reply, ...(narrativeReport ? { narrativeReport } : {}) });
  }
  return { session: { state, history: [...session.history, record], campaign }, record };
}

export interface SummaryOutcome {
  chapterId: string;
  ok: boolean;
  error?: string;
  calls: CallRecord[];
  report?: ContextReport;
  notes: string[];
}

/**
 * e. Summarizes pending chapters, oldest first, at most SUMMARY_RETRIES_PER_CLOSE (D-89). Each
 * success is applied through applyEvents and committed on its own (D-57). A failure stops the
 * loop and leaves that chapter summaryPending for the next close or the manual retry; no
 * automatic retry beyond the D-80 daily-quota fallback.
 */
export async function summarizeChapters(deps: TurnDeps, session: Session): Promise<{ session: Session; outcomes: SummaryOutcome[] }> {
  let current = session;
  const outcomes: SummaryOutcome[] = [];
  for (const chapter of selectPendingChapters(session.state).slice(0, SUMMARY_RETRIES_PER_CLOSE)) {
    const calls: CallRecord[] = [];
    const notes: string[] = [];
    const req = buildSummaryRequest(current.state, chapter, current.history, buildOpts(deps, 'summary', summaryReplySchema));
    deps.onRequest?.({ callType: 'summary', ...req });
    const base = callOptions('summary', req.system, CALL_SETTINGS.summary.maxOutputTokens + THINKING_HEADROOM_TOKENS);
    try {
      const data = await callModel(deps, calls, notes, base, (opts) => deps.provider.generateStructured(summaryReplySchema, req.messages, opts));
      const event = { type: 'chapterSummarized', chapterId: chapter.id, chapterSummary: data.chapterSummary, arcSummary: data.arcSummary };
      const r = applyEvents(deps.registry, current.state, [event], { source: 'summary' });
      if (r.rejected.length) throw new Error(`summary rejected: ${r.rejected.map((x) => x.reason).join('; ')}`);
      const wall = deps.wallClock();
      const campaign: CampaignRecord = { ...current.campaign, lastPlayedAt: wall.iso };
      await deps.storage.commitTurn(makeEnvelope(deps.registry, r.state, wall.iso), campaign, null);
      current = { ...current, state: r.state, campaign };
      outcomes.push({ chapterId: chapter.id, ok: true, calls, report: settleReport(deps, req, calls, 'summary'), notes });
    } catch (e) {
      outcomes.push({ chapterId: chapter.id, ok: false, error: e instanceof Error ? e.message : String(e), calls, report: req.report, notes });
      break;
    }
  }
  return { session: current, outcomes };
}

/** The whole turn, plus the chapter summary when the turn closed a chapter. On a TurnError with
 * `pending`, retry with narrateTurn(deps, session, error.pending). */
export async function playTurn(deps: TurnDeps, session: Session, input: TurnInput): Promise<{ session: Session; record: TurnRecord; summaries: SummaryOutcome[] }> {
  const turn = await narrateTurn(deps, session, await prepareTurn(deps, session, input));
  if (!turn.record.chapterClosed) return { ...turn, summaries: [] };
  const s = await summarizeChapters(deps, turn.session);
  return { session: s.session, record: turn.record, summaries: s.outcomes };
}
