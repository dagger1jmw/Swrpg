// The player as the world's gates and the power bar see them (D-491): side, rank, standing, trust, posts and fighting tier,
// all read from game state.
import { duelistBar, GUARDED, type DuelistBar } from '../../data/duelists';
import type { FactionId } from '../../data/entities.config';
import { RANK_BY_ID, rankDef } from '../../data/rankMinimums';
import { RANK_STEPS, type DuelTier, type WorldPlayer } from '../../data/who';
import { dateFromAbsDay } from '../../engine/calendar';
import { canBeat, canPlan, duelTier, isTrust, planOpens, planReady, postsHeld, whoHolds } from '../../engine/who';
import type { GameState } from '../../state/gameState';
import { selectCharacter } from '../character/selectors';
import { selectHasFlag } from '../flags/selectors';
import { selectLocationChain } from '../locations/selectors';
import { selectNpcs } from '../npcs/selectors';
import { selectLevelExact } from '../progression/selectors';
import { archetypeDef } from '../../data/archetypes';
import { selectHighestForm, selectMinimumLevel, selectRank, selectSide, selectStanding } from '../ranks/selectors';

const yearNow = (s: GameState): number => dateFromAbsDay(s.clock.now.day).year;

/** The strongest fighting skill: a form, melee or blaster. */
const selectCombatLevel = (s: GameState): number => Math.max(selectHighestForm(s), selectLevelExact(s, 'melee'), selectLevelExact(s, 'blaster'));

/** A Jedi, a Sith or another trained in the Force; never a career character (D-493). */
const isForceUser = (s: GameState): boolean => archetypeDef(selectCharacter(s).archetype).path !== 'career';

/** Whether the player could plan for a top duelist (D-493). */
export const selectCanPlan = (s: GameState): boolean => canPlan({ forceUser: isForceUser(s), archetype: selectCharacter(s).archetype, combat: selectCombatLevel(s) });

/** The player's tier against a top duelist (D-489). */
export function selectDuelTier(s: GameState): DuelTier {
  const combat = selectCombatLevel(s);
  const meets = Object.entries(RANK_BY_ID.get('master')!.minimums).every(([key, min]) => (key === '$main' ? combat : selectMinimumLevel(s, key)) >= min);
  return duelTier({ forceUser: isForceUser(s), masterRank: selectRank(s) === 'master' || s.ranks.councilSeat === true, meetsMasterSkills: meets, combat, forceControl: selectLevelExact(s, 'forceControl'), willpower: selectLevelExact(s, 'willpower') });
}

/** Trusted by a canon figure met in this campaign. */
function trusts(s: GameState, canonId: string): boolean {
  return selectNpcs(s).some((n) => n.canonId === canonId && n.status !== 'deceased' && isTrust(s.relationships.byNpcId[n.id]?.value ?? 0, s.clock.now.day - n.firstMetDay, n.id === s.ranks.masterId || n.id === s.ranks.apprenticeId));
}

export function selectWorldPlayer(s: GameState): WorldPlayer {
  const c = selectCharacter(s);
  const tier = selectDuelTier(s);
  const order = rankDef(selectRank(s)).path === 'jedi' || rankDef(selectRank(s)).path === 'sith' ? rankDef(selectRank(s)).order : 0;
  const hasFlag = (f: string): boolean => selectHasFlag(s, f);
  const trusted = (id: string): boolean => trusts(s, id);
  return {
    side: selectSide(s) as FactionId | null,
    archetype: c.archetype,
    // A Lord with a Master's strength stands where a Master does: the Sith ladder has no rank above Lord.
    rankStep: order >= RANK_STEPS.knight && tier !== 'below' ? RANK_STEPS.master : order,
    standing: () => selectStanding(s),
    tier,
    posts: postsHeld({ startId: c.start?.optionId ?? null, bby: -yearNow(s), hasFlag, trusts: trusted }),
    places: selectLocationChain(s, s.locations.currentId).flatMap((l) => [l.name, ...l.aliases]),
    trusts: trusted,
    hasFlag,
  };
}

/** The bar on a canon figure now. */
export const selectDuelistBar = (s: GameState, canonId: string | null): DuelistBar | null => duelistBar(canonId, yearNow(s));

/** Whether the player can beat this figure at all: the power bar, and a guarded figure within reach. */
export function selectCanBeat(s: GameState, canonId: string | null): boolean {
  const bar = selectDuelistBar(s, canonId);
  const guards = GUARDED.filter((g) => g.canonId === canonId && yearNow(s) >= g.fromYear && yearNow(s) <= g.toYear);
  if (bar === null && !guards.length) return true;
  const p = selectWorldPlayer(s);
  return canBeat(p.tier, bar) && guards.every((g) => whoHolds(g.who, p));
}

/** Whether the player's ready plan against this NPC wins the fight (lore ruling 3, 25 Nov 2026): a Master-level foe only. */
export function selectPlanWins(s: GameState, npcId: string): boolean {
  const n = s.npcs.byId[npcId];
  if (!n || planOpens(selectDuelistBar(s, n.canonId)) !== 'win' || !selectCanPlan(s)) return false;
  return planReady((s.combat.plans ?? []).map((p) => ({ ...p, here: p.locationId === s.locations.currentId })), npcId, s.clock.now.day);
}

/** selectCanBeat for a known NPC: a ready plan also opens a Master-level foe to the best non-Force fighters. */
export const selectCanBeatNpc = (s: GameState, npcId: string): boolean => selectCanBeat(s, s.npcs.byId[npcId]?.canonId ?? null) || selectPlanWins(s, npcId);
