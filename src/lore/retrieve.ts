// Lore retrieval (architecture §5): filter to the current era, score by overlap with the scene's
// canon NPCs, the current location and what the player referenced, fill up to the cap. Timeline
// events are never sent ahead of the current year (Q49, D-81). Pure.
import { LORE_SCORES } from '../data/lore.config';
import { textMentions } from '../engine/aliases';

/** Canon names are proper names, so 3 letters is enough to scan for ("Zym"; live finding, D-95). */
export const MIN_LORE_SCAN_LENGTH = 3;
import type { LoreChunk, LoreEntity, LoreIndex } from './parse';

export interface LoreQuery {
  /** Signed calendar year (BBY negative). */
  year: number;
  /** Canon IDs of scene NPCs and referenced NPCs. */
  canonIds: readonly string[];
  /** Normalized aliases of scene / referenced people. */
  names: readonly string[];
  /** Normalized names of the current location and its ancestors. */
  locationNames: readonly string[];
  /** The player's input, normalized (normalizeText), scanned for lore names. */
  playerText?: string;
}

export interface ScoredChunk {
  chunk: LoreChunk;
  score: number;
  tokens: number;
  why: string[];
}

export interface LoreSelection {
  included: ScoredChunk[];
  /** Eligible, scored chunks that did not fit. */
  dropped: ScoredChunk[];
  tokens: number;
}

/** Era filter: character and note chunks by era range; timeline rows only up to the current year. */
export function isEligible(c: LoreChunk, year: number): boolean {
  if (c.kind === 'timeline') return c.fromYear <= year && year - c.toYear <= LORE_SCORES.timelineLookbackYears;
  return c.fromYear <= year && year <= c.toYear;
}

export function scoreChunk(c: LoreChunk, q: LoreQuery): { score: number; why: string[] } {
  const why: string[] = [];
  let score = 0;
  const add = (n: number, reason: string): void => {
    score += n;
    why.push(reason);
  };
  if (c.kind === 'overview') add(LORE_SCORES.overview, 'era overview');
  if (c.kind === 'note') add(LORE_SCORES.note, 'era note');
  if (c.kind === 'timeline') {
    if (c.toYear >= q.year) add(LORE_SCORES.timelineCurrent, 'this year');
    else add(Math.max(1, LORE_SCORES.timelinePast - LORE_SCORES.timelinePastDecayPerYear * (q.year - c.toYear)), `${q.year - c.toYear} years ago`);
  }
  if (c.canonId && q.canonIds.includes(c.canonId)) add(LORE_SCORES.canonMatch, `canon ${c.canonId}`);
  for (const n of c.names) {
    if (q.names.includes(n)) add(LORE_SCORES.nameMatch, `names ${n}`);
    else if (q.playerText && n.length >= MIN_LORE_SCAN_LENGTH && textMentions(q.playerText, n)) add(LORE_SCORES.textMention, `player mentions ${n}`);
  }
  // A person's entry describes their whole life, later events included, so it is sent only when
  // that person is in play (canon, name or the player's words), never for a shared place (D-93).
  if (c.kind !== 'character' && c.kind !== 'bench') for (const l of c.locations) if (q.locationNames.includes(l)) add(LORE_SCORES.locationMatch, `place ${l}`);
  return { score, why };
}

export function retrieveLore(index: LoreIndex, q: LoreQuery, capTokens: number, estimate: (text: string) => number): LoreSelection {
  const scored: ScoredChunk[] = [];
  for (const chunk of index.chunks) {
    if (!isEligible(chunk, q.year)) continue;
    const { score, why } = scoreChunk(chunk, q);
    if (score <= 0) continue;
    scored.push({ chunk, score, why, tokens: estimate(chunk.text) });
  }
  scored.sort((a, b) => b.score - a.score || (a.chunk.id < b.chunk.id ? -1 : a.chunk.id > b.chunk.id ? 1 : 0));
  const included: ScoredChunk[] = [];
  const dropped: ScoredChunk[] = [];
  let tokens = 0;
  for (const s of scored) {
    if (tokens + s.tokens <= capTokens) {
      included.push(s);
      tokens += s.tokens;
    } else dropped.push(s);
  }
  return { included, dropped, tokens };
}

/** Canon match for npcIntroduced (D-81): an in-era lore person with this exact normalized alias. */
export function findCanonEntity(index: LoreIndex, alias: string, year: number): LoreEntity | null {
  if (!alias) return null;
  return index.entities.find((e) => e.fromYear <= year && year <= e.toYear && e.aliases.includes(alias)) ?? null;
}
