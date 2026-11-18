// The pending dev scenario (D-180): read from the transcript, so it survives a reload and needs no state. Pure.
import type { TurnRecord } from './record';

/** The pending /scenario for the next narration: the latest one since the last narrated turn (D-180), or null. */
export function pendingScenario(history: readonly TurnRecord[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const r = history[i]!;
    if (r.input.kind === 'dev') {
      const m = /^\/scenario\s+([\s\S]+)$/i.exec(r.input.text.trim());
      if (m) return m[1]!.trim();
      continue;
    }
    if ((r.calls ?? []).some((c) => c.callType === 'narrative')) return null;
  }
  return null;
}
