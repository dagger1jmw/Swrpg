// Rank rules (ranks.md §1-5, flag-registry.md §2-3; M7 §15, D-424). Pure: no DOM, no network, no state access; the
// selectors feed them. Every promotion is a story event the player plays: code checks the requirements, rolls the
// checks and applies the result; the AI only proposes.
import { COVERT_LEARNING, ORDER_POWER_RULES } from '../../data/orderPowerRules';
import { COUNCIL_BYPASS, DEED_POINTS, DEEDS_PAST, KNIGHT_TRIAL_IDS, PACE_MILESTONES, SELECTION, STANDING_WEIGHTS, TRIALS, TRIAL_RULES, type PaceMilestone, type TrialDef, type TrialId } from '../../data/ranks.config';
import { KNIGHT_TRIALS } from '../../data/rankMinimums';
import { basicRoll, dcForRating, type BasicRoll } from '../../engine/rolls';
import type { RngState } from '../../engine/rng';

/** A trial's record: failures, whether it is passed, and the day of the last attempt. */
export interface TrialRecord {
  passed: boolean;
  fails: number;
  lastDay: number | null;
}
export const NO_RECORD: TrialRecord = { passed: false, fails: 0, lastDay: null };

/** The skill minimums of a rank row (rankMinimums.ts) that are not met. '$main' and '$highestForm' are resolved by the caller. */
export function unmetMinimums(mins: Readonly<Record<string, number>>, levelOf: (key: string) => number): string[] {
  return Object.entries(mins)
    .filter(([k, min]) => levelOf(k) < min)
    .map(([k, min]) => `${k === '$main' ? 'main specialty' : k === '$highestForm' ? 'highest form' : k} ${levelOf(k).toFixed(1)} < ${min}`);
}

/** The share of a population below a composite (0-1), the skill percentile of standing (D-66). */
export function percentileOf(composite: number, population: readonly number[]): number {
  if (!population.length) return 0.5;
  let below = 0;
  for (const p of population) if (p < composite) below++;
  return below / population.length;
}

/** The deeds score (D-424, D-435): DEED_POINTS a deed to 100 at DEEDS_PAST.from, then diminishing returns toward 130. */
export function deedScore(n: number): number {
  if (n <= DEEDS_PAST.from) return Math.max(0, n) * DEED_POINTS;
  return DEEDS_PAST.from * DEED_POINTS + DEEDS_PAST.extra * (1 - Math.exp(-(n - DEEDS_PAST.from) / DEEDS_PAST.scale));
}

/**
 * Standing S (ranks.md §1): 50% skill percentile, 30% deeds, 20% relationships with Knights and Masters; up to 109 with
 * deeds past the fifth (D-435).
 */
export function standing(i: { percentile: number; deeds: number; relationships: number }): number {
  const deeds = deedScore(i.deeds);
  const rel = Math.max(0, Math.min(100, i.relationships));
  return STANDING_WEIGHTS.percentile * 100 * i.percentile + STANDING_WEIGHTS.deeds * deeds + STANDING_WEIGHTS.relationships * rel;
}

/** The Order's verdict on learning a power (D-436): open, refused by an Order teacher, or covert (allowed, at a risk). */
export type OrderPowerVerdict = { kind: 'open'; note?: string } | { kind: 'refused'; reason: string } | { kind: 'covert'; reason: string };

/**
 * The Jedi Order's rules on a power (D-346, D-436; ORDER_POWER_RULES): only Jedi-path characters are bound. A forbidden
 * power in force is open to a Master in its controlled-study years and to anyone with a Master's permission; a dark-side
 * power never is. Otherwise an Order teacher (the Temple's instructors, a Jedi master, Jedi records) refuses it, and
 * learning it any other way is covert.
 */
export function orderPowerVerdict(i: { abilityId: string; name: string; year: number; path: string; rank: string; permitted: boolean; orderTeacher: boolean }): OrderPowerVerdict {
  const rule = ORDER_POWER_RULES[i.abilityId];
  if (i.path !== 'jedi' || !rule || rule.status === 'open') return { kind: 'open' };
  if (rule.status === 'forbidden') {
    if ((rule.fromYear !== undefined && i.year < rule.fromYear) || (rule.untilYear !== undefined && i.year >= rule.untilYear)) return { kind: 'open' };
    if (i.rank === 'master' && (rule.masterStudyFromYear === undefined || i.year >= rule.masterStudyFromYear)) return { kind: 'open', note: `${i.name}: a Master's controlled study (D-346)` };
    if (i.permitted) return { kind: 'open', note: `${i.name}: learned with a Master's permission (D-346)` };
  }
  const what = rule.status === 'forbidden' ? `forbidden by the Jedi Order (a Master's permission is needed)` : 'a dark-side power the Jedi Order never teaches';
  if (i.orderTeacher) return { kind: 'refused', reason: `${i.name} is ${what}` };
  return { kind: 'covert', reason: `${i.name} is ${what}: learning it covertly risks your standing in the Order` };
}

/** The chance a covert session is discovered (D-436): COVERT_LEARNING.perHour a session hour, at most maxChance. */
export const covertDiscoveryChance = (hours: number): number => Math.min(COVERT_LEARNING.maxChance, COVERT_LEARNING.perHour * Math.max(0, hours));

/** The monthly chance a Knight or Master chooses an Initiate (S / 940; ranks.md §1, D-120). */
export const selectionChance = (s: number): number => Math.max(0, Math.min(1, s / SELECTION.divisor));

/** Why a trial may not be attempted now, or null (ranks.md §1: eligibility; retakes after 1 year; three failures end it). */
export function trialBlock(
  trial: TrialId,
  c: { rank: string; age: number; padawanYears: number; masterApproval: boolean; unmetKnight: readonly string[]; unmetInitiate: readonly string[]; corps: boolean },
  record: TrialRecord,
  today: number,
): string | null {
  if (record.passed) return `${TRIALS[trial].name} is already passed`;
  if (record.fails >= TRIAL_RULES.maxFailures) return `${TRIALS[trial].name} was failed ${TRIAL_RULES.maxFailures} times: no more attempts`;
  if (record.lastDay !== null && today - record.lastDay < TRIAL_RULES.retakeWaitDays) return `a retake waits a year after a failure (${Math.ceil(TRIAL_RULES.retakeWaitDays - (today - record.lastDay))} days left)`;
  if (trial === 'initiate') {
    if (c.rank !== 'initiate' || c.corps) return 'the Initiate Trials are for Initiates in the Temple';
    if (c.age < 10) return 'the Initiate Trials open at age 10';
    if (c.unmetInitiate.length) return `unmet minimums: ${c.unmetInitiate.join(', ')}`;
    return null;
  }
  if (c.rank !== 'padawan') return 'the Knight Trials are for Padawans';
  if (c.age < 18) return 'the Knight Trials open at age 18';
  if (c.padawanYears < KNIGHT_TRIALS.padawanYears) return `${KNIGHT_TRIALS.padawanYears} years as a Padawan first (${c.padawanYears.toFixed(1)} so far)`;
  if (!c.masterApproval) return "the master's approval is needed (masterApproval)";
  if (c.unmetKnight.length) return `unmet Knight minimums: ${c.unmetKnight.join(', ')}`;
  return null;
}

/** One trial check's roll (rolls.md §1): d20 + level / 10 against DC 10 + rating / 10. */
export interface TrialRoll extends BasicRoll {
  skill: string;
  dc: number;
  success: boolean;
}

/**
 * A trial's checks (ranks.md §1). `levelOf` gives the effective level of a skill (the Flesh trial's fatigue is applied by
 * the caller); the Spirit trial's DC is 10 + dark pressure / 5 + 4.
 */
export function rollTrial(rng: RngState, def: TrialDef, levelOf: (skill: string) => number, darkPressure: number): { passed: boolean; rolls: TrialRoll[]; rng: RngState } {
  let r = rng;
  const rolls: TrialRoll[] = [];
  for (const chk of def.checks) {
    const [roll, next] = basicRoll(r, levelOf(chk.skill), []);
    r = next;
    const dc = def.id === 'spirit' ? 10 + darkPressure / 5 + 4 : dcForRating(chk.rating);
    rolls.push({ ...roll, skill: chk.skill, dc, success: roll.total >= dc });
  }
  return { passed: rolls.filter((x) => x.success).length >= def.need, rolls, rng: r };
}

/** The Knight Trials done: each passed, or credited by a wartime heroic act (Courage and Flesh only; ranks.md §1). */
export function knightTrialsDone(records: Readonly<Record<string, TrialRecord>>, heroic: boolean): { done: boolean; missing: string[] } {
  const missing = KNIGHT_TRIAL_IDS.filter((t) => !(records[t]?.passed || (heroic && TRIALS[t].heroicCredit)));
  return { done: missing.length === 0, missing: missing.map((t) => TRIALS[t].name) };
}

/** The Council bypass conditions (flag-registry §3); the unmet ones, empty when it fires. */
export function bypassUnmet(c: { wartime: boolean; heroic: boolean; standing: number; age: number; rank: string; unmetKnight: readonly string[] }): string[] {
  const out: string[] = [];
  if (!c.wartime) out.push('not wartime');
  if (!c.heroic) out.push('no heroic act');
  if (c.standing < COUNCIL_BYPASS.standing) out.push(`standing ${c.standing.toFixed(0)} < ${COUNCIL_BYPASS.standing}`);
  if (c.age < COUNCIL_BYPASS.minAge) out.push(`age under ${COUNCIL_BYPASS.minAge}`);
  if (c.rank !== 'padawan') out.push('not a Padawan');
  if (c.unmetKnight.length) out.push('Knight minimums unmet');
  return out;
}


/** The pace-for-age milestones due now (ranks.md §4; PACE_MILESTONES), not yet reached. */
export function paceMilestonesDue(c: { years: number; pace: number; aheadYears: number | null; reached: readonly string[] }): PaceMilestone[] {
  if (c.years < PACE_MILESTONES.afterYears) return [];
  const due: PaceMilestone[] = [];
  if (c.pace >= PACE_MILESTONES.noticed.pace) due.push('noticed');
  if (c.pace >= PACE_MILESTONES.prodigyTalk.pace) due.push('prodigyTalk');
  if (c.aheadYears !== null && c.aheadYears >= PACE_MILESTONES.aheadOfTime.years) due.push('aheadOfTime');
  return due.filter((m) => !c.reached.includes(m));
}
