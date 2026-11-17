// GameState is composed of feature slices (architecture §2). Each field has exactly one owner.
import type { CharacterSlice } from '../features/character/character';
import type { ClockSlice } from '../features/clock/clock';
import type { PacingSlice } from '../features/pacing/pacing';
import type { Meta } from './types';

export type GameState = {
  meta: Meta;
  clock: ClockSlice;
  character: CharacterSlice;
  pacing: PacingSlice;
};
