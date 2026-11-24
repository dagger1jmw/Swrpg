// Escaping (Jared, 2026-11-24; D-471): a prisoner's attempt, the player's choice, against the captors' security. The engine
// rolls it and ends the captivity or not; the narrator tells it.
import type { Choice } from '../ai/schemas/compose';
import type { Intent } from '../ai/schemas/intent';
import { checkRating, type CheckCard } from '../engine/rolls';
import type { RngState } from '../engine/rng';
import { efficiency } from '../engine/fatigue';
import { selectFatigue, selectIsSpent, selectLastingPenalty, selectWoundPenalty } from '../features/health/selectors';
import { selectPerformance, selectRust } from '../features/progression/selectors';
import { selectCaptivity, selectEscape } from '../features/world/selectors';
import type { GameEvent } from '../state/types';
import type { GameState } from '../state/gameState';

export interface EscapeTurn {
  card: CheckCard;
  rng: RngState;
  events: readonly GameEvent[];
}

/** One attempt, or why there is none; null when the intent is not one. */
export function tryEscape(state: GameState, intent: Intent): EscapeTurn | { refused: string } | null {
  if (intent.escape !== true) return null;
  if (!selectCaptivity(state)) return { refused: 'the character is not a prisoner' };
  const e = selectEscape(state, intent.skillId);
  if (!e) return { refused: 'the captors are too watchful for another attempt yet' };
  const [card, rng] = checkRating(state.meta.rngState, {
    label: 'Escape',
    skillId: e.skillId,
    levelInputs: {
      level: selectPerformance(state, e.skillId),
      woundPenalty: 1 - (1 - selectWoundPenalty(state, e.skillId)) * (1 - selectLastingPenalty(state, e.skillId)),
      rust: selectRust(state, e.skillId),
      vitalitySpent: selectIsSpent(state),
      fatigueEfficiency: efficiency(selectFatigue(state).p),
    },
    modifiers: [],
    rating: e.rating,
  });
  return { card, rng, events: [{ type: 'captivityEscapeTried', success: card.success, margin: card.margin }] };
}

/** The choice a prisoner always has, when an attempt is possible. */
export function escapeChoices(state: GameState): Choice[] {
  return selectEscape(state) ? [{ label: 'Attempt to escape', intent: { actionType: 'other', escape: true } }] : [];
}
