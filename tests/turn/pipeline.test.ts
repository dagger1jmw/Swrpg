import { describe, expect, it } from 'vitest';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { choiceSchema } from '../../src/ai/schemas/compose';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { loadEnvelope } from '../../src/persist/envelope';
import { AUTOSAVE_SLOT, createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, resumeCampaign, DEFAULT_START } from '../../src/turn/campaign';
import { narrateTurn, playTurn, prepareTurn, TurnError, type Session, type TurnDeps } from '../../src/turn/pipeline';
import intentInvestigate from '../fixtures/ai/intent-investigate.json';
import narrativeInvestigate from '../fixtures/ai/narrative-investigate.json';
import opening from '../fixtures/ai/opening.json';

const START_SECOND = DEFAULT_START.second;

function setup(steps: FixtureStep[], settings: Partial<Settings> = {}) {
  const provider = createFixtureProvider(steps);
  const storage = createMemoryStorage();
  const counted: string[] = [];
  let ms = Date.UTC(2026, 10, 16, 20, 0);
  const deps: TurnDeps = {
    registry: REGISTRY,
    provider,
    storage,
    getSettings: () => ({ ...defaultSettings(), apiKey: 'k'.repeat(30), ...settings }),
    wallClock: () => {
      ms += 1000;
      return { ms, iso: new Date(ms).toISOString() };
    },
    recordCall: (model) => counted.push(model),
  };
  return { provider, storage, deps, counted };
}

async function newSession(deps: TurnDeps, campaignId = 'camp-1'): Promise<Session> {
  return createCampaign(
    deps.registry,
    deps.storage,
    { name: 'Kael Varn', birthDate: { year: -3675, month: 3, day: 4 }, startDate: DEFAULT_START.date, startSecond: START_SECOND },
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
    expect(provider.calls[0]?.messages.at(-1)?.text).toContain('Kael Varn, age 13');
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
    expect(record.draft.report.some((r) => r.includes('Master Orsen'))).toBe(true);
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
    expect(reasons).toContain('event type flagSet is not allowed this turn');
    expect(reasons.some((r) => r.includes('only moment applies'))).toBe(true);
    expect(record.applied.map((a) => a.event.type)).toEqual(['timeElapsed', 'sceneUpdated']);
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
