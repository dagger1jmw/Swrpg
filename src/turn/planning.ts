// Planning against a top duelist (Jared, 2026-11-25; D-493): a bounty hunter's or a Mandalorian's ambush, trap or prepared
// ground, each laid by a check the engine rolls and recorded as a line of its own. The narrator records none of it.
import type { Intent } from '../ai/schemas/intent';
import { PLAN, type PlanKind } from '../data/duelists';
import { efficiency } from '../engine/fatigue';
import { checkRating, type CheckCard } from '../engine/rolls';
import type { RngState } from '../engine/rng';
import { selectPlanTriedToday } from '../features/combat/selectors';
import { selectFatigue, selectIsSpent, selectLastingPenalty, selectWoundPenalty } from '../features/health/selectors';
import { selectNpc } from '../features/npcs/selectors';
import { selectPerformance, selectRust } from '../features/progression/selectors';
import { selectCanPlan, selectDuelistBar } from '../features/world/selectors';
import type { GameEvent } from '../state/types';
import type { GameState } from '../state/gameState';

export interface PlanTurn {
  card: CheckCard;
  rng: RngState;
  events: readonly GameEvent[];
}

/** One line of a plan, or why there is none; null when the intent is not one. */
export function tryPlan(state: GameState, intent: Intent): PlanTurn | { refused: string } | null {
  const plan = intent.plan;
  if (!plan) return null;
  const foe = selectNpc(state, plan.foeRef);
  if (!foe) return { refused: 'nobody known to plan against' };
  if (selectDuelistBar(state, foe.canonId) !== 'top') return { refused: `no plan is needed to face ${foe.name}` };
  if (!selectCanPlan(state)) return { refused: 'only the most skilled bounty hunters and Mandalorians can plan for such a foe' };
  if (selectPlanTriedToday(state, foe.id, plan.kind)) return { refused: 'already tried today' };
  const skills = PLAN.skills[plan.kind];
  const skillId = [...skills].sort((a, b) => selectPerformance(state, b) - selectPerformance(state, a))[0]!;
  const [card, rng] = checkRating(state.meta.rngState, {
    label: PLAN.labels[plan.kind],
    skillId,
    levelInputs: {
      level: selectPerformance(state, skillId),
      woundPenalty: 1 - (1 - selectWoundPenalty(state, skillId)) * (1 - selectLastingPenalty(state, skillId)),
      rust: selectRust(state, skillId),
      vitalitySpent: selectIsSpent(state),
      fatigueEfficiency: efficiency(selectFatigue(state).p),
    },
    modifiers: [],
    rating: PLAN.rating,
  });
  return { card, rng, events: [{ type: 'planTried', npcRef: foe.id, kind: plan.kind satisfies PlanKind, success: card.success, total: card.total }] };
}
