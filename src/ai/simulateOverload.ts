// Dev only (D-250; combat pass 4 could not reach the overload path on demand): "/simulate 503 <n>" makes the next n
// model requests fail as HTTP 503, before any network call, so the retries (D-240), the busy note, the move to the
// next model and the unchanged dice can be seen in the browser. "/simulate slow <n>" (m9-tune C) makes the next n requests
// stall with no reply until their own time limit (the slow-call cap's 25 s on the stronger model, else REQUEST_TIMEOUT_MS), then
// time out, so the cap, the fall back to the main model and the seconds counter can be seen. The counts live in memory only,
// never in a save.
import { REQUEST_TIMEOUT_MS } from './models.config';
import { AiError, type ModelProvider } from './provider';

export interface SimulatedOverload extends ModelProvider {
  /** The next `n` requests return 503 (replaces any count still pending). */
  arm(n: number): void;
  /** The next `n` requests get no reply until their time limit (replaces any count still pending). */
  armSlow(n: number): void;
  /** Requests still to fail. */
  readonly pending: number;
  readonly pendingSlow: number;
}

export function withSimulatedOverload(inner: ModelProvider, sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))): SimulatedOverload {
  let left = 0;
  let slow = 0;
  return {
    arm(n: number) {
      left = Math.max(0, Math.floor(n));
    },
    armSlow(n: number) {
      slow = Math.max(0, Math.floor(n));
    },
    get pending() {
      return left;
    },
    get pendingSlow() {
      return slow;
    },
    async generateStructured(schema, messages, opts) {
      if (left > 0) {
        left--;
        throw new AiError('http', 'Gemini error 503: This model is currently experiencing high demand. (simulated by /simulate 503)', { status: 503 });
      }
      if (slow > 0) {
        slow--;
        const limit = opts.timeoutMs ?? REQUEST_TIMEOUT_MS;
        await sleep(limit);
        throw new AiError('timeout', `No reply from ${opts.model} within ${Math.round(limit / 1000)} s. (simulated by /simulate slow)`);
      }
      return inner.generateStructured(schema, messages, opts);
    },
  };
}
