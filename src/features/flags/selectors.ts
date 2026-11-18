import type { GameState } from '../../state/gameState';

export const selectFlags = (s: GameState): readonly string[] => s.flags.set;
export const selectHasFlag = (s: GameState, flag: string): boolean => s.flags.set.includes(flag);
