// Typed shortcuts (opt-1 C5, D-530): a few typed phrases that a choice would cover are read by the code, so the turn makes no intent
// call. The list is small on purpose: whole phrases only (case, spaces and end punctuation aside), and never during a fight, a ship
// or ground battle, a hold or a pending fight, where "wait" or "continue" mean something the intent call reads from the scene.
// Anything else, or anything unsure, still goes through the intent call. The phrases are a design reading (invented).
import { intentSchema, type Intent } from '../ai/schemas/intent';
import type { GameState } from '../state/gameState';

/** Phrase -> action type. "rest" is resting or waiting (intent.md); "other" is looking around or simply going on. */
export const TYPED_SHORTCUTS: Readonly<Record<string, 'rest' | 'other'>> = {
  wait: 'rest',
  'i wait': 'rest',
  'wait a moment': 'rest',
  'i wait a moment': 'rest',
  'keep waiting': 'rest',
  'i keep waiting': 'rest',
  rest: 'rest',
  'i rest': 'rest',
  'take a rest': 'rest',
  'i take a rest': 'rest',
  continue: 'other',
  'go on': 'other',
  'look around': 'other',
  'i look around': 'other',
};

const normalize = (text: string): string => text.toLowerCase().replace(/[.!…]+$/u, '').replace(/\s+/g, ' ').trim();

/** No shortcut while anything the words could act on is under way: a fight (or one pending), a battle or its planning, a hold. */
function busy(s: GameState): boolean {
  const b = s.battles as { active?: unknown; ground?: unknown; planning?: unknown } | undefined;
  const c = s.combat as { hold?: unknown; pursuits?: readonly unknown[] };
  return s.combat.active !== null || s.combat.pending !== null || c.hold != null || (c.pursuits?.length ?? 0) > 0 || !!b?.active || !!b?.ground || !!b?.planning;
}

/** The intent for a typed shortcut, or null when the words are not one (or the scene is busy): then the intent call runs. */
export function typedShortcut(state: GameState, text: string): Intent | null {
  const action = TYPED_SHORTCUTS[normalize(text)];
  if (!action || busy(state)) return null;
  return intentSchema.parse({ actionType: action, targets: [], references: [], unknownNames: [] });
}
