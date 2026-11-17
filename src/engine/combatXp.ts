// computeXp, combat branch (combat-xp.md §1-2, D-55). Per exchange 0.25 * challenge(gap) * stakes *
// outcome * M; 0.75 to the skill used, 0.25 to physical stats by that form's activity weights; Force
// uses 0.1 * challenge * stakes * M with no split. No hours, no fatigue, no outcome roll: the fight's
// outcome replaces it. The daily cap (12 XP per skill before M) and the third-fight halving apply per
// skill; the 4.0x clamp is applied through `clamp`. E, CI, the sparring ceiling and the bank arrive with
// duels in M5. Pure.
import { COMBAT_XP, PRIMARY_SHARE, SECONDARY_SHARE, type CombatOutcome, type CombatStakes } from '../data/progression.config';
import { challengeFactor } from './challenge';

export interface CombatSession {
  stakes: CombatStakes;
  outcome: CombatOutcome;
  /** One entry per exchange, by the skill used (the form for melee, blaster for ranged). */
  exchanges: readonly { skillId: string; gap: number }[];
  forceUses: readonly { abilityId: string; gap: number }[];
}

export interface CombatInput {
  session: CombatSession;
  /** Speed multiplier M per skill (capped at 2.8). */
  m(skill: string): number;
  /** Physical-stat weights for a skill's 0.25 split (normalized here); empty = all to the skill. */
  physicalWeights(skill: string): Readonly<Record<string, number>>;
  /** Combat XP (before M) already credited today per skill. */
  todayBeforeM(skill: string): number;
  /** Fights this skill was used in earlier today. */
  fightsToday(skill: string): number;
  clamp(skill: string, wanted: number): { credited: number; discarded: number };
}

export interface CombatResult {
  /** Before M, per skill used (after the cap and the later-fight factor): for the daily counters. */
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

export function computeCombatXp(input: CombatInput): CombatResult {
  const { session } = input;
  const stakes = COMBAT_XP.stakes[session.stakes];
  const outcome = COMBAT_XP.outcome[session.outcome];
  const notes: string[] = [];
  const rawBySkill: Record<string, number> = {};
  for (const ex of session.exchanges) rawBySkill[ex.skillId] = (rawBySkill[ex.skillId] ?? 0) + COMBAT_XP.perExchange * combatChallenge(ex.gap) * stakes * outcome;
  const forceBySkill: Record<string, number> = {};
  for (const u of session.forceUses) forceBySkill[u.abilityId] = (forceBySkill[u.abilityId] ?? 0) + COMBAT_XP.perForceUse * combatChallenge(u.gap) * stakes;

  const beforeM: Record<string, number> = {};
  const capped = (skill: string, raw: number): number => {
    let v = raw;
    if (input.fightsToday(skill) + 1 >= COMBAT_XP.laterFightFrom) {
      v *= COMBAT_XP.laterFightFactor;
      notes.push(`${skill}: third or later fight today (x${COMBAT_XP.laterFightFactor})`);
    }
    const room = Math.max(0, COMBAT_XP.dailyCap - input.todayBeforeM(skill) - (beforeM[skill] ?? 0));
    if (v > room + 1e-9) notes.push(`${skill}: daily combat cap ${COMBAT_XP.dailyCap} XP reached (${v.toFixed(2)} -> ${room.toFixed(2)})`);
    v = Math.min(v, room);
    beforeM[skill] = (beforeM[skill] ?? 0) + v;
    return v;
  };

  const wanted: Record<string, number> = {};
  const add = (k: string, v: number): void => {
    if (v > 0) wanted[k] = (wanted[k] ?? 0) + v;
  };
  for (const [skill, raw] of Object.entries(rawBySkill)) {
    const v = capped(skill, raw);
    const w = input.physicalWeights(skill);
    const tot = Object.values(w).reduce((a, b) => a + b, 0);
    if (tot <= 0) {
      add(skill, v * input.m(skill));
      continue;
    }
    add(skill, v * PRIMARY_SHARE * input.m(skill));
    for (const [stat, x] of Object.entries(w)) add(stat, ((v * SECONDARY_SHARE * x) / tot) * input.m(stat));
  }
  for (const [ability, raw] of Object.entries(forceBySkill)) add(ability, capped(ability, raw) * input.m(ability));

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
