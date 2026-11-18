// Combat in the turn (architecture §4 step b; D-145, D-146): the combat action a turn resolves, and the draft the
// narration and the UI read. Pure.
import { QUIET_LINES, fillLine, type LineSide } from '../data/combatLines';
import { isNarratedBeat, type BeatReason } from '../data/combat.config';
import type { Intent } from '../ai/schemas/intent';
import type { DuelState, ExchangeRecord } from '../engine/duel';
import { isDying, isIncapacitated, statusLabel, type Wound } from '../engine/wounds';
import type { ActiveFight, FightSummary } from '../features/combat/selectors';
import type { GameState } from '../state/gameState';
import type { CombatActionInput } from './record';

export interface CombatFighterView {
  id: string;
  name: string;
  vitality: number;
  maxVitality: number;
  status: string;
  out: boolean;
  engagedElsewhere: boolean;
  minion: boolean;
  weapon: string;
  form: string | null;
}

export interface CombatDraft {
  fightId: string;
  /** The fight began this turn (from a deferred combatStarted or a fight intent). */
  started: boolean;
  /** This turn's exchanges (roll cards). */
  records: ExchangeRecord[];
  /** Every exchange since the last narrated beat (D-145: one narration covers them all). */
  narrate: ExchangeRecord[];
  beat: string | null;
  /** A quiet beat: no AI call; the feed shows the roll cards and `quietLine`. */
  quiet: boolean;
  quietLine: string | null;
  ended: { outcome: string; reason: string; playerFate: string | null } | null;
  /** A sparring session (D-168): bouts won, lost and unfinished, how it ended, and any real injury. */
  session: { won: number; lost: number; unfinished: number; ended: string | null; injuries: string[] } | null;
  advantage: number;
  fighters: CombatFighterView[];
  notes: string[];
}

const FORCE_KINDS: Readonly<Record<string, 'push' | 'choke' | 'lightning' | 'throw'>> = { forcePush: 'push', forceChoke: 'choke', forceLightning: 'lightning', telekinesis: 'throw' };

/** The combat action an intent asks for in a fight (typed input): a sequence, a Force action, a tactic, or the next beat. */
export function combatActionFromIntent(intent: Intent | null): Record<string, unknown> {
  if (intent?.sequence?.length) return { action: 'sequence', steps: intent.sequence };
  if (intent?.forceAbility && FORCE_KINDS[intent.forceAbility]) return { action: 'force', force: { kind: FORCE_KINDS[intent.forceAbility], ...(intent.effort ? { effort: intent.effort } : {}) } };
  if (intent?.tactic) return { action: 'tactic', tactic: intent.tactic };
  return { action: 'continue' };
}

/** The combatAction event payload for a beat button. */
export function combatActionFromBeat(b: CombatActionInput): Record<string, unknown> {
  const { action, ...rest } = b;
  return { action, ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) };
}

const view = (f: DuelState['a']): CombatFighterView => ({
  id: f.id,
  name: f.name,
  vitality: Math.round(f.vitality * 10) / 10,
  maxVitality: Math.round(f.maxVitality * 10) / 10,
  status: f.dead ? 'Dead' : isDying(f.wounds as Wound[]) ? 'Dying' : isIncapacitated(f.wounds as Wound[]) ? 'Incapacitated' : f.out ? 'Out of the fight' : statusLabel(f.wounds as Wound[]),
  out: f.out,
  engagedElsewhere: f.engagedElsewhere,
  minion: f.minion,
  weapon: f.weapon,
  form: f.form,
});

function quietLineFor(beat: string | null, duel: DuelState, records: readonly ExchangeRecord[]): string | null {
  if (!beat) return null;
  const lines = QUIET_LINES[beat as BeatReason];
  if (!lines) return null;
  const last = records[records.length - 1];
  const side: LineSide = last?.hit ? (last.hit.by === 'A' ? 'up' : 'down') : last?.striker ? (last.striker === 'A' ? 'up' : 'down') : duel.advantage > 0 ? 'up' : duel.advantage < 0 ? 'down' : 'even';
  const options = lines[side].length ? lines[side] : lines.even;
  const opp = duel.opponents.find((o) => o.id === last?.targetId) ?? duel.opponents[0];
  return fillLine(options[duel.exchange % options.length]!, duel.a.name, opp?.name ?? 'the opponent');
}

/** Builds the combat draft from the fight before and after this turn's action. */
export function combatDraft(before: GameState, after: GameState, started: boolean, notes: readonly string[]): CombatDraft | null {
  const prev: ActiveFight | null = before.combat.active;
  const active: ActiveFight | null = after.combat.active;
  const last: FightSummary | null = after.combat.last;
  const endedNow = !active && last !== null && (prev?.id === last.id || started);
  const duel = (active?.duel ?? (endedNow ? (last as FightSummary & { duel?: DuelState }).duel : null)) as DuelState | null;
  if (!duel) return null;
  const prevDuel = (prev && prev.id === (active?.id ?? last?.id) ? prev.duel : null) as DuelState | null;
  const fromLog = prevDuel ? prevDuel.log.length : 0;
  const fromNarrated = prev && prevDuel ? prev.lastNarrated : 0;
  const records = duel.log.slice(fromLog);
  const narrateFrom = duel.log.findIndex((r) => r.n > fromNarrated);
  const sess = (active?.session ?? (endedNow ? last!.session : null)) ?? null;
  // A sparring session resolved in code is narrated once from its highlights: hits, points and maneuvers (D-168).
  const all = narrateFrom < 0 ? [] : duel.log.slice(narrateFrom);
  const narrate = sess && endedNow ? all.filter((r) => r.hit !== null || r.maneuver !== null) : all;
  const injuries = sess ? duel.log.filter((r) => r.hit?.severity && r.n > fromNarrated).map((r) => `${r.hit!.severity} wound to the ${r.hit!.part}`) : [];
  const beat = active?.beat ?? (endedNow ? 'fightEnded' : null);
  const narrated = endedNow || started || (beat !== null && isNarratedBeat(beat as BeatReason));
  return {
    fightId: active?.id ?? last!.id,
    started,
    records,
    narrate,
    beat,
    quiet: !narrated,
    quietLine: narrated ? null : quietLineFor(beat, duel, records),
    ended: endedNow ? { outcome: last!.outcome, reason: last!.reason, playerFate: last!.playerFate } : null,
    session: sess
      ? { won: sess.bouts.filter((b) => b.winner === 'A').length, lost: sess.bouts.filter((b) => b.winner === 'B').length, unfinished: sess.bouts.filter((b) => b.winner === null).length, ended: sess.ended, injuries }
      : null,
    advantage: duel.advantage,
    fighters: [view(duel.a), ...duel.opponents.map(view)],
    notes: [...notes],
  };
}
