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
  /**
   * Era overviews only: the text split into dated sentences, so retrieval sends only what has
   * happened by the current year (D-98). `text` is the whole overview, for reference.
   */
  parts?: { year: number; text: string }[];
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
  // For dating overview sentences (D-98): named events and "Year N" headings per era.
  const overviews: { era: Era; text: string }[] = [];
  const eventsByEra = new Map<string, { name: string; year: number }[]>();
  const yearNByEra = new Map<string, Map<number, number>>();

  const flushOverview = (): void => {
    if (era && overview) {
      const text = proseLines(overview);
      if (text) overviews.push({ era, text });
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
      // "#### 3,661 BBY — Year 20" / "#### 3,659–3,654 BBY — Years 22-27": map war years to years.
      const yh = /^####\s+(.*?)\s+[—–-]\s+Years?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i.exec(line);
      const yr = yh ? parseYearRange(yh[1]!) : null;
      if (era && yh && yr) {
        const map = yearNByEra.get(era.slug) ?? new Map<number, number>();
        const n0 = Number(yh[2]);
        const n1 = yh[3] ? Number(yh[3]) : n0;
        for (let n = n0; n <= n1; n++) map.set(n, Math.min(yr.to, yr.from + (n - n0)));
        yearNByEra.set(era.slug, map);
      }
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
      const bold = /\|[^|]*\|\s*\*\*([^*]+)\*\*/.exec(line);
      if (bold && parseYearRange(date)) {
        const list = eventsByEra.get(era.slug) ?? [];
        list.push({ name: bold[1]!.trim(), year: range.to });
        eventsByEra.set(era.slug, list);
      }
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

  for (const o of overviews) {
    const head = `${o.era.title}, ${formatRange(o.era.from, o.era.to)}.`;
    const parts = [{ year: o.era.from, text: head }, ...dateOverview(o.text, o.era, eventsByEra.get(o.era.slug) ?? [], yearNByEra.get(o.era.slug) ?? new Map())];
    out.push({
      id: `${fileKey}:${o.era.slug}:overview`,
      kind: 'overview',
      title: `${o.era.title} (overview)`,
      fromYear: o.era.from,
      toYear: o.era.to,
      names: [],
      locations: [],
      text: `${head} ${o.text}`,
      parts,
    });
  }

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

/** Words that put a sentence at the end of its era ("The war ends ...", "eventually", "later"). */
const ERA_END = /\b(ends?|ended|ending|concludes?|eventually|later|finally|ultimately)\b/i;
const EVENT_PREFIX = /^(?:(?:the|first|second|third|final)\s+)*(?:battle|siege|sacking|fall|destruction|invasion|assault|liberation|treaty|blockade|massacre)\s+(?:of|on|at)\s+(?:the\s+)?/;

/**
 * Splits an overview into sentences (list lines stay whole) and dates each one (D-98): the latest
 * explicit BBY/ABY year, "year N" of the war (from the timeline's year headings), or a named
 * timeline event of the era it mentions; era-end words date it to the era's last year. Overviews
 * run in order, so a sentence is never dated before the one above it.
 */
export function dateOverview(
  text: string,
  era: { from: number; to: number },
  events: readonly { name: string; year: number }[],
  yearN: ReadonlyMap<number, number>,
): { year: number; text: string }[] {
  const keys: { key: string; year: number }[] = [];
  const stripped = new Map<string, Set<number>>();
  for (const e of events) {
    const full = normalizeText(e.name);
    keys.push({ key: full, year: e.year });
    const short = full.replace(EVENT_PREFIX, '');
    if (short !== full && short.length >= 5) stripped.set(short, (stripped.get(short) ?? new Set()).add(e.year));
  }
  // A stripped key ("bothawui") counts only when it names one year's events ("coruscant" does not).
  for (const [key, years] of stripped) if (years.size === 1) keys.push({ key, year: [...years][0]! });

  const own = (s: string): number | null => {
    const years: number[] = [];
    for (const m of s.matchAll(/([\d,]+)\s*(BBY|ABY)\b/gi)) {
      const r = parseYearRange(m[0]);
      if (r) years.push(r.to);
    }
    for (const m of s.matchAll(/\byears?\s+(\d+)\b/gi)) {
      const y = yearN.get(Number(m[1]));
      if (y !== undefined) years.push(y);
    }
    const norm = normalizeText(s);
    for (const k of keys) if (textMentions(norm, k.key)) years.push(k.year);
    if (ERA_END.test(s)) years.push(era.to);
    return years.length ? Math.max(...years) : null;
  };

  const out: { year: number; text: string }[] = [];
  let running = era.from;
  for (const line of text.split('\n')) {
    const pieces = /^\s*-\s/.test(line) || !line.trim() ? [line] : (line.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [line]);
    pieces.forEach((piece, i) => {
      const y = own(piece);
      running = Math.max(running, y ?? running);
      const last = i === pieces.length - 1;
      out.push({ year: running, text: `${piece.trim()}${last ? '\n' : ' '}` });
    });
  }
  return out.filter((p) => p.text.trim());
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

// ---------------------------------------------------------------- research-bot character files (D-390)

/** Markdown links to their text: "[Zym](https://...)" -> "Zym". The bot files cite every line. */
const stripLinks = (s: string): string => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s{2,}/g, ' ');
/** Citations (links to sources) dropped from story text: "... killed [Zym §Biography](https://...)." -> "... killed." */
const stripCitations = (s: string): string =>
  s.replace(/\s*\[[^\]]*\]\(https?:[^)]*\)/g, '').replace(/\s+([.,;:])/g, '$1').replace(/\s{2,}/g, ' ');

/** Entry types that are people (or a named group of people) in the bot's template. */
const PERSON_TYPE = /^\s*-\s*\*\*Type:\*\*\s*(character|characters|class protagonist|group\b)/i;

/**
 * The research bot's character layout (lore batch 19): the era is in the H1 title; each person is a `###` entry with
 * bullet fields ("- **Type:** character", "- **Key facts:**", ...); minor figures sit in tables whose columns are
 * found by header ("Name", "Species"/"ID", "Role"/"Office"/"Rank"). Index files (master index tables) and the
 * "Old estimate" verdict tables add no chunks. Returns false when the file is not in this layout.
 */
function parseBotCharacterFile(fileKey: string, content: string, out: LoreChunk[], entities: LoreEntity[]): boolean {
  const lines = content.split(/\r?\n/);
  if (!lines.some((l) => PERSON_TYPE.test(l))) return false;
  const range = parseYearRange(lines.find((l) => /^#\s/.test(l)) ?? '');
  if (!range) return false;
  const { from, to } = range;
  const sections: { heading: string; body: string[] }[] = [];
  let cur: { heading: string; body: string[] } | null = null;
  for (const line of lines) {
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      cur = h[1]!.length === 3 ? { heading: h[2]!.trim(), body: [] } : null;
      if (cur) sections.push(cur);
    } else if (cur) cur.body.push(line);
  }
  const seen = new Set<string>();
  const uniqueId = (base: string): string => {
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return id;
  };
  const add = (kind: 'character' | 'bench', rawName: string, text: string): void => {
    const heading = stripLinks(rawName);
    const parsed = parseCharacterHeading(heading);
    const { name } = parsed;
    if (!name) return;
    // The bot's parentheses list other names with ";" or "," ("Vitiate (the Sith Emperor; Tenebrae)", "Darth Malgus
    // (born Veradun)"); quoted epithets and "X and Y" pairs also become aliases.
    const extra: string[] = [];
    for (const m of heading.matchAll(/\(([^)]*)\)/g)) {
      for (const part of m[1]!.split(/[;,]/)) extra.push(part.replace(/^\s*(born|later|also|the|formerly|title only)\s+/i, '').replace(/["“”]/g, ''));
    }
    for (const q of heading.matchAll(/["“]([^"”]+)["”]/g)) extra.push(q[1]!);
    if (/\band\b/.test(name)) extra.push(...name.split(/\s+and\s+/));
    const aliases = [...new Set([...parsed.aliases, ...extra.map(normalizeAlias)])].filter((a) => a.length >= 3 && !/^title only$/.test(a));
    const canonId = `lore:${slugify(name)}`;
    const id = uniqueId(`${fileKey}:${slugify(name)}`);
    out.push({ id, kind, title: name, fromYear: from, toYear: to, canonId, names: aliases, locations: [], text });
    entities.push({ canonId, name, aliases, fromYear: from, toYear: to, chunkId: id });
  };
  for (const s of sections) {
    if (s.body.some((l) => PERSON_TYPE.test(l))) {
      const { name } = parseCharacterHeading(stripLinks(s.heading));
      const body = s.body.filter((l) => !PERSON_TYPE.test(l) && !/^\s*-\s*\*\*(Era|Related|Key facts):\*\*/i.test(l)).map(stripCitations);
      add('character', s.heading, `${name}\n${proseLines(body)}`);
    }
    let header: string[] | null = null;
    for (const line of s.body) {
      if (!isTableLine(line)) {
        header = null;
        continue;
      }
      const cs = cells(line).map((c, i) => (i === 0 ? stripLinks(c) : stripCitations(c)));
      if (!header) {
        header = cs;
        continue;
      }
      if (isSeparatorRow(cs) || !/^name$/i.test(header[0] ?? '')) continue;
      const roleCol = header.findIndex((h) => /role|office|rank|epithet/i.test(h));
      if (roleCol < 0) continue; // a master index (Name | Group | Born | ...) is not a roster table
      const speciesCol = header.findIndex((h) => /species|^id$/i.test(h));
      const statusCol = header.findIndex((h) => /3661/.test(h));
      const rawName = cs[0] ?? '';
      if (!rawName || /generic/i.test(rawName)) continue;
      const { name } = parseCharacterHeading(rawName);
      const species = speciesCol >= 0 ? cs[speciesCol] ?? '' : '';
      const role = cs[roleCol] ?? '';
      const status = statusCol >= 0 && cs[statusCol] && cs[statusCol] !== '—' ? ` In 3661 BBY / 3653 BBY: ${cs[statusCol]}.` : '';
      add('bench', rawName, `${name}${species ? ` (${species})` : ''}: ${role}.${status}`.replace(/\.\./g, '.'));
    }
  }
  return true;
}

function parseCharacterFile(fileKey: string, content: string, out: LoreChunk[], entities: LoreEntity[]): void {
  if (parseBotCharacterFile(fileKey, content, out, entities)) return;
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

/**
 * Short stable file key: SW_Characters_09B_... -> c09b; the timeline -> tl. Research-bot sets split into parts get a
 * key per part (SW_Characters_09_GGW_ColdWar_Part3a.md -> c09p3a, _Index.md -> c09i), so chunk ids stay unique.
 */
export function fileKey(name: string): string | null {
  const part = /^SW_Characters_([0-9A-Za-z-]+?)_.*_(Part[0-9A-Za-z]+|Index)\.md$/.exec(name);
  if (part) return `c${part[1]!.toLowerCase()}${part[2] === 'Index' ? 'i' : part[2]!.slice(4).toLowerCase().replace(/^/, 'p')}`;
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
  // Research-bot sets (c09p1, c09p2, ...): an alias two figures of the same set share (Scourge's old title "Emperor's
  // Wrath" vs the Wrath protagonist) is dropped from both, so exact-alias matching stays unambiguous; each figure keeps
  // its own name.
  const setOf = (chunkId: string): string | null => /^(c[0-9a-z-]+?)p[0-9a-z]+:/.exec(chunkId)?.[1] ?? null;
  const counts = new Map<string, number>();
  for (const e of entities) {
    const set = setOf(e.chunkId);
    if (set) for (const a of e.aliases) counts.set(`${set}|${a}`, (counts.get(`${set}|${a}`) ?? 0) + 1);
  }
  for (const e of entities) {
    const set = setOf(e.chunkId);
    if (!set) continue;
    const own = normalizeAlias(e.name);
    const keep = e.aliases.filter((a) => a === own || (counts.get(`${set}|${a}`) ?? 0) < 2);
    if (keep.length === e.aliases.length) continue;
    e.aliases = keep;
    const chunk = chunks.find((c) => c.id === e.chunkId);
    if (chunk) chunk.names = keep;
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
