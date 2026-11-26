// Battle selectors (m8-ship-battles, D-517): read-only views for the panel, the narrator's STATE block, the turn and the world.
import type { GameState } from '../../state/gameState';
import type { BattleRecord, BattlesSlice, ShipCondition } from './battles';
import { battleMenu, commanding, fliesInFleet, ownShip, suspended, type Battle, type BattleMenu } from './rules';

const slice = (s: GameState): BattlesSlice | undefined => (s as { battles?: BattlesSlice }).battles;

export const selectActiveBattle = (s: GameState): Battle | null => (slice(s)?.active as Battle | null | undefined) ?? null;
export const selectLastEndedBattle = (s: GameState): Battle | null => (slice(s)?.last as Battle | null | undefined) ?? null;
export const selectBattleStep = (s: GameState): BattlesSlice['step'] => slice(s)?.step ?? null;
export const selectBattleMenu = (s: GameState): BattleMenu | null => {
  const b = selectActiveBattle(s);
  return b && !suspended(b) ? battleMenu(b) : null;
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
  const out: string[] = [];
  if (b) {
    const where = b.kind === 'fleet' ? (commanding(b) ? 'the player commands the fleet' : fliesInFleet(b) && !b.out ? 'the player flies in it' : b.out ? 'the player is out of it; it goes on' : `the player serves aboard under ${b.player.commander.name}`) : b.role === 'gunner' ? 'the player is at a turret' : 'the player flies';
    const own = ownShip(b);
    out.push(`SHIP BATTLE (engine-owned: positions, hits, damage and the end come only from the engine's BATTLE lines; never narrate an outcome they do not state): a ${b.kind} at ${b.placeName}, ${b.player.name} against ${b.enemy.name}; ${where}${own ? ` (${own.name})` : ''}.`);
    if (b.boarding) out.push(`Boarding: ${b.boarding.ofSide === 'player' ? 'boarders are on the player\'s ship' : 'a boarding party is on the enemy ship'}${b.boarding.stage === 'personal' ? '; the fight is personal combat now' : '; fighting through the corridors'}.`);
  }
  for (const r of (slice(s)?.reputation ?? []).slice(-3)) out.push(`The crew of ${r.crew} remember that the player character left them to fight on alone; so does anyone who has heard of it.`);
  return out;
}

export type { Battle, BattleMenu };
export type { MenuOption } from './rules';
