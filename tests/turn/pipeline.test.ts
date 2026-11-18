import { TEST_START_DATE, TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { EMPTY_USAGE_LOG, recordRequest, type UsageLog } from '../../src/ai/usage';
import { choiceSchema } from '../../src/ai/schemas/compose';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { loadEnvelope } from '../../src/persist/envelope';
import { AUTOSAVE_SLOT, createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, resumeCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { narrateTurn, playTurn, prepareTurn, TurnError, type Session, type TurnDeps } from '../../src/turn/pipeline';
import intentInvestigate from '../fixtures/ai/intent-investigate.json';
import narrativeInvestigate from '../fixtures/ai/narrative-investigate.json';
import opening from '../fixtures/ai/opening.json';

const START_SECOND = DEFAULT_START_SECOND;

function setup(steps: FixtureStep[], settings: Partial<Settings> = {}, startMs = Date.UTC(2026, 10, 16, 20, 0)) {
  const provider = createFixtureProvider(steps);
  const storage = createMemoryStorage();
  const counted: string[] = [];
  const clock = { ms: startMs };
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30), ...settings });
  const router = createModelRouter({
    getLists: () => getSettings().modelLists,
    getLimits: () => getSettings().limits,
    getUsage: () => store.usage,
    getQuota: () => store.quota,
    setQuota: (q) => (store.quota = q),
    now: () => clock.ms,
  });
  const deps: TurnDeps = {
    registry: REGISTRY,
    provider,
    router,
    storage,
    getSettings,
    wallClock: () => {
      clock.ms += 1000;
      return { ms: clock.ms, iso: new Date(clock.ms).toISOString() };
    },
    recordCall: (model, usage) => {
      counted.push(model);
      store.usage = recordRequest(store.usage, model, usage?.inputTokens ?? 0, clock.ms);
    },
  };
  return { provider, storage, deps, counted, clock, store, router };
}

async function newSession(deps: TurnDeps, campaignId = 'camp-1'): Promise<Session> {
  return createCampaign(
    deps.registry,
    deps.storage,
    { name: 'Kael Varn', birthDate: { year: TEST_YEAR - 14, month: 3, day: 4 }, startDate: TEST_START_DATE, startSecond: START_SECOND },
    { campaignId, branchId: 'branch-1' },
    '2026-11-16T00:00:00.000Z',
  );
}

const choiceInvestigate = choiceSchema.parse(opening.choices[2]);
const plainNarrative = (overrides: Record<string, unknown> = {}) => ({ ...narrativeInvestigate, events: [], ...overrides });

describe('turn pipeline (architecture §4, §14)', () => {
  it('opening: one narrative call, events applied, turn committed with transcript', async () => {
    const { deps, provider, storage, counted } = setup([{ callType: 'narrative', data: opening }]);
    const s0 = await newSession(deps);
    const { session, record } = await playTurn(deps, s0, { kind: 'opening', premise: '' });
    expect(provider.calls.map((c) => c.opts.callType)).toEqual(['narrative']);
    expect(provider.calls[0]?.opts.model).toBe('gemini-3.8-flash');
    expect(counted).toEqual(['gemini-3.8-flash']);
    expect(session.state.meta.turn).toBe(1);
    expect(session.state.clock.now.second).toBe(START_SECOND + 30);
    expect(session.state.pacing.scene.moodTags).toEqual(['calm', 'expectant']);
    expect(record.rejected).toEqual([]);
    expect(storage.transcript.map((t) => t.turn)).toEqual([1]);
    const saved = loadEnvelope<GameState>(REGISTRY, await storage.loadSnapshot(AUTOSAVE_SLOT));
    expect(saved.ok && saved.state).toEqual(session.state);
    // The prompt carries the Legends rule, the generic character name and the opening section.
    expect(provider.calls[0]?.opts.system).toContain('Star Wars Legends only');
    expect(provider.calls[0]?.messages.at(-1)?.text).toContain('Kael Varn (pc), age 13');
  });

  it('typed input makes two calls (intent on Flash-Lite, then narrative); the engine decides and rolls the check', async () => {
    const { deps, provider } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'intent', data: intentInvestigate },
      { callType: 'narrative', data: narrativeInvestigate },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const { session, record } = await playTurn(deps, s1, { kind: 'typed', text: 'I study the hall for anything unusual' });
    expect(provider.calls.map((c) => [c.opts.callType, c.opts.model])).toEqual([
      ['narrative', 'gemini-3.8-flash'],
      ['intent', 'gemini-3.5-flash-lite'],
      ['narrative', 'gemini-3.8-flash'],
    ]);
    expect(record.draft.checks).toHaveLength(1);
    const card = record.draft.checks[0]!;
    expect(card).toMatchObject({ label: 'Investigate', difficulty: 'hard', dc: 17, levelBonus: 0 });
    expect(card.total).toBe(card.d20 + card.naturalBonus);
    // The resolved block given to the narrator states the outcome.
    expect(provider.calls[2]?.messages.at(-1)?.text).toContain(card.grade.toUpperCase());
    expect(session.state.memory.review.map((r) => r.name)).toEqual(['Master Orsen']);
    expect(session.state.meta.turn).toBe(2);
    expect(session.state.meta.rngState).not.toEqual(s1.state.meta.rngState);
  });

  it('invalid events are dropped and logged; the rest of the reply applies', async () => {
    const { deps } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'intent', data: intentInvestigate },
      { callType: 'narrative', data: narrativeInvestigate },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const { session, record } = await playTurn(deps, s1, { kind: 'typed', text: 'look' });
    const reasons = record.rejected.map((r) => r.reason);
    // M5: the flags feature exists; masterApproval is engine-only, so the AI's flagSet is rejected (flag-registry test 2).
    expect(reasons).toContain('flag masterApproval does not allow the ai source');
    expect(reasons.some((r) => r.includes('only moment applies'))).toBe(true);
    expect(record.applied.map((a) => a.event.type)).toEqual(['timeElapsed', 'sceneUpdated', 'reviewQueued']);
    expect(session.state.clock.now.second).toBe(START_SECOND + 30 + 120);
  });

  it('a clicked choice makes exactly one call (fast path) and still gets an engine check', async () => {
    const { deps, provider } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'narrative', data: plainNarrative() },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const { record } = await playTurn(deps, s1, { kind: 'choice', choice: choiceInvestigate });
    expect(provider.calls.map((c) => c.opts.callType)).toEqual(['narrative', 'narrative']);
    expect(record.draft.intent?.actionType).toBe('investigate');
    expect(record.draft.checks[0]?.difficulty).toBe('moderate');
  });

  it('truncation gives one automatic retry with a larger budget and identical dice', async () => {
    const { deps, provider, counted } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'narrative', error: { kind: 'truncated' } },
      { callType: 'narrative', data: plainNarrative() },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const pending = await prepareTurn(deps, s1, { kind: 'choice', choice: choiceInvestigate });
    const { record } = await narrateTurn(deps, s1, pending);
    expect(provider.calls).toHaveLength(3);
    expect(provider.calls[2]!.opts.maxOutputTokens).toBe(Math.ceil(provider.calls[1]!.opts.maxOutputTokens * 1.5));
    expect(provider.calls[2]!.messages).toEqual(provider.calls[1]!.messages);
    expect(record.draft.checks).toEqual(pending.resolution.draft.checks);
    expect(record.calls.map((c) => c.outcome)).toEqual(['truncated', 'ok']);
    expect(counted).toHaveLength(3);
  });

  it('autoRetry off: truncation makes no second call; Retry reuses the same TurnDraft', async () => {
    const { deps, provider } = setup(
      [
        { callType: 'narrative', data: opening },
        { callType: 'narrative', error: { kind: 'truncated' } },
        { callType: 'narrative', data: plainNarrative() },
      ],
      { autoRetry: false },
    );
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const err = await playTurn(deps, s1, { kind: 'choice', choice: choiceInvestigate }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TurnError);
    const te = err as TurnError;
    expect(te.stage).toBe('narrate');
    expect(provider.calls).toHaveLength(2);
    const { record } = await narrateTurn(deps, s1, te.pending!);
    expect(record.draft.checks).toEqual(te.pending!.resolution.draft.checks);
    expect(record.calls.map((c) => c.outcome)).toEqual(['truncated', 'ok']);
  });

  it('a 429 makes no automatic call and leaves the state uncommitted', async () => {
    const { deps, provider, storage } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'intent', error: { kind: 'rateLimit', status: 429, retryAfterSeconds: 30 } },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const err = (await playTurn(deps, s1, { kind: 'typed', text: 'hello' }).catch((e: unknown) => e)) as TurnError;
    expect(err.stage).toBe('intent');
    expect(err.pending).toBeUndefined();
    expect(provider.calls).toHaveLength(2);
    expect(provider.remaining()).toBe(0);
    expect(storage.transcript).toHaveLength(1);
  });

  it('a requested span is the one time writer: timeElapsed leaves the schema and is refused (D-30, D-72)', async () => {
    const { deps, provider } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'intent', data: { actionType: 'rest', targets: [], references: [], unknownNames: [], requestedSpan: { amount: 2, unit: 'hours' } } },
      { callType: 'narrative', data: plainNarrative({ events: [{ type: 'timeElapsed', seconds: 999, reason: 'x' }] }) },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const { session, record } = await playTurn(deps, s1, { kind: 'typed', text: 'I meditate for two hours' });
    expect(record.draft.timeAdvanced?.seconds).toBe(7200);
    expect(session.state.pacing.level).toBe('scene');
    expect(session.state.clock.now.second).toBe(START_SECOND + 30 + 7200);
    expect(record.rejected[0]?.reason).toBe('event type timeElapsed is not allowed this turn');
    const wire = JSON.stringify(provider.calls[2]!.opts.wireSchema ? 'present' : 'missing');
    expect(wire).toBe('"present"');
  });

  it('same seed and inputs give identical state (determinism)', async () => {
    const run = async () => {
      const { deps } = setup([
        { callType: 'narrative', data: opening },
        { callType: 'intent', data: intentInvestigate },
        { callType: 'narrative', data: narrativeInvestigate },
      ]);
      const s1 = (await playTurn(deps, await newSession(deps, 'same-seed'), { kind: 'opening', premise: '' })).session;
      return (await playTurn(deps, s1, { kind: 'typed', text: 'look' })).session.state;
    };
    expect(await run()).toEqual(await run());
  });

  it('a failed commit keeps the reply; Retry re-commits without another model call', async () => {
    const { deps, provider, storage } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'narrative', data: plainNarrative() },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const failing = { ...deps, storage: { ...storage, commitTurn: async () => Promise.reject(new Error('quota')) } };
    const err = (await playTurn(failing, s1, { kind: 'choice', choice: choiceInvestigate }).catch((e: unknown) => e)) as TurnError;
    expect(err.stage).toBe('commit');
    const { session } = await narrateTurn(deps, s1, err.pending!);
    expect(provider.calls).toHaveLength(2);
    expect(session.state.meta.turn).toBe(2);
  });

  it('resume loads the autosave and the transcript history', async () => {
    const { deps } = setup([{ callType: 'narrative', data: opening }]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const resumed = await resumeCampaign(REGISTRY, deps.storage);
    expect(resumed && 'session' in resumed && resumed.session.state).toEqual(s1.state);
    expect(resumed && 'session' in resumed && resumed.session.history.map((h) => h.narrative)).toEqual([opening.narrative]);
    expect(resumed && 'session' in resumed && resumed.session.campaign.createdAt).toBe('2026-11-16T00:00:00.000Z');
  });
});

describe('daily-quota model fallback (D-80)', () => {
  const daily = { kind: 'rateLimit' as const, status: 429, quotaScope: 'day' as const, message: 'Quota exceeded: GenerateRequestsPerDay' };
  const perMinute = { kind: 'rateLimit' as const, status: 429, quotaScope: 'minute' as const, retryAfterSeconds: 20 };

  it('a daily 429 on Flash switches to Flash-Lite in the same turn, with the same dice, and stays there until reset', async () => {
    const { deps, provider, router, clock, store } = setup([
      { callType: 'narrative', model: 'gemini-3.8-flash', data: opening },
      { callType: 'narrative', model: 'gemini-3.8-flash', error: daily },
      { callType: 'narrative', model: 'gemini-3.5-flash-lite', data: plainNarrative() },
      { callType: 'narrative', model: 'gemini-3.5-flash-lite', data: plainNarrative() },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const pending = await prepareTurn(deps, s1, { kind: 'choice', choice: choiceInvestigate });
    const { session: s2, record } = await narrateTurn(deps, s1, pending);
    expect(provider.calls.map((c) => c.opts.model)).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite']);
    expect(record.calls.map((c) => c.outcome)).toEqual(['rateLimit:day', 'ok']);
    expect(record.draft.checks).toEqual(pending.resolution.draft.checks);
    expect(record.draft.report.some((r) => r.includes('using fallback gemini-3.5-flash-lite'))).toBe(true);
    expect(router.notices()).toEqual(['gemini-3.8-flash daily limit reached; using gemini-3.5-flash-lite until reset']);
    expect(Object.keys(store.quota)).toEqual(['gemini-3.8-flash']);

    // The next turn goes straight to Flash-Lite: no wasted call on Flash.
    await playTurn(deps, s2, { kind: 'choice', choice: choiceInvestigate });
    expect(provider.calls.at(-1)?.opts.model).toBe('gemini-3.5-flash-lite');
    expect(provider.calls).toHaveLength(4);

    // After the Pacific midnight reset (08:00 UTC in November) the first model is used again.
    clock.ms = Date.UTC(2026, 10, 17, 8, 1);
    expect(router.choose('narrative').model).toBe('gemini-3.8-flash');
    expect(router.notices()).toEqual([]);
  });

  it('a per-minute 429 does not fall back: no automatic call, normal Retry, quota untouched', async () => {
    const { deps, provider, store, router } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'narrative', model: 'gemini-3.8-flash', error: perMinute },
      { callType: 'narrative', model: 'gemini-3.8-flash', data: plainNarrative() },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const err = (await playTurn(deps, s1, { kind: 'choice', choice: choiceInvestigate }).catch((e: unknown) => e)) as TurnError;
    expect(err).toBeInstanceOf(TurnError);
    expect(err.stage).toBe('narrate');
    expect(provider.calls).toHaveLength(2);
    expect(store.quota).toEqual({});
    expect(router.notices()).toEqual([]);
    // Retry stays on Flash.
    await narrateTurn(deps, s1, err.pending!);
    expect(provider.calls.at(-1)?.opts.model).toBe('gemini-3.8-flash');
  });

  it('a 429 that does not say which quota is treated like a per-minute one (no fallback)', async () => {
    const { deps, provider, store } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'narrative', error: { kind: 'rateLimit', status: 429, quotaScope: 'unknown' } },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    await expect(playTurn(deps, s1, { kind: 'choice', choice: choiceInvestigate })).rejects.toBeInstanceOf(TurnError);
    expect(provider.calls).toHaveLength(2);
    expect(store.quota).toEqual({});
  });

  it('the usage meter reaching the RPD limit switches before any call is wasted', async () => {
    const { deps, provider, router } = setup(
      [
        { callType: 'narrative', model: 'gemini-3.8-flash', data: opening },
        { callType: 'narrative', model: 'gemini-3.5-flash-lite', data: plainNarrative() },
      ],
      { limits: { 'gemini-3.8-flash': { rpd: 1 }, 'gemini-3.5-flash-lite': { rpd: 500 } } },
    );
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    expect(router.choose('narrative')).toMatchObject({ model: 'gemini-3.5-flash-lite', skipped: [{ model: 'gemini-3.8-flash', reason: 'rpdReached' }] });
    await playTurn(deps, s1, { kind: 'choice', choice: choiceInvestigate });
    expect(provider.calls.map((c) => c.opts.model)).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
  });

  it('with no model left the daily 429 surfaces as an error; each model is tried once', async () => {
    const { deps, provider, router } = setup([
      { callType: 'narrative', data: opening },
      { callType: 'narrative', model: 'gemini-3.8-flash', error: daily },
      { callType: 'narrative', model: 'gemini-3.5-flash-lite', error: daily },
      { callType: 'intent', model: 'gemini-3.5-flash-lite', error: daily },
    ]);
    const s1 = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    const err = (await playTurn(deps, s1, { kind: 'choice', choice: choiceInvestigate }).catch((e: unknown) => e)) as TurnError;
    expect(err.stage).toBe('narrate');
    expect(provider.calls).toHaveLength(3);
    expect(router.notices()).toEqual([
      'gemini-3.8-flash, gemini-3.5-flash-lite daily limit reached and no fallback left; requests may fail until reset',
      'Intent: gemini-3.5-flash-lite daily limit reached and no fallback left; requests may fail until reset',
      'Summary: gemini-3.5-flash-lite daily limit reached and no fallback left; requests may fail until reset',
      'OOC: gemini-3.5-flash-lite daily limit reached and no fallback left; requests may fail until reset',
    ]);
    // A single-model list (intent) makes one call and errors; there is only one API key.
    const e2 = (await playTurn(deps, s1, { kind: 'typed', text: 'hi' }).catch((e: unknown) => e)) as TurnError;
    expect(e2.stage).toBe('intent');
    expect(provider.calls).toHaveLength(4);
  });
});
