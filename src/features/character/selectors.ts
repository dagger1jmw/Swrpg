import { ageInYears } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';

export const selectCharacterName = (s: GameState): string => s.character.name;
export const selectBirthDay = (s: GameState): number => s.character.birthDay;
/** Age is derived, never stored. */
export const selectAge = (s: GameState): number => ageInYears(s.character.birthDay, s.clock.now.day);

/** The ref the AI uses for the player character (resolved by the character feature). */
export const PC_REF = 'pc';
