import { uniqueAliasMatch } from '../../engine/aliases';
import { ageInYears } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { Npc } from './npcs';

export const selectNpcs = (s: GameState): Npc[] => Object.values(s.npcs.byId);
export const selectNpc = (s: GameState, id: string): Npc | null => s.npcs.byId[id] ?? null;
export const selectNpcAge = (s: GameState, id: string): number | null => {
  const n = s.npcs.byId[id];
  return n && n.birthDay !== null ? ageInYears(n.birthDay, s.clock.now.day) : null;
};
/** An NPC's own ID, or the unique NPC whose name/aliases match exactly (D-13). */
export const resolveNpcRef = (s: GameState, ref: string): string | null => {
  if (ref.startsWith('npc:')) return s.npcs.byId[ref] ? ref : null;
  return uniqueAliasMatch(selectNpcs(s), (n) => [n.name, ...n.aliases], ref)?.id ?? null;
};
