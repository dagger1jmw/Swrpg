// computeXp, combat branch (combat-xp.md §1-2, D-55). Per exchange 0.25 * challenge(gap) * stakes *
// outcome * long-bout factor * M; 0.75 to the skill used, 0.25 to physical stats by that form's activity weights;
// Force uses 0.1 * challenge * stakes * M with no split. No hours, no fatigue, no outcome roll: the fight's
// outcome replaces it. No daily limit (Jared, m9-tune2 item 8: the body limits fighting, not an XP rule); the
// 4.0x clamp hook is applied through `clamp`. E, CI, the sparring ceiling and the bank are the caller's. Pure.
import { PHYSICAL_COLLAPSE } from '../data/health.config';
import { COMBAT_XP, GOOD_FORM, LONG_BOUT, PRIMARY_SHARE, PUSH_ENDURANCE, SECONDARY_SHARE, STRAIN_WILLPOWER, STRONGER_DUEL, type CombatOutcome, type CombatStakes } from '../data/progression.config';
import type { ExchangeRecord } from './duel';
import { efficiency, fatigueWillpowerRate } from './fatigue';
import { FORM_IDS } from '../data/skills';
import { challengeFactor } from './challenge';

export interface CombatSession {
  stakes: CombatStakes;
  outcome: CombatOutcome;
  /**
   * One entry per exchange, by the skill used (the form for melee, blaster for ranged). `n` is the exchange's number in its
   * continuous bout (1 = the bout's first) and `adv` the advantage track before it, from the player's side: with both, a long
   * close bout pays more (LONG_BOUT); without them the exchange pays the plain rate.
   */
  exchanges: readonly CombatExchange[];
  forceUses: readonly { abilityId: string; gap: number }[];
  /** The player surrendered (outcome lost): COMBAT_XP.surrendered in place of the outcome factor (D-227). */
  surrendered?: boolean;
}

export interface CombatInput {
  session: CombatSession;
  /** Speed multiplier M per skill (capped at 2.8). */
  m(skill: string): number;
  /** Physical-stat weights for a skill's 0.25 split (normalized here); empty = all to the skill. */
  physicalWeights(skill: string): Readonly<Record<string, number>>;
  clamp(skill: string, wanted: number): { credited: number; discarded: number };
  /** A field fight (m9-tune A3): this factor on each exchange's XP. */
  fieldMult?: number;
}

export interface CombatExchange {
  skillId: string;
  /** The opponent's level minus the fighter's, both rested (m9-tune2 addendum 3a). */
  gap: number;
  /** The exchange's number in its run against the same opponent (addendum 1). */
  n?: number;
  adv?: number;
  /** Good form: the natural d20 met the threshold (addendum 3c). */
  form?: boolean;
  /** The fighter's physical strain (meter / capacity) before the exchange. */
  strain?: number;
  /** Pushing through (addendum 3e). */
  push?: boolean;
}

export interface CombatResult {
  /** Before M, per skill used: for the day's counters. */
  beforeM: Record<string, number>;
  credited: Record<string, number>;
  discarded: Record<string, number>;
  notes: string[];
}

/** combat-xp §1: the §4 curve from gap -25 up; a straight ramp to 0 at -35; 0 below (D-65). */
export function combatChallenge(gap: number): number {
  if (gap >= COMBAT_XP.rampFrom) return challengeFactor(gap);
  if (gap <= COMBAT_XP.zeroAt) return 0;
  const at = challengeFactor(COMBAT_XP.rampFrom);
  return (at * (gap - COMBAT_XP.zeroAt)) / (COMBAT_XP.rampFrom - COMBAT_XP.zeroAt);
}

/**
 * The long-bout factor of one exchange (Jared, m9-tune2 item 7; LONG_BOUT): 1 through exchange `from`, then rising linearly to
 * `maxMult` at `full`, capped there; only while the fight is close (challenge above 0, the track within +/-closeTrack). 1 when the
 * exchange carries no bout number or track.
 */
export function longBoutFactor(ex: CombatExchange): number {
  if (ex.n === undefined || ex.adv === undefined || ex.n <= LONG_BOUT.from) return 1;
  if (combatChallenge(ex.gap) <= 0 || Math.abs(ex.adv) > LONG_BOUT.closeTrack) return 1;
  return Math.min(LONG_BOUT.maxMult, 1 + ((LONG_BOUT.maxMult - 1) * (ex.n - LONG_BOUT.from)) / (LONG_BOUT.full - LONG_BOUT.from));
}

/** The good-form threshold on the natural d20 (GOOD_FORM): lower while pushing through, by Willpower. */
export function goodFormThreshold(push: boolean, willpower: number): number {
  return push ? Math.max(GOOD_FORM.pushFloor, GOOD_FORM.threshold - willpower / GOOD_FORM.pushWillpowerPer) : GOOD_FORM.threshold;
}

/**
 * The good-form factor at a strain (GOOD_FORM; m9-tune3): 1 + gain x s^steep / (half^steep + s^steep), s the strain capped at the hard
 * limit. Flat near rest (a fresh fighter's fight barely moves), 1 + gain / 2 at `half` (capacity: about x2), still rising toward the
 * hard limit.
 */
export function goodFormMult(strain: number): number {
  const s = Math.min(PHYSICAL_COLLAPSE.hardLimit, Math.max(0, strain));
  if (s === 0) return 1;
  const k = Math.pow(s, GOOD_FORM.steep);
  return 1 + (GOOD_FORM.gain * k) / (Math.pow(GOOD_FORM.half, GOOD_FORM.steep) + k);
}

/**
 * The exchanges of a fight for combat XP, from the duel log (m9-tune2 items 7 and addenda 1, 3): the skill used, the gap from rested
 * levels, the number in the run against the same opponent (a new bout of a spar, or another opponent, starts a new run), the track,
 * good form, strain and pushing. Force actions are not exchanges here.
 */
export function fightExchanges(log: readonly ExchangeRecord[], o: { skillAt: (i: number) => string; boutLengths?: readonly number[]; willpower: number }): CombatExchange[] {
  const strikes = log.filter((r) => r.kind !== 'force');
  const inBout = boutNumbers(strikes.map((r) => r.n), o.boutLengths ?? []);
  let run = 0;
  return strikes.map((r, i) => {
    run = inBout[i] === 1 || i === 0 || strikes[i - 1]!.targetId !== r.targetId ? 1 : run + 1;
    const push = r.pushA === true;
    return {
      skillId: o.skillAt(i),
      gap: (r.restB ?? r.effB) - (r.restA ?? r.effA),
      n: run,
      adv: r.advBefore,
      ...(r.dieA !== undefined ? { form: r.dieA >= goodFormThreshold(push, o.willpower) } : {}),
      ...(r.strainA !== undefined ? { strain: r.strainA } : {}),
      ...(push ? { push: true } : {}),
    };
  });
}

/** Each exchange's number in its bout, from the bouts' lengths in order (a spar's session, D-168); one bout when none are given. */
export function boutNumbers(ns: readonly number[], boutLengths: readonly number[] = []): number[] {
  const starts: number[] = [0];
  for (const len of boutLengths) starts.push(starts[starts.length - 1]! + len);
  return ns.map((n) => {
    let start = 0;
    for (const x of starts) if (x < n) start = x;
    return n - start;
  });
}

export function computeCombatXp(input: CombatInput): CombatResult {
  const { session } = input;
  const stakes = COMBAT_XP.stakes[session.stakes];
  const outcome = session.surrendered ? COMBAT_XP.surrendered : COMBAT_XP.outcome[session.outcome];
  const notes: string[] = [];
  const rawBySkill: Record<string, number> = {};
  const field = input.fieldMult ?? 1;
  if (field !== 1) notes.push(`a field fight: x${field} on the exchanges`);
  let ramped = 0;
  let rampXp = 0;
  let good = 0;
  let goodXp = 0;
  let sloppy = 0;
  let sloppyLost = 0;
  const spar = session.stakes === 'spar';
  const extra: Record<string, number> = {};
  for (const ex of session.exchanges) {
    const challenge = combatChallenge(ex.gap);
    const base = COMBAT_XP.perExchange * challenge * stakes * outcome * field;
    const f = longBoutFactor(ex);
    if (f > 1) {
      ramped += 1;
      rampXp += base * (f - 1);
    }
    const strain = ex.strain ?? 0;
    // Good form under strain pays more (addendum 3c); in a spar a low roll pays the training efficiency (addendum 3d).
    let form = 1;
    if (ex.form && strain > 0) form = goodFormMult(strain);
    else if (spar && !ex.form && ex.strain !== undefined) form = efficiency(strain);
    if (ex.form && form > 1) {
      good += 1;
      goodXp += base * f * (form - 1);
    } else if (form < 1) {
      sloppy += 1;
      sloppyLost += base * f * (1 - form);
    }
    rawBySkill[ex.skillId] = (rawBySkill[ex.skillId] ?? 0) + base * f * form;
    // Willpower from fighting on under strain (addendum 3b) and Endurance from keeping form while pushing (3e).
    if (strain >= STRAIN_WILLPOWER.from && challenge > 0) extra['willpower'] = (extra['willpower'] ?? 0) + STRAIN_WILLPOWER.perExchange * fatigueWillpowerRate(strain) * challenge;
    if (ex.push && ex.form && challenge > 0) extra['endurance'] = (extra['endurance'] ?? 0) + PUSH_ENDURANCE.perExchange * challenge;
  }
  if (ramped > 0) notes.push(`a long close bout: ${ramped} exchange${ramped === 1 ? '' : 's'} past ${LONG_BOUT.from} against one opponent paid more (+${rampXp.toFixed(2)} XP before M)`);
  if (good > 0) notes.push(`good form while tired: ${good} exchange${good === 1 ? '' : 's'} (+${goodXp.toFixed(2)} XP before M)`);
  if (sloppy > 0) notes.push(`tired sparring: ${sloppy} exchange${sloppy === 1 ? '' : 's'} at the training efficiency (-${sloppyLost.toFixed(2)} XP before M)`);
  if (extra['willpower']) notes.push(`fighting on under strain: +${extra['willpower'].toFixed(3)} Willpower XP before M`);
  if (extra['endurance']) notes.push(`pushing through in good form: +${extra['endurance'].toFixed(3)} Endurance XP before M`);
  const forceBySkill: Record<string, number> = {};
  for (const u of session.forceUses) forceBySkill[u.abilityId] = (forceBySkill[u.abilityId] ?? 0) + COMBAT_XP.perForceUse * combatChallenge(u.gap) * stakes;

  const beforeM: Record<string, number> = {};
  const counted = (skill: string, v: number): number => {
    beforeM[skill] = (beforeM[skill] ?? 0) + v;
    return v;
  };

  const wanted: Record<string, number> = {};
  const add = (k: string, v: number): void => {
    if (v > 0) wanted[k] = (wanted[k] ?? 0) + v;
  };
  for (const [skill, raw] of Object.entries(rawBySkill)) {
    const v = counted(skill, raw);
    const w = input.physicalWeights(skill);
    const tot = Object.values(w).reduce((a, b) => a + b, 0);
    if (tot <= 0) {
      add(skill, v * input.m(skill));
      continue;
    }
    add(skill, v * PRIMARY_SHARE * input.m(skill));
    for (const [stat, x] of Object.entries(w)) add(stat, ((v * SECONDARY_SHARE * x) / tot) * input.m(stat));
  }
  for (const [ability, raw] of Object.entries(forceBySkill)) add(ability, counted(ability, raw) * input.m(ability));
  for (const [stat, raw] of Object.entries(extra)) add(stat, counted(stat, raw) * input.m(stat));

  const credited: Record<string, number> = {};
  const discarded: Record<string, number> = {};
  for (const [skill, v] of Object.entries(wanted)) {
    const c = input.clamp(skill, v);
    if (c.credited > 0) credited[skill] = c.credited;
    if (c.discarded > 1e-9) {
      discarded[skill] = c.discarded;
      notes.push(`4.0x pace clamp: ${c.discarded.toFixed(2)} combat XP to ${skill} discarded`);
    }
  }
  return { beforeM, credited, discarded, notes };
}

/**
 * Learning by dueling a stronger opponent (Jared, D-427; STRONGER_DUEL, invented): a serious or lethal fight against an
 * opponent at least `minGap` levels stronger gives `share` of the fight's credited form XP to the opponent's form as well
 * (an unknown form included: it then opens without a teacher); x`acceleratedMult` on the accelerated path. Null when it
 * does not apply.
 */
export function strongerDuelXp(stakes: string, opponentGap: number, opponentForm: string | null, credited: Readonly<Record<string, number>>, accelerated: boolean): { form: string; xp: number } | null {
  if (!opponentForm || !FORM_IDS.includes(opponentForm)) return null;
  if (stakes !== 'serious' && stakes !== 'lethal') return null;
  if (opponentGap < STRONGER_DUEL.minGap) return null;
  const formXp = Object.entries(credited).reduce((a, [k, v]) => a + (FORM_IDS.includes(k) ? v : 0), 0);
  const xp = formXp * STRONGER_DUEL.share * (accelerated ? STRONGER_DUEL.acceleratedMult : 1);
  return xp > 0 ? { form: opponentForm, xp } : null;
}
