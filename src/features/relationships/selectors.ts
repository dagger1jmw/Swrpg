import { RELATIONSHIP_LABELS } from '../../data/entities.config';
import type { GameState } from '../../state/gameState';
import type { Relationship } from './relationships';

export const selectRelationship = (s: GameState, npcId: string): Relationship | null => s.relationships.byNpcId[npcId] ?? null;

/** Derived label (never stored, architecture §2). */
export function relationshipLabel(value: number): string {
  return RELATIONSHIP_LABELS.find((b) => value < b.below)!.label;
}

export const selectRelationshipLabel = (s: GameState, npcId: string): string => relationshipLabel(s.relationships.byNpcId[npcId]?.value ?? 0);
