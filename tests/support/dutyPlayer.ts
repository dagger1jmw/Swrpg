// A player for duty with no narrator (m9-missions B6, m9-release A11, A15): takes the code's mission choices (the approach with the
// best skill), fights beat by beat and withdraws when hurt and losing (m9-tune2 item 5), begins battles on the suggested plan and lets
// them play out, and travels where the code says. Used by the missions measure (tests/missions) and by the lifetime harness's
// missions-on run (LIFETIME_MISSIONS=on, report only).
import { intentSchema } from '../../src/ai/schemas/intent';
import type { Choice } from '../../src/ai/schemas/compose';
import { SEVERITIES } from '../../src/data/health.config';
import { APPROACHES, type ApproachId } from '../../src/data/missions.config';
import type { DuelState } from '../../src/engine/duel';
import { unhealedShare } from '../../src/engine/wounds';
import { selectPerformance } from '../../src/features/progression/selectors';
import { REGISTRY } from '../../src/state/registry';
import type { GameState } from '../../src/state/gameState';
import { expandChoice } from '../../src/turn/expandChoice';
import { missionChoices } from '../../src/turn/missionTurn';
import { resolveTurn, type Resolution } from '../../src/turn/resolve';

/** The approach a sensible player takes: the code's choice whose skill is the character's best. */
export function pickChoice(s: GameState, ch: readonly Choice[]): Choice {
  const score = (c: Choice): number => {
    const a = c.intent.missionApproach as ApproachId | undefined;
    const skill = a && a in APPROACHES ? APPROACHES[a].skill : null;
    return skill ? selectPerformance(s, skill) : -1;
  };
  return [...ch].sort((a, b) => score(b) - score(a))[0]!;
}

/** The code's duty moves open now (the settle-affairs day is a story choice: the player takes the trip instead). */
export const dutyChoices = (s: GameState): Choice[] => missionChoices(s).filter((c) => c.intent.actionType !== 'rest');

/** Something duty needs the player for now: a fight, a battle, or one of the code's mission moves. */
export const dutyNeedsPlayer = (s: GameState): boolean => s.combat.active !== null || s.battles.planning !== null || s.battles.ground !== null || s.battles.active !== null || dutyChoices(s).length > 0;

/**
 * The duty player withdraws (Jared, 27 Nov 2026, m9-tune2 item 5; the numbers invented): in a real fight it plays beat by beat and
 * breaks off with the game's Disengage tactic (the contest of engine/duel.ts disengageContest; a failed one fights on) when it carries
 * a moderate or worse wound and the advantage track is -2 or lower. A spar is never broken off. `enabled: false` is the old player,
 * who resolved every fight to its end in one go.
 */
export const DUTY_WITHDRAWAL = { wound: 'moderate' as (typeof SEVERITIES)[number], track: -2, enabled: true };
/** Withdrawals tried and won (report only; the lifetime harness and the missions measure read and reset it). */
export const dutyWithdrawals = { tried: 0, away: 0 };

export function wantsOut(d: DuelState): boolean {
  const hurt = d.a.wounds.some((w) => unhealedShare(w) > 0 && SEVERITIES.indexOf(w.severity) >= SEVERITIES.indexOf(DUTY_WITHDRAWAL.wound));
  return hurt && d.advantage <= DUTY_WITHDRAWAL.track;
}

function fightTurn(s: GameState): Resolution {
  const a = s.combat.active!;
  if (!DUTY_WITHDRAWAL.enabled || a.session) return resolveTurn(REGISTRY, s, null, { beat: { action: 'resolve' } as never });
  if (!wantsOut(a.duel as DuelState)) return resolveTurn(REGISTRY, s, null, { beat: { action: 'continue' } as never });
  dutyWithdrawals.tried += 1;
  const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'tactic', tactic: 'disengage' } as never });
  if (r.state.combat.active === null && r.state.combat.last?.reason === 'disengaged') dutyWithdrawals.away += 1;
  return r;
}

/** One duty turn played, or null when duty needs nothing. */
export function playDutyTurn(s: GameState): Resolution | null {
  if (s.combat.active) return fightTurn(s);
  if (s.battles.planning && !s.battles.ground) {
    const r = resolveTurn(REGISTRY, s, null, { battle: { ground: { act: 'begin' } } });
    return r.state.battles.planning && !r.state.battles.ground ? resolveTurn(REGISTRY, s, null, { battle: { ground: { act: 'standDown' } } }) : r;
  }
  if (s.battles.ground) return resolveTurn(REGISTRY, s, null, { battle: { ground: { act: 'auto' } } });
  if (s.battles.active) return resolveTurn(REGISTRY, s, null, { battle: { auto: true } });
  const ch = dutyChoices(s);
  if (!ch.length) return null;
  const c = pickChoice(s, ch);
  return resolveTurn(REGISTRY, s, intentSchema.parse(expandChoice(c, () => null).intent), c.intent.missionApproach ? { mission: c.intent.missionApproach } : {});
}
