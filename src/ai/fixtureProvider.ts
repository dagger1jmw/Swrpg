// Fixture provider (architecture §6, §14): replays recorded responses in order and records every
// call, so pipeline tests can count calls and check what was sent.
import type { ZodType } from 'zod';
import {
  AiError,
  parseStructured,
  type AiErrorKind,
  type CallOptions,
  type Message,
  type ModelProvider,
  type StructuredResult,
  type Usage,
} from './provider';

export type FixtureStep =
  | { callType?: CallOptions['callType']; data: unknown; usage?: Partial<Usage> }
  | { callType?: CallOptions['callType']; rawText: string; usage?: Partial<Usage> }
  | { callType?: CallOptions['callType']; error: { kind: AiErrorKind; message?: string; status?: number; retryAfterSeconds?: number }; usage?: Partial<Usage> };

export interface RecordedCall {
  opts: CallOptions;
  messages: Message[];
}

export interface FixtureProvider extends ModelProvider {
  calls: RecordedCall[];
  remaining(): number;
}

const usageOf = (u: Partial<Usage> | undefined): Usage => {
  const inputTokens = u?.inputTokens ?? 100;
  const outputTokens = u?.outputTokens ?? 50;
  const thoughtTokens = u?.thoughtTokens ?? 0;
  return { inputTokens, outputTokens, thoughtTokens, totalTokens: u?.totalTokens ?? inputTokens + outputTokens + thoughtTokens };
};

export function createFixtureProvider(steps: readonly FixtureStep[]): FixtureProvider {
  const queue = [...steps];
  const calls: RecordedCall[] = [];
  return {
    calls,
    remaining: () => queue.length,
    async generateStructured<T>(schema: ZodType<T>, messages: readonly Message[], opts: CallOptions): Promise<StructuredResult<T>> {
      calls.push({ opts, messages: [...messages] });
      const step = queue.shift();
      if (!step) throw new Error(`Fixture provider: no response left for a ${opts.callType} call`);
      if (step.callType && step.callType !== opts.callType) {
        throw new Error(`Fixture provider: expected a ${step.callType} call, got ${opts.callType}`);
      }
      const usage = usageOf(step.usage);
      if ('error' in step) {
        const { kind, message, status, retryAfterSeconds } = step.error;
        const reached = kind === 'truncated' || kind === 'invalidJson' || kind === 'schema';
        throw new AiError(kind, message ?? kind, {
          ...(status !== undefined ? { status } : {}),
          ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
          ...(reached ? { usage } : {}),
        });
      }
      const text = 'rawText' in step ? step.rawText : JSON.stringify(step.data);
      return { data: parseStructured(schema, text, usage), usage, finishReason: 'stop', model: opts.model };
    },
  };
}
