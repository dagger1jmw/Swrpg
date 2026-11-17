// GameState is composed of feature slices (architecture §2). Each field has exactly one owner.
import type { CharacterSlice } from '../features/character/character';
import type { ClockSlice } from '../features/clock/clock';
import type { HealthSlice } from '../features/health/health';
import type { LocationsSlice } from '../features/locations/locations';
import type { MemorySlice } from '../features/memory/memory';
import type { NpcsSlice } from '../features/npcs/npcs';
import type { PacingSlice } from '../features/pacing/pacing';
import type { ProgressionSlice } from '../features/progression/progression';
import type { RanksSlice } from '../features/ranks/ranks';
import type { RelationshipsSlice } from '../features/relationships/relationships';
import type { ThreadsSlice } from '../features/threads/threads';
import type { Meta } from './types';

export type GameState = {
  meta: Meta;
  clock: ClockSlice;
  character: CharacterSlice;
  locations: LocationsSlice;
  memory: MemorySlice;
  health: HealthSlice;
  progression: ProgressionSlice;
  npcs: NpcsSlice;
  relationships: RelationshipsSlice;
  threads: ThreadsSlice;
  ranks: RanksSlice;
  pacing: PacingSlice;
};
