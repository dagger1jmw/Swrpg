// Per-turn event caps (D-36, config `eventCaps`). Duplicates of the same type and target in one
// reply are merged first (the first is kept, deltas are not summed); events past a cap are
// rejected and logged.

export interface EventCap {
  /** At most this many of the type per reply. */
  perTurn?: number;
  /** At most this many of the type per target per reply (the event's targetField). */
  perTarget?: number;
}

export const EVENT_CAPS: Readonly<Record<string, EventCap>> = {
  moralChoice: { perTurn: 1 },
  emotionalEvent: { perTurn: 1 },
  relationshipChanged: { perTarget: 1 },
  factLearned: { perTurn: 5 },
};

/** Emitted events may chain at most this deep; deeper is a bug and throws (architecture §11). */
export const MAX_EMIT_DEPTH = 4;

/**
 * Same-turn temp key format (D-32): "tmp:" plus up to 24 letters, digits, _ or -. Widened from
 * digits only (D-91): live, the model wrote tmp:loc1 and tmp:thread1, and every place was lost.
 */
export const TEMP_KEY_PATTERN = /^tmp:[A-Za-z0-9_-]{1,24}$/;
