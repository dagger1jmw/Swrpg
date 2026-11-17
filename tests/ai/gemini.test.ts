import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createGeminiProvider, GEMINI_BASE_URL } from '../../src/ai/gemini';
import type { AiError} from '../../src/ai/provider';
import { type CallOptions } from '../../src/ai/provider';

const schema = z.object({ answer: z.string(), n: z.number().int() });
const opts: CallOptions = { callType: 'intent', model: 'gemini-3.5-flash-lite', system: 'SYS', maxOutputTokens: 600, temperature: 0.2, thinking: { level: 'low' } };
const KEY = 'AIzaTESTKEY1234567890';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function ok(text: string, finishReason = 'STOP', extraParts: unknown[] = []): Response {
  return jsonResponse(200, {
    candidates: [{ content: { parts: [...extraParts, { text }] }, finishReason }],
    usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 30, thoughtsTokenCount: 10, totalTokenCount: 160 },
  });
}

describe('gemini adapter (D-68)', () => {
  it('sends the key in the x-goog-api-key header, never in the URL, with the documented request shape', async () => {
    const fetch = vi.fn(async () => ok('{"answer":"yes","n":2}'));
    const p = createGeminiProvider({ getApiKey: () => KEY, fetch });
    const r = await p.generateStructured(schema, [{ role: 'user', text: 'hi' }, { role: 'model', text: 'ok' }, { role: 'user', text: 'go' }], opts);
    expect(r.data).toEqual({ answer: 'yes', n: 2 });
    expect(r.usage).toEqual({ inputTokens: 120, outputTokens: 30, thoughtTokens: 10, totalTokens: 160 });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${GEMINI_BASE_URL}/models/gemini-3.5-flash-lite:generateContent`);
    expect(url).not.toContain(KEY);
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY);
    const body = JSON.parse(String(init.body));
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'SYS' }] });
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(['user', 'model', 'user']);
    expect(body.generationConfig).toMatchObject({
      temperature: 0.2,
      maxOutputTokens: 600,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingLevel: 'low' },
    });
    expect(body.generationConfig.responseJsonSchema).toMatchObject({ type: 'object', required: ['answer', 'n'] });
    expect(JSON.stringify(body)).not.toContain(KEY);
  });

  it('skips thought parts when reading the reply', async () => {
    const fetch = vi.fn(async () => ok('{"answer":"a","n":1}', 'STOP', [{ text: 'thinking...', thought: true }]));
    const r = await createGeminiProvider({ getApiKey: () => KEY, fetch }).generateStructured(schema, [], opts);
    expect(r.data.answer).toBe('a');
  });

  const failWith = async (response: Response | Error): Promise<AiError> => {
    const fetch = vi.fn(async () => {
      if (response instanceof Error) throw response;
      return response;
    });
    try {
      await createGeminiProvider({ getApiKey: () => KEY, fetch }).generateStructured(schema, [], opts);
    } catch (e) {
      return e as AiError;
    }
    throw new Error('expected a failure');
  };

  it('maps MAX_TOKENS to a truncated error carrying usage', async () => {
    const e = await failWith(ok('{"answer":"cut', 'MAX_TOKENS'));
    expect(e.kind).toBe('truncated');
    expect(e.usage?.inputTokens).toBe(120);
  });

  it('maps 429 to rateLimit with the retry delay, other statuses to http', async () => {
    const e = await failWith(
      jsonResponse(429, { error: { message: 'Quota exceeded', details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '31s' }] } }),
    );
    expect(e.kind).toBe('rateLimit');
    expect(e.retryAfterSeconds).toBe(31);
    const h = await failWith(jsonResponse(400, { error: { message: 'Invalid schema' } }));
    expect(h.kind).toBe('http');
    expect(h.message).toContain('Invalid schema');
  });

  it('maps invalid JSON, schema mismatch, empty, blocked and network failures', async () => {
    expect((await failWith(ok('not json'))).kind).toBe('invalidJson');
    expect((await failWith(ok('{"answer":"x"}'))).kind).toBe('schema');
    expect((await failWith(ok(''))).kind).toBe('empty');
    expect((await failWith(jsonResponse(200, { promptFeedback: { blockReason: 'SAFETY' } }))).kind).toBe('blocked');
    expect((await failWith(new TypeError('Failed to fetch'))).kind).toBe('network');
  });

  it('aborts a stalled request after the timeout and reports it (no hang)', async () => {
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const p = createGeminiProvider({ getApiKey: () => KEY, fetch: fetch as unknown as typeof globalThis.fetch, timeoutMs: 20 });
    await expect(p.generateStructured(schema, [], opts)).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('refuses to call without a key', async () => {
    const fetch = vi.fn();
    await expect(createGeminiProvider({ getApiKey: () => null, fetch }).generateStructured(schema, [], opts)).rejects.toMatchObject({ kind: 'noKey' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
