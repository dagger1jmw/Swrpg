import type { DuelState } from '../../engine/duel';
import type { GameState } from '../../state/gameState';
import type { ActiveFight, CombatSlice, FightSummary, PendingFight } from './combat';

export const selectCombat = (s: GameState): CombatSlice => s.combat;
export const selectActiveFight = (s: GameState): ActiveFight | null => s.combat.active;
export const selectPendingFight = (s: GameState): PendingFight | null => s.combat.pending;
export const selectInCombat = (s: GameState): boolean => s.combat.active !== null;
export const selectDuel = (s: GameState): DuelState | null => (s.combat.active ? (s.combat.active.duel as DuelState) : null);
export const selectLastFight = (s: GameState): FightSummary | null => s.combat.last;
export const selectFates = (s: GameState): CombatSlice['fates'] => s.combat.fates;
export type { ActiveFight, FightSummary, PendingFight } from './combat';
