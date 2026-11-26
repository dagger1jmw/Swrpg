// Progression selectors: every level, tier, capacity and effective level is derived here, never
// stored (architecture §2 "Derived, never stored").
import { styleNow } from '../../engine/martialStyles';
import { insightBonus } from '../../engine/playXp';
import { SKILLS, SKILL_BY_ID, type PhysicalStat } from '../../data/skills';
import { levelWithNatural, tierOf, xpForLevel } from '../../engine/curve';
import { drillCeiling } from '../../engine/appliedExperience';
import { capacities, type Capacities } from '../../engine/fatigue';
import { lastingPenalty, type LastingInjury } from '../../engine/lasting';
import { CAPACITY_ENDURANCE_KINDS } from '../../data/health.config';
import { assumedAgeing, bodyAge, type Ageing } from '../../engine/ageing';
import { bodyCapAt, forceBoost, naturalLevel, physicalPerformance } from '../../engine/species';
import { speciesDef } from '../../data/species';
import type { StateOfMind, TierName } from '../../data/progression.config';
import type { GameState } from '../../state/gameState';
import { selectExactAge, selectSpeciesId } from '../character/selectors';
import { activeState, despairMult, griefMult, type ProgressionSlice, type TierBeat } from './progression';

export const selectProgression = (s: GameState): ProgressionSlice => s.progression;
export const selectSkillXp = (s: GameState, id: string): number => s.progression.skills[id]?.xp ?? 0;
export const selectRust = (s: GameState, id: string): number => s.progression.skills[id]?.rust ?? 0;
export const selectNatural = (s: GameState, id: string): number => naturalLevel(id, selectSpeciesId(s), selectExactAge(s));

/** Total exact level: trained XP plus the natural baseline (progression-numbers §11a). */
export function selectLevelExact(s: GameState, id: string): number {
  return levelWithNatural(selectSkillXp(s, id), selectNatural(s, id));
}

/** The displayed level (floor). */
export const selectLevel = (s: GameState, id: string): number => Math.floor(selectLevelExact(s, id) + 1e-9);

export const selectTier = (s: GameState, id: string): TierName => tierOf(Math.floor(selectLevelExact(s, id) + 1e-9));

/** The highest Force body-ability level (progression-numbers §11). */
export function selectBodyAbilityLevel(s: GameState): number {
  let best = 0;
  for (const sk of SKILLS) if (sk.bodyAbility) best = Math.max(best, selectLevelExact(s, sk.id));
  return best;
}

export const selectForceBoost = (s: GameState): number => forceBoost(selectLevelExact(s, 'forceControl'), selectBodyAbilityLevel(s));
/** The body age now (D-472): the species' age map, slowed after prime by Force Control. */
export const selectBodyAgeNow = (s: GameState): number => bodyAge(speciesDef(selectSpeciesId(s)), selectExactAge(s), selectLevelExact(s, 'forceControl'));
/** The body's ageing: the tracked record, or the one a life before play leaves. */
export const selectAgeing = (s: GameState): Ageing => s.progression.ageing ?? assumedAgeing(selectBodyAgeNow(s));
export const selectBodyCap = (s: GameState, stat: PhysicalStat): number => bodyCapAt(selectSpeciesId(s), stat, selectAgeing(s).bodyAge);

/** Physical performance = min(level less the age loss, body cap) + Force boost; other skills are their level. */
export function selectPerformance(s: GameState, id: string): number {
  const level = selectLevelExact(s, id);
  if (SKILL_BY_ID.get(id)?.category !== 'physical') return level;
  const stat = id as PhysicalStat;
  const a = selectAgeing(s);
  return physicalPerformance(id, level, bodyCapAt(selectSpeciesId(s), stat, a.bodyAge), selectForceBoost(s), a.loss[stat]);
}

/** Level for rolls before wounds and fatigue: performance x (1 - rust). */
export const selectEffectiveLevel = (s: GameState, id: string): number => selectPerformance(s, id) * (1 - selectRust(s, id));

/** Meter capacities from Endurance, Willpower and Force Control, cut by the overtraining streak. */
export function selectCapacities(s: GameState): Capacities {
  return capacities(capacityEndurance(selectPerformance(s, 'endurance'), s.health.lasting as readonly LastingInjury[]), selectLevelExact(s, 'willpower'), selectLevelExact(s, 'forceControl'), s.progression.overtrainStreak);
}

/**
 * Endurance as the fatigue meters read it (Jared, D-252): a lost leg's Endurance penalty (progression-numbers §18:
 * P 0.15 x (1 - adaptation)) cuts the capacity, in and out of fights. Only the kinds in CAPACITY_ENDURANCE_KINDS.
 */
export function capacityEndurance(endurance: number, lasting: readonly LastingInjury[]): number {
  return endurance * (1 - lastingPenalty(lasting.filter((l) => CAPACITY_ENDURANCE_KINDS.includes(l.kind)), 'endurance'));
}

export const selectStateOfMind = (s: GameState): StateOfMind => activeState(s.progression.stateOfMind, s.clock.now.day);
export const selectGriefMult = (s: GameState): number => griefMult(s.progression.grief, s.clock.now.day);
export const selectDespairMult = (s: GameState): number => despairMult(s.progression.stateOfMind, s.clock.now.day);
export const selectTierBeats = (s: GameState): readonly TierBeat[] => s.progression.tierBeatsPending;
export const selectOvertrainStreak = (s: GameState): number => s.progression.overtrainStreak;
export const selectWillpowerToday = (s: GameState): number => s.progression.willpowerToday;

export interface SkillView {
  id: string;
  name: string;
  category: string;
  kind: string;
  /** Trained XP only. */
  xp: number;
  /** Total XP on the curve (natural baseline included): level = floor((xpTotal / K)^(1/1.75)). */
  xpTotal: number;
  /** Total XP where the current displayed level starts. */
  levelXp: number;
  /** Total XP the next level needs. */
  nextXp: number;
  level: number;
  levelExact: number;
  natural: number;
  performance: number;
  rust: number;
  tier: TierName;
}

/** Every skill the character has (trained XP or a natural baseline), for the sheet and the prompt. */
export function selectSkillViews(s: GameState): SkillView[] {
  const out: SkillView[] = [];
  for (const sk of SKILLS) {
    const xp = selectSkillXp(s, sk.id);
    const natural = selectNatural(s, sk.id);
    if (xp <= 0 && natural <= 0) continue;
    const exact = levelWithNatural(xp, natural);
    const level = Math.floor(exact + 1e-9);
    const xpTotal = xpForLevel(natural) + xp;
    out.push({ id: sk.id, name: sk.name, category: sk.category, kind: sk.kind, xp, xpTotal, levelXp: xpForLevel(level), nextXp: xpForLevel(level + 1), level, levelExact: exact, natural, performance: selectPerformance(s, sk.id), rust: selectRust(s, sk.id), tier: tierOf(level) });
  }
  return out;
}

// Training resolution is a pure read of the state plus a request (it returns events; it changes
// nothing), so it is part of the feature's public selector surface for the turn layer.
// The Force XP trial (harness only; off in the game): the day planner's strain trim and report.
export { forceHours, recordPlan, strainTrim } from './forceXpTrialHook';
export { resolveTraining, type SpeedParts, type TrainingCard, type TrainingPlan, type TrainingRequest, type TrainingSource } from './training';

// ---- Applied experience, combat integration, the drill ceiling (progression-numbers §7-8; M5) ----
const groupOf = (id: string): string => SKILL_BY_ID.get(id)?.formGroup ?? id;
/** E of a lightsaber form's group. */
export const selectE = (s: GameState, formId: string): number => s.progression.E[groupOf(formId)]?.E ?? 0;
/** CI of a combat Force ability. */
export const selectCI = (s: GameState, abilityId: string): number => s.progression.CI[abilityId]?.CI ?? 0;
/** Drill ceiling = 25 + E. */
export const selectDrillCeiling = (s: GameState, formId: string): number => drillCeiling(selectE(s, formId));
export const selectBank = (s: GameState, formId: string): number => s.progression.bank[formId] ?? 0;

/** Melee styles held now (m8-skills, D-513): proficiency after fading, by style id. */
export function selectStyles(s: GameState): Record<string, number> {
  const day = s.clock.now.day;
  return Object.fromEntries(Object.entries(s.progression.styles ?? {}).map(([id, st]) => [id, styleNow(st, day)]));
}

/** The insight bonus against a culture's forces (m8-skills, D-513: Intelligence 80+ study; +1, at most +2). */
export const selectInsight = (s: GameState, culture: string): number => insightBonus(s.progression.insight?.[culture] ?? 0);
