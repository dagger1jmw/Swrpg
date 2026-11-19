// The choice list and the duel panel agree on whether a fight is in progress (Jared, iPad test, D-181): one source of
// truth, the combat slice. While a fight is active the duel panel holds every choice (the beat buttons and the
// narrator's tactical suggestions); once it is over the choice list holds story choices only. Pure.
import type { Choice } from '../ai/schemas/compose';
import { selectNpc } from '../features/npcs/selectors';
import type { GameState } from '../state/gameState';
import type { CombatDraft } from './combatTurn';

/** Code choices that fill the list when a fight ended and the narrator wrote tactical moves only. */
export const AFTER_FIGHT_CHOICES: readonly Choice[] = [
  { label: 'Catch your breath', intent: { actionType: 'rest' } },
  { label: 'Take stock of what just happened', intent: { actionType: 'other' } },
];

/** A tactical move with no fight to make it in: a fight intent aimed at no one the story knows. */
const isTacticalMove = (s: GameState, c: Choice): boolean => c.intent.actionType === 'fight' && !(c.intent.targetRef && selectNpc(s, c.intent.targetRef)?.status === 'active');

/**
 * The choices to store for a turn. While a fight is active they are kept as written (the duel panel shows them as
 * tactical suggestions). When a fight turn leaves no fight active, tactical moves are dropped and code choices fill
 * the list to two, so a finished fight never offers "press the attack".
 */
export function choicesAfterTurn(after: GameState, foughtThisTurn: boolean, choices: readonly Choice[]): { choices: Choice[]; dropped: number } {
  if (after.combat.active || !foughtThisTurn) return { choices: [...choices], dropped: 0 };
  const kept = choices.filter((c) => !isTacticalMove(after, c));
  const out = [...kept];
  for (const c of AFTER_FIGHT_CHOICES) if (out.length < 2 && !out.some((x) => x.label === c.label)) out.push(c);
  return { choices: out, dropped: choices.length - kept.length };
}

/** What the main view shows (D-181), from the combat slice and the last turn: the panel and the list never disagree. */
export interface FightView {
  /** A fight is in progress: the duel panel is open with its beat buttons. */
  inFight: boolean;
  /** The story choice list (empty while a fight is in progress). */
  storyChoices: Choice[];
  /** The narrator's tactical suggestions, shown inside the duel panel (empty outside a fight). */
  suggestions: Choice[];
  /** The fight that ended on the last turn, whose result summary is open until closed. */
  summary: CombatDraft | null;
}

export function fightView(s: GameState, last: { choices: readonly Choice[]; draft: { combat?: CombatDraft | null } } | null, closedFight: string | null): FightView {
  const inFight = s.combat.active !== null;
  const choices = last ? [...last.choices] : [];
  const ended = last?.draft.combat?.ended ? last.draft.combat : null;
  return {
    inFight,
    storyChoices: inFight ? [] : choices,
    suggestions: inFight ? choices : [],
    summary: !inFight && ended && ended.fightId !== closedFight ? ended : null,
  };
}

/** The AI calls (intent and narration) the turns of a fight made so far (dev mode, iPad check). */
export function fightCalls(history: readonly { calls?: readonly unknown[]; draft: { combat?: CombatDraft | null } }[], fightId: string): number {
  return history.reduce((n, r) => n + (r.draft.combat?.fightId === fightId ? (r.calls?.length ?? 0) : 0), 0);
}
