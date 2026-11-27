// D-240 (combat pass 3: about 100 Gemini 503s in one session), amended by m8-fixes E2: a 5xx switches to the next model at once
// (which keeps the retries with backoff and jitter); a timeout is retried on the same model up to 3 times, then the next model.
// The busy note shows while waiting; none of these count on the usage meter; the same draft is used throughout.
import { describe, expect, it } from 'vitest';
import { LORE_TEST_DATE as TEST_START_DATE, LORE_TEST_YEAR as TEST_YEAR } from '../support/dates';
import { createModelRouter, nextModelAfter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { OVERLOAD_RETRY, overloadDelayMs } from '../../src/ai/models.config';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { AiError } from '../../src/ai/provider';
import { createMemoryStorage } from '../../src/persist/storage';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { isOverload, playTurn, TurnError, type Session, type TurnDeps } from '../../src/turn/pipeline';
import openingM2 from '../fixtures/ai/opening-m2.json';

function setup(steps: FixtureStep[]) {
  const provider = createFixtureProvider(steps);
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const slept: number[] = [];
  const status: (string | null)[] = [];
  const metered: string[] = [];
  let ms = Date.UTC(2026, 10, 19, 20, 0);
  const deps: TurnDeps = {
    registry: REGISTRY,
    provider,
    storage: createMemoryStorage(),
    getSettings,
    router: createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => ms }),
    wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }),
    recordCall: (model) => metered.push(model),
    sleep: async (t) => void slept.push(t),
    jitter: () => 0.5,
    onStatus: (t) => void status.push(t),
  };
  return { provider, deps, slept, status, metered };
}
const session = (deps: TurnDeps): Promise<Session> =>
  createCampaign(deps.registry, deps.storage, { name: 'Kael Varn', birthDate: { year: TEST_YEAR - 14, month: 3, day: 4 }, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND }, { campaignId: 'c-503', branchId: 'b' }, '2026-11-19T00:00:00.000Z');
const busy = (model?: string): FixtureStep => ({ callType: 'narrative', ...(model ? { model } : {}), error: { kind: 'http', status: 503, message: 'Gemini error 503: This model is currently experiencing high demand.' } });
const ok = (model?: string): FixtureStep => ({ callType: 'narrative', ...(model ? { model } : {}), data: openingM2 });
const PRIMARY = 'gemini-3.8-flash';
const NEXT = 'gemini-3.5-flash-lite';

describe('Gemini overload: a busy reply switches to the next model at once (m8-fixes E2), which keeps the retries (D-240)', () => {
  it('one 503 on the first model: straight to the next model, no wait; one call on the meter', async () => {
    const { deps, provider, slept, status, metered } = setup([busy(PRIMARY), ok(NEXT)]);
    const t = await playTurn(deps, await session(deps), { kind: 'opening', premise: '' });
    expect(provider.calls.map((c) => c.opts.model)).toEqual([PRIMARY, NEXT]);
    expect(slept).toEqual([]);
    expect(status).toEqual([`Gemini is busy, trying ${NEXT}…`, null]);
    expect(metered).toEqual([NEXT]);
    expect(t.record.draft.report.join('\n')).toMatch(/narrative: gemini-3\.8-flash busy \(503\); switching to gemini-3\.5-flash-lite at once/);
    expect(t.record.calls.map((c) => c.outcome)).toEqual(['http', 'ok']);
  });
  it('the next model busy too: it retries with backoff (2 s, then 4 s) and answers', async () => {
    const { deps, provider, slept, metered } = setup([busy(PRIMARY), busy(NEXT), busy(NEXT), ok(NEXT)]);
    const t = await playTurn(deps, await session(deps), { kind: 'opening', premise: '' });
    expect(provider.calls.map((c) => c.opts.model)).toEqual([PRIMARY, NEXT, NEXT, NEXT]);
    expect(slept).toEqual([2000, 4000]);
    expect(metered).toEqual([NEXT]);
    expect(t.record.draft.report.join('\n')).toMatch(/gemini-3\.5-flash-lite: busy \(503\); retry 1 of 3 in 2\.0 s/);
  });
  it('the next model still busy after its retries: the turn fails with the last error (the UI shows Retry); nothing on the meter', async () => {
    const { deps, provider, metered } = setup([busy(PRIMARY), busy(NEXT), busy(NEXT), busy(NEXT), busy(NEXT)]);
    await expect(playTurn(deps, await session(deps), { kind: 'opening', premise: '' })).rejects.toBeInstanceOf(TurnError);
    expect(provider.calls).toHaveLength(5);
    expect(metered).toEqual([]);
  });
  it('the wait before the fallback answers, before and after (reported): 14 s of backoff and four failed calls, now none and one', () => {
    const before = [1, 2, 3].reduce((t, n) => t + overloadDelayMs(n, 0.5), 0);
    expect(before).toBe(14_000);
    expect(OVERLOAD_RETRY.busyRetries).toBe(0);
  });
  it('a timeout is an overload and keeps its retries on the same model; a 400 and a 429 are not retried here', async () => {
    const timeout = setup([{ callType: 'narrative', error: { kind: 'timeout', message: 'No reply' } }, ok(PRIMARY)]);
    await playTurn(timeout.deps, await session(timeout.deps), { kind: 'opening', premise: '' });
    expect(timeout.provider.calls).toHaveLength(2);
    const bad = setup([{ callType: 'narrative', error: { kind: 'http', status: 400, message: 'bad request' } }]);
    await expect(playTurn(bad.deps, await session(bad.deps), { kind: 'opening', premise: '' })).rejects.toBeInstanceOf(TurnError);
    expect(bad.provider.calls).toHaveLength(1);
    expect(isOverload(new AiError('rateLimit', 'per minute', { status: 429 }))).toBe(false);
    expect(isOverload(new AiError('http', 'x', { status: 502 }))).toBe(true);
    expect(isOverload(new AiError('truncated', 'x'))).toBe(false);
  });
  it('the backoff: base x factor^(n-1), capped, with jitter of +/- 25%', () => {
    expect([1, 2, 3, 4].map((n) => overloadDelayMs(n, 0.5))).toEqual([2000, 4000, 8000, 10000]);
    expect(overloadDelayMs(1, 0)).toBe(1500);
    expect(overloadDelayMs(1, 0.999)).toBe(2499);
    expect(OVERLOAD_RETRY.retries).toBe(3);
  });
  it('the next model skips one exhausted today; none after the last', () => {
    const list = ['a', 'b', 'c'];
    const now = Date.UTC(2026, 10, 19, 20);
    expect(nextModelAfter(list, 'a', {}, EMPTY_USAGE_LOG, {}, now)).toBe('b');
    expect(nextModelAfter(list, 'c', {}, EMPTY_USAGE_LOG, {}, now)).toBeNull();
    const quota = createModelRouter({ getLists: () => ({ narrative: list, intent: list, summary: list, ooc: list }), getLimits: () => ({}), getUsage: () => EMPTY_USAGE_LOG, getQuota: () => ({}), setQuota: () => {}, now: () => now });
    expect(quota.next!('narrative', 'b')).toBe('c');
  });
});
