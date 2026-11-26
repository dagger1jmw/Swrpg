// The one feature registry (architecture §11), in the §10 hook order. Features without a
// day-loop role in §10 come first: clock (the time writer, no hook) and character (its hook only
// reports birthdays). Then the §10 list: routines, health, progression, alignment, npcs and
// relationships, threads, ranks, world, pacing; the interruption check is advanceTime itself.
// Locations, memory and flags have no day hook and sit with clock and character (M2, M5). Later milestones
// insert their features at their §10 slot. The economy (M8 item 5) runs after the world, so a day's living is charged where
// the character is once the world has moved on, and before pacing. Droids (M8 item 7) follow the economy: their only hook
// recharges shields.
import { characterFeature } from '../features/character';
import { clockFeature } from '../features/clock';
import { combatFeature } from '../features/combat';
import { droidsFeature } from '../features/droids';
import { economyFeature } from '../features/economy';
import { flagsFeature } from '../features/flags';
import { healthFeature } from '../features/health';
import { locationsFeature } from '../features/locations';
import { memoryFeature } from '../features/memory';
import { npcsFeature } from '../features/npcs';
import { pacingFeature } from '../features/pacing';
import { progressionFeature } from '../features/progression';
import { ranksFeature } from '../features/ranks';
import { relationshipsFeature } from '../features/relationships';
import { routinesFeature } from '../features/routines';
import { threadsFeature } from '../features/threads';
import { worldFeature } from '../features/world';
import type { GameState } from './gameState';
import type { Registry } from './types';

export const REGISTRY: Registry<GameState> = [
  clockFeature,
  characterFeature,
  locationsFeature,
  memoryFeature,
  flagsFeature,
  routinesFeature,
  healthFeature,
  combatFeature,
  progressionFeature,
  npcsFeature,
  relationshipsFeature,
  threadsFeature,
  ranksFeature,
  worldFeature,
  economyFeature,
  droidsFeature,
  pacingFeature,
];

/** The documented hook order; tests assert REGISTRY follows it. */
export const HOOK_ORDER: readonly string[] = [
  'clock',
  'character',
  'locations',
  'memory',
  'flags',
  'routines',
  'health',
  'combat',
  'progression',
  'alignment',
  'npcs',
  'relationships',
  'threads',
  'ranks',
  'world',
  'economy',
  'droids',
  'pacing',
];
