// The one feature registry (architecture §11), in the §10 hook order. Features without a
// day-loop role in §10 come first: clock (the time writer, no hook) and character (its hook only
// reports birthdays). Then the §10 list: routines, health, progression, alignment, npcs and
// relationships, threads, ranks, world, pacing; the interruption check is advanceTime itself.
// Locations, memory and flags have no day hook and sit with clock and character (M2, M5). Later milestones
// insert their features at their §10 slot. The economy (M8 item 5) runs after the world, so a day's living is charged where
// the character is once the world has moved on, and before pacing. Droids (M8 item 7) follow the economy: their only hook
// recharges shields. Traits (M8 item 16) follow: their only hook brings a youngling's formative quiz due after a long skip.
// Ship battles (M8 item 13) have no day hook: a battle is played turn by turn. Ships (m8-ship-life) follow: their hook draws
// crew wages, docking and upkeep through the economy (an event it applies) and wears the ships; tactics and possessions have no
// day hook. Duty (opt-2 D) runs just before pacing: its day hook reads the threads, the wounds and the world's timeline (all
// hands) after they have moved, ends a mission or rolls the day's assignment.
import { battlesFeature } from '../features/battles';
import { possessionsFeature } from '../features/possessions';
import { shipsFeature } from '../features/ships';
import { tacticsFeature } from '../features/tactics';
import { characterFeature } from '../features/character';
import { clockFeature } from '../features/clock';
import { combatFeature } from '../features/combat';
import { droidsFeature } from '../features/droids';
import { dutyFeature } from '../features/duty';
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
import { traitsFeature } from '../features/traits';
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
  traitsFeature,
  battlesFeature,
  shipsFeature,
  tacticsFeature,
  possessionsFeature,
  dutyFeature,
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
  'traits',
  'battles',
  'ships',
  'tactics',
  'possessions',
  'duty',
  'pacing',
];
