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
  /**
   * Brief (opt-1 C3, D-530): timeline rows that score only for their year are not sent; the rows of the current year come back in
   * `yearRows` for a one-line summary. Rows that name someone or somewhere in play, or the player's words, are still sent.
   */
  brief?: boolean;
}

export interface ScoredChunk {
  chunk: LoreChunk;
  /** The text sent: for an overview, only its sentences dated up to the current year (D-98). */
  text: string;
  score: number;
  tokens: number;
  why: string[];
}

export interface LoreSelection {
  included: ScoredChunk[];
  /** Eligible, scored chunks that did not fit. */
  dropped: ScoredChunk[];
  tokens: number;
  /** Brief only: this year's timeline chunks held back for the summary line (opt-1 C3). */
  yearRows?: ScoredChunk[];
  /** Brief only: earlier years' timeline chunks held back (reported as dropped by brief). */
  heldBack?: ScoredChunk[];
}

/** A reason that is only the row's date (scoreChunk's timeline reasons). */
const dateOnly = (why: readonly string[]): boolean => why.every((w) => w === 'this year' || / years? ago$/.test(w));

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
  // A `background` row (undated, D-485) scores nothing by itself: only its names and places below bring it in.
  if (c.canonId && q.canonIds.includes(c.canonId)) add(LORE_SCORES.canonMatch, `canon ${c.canonId}`);
  for (const n of c.names) {
    if (q.names.includes(n)) add(LORE_SCORES.nameMatch, `names ${n}`);
    else if (q.playerText && n.length >= MIN_LORE_SCAN_LENGTH && textMentions(q.playerText, n)) add(LORE_SCORES.textMention, `player mentions ${n}`);
  }
  // A person's entry describes their whole life, later events included, so it is sent only when
  // that person is in play (canon, name or the player's words), never for a shared place (D-93).
  // A species or martial-culture entry (lore batch 21, D-484) is sent only when it is named, never for a place it mentions.
  if (c.kind !== 'character' && c.kind !== 'bench' && c.kind !== 'species' && c.kind !== 'culture') for (const l of c.locations) if (q.locationNames.includes(l)) add(LORE_SCORES.locationMatch, `place ${l}`);
  return { score, why };
}

/** A chunk's text as of `year`: overviews drop sentences about later events (D-98). */
export function chunkTextAt(c: LoreChunk, year: number): string {
  if (!c.parts) return c.text;
  return c.parts
    .filter((p) => p.year <= year)
    .map((p) => p.text)
    .join('')
    .trim();
}

export function retrieveLore(index: LoreIndex, q: LoreQuery, capTokens: number, estimate: (text: string) => number): LoreSelection {
  const scored: ScoredChunk[] = [];
  const yearRows: ScoredChunk[] = [];
  const heldBack: ScoredChunk[] = [];
  for (const chunk of index.chunks) {
    if (!isEligible(chunk, q.year)) continue;
    const { score, why } = scoreChunk(chunk, q);
    if (score <= 0) continue;
    const text = chunkTextAt(chunk, q.year);
    const s = { chunk, text, score, why, tokens: estimate(text) };
    if (q.brief && chunk.kind === 'timeline' && dateOnly(why)) {
      (chunk.toYear >= q.year ? yearRows : heldBack).push(s);
      continue;
    }
    scored.push(s);
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
  return { included, dropped, tokens, ...(q.brief ? { yearRows, heldBack } : {}) };
}

/** Canon match for npcIntroduced (D-81): an in-era lore person with this exact normalized alias. */
export function findCanonEntity(index: LoreIndex, alias: string, year: number): LoreEntity | null {
  if (!alias) return null;
  return index.entities.find((e) => e.fromYear <= year && year <= e.toYear && e.aliases.includes(alias)) ?? null;
}
