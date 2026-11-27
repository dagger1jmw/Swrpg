// ModelProvider interface (architecture §6). Adapters: gemini (fetch) and fixture (tests).
import type { ZodType } from 'zod';

export type CallType = 'intent' | 'narrative' | 'summary' | 'ooc';

export interface Message {
  role: 'user' | 'model';
  text: string;
}

/** Thinking control, passed through to the model's thinking config (D-68: verify per model family). */
export interface ThinkingSetting {
  level?: 'minimal' | 'low' | 'medium' | 'high';
  budget?: number;
}

export interface CallOptions {
  callType: CallType;
  model: string;
  system: string;
  maxOutputTokens: number;
  temperature: number;
  thinking?: ThinkingSetting;
  /** The schema sent to the model when it differs from the parse schema (see compose.ts). */
  wireSchema?: ZodType;
  /** A big moment (opt-1 D): why the router may pick the stronger model. Never sent to the model. */
  premium?: string;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  thoughtTokens: number;
  totalTokens: number;
  /** Input tokens Gemini served from its implicit cache (usageMetadata.cachedContentTokenCount; opt-1 C1). Absent when none. */
  cachedTokens?: number;
}

export type FinishReason = 'stop' | 'maxTokens' | 'safety' | 'other';

export interface StructuredResult<T> {
  data: T;
  usage: Usage;
  finishReason: FinishReason;
  model: string;
}

export interface ModelProvider {
  generateStructured<T>(schema: ZodType<T>, messages: readonly Message[], opts: CallOptions): Promise<StructuredResult<T>>;
}

export type AiErrorKind = 'truncated' | 'rateLimit' | 'timeout' | 'network' | 'http' | 'invalidJson' | 'schema' | 'empty' | 'blocked' | 'noKey';

/** Which quota window a 429 hit: per day (fallback, D-80), per minute (Retry), or not stated. */
export type QuotaScope = 'day' | 'minute' | 'unknown';

/** Every provider failure. `usage` is set when the request reached the model (it still counts). */
export class AiError extends Error {
  readonly kind: AiErrorKind;
  readonly status: number | undefined;
  readonly retryAfterSeconds: number | undefined;
  readonly usage: Usage | undefined;
  readonly quotaScope: QuotaScope | undefined;

  constructor(
    kind: AiErrorKind,
    message: string,
    extra: { status?: number; retryAfterSeconds?: number; usage?: Usage; quotaScope?: QuotaScope } = {},
  ) {
    super(message);
    this.name = 'AiError';
    this.kind = kind;
    this.status = extra.status;
    this.retryAfterSeconds = extra.retryAfterSeconds;
    this.usage = extra.usage;
    this.quotaScope = extra.quotaScope;
  }
}

export const ZERO_USAGE: Usage = { inputTokens: 0, outputTokens: 0, thoughtTokens: 0, totalTokens: 0 };

/** Shared by every adapter: parse the reply text as JSON, then the Zod schema. Never repaired. */
export function parseStructured<T>(schema: ZodType<T>, text: string, usage: Usage): T {
  if (!text.trim()) throw new AiError('empty', 'The model returned no content.', { usage });
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiError('invalidJson', 'The model reply was not valid JSON.', { usage });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue ? `${issue.path.join('.') || '(root)'}: ${issue.message}` : 'invalid';
    throw new AiError('schema', `The model reply did not match the schema (${where}).`, { usage });
  }
  return parsed.data;
}
