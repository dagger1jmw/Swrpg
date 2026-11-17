import { describe, expect, it } from 'vitest';
import { EMPTY_USAGE_LOG, pacificDate, recordRequest, summarizeUsage } from '../../src/ai/usage';

const M = 'gemini-3.6-flash';
const limits = { rpm: 5, tpm: 250_000, rpd: 20 };

describe('usage meter (architecture §7)', () => {
  it('uses the America/Los_Angeles date, including across daylight saving', () => {
    // 2026-11-16 07:59 UTC = 2026-11-15 23:59 PST; 08:00 UTC = midnight PST.
    expect(pacificDate(Date.UTC(2026, 10, 16, 7, 59))).toBe('2026-11-15');
    expect(pacificDate(Date.UTC(2026, 10, 16, 8, 0))).toBe('2026-11-16');
    // Summer (PDT, UTC-7): midnight is 07:00 UTC.
    expect(pacificDate(Date.UTC(2026, 6, 1, 6, 59))).toBe('2026-06-30');
    expect(pacificDate(Date.UTC(2026, 6, 1, 7, 0))).toBe('2026-07-01');
  });

  it('counts requests per model per Pacific day and resets at Pacific midnight', () => {
    const t0 = Date.UTC(2026, 10, 16, 7, 0); // 23:00 PST
    let log = EMPTY_USAGE_LOG;
    for (let i = 0; i < 3; i++) log = recordRequest(log, M, 1000, t0 + i * 120_000);
    log = recordRequest(log, 'gemini-3.5-flash-lite', 500, t0);
    expect(summarizeUsage(log, M, limits, t0 + 400_000).requestsToday).toBe(3);
    const afterMidnight = Date.UTC(2026, 10, 16, 8, 1);
    expect(summarizeUsage(log, M, limits, afterMidnight).requestsToday).toBe(0);
    log = recordRequest(log, M, 1000, afterMidnight);
    expect(summarizeUsage(log, M, limits, afterMidnight).requestsToday).toBe(1);
    expect(summarizeUsage(log, 'gemini-3.5-flash-lite', {}, t0).requestsToday).toBe(1);
  });

  it('tracks the last minute for RPM and TPM and warns at 80% and at the limit', () => {
    const t = Date.UTC(2026, 10, 16, 20, 0);
    let log = EMPTY_USAGE_LOG;
    for (let i = 0; i < 4; i++) log = recordRequest(log, M, 50_000, t + i * 1000);
    const s = summarizeUsage(log, M, limits, t + 5000);
    expect(s.requestsLastMinute).toBe(4);
    expect(s.tokensLastMinute).toBe(200_000);
    expect(s.warnings.some((w) => w.includes('near the requests-per-minute'))).toBe(true);
    expect(s.warnings.some((w) => w.includes('near the tokens-per-minute'))).toBe(true);
    log = recordRequest(log, M, 1, t + 6000);
    expect(summarizeUsage(log, M, limits, t + 7000).warnings.some((w) => w.includes('requests-per-minute limit reached'))).toBe(true);
    expect(summarizeUsage(log, M, limits, t + 70_000).requestsLastMinute).toBe(0);
    expect(summarizeUsage(log, M, limits, t + 7000).remainingToday).toBe(15);
  });

  it('gives no warnings or remaining count when limits are unknown', () => {
    const t = Date.UTC(2026, 10, 16, 20, 0);
    const log = recordRequest(EMPTY_USAGE_LOG, 'gemini-4-hydrogen', 10, t);
    const s = summarizeUsage(log, 'gemini-4-hydrogen', {}, t);
    expect(s.warnings).toEqual([]);
    expect(s.remainingToday).toBeNull();
  });
});
