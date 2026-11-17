// Context building (architecture §5, M2): prompt sections + state + recent raw turns + memory +
// lore + arc, each section held to its token cap (src/ai/context.config.ts), with a per-section
// report for the debug view. Pure; never mutates state. Replaces the minimal M1 builder (D-74).
import { CONTEXT_CAPS, MAX_RAW_TURNS, SUMMARY_INPUT_CAP_TOKENS, type SectionName } from '../ai/context.config';
import { PROMPTS } from '../ai/prompts';
import type { CallType, Message } from '../ai/provider';
import { makeEstimator } from '../ai/tokenRatio';
import { normalizeAlias, normalizeText } from '../engine/aliases';
import { dateFromAbsDay, formatClock, formatDate, timeOfDayLabel } from '../engine/calendar';
import type { CheckCard } from '../engine/rolls';
import { PC_REF, selectAge, selectCharacterName } from '../features/character/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectCurrentLocationId, selectLocationChain, selectLocations } from '../features/locations/selectors';

import { selectArc, type Chapter } from '../features/memory/selectors';
import { selectNpcs } from '../features/npcs/selectors';
import { selectMoodTags, selectPacingLevel, selectPresentNpcIds } from '../features/pacing/selectors';
import { selectOpenThreads } from '../features/threads/selectors';
import { LORE_INDEX } from '../lore';
import type { LoreIndex } from '../lore/parse';
import { retrieveLore } from '../lore/retrieve';
import { memoryItems, mentionedEntityIds, retrieveMemory } from '../memory/retrieve';
import type { GameState } from '../state/gameState';
import { describeInput, type TurnInput, type TurnRecord } from './record';
import type { TurnDraft } from './resolve';

// ---------------------------------------------------------------- report

export interface ContextItem {
  id: string;
  tokens: number;
  score?: number;
  note?: string;
}

export interface SectionReport {
  name: SectionName | 'resolved' | 'input' | 'schema';
  /** Null for the small uncapped parts. */
  cap: number | null;
  tokens: number;
  included: ContextItem[];
  dropped: ContextItem[];
}

export interface ContextReport {
  callType: CallType;
  /** The model the estimate was made for (the call may fall back to another). */
  model: string;
  ratio: number;
  sections: SectionReport[];
  estimatedTokens: number;
  /** Characters sent (system + messages + schema), for ratio calibration. */
  chars: number;
  /** Gemini promptTokenCount, filled in after the call. */
  actualInputTokens: number | null;
}

export interface BuiltRequest {
  system: string;
  messages: Message[];
  report: ContextReport;
}

export interface BuildOptions {
  model: string;
  /** Characters per token for this model (calibrated, D-86). */
  ratio: number;
  /** Characters of the response JSON Schema (counted, uncapped). */
  schemaChars?: number;
  lore?: LoreIndex;
}

type Estimate = (text: string) => number;

function finishReport(callType: CallType, opts: BuildOptions, sections: SectionReport[], system: string, messages: readonly Message[]): ContextReport {
  const schemaChars = opts.schemaChars ?? 0;
  if (schemaChars > 0) sections.push({ name: 'schema', cap: null, tokens: Math.ceil(schemaChars / opts.ratio), included: [], dropped: [] });
  const chars = system.length + messages.reduce((a, m) => a + m.text.length, 0) + schemaChars;
  return {
    callType,
    model: opts.model,
    ratio: opts.ratio,
    sections,
    estimatedTokens: sections.reduce((a, s) => a + s.tokens, 0),
    chars,
    actualInputTokens: null,
  };
}

const section = (name: SectionReport['name'], cap: number | null, text: string, est: Estimate, included: ContextItem[] = [], dropped: ContextItem[] = []): SectionReport => ({
  name,
  cap,
  tokens: text ? est(text) : 0,
  included,
  dropped,
});

// ---------------------------------------------------------------- state block

/** IDs to list first: the scene, what the player referenced or mentioned, where they are, open threads. */
function focusIds(state: GameState, referencedIds: readonly string[], playerText: string): string[] {
  return [
    ...selectPresentNpcIds(state),
    ...referencedIds,
    ...mentionedEntityIds(state, playerText),
    ...selectLocationChain(state, selectCurrentLocationId(state)).map((l) => l.id),
    ...selectOpenThreads(state).map((t) => t.id),
  ];
}

function idLines(state: GameState, focus: readonly string[]): Map<string, string> {
  const lines = new Map<string, string>();
  const npcs = [...selectNpcs(state)].sort((a, b) => b.lastSeenDay - a.lastSeenDay || a.id.localeCompare(b.id));
  const locs = [...selectLocations(state)].sort((a, b) => b.introducedTurn - a.introducedTurn || a.id.localeCompare(b.id));
  const threads = [...selectOpenThreads(state)].sort((a, b) => b.lastTurn - a.lastTurn || a.id.localeCompare(b.id));
  const all = new Map<string, string>();
  for (const n of npcs) all.set(n.id, `${n.id} = ${n.name} (${n.role}${n.status !== 'active' ? `, ${n.status}` : ''})`);
  for (const l of locs) all.set(l.id, `${l.id} = ${l.name} (${l.kind})`);
  for (const t of threads) all.set(t.id, `${t.id} = "${t.title}" (open thread)`);
  for (const id of focus) if (all.has(id)) lines.set(id, all.get(id)!);
  for (const [id, line] of all) if (!lines.has(id)) lines.set(id, line);
  return lines;
}

export function stateBlock(
  state: GameState,
  est: Estimate,
  cap: number = CONTEXT_CAPS.state,
  focus: readonly string[] = [],
): { text: string; report: SectionReport } {
  const now = selectNow(state);
  const chain = selectLocationChain(state, selectCurrentLocationId(state));
  const present = selectPresentNpcIds(state).map((id) => `${state.npcs.byId[id]?.name ?? id} (${id})`);
  const mood = selectMoodTags(state);
  const base = [
    'STATE',
    `Character: ${selectCharacterName(state)} (${PC_REF}), age ${selectAge(state)}`,
    `Date: ${formatDate(now.day)}`,
    `Time: ${formatClock(now.second)} (${timeOfDayLabel(now.second)})`,
    `Location: ${chain.length ? chain.map((l) => `${l.name} (${l.id})`).join(', in ') : 'not recorded yet (introduce it with locationIntroduced)'}`,
    `Present: ${present.length ? present.join(', ') : 'nobody recorded'}`,
    `Pacing: ${selectPacingLevel(state)}`,
    `Scene mood: ${mood.length ? mood.join(', ') : 'not set'}`,
    'VALID SKILLS: none yet (leave skillId empty).',
    'VALID IDS (use only these, or temp keys you create in this reply):',
    `${PC_REF} = ${selectCharacterName(state)} (the player character)`,
  ];
  const lines = [...base];
  let tokens = est(lines.join('\n'));
  const included: ContextItem[] = [];
  const dropped: ContextItem[] = [];
  for (const [id, line] of idLines(state, focus)) {
    const t = est(`\n${line}`);
    if (tokens + t <= cap) {
      lines.push(line);
      tokens += t;
      included.push({ id, tokens: t });
    } else dropped.push({ id, tokens: t });
  }
  if (dropped.length) lines.push(`(${dropped.length} more known entities not listed; do not reintroduce them by name)`);
  const text = lines.join('\n');
  return { text, report: section('state', cap, text, est, included, dropped) };
}

// ---------------------------------------------------------------- recent turns

/** The turn number of a record (stored since M2; older records use their position). */
const turnOf = (r: TurnRecord, index: number): number => r.turn ?? index + 1;

/** Newest records that fit the cap (at most MAX_RAW_TURNS, never split), oldest first. */
export function historyWindow(
  records: readonly TurnRecord[],
  capTokens: number,
  est: Estimate,
): { messages: Message[]; report: SectionReport; fromTurn: number | null } {
  const out: Message[][] = [];
  const included: ContextItem[] = [];
  let used = 0;
  let fromTurn: number | null = null;
  for (let i = records.length - 1; i >= 0 && out.length < MAX_RAW_TURNS; i--) {
    const r = records[i]!;
    const pair: Message[] = [
      { role: 'user', text: `PLAYER: ${describeInput(r.input)}` },
      { role: 'model', text: r.narrative },
    ];
    const cost = pair.reduce((a, m) => a + est(m.text), 0);
    if (used + cost > capTokens) break;
    used += cost;
    out.unshift(pair);
    included.unshift({ id: `turn ${turnOf(r, i)}`, tokens: cost });
    fromTurn = turnOf(r, i);
  }
  return { messages: out.flat(), report: { name: 'recentTurns', cap: capTokens, tokens: used, included, dropped: [] }, fromTurn };
}

/** Messages only (kept for callers that do not need the report). */
export function historyMessages(records: readonly TurnRecord[], capTokens = CONTEXT_CAPS.recentTurns, est: Estimate = makeEstimator(4)): Message[] {
  return historyWindow(records, capTokens, est).messages;
}

// ---------------------------------------------------------------- resolved block

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function describeCheck(c: CheckCard): string {
  const mods = c.modifiers.map((m) => `${m.value >= 0 ? '+' : ''}${fmt(m.value)} ${m.source}`).join(', ');
  const natural = c.natural === 'nat20' ? ' (natural 20, +5)' : c.natural === 'nat1' ? ' (natural 1, -5)' : '';
  return [
    `Check: ${c.label}, difficulty ${c.difficulty} (DC ${fmt(c.dc)}).`,
    `Roll ${c.d20}${natural} + level bonus ${fmt(c.levelBonus)}${mods ? ` + modifiers (${mods})` : ''} = ${fmt(c.total)}.`,
    `Margin ${c.margin >= 0 ? '+' : ''}${fmt(c.margin)}: ${c.grade.toUpperCase()}.`,
  ].join(' ');
}

function formatSpan(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  const h = seconds / 3600;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hours`;
}

export function resolvedBlock(draft: TurnDraft): string {
  const lines = ['RESOLVED (ground truth; narrate consistently with it)'];
  if (draft.intent) lines.push(`Player action type: ${draft.intent.actionType}`);
  if (draft.checks.length === 0) lines.push('Checks: none required. Do not invent a success or failure that would need a roll.');
  for (const c of draft.checks) lines.push(describeCheck(c));
  if (draft.timeAdvanced) {
    lines.push(`Time already advanced by the engine: ${formatSpan(draft.timeAdvanced.seconds)} (${draft.timeAdvanced.reason}). Narrate that stretch; do not add more time.`);
  }
  for (const n of draft.notices) lines.push(`Notice: ${n}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------- memory, lore, arc

const clipTo = (text: string, capTokens: number, est: Estimate): string => {
  if (est(text) <= capTokens) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (est(`${text.slice(0, mid)}…`) <= capTokens) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo)}…`;
};

function memorySection(state: GameState, referencedIds: readonly string[], playerText: string, rawFromTurn: number | null, est: Estimate): { text: string; report: SectionReport } {
  const header = 'MEMORY (established in this campaign)';
  const sel = retrieveMemory(state, { referencedIds, playerText, rawFromTurn }, CONTEXT_CAPS.memory - est(header), est);
  const item = (s: (typeof sel.included)[number]): ContextItem => ({
    id: s.item.id,
    tokens: s.tokens,
    score: Math.round(s.score * 10) / 10,
    note: [s.pinned ? 'pinned' : '', s.matched.length ? `matches ${s.matched.join(', ')}` : ''].filter(Boolean).join('; ') || 'recent',
  });
  if (sel.included.length === 0) return { text: '', report: section('memory', CONTEXT_CAPS.memory, '', est, [], sel.dropped.map(item)) };
  const text = [header, ...sel.included.map((s) => `- ${s.pinned ? '[pinned] ' : ''}${s.item.text}`)].join('\n');
  return { text, report: section('memory', CONTEXT_CAPS.memory, text, est, sel.included.map(item), sel.dropped.map(item)) };
}

function loreSection(
  state: GameState,
  referencedIds: readonly string[],
  playerText: string,
  est: Estimate,
  index: LoreIndex,
): { text: string; report: SectionReport } {
  const header = 'LORE (Star Wars Legends, true at this date)';
  const ids = new Set([...selectPresentNpcIds(state), ...referencedIds]);
  const npcs = [...ids].map((id) => state.npcs.byId[id]).filter((n) => n !== undefined);
  const chain = selectLocationChain(state, selectCurrentLocationId(state));
  const locationNames = new Set<string>();
  for (const l of chain) for (const n of [l.name, ...l.aliases, l.region]) if (n) locationNames.add(normalizeText(n));
  const sel = retrieveLore(
    index,
    {
      year: dateFromAbsDay(selectNow(state).day).year,
      canonIds: npcs.map((n) => n.canonId).filter((c): c is string => c !== null),
      names: npcs.map((n) => normalizeAlias(n.name)),
      locationNames: [...locationNames],
      playerText: normalizeText(playerText),
    },
    CONTEXT_CAPS.lore - est(header),
    est,
  );
  const item = (s: (typeof sel.included)[number]): ContextItem => ({ id: s.chunk.id, tokens: s.tokens, score: s.score, note: s.why.join('; ') });
  if (sel.included.length === 0) return { text: '', report: section('lore', CONTEXT_CAPS.lore, '', est, [], sel.dropped.map(item)) };
  const text = [header, ...sel.included.map((s) => s.chunk.text)].join('\n\n');
  return { text, report: section('lore', CONTEXT_CAPS.lore, text, est, sel.included.map(item), sel.dropped.map(item)) };
}

function arcSection(state: GameState, est: Estimate): { text: string; report: SectionReport } {
  const arc = selectArc(state);
  if (!arc) return { text: '', report: section('arc', CONTEXT_CAPS.arc, '', est) };
  const text = clipTo(`ARC (the story so far)\n${arc.text}`, CONTEXT_CAPS.arc, est);
  return { text, report: section('arc', CONTEXT_CAPS.arc, text, est, [{ id: arc.atChapter, tokens: est(text) }]) };
}

// ---------------------------------------------------------------- requests

export function narrativeSystemPrompt(state: GameState, opening: boolean): string {
  const level = selectPacingLevel(state);
  const pacing = level === 'scene' ? PROMPTS.pacing.scene : PROMPTS.pacing.moment;
  return [PROMPTS.coreGm, PROMPTS.contract, pacing, ...(opening ? [PROMPTS.opening] : [])].join('\n\n');
}

/** The player's own words for this turn (scanned for names; D-85). */
export function playerTextOf(input: TurnInput): string {
  return input.kind === 'typed' ? input.text : input.kind === 'choice' ? input.choice.label : input.premise;
}

export function buildNarrativeRequest(state: GameState, draft: TurnDraft, input: TurnInput, history: readonly TurnRecord[], opts: BuildOptions): BuiltRequest {
  const est = makeEstimator(opts.ratio);
  const system = narrativeSystemPrompt(state, input.kind === 'opening');
  const referenced = draft.intent ? [...draft.intent.targets, ...draft.intent.references] : [];
  const playerText = playerTextOf(input);

  const recent = historyWindow(history, CONTEXT_CAPS.recentTurns, est);
  const st = stateBlock(state, est, CONTEXT_CAPS.state, focusIds(state, referenced, playerText));
  const arc = arcSection(state, est);
  const mem = memorySection(state, referenced, playerText, recent.fromTurn, est);
  const lore = loreSection(state, referenced, playerText, est, opts.lore ?? LORE_INDEX);
  const resolved = resolvedBlock(draft);
  const playerLine = input.kind === 'opening' ? `OPENING${input.premise ? `\nPlayer premise: ${input.premise}` : ''}` : `PLAYER ACTION: ${describeInput(input)}`;

  const finalText = [st.text, arc.text, mem.text, lore.text, resolved, playerLine].filter(Boolean).join('\n\n');
  const messages: Message[] = [...recent.messages, { role: 'user', text: finalText }];
  const sections: SectionReport[] = [
    section('gmRules', CONTEXT_CAPS.gmRules, system, est, [{ id: input.kind === 'opening' ? 'core-gm + contract + pacing + opening' : 'core-gm + contract + pacing', tokens: est(system) }]),
    st.report,
    recent.report,
    mem.report,
    lore.report,
    arc.report,
    section('resolved', null, resolved, est),
    section('input', null, playerLine, est),
  ];
  return { system, messages, report: finishReport('narrative', opts, sections, system, messages) };
}

export function buildIntentRequest(state: GameState, text: string, history: readonly TurnRecord[], opts: BuildOptions): BuiltRequest {
  const est = makeEstimator(opts.ratio);
  const system = PROMPTS.intent;
  const st = stateBlock(state, est, CONTEXT_CAPS.state, focusIds(state, [], text));
  const last = history[history.length - 1];
  const lastNarrative = `LAST NARRATION (for context):\n${last ? last.narrative.slice(-1500) : '(no previous turn)'}`;
  const input = `PLAYER INPUT:\n${text}`;
  const messages: Message[] = [{ role: 'user', text: [st.text, lastNarrative, input].join('\n\n') }];
  const sections: SectionReport[] = [
    section('gmRules', CONTEXT_CAPS.gmRules, system, est, [{ id: 'intent', tokens: est(system) }]),
    st.report,
    section('recentTurns', CONTEXT_CAPS.recentTurns, lastNarrative, est, last ? [{ id: `turn ${turnOf(last, history.length - 1)} (last 1500 chars)`, tokens: est(lastNarrative) }] : []),
    section('input', null, input, est),
  ];
  return { system, messages, report: finishReport('intent', opts, sections, system, messages) };
}

/** The summary call input (D-57): previous arc, the chapter's entities, and its turns clipped evenly to fit. */
export function buildSummaryRequest(state: GameState, chapter: Chapter, records: readonly TurnRecord[], opts: BuildOptions): BuiltRequest {
  const est = makeEstimator(opts.ratio);
  const system = PROMPTS.chapterSummary;
  const arc = selectArc(state);
  const tags = new Set([...chapter.entityIds, ...chapter.locationIds, ...chapter.threadIds]);
  const cards = memoryItems(state, null).filter((i) => i.kind !== 'fact' && i.kind !== 'chapter' && tags.has(i.id));
  const facts = memoryItems(state, null).filter((i) => i.kind === 'fact' && i.turn >= chapter.turnRange[0] && i.turn <= chapter.turnRange[1]);
  const head = [
    `ARC (previous)\n${arc ? arc.text : 'none (this is the first chapter)'}`,
    `CHAPTER: turns ${chapter.turnRange[0]}-${chapter.turnRange[1]}, ${formatDate(chapter.dayRange[0])} to ${formatDate(chapter.dayRange[1])} (closed: ${chapter.closeReason})`,
    `PEOPLE, PLACES AND THREADS\n${cards.length ? cards.map((c) => `- ${c.text}`).join('\n') : 'none recorded'}`,
    ...(facts.length ? [`FACTS LEARNED\n${facts.map((f) => `- ${f.text}`).join('\n')}`] : []),
  ].join('\n\n');

  const turns = records.map((r, i) => ({ turn: turnOf(r, i), player: describeInput(r.input), gm: r.narrative })).filter((t) => t.turn >= chapter.turnRange[0] && t.turn <= chapter.turnRange[1]);
  const budget = SUMMARY_INPUT_CAP_TOKENS - est(head) - est(system);
  const full = turns.reduce((a, t) => a + est(t.gm) + est(t.player) + 10, 0);
  const share = full > budget && turns.length ? Math.max(40, Math.floor(budget / turns.length) - 20) : Infinity;
  const turnText = turns.map((t) => `Turn ${t.turn}\nPLAYER: ${t.player}\nGM: ${share === Infinity ? t.gm : clipTo(t.gm, share, est)}`).join('\n\n');
  const text = `${head}\n\nTURNS\n${turnText}`;
  const messages: Message[] = [{ role: 'user', text }];
  const sections: SectionReport[] = [
    section('gmRules', CONTEXT_CAPS.gmRules, system, est, [{ id: 'chapter-summary', tokens: est(system) }]),
    section('memory', null, head, est, cards.map((c) => ({ id: c.id, tokens: est(c.text) }))),
    section('recentTurns', SUMMARY_INPUT_CAP_TOKENS, turnText, est, turns.map((t) => ({ id: `turn ${t.turn}`, tokens: est(t.gm), ...(share !== Infinity ? { note: 'clipped' } : {}) }))),
  ];
  return { system, messages, report: finishReport('summary', opts, sections, system, messages) };
}
