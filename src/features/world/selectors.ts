import type { GameState } from '../../state/gameState';
import type { WorldEvent } from './world';

export const selectWorldLog = (s: GameState): readonly WorldEvent[] => s.world.log;
/** World events the story has not told yet (they go into the next narration). */
export const selectUntoldWorldEvents = (s: GameState): WorldEvent[] => s.world.log.filter((e) => e.narratedTurn === null);
