// The narrative reply's JSON allowance (opt-1 E, D-532; amends D-58's flat 300). The prose keeps its pacing cap; the structure
// (choices, scene, events, keys) gets an allowance sized from what the turn can carry: an opening introduces people, places, facts
// and threads at once; an arrival or a jump brings new places, people and facts; a planning scene its details; a scene-level turn
// more than a moment. An event-rich reply then no longer eats the narration or forces the truncation retry (a second call). Numbers
// invented; reports/opt-1.md E has the modelled evening they come from.
import type { TurnInput } from './record';
import type { TurnDraft } from './resolve';

export const JSON_ALLOWANCE = {
  /** Any moment-level turn (D-58's figure). */
  base: 300,
  /** A scene-level turn: a person met and a fact or two at descriptive length (about 520 tokens in the modelled evening). */
  scene: 500,
  /** The opening: several npcIntroduced and locationIntroduced with descriptions, facts, a thread. */
  opening: 900,
  /** An arrival (travel, or a move to a new place): a place, its people, what is learned there. */
  arrival: 600,
  /** A montage or time skip told at once: facts, thread progress, relationships over the span. */
  jump: 500,
  /** A planning scene can be part of it (groundBattlePlanned's fields, about 300 characters at most). */
  command: 400,
} as const;

/** The JSON allowance for this turn (tokens), added to the pacing cap and the thinking headroom. */
export function jsonAllowance(draft: TurnDraft, input: TurnInput, parts: ReadonlySet<string>): number {
  if (input.kind === 'opening') return JSON_ALLOWANCE.opening;
  if (draft.travel || draft.intent?.actionType === 'travel' || draft.intent?.actionType === 'move') return JSON_ALLOWANCE.arrival;
  if (draft.jump) return JSON_ALLOWANCE.jump;
  if (parts.has('command')) return JSON_ALLOWANCE.command;
  return draft.pacingLevel === 'scene' ? JSON_ALLOWANCE.scene : JSON_ALLOWANCE.base;
}
