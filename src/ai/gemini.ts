// Gemini generateContent adapter (architecture §6, D-68). Thin on purpose: request building,
// response reading and error mapping only, so an Interactions API adapter can replace it without
// changes outside src/ai/. The API key goes in the x-goog-api-key header, never the URL.
import type { ZodType } from 'zod';
import { toGeminiSchema } from './jsonSchema';
import { REQUEST_TIMEOUT_MS } from './models.config';
import {
  AiError,
  parseStructured,
  ZERO_USAGE,
  type CallOptions,
  type FinishReason,
  type Message,
  type ModelProvider,
  type QuotaScope,
  type StructuredResult,
  type Usage,
} from './provider';

export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiDeps {
  getApiKey: () => string | null;
  fetch: typeof fetch;
  baseUrl?: string;
  /** Request timeout; defaults to REQUEST_TIMEOUT_MS. */
  timeoutMs?: number;
}

interface GeminiPart {
  text?: string;
  thought?: boolean;
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number; totalTokenCount?: number };
  modelVersion?: string;
}

export function buildGeminiRequest(schema: ZodType, messages: readonly Message[], opts: CallOptions): Record<string, unknown> {
  const thinkingConfig =
    opts.thinking?.level !== undefined
      ? { thinkingLevel: opts.thinking.level }
      : opts.thinking?.budget !== undefined
        ? { thinkingBudget: opts.thinking.budget }
        : undefined;
  return {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      temperature: opts.temperature,
      maxOutputTokens: opts.maxOutputTokens,
      responseMimeType: 'application/json',
      responseJsonSchema: toGeminiSchema(opts.wireSchema ?? schema),
      ...(thinkingConfig ? { thinkingConfig } : {}),
    },
  };
}

function readUsage(r: GeminiResponse): Usage {
  const u = r.usageMetadata ?? {};
  const inputTokens = u.promptTokenCount ?? 0;
  const outputTokens = u.candidatesTokenCount ?? 0;
  const thoughtTokens = u.thoughtsTokenCount ?? 0;
  return { inputTokens, outputTokens, thoughtTokens, totalTokens: u.totalTokenCount ?? inputTokens + outputTokens + thoughtTokens };
}

function mapFinish(reason: string | undefined): FinishReason {
  if (reason === 'STOP') return 'stop';
  if (reason === 'MAX_TOKENS') return 'maxTokens';
  if (reason === 'SAFETY' || reason === 'PROHIBITED_CONTENT' || reason === 'BLOCKLIST') return 'safety';
  return 'other';
}

/** Reads "retryDelay": "30s" from a 429 body (google.rpc.RetryInfo). */
function retryAfter(body: unknown): number | undefined {
  const details = (body as { error?: { details?: { retryDelay?: string }[] } })?.error?.details ?? [];
  for (const d of details) {
    const m = /^(\d+(?:\.\d+)?)s$/.exec(d.retryDelay ?? '');
    if (m?.[1]) return Math.ceil(Number(m[1]));
  }
  return undefined;
}

/**
 * Reads the quota window from a 429 body. Gemini returns a google.rpc.QuotaFailure whose
 * violations name the quota, e.g. quotaId "GenerateRequestsPerDayPerProjectPerModel-FreeTier"
 * or "GenerateContentInputTokensPerModelPerMinute-FreeTier". Per-day wins if both appear.
 */
export function quotaScopeOf(body: unknown): QuotaScope {
  const details = (body as { error?: { details?: { violations?: { quotaId?: string; quotaMetric?: string }[] }[] } })?.error?.details ?? [];
  const ids = details.flatMap((d) => d.violations ?? []).map((v) => `${v.quotaId ?? ''} ${v.quotaMetric ?? ''}`);
  if (ids.some((id) => /per\s*day|perday|daily/i.test(id))) return 'day';
  if (ids.some((id) => /per\s*minute|perminute/i.test(id))) return 'minute';
  return 'unknown';
}

export function createGeminiProvider(deps: GeminiDeps): ModelProvider {
  const base = deps.baseUrl ?? GEMINI_BASE_URL;
  return {
    async generateStructured<T>(schema: ZodType<T>, messages: readonly Message[], opts: CallOptions): Promise<StructuredResult<T>> {
      const key = deps.getApiKey();
      if (!key) throw new AiError('noKey', 'No Gemini API key is set. Add one in Settings.');
      const url = `${base}/models/${encodeURIComponent(opts.model)}:generateContent`;
      // A stalled request must not leave the game waiting forever: abort after the timeout and
      // surface it as an error with a Retry button (no automatic call, D-16).
      const timeoutMs = deps.timeoutMs ?? REQUEST_TIMEOUT_MS;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response;
      let body: unknown;
      try {
        res = await deps.fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(buildGeminiRequest(schema, messages, opts)),
          signal: controller.signal,
        });
        try {
          body = await res.json();
        } catch (e) {
          if (controller.signal.aborted) throw e;
          body = null;
        }
      } catch (e) {
        if (controller.signal.aborted) {
          throw new AiError('timeout', `No reply from ${opts.model} within ${Math.round(timeoutMs / 1000)} s.`);
        }
        throw new AiError('network', `Network error: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) {
        const msg = (body as { error?: { message?: string } })?.error?.message ?? res.statusText;
        if (res.status === 429) {
          const ra = retryAfter(body);
          const quotaScope = quotaScopeOf(body);
          const what = quotaScope === 'day' ? 'Daily limit' : quotaScope === 'minute' ? 'Per-minute limit' : 'Rate limit';
          throw new AiError('rateLimit', `${what} reached for ${opts.model}: ${msg}`, {
            status: 429,
            quotaScope,
            ...(ra !== undefined ? { retryAfterSeconds: ra } : {}),
          });
        }
        throw new AiError('http', `Gemini error ${res.status}: ${msg}`, { status: res.status });
      }
      const r = (body ?? {}) as GeminiResponse;
      const usage = r.usageMetadata ? readUsage(r) : ZERO_USAGE;
      if (r.promptFeedback?.blockReason) throw new AiError('blocked', `The request was blocked (${r.promptFeedback.blockReason}).`, { usage });
      const cand = r.candidates?.[0];
      const finishReason = mapFinish(cand?.finishReason);
      if (finishReason === 'maxTokens') throw new AiError('truncated', 'The reply was cut off at the output limit.', { usage });
      if (finishReason === 'safety') throw new AiError('blocked', `The reply was blocked (${cand?.finishReason ?? ''}).`, { usage });
      const text = (cand?.content?.parts ?? [])
        .filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text)
        .join('');
      const data = parseStructured(schema, text, usage);
      return { data, usage, finishReason, model: r.modelVersion ?? opts.model };
    },
  };
}
