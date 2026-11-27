import { FATE_CHOICE_EXPIRY } from '../../data/combat.config';
import { toAbsSecond } from '../../engine/calendar';
import { planReady } from '../../engine/who';
import { crewFromLevels, type Crew } from '../../engine/ships';
import { selectNpcLevels } from '../npcs/selectors';
import { selectLevelExact, selectPerformance } from '../progression/selectors';
import type { GameState } from '../../state/gameState';
import type { ActiveFight, CombatSlice, FightSummary } from './combat';
import { buildPlayerFighter } from './build';

export const selectCombat = (s: GameState): CombatSlice => s.combat;
export const selectActiveFight = (s: GameState): ActiveFight | null => s.combat.active;
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
/**
 * The player as a ship's crew for the combat-scales rolls (m8-skills, D-513): Piloting, Gunnery for their shots and Repair,
 * at their performance levels. The dogfight and fleet callers use it in place of the Piloting and Blaster stand-ins.
 */
export const selectShipCrew = (s: GameState): Crew => crewFromLevels({ piloting: selectPerformance(s, 'piloting'), gunnery: selectPerformance(s, 'gunnery'), repair: selectPerformance(s, 'repair'), forceSense: selectLevelExact(s, 'forceSense') });
/** An NPC as a ship's crew, or as a turret gunner (Gunnery, never Blaster; D-513). */
export const selectNpcShipCrew = (s: GameState, id: string): Crew => crewFromLevels(selectNpcLevels(s, id));
