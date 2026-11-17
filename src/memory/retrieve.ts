// Deterministic memory retrieval (architecture §7). Inputs: scene NPCs, the current location,
// entities referenced in the intent (or mentioned by exact name in the player's text, D-85),
// open threads. Pinned facts are always included; the rest fills the cap in score order. Pure.
import { MEMORY_SCORES } from '../data/memory.config';
import { formatDate } from '../engine/calendar';
import { isScannableAlias, normalizeAlias, normalizeText, textMentions } from '../engine/aliases';
import { PC_REF } from '../features/character/selectors';
import { selectCurrentLocationId, selectLocationChain, selectLocations } from '../features/locations/selectors';
import { selectChapters, selectEnginePinnedFactIds, selectFacts, selectPlayerPins } from '../features/memory/selectors';
import { selectNpcAge, selectNpcs } from '../features/npcs/selectors';
import { selectPresentNpcIds } from '../features/pacing/selectors';
import { selectRelationship, selectRelationshipLabel } from '../features/relationships/selectors';
import { selectOpenThreads, selectThreads } from '../features/threads/selectors';
import { selectTurnInPlay } from '../features/clock/selectors';
import type { GameState } from '../state/gameState';
import { addTag, DEFAULT_SCORER, type MemoryItem, type MemoryQuery, type QuerySource, type Scorer } from './scorer';

export interface RetrievalInput {
  /** IDs the intent targets or references (already validated). */
  referencedIds: readonly string[];
  /** The player's raw input, scanned for exact known names. */
  playerText: string;
  /** The oldest turn sent as a raw recent turn; chapter summaries wholly inside the window are skipped. */
  rawFromTurn: number | null;
}

export interface ScoredItem {
  item: MemoryItem;
  score: number;
  tokens: number;
  pinned: boolean;
  /** Query tags the item shares (for the debug view). */
  matched: string[];
}

export interface MemorySelection {
  included: ScoredItem[];
  dropped: ScoredItem[];
  tokens: number;
  query: { tags: [string, QuerySource][]; openThreadIds: string[] };
}

/**
 * Entity IDs the player's text mentions as whole words (D-85; a retrieval signal only, never a
 * state change): an exact name or alias, or a single name word ("Orren" for "Master Orren Vash")
 * when that word belongs to no other known person or place.
 */
export function mentionedEntityIds(state: GameState, text: string): string[] {
  const norm = normalizeText(text);
  if (!norm) return [];
  const entities: { id: string; names: string[]; words: boolean }[] = [
    ...selectNpcs(state).map((n) => ({ id: n.id, names: [n.name, ...n.aliases], words: true })),
    ...selectLocations(state).map((l) => ({ id: l.id, names: [l.name, ...l.aliases], words: true })),
    ...selectThreads(state).map((t) => ({ id: t.id, names: [t.title], words: false })),
  ];
  const wordOwners = new Map<string, Set<string>>();
  for (const e of entities) {
    if (!e.words) continue;
    for (const n of e.names) for (const w of normalizeAlias(n).split(' ')) if (isScannableAlias(w)) wordOwners.set(w, (wordOwners.get(w) ?? new Set()).add(e.id));
  }
  const out: string[] = [];
  for (const e of entities) {
    const hit = e.names.some((n) => {
      const full = normalizeText(n);
      const alias = normalizeAlias(n);
      if ((isScannableAlias(full) && textMentions(norm, full)) || (isScannableAlias(alias) && textMentions(norm, alias))) return true;
      return e.words && alias.split(' ').some((w) => wordOwners.get(w)?.size === 1 && textMentions(norm, w));
    });
    if (hit) out.push(e.id);
  }
  return out;
}

export function buildQuery(state: GameState, input: RetrievalInput): MemoryQuery {
  const tags = new Map<string, QuerySource>();
  for (const l of selectLocationChain(state, selectCurrentLocationId(state))) addTag(tags, l.id, 'location');
  const openThreadIds = new Set(selectOpenThreads(state).map((t) => t.id));
  for (const id of openThreadIds) addTag(tags, id, 'thread');
  for (const id of selectPresentNpcIds(state)) addTag(tags, id, 'scene');
  for (const id of mentionedEntityIds(state, input.playerText)) addTag(tags, id, 'mentioned');
  for (const id of input.referencedIds) addTag(tags, id, 'referenced');
  return { turn: selectTurnInPlay(state), tags, openThreadIds };
}

const clip = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Every record that can be sent as memory, as text with tags. */
export function memoryItems(state: GameState, rawFromTurn: number | null): MemoryItem[] {
  const items: MemoryItem[] = [];
  const name = (id: string): string =>
    id === PC_REF ? 'the player character' : (state.npcs.byId[id]?.name ?? state.locations.byId[id]?.name ?? state.threads.byId[id]?.title ?? id);

  for (const f of selectFacts(state)) {
    items.push({ kind: 'fact', id: f.id, tags: [f.aboutRef], turn: f.turn, importance: f.importance, text: `Fact about ${name(f.aboutRef)} (${f.aboutRef}): ${f.text}` });
  }
  for (const n of selectNpcs(state)) {
    const rel = selectRelationship(state, n.id);
    const age = selectNpcAge(state, n.id);
    const parts = [
      `${n.id}: ${n.name}${n.aliases.length ? ` (also: ${n.aliases.join(', ')})` : ''}`,
      `${n.speciesId}, ${n.factionId}, ${n.role}${age !== null ? `, about ${age}` : ''}, ${n.status}`,
      `relationship ${selectRelationshipLabel(state, n.id)}${rel ? ` (${rel.lastReason})` : ''}`,
      n.description,
      `last seen ${formatDate(n.lastSeenDay)}${n.lastLocationId ? ` at ${name(n.lastLocationId)}` : ''}`,
    ];
    items.push({ kind: 'npc', id: n.id, tags: [n.id, ...(n.lastLocationId ? [n.lastLocationId] : [])], turn: n.introducedTurn, text: parts.filter(Boolean).join('; ') });
  }
  for (const l of selectLocations(state)) {
    const parent = l.parentId ? `, in ${name(l.parentId)}` : '';
    items.push({
      kind: 'location',
      id: l.id,
      tags: [l.id, ...(l.parentId ? [l.parentId] : [])],
      turn: l.introducedTurn,
      text: `${l.id}: ${l.name} (${l.kind}${parent}${l.region ? `, ${l.region}` : ''})${l.description ? `; ${l.description}` : ''}`,
    });
  }
  for (const t of selectThreads(state)) {
    const deadline = t.deadlineDay !== null && t.status === 'open' ? `, deadline ${formatDate(t.deadlineDay)}` : '';
    const notes = t.notes.length ? ` Notes: ${t.notes.slice(-3).join(' / ')}` : '';
    items.push({
      kind: 'thread',
      id: t.id,
      tags: [t.id, ...t.entityRefs],
      turn: t.lastTurn,
      text: `${t.id}: "${t.title}" [${t.status}${deadline}] stakes: ${t.stakes}.${notes}`,
    });
  }
  for (const c of selectChapters(state)) {
    if (!c.summary) continue;
    if (rawFromTurn !== null && c.turnRange[0] >= rawFromTurn) continue; // its turns are sent raw
    items.push({
      kind: 'chapter',
      id: c.id,
      tags: [...c.entityIds, ...c.locationIds, ...c.threadIds],
      turn: c.turnRange[1],
      text: `Chapter (turns ${c.turnRange[0]}-${c.turnRange[1]}, ${formatDate(c.dayRange[0])} to ${formatDate(c.dayRange[1])}): ${clip(c.summary, 2400)}`,
    });
  }
  return items;
}

export function retrieveMemory(
  state: GameState,
  input: RetrievalInput,
  capTokens: number,
  estimate: (text: string) => number,
  scorer: Scorer = DEFAULT_SCORER,
): MemorySelection {
  const query = buildQuery(state, input);
  const pins = new Set([...selectPlayerPins(state), ...selectEnginePinnedFactIds(state)]);
  const scored: ScoredItem[] = memoryItems(state, input.rawFromTurn)
    .map((item) => ({
      item,
      score: scorer.score(item, query),
      tokens: estimate(item.text),
      pinned: pins.has(item.id),
      matched: item.tags.filter((t) => query.tags.has(t)),
    }))
    .filter((s) => s.pinned || s.matched.length > 0 || s.score >= MEMORY_SCORES.minScoreWithoutOverlap);
  scored.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.score - a.score || (a.item.id < b.item.id ? -1 : 1));
  const included: ScoredItem[] = [];
  const dropped: ScoredItem[] = [];
  let tokens = 0;
  for (const s of scored) {
    // Pinned facts are always included (architecture §7), even past the cap.
    if (s.pinned || tokens + s.tokens <= capTokens) {
      included.push(s);
      tokens += s.tokens;
    } else dropped.push(s);
  }
  return { included, dropped, tokens, query: { tags: [...query.tags], openThreadIds: [...query.openThreadIds] } };
}
