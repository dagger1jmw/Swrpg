import { FATE_CHOICE_EXPIRY } from '../../data/combat.config';
import { toAbsSecond } from '../../engine/calendar';
import type { DuelState } from '../../engine/duel';
import type { GameState } from '../../state/gameState';
import type { ActiveFight, CombatSlice, FightSummary, PendingFight } from './combat';

export const selectCombat = (s: GameState): CombatSlice => s.combat;
export const selectActiveFight = (s: GameState): ActiveFight | null => s.combat.active;
export const selectPendingFight = (s: GameState): PendingFight | null => s.combat.pending;
export const selectInCombat = (s: GameState): boolean => s.combat.active !== null;
export const selectDuel = (s: GameState): DuelState | null => (s.combat.active ? (s.combat.active.duel as DuelState) : null);
export const selectLastFight = (s: GameState): FightSummary | null => s.combat.last;
/** A fate choice still open (issue 18): no fight since, the same place, and within FATE_CHOICE_EXPIRY. Older entries without a date expire. */
export const fateIsLive = (s: GameState, f: CombatSlice['fates'][number]): boolean =>
  s.combat.active === null && f.atAbs !== undefined && toAbsSecond(s.clock.now) - f.atAbs <= FATE_CHOICE_EXPIRY.seconds && (f.locationId ?? null) === s.locations.currentId;
export const selectFates = (s: GameState): CombatSlice['fates'] => s.combat.fates.filter((f) => fateIsLive(s, f));
export type { ActiveFight, FightSummary, PendingFight } from './combat';
