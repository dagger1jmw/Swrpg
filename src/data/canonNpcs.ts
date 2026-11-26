// Canon NPC rosters, one file per lore era (src/data/canon/; npc-generation.md §5; D-152, D-155). Every era gets
// the same level of detail, added over time (architecture §15). The Old Republic era came first only because it is
// Jared's preferred start; nothing in the system favours a year.
import { ERA_09 } from './canon/era09GreatGalacticWar';
import { ERA_LUKE } from './canon/lukeSkywalker';
import { sheetToGame } from './canon/sheetScale';
import { SKILL_DRAFTS } from './canon/skillDrafts';
import type { CanonEra, CanonNpc, StatAnchor } from './canon/types';

export type { CanonEra, CanonNpc, CanonTimeline, RankSpan, StatusSpan, LocationSpan, StatAnchor } from './canon/types';

export const CANON_ERAS: readonly CanonEra[] = [ERA_09, ERA_LUKE];

/** A hand-set sheet in the game scale (D-423): converted from the sheet scale, the authored levels kept. */
const toGame = (n: CanonNpc, a: StatAnchor): StatAnchor => (a.basis === 'sheet' && a.scale !== 'game' ? { ...a, levels: sheetToGame(n, a), scale: 'game', authored: a.levels } : a);

/**
 * The approved draft sheets (Jared, 26 Nov 2026; m8-traits, D-514; canon/skillDrafts.ts) for figures on the roster: partial
 * anchors on the game scale (the draft stats only; a lore sheet's own numbers stay on its sheet), oldest first with the rest.
 */
function withDrafts(n: CanonNpc): CanonNpc {
  const drafts = SKILL_DRAFTS.filter((d) => d.canonId === n.canonId);
  if (!drafts.length) return n;
  const extra: StatAnchor[] = drafts.map((d) => ({ bby: -d.year, complete: false, basis: 'sheet', scale: 'game', levels: { ...d.draft }, sources: `approved draft sheet (Jared, 26 Nov 2026; skillDrafts.ts): ${d.name}` }));
  // A career the draft stands for that ends (D-516): its stats hold from then.
  const holds = drafts.flatMap((d) => (d.heldFrom ? [{ fromBby: -d.heldFrom.year, stats: d.heldFrom.stats, note: d.heldFrom.note }] : []));
  return { ...n, anchors: [...n.anchors, ...extra].sort((a, b) => b.bby - a.bby), ...(holds.length ? { holds: [...(n.holds ?? []), ...holds] } : {}) };
}

/**
 * A draft's `authored` numbers are the lore sheet's own (m8-ship-life, D-518): where the roster's sheet of the same date leaves
 * one out, it goes onto that sheet before the conversion, so the scale rule reads it like any other sheet number (a main
 * specialty as written). Cipher Nine's sheet gives "Ranged/Stealth ≈ 84"; the roster took it as Blaster only and her Stealth
 * fell to the field agent's line (35.2).
 */
function withAuthored(n: CanonNpc): CanonNpc {
  const drafts = SKILL_DRAFTS.filter((d) => d.canonId === n.canonId && Object.keys(d.authored).length);
  if (!drafts.length) return n;
  const anchors = n.anchors.map((a) => {
    const d = drafts.find((x) => -x.year === a.bby);
    if (!d || a.basis !== 'sheet' || !a.complete || a.scale === 'game') return a;
    const missing = Object.fromEntries(Object.entries(d.authored).filter(([k]) => a.levels[k] === undefined));
    return Object.keys(missing).length ? { ...a, levels: { ...a.levels, ...missing } } : a;
  });
  return { ...n, anchors };
}

/** Every canon entry across all eras (one entry per figure per era file), with its sheets in the game scale (D-423). */
export const CANON_NPCS: readonly CanonNpc[] = CANON_ERAS.flatMap((e) => e.npcs)
  .map(withAuthored)
  .map((n) => withDrafts(n.anchors.length ? { ...n, anchors: n.anchors.map((a) => toGame(n, a)) } : n));

/**
 * Canon entries by lore canon ID. A figure appears in one era file per era it belongs to; the first era wins here.
 * Former IDs (lore batch 19: "lore:grand-master-zym" before the Era 09 redo) resolve to the same entry, so story NPCs
 * linked under the old lore file keep their sheet.
 */
export const CANON_BY_ID: ReadonlyMap<string, CanonNpc> = new Map(
  [...CANON_NPCS].reverse().flatMap((c) => [[c.canonId, c] as const, ...(c.formerCanonIds ?? []).map((id) => [id, c] as const)]),
);
