// Registered terrain tags for combatStarted (architecture §3; rolls §5; Jared, D-143). The AI picks tags from
// this list; the engine owns every effect. Tags may also hold throwable objects for Force throws in sequences,
// each with a size class (Force load and hazard damage) and a per-fight supply seeded from the tag.
import type { HazardType } from './health.config';
import type { MatchupSituation } from './formMatchups';

export const OBJECT_SIZES = ['small', 'medium', 'large'] as const;
export type ObjectSize = (typeof OBJECT_SIZES)[number];
/** Force throw by size: base Force load (before effort and mastery) and hazard severity of the hit. */
export const OBJECT_SIZE_RULES: Record<ObjectSize, { forceLoad: number; hazard: HazardType; severity: 1 | 2 | 3 }> = {
  small: { forceLoad: 0.1, hazard: 'impact', severity: 1 },
  medium: { forceLoad: 0.25, hazard: 'impact', severity: 2 },
  large: { forceLoad: 0.5, hazard: 'impact', severity: 3 },
};

export interface TerrainTag {
  id: string;
  label: string;
  /** Matchup situation this terrain creates (confined, open terrain, zero gravity). */
  situation?: MatchupSituation;
  /** Both sides' footing (rolls §5: unstable footing -1). */
  footing?: number;
  /**
   * Accident per bout (per 10 exchanges in a real fight): chance and severity (Jared, D-143, D-144). note: what
   * happens, for the narration; minorOnly: the wound stays in the minor band (D-185).
   */
  hazard?: { chance: number; severity: 1 | 2 | 3; type: HazardType; note?: string; minorOnly?: boolean };
  /** Position available to take with a maneuver: +1 held, +2 decisive (rolls §5). */
  position?: 1 | 2;
  /** Throwable objects: size and the supply range per fight. */
  objects?: { size: ObjectSize; supply: readonly [number, number] };
  /** Modifier to take-position attempts (the position maneuver's margin): slippery ground -1 (Jared, D-184). */
  positionAttempt?: number;
  /** Ranged fighters here are behind cover: it blocks lightning and thrown objects (D-192). */
  cover?: boolean;
  /** A Force-null bubble (ysalamiri, D-192): no Force use works. */
  forceNegation?: boolean;
}

export const TERRAIN_TAGS: readonly TerrainTag[] = [
  // About 1 in 200 bouts a minor injury even on good ground (Jared, D-144, D-185).
  { id: 'flatFloor', label: 'flat floor', hazard: { chance: 0.005, severity: 1, type: 'fall', note: 'turns an ankle, pulls a muscle or takes a bruise', minorOnly: true } },
  { id: 'confined', label: 'confined space', situation: 'confined' },
  { id: 'open', label: 'open ground', situation: 'openTerrain' },
  { id: 'unevenGround', label: 'uneven ground', footing: -1, hazard: { chance: 0.03, severity: 1, type: 'fall' } },
  { id: 'slippery', label: 'slippery surface', footing: -1, hazard: { chance: 0.05, severity: 1, type: 'fall' }, positionAttempt: -1 },
  { id: 'ledge', label: 'ledges and drops', position: 2, hazard: { chance: 0.04, severity: 2, type: 'fall' } },
  { id: 'floatingPlatforms', label: 'floating platforms', footing: -1, position: 2, hazard: { chance: 0.06, severity: 3, type: 'fall' } },
  { id: 'highGround', label: 'high ground', position: 2 },
  { id: 'cover', label: 'cover', position: 1, cover: true },
  { id: 'zeroGravity', label: 'zero gravity', situation: 'zeroGravity', footing: -1 },
  { id: 'looseRock', label: 'loose rock', objects: { size: 'small', supply: [3, 6] }, hazard: { chance: 0.02, severity: 1, type: 'fall' } },
  { id: 'debris', label: 'debris', objects: { size: 'medium', supply: [2, 4] } },
  /** Forests, jungles, swamps (Jared, D-180 follow-up): logs and heavy branches to throw; supply like debris. */
  /** Ice fields, glaciers, Ilum's caves, Hoth (Jared, D-184): chunks of ice to throw. */
  { id: 'iceChunks', label: 'chunks of ice', objects: { size: 'medium', supply: [2, 5] } },
  { id: 'fallenTimber', label: 'fallen branches and logs', objects: { size: 'medium', supply: [2, 4] } },
  { id: 'crates', label: 'crates and containers', objects: { size: 'medium', supply: [2, 5] }, position: 1, cover: true },
  { id: 'machinery', label: 'heavy machinery', objects: { size: 'large', supply: [1, 2] } },
  /** Ysalamiri in the area (D-192; Characters_14, Thrawn): a bubble where the Force cannot be used. */
  { id: 'ysalamiri', label: 'ysalamiri (a Force-null bubble)', forceNegation: true },
  { id: 'fire', label: 'fire', hazard: { chance: 0.03, severity: 2, type: 'fire' } },
];

export const TERRAIN_IDS: readonly string[] = TERRAIN_TAGS.map((t) => t.id);
export const TERRAIN_BY_ID: ReadonlyMap<string, TerrainTag> = new Map(TERRAIN_TAGS.map((t) => [t.id, t]));
