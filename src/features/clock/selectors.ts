import { toAbsSecond, type Instant } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { LastAdvance } from './clock';

export const selectNow = (s: GameState): Instant => s.clock.now;
export const selectNowAbsSecond = (s: GameState): number => toAbsSecond(s.clock.now);
export const selectLastAdvance = (s: GameState): LastAdvance | null => s.clock.lastAdvance;

/**
 * The turn being played: meta.turn counts committed turns, so events applied while a turn is
 * being narrated belong to turn meta.turn + 1 (the number it commits as).
 */
export const selectTurnInPlay = (s: GameState): number => s.meta.turn + 1;
