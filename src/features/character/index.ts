// Character feature. v2 (M3): computed creation sets every field at the start; the day hook only
// reports birthdays and changes no state.
import { z } from 'zod';
import { ageInYears, fromAbsSecond } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { characterSliceSchema, migrateCharacterV1, migrateCharacterV2, migrateCharacterV3, migrateCharacterV4, type CharacterSlice } from './character';
import { PC_REF, selectAge, selectBirthDay, selectCharacterName, selectExactAge, selectHumanAge, selectSpeciesId } from './selectors';

export const characterFeature: FeatureModule<CharacterSlice, GameState> = {
  id: 'character',
  version: 5,
  initialState: (ctx) => {
    const c = ctx.character;
    return {
      ...migrateCharacterV4(migrateCharacterV3(migrateCharacterV2(migrateCharacterV1({ id: `character:${ctx.campaignId}`, name: c.name, birthDay: c.birthDay })))),
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
      testCharacter: c.testCharacter === true,
      ...(c.formPlan !== undefined ? { formPlan: c.formPlan === null ? null : { padawan: { ...c.formPlan.padawan }, knight: { ...c.formPlan.knight } } } : {}),
    };
  },
  stateSchema: characterSliceSchema,
  migrations: { 2: migrateCharacterV1, 3: migrateCharacterV2, 4: migrateCharacterV3, 5: migrateCharacterV4 },
  events: {
    /** Losing the dominant hand or arm switches the hand (Q39; health §5). Engine only. */
    dominantHandSwitched: {
      schema: z.object({ type: z.literal('dominantHandSwitched'), reason: z.string().max(120) }),
      sources: ['engine'],
      handle: (slice, e) => ({ slice: { ...slice, naturalHand: slice.naturalHand ?? slice.dominantHand, dominantHand: slice.dominantHand === 'right' ? 'left' : 'right' }, notes: [`dominant hand switched (${String(e['reason'])})`] }),
    },
    /** The lost limbs restored (dev /heal all): the hand from before the loss comes back (pass 4 issue 10). Engine only. */
    dominantHandRestored: {
      schema: z.object({ type: z.literal('dominantHandRestored') }),
      sources: ['engine'],
      handle: (slice) => {
        if (!slice.naturalHand) return { slice };
        const { naturalHand, ...rest } = slice;
        return { slice: { ...rest, dominantHand: naturalHand }, notes: naturalHand !== slice.dominantHand ? [`dominant hand restored (${naturalHand})`] : [] };
      },
    },
  },
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
