// Usage meter (architecture §7). Pure: the caller passes the wall-clock time in ms.
// Requests per model per Pacific day (reset at midnight America/Los_Angeles) and per-minute
// request and token windows, compared against the limits the player sets.
import { USAGE_WARN_FRACTION, type ModelLimits } from './models.config';

export interface UsageLog {
  /** model -> counts for one Pacific date. */
  days: Record<string, { date: string; requests: number; inputTokens: number }>;
  /** Requests in the last minute (for RPM and TPM). */
  recent: { model: string; at: number; inputTokens: number }[];
}

export const EMPTY_USAGE_LOG: UsageLog = { days: {}, recent: [] };

const pacificFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });

/** YYYY-MM-DD in America/Los_Angeles. */
export function pacificDate(nowMs: number): string {
  return pacificFmt.format(nowMs);
}

const WINDOW_MS = 60_000;

export function recordRequest(log: UsageLog, model: string, inputTokens: number, nowMs: number): UsageLog {
  const date = pacificDate(nowMs);
  const prev = log.days[model];
  const day = prev && prev.date === date ? prev : { date, requests: 0, inputTokens: 0 };
  return {
    days: { ...log.days, [model]: { date, requests: day.requests + 1, inputTokens: day.inputTokens + inputTokens } },
    recent: [...log.recent.filter((r) => nowMs - r.at < WINDOW_MS), { model, at: nowMs, inputTokens }],
  };
}

export interface UsageSummary {
  model: string;
  requestsToday: number;
  requestsLastMinute: number;
  tokensLastMinute: number;
  limits: ModelLimits;
  remainingToday: number | null;
  warnings: string[];
}

export function summarizeUsage(log: UsageLog, model: string, limits: ModelLimits, nowMs: number): UsageSummary {
  const day = log.days[model];
  const requestsToday = day && day.date === pacificDate(nowMs) ? day.requests : 0;
  const window = log.recent.filter((r) => r.model === model && nowMs - r.at < WINDOW_MS);
  const requestsLastMinute = window.length;
  const tokensLastMinute = window.reduce((a, r) => a + r.inputTokens, 0);
  const warnings: string[] = [];
  const warn = (used: number, limit: number | undefined, what: string): void => {
    if (limit === undefined || limit <= 0) return;
    if (used >= limit) warnings.push(`${model}: ${what} limit reached (${used}/${limit})`);
    else if (used >= limit * USAGE_WARN_FRACTION) warnings.push(`${model}: near the ${what} limit (${used}/${limit})`);
  };
  warn(requestsToday, limits.rpd, 'requests-per-day');
  warn(requestsLastMinute, limits.rpm, 'requests-per-minute');
  warn(tokensLastMinute, limits.tpm, 'tokens-per-minute');
  return {
    model,
    requestsToday,
    requestsLastMinute,
    tokensLastMinute,
    limits,
    remainingToday: limits.rpd !== undefined ? Math.max(0, limits.rpd - requestsToday) : null,
    warnings,
  };
}
