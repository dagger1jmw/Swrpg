// The big moments (opt-1 D, D-531): the turns the code, not the narrator, picks for the stronger model when Flash routing is on. One
// call per turn still; the router decides which model that call uses and falls back when the stronger model's day is spent. The list
// is a design reading (invented): the moments a player remembers, and few enough a day for Flash's free allowance (about 20).
import { selectUntoldWorldEvents } from '../features/world/selectors';
import type { GameState } from '../state/gameState';
import type { TurnInput } from './record';
import type { TurnDraft } from './resolve';

/** Why this turn is a big moment, or null for an ordinary turn. */
export function premiumReason(state: GameState, draft: TurnDraft, input: TurnInput): string | null {
  if (input.kind === 'opening') return 'the campaign opening';
  // A fight that ended this turn (not a sparring bout), and a ship or ground battle's wrap-up.
  if (draft.combat?.ended && !draft.combat.session) return "a fight's end";
  if (draft.battle?.wrap) return "a battle's end";
  // A time skip's narration: months or years told at once.
  if (draft.pacingLevel === 'timeSkip') return 'a time skip';
  // A world event the engine marked significant, told this turn.
  if (selectUntoldWorldEvents(state).some((e) => e.significant)) return 'a major world event';
  return null;
}

/** The chapter summary call always counts as a big moment (it writes the campaign's memory). */
export const SUMMARY_PREMIUM = 'a chapter summary';
