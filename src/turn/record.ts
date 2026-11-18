// The transcript entry payload for one committed turn (architecture §2 "Transcript").
import type { Choice } from '../ai/schemas/compose';
import type { Intent } from '../ai/schemas/intent';
import type { CallType, Usage } from '../ai/provider';
import type { AppliedEvent, RejectedEvent } from '../state/applyEvents';
import type { ContextReport } from './context';
import type { TrainingOutcome, TurnDraft } from './resolve';

export type TurnInput =
  | { kind: 'typed'; text: string }
  | { kind: 'choice'; choice: Choice }
  | { kind: 'opening'; premise: string }
  /** A full intent built by the UI (the sheet's Train button); skips the intent call like a choice (M3). */
  | { kind: 'action'; intent: Intent; label: string }
  /** A combat beat button (M5, D-145): a combat action; skips the intent call; quiet beats make no call at all. */
  | { kind: 'beat'; action: CombatActionInput; label: string };

/** The combat action a beat button sends (the combat feature's combatAction event, without its type). */
export interface CombatActionInput {
  action: 'stance' | 'tactic' | 'maneuver' | 'formChange' | 'force' | 'target' | 'shatterpoint' | 'sequence' | 'fightOn' | 'narrate' | 'resolve' | 'continue' | 'fate' | 'review';
  stance?: string;
  tactic?: string;
  maneuver?: string;
  form?: string;
  force?: { kind: string; effort?: string; objectTag?: string };
  targetRef?: string;
  steps?: unknown[];
  /** fate: an incapacitated NPC's fate (spare, capture, kill). */
  npcRef?: string;
  fate?: string;
  /** review: the skill whose recording is reviewed. */
  skillId?: string;
}

export interface CallRecord {
  callType: CallType;
  model: string;
  usage: Usage | null;
  outcome: 'ok' | string;
}

export interface TurnRecord {
  /** The committed turn number (M2; older records have none). */
  turn?: number;
  input: TurnInput;
  /** `training` is absent on records from before M3, `jump` before M4, `combat` before M5. */
  draft: Omit<TurnDraft, 'rngAfter' | 'applied' | 'rejected' | 'training' | 'jump' | 'combat'> & {
    applied: AppliedEvent[];
    rejected: RejectedEvent[];
    training?: TrainingOutcome | null;
    jump?: TurnDraft['jump'];
    combat?: TurnDraft['combat'];
  };
  narrative: string;
  choices: Choice[];
  moodTags: string[];
  applied: AppliedEvent[];
  rejected: RejectedEvent[];
  calls: CallRecord[];
  /** In-game time after the turn, for the feed. */
  clockAfter: { day: number; second: number };
  /** What was sent and its token counts, per call (debug view; M2). */
  context?: { intent?: ContextReport; narrative?: ContextReport };
  /** Set when this turn closed a chapter (M2). */
  chapterClosed?: { chapterId: string; reason: string; turnRange: [number, number] };
}

/** What the player did, as one line for history and display. */
export function describeInput(input: TurnInput): string {
  if (input.kind === 'typed') return input.text;
  if (input.kind === 'choice') return input.choice.label;
  if (input.kind === 'action') return input.label;
  if (input.kind === 'beat') return input.label;
  return input.premise ? `(Opening) ${input.premise}` : '(Opening)';
}
