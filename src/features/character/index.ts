// Character feature. v2 (M3): computed creation sets every field at the start; the day hook only
// reports birthdays and changes no state.
import { ageInYears, fromAbsSecond } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { characterSliceSchema, migrateCharacterV1, migrateCharacterV2, type CharacterSlice } from './character';
import { PC_REF, selectAge, selectBirthDay, selectCharacterName, selectExactAge, selectHumanAge, selectSpeciesId } from './selectors';

export const characterFeature: FeatureModule<CharacterSlice, GameState> = {
  id: 'character',
  version: 3,
  initialState: (ctx) => {
    const c = ctx.character;
    return {
      ...migrateCharacterV2(migrateCharacterV1({ id: `character:${ctx.campaignId}`, name: c.name, birthDay: c.birthDay })),
      ...(c.speciesId !== undefined ? { speciesId: c.speciesId } : {}),
      ...(c.path !== undefined ? { path: c.path } : {}),
      ...(c.archetype !== undefined ? { archetype: c.archetype } : {}),
      ...(c.focusWeights !== undefined ? { focusWeights: { ...c.focusWeights } } : {}),
      ...(c.mainFormId !== undefined ? { mainFormId: c.mainFormId } : {}),
      ...(c.secondFormId !== undefined ? { secondFormId: c.secondFormId } : {}),
      ...(c.trainingStartAge !== undefined ? { trainingStartAge: c.trainingStartAge } : {}),
      ...(c.talents !== undefined ? { talents: { ...c.talents } } : {}),
      ...(c.dominantHand !== undefined ? { dominantHand: c.dominantHand } : {}),
      ...(c.unbalanced !== undefined ? { unbalanced: c.unbalanced } : {}),
    };
  },
  stateSchema: characterSliceSchema,
  migrations: { 2: migrateCharacterV1, 3: migrateCharacterV2 },
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
  selectors: { name: selectCharacterName, birthDay: selectBirthDay, age: selectAge, exactAge: selectExactAge, humanAge: selectHumanAge, species: selectSpeciesId },
};
