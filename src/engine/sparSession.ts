// Sparring sessions (Jared, D-168; rolls §3, combat-xp §6). A spar is a session of bouts up to SPAR_SESSION.exchanges
// exchanges in total. Each bout ends by its sparring mode's rule (controlled live blades: a point; training sabers: the
// first side Spent); between bouts both sides get back part of their Vitality; the session ends at the exchange count,
// or early when a side is still Spent after the recovery, when someone is really hurt (an accident, an academy wound),
// or when the player stops. Exchange numbering, seconds and the log run on across bouts, so combat XP reads the whole
// session from one log. Pure.
import { SPAR_SESSION } from '../data/combat.config';
import { runUntilBeat, startDuel, type DuelContext, type DuelState, type Fighter, type SideId } from './duel';
import { isDying, isIncapacitated } from './wounds';

export interface BoutRecord {
  /** Null: the session's exchange count ran out mid-bout. */
  winner: SideId | null;
  reason: string;
  exchanges: number;
}

export type SessionEnd = 'exchanges' | 'spent' | 'injury' | 'stopped';

export interface SparSessionState {
  bouts: BoutRecord[];
  /** The exchange count when the current bout began. */
  boutStart: number;
  ended: SessionEnd | null;
  /** The player is playing the current bout out beat by beat (live play). */
  playing: boolean;
}

export const newSession = (): SparSessionState => ({ bouts: [], boutStart: 0, ended: null, playing: false });

/** Exchanges left in the session. */
export const sessionBudget = (d: DuelState): number => Math.max(0, SPAR_SESSION.exchanges - d.exchange);

const hurt = (f: Fighter): boolean => f.dead || isDying(f.wounds) || isIncapacitated(f.wounds);

/** A fighter back on their feet for the next bout: part of their Vitality back, nothing else reset but the bout state. */
function recovered(f: Fighter): Fighter {
  return {
    ...f,
    vitality: Math.min(f.maxVitality, f.vitality + SPAR_SESSION.recoverBetweenBouts * f.maxVitality),
    out: false,
    position: 0,
    disarmedFor: 0,
    pendingManeuver: null,
  };
}

/**
 * Records the bout that just ended (or was cut off by the exchange count) and decides what comes next: the next bout's
 * duel (counters, seconds and log run on), or null when the session is over.
 */
export function afterBout(session: SparSessionState, d: DuelState): { session: SparSessionState; next: DuelState | null } {
  const bout: BoutRecord = { winner: d.end?.winner ?? null, reason: d.end?.reason ?? 'time', exchanges: d.exchange - session.boutStart };
  const bouts = [...session.bouts, bout];
  const done = (ended: SessionEnd) => ({ session: { ...session, bouts, ended, playing: false }, next: null });
  if (hurt(d.a) || d.opponents.some(hurt)) return done('injury');
  if (sessionBudget(d) <= 0 || !d.end) return done('exchanges');
  const a = recovered(d.a);
  const opponents = d.opponents.map((o) => (hurt(o) ? o : recovered(o)));
  if (a.vitality <= 0 || opponents.every((o) => o.vitality <= 0)) return done('spent');
  const fresh = startDuel(a, opponents, d.rng);
  const next: DuelState = { ...fresh, exchange: d.exchange, seconds: d.seconds, log: d.log };
  return { session: { ...session, bouts, boutStart: d.exchange, playing: false }, next };
}

/** Resolves the rest of the session in code (the montage default): every remaining bout to its end. */
export function runSession(d0: DuelState, session0: SparSessionState, ctx: DuelContext, day: number): { duel: DuelState; session: SparSessionState } {
  let d = d0;
  let session = session0;
  for (let guard = 0; guard < 200 && !session.ended; guard++) {
    if (!d.end && sessionBudget(d) > 0) d = runUntilBeat(d, ctx, day, 'toEnd', sessionBudget(d)).state;
    const r = afterBout(session, d);
    session = r.session;
    if (!r.next) break;
    d = r.next;
  }
  return { duel: d, session };
}

/** The session's outcome for combat XP (combat-xp §1): more bouts won than lost is won, fewer lost, equal a truce. */
export function sessionOutcome(session: SparSessionState): 'won' | 'lost' | 'truce' {
  const won = session.bouts.filter((b) => b.winner === 'A').length;
  const lost = session.bouts.filter((b) => b.winner === 'B').length;
  return won > lost ? 'won' : lost > won ? 'lost' : 'truce';
}

/** Bouts won, lost and unfinished, for the session summary. */
export function sessionTally(session: SparSessionState): { won: number; lost: number; unfinished: number } {
  return {
    won: session.bouts.filter((b) => b.winner === 'A').length,
    lost: session.bouts.filter((b) => b.winner === 'B').length,
    unfinished: session.bouts.filter((b) => b.winner === null).length,
  };
}
