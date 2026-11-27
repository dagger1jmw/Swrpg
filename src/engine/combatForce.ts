// Combat integration and Force actions in a duel (progression-numbers §8, rolls §4, health §2; D-122, D-154), and what
// resists the Force (D-192): one pure contest for every Force use on a target, in combat and out of it. The Force load
// goes through forceMeter.ts. Saber throw and recall (D-193). Pure.
import { SKILL_BY_ID } from '../data/skills';
import { CIRCUMSTANCE, EXCHANGE_SECONDS, EXERTION_PER_EXCHANGE, FIRST_USE_MAX_GAIN, STRIKE_AT } from '../data/combat.config';
import { NIMAN_CI_FACTOR } from '../data/formMatchups';
import { FORCE_BASE_LOAD, LIGHTNING_PER_OUTPUT, FORCE_EFFORT, LOCATION_WEIGHTS, type ForceEffort } from '../data/health.config';
import {
  BODY_DIFFICULTY,
  DODGE_MOD,
  FORCE_RESISTANCE_SKILLS,
  FORCE_USER_MIN_LEVEL,
  SPECIES_FORCE_TRAITS,
  TRAIT_RESISTANCE,
  LIGHTNING_DIFFICULTY,
  MIND_FORCE_RESIST_SHARE,
  MIND_TRICK_COMBAT,
  OBJECT_DIFFICULTY,
  SABER_THROW,
  type BodySize,
  type ForceGroup,
  type ForceTrait,
} from '../data/forceResistance.config';
import { OBJECT_SIZE_RULES, type ObjectSize } from '../data/terrain';
import { traitHazardFactor } from '../data/speciesTraits';
import { applyDamage, damageOf, hazardDamage, rollLocation, severityOf } from './damage';
import { applyForceLoad, forceLoadPerUse, rollCollapse } from './forceMeter';
import { basicRoll, dcForRating, type BasicRoll, type Modifier } from './rolls';
import { nextFloat, nextInt, type RngState } from './rng';
import { cannotDuel, currentTarget, damageFighter, resolveExchange, minionHitNote, engaged, fighterAgility, fighterEffectiveLevel, hasSaber, isRanged, settleEnd, type DuelContext, type DuelState, type ExchangeRecord, type Fighter, type SideId } from './duel';
import { STRIKE_QUALITY, type HitQuality } from '../data/combat.config';
import { barWound, breakOff } from './powerBar';
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

export type ForceActionKind = 'push' | 'choke' | 'lightning' | 'throw' | 'mindTrick' | 'saberThrow' | 'recall';
export const FORCE_ACTION_KINDS: readonly ForceActionKind[] = ['push', 'choke', 'lightning', 'throw', 'mindTrick', 'saberThrow', 'recall'];
/** The skill each combat Force action rolls (the saber throw and the recall are telekinesis applications, D-193). */
export const FORCE_ACTION_ABILITY: Record<ForceActionKind, string> = { push: 'forcePush', choke: 'forceChoke', lightning: 'forceLightning', throw: 'telekinesis', mindTrick: 'mindTrick', saberThrow: 'telekinesis', recall: 'telekinesis' };
/** The resolution group of each combat Force action (D-192). */
export const FORCE_ACTION_GROUP: Record<ForceActionKind, ForceGroup> = { push: 'avoidable', choke: 'grip', lightning: 'avoidable', throw: 'avoidable', mindTrick: 'mind', saberThrow: 'avoidable', recall: 'object' };

// ---------------------------------------------------------------- the contest (D-192)

/** Why a Force use failed, as the engine decided it (the narrator explains failures only with these; D-192). */
export type ForceOutcome = 'success' | 'skillTooLow' | 'natural1' | 'dodged' | 'cover' | 'forceResisted' | 'willResisted' | 'deflected' | 'immune' | 'forceInvisible' | 'negated';
export const FORCE_OUTCOME_TEXT: Record<ForceOutcome, string> = {
  success: 'succeeds',
  skillTooLow: 'fails: the roll fell short of the difficulty (the skill was not enough this time)',
  natural1: 'fails: a natural 1 (a slip of focus)',
  dodged: 'fails: the target saw it coming and dodged',
  cover: 'fails: the target is behind cover, which blocks it',
  forceResisted: 'fails: the target resisted it with their own Force',
  willResisted: "fails: the target's will held (Willpower contest)",
  deflected: "fails: the target's lightsaber caught and absorbed it",
  immune: 'fails: the target has no mind it can touch (immune)',
  forceInvisible: 'fails: the target cannot be touched through the Force',
  negated: 'fails: the Force cannot be used here (a Force-null bubble)',
};

/** What a Force use reads from its target. Null target = an object or the user's own saber. */
export interface ForceTarget {
  name: string;
  willpower: number;
  agility: number;
  /** 0 for anyone who is not a Force user (D-192: nothing else resists the Force). */
  forceResistance: number;
  traits: readonly ForceTrait[];
  bodySize: BodySize;
  inCover: boolean;
  /** Not surprised and can see it coming (only then can the target dodge). */
  canReact: boolean;
  /** Effective lightsaber form level when holding a saber (deflects lightning), else 0. */
  saberLevel: number;
}

export interface ForceContestInput {
  kind: ForceActionKind;
  group: ForceGroup;
  /** The user's effective ability level and roll modifiers. */
  level: number;
  modifiers: readonly Modifier[];
  target: ForceTarget | null;
  objectSize?: ObjectSize;
  /** A Force-null bubble (ysalamiri). */
  negated: boolean;
  /** Extra defense for the target (sequence adaptation). */
  targetDefense?: number;
}

export interface ForceContestResult {
  user: BasicRoll | null;
  /** The target's roll: Willpower, Force resistance, a dodge or a saber deflection; null when nothing was rolled. */
  resist: BasicRoll | null;
  resistKind: 'willpower' | 'forceResistance' | 'dodge' | 'saber' | null;
  /** The difficulty that applied (DC), or null for a pure contest. */
  dc: number | null;
  margin: number;
  success: boolean;
  outcome: ForceOutcome;
}

/** The difficulty of a Force use (DC), or null for the mind group's pure Willpower contest. */
export function forceDifficulty(kind: ForceActionKind, group: ForceGroup, target: ForceTarget | null, objectSize: ObjectSize | undefined): number | null {
  if (group === 'mind') return null;
  if (kind === 'lightning') return dcForRating(LIGHTNING_DIFFICULTY);
  if (kind === 'saberThrow') return dcForRating(SABER_THROW.controlDifficulty);
  if (kind === 'recall') return dcForRating(SABER_THROW.recallDifficulty);
  if (kind === 'throw' || group === 'object') return dcForRating(OBJECT_DIFFICULTY[objectSize ?? 'small']);
  return dcForRating(BODY_DIFFICULTY[target?.bodySize ?? 'humanoid']);
}

/**
 * One Force use on a target (D-192). Almost nothing resists the Force: a Force-null bubble stops it; a target outside the
 * Force cannot be touched by it except through a thrown object or lightning (D-447); a mind ability is a Willpower contest (a Force user adds
 * a share of their Force resistance; a droid or a lore-immune species cannot be affected); a grip or a Push on a Force
 * user is a Force resistance contest; an avoidable manifestation (Push, lightning, a thrown object) is dodged only by a
 * target that can react, and cover blocks lightning and thrown objects; a lightsaber catches lightning. Everything
 * else is only the difficulty.
 */
export function forceContest(rng0: RngState, i: ForceContestInput): [ForceContestResult, RngState] {
  const none = (outcome: ForceOutcome): [ForceContestResult, RngState] => [{ user: null, resist: null, resistKind: null, dc: null, margin: 0, success: false, outcome }, rng0];
  const t = i.target;
  if (i.negated) return none('negated');
  // Outside the Force (D-192, D-447): only a thrown object or lightning reaches the target (SW_Force_Powers_Part2b F7:
  // lightning, with its variants such as Electric Judgment, and Force Net were the only powers known to affect the Vong).
  if (t?.traits.includes('forceInvisible') && i.kind !== 'throw' && i.kind !== 'saberThrow' && i.kind !== 'lightning') return none('forceInvisible');
  if (i.group === 'mind' && t && (t.traits.includes('mindImmune') || t.traits.includes('droid'))) return none('immune');
  const [user, rngAfterUser] = basicRoll(rng0, i.level, i.modifiers);
  let rng = rngAfterUser;
  const base = forceDifficulty(i.kind, i.group, t, i.objectSize);
  // A species' own resistance (D-473): the mind group for the mind-resistant, everything but a thrown object for the Force-resistant.
  const touches = t && i.group !== 'object' && i.group !== 'unopposed' && i.kind !== 'throw' && i.kind !== 'saberThrow' && i.kind !== 'recall';
  const trait = touches && (t.traits.includes('forceResistant') || (i.group === 'mind' && t.traits.includes('mindResistant'))) ? TRAIT_RESISTANCE : 0;
  const dc = base === null ? null : base + trait;
  const done = (outcome: ForceOutcome, resist: BasicRoll | null, resistKind: ForceContestResult['resistKind']): [ForceContestResult, RngState] => {
    const against = Math.max(dc ?? -Infinity, resist?.total ?? -Infinity);
    return [{ user, resist, resistKind, dc, margin: user.total - (Number.isFinite(against) ? against : 0), success: outcome === 'success', outcome }, rng];
  };
  if (user.natural === 'nat1') return done('natural1', null, null);
  if (dc !== null && user.total < dc) return done('skillTooLow', null, null);
  if (!t || i.group === 'object' || i.group === 'unopposed') return done('success', null, null);
  const defense: Modifier[] = [...(i.targetDefense ? [{ source: 'adapted to the pattern', value: i.targetDefense }] : []), ...(trait ? [{ source: 'species resistance', value: trait }] : [])];
  let resist: BasicRoll;
  if (i.group === 'mind') {
    const fr = t.forceResistance > 0 ? [{ source: 'Force resistance', value: (t.forceResistance * MIND_FORCE_RESIST_SHARE) / 10 }] : [];
    [resist, rng] = basicRoll(rng, t.willpower, [...fr, ...defense]);
    return done(user.total >= resist.total ? 'success' : 'willResisted', resist, 'willpower');
  }
  if (i.group === 'grip') {
    if (t.forceResistance <= 0) return done('success', null, null);
    [resist, rng] = basicRoll(rng, t.forceResistance, defense);
    return done(user.total >= resist.total ? 'success' : 'forceResisted', resist, 'forceResistance');
  }
  // Avoidable: cover blocks lightning and thrown objects; a saber catches lightning; a Force user counters; else a dodge.
  if (t.inCover && (i.kind === 'lightning' || i.kind === 'throw')) return done('cover', null, null);
  if (i.kind === 'lightning' && t.saberLevel > 0 && t.canReact) {
    [resist, rng] = basicRoll(rng, t.saberLevel, defense);
    return done(user.total >= resist.total ? 'success' : 'deflected', resist, 'saber');
  }
  if (t.forceResistance > 0 && i.kind !== 'throw') {
    [resist, rng] = basicRoll(rng, t.forceResistance, defense);
    return done(user.total >= resist.total ? 'success' : 'forceResisted', resist, 'forceResistance');
  }
  if (!t.canReact) return done('success', null, null);
  [resist, rng] = basicRoll(rng, t.agility, [{ source: 'dodging', value: DODGE_MOD[i.kind === 'push' ? 'forcePush' : i.kind === 'lightning' ? 'forceLightning' : i.kind] ?? 0 }, ...defense]);
  return done(user.total >= resist.total ? 'success' : 'dodged', resist, 'dodge');
}

/** Force resistance (D-192): Force users only, the best of the resisting skills; 0 for everyone else. */
export function forceResistanceOf(levelOf: (id: string) => number): number {
  if (Math.max(levelOf('forceControl'), levelOf('forceSense')) < FORCE_USER_MIN_LEVEL) return 0;
  return Math.max(...FORCE_RESISTANCE_SKILLS.map(levelOf));
}

/** Force traits of an entity species (D-192, config). */
export const speciesForceTraits = (speciesId: string | null | undefined): readonly ForceTrait[] => (speciesId ? (SPECIES_FORCE_TRAITS[speciesId] ?? []) : []);
/**
 * A character's Force traits (D-453): the species', less the outside-the-Force trait for a per-character exception (Onimi),
 * with any other trait this one figure lacks or has against its species (D-473).
 */
export const characterForceTraits = (speciesId: string | null | undefined, insideForce = false, own?: { without?: readonly ForceTrait[]; with?: readonly ForceTrait[] }): readonly ForceTrait[] => {
  const out = speciesForceTraits(speciesId).filter((t) => !(insideForce && t === 'forceInvisible') && !own?.without?.includes(t));
  return [...out, ...(own?.with ?? []).filter((t) => !out.includes(t))];
};

/** A duel fighter as a Force target (D-192). */
export function forceTargetOf(f: Fighter, s: DuelState, ctx: DuelContext, attacker: SideId): ForceTarget {
  return {
    name: f.name,
    willpower: f.willpower,
    agility: fighterAgility(f),
    forceResistance: f.forceResistance ?? 0,
    traits: f.forceTraits ?? [],
    bodySize: f.bodySize ?? 'humanoid',
    inCover: ctx.cover === true && isRanged(f),
    canReact: s.surprise !== attacker && !f.out,
    saberLevel: hasSaber(f) ? fighterEffectiveLevel(f) : 0,
  };
}

// ---------------------------------------------------------------- Force actions in a duel

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
  /** The terrain tag of the thrown object (throw), so the narrator names it (issue 19: "a heavy stone" in a fight of fallen timber). */
  objectTag?: string;
  /** Extra modifier on the user's roll (sequence chain bonuses). */
  bonus?: number;
  /** Extra defense for the target (sequence adaptation). */
  targetDefense?: number;
  angerChanneling?: boolean;
  /**
   * A pattern's first use counts as surprise for its opening (D-146): a successful Push or Choke then puts the user at
   * least at the strike. Applied here, before the record is written, so the card and the track agree (pass 1 issue 16).
   */
  firstUse?: boolean;
}

/** One minion struck by a thrown saber (D-193). */
export interface SaberThrowHit {
  targetId: string;
  roll: BasicRoll;
  defense: BasicRoll;
  margin: number;
  quality: HitQuality | null;
  cutDown: boolean;
}

export interface ForceActionRecord {
  /** The terrain tag of a thrown object (throw). */
  objectTag?: string;
  kind: ForceActionKind;
  abilityId: string;
  side: SideId;
  user: BasicRoll | null;
  resist: BasicRoll | null;
  resistKind: ForceContestResult['resistKind'];
  dc: number | null;
  margin: number;
  success: boolean;
  /** The engine's reason (D-192): success, or why it failed. Misfire and collapse are separate. */
  outcome: ForceOutcome;
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
  /** Saber throw (D-193): the strikes in the arc, and whether the saber was dropped. */
  saberHits?: SaberThrowHit[];
  saberDropped?: boolean;
  /** A mind trick took a minion out of the fight (it stands down). */
  stoodDown?: boolean;
}

/** The plain reason line for a Force record (the narrator explains a failure only with this; D-192). */
export function forceReason(r: ForceActionRecord): string {
  if (r.misfire) return 'misfires: combat pressure broke the concentration (combat integration)';
  if (r.collapse) return 'collapses from Force backlash: over the Force limit';
  if (r.kind === 'recall') return r.success ? 'the saber flies back to hand' : `the recall ${FORCE_OUTCOME_TEXT[r.outcome].replace(/^fails: /, 'fails: ')}`;
  if (r.kind === 'saberThrow' && r.success) return r.saberDropped ? 'the saber flies but is wrenched from its arc and drops nearby' : 'the saber flies its arc and returns to hand';
  if (r.kind === 'saberThrow' && r.saberDropped) return `${FORCE_OUTCOME_TEXT[r.outcome]}; the saber drops nearby (unarmed until recalled)`;
  const backlash = r.backlashMental > 0 ? ' (over the Force limit: backlash strain)' : '';
  return `${FORCE_OUTCOME_TEXT[r.outcome]}${backlash}`;
}

/** Unarmed after dropping the saber (D-193): Agility, no form, until a recall. */
function dropSaber(f: Fighter): Fighter {
  if (f.saberLost || !hasSaber(f)) return f;
  return { ...f, saberLost: { weapon: f.weapon, skillId: f.skillId, level: f.level, form: f.form }, weapon: 'unarmed', skillId: 'agility', level: f.agility, form: null };
}
function recoverSaber(f: Fighter): Fighter {
  if (!f.saberLost) return f;
  const l = f.saberLost;
  return { ...f, weapon: l.weapon, skillId: l.skillId, level: l.level, form: l.form, saberLost: null };
}

function qualityOf(margin: number): HitQuality | null {
  for (const [min, q] of STRIKE_QUALITY) if (margin >= min) return q;
  return null;
}

/**
 * One Force action as an exchange (rolls §4 as amended by D-192): the contest above with the effective (CI) level.
 * Push and Choke on a success give an opening (+2 advantage); Lightning does 0.4 x Force Output x effort damage; a thrown
 * object does hazard-table damage by its size; a mind trick makes a minion stand down or gives an opening; a saber throw
 * strikes up to 3 minions in its arc (or one duelist); a recall brings a dropped saber back. The Force load uses health
 * §2 through forceMeter.ts (backlash over 1.0; a collapse is incapacitation for 1-3 hours).
 */
export function resolveForceAction(s0: DuelState, input: ForceActionInput, day: number, ctx: DuelContext = { sparring: null, situations: [], footing: 0, dyingRiskStakes: false }): { state: DuelState; record: ForceActionRecord } {
  const r = forceActionOnly(s0, input, day, ctx);
  // No free turns (Jared, after combat pass 1; D-204): while the player uses the Force the opponents act, one exchange in
  // which the player only defends (unarmed after a dropped saber, with Agility). It takes no time of its own.
  if (input.side !== 'A' || r.state.end || !currentTarget(r.state)) return r;
  return { state: resolveExchange(r.state, ctx, day, { duringForce: true }), record: r.record };
}

function forceActionOnly(s0: DuelState, input: ForceActionInput, day: number, ctx: DuelContext): { state: DuelState; record: ForceActionRecord } {
  let s = s0;
  const user = input.side === 'A' ? s.a : currentTarget(s)!;
  const target = input.side === 'A' ? currentTarget(s)! : s.a;
  const niman = user.form === 'niman';
  const ci = combatIntegration(input.level, input.ci, niman);
  const abilityId = FORCE_ACTION_ABILITY[input.kind];
  const group = FORCE_ACTION_GROUP[input.kind];
  const baseLoad =
    input.kind === 'throw' && input.objectSize ? OBJECT_SIZE_RULES[input.objectSize].forceLoad : input.kind === 'saberThrow' ? SABER_THROW.baseLoad : input.kind === 'recall' ? SABER_THROW.recallLoad : input.kind === 'mindTrick' ? MIND_TRICK_COMBAT.baseLoad : (FORCE_BASE_LOAD[abilityId] ?? 0.2);
  // No Force flows inside a Force-null bubble: no load, no roll (D-192).
  const load = ctx.forceNegated ? 0 : forceLoadPerUse(baseLoad, input.effort, input.level, ci.strainMult);
  const fl = applyForceLoad({ p: user.meters.p, m: user.meters.m ?? 0, f: user.meters.f }, user.caps.f, load, input.angerChanneling ?? false);
  const [collapse, rngAfterCollapse] = rollCollapse(s.rng, fl.overLimit);
  let rng = rngAfterCollapse;
  const [mf, r1] = nextFloat(rng);
  rng = r1;
  const misfire = !ctx.forceNegated && mf < ci.misfire;
  const isRecall = input.kind === 'recall';
  const tgt = isRecall ? null : forceTargetOf(target, s, ctx, input.side);
  let contest: ForceContestResult = { user: null, resist: null, resistKind: null, dc: null, margin: 0, success: false, outcome: 'skillTooLow' };
  if (!misfire && !collapse) {
    // The saber throw's first roll is control: difficulty only (its strikes are rolled per target below).
    const asObject = input.kind === 'saberThrow' || isRecall;
    [contest, rng] = forceContest(rng, {
      kind: input.kind,
      group: asObject ? 'object' : group,
      level: ci.effectiveLevel,
      modifiers: input.bonus ? [{ source: 'sequence chain', value: input.bonus }] : [],
      target: asObject ? null : tgt,
      ...(input.objectSize ? { objectSize: input.objectSize } : {}),
      negated: ctx.forceNegated === true,
      ...(input.targetDefense ? { targetDefense: input.targetDefense } : {}),
    });
  }
  let success = contest.success;
  // Backlash mental load goes onto the user's mental meter (health §2 via forceMeter.ts; D-194).
  let updatedUser: Fighter = { ...user, meters: { ...user.meters, f: fl.meters.f, p: user.meters.p + EXERTION_PER_EXCHANGE, ...(user.meters.m !== undefined || fl.backlashMental > 0 ? { m: fl.meters.m } : {}) }, out: user.out || collapse };
  let updatedTarget: Fighter = target;
  let damage: ForceActionRecord['damage'] = null;
  let advantage = s.advantage;
  const dir = input.side === 'A' ? 1 : -1;
  const extraRecords: ExchangeRecord[] = [];
  let saberHits: SaberThrowHit[] | undefined;
  let saberDropped = false;
  let stoodDown = false;
  if (isRecall) {
    if (success) updatedUser = recoverSaber(updatedUser);
  } else if (input.kind === 'saberThrow') {
    if (!success && !misfire && !collapse && contest.outcome !== 'negated') {
      saberDropped = true;
    } else if (success) {
      // The arc (D-193): up to maxTargets engaged minions, the current target first; a duelist alone gets one strike.
      const opps = input.side === 'A' ? engaged(s) : [s.a];
      const minionArc = target.minion ? [target, ...opps.filter((o) => o.id !== target.id && o.minion)].slice(0, SABER_THROW.maxTargets) : [target];
      saberHits = [];
      const formLevel = fighterEffectiveLevel(user);
      for (const victim of minionArc) {
        let roll: BasicRoll;
        let defense: BasicRoll;
        [roll, rng] = basicRoll(rng, formLevel, []);
        // A duelist deflects with their own fighting skill; a Force user may interrupt it with their own Force.
        [defense, rng] = basicRoll(rng, fighterEffectiveLevel(victim), []);
        let margin = roll.total - defense.total;
        if (!victim.minion && (victim.forceResistance ?? 0) > 0 && contest.user) {
          let grab: BasicRoll;
          [grab, rng] = basicRoll(rng, victim.forceResistance ?? 0, []);
          if (grab.total > contest.user.total) {
            if (SABER_THROW.interruptDropsSaber) saberDropped = true;
            margin = Math.min(margin, -1);
          }
        }
        const quality = qualityOf(Math.round(margin));
        const hitIt = Math.round(margin) >= (victim.minion ? SABER_THROW.hitMargin : 4) && quality !== null && !saberDropped;
        let after = victim;
        let hit: ExchangeRecord['hit'] = null;
        if (hitIt) {
          const d = damageFighter(victim, quality!, Math.round(margin), user.weapon, ctx, rng, day, victim.wounds.length + 1, ctx.sparring === 'trainingSaber' || user.weapon === 'trainingSaber');
          rng = d.rng;
          after = d.f;
          hit = { by: input.side, ...d.hit, avoided: false };
        }
        if (isDying(after.wounds) || isIncapacitated(after.wounds) || cannotDuel(after)) after = { ...after, out: true };
        saberHits.push({ targetId: victim.id, roll, defense, margin, quality: hitIt ? quality : null, cutDown: hitIt && after.out });
        if (victim.id === target.id) updatedTarget = after;
        else s = { ...s, opponents: s.opponents.map((o) => (o.id === after.id ? after : o)) };
        extraRecords.push({
          n: 0,
          kind: 'strike',
          targetId: victim.id,
          rollA: input.side === 'A' ? roll : defense,
          rollB: input.side === 'A' ? defense : roll,
          margin: input.side === 'A' ? margin : -margin,
          advBefore: s0.advantage,
          advAfter: s0.advantage,
          striker: input.side,
          hit,
          maneuver: null,
          effA: formLevel,
          effB: fighterEffectiveLevel(victim),
          seconds: 0,
          notes: [`thrown saber: ${hitIt && hit ? minionHitNote(user.name, victim.name, after, hit) : `misses ${victim.name}`}${saberDropped && !victim.minion ? `; ${victim.name} wrenches it from its arc with the Force` : ''}`],
          surprise: false,
        });
        if (saberDropped) break;
      }
      if (saberDropped) success = false;
    }
    if (saberDropped) updatedUser = dropSaber(updatedUser);
  } else if (success) {
    if (input.kind === 'push' || input.kind === 'choke') {
      const from = advantage;
      advantage = Math.max(-5, Math.min(5, advantage + dir * CIRCUMSTANCE.openingAdvantage));
      // A first use jumps toward the strike, at most FIRST_USE_MAX_GAIN steps in one move (D-220).
      if (input.firstUse) advantage = dir > 0 ? Math.max(advantage, Math.min(STRIKE_AT, from + FIRST_USE_MAX_GAIN)) : Math.min(advantage, Math.max(-STRIKE_AT, from - FIRST_USE_MAX_GAIN));
    }
    else if (input.kind === 'mindTrick') {
      if (target.minion && MIND_TRICK_COMBAT.minionOut) {
        updatedTarget = { ...target, out: true };
        stoodDown = true;
      } else advantage = Math.max(-5, Math.min(5, advantage + dir * MIND_TRICK_COMBAT.openingAdvantage));
    } else {
      let D: number;
      let bypass: number;
      if (input.kind === 'lightning') {
        D = damageOf({ weapon: 'blasterPistol', quality: 'solid', armor: 'none', saberResistant: false, base: LIGHTNING_PER_OUTPUT * input.forceOutput * FORCE_EFFORT[input.effort] });
        bypass = 0;
      } else {
        const rules = OBJECT_SIZE_RULES[input.objectSize ?? 'small'];
        const h = hazardDamage(rules.hazard, rules.severity);
        D = h.D * (target.speciesId ? traitHazardFactor(target.speciesId, rules.hazard) : 1);
        bypass = h.bypass;
      }
      const [part, r2] = rollLocation(rng, LOCATION_WEIGHTS);
      rng = r2;
      const dmg = applyDamage(target.vitality, D, bypass);
      const sev = severityOf(dmg.W);
      updatedTarget = { ...target, vitality: dmg.vitality, out: target.out || (target.minion && dmg.vitality <= 0) };
      if (sev) {
        const w: Wound = { id: `${target.id}:w${target.wounds.length + 1}`, part, severity: sev, W: dmg.W, stabilized: false, healProgress: 0, day, source: `force:${abilityId}` };
        const held = target.aboveBar ? barWound(target, w) : { wound: w, breaksOff: false };
        if (held.wound) updatedTarget = { ...updatedTarget, wounds: [...target.wounds, held.wound], dead: target.dead || killsWhileDying(target.wounds, held.wound), out: updatedTarget.out || (target.minion && takesMinionOut(sev)) };
        if (held.breaksOff) updatedTarget = breakOff(updatedTarget);
        damage = { D, W: held.wound?.W ?? 0, part, severity: held.wound?.severity ?? null };
      } else damage = { D, W: dmg.W, part, severity: sev };
    }
  }
  if (isDying(updatedTarget.wounds) || isIncapacitated(updatedTarget.wounds) || cannotDuel(updatedTarget)) updatedTarget = { ...updatedTarget, out: true };
  const [secs, r3] = nextInt(rng, EXCHANGE_SECONDS.min, EXCHANGE_SECONDS.max);
  rng = r3;
  const effUser = ci.effectiveLevel;
  const effTarget = contest.resist?.effectiveLevel ?? (contest.dc !== null ? (contest.dc - 10) * 10 : target.willpower);
  if (input.side === 'A') {
    s = { ...s, a: updatedUser, opponents: s.opponents.map((o) => (o.id === updatedTarget.id ? updatedTarget : o)) };
  } else {
    s = { ...s, a: updatedTarget, opponents: s.opponents.map((o) => (o.id === updatedUser.id ? updatedUser : o)) };
  }
  const outcome: ForceOutcome = input.kind === 'saberThrow' && contest.success && !success ? 'forceResisted' : contest.outcome;
  const record: ForceActionRecord = {
    kind: input.kind,
    abilityId,
    side: input.side,
    user: contest.user,
    resist: contest.resist,
    resistKind: contest.resistKind,
    dc: contest.dc,
    margin: contest.margin,
    success,
    outcome,
    misfire,
    load,
    backlashMental: fl.backlashMental,
    collapse,
    damage,
    ci,
    seconds: secs,
    effUser,
    effTarget,
    ...(saberHits ? { saberHits } : {}),
    ...(input.objectTag ? { objectTag: input.objectTag } : {}),
    ...(input.kind === 'saberThrow' ? { saberDropped } : {}),
    ...(stoodDown ? { stoodDown } : {}),
  };
  const name = input.side === 'A' ? s0.a.name : user.name;
  const rec: ExchangeRecord = {
    n: s.exchange + 1,
    kind: 'force',
    targetId: input.side === 'A' ? target.id : user.id,
    rollA: input.side === 'A' ? contest.user : contest.resist,
    rollB: input.side === 'A' ? contest.resist : contest.user,
    margin: input.side === 'A' ? contest.margin : -contest.margin,
    advBefore: s0.advantage,
    advAfter: advantage,
    striker: null,
    hit: null,
    maneuver: null,
    effA: input.side === 'A' ? effUser : effTarget,
    effB: input.side === 'A' ? effTarget : effUser,
    seconds: secs,
    notes: [`${name}: ${input.kind === 'saberThrow' ? 'saber throw' : input.kind === 'recall' ? 'saber recall' : (SKILL_BY_ID.get(abilityId)?.name ?? abilityId)} ${forceReason(record)}${contest.dc !== null ? ` (difficulty DC ${contest.dc})` : ''}${stoodDown ? `; ${target.name} stands down` : ''}`],
    surprise: false,
    force: record,
  };
  const log = [...s.log, rec, ...extraRecords.map((x, k) => ({ ...x, n: rec.n + 1 + k }))];
  s = settleEnd({ ...s, advantage, rng, exchange: s.exchange + 1 + extraRecords.length, seconds: s.seconds + secs, log, spentNow: null });
  return { state: s, record };
}

/** True when the fighter can make a saber throw (D-193): holding a saber, telekinesis and a form at the minimums. */
export function canThrowSaber(f: Fighter, telekinesis: number): boolean {
  // A level read back from XP can sit a hair under the requirement (pass 4: /set telekinesis 15 read 14.9999...).
  const EPS = 1e-6;
  return hasSaber(f) && !f.saberLost && telekinesis >= SABER_THROW.minTelekinesis - EPS && f.level >= SABER_THROW.minForm - EPS;
}

