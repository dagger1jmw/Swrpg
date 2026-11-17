import { toAbsSecond, type Instant } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { LastAdvance } from './clock';

export const selectNow = (s: GameState): Instant => s.clock.now;
export const selectNowAbsSecond = (s: GameState): number => toAbsSecond(s.clock.now);
export const selectLastAdvance = (s: GameState): LastAdvance | null => s.clock.lastAdvance;
