// Combat integration and Force actions in a duel (progression-numbers §8, rolls §4, health §2; D-122, D-154). Pure.
// Built in M5 so CI is real; M6 extends the actions to the full catalog.
import { CIRCUMSTANCE, EXCHANGE_SECONDS, EXERTION_PER_EXCHANGE } from '../data/combat.config';
import { NIMAN_CI_FACTOR } from '../data/formMatchups';
import { FORCE_BASE_LOAD, LIGHTNING_PER_OUTPUT, FORCE_EFFORT, LOCATION_WEIGHTS, type ForceEffort } from '../data/health.config';
import { OBJECT_SIZE_RULES, type ObjectSize } from '../data/terrain';
import { applyDamage, damageOf, hazardDamage, rollLocation, severityOf } from './damage';
import { applyForceLoad, forceLoadPerUse } from './fatigue';
import { basicRoll, type BasicRoll } from './rolls';
import { nextFloat, nextInt } from './rng';
import { currentTarget, settleEnd, type DuelState, type ExchangeRecord, type Fighter, type SideId } from './duel';
import { isDying, isIncapacitated, killsWhileDying, takesMinionOut, type Wound } from './wounds';

/** Integration line = 25 + CI; G = level - line (no penalty when G <= 0). */
export const ciLine = (ci: number): number => 25 + ci;

export interface CombatIntegration {
  effectiveLevel: number;
  strainMult: number;
  misfire: number;
  G: number;
}

/**
 * In combat only (progression-numbers §8): effective level = line + 0.5 G; strain x(1 + 0.015 G), max x2.0;
 * misfire 0.3% x G, max 15%. Fighting in Niman halves the G-based loss, the strain multiplier's excess and the
 * misfire chance (D-122). Reference: Force Push 70, CI 10 -> 52.5, x1.52, 10.5%.
 */
export function combatIntegration(level: number, ci: number, niman = false): CombatIntegration {
  const G = Math.max(0, level - ciLine(ci));
  const k = niman ? NIMAN_CI_FACTOR : 1;
  return {
    effectiveLevel: level - 0.5 * G * k,
    strainMult: Math.min(2, 1 + 0.015 * G * k),
    misfire: Math.min(0.15, 0.003 * G * k),
    G,
  };
}

export type ForceActionKind = 'push' | 'choke' | 'lightning' | 'throw';
export const FORCE_ACTION_ABILITY: Record<ForceActionKind, string> = { push: 'forcePush', choke: 'forceChoke', lightning: 'forceLightning', throw: 'telekinesis' };

export interface ForceActionInput {
  side: SideId;
  kind: ForceActionKind;
  /** The ability's level and CI. */
  level: number;
  ci: number;
  effort: ForceEffort;
  /** Force Output level (Lightning damage). */
  forceOutput: number;
  /** Thrown object size (throw). */
  objectSize?: ObjectSize;
  /** Extra modifier on the user's roll (sequence chain bonuses). */
  bonus?: number;
  /** Extra defense for the target (sequence adaptation). */
  targetDefense?: number;
  angerChanneling?: boolean;
}

export interface ForceActionRecord {
  kind: ForceActionKind;
  abilityId: string;
  side: SideId;
  user: BasicRoll | null;
  resist: BasicRoll | null;
  margin: number;
  success: boolean;
  misfire: boolean;
  load: number;
  backlashMental: number;
  collapse: boolean;
  damage: { D: number; W: number; part: string; severity: string | null } | null;
  ci: CombatIntegration;
  seconds: number;
  /** Effective levels of user and target (combat XP gap). */
  effUser: number;
  effTarget: number;
}

/**
 * One Force action as an exchange (rolls §4): Force vs resistance, d20 + effective ability level / 10 vs d20 +
 * Willpower / 10. Push and Choke on a success give an opening (+2 advantage); Lightning does 0.4 x Force Output x
 * effort damage; a thrown object does hazard-table damage by its size. The Force load uses health §2 (backlash
 * over 1.0; the caller's state records a collapse as incapacitation for 1-3 hours).
 */
export function resolveForceAction(s0: DuelState, input: ForceActionInput, day: number): { state: DuelState; record: ForceActionRecord } {
  let s = s0;
  const user = input.side === 'A' ? s.a : currentTarget(s)!;
  const target = input.side === 'A' ? currentTarget(s)! : s.a;
  const niman = user.form === 'niman';
  const ci = combatIntegration(input.level, input.ci, niman);
  const abilityId = FORCE_ACTION_ABILITY[input.kind];
  const baseLoad = input.kind === 'throw' && input.objectSize ? OBJECT_SIZE_RULES[input.objectSize].forceLoad : FORCE_BASE_LOAD[abilityId] ?? 0.2;
  const load = forceLoadPerUse(baseLoad, input.effort, input.level, ci.strainMult);
  const fl = applyForceLoad({ p: user.meters.p, m: 0, f: user.meters.f }, user.caps.f, load, input.angerChanneling ?? false);
  let rng = s.rng;
  let collapse = false;
  if (fl.overLimit) {
    const [u, r] = nextFloat(rng);
    rng = r;
    collapse = u < 0.05;
  }
  const [mf, r1] = nextFloat(rng);
  rng = r1;
  const misfire = mf < ci.misfire;
  let userRoll: BasicRoll | null = null;
  let resistRoll: BasicRoll | null = null;
  let margin = 0;
  let success = false;
  if (!misfire && !collapse) {
    [userRoll, rng] = basicRoll(rng, ci.effectiveLevel, input.bonus ? [{ source: 'sequence chain', value: input.bonus }] : []);
    [resistRoll, rng] = basicRoll(rng, target.willpower, input.targetDefense ? [{ source: 'adapted to the pattern', value: input.targetDefense }] : []);
    margin = userRoll.total - resistRoll.total;
    success = margin >= 0 && userRoll.natural !== 'nat1';
  }
  let updatedUser: Fighter = { ...user, meters: { ...user.meters, f: fl.meters.f, p: user.meters.p + EXERTION_PER_EXCHANGE }, out: user.out || collapse };
  let updatedTarget: Fighter = target;
  let damage: ForceActionRecord['damage'] = null;
  let advantage = s.advantage;
  const dir = input.side === 'A' ? 1 : -1;
  if (success) {
    if (input.kind === 'push' || input.kind === 'choke') advantage = Math.max(-5, Math.min(5, advantage + dir * CIRCUMSTANCE.openingAdvantage));
    else {
      let D: number;
      let bypass: number;
      if (input.kind === 'lightning') {
        D = damageOf({ weapon: 'blasterPistol', quality: 'solid', armor: 'none', saberResistant: false, base: LIGHTNING_PER_OUTPUT * input.forceOutput * FORCE_EFFORT[input.effort] });
        bypass = 0;
      } else {
        const rules = OBJECT_SIZE_RULES[input.objectSize ?? 'small'];
        const h = hazardDamage(rules.hazard, rules.severity);
        D = h.D;
        bypass = h.bypass;
      }
      const [part, r2] = rollLocation(rng, LOCATION_WEIGHTS);
      rng = r2;
      const dmg = applyDamage(target.vitality, D, bypass);
      const sev = severityOf(dmg.W);
      updatedTarget = { ...target, vitality: dmg.vitality, out: target.out || (target.minion && dmg.vitality <= 0) };
      if (sev) {
        const w: Wound = { id: `${target.id}:w${target.wounds.length + 1}`, part, severity: sev, W: dmg.W, stabilized: false, healProgress: 0, day, source: `force:${abilityId}` };
        updatedTarget = { ...updatedTarget, wounds: [...target.wounds, w], dead: target.dead || killsWhileDying(target.wounds, w), out: updatedTarget.out || (target.minion && takesMinionOut(sev)) };
      }
      damage = { D, W: dmg.W, part, severity: sev };
    }
  }
  if (isDying(updatedTarget.wounds) || isIncapacitated(updatedTarget.wounds)) updatedTarget = { ...updatedTarget, out: true };
  const [secs, r3] = nextInt(rng, EXCHANGE_SECONDS.min, EXCHANGE_SECONDS.max);
  rng = r3;
  const effUser = ci.effectiveLevel;
  const effTarget = target.willpower;
  if (input.side === 'A') {
    s = { ...s, a: updatedUser, opponents: s.opponents.map((o) => (o.id === updatedTarget.id ? updatedTarget : o)) };
  } else {
    updatedUser = { ...updatedUser };
    s = { ...s, a: updatedTarget, opponents: s.opponents.map((o) => (o.id === updatedUser.id ? updatedUser : o)) };
  }
  const record: ForceActionRecord = { kind: input.kind, abilityId, side: input.side, user: userRoll, resist: resistRoll, margin, success, misfire, load, backlashMental: fl.backlashMental, collapse, damage, ci, seconds: secs, effUser, effTarget };
  const rec: ExchangeRecord = {
    n: s.exchange + 1,
    kind: 'force',
    targetId: input.side === 'A' ? target.id : user.id,
    rollA: input.side === 'A' ? userRoll : resistRoll,
    rollB: input.side === 'A' ? resistRoll : userRoll,
    margin: input.side === 'A' ? margin : -margin,
    advBefore: s0.advantage,
    advAfter: advantage,
    striker: null,
    hit: null,
    maneuver: null,
    effA: input.side === 'A' ? effUser : effTarget,
    effB: input.side === 'A' ? effTarget : effUser,
    seconds: secs,
    notes: [misfire ? `${user.name}: the ${abilityId} misfires` : collapse ? `${user.name} collapses from Force backlash` : `${user.name}: ${abilityId} ${success ? 'succeeds' : 'is resisted'}`],
    surprise: false,
    force: record,
  };
  s = settleEnd({ ...s, advantage, rng, exchange: s.exchange + 1, seconds: s.seconds + secs, log: [...s.log, rec], spentNow: null });
  return { state: s, record };
}
