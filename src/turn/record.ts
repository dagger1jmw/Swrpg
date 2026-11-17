// The transcript entry payload for one committed turn (architecture §2 "Transcript").
import type { Choice } from '../ai/schemas/compose';
import type { CallType, Usage } from '../ai/provider';
import type { AppliedEvent, RejectedEvent } from '../state/applyEvents';
import type { TurnDraft } from './resolve';

export type TurnInput =
  | { kind: 'typed'; text: string }
  | { kind: 'choice'; choice: Choice }
  | { kind: 'opening'; premise: string };

export interface CallRecord {
  callType: CallType;
  model: string;
  usage: Usage | null;
  outcome: 'ok' | string;
}

export interface TurnRecord {
  input: TurnInput;
  draft: Omit<TurnDraft, 'rngAfter' | 'applied' | 'rejected'> & { applied: AppliedEvent[]; rejected: RejectedEvent[] };
  narrative: string;
  choices: Choice[];
  moodTags: string[];
  applied: AppliedEvent[];
  rejected: RejectedEvent[];
  calls: CallRecord[];
  /** In-game time after the turn, for the feed. */
  clockAfter: { day: number; second: number };
}

/** What the player did, as one line for history and display. */
export function describeInput(input: TurnInput): string {
  if (input.kind === 'typed') return input.text;
  if (input.kind === 'choice') return input.choice.label;
  return input.premise ? `(Opening) ${input.premise}` : '(Opening)';
}
