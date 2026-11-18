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
  /** Sparring and fall hazard per bout: chance and severity (Jared, D-143: unconventional ground). */
  hazard?: { chance: number; severity: 1 | 2 | 3; type: HazardType };
  /** Position available to take with a maneuver: +1 held, +2 decisive (rolls §5). */
  position?: 1 | 2;
  /** Throwable objects: size and the supply range per fight. */
  objects?: { size: ObjectSize; supply: readonly [number, number] };
}

export const TERRAIN_TAGS: readonly TerrainTag[] = [
  { id: 'flatFloor', label: 'flat floor' },
  { id: 'confined', label: 'confined space', situation: 'confined' },
  { id: 'open', label: 'open ground', situation: 'openTerrain' },
  { id: 'unevenGround', label: 'uneven ground', footing: -1, hazard: { chance: 0.03, severity: 1, type: 'fall' } },
  { id: 'slippery', label: 'slippery surface', footing: -1, hazard: { chance: 0.05, severity: 1, type: 'fall' } },
  { id: 'ledge', label: 'ledges and drops', position: 2, hazard: { chance: 0.04, severity: 2, type: 'fall' } },
  { id: 'floatingPlatforms', label: 'floating platforms', footing: -1, position: 2, hazard: { chance: 0.06, severity: 3, type: 'fall' } },
  { id: 'highGround', label: 'high ground', position: 2 },
  { id: 'cover', label: 'cover', position: 1 },
  { id: 'zeroGravity', label: 'zero gravity', situation: 'zeroGravity', footing: -1 },
  { id: 'looseRock', label: 'loose rock', objects: { size: 'small', supply: [3, 6] }, hazard: { chance: 0.02, severity: 1, type: 'fall' } },
  { id: 'debris', label: 'debris', objects: { size: 'medium', supply: [2, 4] } },
  /** Forests, jungles, swamps (Jared, D-180 follow-up): logs and heavy branches to throw; supply like debris. */
  { id: 'fallenTimber', label: 'fallen branches and logs', objects: { size: 'medium', supply: [2, 4] } },
  { id: 'crates', label: 'crates and containers', objects: { size: 'medium', supply: [2, 5] }, position: 1 },
  { id: 'machinery', label: 'heavy machinery', objects: { size: 'large', supply: [1, 2] } },
  { id: 'fire', label: 'fire', hazard: { chance: 0.03, severity: 2, type: 'fire' } },
];

export const TERRAIN_IDS: readonly string[] = TERRAIN_TAGS.map((t) => t.id);
export const TERRAIN_BY_ID: ReadonlyMap<string, TerrainTag> = new Map(TERRAIN_TAGS.map((t) => [t.id, t]));
