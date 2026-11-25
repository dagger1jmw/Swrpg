import { FATE_CHOICE_EXPIRY } from '../../data/combat.config';
import { toAbsSecond } from '../../engine/calendar';
import type { DuelState } from '../../engine/duel';
import { planReady } from '../../engine/who';
import type { GameState } from '../../state/gameState';
import type { ActiveFight, CombatSlice, FightSummary, PendingFight } from './combat';
import { buildPlayerFighter } from './build';

export const selectCombat = (s: GameState): CombatSlice => s.combat;
export const selectActiveFight = (s: GameState): ActiveFight | null => s.combat.active;
export const selectPendingFight = (s: GameState): PendingFight | null => s.combat.pending;
export const selectInCombat = (s: GameState): boolean => s.combat.active !== null;
export const selectDuel = (s: GameState): DuelState | null => (s.combat.active ? (s.combat.active.duel as DuelState) : null);
export const selectLastFight = (s: GameState): FightSummary | null => s.combat.last;
/** A fate choice still open (issue 18): no fight since, the same place, and within FATE_CHOICE_EXPIRY. Older entries without a date expire. */
export const fateIsLive = (s: GameState, f: CombatSlice['fates'][number]): boolean =>
  s.combat.active === null && f.atAbs !== undefined && toAbsSecond(s.clock.now) - f.atAbs <= FATE_CHOICE_EXPIRY.seconds && (f.locationId ?? null) === s.locations.currentId;
/** Whether this line of a plan was already tried today (D-493). */
export const selectPlanTriedToday = (s: GameState, npcId: string, kind: string): boolean => (s.combat.plans ?? []).some((p) => p.npcId === npcId && p.kind === kind && p.day === s.clock.now.day);
/** Whether the player's plan against this figure holds here and now (D-493). */
export const selectPlanReady = (s: GameState, npcId: string): boolean => planReady((s.combat.plans ?? []).map((p) => ({ ...p, here: p.locationId === s.locations.currentId })), npcId, s.clock.now.day);
export const selectFates = (s: GameState): CombatSlice['fates'] => s.combat.fates.filter((f) => fateIsLive(s, f));
export { npcPursuer, resolveHoldTurn, selectConcealment, selectHoldSetting, selectNpcTier, type HoldTurn } from './holds';
export type { ActiveFight, FightSummary, PendingFight } from './combat';
/** The level the player fights at with their loadout's skill (a form, the blaster, melee or Agility). */
export const selectPlayerFightingLevel = (s: GameState): number => buildPlayerFighter(s).level;
