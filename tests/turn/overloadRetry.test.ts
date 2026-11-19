// D-240 (combat pass 3: about 100 Gemini 503s in one session): a 5xx or a timeout is retried on the same model up to 3
// times with backoff and jitter, then tried once on the next model in the fallback order, then the turn shows Retry.
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

describe('Gemini overload: retries, then the next model, then Retry (D-240)', () => {
  it('two 503s then a reply: three calls on the same model, backoff 2 s then 4 s, the busy note, one call on the meter', async () => {
    const { deps, provider, slept, status, metered } = setup([busy(PRIMARY), busy(PRIMARY), ok(PRIMARY)]);
    const t = await playTurn(deps, await session(deps), { kind: 'opening', premise: '' });
    expect(provider.calls.map((c) => c.opts.model)).toEqual([PRIMARY, PRIMARY, PRIMARY]);
    expect(slept).toEqual([2000, 4000]);
    expect(status).toEqual(['Gemini is busy, retrying… (1 of 3)', 'Gemini is busy, retrying… (2 of 3)', null]);
    expect(metered).toEqual([PRIMARY]);
    expect(t.record.draft.report.join('\n')).toMatch(/gemini-3\.8-flash: busy \(503\); retry 1 of 3 in 2\.0 s/);
    expect(t.record.calls.map((c) => c.outcome)).toEqual(['http', 'http', 'ok']);
  });
  it('still busy after 3 retries: one try on the next model in the order, which answers', async () => {
    const { deps, provider, slept, metered } = setup([busy(PRIMARY), busy(PRIMARY), busy(PRIMARY), busy(PRIMARY), ok(NEXT)]);
    const t = await playTurn(deps, await session(deps), { kind: 'opening', premise: '' });
    expect(provider.calls.map((c) => c.opts.model)).toEqual([PRIMARY, PRIMARY, PRIMARY, PRIMARY, NEXT]);
    expect(slept).toEqual([2000, 4000, 8000]);
    expect(metered).toEqual([NEXT]);
    expect(t.record.draft.report.join('\n')).toMatch(/narrative: gemini-3\.8-flash still busy after 3 retries; one try on gemini-3\.5-flash-lite/);
  });
  it('the next model busy too: the turn fails with the last error (the UI shows Retry); nothing on the meter', async () => {
    const { deps, provider, metered } = setup([busy(PRIMARY), busy(PRIMARY), busy(PRIMARY), busy(PRIMARY), busy(NEXT)]);
    await expect(playTurn(deps, await session(deps), { kind: 'opening', premise: '' })).rejects.toBeInstanceOf(TurnError);
    expect(provider.calls).toHaveLength(5);
    expect(metered).toEqual([]);
  });
  it('a timeout is an overload; a 400 and a 429 are not retried here', async () => {
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
