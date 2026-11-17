// The one feature registry (architecture §11), in the §10 hook order. Features without a
// day-loop role in §10 come first: clock (the time writer, no hook) and character (its hook only
// reports birthdays). Then the §10 list: routines, health, progression, alignment, npcs and
// relationships, threads, ranks, world, pacing; the interruption check is advanceTime itself.
// Locations and memory have no day hook and sit with clock and character (M2). Later milestones
// insert their features at their §10 slot.
import { characterFeature } from '../features/character';
import { clockFeature } from '../features/clock';
import { healthFeature } from '../features/health';
import { locationsFeature } from '../features/locations';
import { memoryFeature } from '../features/memory';
import { npcsFeature } from '../features/npcs';
import { pacingFeature } from '../features/pacing';
import { progressionFeature } from '../features/progression';
import { ranksFeature } from '../features/ranks';
import { relationshipsFeature } from '../features/relationships';
import { threadsFeature } from '../features/threads';
import type { GameState } from './gameState';
import type { Registry } from './types';

export const REGISTRY: Registry<GameState> = [
  clockFeature,
  characterFeature,
  locationsFeature,
  memoryFeature,
  healthFeature,
  progressionFeature,
  npcsFeature,
  relationshipsFeature,
  threadsFeature,
  ranksFeature,
  pacingFeature,
];

/** The documented hook order; tests assert REGISTRY follows it. */
export const HOOK_ORDER: readonly string[] = [
  'clock',
  'character',
  'locations',
  'memory',
  'routines',
  'health',
  'progression',
  'alignment',
  'npcs',
  'relationships',
  'threads',
  'ranks',
  'world',
  'pacing',
];
