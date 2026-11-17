// Character feature (minimal for M1). Its day hook only reports birthdays; it changes no state.
import { ageInYears, fromAbsSecond } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { characterSliceSchema, type CharacterSlice } from './character';
import { PC_REF, selectAge, selectBirthDay, selectCharacterName } from './selectors';

export const characterFeature: FeatureModule<CharacterSlice, GameState> = {
  id: 'character',
  version: 1,
  initialState: (ctx) => ({ id: `character:${ctx.campaignId}`, name: ctx.character.name, birthDay: ctx.character.birthDay }),
  stateSchema: characterSliceSchema,
  events: {},
  // The player character is referenced as "pc" (e.g. factLearned about the character, M2).
  refKind: 'pc',
  resolveRef: (_state, ref) => (ref === PC_REF ? PC_REF : null),
  onTimeAdvanced: (slice, step) => {
    if (!step.endsDay) return { slice };
    // The day that starts at the end of this step.
    const newDay = fromAbsSecond(step.toAbs).day;
    const before = ageInYears(slice.birthDay, newDay - 1);
    const after = ageInYears(slice.birthDay, newDay);
    return after > before ? { slice, notices: [`${slice.name} turns ${after}.`] } : { slice };
  },
  selectors: { name: selectCharacterName, birthDay: selectBirthDay, age: selectAge },
};
