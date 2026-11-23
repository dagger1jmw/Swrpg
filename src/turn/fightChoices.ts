// The choice list and the duel panel agree on whether a fight is in progress (Jared, iPad test, D-181): one source of
// truth, the combat slice. While a fight is active the duel panel holds every choice (the beat buttons and the
// narrator's tactical suggestions); once it is over the choice list holds story choices only. Pure.
import type { Choice } from '../ai/schemas/compose';
import { MINION_KINDS } from '../data/npcGen.config';
import { speciesForceTraits } from '../engine/combatForce';
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

/**
 * Opponents outside the Force (D-192) in the fight that is active or about to start (M5 final check: the opening that
 * started a Vong fight offered "use the Force to push him off balance"; the fight is deferred to the next turn, D-29, so
 * the duel panel's "(immune)" buttons were not there yet). Their names, from the active duel, or from the pending fight's
 * named opponents (species) and minion groups (a Yuuzhan Vong kind).
 */
export function outsideForceOpponents(s: GameState): string[] {
  const active = s.combat.active?.duel as { opponents?: readonly { name: string; out?: boolean; forceTraits?: readonly string[] }[] } | undefined;
  if (active?.opponents) return active.opponents.filter((o) => !o.out && o.forceTraits?.includes('forceInvisible')).map((o) => o.name);
  const p = s.combat.pending;
  if (!p) return [];
  const named = p.opponentRefs.map((ref) => selectNpc(s, ref)).filter((n) => n && speciesForceTraits(n.speciesId).includes('forceInvisible')).map((n) => n!.name);
  const groups = p.minionGroups.filter((g) => MINION_KINDS.find((k) => k.id === g.kind)?.archetype === 'yuuzhanVongWarrior').map((g) => MINION_KINDS.find((k) => k.id === g.kind)!.label);
  return [...named, ...groups];
}

/**
 * A choice that uses the Force on an opponent: push, choke, a mind trick (not a jump, a thrown object, a saber throw, or
 * lightning and its variants such as Electric Judgment, which reach a foe outside the Force: D-447).
 */
const FORCE_ON_TARGET = /\bmind[- ]?trick\b|\bforce[- ]?(?:push|choke|grip|blast|wave|shove)\b|\b(?:use|using|uses|with|through|call on|reach (?:out )?(?:with|into)) the force\b[^.]{0,40}\b(?:push|shove|choke|grip|blast|hurl (?:him|her|it|them)|throw (?:him|her|it|them)|knock|off (?:his|her|its|their) (?:balance|feet)|send (?:him|her|it|them))\b|\b(?:push|shove|choke|blast|hurl|throw|knock) (?:him|her|it|them|the \w+)\b[^.]{0,30}\b(?:with|through|using) the force\b/i;
const FORCE_ON_TARGET_ABILITIES = new Set(['forcePush', 'forceChoke', 'mindTrick', 'forceGrip']);

/**
 * The choices with every Force action against an opponent outside the Force dropped (from the first turn of the fight,
 * pending or active). A list left empty gets one plain move to meet the attack.
 */
export function withoutForceOnImmune(s: GameState, choices: readonly Choice[]): { choices: Choice[]; dropped: number } {
  if (!outsideForceOpponents(s).length) return { choices: [...choices], dropped: 0 };
  const kept = choices.filter((c) => !FORCE_ON_TARGET.test(c.label) && !FORCE_ON_TARGET_ABILITIES.has((c.intent as { forceAbility?: string }).forceAbility ?? ''));
  const dropped = choices.length - kept.length;
  if (!kept.length && choices.length) kept.push({ label: 'Meet the attack with your weapon', intent: { actionType: 'fight' } } as Choice);
  return { choices: kept, dropped };
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

/**
 * The AI calls (intent and narration) the turns of a fight made so far (dev mode, iPad check), counted as the usage
 * meter counts them (D-226, D-242): answered replies and 429s; a 5xx, a timeout or a network error is not a call.
 */
export function fightCalls(history: readonly { calls?: readonly unknown[]; draft: { combat?: CombatDraft | null } }[], fightId: string): number {
  const counts = (c: unknown): boolean => {
    const o = (c as { outcome?: string }).outcome ?? 'ok';
    return !['http', 'timeout', 'network', 'noKey'].includes(o);
  };
  return history.reduce((n, r) => n + (r.draft.combat?.fightId === fightId ? (r.calls ?? []).filter(counts).length : 0), 0);
}
