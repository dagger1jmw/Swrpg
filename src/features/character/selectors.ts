import { DAYS_PER_YEAR, ageInYears } from '../../engine/calendar';
import { speciesDef } from '../../data/species';
import { humanEquivalentAge } from '../../engine/species';
import type { Talents } from '../../engine/speed';
import type { GameState } from '../../state/gameState';
import type { CharacterSlice } from './character';

export const selectCharacterName = (s: GameState): string => s.character.name;
export const selectBirthDay = (s: GameState): number => s.character.birthDay;
/** Age is derived, never stored. */
export const selectAge = (s: GameState): number => ageInYears(s.character.birthDay, s.clock.now.day);
/** Exact age in years (fractional, day resolution) for learning factors and caps. */
export const selectExactAge = (s: GameState): number => (s.clock.now.day - s.character.birthDay) / DAYS_PER_YEAR;
/** Human-equivalent age h (species.md §1). */
export const selectHumanAge = (s: GameState): number => humanEquivalentAge(speciesDef(s.character.speciesId), selectExactAge(s));
export const selectSpeciesId = (s: GameState): string => s.character.speciesId;
export const selectCharacter = (s: GameState): CharacterSlice => s.character;
export const selectTalents = (s: GameState): Talents => s.character.talents;
export const selectPath = (s: GameState): CharacterSlice['path'] => s.character.path;
export const selectFocusWeights = (s: GameState): Readonly<Record<string, number>> => s.character.focusWeights;
export const selectMainForm = (s: GameState): string | null => s.character.mainFormId;

/** The ref the AI uses for the player character (resolved by the character feature). */
export const PC_REF = 'pc';

// Computed creation is a pure function of its inputs; exported here for the turn and UI layers.
export { computeCreation, defaultFocus, ranksFor, talentCost, ageAt, VALIDATION_OPTIONS, type CreationInput, type CreationResult, type UnmetMinimum } from './creation';
