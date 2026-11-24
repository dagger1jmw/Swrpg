// Lore index builder (architecture §5 "Lore retrieval"). Pure: takes file names and contents,
// returns the index. Run at build time by scripts/build-lore.ts on Docs/SWRPG lore/*.md
// (read-only). Imports use explicit .ts extensions so Node can run it with type stripping.
//
// Lore chunks hold story text only (D-81): stat tables, "game stats" lines and form ratings are
// stripped, because NPC numbers belong to the engine (Golden Rule 3, npc-generation). The Force
// abilities file is not indexed until M6.
import { normalizeAlias, normalizeText, slugify, textMentions } from '../engine/aliases.ts';

export type LoreChunkKind = 'character' | 'bench' | 'overview' | 'timeline' | 'note' | 'species' | 'planet' | 'route';

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
/** "32.5 BBY" is in 32 BBY, "7.5 ABY" in 7 ABY: a decimal year is cut to its year (D-480). */
const num = (s: string): number => Math.floor(Number(s.replace(/,/g, '')));

/**
 * Parses "3,681–3,653 BBY", "19 BBY – 4 ABY", "~3,630–3,625 BBY", "40 ABY", "between 3,636 and 3,630 BBY". Years with
 * or without the thousands comma ("3,681 BBY", "3681 BBY"). Null when no year.
 */
export function parseYearRange(text: string): { from: number; to: number } | null {
  const clean = text.replace(/[*\\]/g, '');
  const range =
    /([\d,]+(?:\.\d+)?)\s*(BBY|ABY)?\s*[–-]\s*[~≈]?\s*([\d,]+(?:\.\d+)?)\s*(BBY|ABY)/i.exec(clean) ??
    /between\s+([\d,]+)\s*(BBY|ABY)?\s+and\s+([\d,]+)\s*(BBY|ABY)/i.exec(clean);
  if (range) {
    const u2 = range[4]!;
    const u1 = range[2] ?? u2;
    const a = signed(num(range[1]!), u1);
    const b = signed(num(range[3]!), u2);
    return { from: Math.min(a, b), to: Math.max(a, b) };
  }
  const single = /([\d,]+(?:\.\d+)?)\s*(BBY|ABY)/i.exec(clean);
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
    .replace(/(^|[\s("-])\*(?=\S)|(?<=\S)\*(?=[\s).,;:'’-]|$)/g, '$1')
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

const NON_PLACES = /^(galaxy-wide|multiple|various|unknown|several|other\b|—|-|n\/a)/i;

function placesFromCell(cell: string): string[] {
  // Asides first: "Balmorra (Empire → Republic)" names one place, not three.
  return cell
    .replace(/\([^)]*\)/g, '')
    .split(/,|→|\/|;|\band\b|\s+to\s+/)
    .map((p) => p.trim())
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

/** Research tags in the bot's timeline rows ("[conflict]", "[inferred]", "[Ruled ...]", "[S-canon]"): kept in the lore file, not sent as story. */
const RESEARCH_TAG = /\s*\[(?:conflict|unclear|inferred|BTS|gray|last resort|S-canon|Ruled|weak|unconfirmed|primary|dating derived|carried over)\b[^\]]*\]/gi;
/** A row a ruling set aside ("[Ruled 24 Nov 2026: not used ...]", D-477): kept in the file as a record, never sent. */
const RULED_OUT = /\[Ruled [^\]:]*: not used\b/i;
/** Asides about the files rather than the story: "(see Ord Radama row)", "(SW_Republic_Military_GGW gives the range)", "(ruling 16)". */
const FILE_ASIDE =
  /\s*\([^()]*\b(?:SW_\w+|files?|slice|rows?|see|page|pages|Wookieepedia|ruling|lore batch|D-\d+|Decisions? needed|Part \d|uncited|unreferenced|conjectural title|galactic timeline)\b[^()]*\)/gi;
/** Overview sentences about the file itself (lore batch 20's slice): "the rows below keep only dates", "the old file has ...". */
const TIMELINE_META =
  /\bold file\b|\bthis slice\b|\bparser\b|Decisions needed|\brows? (?:below|here)\b|\bin-scope\b|\brebuilt here\b|\btable\b|\bSW_\w+|`|\byear pages?\b|\bLegends year\b/i;

/** "Blank centuries: between ... the year pages record ...": what the research did not find, to the end of its line. */
const BLANK_YEARS = /\s*\bBlank (?:centuries|stretches|years):.*$/gm;

/** A timeline cell or paragraph as story text: citations, research tags, file asides and "[conflict] ..." notes dropped. */
function cleanTimelineText(s: string): string {
  return stripCitations(s)
    .replace(/([.!?])(?:\s*;)+/g, '$1') // "... front. [A](u); [B](u)" leaves "front.;"
    .replace(/(?:\s*;)+\s*(?=[.!?]|$)/g, '') // "... Tython [A](u); [B](u)." leaves "Tython;."
    .replace(/([.;])\s*\[conflict\][\s\S]*$/i, '$1')
    .replace(RESEARCH_TAG, '')
    .replace(FILE_ASIDE, '')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Overview prose: citations and file-meta sentences dropped (lines kept; list lines stay whole). */
function cleanTimelineOverview(text: string): string {
  return text
    .replace(BLANK_YEARS, '')
    .split('\n')
    .map((line) => {
      if (!line.trim() || /^\s*-\s/.test(line)) return line.trim() ? cleanTimelineText(line) : line;
      const sentences = stripCitations(line).match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [line];
      return sentences
        .filter((s) => !TIMELINE_META.test(s))
        .map(cleanTimelineText)
        .filter(Boolean)
        .join(' ');
    })
    .filter((line, i, all) => line.trim() || (i > 0 && all[i - 1]!.trim()))
    .join('\n')
    .trim();
}

/**
 * The galaxy timeline (D-81): the old SW_Legends_Galaxy_Timeline.md plus the research bot's slices
 * (SW_Timeline_3700_3600BBY_Part1-3, lore batch 20), read as one timeline so era ids stay stable. Era headings ("## NAME
 * — 3,681–3,653 BBY"), "### Overview", "#### 3,661 BBY — Year 20" headings and event tables in either layout: the old
 * columns (Date | Event | Key Figures | Location | Downstream) or the slice's (Date | Event | Type | Place | Who |
 * Source), found by header. The slice's "State of the galaxy" paragraphs under a year heading become that year's first
 * row. An era split across files merges its overviews and rows.
 */
function parseTimeline(fileKey: string, contents: readonly string[], out: LoreChunk[], vocabulary: Set<string>): void {
  let era: Era | null = null;
  let eraJustOpened: boolean; // both reset at the start of each file
  let overview: string[] | null = null;
  let yearHeading: { from: number; to: number; label: string } | null;
  let cols = { date: 0, event: 1, who: 2, place: 3 };
  const groups = new Map<string, { from: number; to: number; era: Era; rows: string[]; names: Set<string>; places: Set<string> }>();
  const order: string[] = [];
  // For dating overview sentences (D-98): named events and "Year N" headings per era.
  const overviews: { era: Era; text: string }[] = [];
  const eventsByEra = new Map<string, { name: string; year: number }[]>();
  const yearNByEra = new Map<string, Map<number, number>>();

  const flushOverview = (): void => {
    if (era && overview) {
      const text = cleanTimelineOverview(proseLines(overview));
      const same = overviews.find((o) => o.era.slug === era!.slug);
      if (text && same) same.text = `${same.text}\n${text}`;
      else if (text) overviews.push({ era, text });
    }
    overview = null;
  };
  const groupFor = (e: Era, range: { from: number; to: number }) => {
    const key = `${e.slug}:${range.from}_${range.to}`;
    let g = groups.get(key);
    if (!g) {
      g = { from: range.from, to: range.to, era: e, rows: [], names: new Set(), places: new Set() };
      groups.set(key, g);
      order.push(key);
    }
    return g;
  };

  for (const content of contents) {
    flushOverview();
    era = null;
    eraJustOpened = false;
    yearHeading = null;
    for (const line of content.split(/\r?\n/)) {
      const h2 = /^##\s+(.*)$/.exec(line);
      if (h2 && !/^###/.test(line)) {
        const title = h2[1]!.trim();
        if (/^[═=\s]*$/.test(title)) continue; // decoration
        flushOverview();
        yearHeading = null;
        const range = parseYearRange(title);
        if (range) {
          const name = cleanMarkdown(title.split(/\s+[—–-]\s+/)[0] ?? title).trim();
          era = { slug: slugify(name), title: titleCase(name), from: range.from, to: range.to };
          eraJustOpened = true;
        } else if (!eraJustOpened) {
          era = null; // a non-era section (document purpose, sim seeds, summary, ...): not lore
        }
        continue;
      }
      if (/^#{3,}\s/.test(line)) {
        flushOverview();
        eraJustOpened = false;
        yearHeading = null;
        // "#### 3,661 BBY — Year 20" / "#### 3,676–3,672 BBY — Years 5-9" / "#### 3,681 BBY — Year 0 (war begins)":
        // map war years to years.
        const yh = /^####\s+(.*?)\s+[—–-]\s+Years?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i.exec(line);
        const yr = yh ? parseYearRange(yh[1]!) : null;
        if (era && yh && yr) {
          const map = yearNByEra.get(era.slug) ?? new Map<number, number>();
          const n0 = Number(yh[2]);
          const n1 = yh[3] ? Number(yh[3]) : n0;
          for (let n = n0; n <= n1; n++) map.set(n, Math.min(yr.to, yr.from + (n - n0)));
          yearNByEra.set(era.slug, map);
          yearHeading = { ...yr, label: cleanMarkdown(yh[1]!).trim() };
        }
        if (/^###\s+Overview/i.test(line)) overview = [];
        continue;
      }
      if (line.trim()) eraJustOpened = false;
      if (!era) continue;
      if (isTableLine(line)) {
        flushOverview();
        const cs = cells(line);
        if (isSeparatorRow(cs) || RULED_OUT.test(line)) continue;
        if (/^date$/i.test(cs[0] ?? '')) {
          const at = (re: RegExp, fallback: number): number => {
            const i = cs.findIndex((c) => re.test(c));
            return i >= 0 ? i : fallback;
          };
          cols = { date: 0, event: at(/^event/i, 1), who: at(/^(who|key figures)/i, -1), place: at(/^(place|location)/i, -1) };
          continue;
        }
        const pick = (i: number): string => (i >= 0 ? cleanTimelineText(cs[i] ?? '') : '');
        const date = pick(cols.date);
        const event = pick(cols.event);
        const figures = pick(cols.who);
        const location = pick(cols.place);
        const range = parseYearRange(date) ?? { from: era.from, to: era.to };
        const bold = /\|[^|]*\|\s*\*\*([^*]+)\*\*/.exec(line);
        if (bold && parseYearRange(date)) {
          const list = eventsByEra.get(era.slug) ?? [];
          list.push({ name: bold[1]!.trim(), year: range.to });
          eventsByEra.set(era.slug, list);
        }
        const g = groupFor(era, range);
        const extra = [figures, location].filter((c) => c && c !== '—');
        g.rows.push(`- ${date}: ${event}${extra.length ? ` (${extra.join('; ')})` : ''}`);
        for (const n of namesFromCell(figures)) g.names.add(n);
        for (const p of placesFromCell(location)) {
          g.places.add(p);
          vocabulary.add(p);
        }
        continue;
      }
      // "**State of the galaxy, 3,665 BBY.** The Republic lost ..." under a year heading (lore batch 20's slice).
      const state = /^\s*\*\*State of the galaxy[^*]*\*\*\s*(.*)$/i.exec(line);
      if (state && yearHeading && !overview) {
        const body = cleanTimelineText(cleanMarkdown(state[1]!));
        if (body) groupFor(era, yearHeading).rows.push(`- State of the galaxy, ${yearHeading.label}: ${body}`);
        continue;
      }
      if (overview) overview.push(line);
    }
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
    let years: number[] = [];
    for (const m of s.matchAll(/([\d,]+(?:\.\d+)?)\s*(BBY|ABY)\b/gi)) {
      const r = parseYearRange(m[0]);
      if (r) years.push(r.to);
    }
    // A sentence naming the era's own span ("a war from 3,681 BBY to 3,653 BBY") describes the era, which the
    // chunk's head already dates: it belongs at the start, not at the era's end.
    if (years.includes(era.from) && years.includes(era.to) && era.from !== era.to) years = years.filter((y) => y !== era.to);
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

// ---------------------------------------------------------------- research-bot character files (D-392)

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

const SPECIES_TYPE = /^\s*-\s*\*\*Type:\*\*\s*species\b/i;
const AMBIGUOUS_SPECIES_NAMES: ReadonlySet<string> = new Set(['sith']);

/**
 * The research bot's species files (SW_Species_OldRepublic_Part1-3, lore batch 21, D-398): the era is in the H1 title;
 * each species is a `###` entry with a "- **Type:** species" bullet. Each becomes a `species` chunk, sent only when the
 * species is named (lore/retrieve.ts). Names: the heading, its parenthesised names ("Sith (Sith Purebloods and Sith
 * hybrids)") and plurals. Entries without a Type bullet (reading notes, the non-playable group list, Part 3's tables)
 * add nothing.
 */
function parseSpeciesFile(fileKey: string, content: string, out: LoreChunk[]): void {
  const lines = content.split(/\r?\n/);
  const range = parseYearRange(lines.find((l) => /^#\s/.test(l)) ?? '');
  if (!range) return;
  let cur: { heading: string; body: string[] } | null = null;
  const sections: { heading: string; body: string[] }[] = [];
  for (const line of lines) {
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      cur = h[1]!.length === 3 ? { heading: h[2]!.trim(), body: [] } : null;
      if (cur) sections.push(cur);
    } else if (cur) cur.body.push(line);
  }
  for (const s of sections) {
    if (!s.body.some((l) => SPECIES_TYPE.test(l))) continue;
    const heading = stripLinks(s.heading);
    const name = heading.replace(/\s*\([^)]*\)/g, '').trim();
    const raw = [name];
    for (const m of heading.matchAll(/\(([^)]*)\)/g)) raw.push(...m[1]!.split(/[;,]|\band\b/));
    // "Sith" alone names the Order far more often than the species: the species answers to "Sith Pureblood(s)",
    // "Sith hybrid(s)" and "Pureblood(s)" only.
    if (/^sith$/i.test(name)) raw.push('pureblood');
    const base = [...new Set(raw.map(normalizeAlias).filter((a) => a.length >= 3 && !AMBIGUOUS_SPECIES_NAMES.has(a)))];
    const names = [...new Set(base.flatMap((a) => (a.endsWith('s') ? [a] : [a, `${a}s`])))];
    const body = s.body.filter((l) => !/^\s*-\s*\*\*(Related|Key facts):\*\*/i.test(l)).map(stripCitations);
    out.push({
      id: `${fileKey}:${slugify(name)}`,
      kind: 'species',
      title: name,
      fromYear: range.from,
      toYear: range.to,
      names,
      locations: [],
      text: `${name} (species)\n${proseLines(body)}`,
    });
  }
}

/** A piece that opens with an event date ("3653 BBY: ...", "c. 3643 BBY: ...", "Changes: 3661 BBY: ..."). */
const LEADING_DATE = /^(?:-\s*)?(?:[A-Za-z][A-Za-z0-9 ]{0,20}:\s*)?(?:c\.\s*|by\s+|after\s+|before\s+|early\s+|mid-|late\s+)?(\d[\d,]*)(?:\s*[–-]\s*\d[\d,]*)?\s*BBY\b/;

/**
 * Splits planet or route prose into pieces dated by their own leading event date, so the narrator gets only what has
 * happened by the current year (D-98's mechanism; lore batch 22). Each line is split into sentences; a sentence that
 * opens with a date takes that date (a range takes its start); every other piece belongs to the era's start. Not
 * monotonic: an undated field after a dated event stays visible.
 */
function datedEventPieces(text: string, eraFrom: number): { year: number; text: string }[] {
  const out: { year: number; text: string }[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const pieces = line.match(/[^.!?]+(?:[.!?]+(?=\s|$)["')\]]*)?/g) ?? [line];
    pieces.forEach((piece, i) => {
      const m = LEADING_DATE.exec(piece.trim());
      const year = m ? -Number(m[1]!.replace(/,/g, '')) : eraFrom;
      out.push({ year: Math.max(eraFrom, year), text: `${piece.trim()}${i === pieces.length - 1 ? '\n' : ' '}` });
    });
  }
  return out;
}

/** Planet field 3's population, which belongs to other eras: dropped from story text (D-402 [12]). */
const POPULATION = /population: .*?(?=; (?:native species|language|government|other species)|\. \[|$)/;

/**
 * The research bot's planets and travel files (SW_Planets_Travel_OldRepublic_Part1-6, lore batch 22, D-403). Each `###`
 * planet entry ("**Type:** celestial body" or a numbered "1. Location" field) becomes a `planet` chunk, located at the
 * planet so it is sent when the scene is there or the planet is named. Each route entry ("Endpoints", "Founded" or a
 * hyperroute type) becomes a `route` chunk, sent only when named. Citations, the population figures and the big tables
 * (the master table, the mention-only index, the B2 list, the 725 sources) are left out.
 */
function parsePlanetFile(fileKey: string, content: string, out: LoreChunk[]): void {
  const lines = content.split(/\r?\n/);
  const range = parseYearRange(lines.find((l) => /^#\s/.test(l)) ?? '');
  if (!range) return;
  let cur: { heading: string; body: string[] } | null = null;
  const sections: { heading: string; body: string[] }[] = [];
  for (const line of lines) {
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      cur = h[1]!.length === 3 ? { heading: h[2]!.trim(), body: [] } : null;
      if (cur) sections.push(cur);
    } else if (cur) cur.body.push(line);
  }
  const seen = new Set<string>();
  for (const s of sections) {
    const isPlanet = s.body.some((l) => /^\s*-\s*\*\*Type:\*\*\s*celestial body/i.test(l) || /^\s*-\s*\*\*1\. Location:/.test(l));
    const isRoute = !isPlanet && s.body.some((l) => /^\s*-\s*\*\*(Endpoints|Founded):\*\*/.test(l) || /^\s*-\s*\*\*Type:\*\*\s*[a-z-]*hyperroute/i.test(l));
    if (!isPlanet && !isRoute) continue;
    const name = stripLinks(s.heading).replace(/\s*\([^)]*\)\s*$/, '').trim();
    const id = `${fileKey}:${slugify(name)}`;
    if (!name || seen.has(id)) continue;
    seen.add(id);
    const body = s.body.filter((l) => !isTableLine(l) && !/^\s*-\s*\*\*Cross-reference:\*\*/.test(l)).map((l) => stripCitations(l).replace(POPULATION, 'population: other-era figure only'));
    const norm = normalizeText(name);
    const head = `${name} (${isPlanet ? 'world' : 'hyperspace route'})`;
    const prose = proseLines(body);
    out.push({
      id,
      kind: isPlanet ? 'planet' : 'route',
      title: name,
      fromYear: range.from,
      toYear: range.to,
      names: [normalizeAlias(name)].filter((a) => a.length >= 3),
      locations: isPlanet && norm.length >= 3 ? [norm] : [],
      text: `${head}\n${prose}`,
      parts: [{ year: range.from, text: `${head}\n` }, ...datedEventPieces(prose, range.from)],
    });
  }
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
  // The Mandalorian comparison's two timeline tables (D-482) join the timeline.
  if (/^SW_Mandalorians_preTCW_vs_TCW/.test(name)) return 'tl';
  // The research bot's timeline slices (SW_Timeline_3700_3600BBY_Part1.md, lore batch 20) join the same timeline.
  if (/^SW_Timeline_.*_Part\d+\.md$/.test(name)) return 'tl';
  // Species files (SW_Species_OldRepublic_Part1.md -> sp-oldrepublic-p1; lore batch 21).
  const sp = /^SW_Species_([0-9A-Za-z]+)_Part(\d+)\.md$/.exec(name);
  if (sp) return `sp-${sp[1]!.toLowerCase()}-p${sp[2]}`;
  // Planets and travel files (SW_Planets_Travel_OldRepublic_Part1.md -> pl-oldrepublic-p1; lore batch 22).
  const pl = /^SW_Planets_Travel_([0-9A-Za-z]+)_Part(\d+)\.md$/.exec(name);
  if (pl) return `pl-${pl[1]!.toLowerCase()}-p${pl[2]}`;
  return null;
}

export function buildLoreIndex(files: readonly LoreFile[]): LoreIndex {
  const sorted = [...files].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const chunks: LoreChunk[] = [];
  const entities: LoreEntity[] = [];
  const vocabulary = new Set<string>();
  // The old timeline first, then the slices in name order (an era the old file still opens keeps its place).
  const timeline = sorted.filter((f) => fileKey(f.name) === 'tl');
  timeline.sort((a, b) => Number(!/^SW_Legends_Galaxy_Timeline/.test(a.name)) - Number(!/^SW_Legends_Galaxy_Timeline/.test(b.name)));
  if (timeline.length) parseTimeline('tl', timeline.map((f) => f.content), chunks, vocabulary);
  for (const f of sorted) {
    const key = fileKey(f.name);
    if (key?.startsWith('sp-')) parseSpeciesFile(key, f.content, chunks);
    else if (key?.startsWith('pl-')) parsePlanetFile(key, f.content, chunks);
    else if (key && key !== 'tl') parseCharacterFile(key, f.content, chunks, entities);
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
    // Timeline rows, planets and routes keep their own locations (a planet entry names many places; D-403).
    if (c.kind === 'timeline' || c.kind === 'planet' || c.kind === 'route') continue;
    const norm = normalizeText(c.text);
    c.locations = places.filter((p) => textMentions(norm, p));
  }
  return { version: LORE_INDEX_VERSION, chunks, entities, locations: places };
}
