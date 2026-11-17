import type { PacingLevel } from '../../data/pacing.config';
import type { GameState } from '../../state/gameState';

export const selectPacingLevel = (s: GameState): PacingLevel => s.pacing.level;
export const selectMoodTags = (s: GameState): readonly string[] => s.pacing.scene.moodTags;
