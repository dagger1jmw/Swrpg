// Context building (architecture §5, M2): prompt sections + state + recent raw turns + memory +
// lore + arc, each section held to its token cap (src/ai/context.config.ts), with a per-section
// report for the debug view. Pure; never mutates state. Replaces the minimal M1 builder (D-74).
import { CONTEXT_CAPS, JUMP_CAPS, JUMP_REPORT_MAX_EVENTS, JUMP_REPORT_MAX_SKILLS, HISTORY_NARRATIVE_MAX_CHARS, MAX_RAW_TURNS, SUMMARY_INPUT_CAP_TOKENS, type SectionName } from '../ai/context.config';
import type { MontageReport } from '../state/montageReport';
import { selectUntoldWorldEvents } from '../features/world/selectors';
import { PROMPTS } from '../ai/prompts';
import type { CallType, Message } from '../ai/provider';
import { makeEstimator } from '../ai/tokenRatio';
import { normalizeAlias, normalizeText } from '../engine/aliases';
import { dateFromAbsDay, formatClock, formatDate, timeOfDayLabel } from '../engine/calendar';
import { orderSeatAt } from '../data/orderSeats';
import { controlAt, leadersAt } from '../data/worldControl';
import { placementsAt } from '../data/canonPlacements';
import { eraRulesAt } from '../data/eraRules';
import { CANON_BY_ID } from '../data/canonNpcs';
import { canonOffBoard } from '../engine/canonRoster';
import { findCanonEntity } from '../lore/retrieve';
import { FATE_ACT_NOTE, NARRATION_LENGTH, STRIKE_AT, SUBDUE_TEXT, type SubdueMode } from '../data/combat.config';
import { selectIsDying, selectIsSpent, selectLasting, selectStatusLabel, selectWounds } from '../features/health/selectors';
import type { CombatDraft } from './combatTurn';
import { combatFacts, fightHighlights, narrationParagraphs, weaponText } from './combatFacts';
import { partText } from '../engine/duel';
import { lastingState, type LastingInjury, type LastingState } from '../engine/lasting';
import type { Wound } from '../engine/wounds';
import type { CheckCard } from '../engine/rolls';
import { ACTIVITIES } from '../data/activities';
import { archetypeDef } from '../data/archetypes';
import { SKILL_BY_ID, SKILL_IDS } from '../data/skills';
import { speciesDef } from '../data/species';
import { PC_REF, selectAge, selectCharacter, selectCharacterName, selectIsTestCharacter } from '../features/character/selectors';
import { pendingScenario } from './devScenario';
import { selectFatigue } from '../features/health/selectors';
import { selectGriefMult, selectSkillViews, selectStateOfMind, selectTierBeats } from '../features/progression/selectors';
import { selectRankName } from '../features/ranks/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectCurrentLocationId, selectLocationChain, selectLocations } from '../features/locations/selectors';

import { selectArc, type Chapter } from '../features/memory/selectors';
import { selectNpcs } from '../features/npcs/selectors';
import { selectMoodTags, selectPacingLevel, selectPresentNpcIds, selectSettlingIn, selectStaleness } from '../features/pacing/selectors';
import type { PacingLevel } from '../data/pacing.config';
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
  /** A retry after the narration check (D-197): the contradictions found in the discarded narration. */
  correction?: readonly string[];
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

const npcLasting = (n: { health?: unknown }): LastingState => {
  const h = n.health as { wounds?: Wound[]; lasting?: LastingInjury[] } | null | undefined;
  return lastingState(h?.wounds ?? [], h?.lasting ?? []);
};

/**
 * The lasting state of everyone the narration may be about (D-237): the player character, the NPCs present, and the
 * NPCs whose fate is being chosen. Read by the narration check; only those with something missing are listed.
 */
export function lastingStates(state: GameState): { name: string; pc: boolean; cannotStand: boolean; missing: string[] }[] {
  const out: { name: string; pc: boolean; cannotStand: boolean; missing: string[] }[] = [];
  const own = lastingState(selectWounds(state), selectLasting(state));
  if (own.missing.length) out.push({ name: selectCharacterName(state), pc: true, cannotStand: own.cannotStand, missing: own.missing });
  const ids = new Set([...selectPresentNpcIds(state), ...state.combat.fates.map((f) => f.npcId)]);
  for (const id of ids) {
    const n = state.npcs.byId[id];
    if (!n) continue;
    const l = npcLasting(n);
    if (l.missing.length) out.push({ name: n.name, pc: false, cannotStand: l.cannotStand, missing: l.missing });
  }
  return out;
}

function idLines(state: GameState, focus: readonly string[]): Map<string, string> {
  const lines = new Map<string, string>();
  const npcs = [...selectNpcs(state)].sort((a, b) => b.lastSeenDay - a.lastSeenDay || a.id.localeCompare(b.id));
  const locs = [...selectLocations(state)].sort((a, b) => b.introducedTurn - a.introducedTurn || a.id.localeCompare(b.id));
  const threads = [...selectOpenThreads(state)].sort((a, b) => b.lastTurn - a.lastTurn || a.id.localeCompare(b.id));
  const all = new Map<string, string>();
  // Lasting state travels with the NPC into later scenes (D-237): a spared or captured fighter keeps a missing limb.
  for (const n of npcs) all.set(n.id, `${n.id} = ${n.name} (${n.role}${n.status !== 'active' ? `, ${n.status}` : ''}${npcLasting(n).text.length ? `; ${npcLasting(n).text.join('; ')}` : ''})`);
  for (const l of locs) all.set(l.id, `${l.id} = ${l.name} (${l.kind})`);
  for (const t of threads) all.set(t.id, `${t.id} = "${t.title}" (open thread)`);
  for (const id of focus) if (all.has(id)) lines.set(id, all.get(id)!);
  for (const [id, line] of all) if (!lines.has(id)) lines.set(id, line);
  return lines;
}

const PATH_LABEL: Record<string, string> = { jedi: 'Jedi', sith: 'Sith', outsider: 'Force-sensitive outsider', career: 'non-Force career' };

function characterLine(state: GameState): string {
  const c = selectCharacter(state);
  const trained = c.trainingStartAge === null ? 'untrained' : `${archetypeDef(c.archetype).name}, trained since age ${Math.round(c.trainingStartAge)}`;
  return `${speciesDef(c.speciesId).name}, ${PATH_LABEL[c.path] ?? c.path}, rank ${selectRankName(state)}, ${trained}`;
}

/** Tiredness labels and the state of mind (labels only; numbers stay in the engine). */
function conditionLine(state: GameState): string {
  const f = selectFatigue(state);
  const grief = selectGriefMult(state) < 1 ? ', grieving' : '';
  return `Condition: physical ${f.labels.p}, mental ${f.labels.m}, Force ${f.labels.f}; state of mind ${selectStateOfMind(state)}${grief}`;
}

/** Health (health §6): the derived status, wounds and lasting injuries, dying or dead. No numbers but the status label. */
function healthLine(state: GameState): string {
  if (state.health.death) return `Health: DEAD (${state.health.death.cause}). The story of this character has ended.`;
  const wounds = selectWounds(state);
  const parts = wounds.map((w) => `${w.stabilized && w.severity === 'mortal' ? 'stabilized critical' : w.severity} ${w.part}`);
  const lasting = selectLasting(state).map((l) => `${l.kind} (${Math.round(l.adaptation * 100)}% adapted)`);
  const dying = selectIsDying(state) ? '; DYING unless stabilized' : '';
  return `Health: ${selectStatusLabel(state)}${selectIsSpent(state) ? ', spent' : ''}${parts.length ? `; wounds: ${parts.join(', ')}` : ''}${lasting.length ? `; lasting injuries: ${lasting.join(', ')}` : ''}${dying}`;
}

/** A fight in progress (rolls §3): who is fighting whom, their status and the advantage. */
/** How long after a capture the scene still carries the captors (D-242), unless the player has moved. Design default. */
export const CAPTIVE_LINE_SECONDS = 24 * 3600;

/** The captors of the last fight, while the player is still their prisoner here (D-242), or null. */
export function selectCaptors(state: GameState): { group: string; kind: string | null; names: readonly string[]; weapon?: string | undefined } | null {
  const last = state.combat.last;
  const c = last?.playerFate === 'captured' ? last.captors : null;
  if (!c || state.combat.active) return null;
  const now = selectNow(state).day * 86_400 + selectNow(state).second;
  if (now - c.atAbs > CAPTIVE_LINE_SECONDS || (c.locationId ?? null) !== (state.locations.currentId ?? null)) return null;
  return c;
}

function captiveLine(state: GameState): string | null {
  const c = selectCaptors(state);
  return c ? `CAPTIVE: the player character was captured by ${c.group}${c.kind ? ` (${c.names.join(', ')})` : ''}${c.weapon ? `, armed with ${c.weapon} and no other weapons` : ''} in the last fight. Name these captors, and no other kind of soldier or droid, until the story frees the character. A blow from a captor is a story event only: it does not wound the character.` : null;
}

function combatLine(state: GameState): string | null {
  const a = state.combat.active;
  if (!a) return state.combat.pending ? 'COMBAT: a fight is about to begin (the engine resolves it this turn).' : null;
  const d = a.duel as { a: { name: string }; opponents: { name: string; out: boolean; engagedElsewhere: boolean }[]; advantage: number; exchange: number };
  const opp = d.opponents.map((o) => `${o.name}${o.out ? ' (out)' : o.engagedElsewhere ? ' (fighting an ally)' : ''}`).join(', ');
  const track = d.advantage > 0 ? 'the player character has the upper hand' : d.advantage < 0 ? 'the opponent has the upper hand' : 'even';
  return `COMBAT (${a.stakes}${a.sparring ? `, ${a.sparring} sparring` : ''}): ${d.a.name} against ${opp}; ${d.exchange} exchanges so far; ${track}.${a.truceOffer ? ` A truce is on offer (${a.truceOffer}); the player has not answered.` : ''}`;
}

/** The character's skills by tier, strongest first (tiers only; the RESOLVED block carries any numbers). */
function skillsLine(state: GameState): string {
  const views = selectSkillViews(state)
    .filter((v) => v.level >= 1)
    .sort((a, b) => b.levelExact - a.levelExact)
    .slice(0, 14);
  return `Skills by tier: ${views.length ? views.map((v) => `${v.name} ${v.tier}`).join(', ') : 'none trained'}`;
}

function beatsLines(state: GameState): string[] {
  const beats = selectTierBeats(state);
  if (!beats.length) return [];
  return [
    `Pending milestone beats (let the scene acknowledge one, e.g. a master's recognition, then send milestoneBeatAcknowledged): ${beats
      .map((b) => `${b.id} = ${SKILL_BY_ID.get(b.skillId)?.name ?? b.skillId} reached ${b.tier}`)
      .join('; ')}`,
  ];
}

/** Activity ids for the intent call (skills-and-activities.md §4); the engine checks unlocks. */
export function activitiesLine(): string {
  return `VALID ACTIVITIES (for train or study; id = name): ${ACTIVITIES.map((a) => `${a.id} = ${a.name}`).join('; ')}`;
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
    `Character: ${selectCharacterName(state)} (${PC_REF}), age ${selectAge(state)}, ${characterLine(state)}`,
    conditionLine(state),
    healthLine(state),
    ...(combatLine(state) ? [combatLine(state)!] : []),
    ...(captiveLine(state) ? [captiveLine(state)!] : []),
    skillsLine(state),
    ...beatsLines(state),
    `Date: ${formatDate(now.day)}`,
    `Jedi Order: ${orderSeatAt(dateFromAbsDay(now.day).year) ?? 'no standing Temple at this date'}`,
    ...worldLines(-dateFromAbsDay(now.day).year, chain.flatMap((l) => [l.name, ...l.aliases, l.region ?? ''].filter(Boolean))),
    ...boardLines(state, -dateFromAbsDay(now.day).year, chain.flatMap((l) => [l.name, ...l.aliases, l.region ?? ''].filter(Boolean))),
    `Time: ${formatClock(now.second)} (${timeOfDayLabel(now.second)})`,
    `Location: ${chain.length ? chain.map((l) => `${l.name} (${l.id})`).join(', in ') : 'not recorded yet (introduce it with locationIntroduced)'}`,
    `Present: ${present.length ? present.join(', ') : 'nobody recorded'}`,
    `Pacing: ${selectPacingLevel(state)}`,
    ...storyFlowLines(state),
    `Scene mood: ${mood.length ? mood.join(', ') : 'not set'}`,
    `VALID SKILLS: ${SKILL_IDS.join(', ')}`,
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
    // Dev sandbox commands are not story (D-180); a pending /scenario reaches the narrator as its own block.
    if (r.input.kind === 'dev') continue;
    const pair: Message[] = [
      { role: 'user', text: `PLAYER: ${describeInput(r.input)}` },
      { role: 'model', text: clipNarrative(r.narrative) },
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

/** A turn's narration as the history carries it (D-209): never more than HISTORY_NARRATIVE_MAX_CHARS. */
export function clipNarrative(text: string): string {
  if (text.length <= HISTORY_NARRATIVE_MAX_CHARS) return text;
  const cut = text.lastIndexOf(' ', HISTORY_NARRATIVE_MAX_CHARS);
  return `${text.slice(0, cut > 0 ? cut : HISTORY_NARRATIVE_MAX_CHARS)} (...)`;
}

/** Messages only (kept for callers that do not need the report). */
export function historyMessages(records: readonly TurnRecord[], capTokens = CONTEXT_CAPS.recentTurns, est: Estimate = makeEstimator(4)): Message[] {
  return historyWindow(records, capTokens, est).messages;
}

/**
 * Story flow for the narrator (architecture §8): settling-in, staleness (the choices must then include a
 * forward jump tied to a story hook, D-18), thread deadlines (D-135) and world events to tell (D-136).
 */
function storyFlowLines(state: GameState): string[] {
  const lines: string[] = [];
  const settling = selectSettlingIn(state);
  const stale = selectStaleness(state);
  if (settling.active) lines.push(`Settling in: ${settling.daysLeft} more days at this new place. Favor moment pacing; do not suggest skipping ahead.`);
  else if (stale.stale) lines.push(`STALE: ${stale.days} days here with nothing new. The choices must include at least one forward jump (pacingHint montage or timeSkip) tied to a story hook.`);
  const due = selectOpenThreads(state).filter((t) => t.escalation > 0);
  for (const t of due) lines.push(`Deadline: "${t.title}" (${t.id}) ${t.escalation === 3 ? 'is overdue' : t.escalation === 2 ? 'is due today' : 'is due soon'}.`);
  const untold = selectUntoldWorldEvents(state);
  if (untold.length) {
    const list = untold.map((e) => `${e.significant ? '[significant] ' : ''}${e.summary}${e.refs.length ? ` (${e.refs.join(', ')})` : ''}`).join('; ');
    lines.push(`World events to tell (engine-rolled; narrate them, invent no outcome beyond them): ${list}`);
  }
  return lines;
}

// ---------------------------------------------------------------- resolved block

/** The montage / time-skip report as ground truth for the narration (training-routines §8). */
export function describeJump(r: MontageReport): string[] {
  const name = r.level === 'montage' ? 'MONTAGE REPORT' : 'TIME SKIP REPORT';
  const lines = [
    `${name}: ${r.fromLabel} to ${r.toLabel}, ${r.daysCompleted} of ${r.requestedDays} days (${r.trainingDays} training day${r.trainingDays === 1 ? '' : 's'}, ${r.restDays} rest or recovery day${r.restDays === 1 ? '' : 's'}, ${r.hoursTrained} hours of training).`,
  ];
  if (r.interrupted) lines.push(`Interrupted on ${r.interrupted.label}: ${r.interrupted.reason}. End the narration at the moment this begins.`);
  const skills = r.skills.slice(0, JUMP_REPORT_MAX_SKILLS).map((s) => `${s.name} ${s.levelBefore === s.levelAfter ? `${s.levelAfter} (progress)` : `${s.levelBefore} -> ${s.levelAfter}`}`);
  if (skills.length) lines.push(`Growth: ${skills.join(', ')}.`);
  if (r.breakthroughs) lines.push(`Breakthrough sessions: ${r.breakthroughs}.`);
  if (r.rust.gained.length) lines.push(`Getting rusty: ${r.rust.gained.map((x) => SKILL_BY_ID.get(x.skillId)?.name ?? x.skillId).join(', ')}.`);
  if (r.relationships.length) lines.push(`Relationships: ${r.relationships.map((x) => `${x.name} (${x.npcId}) ${x.to > x.from ? 'closer' : 'more distant'}`).join(', ')}.`);
  const events = r.events.slice(0, JUMP_REPORT_MAX_EVENTS);
  if (events.length) lines.push(`Events: ${events.map((e) => `${e.label}: ${e.text}${e.significant ? ' [significant]' : ''}`).join('; ')}.`);
  if (r.adjustments.length) lines.push(`Routine adjustments: ${r.adjustments.slice(0, 5).map((a) => `${a.note} (${a.days} days)`).join('; ')}.`);
  return lines;
}


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
  if (seconds >= 2 * 86_400) return `${Math.round(seconds / 86_400)} days`;
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  const h = seconds / 3600;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hours`;
}

export function describeTraining(t: NonNullable<TurnDraft['training']>): string[] {
  if (!t.ok) return [`Training refused by the engine: ${t.reason}. The character makes no progress at it this turn; narrate why it does not happen (or what they do instead).`];
  const c = t.card;
  const name = (id: string): string => SKILL_BY_ID.get(id)?.name ?? id;
  const lines = [
    `Training: ${c.activityName}, ${formatSpan(Math.round(c.hours * 3600))} at ${c.intensity} intensity, ${c.drillName} drills. Session outcome: ${c.outcome}${c.outcome === 'breakthrough' ? ' (a real breakthrough)' : ''}.`,
    `Progress: ${c.levels.map((l) => (l.after > l.before ? `${name(l.skillId)} improved to ${l.after} (${l.tier})` : `${name(l.skillId)} steady at ${l.after} (${l.tier})`)).join('; ')}.`,
    `Tiredness afterwards: physical ${c.tiredness.p}, mental ${c.tiredness.m}.`,
  ];
  for (const l of c.levels) for (const t2 of [21, 41, 61, 81, 101, 151]) if (l.before < t2 && l.after >= t2) lines.push(`Milestone: ${name(l.skillId)} crossed into a new tier (${l.tier}).`);
  return lines;
}

/**
 * The combat block (D-145; rewritten by D-197): an explicit outcome list. Per exchange HIT (target, location, severity)
 * or NO HIT; per step DONE, FAILED (reason) or NOT REACHED; a "Did not happen" line; each fighter's weapon. The
 * narrator may describe nothing that is not here.
 */
export function describeCombat(c: CombatDraft): string[] {
  const facts = combatFacts(c);
  const lines = [`COMBAT ${c.fightId}${c.started ? ' (the fight begins now)' : ''}: the outcome list. Narrate these exchanges in order, nothing more and nothing different.`];
  lines.push(`Weapons (the only ones in this fight): ${c.fighters.map((f) => `${f.name}: ${f.weaponName ? `an ${f.weaponName}, ` : ''}${weaponText(f.weapon)}${f.bladeColor ? `, ${f.bladeColor} blade` : ''}${f.form ? ` (${SKILL_BY_ID.get(f.form)?.name ?? f.form})` : ''}`).join('; ')}.`);
  // Armor as the engine has it (D-216; pass 2 gave an unarmored Jedi "your armor"): nobody wears what is not listed.
  if (c.fighters.some((f) => f.armor !== undefined)) lines.push(`Armor (the only armor in this fight): ${c.fighters.map((f) => `${f.name}: ${!f.armor || f.armor === 'none' ? 'none' : `${f.armorName ? `${f.armorName}, ` : ''}${f.armor}${f.saberResistant ? ' (saber-resistant: a lightsaber does not cut through it easily)' : ''}`}`).join('; ')}.`);
  // Strike intent (D-260): what each opponent is trying to do; the hits in the list already follow it.
  const INTENT_TEXT: Readonly<Record<string, string>> = { kill: 'strikes to kill (torso and head)', disarm: 'strikes to disarm (the weapon hand and the limbs)' };
  // A capturing fighter subdues (D-262): its hits drain stamina and never wound; it takes the player when Spent.
  const intents = c.fighters.filter((f) => f.intent).map((f) => `${f.name} ${f.intent === 'capture' ? `fights to capture: subdues with ${SUBDUE_TEXT[f.subdue as SubdueMode]?.means ?? 'stun attacks'} (no wounds; takes ${c.fighters[0]?.name ?? 'the player'} captive when Spent)` : (INTENT_TEXT[f.intent!] ?? `strikes to ${f.intent}`)}`);
  if (intents.length) lines.push(`Intent: ${intents.join('; ')}.`);
  // Outside the Force (D-192; pass 5 issue 12: "Use a Force push to create space" offered against the Vong).
  const outside = c.fighters.filter((f) => f.outsideForce && !f.out).map((f) => f.name);
  if (outside.length) lines.push(`Outside the Force: ${outside.join(', ')}. No Force push, choke, lightning or mind trick can touch them (a thrown object or a thrown saber still can): offer no such choice against them.`);
  // Cover between shooters (D-243; pass 4 issue 7: the narrated beat in the ruins put nobody behind anything).
  if (c.cover) lines.push('Cover: the shooters on both sides fire from behind cover (the terrain has it); show them using it.');
  lines.push(...facts.lines);
  // A long passage (D-242, D-271; passes 3 and 5: 46 and 51 exchanges told as their aftermath): the highlights that
  // carry the fight's arc, and how long to tell it.
  if (c.narrate.length >= NARRATION_LENGTH.highlightsFrom) {
    const key = fightHighlights(c, facts);
    if (key.length) lines.push(`Highlights (tell each one, in order; they are the fight's arc): ${key.join('; ')}.`);
    const p = narrationParagraphs(c.narrate.length);
    // M5 final check: "about 4 paragraphs" came back as one paragraph three times. The count, the words and the blank
    // lines are spelled out, and the line overrides the pacing's usual length.
    const [lo, hi] = NARRATION_LENGTH.wordsPerParagraph;
    lines.push(
      p === 1
        ? `Length: one full paragraph (${lo} to ${hi} words) for these ${c.narrate.length} exchanges. Tell the fight itself first, as it happened, and only then ${c.ended ? 'its end and the aftermath' : 'where it stands now'}.`
        : `Length: ${p} paragraphs for these ${c.narrate.length} exchanges, separated by blank lines, ${lo} to ${hi} words each (${p * lo} to ${p * hi} words in all); this overrides the pacing's usual length. Not one paragraph: the first ${p - 1} tell the fight itself, as it happened, in order; the last tells ${c.ended ? 'how it was decided and the aftermath' : 'where it stands now'}.`,
    );
  }
  if (facts.steps.length) lines.push(`Steps the player asked for: ${facts.steps.map((s) => `step ${s.index + 1} ${s.label}: ${s.status} (${s.detail})`).join('; ')}.`);
  for (const n of c.notes.filter((x) => x.startsWith('intent step'))) lines.push(`Sequence: ${n}`);
  lines.push(`Hits in this passage: ${facts.hits.length ? facts.hits.map((h) => `#${h.n} on ${h.targetName} (${h.stun ? `${h.stun}: no wound, no place` : `${partText(h.part)}, ${h.severed ? 'severed' : h.severity ? `${h.severity} wound` : 'no wound'}`})`).join('; ') : 'NONE: nobody was hit, wounded or touched'}.`);
  if (facts.didNotHappen.length) lines.push(`Did not happen (never describe these as happening): ${facts.didNotHappen.join('; ')}.`);
  lines.push(`Now: ${c.fighters.map((f) => `${f.name} ${f.status}${f.lasting?.text.length ? ` (${f.lasting.text.join('; ')})` : f.lostParts.length ? ` (lost: ${f.lostParts.map(partText).join(', ')})` : ''}`).join('; ')}.`);
  // Lasting state (D-237): nobody stands on a leg that is gone or uses an arm that is gone, now or later.
  if (c.fighters.some((f) => f.lasting?.text.length)) lines.push('A fighter who cannot stand stays down: no standing up, walking, kicking or being helped to their feet. A missing arm or hand is not used.');
  // Who is still standing (D-237; pass 3: "the surviving Mandalorian" with two warriors up).
  const standing = c.fighters.filter((f) => f.id !== 'pc' && !f.out && !f.engagedElsewhere);
  if (c.fighters.length > 2) lines.push(`Opponents still standing: ${standing.length}${standing.length ? ` (${standing.map((f) => f.name).join(', ')})` : ''}. Never write "the last", "the surviving" or "the only one left" unless exactly one stands.`);
  // Morale (D-256): who broke in this passage, and how; they are out of the fight and are told as such.
  const broke = c.narrate.flatMap((r) => r.notes.filter((n) => /'s morale breaks: /.test(n)).map((n) => `#${r.n} ${n.replace(/'s morale breaks: /, ' ').replace(/, out of the fight$/, '')}`));
  if (broke.length) lines.push(`Morale: ${broke.join('; ')}. Each is out of the fight: tell the surrender or the flight as it happened, no more blows on them.`);
  // Who has the upper hand now (issue 19: "the droids press their advantage" while the player held +3).
  if (!c.ended) lines.push(`Advantage now: ${advantageText(c)}.`);
  // How a sparring bout ended (issue 19: a bout-ending hit softened and the loss left out).
  const point = [...c.narrate].reverse().find((r) => r.hit?.point);
  if (point && c.session) lines.push(`Bout result: ${point.hit!.by === 'A' ? `${c.fighters[0]?.name ?? 'the player character'} WON the bout with a clean touch` : `${c.fighters.find((f) => f.id === point.targetId)?.name ?? 'the opponent'} scored the clean touch and ${c.fighters[0]?.name ?? 'the player character'} LOST the bout`}. Say so plainly.`);
  // Terrain accidents (D-144, D-184): ground truth like the exchanges.
  for (const n of c.notes.filter((x) => x.startsWith('terrain: '))) lines.push(`Terrain accident: ${n.slice(9)}.`);
  if (c.session) {
    const s = c.session;
    lines.push(`Sparring session: ${s.won + s.lost + s.unfinished} bouts so far, ${s.won} won, ${s.lost} lost${s.unfinished ? `, ${s.unfinished} unfinished` : ''}${s.ended ? `; the session ended (${s.ended === 'exchanges' ? 'time' : s.ended})` : ''}. ${c.ended ? 'Summarize the whole session from the highlights above: bouts won and lost, the telling moments' : c.beat === 'boutEnded' ? `Narrate the bout that just ended. The session goes on (D-181): after a short breather bout ${s.won + s.lost + s.unfinished + 1} begins. Do not send combatEnded` : `Bout ${s.won + s.lost + s.unfinished + 1} is in progress`}${s.injuries.length ? `, and the accident: ${s.injuries.join('; ')}` : ''}.`);
  }
  if (c.ended) lines.push(`The fight is over: ${c.ended.outcome} (${c.ended.reason})${c.ended.playerFate ? `; the opponent's choice: ${c.ended.playerFate}` : ''}. The choices are story choices again (what the character does next), not tactical moves.`);
  // Who took the player (D-242; pass 3: "the remaining war droids" seized a Padawan whom line troopers had captured).
  if (c.ended?.captors) lines.push(`Captured by: ${c.ended.captors.group}${c.ended.captors.kind ? ` (${c.ended.captors.names.join(', ')}, still standing)` : ''}. Name these captors and no others.`);
  // Only for a fight still going (pass 5 issue 6: every ended fight without captors got this line too).
  if (!c.ended) lines.push('The fight goes on: end at the last exchange, at the moment the player chooses again.');
  return lines;
}

/** The advantage track in words for the narrator. */
function advantageText(c: CombatDraft): string {
  const pc = c.fighters[0]?.name ?? 'the player character';
  const last = c.narrate[c.narrate.length - 1];
  const opp = (last && c.fighters.find((f) => f.id === last.targetId)?.name) ?? 'the opponents';
  const a = c.advantage;
  if (a === 0) return 'even: neither side has the upper hand';
  const who = a > 0 ? pc : opp;
  return `${who} has the upper hand (${Math.abs(a)} of 5${Math.abs(a) >= STRIKE_AT ? ', and holds the strike' : ''}); do not describe the other side pressing an advantage`;
}

/** The care the engine applied this turn (careStarted, woundsStabilized), or a plain "none". */
export function careApplied(draft: TurnDraft): string[] {
  const out: string[] = [];
  for (const a of draft.applied) {
    const e = a.event as { type?: string; kind?: string; by?: string };
    if (e.type === 'careStarted') out.push(e.kind === 'bacta' ? 'bacta' : e.kind === 'forceHealer' ? 'forceHealer' : 'medical');
    if (e.type === 'woundsStabilized') out.push('stabilized');
  }
  return out;
}
const CARE_TEXT: Readonly<Record<string, string>> = { medical: 'ordinary medical care (a medic, medpacs, a medcenter bed)', bacta: 'a bacta tank', forceHealer: 'a Force healer', stabilized: 'the wounds were stabilized' };
function careLine(draft: TurnDraft): string {
  const care = [...new Set(careApplied(draft))];
  return care.length
    ? `Care applied this turn: ${care.map((c) => CARE_TEXT[c] ?? c).join('; ')}. Describe no other treatment (no bacta, no Force healing) unless it is listed here.`
    : 'Care applied this turn: none. Wounds heal only by rest and time: describe no bacta, kolto, medpacs, medics or Force healing treating the character.';
}

export function resolvedBlock(draft: TurnDraft, correction: readonly string[] = []): string {
  const lines = ['RESOLVED (ground truth; narrate consistently with it)'];
  // A retry after the narration check (D-197): the contradictions to remove.
  if (correction.length) lines.push(`CORRECTION: your last narration of this turn contradicted RESOLVED and was discarded. Write it again without these errors: ${correction.join(' | ')}`);
  if (draft.combat) lines.push(...describeCombat(draft.combat));
  if (draft.intent) lines.push(`Player action type: ${draft.intent.actionType}`);
  if (draft.checks.length === 0) lines.push('Checks: none required. Do not invent a success or failure that would need a roll.');
  for (const c of draft.checks) lines.push(describeCheck(c));
  if (draft.training) lines.push(...describeTraining(draft.training));
  if (draft.jump) lines.push(...describeJump(draft.jump.report));
  if (draft.timeAdvanced) {
    lines.push(`Time already advanced by the engine: ${formatSpan(draft.timeAdvanced.seconds)} (${draft.timeAdvanced.reason}). Narrate that stretch; do not add more time.`);
  }
  // A fate the player chose for a beaten opponent (pass 5 issue 13: Kill was told as an escape from an old captivity).
  for (const a of draft.applied) for (const n of a.notes) if (n.startsWith(FATE_ACT_NOTE)) lines.push(`Fate chosen: the player character ${n.slice(FATE_ACT_NOTE.length)}, the beaten opponent of the fight just ended, here and now. Narrate exactly this act and its moment: no other fight, escape or rescue happens, and nobody else is harmed or appears.`);
  for (const n of draft.notices) lines.push(`Notice: ${n}`);
  // Healing is only the care the engine applied (D-197): no bacta, healer or medicine beyond this line.
  if (draft.jump || draft.intent?.actionType === 'heal' || draft.intent?.healing || careApplied(draft).length) lines.push(careLine(draft));
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

function memorySection(
  state: GameState,
  referencedIds: readonly string[],
  playerText: string,
  rawFromTurn: number | null,
  est: Estimate,
  cap: number = CONTEXT_CAPS.memory,
): { text: string; report: SectionReport } {
  const header = 'MEMORY (established in this campaign)';
  const sel = retrieveMemory(state, { referencedIds, playerText, rawFromTurn }, cap - est(header), est);
  const item = (s: (typeof sel.included)[number]): ContextItem => ({
    id: s.item.id,
    tokens: s.tokens,
    score: Math.round(s.score * 10) / 10,
    note: [s.pinned ? 'pinned' : '', s.matched.length ? `matches ${s.matched.join(', ')}` : ''].filter(Boolean).join('; ') || 'recent',
  });
  if (sel.included.length === 0) return { text: '', report: section('memory', cap, '', est, [], sel.dropped.map(item)) };
  const text = [header, ...sel.included.map((s) => `- ${s.pinned ? '[pinned] ' : ''}${s.item.text}`)].join('\n');
  return { text, report: section('memory', cap, text, est, sel.included.map(item), sel.dropped.map(item)) };
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
  const text = [header, ...sel.included.map((s) => s.text)].join('\n\n');
  return { text, report: section('lore', CONTEXT_CAPS.lore, text, est, sel.included.map(item), sel.dropped.map(item)) };
}

function arcSection(state: GameState, est: Estimate): { text: string; report: SectionReport } {
  const arc = selectArc(state);
  if (!arc) return { text: '', report: section('arc', CONTEXT_CAPS.arc, '', est) };
  const text = clipTo(`ARC (the story so far)\n${arc.text}`, CONTEXT_CAPS.arc, est);
  return { text, report: section('arc', CONTEXT_CAPS.arc, text, est, [{ id: arc.atChapter, tokens: est(text) }]) };
}

// ---------------------------------------------------------------- requests

export function narrativeSystemPrompt(state: GameState, opening: boolean, level: PacingLevel = selectPacingLevel(state), combat = false): string {
  const pacing = PROMPTS.pacing[level];
  return [PROMPTS.coreGm, PROMPTS.contract, pacing, ...(combat ? [PROMPTS.combatNarration] : []), ...(opening ? [PROMPTS.opening] : [])].join('\n\n');
}

/** The player's own words for this turn (scanned for names; D-85). */
export function playerTextOf(input: TurnInput): string {
  return input.kind === 'typed' || input.kind === 'dev' ? input.text : input.kind === 'choice' ? input.choice.label : input.kind === 'action' || input.kind === 'beat' ? input.label : input.premise;
}

/**
 * A dev scenario (D-180; test campaigns only): the narration starts exactly in the situation given, through the normal
 * events. Null outside a test campaign or when there is none.
 */
export function devScenarioBlock(state: GameState, scenario: string | null, opening: boolean): string | null {
  if (!scenario || !selectIsTestCharacter(state)) return null;
  return [
    `DEV SCENARIO (a test campaign; this overrides ${opening ? 'the generated opening' : 'the current scene'}): start exactly in this situation: ${scenario}`,
    'Set it up through the normal events: locationIntroduced and locationChanged for the place, npcIntroduced for anyone present, and combatStarted (opponentRefs or minionGroups, terrainTags, stakes) when a fight is under way or about to start. Do not narrate any exchange of a fight: the engine resolves it.',
  ].join('\n');
}

export function buildNarrativeRequest(state: GameState, draft: TurnDraft, input: TurnInput, history: readonly TurnRecord[], opts: BuildOptions): BuiltRequest {
  const est = makeEstimator(opts.ratio);
  const system = narrativeSystemPrompt(state, input.kind === 'opening', draft.pacingLevel, draft.combat !== null || state.combat.active !== null);
  const caps = draft.jump ? JUMP_CAPS : CONTEXT_CAPS;
  const referenced = draft.intent ? [...draft.intent.targets, ...draft.intent.references] : [];
  const playerText = playerTextOf(input);

  const recent = historyWindow(history, caps.recentTurns, est);
  const st = stateBlock(state, est, caps.state, focusIds(state, referenced, playerText));
  const arc = arcSection(state, est);
  const mem = memorySection(state, referenced, playerText, recent.fromTurn, est, caps.memory);
  const lore = loreSection(state, referenced, playerText, est, opts.lore ?? LORE_INDEX);
  const resolved = resolvedBlock(draft, opts.correction ?? []);
  const playerLine = input.kind === 'opening' ? `OPENING${input.premise ? `\nPlayer premise: ${input.premise}` : ''}` : `PLAYER ACTION: ${describeInput(input)}`;

  const scenario = devScenarioBlock(state, input.kind === 'opening' ? (input.scenario ?? null) : pendingScenario(history), input.kind === 'opening');

  const finalText = [st.text, arc.text, mem.text, lore.text, resolved, scenario, playerLine].filter(Boolean).join('\n\n');
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
  const activities = activitiesLine();
  const messages: Message[] = [{ role: 'user', text: [st.text, activities, lastNarrative, input].join('\n\n') }];
  const sections: SectionReport[] = [
    section('gmRules', CONTEXT_CAPS.gmRules, system, est, [{ id: 'intent', tokens: est(system) }]),
    st.report,
    section('state', null, activities, est, [{ id: 'valid activities', tokens: est(activities) }]),
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

/**
 * The powers at this date (M7, D-400; src/data/worldControl.ts): who leads them, and who controls the current place and
 * its ancestors. Only what the lore states; inferred readings are marked. Nothing when the date has no entries.
 */
function worldLines(bby: number, placeNames: readonly string[]): string[] {
  const tag = (inferred?: boolean): string => (inferred ? ' [inferred]' : '');
  const leaders = leadersAt(bby);
  const control = controlAt(placeNames, bby);
  return [
    ...(leaders.length ? [`Leaders: ${leaders.map((l) => `${l.office}: ${l.holder}${tag(l.inferred)}`).join('; ')}`] : []),
    ...control.map((c) => `Control: ${c.place}: ${c.side} (${c.note})${tag(c.inferred)}`),
  ];
}

/** How an off-board reason reads for the narrator (D-401 [4]). */
const OFF_BOARD_TEXT = { unborn: 'not yet born', dead: 'dead', unavailable: 'out of sight', imprisoned: 'imprisoned elsewhere' } as const;

/** The character's side for era rules: the start option's, else the path's (D-401 [8]). */
const PATH_FACTION: Readonly<Record<string, string>> = { jedi: 'jediOrder', sith: 'sithEmpire' };

/**
 * The board at this place (D-401 [3], [4], [8]): the canon figures the lore places here this year (only those on the
 * board), a warning for each story NPC named after a canon figure who is off the board now (the link was refused), and
 * the era rules for this place and the factions in play. No full roster is sent.
 */
function boardLines(state: GameState, bby: number, placeNames: readonly string[]): string[] {
  const lines: string[] = [];
  const here = placementsAt(placeNames, bby).filter((p) => !p.canonId || !CANON_BY_ID.get(p.canonId) || canonOffBoard(CANON_BY_ID.get(p.canonId)!, bby) === null || p.imprisoned);
  if (here.length) lines.push(`Canon figures here (on record this year; introduce them only as the story reaches them): ${here.map((p) => `${p.name}: ${p.doing}`).join('; ')}`);
  const warned: string[] = [];
  for (const n of selectNpcs(state)) {
    if (n.canonId || warned.length >= 3) continue;
    const hit = findCanonEntity(LORE_INDEX, normalizeAlias(n.name), -bby);
    const canon = hit ? CANON_BY_ID.get(hit.canonId) : undefined;
    const off = canon ? canonOffBoard(canon, bby) : null;
    if (canon && off) warned.push(`${n.name} (${n.id}) is not the canon ${canon.name}, who is ${OFF_BOARD_TEXT[off]} this year; treat them as someone else, or correct the story`);
  }
  for (const w of warned) lines.push(`Board warning: ${w}`);
  const factions = new Set<string>();
  const c = selectCharacter(state);
  const own = c.start?.faction ?? PATH_FACTION[c.path];
  if (own) factions.add(own);
  for (const id of selectPresentNpcIds(state)) { const f = state.npcs.byId[id]?.factionId; if (f) factions.add(f); }
  for (const r of eraRulesAt(bby, placeNames, [...factions])) lines.push(`Era rule: ${r.text}`);
  return lines;
}
