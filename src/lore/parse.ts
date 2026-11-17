// Lore index builder (architecture §5 "Lore retrieval"). Pure: takes file names and contents,
// returns the index. Run at build time by scripts/build-lore.ts on Docs/SWRPG lore/*.md
// (read-only). Imports use explicit .ts extensions so Node can run it with type stripping.
//
// Lore chunks hold story text only (D-81): stat tables, "game stats" lines and form ratings are
// stripped, because NPC numbers belong to the engine (Golden Rule 3, npc-generation). The Force
// abilities file is not indexed until M6.
import { normalizeAlias, normalizeText, slugify, textMentions } from '../engine/aliases.ts';

export type LoreChunkKind = 'character' | 'bench' | 'overview' | 'timeline' | 'note';

export interface LoreChunk {
  id: string;
  kind: LoreChunkKind;
  title: string;
  /** Signed years (BBY negative, ABY positive); fromYear <= toYear. */
  fromYear: number;
  toYear: number;
  /** Canon ID for character and bench chunks: `lore:<slug>`, the same across eras. */
  canonId?: string;
  /** Normalized aliases of the people the chunk is about or names. */
  names: string[];
  /** Normalized location names the chunk mentions. */
  locations: string[];
  text: string;
}

export interface LoreEntity {
  canonId: string;
  name: string;
  /** Normalized aliases (normalizeAlias). */
  aliases: string[];
  fromYear: number;
  toYear: number;
  chunkId: string;
}

export interface LoreIndex {
  version: 1;
  chunks: LoreChunk[];
  entities: LoreEntity[];
  /** Normalized location vocabulary (from the timeline's Location column). */
  locations: string[];
}

export interface LoreFile {
  name: string;
  content: string;
}

export const LORE_INDEX_VERSION = 1;

// ---------------------------------------------------------------- years

const unitSign = (u: string): number => (u.toUpperCase() === 'ABY' ? 1 : -1);
/** Signed year; 0 BBY is year 0 (never -0). */
const signed = (n: number, u: string): number => (n === 0 ? 0 : n * unitSign(u));
const num = (s: string): number => Number(s.replace(/,/g, ''));

/** Parses "3,681–3,653 BBY", "19 BBY – 4 ABY", "~3,630–3,625 BBY", "40 ABY". Null when no year. */
export function parseYearRange(text: string): { from: number; to: number } | null {
  const clean = text.replace(/[*\\]/g, '');
  const range = /([\d,]+)\s*(BBY|ABY)?\s*[–-]\s*[~≈]?\s*([\d,]+)\s*(BBY|ABY)/i.exec(clean);
  if (range) {
    const u2 = range[4]!;
    const u1 = range[2] ?? u2;
    const a = signed(num(range[1]!), u1);
    const b = signed(num(range[3]!), u2);
    return { from: Math.min(a, b), to: Math.max(a, b) };
  }
  const single = /([\d,]+)\s*(BBY|ABY)/i.exec(clean);
  if (single) {
    const y = signed(num(single[1]!), single[2]!);
    return { from: y, to: y };
  }
  return null;
}

// ---------------------------------------------------------------- text cleanup

/** Markdown to plain prose: escapes, emphasis, blockquotes and bullets. */
export function cleanMarkdown(line: string): string {
  return line
    .replace(/\\([*&~\-_#>[\]()|])/g, '$1')
    .replace(/^\s*>\s?/, '')
    .replace(/^\s*[*-]\s+/, '- ')
    .replace(/\*\*|__/g, '')
    .replace(/(^|[\s(])\*(?=\S)|(?<=\S)\*(?=[\s).,;:]|$)/g, '$1')
    .replace(/\s+$/, '');
}

const isTableLine = (l: string): boolean => l.trim().startsWith('|');
const isRule = (l: string): boolean => /^\s*\\?-{3,}\s*$/.test(l) || /^\s*\*{3,}\s*$/.test(l);

/** Mechanics lines dropped from character text (D-81). */
const MECHANICS = /game stats|form ratings|sheet snapshot|^\s*-?\s*tier:|^\s*[*-]?\s*\*{0,2}tier:/i;

/**
 * Sentences about the game rather than the story are dropped (D-81): stat talk ("Scale down ...
 * prime stats above") and assumptions about one player's character ("the same Shan line your
 * player-character belongs to"); the player character is generic (architecture §5).
 */
const META_SENTENCE = /player[- ]character|your (pc|character)\b|\bstats?\b|\bstatline\b|scale down/i;

export function dropMetaSentences(line: string): string {
  if (!META_SENTENCE.test(line)) return line;
  const prefix = /^-\s/.test(line) ? '- ' : '';
  const body = prefix ? line.slice(2) : line;
  const sentences = body.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [body];
  const kept = sentences.filter((s) => !META_SENTENCE.test(s)).join('').trim();
  return kept ? prefix + kept : '';
}

function proseLines(lines: readonly string[]): string {
  const out: string[] = [];
  for (const raw of lines) {
    if (isTableLine(raw) || isRule(raw) || MECHANICS.test(raw)) continue;
    const l = cleanMarkdown(raw).trim();
    if (!l) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      continue;
    }
    if (/^#+\s/.test(l)) continue;
    const kept = dropMetaSentences(l);
    if (kept) out.push(kept);
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

function cells(line: string): string[] {
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return t.split('|').map((c) => cleanMarkdown(c).trim());
}

const isSeparatorRow = (cs: readonly string[]): boolean => cs.every((c) => /^:?-*:?$/.test(c));

/** Splits a list cell ("Darth Malgus, Lord Adraas (†), Zym") into normalized aliases. */
function namesFromCell(cell: string): string[] {
  return cell
    .split(/[,;]|\band\b/)
    .map((p) => p.replace(/\([^)]*\)/g, '').replace(/[†]/g, '').trim())
    .filter((p) => p && p !== '—' && !/^(multiple|various|several|unknown)\b/i.test(p))
    .map(normalizeAlias)
    .filter((a) => a.length >= 3);
}

const NON_PLACES = /^(galaxy-wide|multiple|various|unknown|several|—|-|n\/a)/i;

function placesFromCell(cell: string): string[] {
  return cell
    .split(/,|→|\/|;|\band\b/)
    .map((p) => p.replace(/\([^)]*\)/g, '').trim())
    .filter((p) => p && !NON_PLACES.test(p))
    .map(normalizeText)
    .filter((p) => p.length >= 3);
}

// ---------------------------------------------------------------- timeline

interface Era {
  slug: string;
  title: string;
  from: number;
  to: number;
}

function parseTimeline(fileKey: string, content: string, out: LoreChunk[], vocabulary: Set<string>): void {
  const lines = content.split(/\r?\n/);
  let era: Era | null = null;
  let eraJustOpened = false;
  let overview: string[] | null = null;
  const groups = new Map<string, { from: number; to: number; era: Era; rows: string[]; names: Set<string>; places: Set<string> }>();
  const order: string[] = [];

  const flushOverview = (): void => {
    if (era && overview) {
      const text = proseLines(overview);
      if (text) {
        out.push({
          id: `${fileKey}:${era.slug}:overview`,
          kind: 'overview',
          title: `${era.title} (overview)`,
          fromYear: era.from,
          toYear: era.to,
          names: [],
          locations: [],
          text: `${era.title}, ${formatRange(era.from, era.to)}. ${text}`,
        });
      }
    }
    overview = null;
  };

  for (const line of lines) {
    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2 && !/^###/.test(line)) {
      const title = h2[1]!.trim();
      if (/^[═=\s]*$/.test(title)) continue; // decoration
      flushOverview();
      const range = parseYearRange(title);
      if (range) {
        const name = cleanMarkdown(title.split(/\s+[—–-]\s+/)[0] ?? title).trim();
        era = { slug: slugify(name), title: titleCase(name), from: range.from, to: range.to };
        eraJustOpened = true;
      } else if (!eraJustOpened) {
        era = null; // a non-era section (document purpose, sim seeds, ...): not lore
      }
      continue;
    }
    if (/^#{3,}\s/.test(line)) {
      flushOverview();
      eraJustOpened = false;
      if (/^###\s+Overview/i.test(line)) overview = [];
      continue;
    }
    if (line.trim()) eraJustOpened = false;
    if (!era) continue;
    if (isTableLine(line)) {
      flushOverview();
      const cs = cells(line);
      if (isSeparatorRow(cs) || /^date$/i.test(cs[0] ?? '')) continue;
      const [date = '', event = '', figures = '', location = ''] = cs;
      const range = parseYearRange(date) ?? { from: era.from, to: era.to };
      const key = `${era.slug}:${range.from}_${range.to}`;
      let g = groups.get(key);
      if (!g) {
        g = { from: range.from, to: range.to, era, rows: [], names: new Set(), places: new Set() };
        groups.set(key, g);
        order.push(key);
      }
      g.rows.push(`- ${date}: ${event}${figures && figures !== '—' ? ` (${figures}${location && location !== '—' ? `; ${location}` : ''})` : ''}`);
      for (const n of namesFromCell(figures)) g.names.add(n);
      for (const p of placesFromCell(location)) {
        g.places.add(p);
        vocabulary.add(p);
      }
      continue;
    }
    if (overview) overview.push(line);
  }
  flushOverview();

  for (const key of order) {
    const g = groups.get(key)!;
    out.push({
      id: `${fileKey}:${key}`,
      kind: 'timeline',
      title: `${g.era.title}: ${formatRange(g.from, g.to)}`,
      fromYear: g.from,
      toYear: g.to,
      names: [...g.names].sort(),
      locations: [...g.places].sort(),
      text: `${g.era.title}, events of ${formatRange(g.from, g.to)}:\n${g.rows.join('\n')}`,
    });
  }
}

function titleCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s/(-])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());
}

export function formatYear(y: number): string {
  if (y === 0) return '0 BBY/ABY';
  return y < 0 ? `${(-y).toLocaleString('en-US')} BBY` : `${y.toLocaleString('en-US')} ABY`;
}

export function formatRange(from: number, to: number): string {
  return from === to ? formatYear(from) : `${formatYear(from)} to ${formatYear(to)}`;
}

// ---------------------------------------------------------------- character files

/** "## Revan (V) — the freed prisoner" -> name "Revan"; "(Bestia, Brontes, ...)" lists become aliases. */
export function parseCharacterHeading(heading: string): { name: string; aliases: string[] } {
  const raw = cleanMarkdown(heading).trim();
  const head = raw.split(/\s+[—–]\s+/)[0] ?? raw;
  const paren = /\(([^)]*)\)/.exec(head);
  const name = head.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  const aliases = new Set<string>([normalizeAlias(name)]);
  if (paren && paren[1]!.includes(',')) for (const part of paren[1]!.split(',')) aliases.add(normalizeAlias(part));
  const slash = name.split(/\s*\/\s*/);
  if (slash.length > 1) for (const part of slash) aliases.add(normalizeAlias(part));
  return { name, aliases: [...aliases].filter((a) => a.length >= 3) };
}

function parseCharacterFile(fileKey: string, content: string, out: LoreChunk[], entities: LoreEntity[]): void {
  const lines = content.split(/\r?\n/);
  const eraLine = lines.find((l) => /^##\s+Era\b/i.test(l)) ?? '';
  const range = parseYearRange(eraLine);
  if (!range) return;
  // A single-year era ("≈40 ABY") is widened by a year on each side.
  const from = range.from === range.to ? range.from - 1 : range.from;
  const to = range.from === range.to ? range.to + 1 : range.to;
  const eraTitle = cleanMarkdown(eraLine.replace(/^##\s+/, '').replace(/\s*\(.*$/, '')).trim();

  type Section = { level: number; heading: string; body: string[] };
  const sections: Section[] = [];
  let cur: Section | null = null;
  for (const line of lines) {
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      cur = { level: h[1]!.length, heading: h[2]!.trim(), body: [] };
      sections.push(cur);
    } else if (cur) cur.body.push(line);
  }

  const seen = new Set<string>();
  const uniqueId = (base: string): string => {
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return id;
  };

  for (const s of sections) {
    if (s.level === 2 && s.body.some((l) => /lifespan/i.test(l))) {
      const { name, aliases } = parseCharacterHeading(s.heading);
      const text = proseLines(s.body);
      const canonId = `lore:${slugify(name)}`;
      const id = uniqueId(`${fileKey}:${slugify(name)}`);
      out.push({ id, kind: 'character', title: name, fromYear: from, toYear: to, canonId, names: aliases, locations: [], text: `${name}\n${text}` });
      entities.push({ canonId, name, aliases, fromYear: from, toYear: to, chunkId: id });
    } else if (s.level === 3 && /game-relevant note/i.test(s.heading)) {
      const text = proseLines(s.body);
      if (text) {
        out.push({
          id: uniqueId(`${fileKey}:note`),
          kind: 'note',
          title: `${eraTitle}: ${cleanMarkdown(s.heading)}`,
          fromYear: from,
          toYear: to,
          names: [],
          locations: [],
          text,
        });
      }
    }
    // Bench tables: | Name | Species | Role / Affiliation | ...stats... | (notes after " — " in the last cell)
    let header: string[] | null = null;
    for (const line of s.body) {
      if (!isTableLine(line)) {
        header = null;
        continue;
      }
      const cs = cells(line);
      if (!header) {
        header = cs;
        continue;
      }
      if (isSeparatorRow(cs)) continue;
      if (!/^name$/i.test(header[0] ?? '') || !/role/i.test(header[2] ?? '')) continue;
      const [rawName = '', species = '', role = ''] = cs;
      if (!rawName || /generic|\//i.test(rawName) || /generic/i.test(role)) continue;
      const { name, aliases } = parseCharacterHeading(rawName);
      const last = cs[cs.length - 1] ?? '';
      const note = last.includes(' — ') ? last.split(' — ').slice(1).join(' — ') : '';
      const canonId = `lore:${slugify(name)}`;
      const id = uniqueId(`${fileKey}:${slugify(name)}`);
      const text = `${name} (${species}): ${role}.${note ? ` ${note.replace(/\s*\*?\([^)]*%\)\*?/g, '')}.` : ''}`.replace(/\.\./g, '.');
      out.push({ id, kind: 'bench', title: name, fromYear: from, toYear: to, canonId, names: aliases, locations: [], text });
      entities.push({ canonId, name, aliases, fromYear: from, toYear: to, chunkId: id });
    }
  }
}

// ---------------------------------------------------------------- index

/** Short stable file key: SW_Characters_09B_... -> c09b; the timeline -> tl. */
export function fileKey(name: string): string | null {
  const c = /^SW_Characters_([0-9A-Za-z-]+?)_/.exec(name);
  if (c) return `c${c[1]!.toLowerCase()}`;
  if (/^SW_Legends_Galaxy_Timeline/.test(name)) return 'tl';
  return null;
}

export function buildLoreIndex(files: readonly LoreFile[]): LoreIndex {
  const sorted = [...files].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const chunks: LoreChunk[] = [];
  const entities: LoreEntity[] = [];
  const vocabulary = new Set<string>();
  for (const f of sorted) {
    const key = fileKey(f.name);
    if (key === 'tl') parseTimeline(key, f.content, chunks, vocabulary);
  }
  for (const f of sorted) {
    const key = fileKey(f.name);
    if (key && key !== 'tl') parseCharacterFile(key, f.content, chunks, entities);
  }
  // Tag character, bench and note chunks with the locations they mention.
  const places = [...vocabulary].sort();
  for (const c of chunks) {
    if (c.kind === 'timeline') continue;
    const norm = normalizeText(c.text);
    c.locations = places.filter((p) => textMentions(norm, p));
  }
  return { version: LORE_INDEX_VERSION, chunks, entities, locations: places };
}
