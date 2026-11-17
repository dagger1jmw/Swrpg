// Minimal context builder for M1 (D-74): gmRules + state block + resolved block + the newest raw
// turns that fit the recentTurns cap, never split. Pure; never mutates state. M2 replaces it with
// the full capped builder (memory, lore, arc).
import type { Message } from '../ai/provider';
import { PROMPTS } from '../ai/prompts';
import { formatClock, formatDate, timeOfDayLabel } from '../engine/calendar';
import type { CheckCard } from '../engine/rolls';
import { selectAge, selectCharacterName } from '../features/character/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectMoodTags, selectPacingLevel } from '../features/pacing/selectors';
import type { GameState } from '../state/gameState';
import { describeInput, type TurnInput, type TurnRecord } from './record';
import type { TurnDraft } from './resolve';

/** architecture §5: recentTurns cap 8,000 tokens; tokens estimated as characters / 4 (D-26). */
export const RECENT_TURNS_CAP_TOKENS = 8000;
export const CHARS_PER_TOKEN = 4;

export const estimateTokens = (text: string): number => Math.ceil(text.length / CHARS_PER_TOKEN);

export function stateBlock(state: GameState): string {
  const now = selectNow(state);
  const level = selectPacingLevel(state);
  const mood = selectMoodTags(state);
  return [
    'STATE',
    `Character: ${selectCharacterName(state)}, age ${selectAge(state)}`,
    `Date: ${formatDate(now.day)}`,
    `Time: ${formatClock(now.second)} (${timeOfDayLabel(now.second)})`,
    `Pacing: ${level}`,
    `Scene mood: ${mood.length ? mood.join(', ') : 'not set'}`,
    'VALID IDS: none yet (people and places are not tracked until a later version; do not use targetRef).',
    'VALID SKILLS: none yet (leave skillId empty).',
  ].join('\n');
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

/** Newest-first records that fit the cap, returned oldest-first as user/model message pairs. */
export function historyMessages(records: readonly TurnRecord[], capTokens = RECENT_TURNS_CAP_TOKENS): Message[] {
  const out: Message[][] = [];
  let used = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i]!;
    const pair: Message[] = [
      { role: 'user', text: `PLAYER: ${describeInput(r.input)}` },
      { role: 'model', text: r.narrative },
    ];
    const cost = pair.reduce((a, m) => a + estimateTokens(m.text), 0);
    if (used + cost > capTokens) break;
    used += cost;
    out.unshift(pair);
  }
  return out.flat();
}

export function narrativeSystemPrompt(state: GameState, opening: boolean): string {
  const level = selectPacingLevel(state);
  const pacing = level === 'scene' ? PROMPTS.pacing.scene : PROMPTS.pacing.moment;
  return [PROMPTS.coreGm, PROMPTS.contract, pacing, ...(opening ? [PROMPTS.opening] : [])].join('\n\n');
}

export function narrativeMessages(state: GameState, draft: TurnDraft, input: TurnInput, history: readonly TurnRecord[]): Message[] {
  const playerLine =
    input.kind === 'opening' ? `OPENING${input.premise ? `\nPlayer premise: ${input.premise}` : ''}` : `PLAYER ACTION: ${describeInput(input)}`;
  return [...historyMessages(history), { role: 'user', text: [stateBlock(state), resolvedBlock(draft), playerLine].join('\n\n') }];
}

export function intentMessages(state: GameState, text: string, history: readonly TurnRecord[]): Message[] {
  const last = history[history.length - 1];
  const lastNarrative = last ? last.narrative.slice(-1500) : '(no previous turn)';
  return [
    {
      role: 'user',
      text: [stateBlock(state), `LAST NARRATION (for context):\n${lastNarrative}`, `PLAYER INPUT:\n${text}`].join('\n\n'),
    },
  ];
}
