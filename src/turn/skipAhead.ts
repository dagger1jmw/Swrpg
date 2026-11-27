// The code-appended forward jump (architecture §8, D-18, D-138). When the story is stale (21+ days at one
// place with nothing new) and not settling in, the choices must include a forward jump; if the AI's do
// not, code appends "Skip ahead: <top open thread>" (a montage). Suggest only: the player decides.
import type { Choice } from '../ai/schemas/compose';
import { SKIP_AHEAD } from '../data/pacing.config';
import { selectStaleness } from '../features/pacing/selectors';
import { selectOpenThreads } from '../features/threads/selectors';
import type { GameState } from '../state/gameState';

const isJump = (c: Choice): boolean => c.pacingHint === 'montage' || c.pacingHint === 'timeSkip';

/** The top open thread: the nearest deadline, else the most recently active one. */
export function topOpenThread(s: GameState) {
  const open = selectOpenThreads(s);
  const withDeadline = open.filter((t) => t.deadlineDay !== null).sort((a, b) => a.deadlineDay! - b.deadlineDay! || a.id.localeCompare(b.id));
  if (withDeadline.length) return withDeadline[0]!;
  return [...open].sort((a, b) => b.lastTurn - a.lastTurn || a.id.localeCompare(b.id))[0] ?? null;
}

export function skipAheadChoice(s: GameState, choices: readonly Choice[]): (Choice & { spanDays: number }) | null {
  if (!selectStaleness(s).stale || choices.some(isJump)) return null;
  const t = topOpenThread(s);
  // Up to the day before the nearest deadline, so the jump never skips past it.
  const untilDeadline = t?.deadlineDay != null ? t.deadlineDay - s.clock.now.day - 1 : Infinity;
  const spanDays = Math.max(SKIP_AHEAD.minDays, Math.min(SKIP_AHEAD.days, untilDeadline));
  return {
    label: t ? `Skip ahead: ${t.title}` : 'Skip ahead',
    intent: { actionType: 'rest' },
    pacingHint: 'montage',
    spanDays,
  };
}

/** "Resume the skip" (opt-2 D5b, D5d): offered first at home while a paused skip has days left; never on a mission. */
export function resumeSkipChoice(s: GameState): (Choice & { spanDays: number }) | null {
  const r = s.duty.resume;
  if (!r || s.duty.status !== 'home') return null;
  const left = r.targetDay - s.clock.now.day;
  if (left < 1) return null;
  return { label: `Resume the skip (${left} day${left === 1 ? '' : 's'} left)`, intent: { actionType: 'train' }, pacingHint: left >= 7 ? 'timeSkip' : 'montage', spanDays: left };
}
