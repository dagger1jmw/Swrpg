// Battle selectors (m8-ship-battles, D-517): read-only views for the panel, the narrator's STATE block, the turn and the world.
import type { GameState } from '../../state/gameState';
import type { BattleRecord, BattlesSlice, ShipCondition } from './battles';
import { battleMenu, commanding, fliesInFleet, ownShip, suspended, type Battle, type BattleMenu } from './rules';
import { SERVICE_LADDER_BY_ID } from '../../data/serviceRanks';
import { PLAN_LABEL } from '../../data/ground.config';
import { selectHasFlag } from '../flags/selectors';
import { groundMenu, objectivesHeld, type GroundPlanning, type GroundState } from './ground';
import { selectDeath, selectIsDying, selectIsIncapacitated } from '../health/selectors';
import type { CommanderCondition } from './command';

/** What the wounded-commander rule reads of the player's health (m8-audit A4). */
export const commanderCondition = (s: GameState): CommanderCondition => ({ dying: selectIsDying(s), incapacitated: selectIsIncapacitated(s), dead: selectDeath(s) !== null });
export { drawMap, planProblems, type GroundPlan } from './ground';

const slice = (s: GameState): BattlesSlice | undefined => (s as { battles?: BattlesSlice }).battles;

export const selectActiveBattle = (s: GameState): Battle | null => (slice(s)?.active as Battle | null | undefined) ?? null;
export const selectLastEndedBattle = (s: GameState): Battle | null => (slice(s)?.last as Battle | null | undefined) ?? null;
export const selectBattleStep = (s: GameState): BattlesSlice['step'] => slice(s)?.step ?? null;
export const selectBattleMenu = (s: GameState): BattleMenu | null => {
  const b = selectActiveBattle(s);
  return b && !suspended(b) ? battleMenu(b, commanderCondition(s)) : null;
};
export const selectBattleHistory = (s: GameState): readonly BattleRecord[] => slice(s)?.history ?? [];
/** The ship the player flew last, with the damage it carries. */
export const selectOwnShipCondition = (s: GameState): ShipCondition | null => {
  const sl = slice(s);
  return sl?.lastShipId ? (sl.ships[sl.lastShipId] ?? null) : null;
};
/** The battle waits on a personal boarding fight. */
export const selectBattleWaitsOnFight = (s: GameState): string | null => {
  const b = selectActiveBattle(s);
  return b?.boarding?.stage === 'personal' ? b.boarding.fightId : null;
};

/** The last battle, when it was fought today or yesterday (the world reads only a battle just fought, as with fights). */
export function selectRecentBattle(s: GameState): BattleRecord | null {
  const last = selectBattleHistory(s).at(-1);
  return last && s.clock.now.day - last.day <= 1 ? last : null;
}

/** The narrator's STATE lines: the battle as the engine has it, and crews that remember. */
export function selectBattleLines(s: GameState): string[] {
  const b = selectActiveBattle(s);
  const out: string[] = [...selectGroundLines(s)];
  if (b) {
    const where = b.kind === 'fleet' ? (commanding(b) ? 'the player commands the fleet' : fliesInFleet(b) && !b.out ? 'the player flies in it' : b.out ? 'the player is out of it; it goes on' : `the player serves aboard under ${b.player.commander.name}`) : b.role === 'gunner' ? 'the player is at a turret' : 'the player flies';
    const own = ownShip(b);
    out.push(`SHIP BATTLE (engine-owned: positions, hits, damage and the end come only from the engine's BATTLE lines; never narrate an outcome they do not state): a ${b.kind} at ${b.placeName}, ${b.player.name} against ${b.enemy.name}; ${where}${own ? ` (${own.name})` : ''}.`);
    if (b.boarding) out.push(`Boarding: ${b.boarding.ofSide === 'player' ? 'boarders are on the player\'s ship' : 'a boarding party is on the enemy ship'}${b.boarding.stage === 'personal' ? '; the fight is personal combat now' : '; fighting through the corridors'}.`);
  }
  for (const r of (slice(s)?.reputation ?? []).slice(-3)) out.push(`The crew of ${r.crew} remember that the player character left them to fight on alone; so does anyone who has heard of it.`);
  return out;
}

// ---- ground command (m8-ground, D-522) ----

export const selectGroundPlanning = (s: GameState): GroundPlanning | null => (slice(s)?.planning as GroundPlanning | null | undefined) ?? null;
export const selectGroundBattle = (s: GameState): GroundState | null => (slice(s)?.ground as GroundState | null | undefined) ?? null;
export const selectLastGround = (s: GameState): GroundState | null => (slice(s)?.lastGround as GroundState | null | undefined) ?? null;
/**
 * The wrap-up of a battle that ended on the turn just played (m8-fixes C3): shown once, cleared by the next turn, and never while
 * another battle or a planning scene is on (the side panel shows only the battle that is running).
 */
export function selectEndedBattleToShow(s: GameState): 'ship' | 'ground' | null {
  const sl = slice(s);
  if (!sl?.ended || selectActiveBattle(s) !== null || selectGroundBattle(s) !== null || selectGroundPlanning(s) !== null) return null;
  return sl.ended.turn === s.meta.turn ? sl.ended.kind : null;
}
/** A ship or ground battle is being fought: the battle panel holds the turn's choices. */
export const selectInBattle = (s: GameState): boolean => selectActiveBattle(s) !== null || selectGroundBattle(s) !== null;
/** The ground battle waits on the player's personal fight in their sector. */
export const selectGroundWaitsOnFight = (s: GameState): string | null => {
  const g = selectGroundBattle(s);
  return g?.fight?.fightId && g.fight.fightId !== 'pending' ? g.fight.fightId : null;
};
export const selectGroundMenu = (s: GameState): ReturnType<typeof groundMenu> | null => {
  const g = selectGroundBattle(s);
  return g && !g.end && !selectGroundWaitsOnFight(s) ? groundMenu(g, commanderCondition(s)) : null;
};

/**
 * Who plans a ground battle by rank (Jared; works at every scale, from a squad leader's raid to an army): an army officer of any
 * rung, a naval officer from captain (marines and landing forces), a Jedi Knight or Master (the Order's generals), a Sith Lord,
 * or the fleet command flag. Otherwise only when the story hands command over.
 */
export function playerMayPlanGround(s: GameState): boolean {
  if (selectHasFlag(s, 'fleetCommand')) return true;
  const rank = s.ranks.rank;
  if (s.character.path === 'jedi' && (rank === 'knight' || rank === 'master')) return true;
  if (s.character.path === 'sith' && (rank === 'lord' || rank === 'darth')) return true;
  const svc = s.ranks.service;
  if (!svc) return false;
  const branch = SERVICE_LADDER_BY_ID.get(svc.ladderId)?.branch;
  return branch === 'army' || (branch === 'navy' && svc.rung >= 2);
}
export const selectMayPlanGround = playerMayPlanGround;

/** The narrator's STATE lines for ground command: the planning scene, or the battle as the engine has it. */
export function selectGroundLines(s: GameState): string[] {
  const p = selectGroundPlanning(s);
  const g = selectGroundBattle(s);
  const out: string[] = [];
  if (p && !g) {
    out.push(`GROUND PLANNING (engine-owned): a planning scene for a battle at ${p.site}, ${p.ours.name} against ${p.enemy.name}; ${p.role === 'commander' ? 'the player plans it from the map (objectives, the manoeuvre, sectors, support, a reserve, contingencies); narrate the briefing and the officers, never what the plan holds or the battle' : `${p.ours.commander.name} plans it; the player ${p.role === 'leader' ? 'will lead a sector' : 'will fight in the line'}`}. The battle begins only when the player gives the word.`);
    if (p.scouting.log.length) out.push(`Scouting so far: ${p.scouting.log.slice(-2).join(' ')}`);
  }
  if (g) {
    const where = g.playerSector ? `the player is at the front in ${g.playerSector}` : g.planning.role === 'commander' ? 'the player commands from the post' : 'the player is in the line';
    out.push(`GROUND BATTLE (engine-owned: sectors, losses, routs, deaths and the end come only from the engine's BATTLE lines; never narrate an outcome they do not state): at ${g.planning.site}, ${g.planning.ours.name} (${PLAN_LABEL[g.battle.a.plan]}) against ${g.planning.enemy.name}; phase ${g.battle.phase}; ${where}.`);
    const held = objectivesHeld(g).map((o) => `${o.square} ${o.holder === 'player' ? 'ours' : 'theirs'}${o.primary ? ' (primary)' : ''}`);
    if (held.length) out.push(`Objectives now: ${held.join(', ')}.`);
  }
  return out;
}

export type { Battle, BattleMenu, GroundPlanning, GroundState };
export type { MenuOption } from './rules';
