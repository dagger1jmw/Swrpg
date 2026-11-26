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
import { CALL_SETTINGS, JSON_OVERHEAD_TOKENS, OVERLOAD_RETRY, THINKING_HEADROOM_TOKENS, TRUNCATION_RETRY_FACTOR, overloadDelayMs } from '../ai/models.config';
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
import { checkNarration, rewordable, settleNarration, type NarrationIssue } from './narrationCheck';
import { longPassageProseTokens } from './combatFacts';
import { selectWounds } from '../features/health/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectOpenReview, selectPendingChapters } from '../features/memory/selectors';
import { selectNpcs } from '../features/npcs/selectors';
import { LORE_INDEX } from '../lore';
import { findCanonEntity } from '../lore/retrieve';
import { roleInEra } from '../data/npcGen.config';
import { buildChapterClosed, decideChapterClose, type ChapterTurn } from '../memory/chapterClose';
import { makeEnvelope } from '../persist/envelope';
import type { CampaignRecord, Storage, TranscriptEntry } from '../persist/storage';
import { applyEvents, type AppliedEvent, type RejectedEvent, type UnknownRef } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import type { GameEvent, Registry } from '../state/types';
import { buildIntentRequest, buildNarrativeRequest, buildSummaryRequest, lastingStates, selectCaptors, type BuiltRequest, type ContextReport } from './context';
import { MINION_KINDS } from '../data/npcGen.config';
import { expandChoice } from './expandChoice';
import type { CallRecord, TurnInput, TurnRecord } from './record';
import { fightMinionRef, refResolver, resolveIntentRefs } from './refs';
import { resolveTurn, type Resolution } from './resolve';
import { skipAheadChoice } from './skipAhead';
import { choicesAfterTurn, outsideForceOpponents, withoutForceOnImmune } from './fightChoices';
import { blockadeChoices } from './travel';
import { escapeChoices } from './escape';
import { holdChoices } from './holdFacts';
import { selectWorldIdsToTell } from '../features/world/selectors';

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
  /** A status line while a call is retried (D-240: "Gemini is busy, retrying…"); null when it is over. */
  onStatus?(text: string | null): void;
  /** Waits between overload retries (D-240); tests pass an instant one. Defaults to setTimeout. */
  sleep?(ms: number): Promise<void>;
  /** A number in [0, 1) for the retry jitter; defaults to the wall clock's milliseconds (pacing, not game dice). */
  jitter?(): number;
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

/**
 * A failed call counts on the usage meter only when the API replied 2xx (an empty, cut-off, blocked or malformed
 * reply) or 429 (Jared, D-226; combat pass 2 balance row 14: 503s counted). A 5xx or other HTTP error, a timeout, a
 * network error or no key is not a request against the quota.
 */
export const countsOnMeter = (e: unknown): boolean => !(e instanceof AiError && (e.kind === 'network' || e.kind === 'noKey' || e.kind === 'timeout' || (e.kind === 'http' && e.status !== 429)));

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
    if (countsOnMeter(e)) deps.recordCall?.(opts.model, usage);
    throw e;
  }
}

/**
 * One logical model call with daily-quota fallback (D-80): use the router's model; if the API
 * says that model's daily quota is exhausted, mark it and call the next model in the list. Each
 * model is tried at most once; a per-minute or unidentified 429 is rethrown (Retry button).
 */
/** A reply the server could not give now (D-240): a 5xx, or no reply in time. Never a 4xx, a 429 or a bad reply. */
export const isOverload = (e: unknown): boolean => e instanceof AiError && (e.kind === 'timeout' || (e.kind === 'http' && (e.status ?? 0) >= 500));

/**
 * One model on overload (D-240): the call, then up to OVERLOAD_RETRY.retries retries with backoff and jitter, the busy
 * note shown while waiting. Any other error is thrown at once. The same request every time: the turn's draft is fixed.
 */
async function withOverloadRetry<T>(deps: TurnDeps, notes: string[], model: string, call: () => Promise<T>, retries: number): Promise<T> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let n = 0; ; n++) {
    try {
      const out = await call();
      if (n > 0) deps.onStatus?.(null);
      return out;
    } catch (e) {
      if (!isOverload(e) || n >= retries) {
        if (n > 0) deps.onStatus?.(null);
        throw e;
      }
      // Jitter from the wall clock's milliseconds: pacing only, never game dice (which stay on the seeded RNG).
      const wait = overloadDelayMs(n + 1, deps.jitter ? deps.jitter() : (deps.wallClock().ms % 1000) / 1000);
      notes.push(`${model}: ${e instanceof AiError && e.kind === 'timeout' ? 'no reply in time' : `busy (${(e as AiError).status ?? 'server error'})`}; retry ${n + 1} of ${retries} in ${(wait / 1000).toFixed(1)} s`);
      deps.onStatus?.(`Gemini is busy, retrying… (${n + 1} of ${retries})`);
      await sleep(wait);
    }
  }
}

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
      return await withOverloadRetry(deps, notes, choice.model, () => tracked(deps, calls, opts, () => run(opts)), OVERLOAD_RETRY.retries);
    } catch (e) {
      // Still overloaded after the retries (D-240): one try on the next model in the order, then the turn's Retry.
      if (isOverload(e) && OVERLOAD_RETRY.nextModel) {
        const next = deps.router.next?.(base.callType, choice.model) ?? null;
        if (!next || tried.has(next)) throw e;
        tried.add(next);
        notes.push(`${base.callType}: ${choice.model} still busy after ${OVERLOAD_RETRY.retries} retries; one try on ${next}`);
        deps.onStatus?.(`Gemini is busy, trying ${next}…`);
        const nextOpts: CallOptions = { ...base, model: next };
        try {
          return await tracked(deps, calls, nextOpts, () => run(nextOpts));
        } finally {
          deps.onStatus?.(null);
        }
      }
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
  // Dev commands never reach the AI (D-180): they run in code through commitDevCommand.
  if (input.kind === 'dev') throw new Error('a dev command is not a story turn (use commitDevCommand)');
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
      const checked = resolveIntentRefs(raw, resolve, fightMinionRef(session.state));
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
  } else if (input.kind === 'action') {
    // A full intent from the UI (the sheet's Train button): validated like any intent, no call.
    const parsed = intentSchema.safeParse(input.intent);
    if (!parsed.success) throw new TurnError('intent', new Error(`invalid action: ${parsed.error.issues[0]?.message ?? 'schema'}`), calls);
    const checked = resolveIntentRefs(normalizeIntent(parsed.data), resolve, fightMinionRef(session.state));
    intent = checked.intent;
    intentNotes.push(...checked.notes);
  }

  // A combat beat button (M5, D-145) skips the intent call; its action resolves in step b.
  // The player's own words reach step b for the natural combat words (D-179).
  const text = input.kind === 'typed' ? input.text : input.kind === 'choice' ? input.choice.label : undefined;
  const resolution = resolveTurn(deps.registry, session.state, intent, input.kind === 'beat' ? { beat: input.action } : input.kind === 'battle' ? { battle: { ...(input.orders ? { orders: input.orders } : {}), ...(input.auto !== undefined ? { auto: input.auto } : {}), ...(input.repairs ? { repairs: true } : {}) } } : text !== undefined ? { text } : {});
  return { input, intent, resolution, calls, intentNotes, ...(intentReport ? { intentReport } : {}) };
}

/**
 * Review queue after the reply is applied (architecture §7, D-94): unknown event refs, plus the
 * intent's unknown names that the reply did not introduce. Open items whose name now matches an
 * entity exactly are resolved by the engine (mapped), so a name introduced later leaves the queue.
 */
function reviewFollowUps(registry: Registry<GameState>, state: GameState, unknown: readonly UnknownRef[], intent: Intent | null): GameEvent[] {
  const resolve = refResolver(registry, state);
  const out: GameEvent[] = unknown.map((u) => ({ type: 'reviewQueued', name: u.name.slice(0, 80), context: `${u.eventType}.${u.field}` }));
  for (const name of intent?.unknownNames ?? []) {
    if (resolve(name) === null) out.push({ type: 'reviewQueued', name: name.slice(0, 80), context: `player input (${intent!.actionType})` });
  }
  for (const r of selectOpenReview(state)) {
    const id = resolve(r.name);
    if (id !== null) out.push({ type: 'reviewResolved', reviewId: r.id, resolution: 'mapped', entityRef: id });
  }
  return out;
}

/**
 * New NPCs whose exact name matches an in-era lore person get their canon ID (D-81). A new NPC with no canon match whose
 * dark-side role does not exist in this era (a generic "Sith Lord" in 500 BBY) gets the era's role (D-320); a canon
 * figure keeps the narrator's role (Darth Maul in 32 BBY stays a Sith).
 */
function canonEvents(before: GameState, after: GameState): GameEvent[] {
  const year = dateFromAbsDay(selectNow(after).day).year;
  const out: GameEvent[] = [];
  for (const n of selectNpcs(after)) {
    if (before.npcs.byId[n.id] || n.canonId) continue;
    const hit = findCanonEntity(LORE_INDEX, normalizeAlias(n.name), year);
    if (hit) out.push({ type: 'npcCanonLinked', npcRef: n.id, canonId: hit.canonId });
    else if (!roleInEra(n.role, year)) out.push({ type: 'npcRoleEraCorrected', npcRef: n.id });
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

  // A quiet beat (D-145): no AI call. The feed shows the roll cards and one code-template line; no events, no choices
  // (the beat buttons are the choices).
  // A battle turn with no big moment (m8-ship-battles, D-517): the code's line or two, no AI call; the menu is the choice.
  const quietBattle = draft.battle !== undefined && draft.battle.quiet;
  const quiet = draft.combat?.quiet === true || quietBattle;
  if (!reply && quiet) reply = { narrative: quietBattle ? draft.battle!.lines.join(' ') : (draft.combat!.quietLine ?? ''), choices: [], scene: { moodTags: [], presentNpcRefs: [] }, events: [] };
  if (!reply) {
    const turnInfo = { timeAdvancedByDraft: draft.timeAdvanced !== null };
    const schemas = composeNarrativeSchema(deps.registry, resolved, turnInfo);
    const req = buildNarrativeRequest(resolved, draft, pending.input, session.history, buildOpts(deps, 'narrative', schemas.wire));
    deps.onRequest?.({ callType: 'narrative', ...req });
    // A long fight passage asks for up to four paragraphs (D-271): its prose budget replaces the pacing cap when larger.
    const longFight = draft.combat && !draft.combat.quiet ? longPassageProseTokens(draft.combat.narrate.length) : 0;
    const budget = Math.max(PACING_OUTPUT_CAPS[draft.pacingLevel], longFight) + JSON_OVERHEAD_TOKENS + THINKING_HEADROOM_TOKENS;
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

    // The narration check (D-197): a narration that contradicts the resolved block is retried once with the same
    // TurnDraft and the contradictions listed; if the retry still contradicts it, code-written lines replace it.
    const woundedOrHealing = selectWounds(resolved).length > 0 || draft.jump !== null || draft.intent?.actionType === 'heal';
    // Lasting state (D-237): who in the scene cannot stand or lacks a limb, before and after the turn (a spared or
    // captured fighter keeps it).
    const lastingNow = lastingStates(resolved);
    const lasting = [...lastingNow, ...lastingStates(session.state).filter((l) => !lastingNow.some((x) => x.name === l.name))];
    // The captors while the player is their prisoner (D-242): the kind's noun, as its label ends.
    const held = selectCaptors(resolved);
    const captors = held?.kind ? { kind: held.kind, group: held.group, noun: (MINION_KINDS.find((k) => k.id === held.kind)?.label ?? held.kind).toLowerCase().split(/\s+/).pop()!.replace(/s$/, '') } : null;
    const known = { player: [...selectWounds(session.state), ...selectWounds(resolved)].map((w) => w.part), lasting, captors };
    // The previous story reply (dev commands are not story): a narration that repeats it is a contradiction (D-210).
    const previous = [...session.history].reverse().find((r) => r.input.kind !== 'dev' && r.narrative)?.narrative ?? null;
    const recheck = (text: string): NarrationIssue[] => checkNarration(text, draft, woundedOrHealing, known, previous);
    const kindsOf = (list: readonly NarrationIssue[]): string => list.map((i) => i.kind).join(', ');
    let issues = recheck(reply.narrative);
    // Engine terms that a swap of words settles (D-236): reworded in code, checked again, no retry call.
    const reworded = rewordable(reply.narrative, issues, recheck);
    if (reworded !== null) {
      modelNotes.push(`narration check: ${issues.length} engine term(s) in the prose ("${issues[0]!.sentence.slice(0, 160)}"); reworded in code, no retry`);
      reply = { ...reply, narrative: reworded };
    } else if (issues.length) {
      // The quote is the offending sentence; an omission has none, so its correction is shown.
      const quoted = issues.find((i) => i.sentence)?.sentence ?? issues[0]!.text;
      modelNotes.push(`narration check: ${issues.length} contradiction(s) with RESOLVED (${kindsOf(issues)}): "${quoted.slice(0, 160)}"; retrying once`);
      const retryReq = buildNarrativeRequest(resolved, draft, pending.input, session.history, { ...buildOpts(deps, 'narrative', schemas.wire), correction: issues.map((i) => i.text) });
      deps.onRequest?.({ callType: 'narrative', ...retryReq });
      const retryOpts: BaseOptions = { ...callOptions('narrative', retryReq.system, budget), wireSchema: schemas.wire };
      let second: typeof reply | null = null;
      try {
        second = await callModel(deps, calls, modelNotes, retryOpts, (opts: CallOptions) => deps.provider.generateStructured(schemas.parse, retryReq.messages, opts));
      } catch (e) {
        modelNotes.push(`narration check: the retry failed (${e instanceof Error ? e.message : 'error'})`);
      }
      if (second) {
        reply = second;
        issues = recheck(reply.narrative);
      }
      if (issues.length) {
        // Settled in code (D-236): terms swapped when that is enough (checked again), else the summary; no sentence
        // of a fight's narration is ever cut out.
        const settled = settleNarration(reply.narrative, draft, issues, recheck);
        const how = settled.how === 'reworded' ? 'engine terms reworded in code' : settled.how === 'summary' ? 'code-written summary used instead' : 'the offending sentences removed';
        // The sentence that still contradicts, as the first firing quotes one (pass 5 issue 7: "sever" with no quote).
        const still = issues.find((i) => i.sentence)?.sentence ?? issues[0]!.text;
        modelNotes.push(`narration check: ${second ? 'still contradicting RESOLVED' : 'the first reply stands and contradicts RESOLVED'} (${kindsOf(issues)}): "${still.slice(0, 160)}"; ${how}`);
        reply = { ...reply, narrative: settled.narrative };
      } else modelNotes.push('narration check: the retry is consistent');
    }
  }

  // d. Validate and apply the narrative events (AI source), then the scene object. Only the event
  // types legal this turn pass (D-15); e.g. timeElapsed is refused when the draft advanced time (D-30).
  const legal = new Set(narrativeEventTypes(deps.registry, resolved, { timeAdvancedByDraft: draft.timeAdvanced !== null }));
  const notLegal: RejectedEvent[] = [];
  // A fight this turn, or a hazard the engine already resolved this turn (a terrain fall, an intent's risk): the narrator's
  // hazardOccurred would apply the same accident twice or wound the player outside the fight's rules (D-212). While the
  // fight is still active it is kept (no damage, the cause of an environmentCollapse interruption); after it ended in
  // this turn's draft, it is refused.
  const engineHazard = draft.applied.some((a) => a.event.type === 'hazardResolved') || (draft.combat?.notes ?? []).some((n) => n.startsWith('terrain: '));
  const replyEvents = reply.events.filter((e) => {
    if (!legal.has(e.type)) {
      notLegal.push({ event: e, reason: `event type ${e.type} is not allowed this turn` });
      return false;
    }
    if (e.type === 'hazardOccurred' && !resolved.combat.active && (draft.combat !== null || engineHazard)) {
      notLegal.push({ event: e, reason: draft.combat ? 'hazardOccurred refused: during and right after a fight, hazards come only from the engine\'s terrain rolls (D-212)' : 'hazardOccurred refused: the engine already resolved a hazard this turn (D-212)' });
      return false;
    }
    return true;
  });
  const events: unknown[] = quiet ? [] : [...replyEvents, { type: 'sceneUpdated', moodTags: reply.scene.moodTags, presentNpcRefs: reply.scene.presentNpcRefs }];
  const result = applyEvents(deps.registry, resolved, events, { source: 'ai', resolved: draft.resolvedActions });
  const rejected: RejectedEvent[] = [...notLegal, ...result.rejected];
  const appliedAll: AppliedEvent[] = [...result.applied];

  // Engine follow-ups: unknown names to the review queue, canon links for new NPCs.
  const followUps = [...reviewFollowUps(deps.registry, result.state, result.unknownRefs, draft.intent), ...canonEvents(resolved, result.state)];
  let state: GameState = result.state;
  if (followUps.length) {
    const f = applyEvents(deps.registry, state, followUps, { source: 'engine' });
    state = f.state;
    appliedAll.push(...f.applied);
    rejected.push(...f.rejected);
  }
  state = { ...state, meta: { ...state.meta, turn: state.meta.turn + 1 } };

  // World events and timeline news this narration was given are now told (D-136, D-466).
  const told = selectWorldIdsToTell(resolved);
  // The money lines this narration was shown (the economy, M8 item 5).
  const moneyTold = resolved.economy.log.filter((x) => x.toldTurn === null).length;
  const tellEvents = [...(told.length ? [{ type: 'worldEventsTold', ids: told, turn: state.meta.turn }] : []), ...(moneyTold ? [{ type: 'economyTold', count: moneyTold, turn: state.meta.turn }] : [])];
  if (tellEvents.length) {
    const w = applyEvents(deps.registry, state, tellEvents, { source: 'engine' });
    state = w.state;
    appliedAll.push(...w.applied);
    rejected.push(...w.rejected);
  }

  // Staleness (architecture §8, D-18): if the story is stale and no choice jumps forward, code appends a
  // deterministic "Skip ahead" choice and logs it. Suggest only; never auto-skip.
  // D-181: a finished fight offers story choices only (the combat slice decides, not the narration).
  // A choice may name an NPC this same reply introduced by its temp key (pass 4: "choice targetRef tmp:npc1 is not a
  // valid ID; dropped" on an opening's first button): the key becomes the minted ID, as for the reply's own events.
  const replyChoices = reply.choices.map((c) => {
    const t = c.intent.targetRef;
    const id = t ? result.tempMap[t] : undefined;
    return id ? { ...c, intent: { ...c.intent, targetRef: id } } : c;
  });
  const fc = choicesAfterTurn(state, draft.combat !== null, replyChoices);
  // Opponents outside the Force (D-192; M5 final check): no Force push, choke, lightning or mind trick offered against
  // them, from the turn that starts the fight (pending or active).
  const immune = withoutForceOnImmune(state, fc.choices);
  const choices = immune.choices;
  // A blockade in the way: code offers what is open (D-469).
  choices.push(...blockadeChoices(draft.travel), ...escapeChoices(state), ...holdChoices(state));
  // While a ship battle goes on the tactics menu holds the choices (m8-ship-battles, D-517).
  if (state.battles.active) choices.splice(0);
  const skip = state.battles.active ? null : skipAheadChoice(state, choices);
  const skipNotes: string[] = fc.dropped ? [`fight over: ${fc.dropped} tactical choice(s) dropped (D-181)`] : [];
  if (immune.dropped) skipNotes.push(`outside the Force (${outsideForceOpponents(state).join(', ')}): ${immune.dropped} Force choice(s) dropped`);
  if (skip) {
    choices.push(skip);
    skipNotes.push(`staleness: appended "${skip.label}" (${skip.spanDays} days; D-18)`);
  }

  const record: TurnRecord = {
    turn: state.meta.turn,
    input: pending.input,
    draft: {
      ...(draft.battle ? { battle: draft.battle } : {}),
      intent: draft.intent,
      checks: draft.checks,
      training: draft.training,
      timeAdvanced: draft.timeAdvanced,
      jump: draft.jump,
      combat: draft.combat,
      pacingLevel: draft.pacingLevel,
      notices: [...draft.notices, ...result.notices],
      report: [...pending.intentNotes, ...draft.report, ...modelNotes, ...skipNotes],
      resolvedActions: draft.resolvedActions,
      applied: [...draft.applied],
      rejected: [...draft.rejected],
    },
    narrative: reply.narrative,
    choices,
    moodTags: quiet ? (session.history[session.history.length - 1]?.moodTags ?? []) : reply.scene.moodTags,
    applied: appliedAll,
    rejected,
    calls,
    clockAfter: { ...selectNow(state) },
    context: { ...(pending.intentReport ? { intent: pending.intentReport } : {}), ...(narrativeReport ? { narrative: narrativeReport } : {}) },
  };

  // Chapter close (D-17): decided by code, applied in this same commit.
  const decision = decideChapterClose(session.state, state, draft.timeAdvanced?.seconds ?? 0, { jump: draft.jump !== null });
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
