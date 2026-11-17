import { describe, expect, it } from 'vitest';
import { chooseModel, fallbackNotices, isDailyQuotaError, markExhausted } from '../../src/ai/fallback';
import { quotaScopeOf } from '../../src/ai/gemini';
import { AiError } from '../../src/ai/provider';
import { EMPTY_USAGE_LOG, recordRequest } from '../../src/ai/usage';

const LIST = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
const NOV16_NOON_PT = Date.UTC(2026, 10, 16, 20, 0);
const NOV17_AFTER_MIDNIGHT_PT = Date.UTC(2026, 10, 17, 8, 1);

describe('model fallback (D-80)', () => {
  it('uses the first model until it is exhausted today, then the next', () => {
    expect(chooseModel(LIST, {}, EMPTY_USAGE_LOG, {}, NOV16_NOON_PT)).toMatchObject({ model: 'gemini-3.8-flash', allExhausted: false, skipped: [] });
    const q = markExhausted({}, 'gemini-3.8-flash', NOV16_NOON_PT);
    expect(q).toEqual({ 'gemini-3.8-flash': '2026-11-16' });
    expect(chooseModel(LIST, q, EMPTY_USAGE_LOG, {}, NOV16_NOON_PT)).toMatchObject({
      model: 'gemini-3.5-flash-lite',
      primary: 'gemini-3.8-flash',
      skipped: [{ model: 'gemini-3.8-flash', reason: 'dailyQuota' }],
    });
  });

  it('returns to the first model after the Pacific midnight reset and prunes old entries', () => {
    const q = markExhausted({}, 'gemini-3.8-flash', NOV16_NOON_PT);
    expect(chooseModel(LIST, q, EMPTY_USAGE_LOG, {}, NOV17_AFTER_MIDNIGHT_PT).model).toBe('gemini-3.8-flash');
    expect(markExhausted(q, 'gemini-3.5-flash-lite', NOV17_AFTER_MIDNIGHT_PT)).toEqual({ 'gemini-3.5-flash-lite': '2026-11-17' });
  });

  it('skips a model whose requests-per-day limit the usage meter shows reached', () => {
    let usage = EMPTY_USAGE_LOG;
    for (let i = 0; i < 20; i++) usage = recordRequest(usage, 'gemini-3.8-flash', 100, NOV16_NOON_PT + i);
    const limits = { 'gemini-3.8-flash': { rpd: 20 } };
    expect(chooseModel(LIST, {}, usage, limits, NOV16_NOON_PT + 100)).toMatchObject({ model: 'gemini-3.5-flash-lite', skipped: [{ reason: 'rpdReached' }] });
    // No RPD set: no meter-based skip.
    expect(chooseModel(LIST, {}, usage, {}, NOV16_NOON_PT + 100).model).toBe('gemini-3.8-flash');
    // The next Pacific day the count is 0 again.
    expect(chooseModel(LIST, {}, usage, limits, NOV17_AFTER_MIDNIGHT_PT).model).toBe('gemini-3.8-flash');
  });

  it('with everything exhausted it returns the primary and says so', () => {
    const q = markExhausted(markExhausted({}, 'gemini-3.8-flash', NOV16_NOON_PT), 'gemini-3.5-flash-lite', NOV16_NOON_PT);
    expect(chooseModel(LIST, q, EMPTY_USAGE_LOG, {}, NOV16_NOON_PT)).toMatchObject({ model: 'gemini-3.8-flash', allExhausted: true });
  });

  it('header notices name the real models (D-96: "Flash" named both 3.6 and 3.8)', () => {
    const lists = { narrative: LIST, intent: ['gemini-3.5-flash-lite'], summary: ['gemini-3.5-flash-lite'], ooc: ['gemini-3.5-flash-lite'] };
    const q = markExhausted({}, 'gemini-3.8-flash', NOV16_NOON_PT);
    expect(fallbackNotices(lists, q, EMPTY_USAGE_LOG, {}, NOV16_NOON_PT)).toEqual(['gemini-3.8-flash daily limit reached; using gemini-3.5-flash-lite until reset']);
    expect(fallbackNotices(lists, {}, EMPTY_USAGE_LOG, {}, NOV16_NOON_PT)).toEqual([]);
    const two = { ...lists, narrative: ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'] };
    const q2 = markExhausted(q, 'gemini-3.6-flash', NOV16_NOON_PT);
    expect(fallbackNotices(two, q2, EMPTY_USAGE_LOG, {}, NOV16_NOON_PT)).toEqual(['gemini-3.6-flash, gemini-3.8-flash daily limit reached; using gemini-3.5-flash-lite until reset']);
  });

  it('only a daily-scope 429 counts as an exhausted quota', () => {
    expect(isDailyQuotaError(new AiError('rateLimit', 'x', { quotaScope: 'day' }))).toBe(true);
    expect(isDailyQuotaError(new AiError('rateLimit', 'x', { quotaScope: 'minute' }))).toBe(false);
    expect(isDailyQuotaError(new AiError('rateLimit', 'x', { quotaScope: 'unknown' }))).toBe(false);
    expect(isDailyQuotaError(new AiError('http', 'x', { quotaScope: 'day' }))).toBe(false);
  });
});

describe('gemini 429 quota scope', () => {
  const body = (quotaId: string, quotaMetric = 'generativelanguage.googleapis.com/generate_content_free_tier_requests') => ({
    error: {
      code: 429,
      message: 'You exceeded your current quota.',
      status: 'RESOURCE_EXHAUSTED',
      details: [
        { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaMetric, quotaId, quotaDimensions: { model: 'gemini-3.8-flash' } }] },
        { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '41s' },
      ],
    },
  });

  it('reads per-day and per-minute quota IDs', () => {
    expect(quotaScopeOf(body('GenerateRequestsPerDayPerProjectPerModel-FreeTier'))).toBe('day');
    expect(quotaScopeOf(body('GenerateRequestsPerMinutePerProjectPerModel-FreeTier'))).toBe('minute');
    expect(
      quotaScopeOf(body('GenerateContentInputTokensPerModelPerMinute-FreeTier', 'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count')),
    ).toBe('minute');
  });

  it('per-day wins when both windows are violated; no details means unknown', () => {
    const both = {
      error: {
        details: [
          {
            violations: [
              { quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' },
              { quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' },
            ],
          },
        ],
      },
    };
    expect(quotaScopeOf(both)).toBe('day');
    expect(quotaScopeOf({ error: { message: 'Resource exhausted' } })).toBe('unknown');
    expect(quotaScopeOf(null)).toBe('unknown');
  });
});
