// Gemini generateContent adapter (architecture §6, D-68). Thin on purpose: request building,
// response reading and error mapping only, so an Interactions API adapter can replace it without
// changes outside src/ai/. The API key goes in the x-goog-api-key header, never the URL.
import type { ZodType } from 'zod';
import { toGeminiSchema } from './jsonSchema';
import {
  AiError,
  parseStructured,
  ZERO_USAGE,
  type CallOptions,
  type FinishReason,
  type Message,
  type ModelProvider,
  type StructuredResult,
  type Usage,
} from './provider';

export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiDeps {
  getApiKey: () => string | null;
  fetch: typeof fetch;
  baseUrl?: string;
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
      responseJsonSchema: toGeminiSchema(schema),
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

export function createGeminiProvider(deps: GeminiDeps): ModelProvider {
  const base = deps.baseUrl ?? GEMINI_BASE_URL;
  return {
    async generateStructured<T>(schema: ZodType<T>, messages: readonly Message[], opts: CallOptions): Promise<StructuredResult<T>> {
      const key = deps.getApiKey();
      if (!key) throw new AiError('noKey', 'No Gemini API key is set. Add one in Settings.');
      const url = `${base}/models/${encodeURIComponent(opts.model)}:generateContent`;
      let res: Response;
      try {
        res = await deps.fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(buildGeminiRequest(schema, messages, opts)),
        });
      } catch (e) {
        throw new AiError('network', `Network error: ${e instanceof Error ? e.message : String(e)}`);
      }
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (!res.ok) {
        const msg = (body as { error?: { message?: string } })?.error?.message ?? res.statusText;
        if (res.status === 429) {
          const ra = retryAfter(body);
          throw new AiError('rateLimit', `Rate limit reached for ${opts.model}: ${msg}`, { status: 429, ...(ra !== undefined ? { retryAfterSeconds: ra } : {}) });
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
