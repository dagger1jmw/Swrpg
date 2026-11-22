// Canon NPC rosters, one file per lore era (src/data/canon/; npc-generation.md §5; D-152, D-155). Every era gets
// the same level of detail, added over time (architecture §15). The Old Republic era came first only because it is
// Jared's preferred start; nothing in the system favours a year.
import { ERA_09 } from './canon/era09GreatGalacticWar';
import { sheetToGame } from './canon/sheetScale';
import type { CanonEra, CanonNpc, StatAnchor } from './canon/types';

export type { CanonEra, CanonNpc, CanonTimeline, RankSpan, StatusSpan, LocationSpan, StatAnchor } from './canon/types';

export const CANON_ERAS: readonly CanonEra[] = [ERA_09];

/** A hand-set sheet in the game scale (D-423): converted from the sheet scale, the authored levels kept. */
const toGame = (a: StatAnchor): StatAnchor => (a.basis === 'sheet' && a.scale !== 'game' ? { ...a, levels: sheetToGame(a.levels), scale: 'game', authored: a.levels } : a);

/** Every canon entry across all eras (one entry per figure per era file), with its sheets in the game scale (D-423). */
export const CANON_NPCS: readonly CanonNpc[] = CANON_ERAS.flatMap((e) => e.npcs).map((n) => (n.anchors.length ? { ...n, anchors: n.anchors.map(toGame) } : n));

/**
 * Canon entries by lore canon ID. A figure appears in one era file per era it belongs to; the first era wins here.
 * Former IDs (lore batch 19: "lore:grand-master-zym" before the Era 09 redo) resolve to the same entry, so story NPCs
 * linked under the old lore file keep their sheet.
 */
export const CANON_BY_ID: ReadonlyMap<string, CanonNpc> = new Map(
  [...CANON_NPCS].reverse().flatMap((c) => [[c.canonId, c] as const, ...(c.formerCanonIds ?? []).map((id) => [id, c] as const)]),
);
