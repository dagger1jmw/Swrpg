// Progression selectors: every level, tier, capacity and effective level is derived here, never
// stored (architecture §2 "Derived, never stored").
import { SKILLS, SKILL_BY_ID, type PhysicalStat } from '../../data/skills';
import { levelWithNatural, tierOf, xpForLevel } from '../../engine/curve';
import { capacities, type Capacities } from '../../engine/fatigue';
import { bodyCap, forceBoost, naturalLevel } from '../../engine/species';
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
export const selectBodyCap = (s: GameState, stat: PhysicalStat): number => bodyCap(selectSpeciesId(s), stat, selectExactAge(s));

/** Physical performance = min(level, body cap) + Force boost; other skills are their level. */
export function selectPerformance(s: GameState, id: string): number {
  const level = selectLevelExact(s, id);
  if (SKILL_BY_ID.get(id)?.category !== 'physical') return level;
  return Math.min(level, selectBodyCap(s, id as PhysicalStat)) + selectForceBoost(s);
}

/** Level for rolls before wounds and fatigue: performance x (1 - rust). */
export const selectEffectiveLevel = (s: GameState, id: string): number => selectPerformance(s, id) * (1 - selectRust(s, id));

/** Meter capacities from Endurance, Willpower and Force Control, cut by the overtraining streak. */
export function selectCapacities(s: GameState): Capacities {
  return capacities(selectPerformance(s, 'endurance'), selectLevelExact(s, 'willpower'), selectLevelExact(s, 'forceControl'), s.progression.overtrainStreak);
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
export { resolveTraining, stubTeacherLevel, type TrainingCard, type TrainingPlan, type TrainingRequest } from './training';
