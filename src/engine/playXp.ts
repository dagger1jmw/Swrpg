// XP from play for the non-Force skills (m8-skills, D-513; spec/skills-m8.md section 3). Pure: each source turns a
// structured line from code (never the narrator) into XP before M (the character's speed multiplier, applied by the
// progression feature). Numbers: data/skillXp.config.ts.
import {
  COMMAND,
  CULTURAL_INSIGHT,
  FIELD_CHECK,
  FIELD_OP,
  FIELD_TACTICS_INTELLIGENCE,
  GUNNERY_SHOT,
  PERSUASION,
  REPAIR_JOB,
  SOCIAL_LINE,
  STAKES_FACTOR,
  STEALTH_USE,
  STRIKE_TACTICS,
  type CommandOutcome,
  type CommandSize,
  type PlayStakes,
} from '../data/skillXp.config';
import { COMBAT_XP, type CombatStakes } from '../data/progression.config';
import { challengeFactor } from './challenge';
import { combatChallenge } from './combatXp';
import { interp } from './interp';

export type XpMap = Record<string, number>;

/** The n-th social line of a day (1-based) earns this share of a first one (Jared: more lines the same day earn less). */
export const socialFalloff = (n: number): number => 1 / (1 + SOCIAL_LINE.falloff * Math.max(0, n - 1));

/** Charisma from a social line the code logged (something at stake, or a relationship changed). */
export const socialLineXp = (stakes: PlayStakes, nthToday: number): XpMap => ({ charisma: SOCIAL_LINE.base * STAKES_FACTOR[stakes] * socialFalloff(nthToday) });

/**
 * Persuasion (Jared: success 1.0, failure 0.25), by the stakes and the opponent's level: the challenge curve on
 * gap = the opponent's level - the persuader's (a harder mind teaches more, a far weaker one little).
 */
export const persuasionXp = (success: boolean, stakes: PlayStakes, gap: number): XpMap => ({
  charisma: PERSUASION.base * (success ? PERSUASION.success : PERSUASION.failure) * STAKES_FACTOR[stakes] * challengeFactor(gap),
});

/** Field Tactics XP and its Intelligence share (Jared: 0.2 of any Tactics earned in the field). */
const withIntelligence = (tactics: number): XpMap => (tactics > 0 ? { tactics, intelligence: tactics * FIELD_TACTICS_INTELLIGENCE } : {});

/**
 * Tactics from command (Jared: stakes x outcome x size of command; a loss teaches about half). The function the fleet and
 * ground battles will call (combat-scales; not wired into play yet).
 */
export const commandXp = (stakes: CombatStakes, outcome: CommandOutcome, size: CommandSize): XpMap => withIntelligence(COMMAND.base * COMBAT_XP.stakes[stakes] * COMMAND.outcome[outcome] * COMMAND.size[size]);

/** Tactics from personal combat: each strike earned by reaching +3 on the advantage track (Jared: a small share). */
export const strikeTacticsXp = (strikes: number, stakes: CombatStakes): XpMap => withIntelligence(STRIKE_TACTICS.perStrike * Math.max(0, strikes) * COMBAT_XP.stakes[stakes]);

/** Gunnery from shots taken in a battle (Jared: scaled by margin and stakes). */
export function gunneryXp(margins: readonly number[], stakes: CombatStakes): XpMap {
  const xp = margins.reduce((a, m) => a + GUNNERY_SHOT.perShot * interp(GUNNERY_SHOT.margin, m), 0) * COMBAT_XP.stakes[stakes];
  return xp > 0 ? { gunnery: xp } : {};
}

/**
 * Piloting from flying in a battle (m8-ship-battles, D-517: "Piloting from dogfights as field use"): each piloting roll is an
 * exchange of combat XP (combat-xp §1: 0.25 x the challenge of the gap x stakes x outcome), all to Piloting. gap = the
 * opponent's level less the pilot's. Won, drawn and lost read as combat's won, truce and lost.
 */
export function pilotingXp(gaps: readonly number[], stakes: CombatStakes, outcome: CommandOutcome): XpMap {
  const out = outcome === 'won' ? COMBAT_XP.outcome.won : outcome === 'lost' ? COMBAT_XP.outcome.lost : COMBAT_XP.outcome.truce;
  const xp = gaps.reduce((a, g) => a + COMBAT_XP.perExchange * combatChallenge(g), 0) * COMBAT_XP.stakes[stakes] * out;
  return xp > 0 ? { piloting: xp } : {};
}

/**
 * The player's own fighting at the front of a ground battle (m8-ground, D-522: "field XP for the player's own fighting"): each
 * phase's own fight is an exchange of combat XP on piloting's rule (0.25 x the challenge of the gap x stakes x outcome), to the
 * combat skill they fight with.
 */
export function fieldFightXp(gaps: readonly number[], stakes: CombatStakes, outcome: CommandOutcome, skill: string): XpMap {
  const xp = pilotingXp(gaps, stakes, outcome)['piloting'] ?? 0;
  return xp > 0 ? { [skill]: xp } : {};
}

/** Repair from a job in a fight or during upkeep (travel, docking): by hours, the job's challenge, success and the fight. */
export function repairXp(job: { hours: number; rating: number; level: number; success: boolean; inFight: boolean }): XpMap {
  const xp = REPAIR_JOB.perHour * Math.max(0, job.hours) * challengeFactor(job.rating - job.level) * (job.success ? 1 : REPAIR_JOB.failure) * (job.inFight ? REPAIR_JOB.inFight : 1);
  return xp > 0 ? { repair: xp } : {};
}

/** An intelligence field operation (Jared: XP from stakes and outcome, as commanding does), on the tradecraft split. */
export function fieldOpXp(stakes: CombatStakes, outcome: CommandOutcome): XpMap {
  const total = FIELD_OP.base * COMBAT_XP.stakes[stakes] * FIELD_OP.outcome[outcome];
  return Object.fromEntries(Object.entries(FIELD_OP.split).map(([k, w]) => [k, total * w]));
}

/** A mission stage's roll (m9-tune A4): field use of the skill it read, by success, stakes and the challenge of the rating. */
export const fieldCheckXp = (skill: string, success: boolean, stakes: PlayStakes, gap: number): XpMap => ({ [skill]: FIELD_CHECK.base * (success ? FIELD_CHECK.success : FIELD_CHECK.failure) * STAKES_FACTOR[stakes] * challengeFactor(gap) });

/** Stealth from field use: a stealth check or contest that matters. */
export const stealthXp = (success: boolean, stakes: PlayStakes, gap: number): XpMap => ({ stealth: STEALTH_USE.base * (success ? STEALTH_USE.success : STEALTH_USE.failure) * STAKES_FACTOR[stakes] * challengeFactor(gap) });

/**
 * The insight bonus against a culture's forces from hours spent studying its art or history (Jared: Intelligence 80+;
 * +1, at most +2), on fleet and ground rolls.
 */
export const insightBonus = (hours: number): number => (hours >= CULTURAL_INSIGHT.secondHours ? 2 : hours >= CULTURAL_INSIGHT.firstHours ? 1 : 0);

/** Whether culture study counts at this Intelligence (Jared: 80+). */
export const insightOpen = (intelligence: number): boolean => intelligence >= CULTURAL_INSIGHT.minIntelligence;
