// Dev only (D-250; combat pass 4 could not reach the overload path on demand): "/simulate 503 <n>" makes the next n
// model requests fail as HTTP 503, before any network call, so the retries (D-240), the busy note, the move to the
// next model and the unchanged dice can be seen in the browser. The count lives in memory only, never in a save.
import { AiError, type ModelProvider } from './provider';

export interface SimulatedOverload extends ModelProvider {
  /** The next `n` requests return 503 (replaces any count still pending). */
  arm(n: number): void;
  /** Requests still to fail. */
  readonly pending: number;
}

export function withSimulatedOverload(inner: ModelProvider): SimulatedOverload {
  let left = 0;
  return {
    arm(n: number) {
      left = Math.max(0, Math.floor(n));
    },
    get pending() {
      return left;
    },
    async generateStructured(schema, messages, opts) {
      if (left > 0) {
        left--;
        throw new AiError('http', 'Gemini error 503: This model is currently experiencing high demand. (simulated by /simulate 503)', { status: 503 });
      }
      return inner.generateStructured(schema, messages, opts);
    },
  };
}
