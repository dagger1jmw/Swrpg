// GameState is composed of feature slices (architecture §2). Each field has exactly one owner.
import type { CharacterSlice } from '../features/character/character';
import type { ClockSlice } from '../features/clock/clock';
import type { LocationsSlice } from '../features/locations/locations';
import type { NpcsSlice } from '../features/npcs/npcs';
import type { PacingSlice } from '../features/pacing/pacing';
import type { RelationshipsSlice } from '../features/relationships/relationships';
import type { ThreadsSlice } from '../features/threads/threads';
import type { Meta } from './types';

export type GameState = {
  meta: Meta;
  clock: ClockSlice;
  character: CharacterSlice;
  locations: LocationsSlice;
  npcs: NpcsSlice;
  relationships: RelationshipsSlice;
  threads: ThreadsSlice;
  pacing: PacingSlice;
};
