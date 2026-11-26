// The gate on who the player is (D-491): pure reads of the player as game state has them.
import { PLAN, TIER_LEVELS, type DuelistBar } from '../data/duelists';
import { DUEL_TIERS, RANK_STEPS, WORLD_TRUST, type DuelTier, type Who, type WorldPlayer } from '../data/who';
import { placeAmong } from '../data/worldControl';
import { worldPost, WORLD_POST_IDS, type WorldPostId } from '../data/worldPosts';

const any = <T>(wanted: readonly T[] | undefined, f: (x: T) => boolean): boolean => wanted === undefined || wanted.some(f);

function holds(w: Who, p: WorldPlayer): boolean {
  return (
    any(w.sides, (x) => x === p.side) &&
    any(w.archetypes, (x) => x === p.archetype) &&
    (w.minRank === undefined || p.rankStep >= RANK_STEPS[w.minRank]) &&
    (w.minTier === undefined || DUEL_TIERS.indexOf(p.tier) >= DUEL_TIERS.indexOf(w.minTier)) &&
    any(w.posts, (x) => p.posts.includes(x)) &&
    any(w.at, (x) => placeAmong(x, [], p.places)) &&
    any(w.trustOf, (x) => p.trusts(x)) &&
    any(w.flags, (x) => p.hasFlag(x)) &&
    (w.minStanding === undefined || p.standing() >= w.minStanding)
  );
}

/** Whether the player fits a gate: no gate, or any one of its entries in full. */
export const whoHolds = (who: readonly Who[] | undefined, p: WorldPlayer): boolean => who === undefined || who.some((w) => holds(w, p));

/** Trusted: warm enough, for long enough, or bound as master and apprentice. */
export const isTrust = (value: number, knownDays: number, bound: boolean): boolean => bound || (value >= WORLD_TRUST.relationship && knownDays >= WORLD_TRUST.knownDays);

/** The posts held: by flag, by the start option while its job lasts, or by a tie to the figure whose people these are. */
export function postsHeld(x: { startId: string | null; bby: number; hasFlag(flag: string): boolean; trusts(canonId: string): boolean }): WorldPostId[] {
  return WORLD_POST_IDS.filter((id) => {
    const d = worldPost(id);
    if (x.hasFlag(`worldPost:${id}`)) return true;
    if (x.startId !== null && d.starts?.includes(x.startId) && (d.startsUntilBby === undefined || x.bby >= d.startsUntilBby)) return true;
    return (d.tiedTo ?? []).some((c) => x.trusts(c));
  });
}

/**
 * The player's tier against a top duelist (D-489; the mapping and its numbers are proposed). Master: the rank, a Council
 * seat, or every skill of the Master row (combat in place of the main specialty), whatever the title. Top and apex: a
 * Master at the tier's levels in combat, Force Control and Willpower (TIER_LEVELS, D-494).
 */
export function duelTier(x: { forceUser: boolean; masterRank: boolean; meetsMasterSkills: boolean; combat: number; forceControl: number; willpower: number }): DuelTier {
  // Fights with top duelists are a matter for Force users (D-493).
  if (!x.forceUser) return 'below';
  if (!x.masterRank && !x.meetsMasterSkills) return 'below';
  const at = (t: keyof typeof TIER_LEVELS): boolean => x.combat >= TIER_LEVELS[t].combat && x.forceControl >= TIER_LEVELS[t].forceControl && x.willpower >= TIER_LEVELS[t].willpower;
  return at('apex') ? 'apex' : at('top') ? 'top' : 'master';
}

/** Whether a non-Force fighter is one of the few who can plan for a top duelist (D-493). */
export const canPlan = (x: { forceUser: boolean; archetype: string; combat: number }): boolean => !x.forceUser && PLAN.archetypes.includes(x.archetype) && x.combat >= PLAN.combat;

/** Whether the lines recorded make a plan: enough different kinds laid against the foe, here, in time. */
export const planReady = (lines: readonly { npcId: string; kind: string; day: number; here: boolean; success: boolean }[], npcId: string, day: number): boolean =>
  new Set(lines.filter((l) => l.success && l.npcId === npcId && l.here && day - l.day <= PLAN.days).map((l) => l.kind)).size >= PLAN.lines;

/**
 * What a ready plan does against a figure with this bar (lore ruling 3, 25 Nov 2026; amends D-493): against a Master-level
 * foe (Grievous, Baras) the best bounty hunters and Mandalorians can win; against a top duelist they only buy time; an
 * apex duelist or one beyond any duelist no plan touches.
 */
export const planOpens = (bar: DuelistBar | null): 'win' | 'time' | null => (bar === 'master' ? 'win' : bar === 'top' ? 'time' : null);

/** Whether a fighter of this tier can beat a figure with this bar. */
export const canBeat = (tier: DuelTier, bar: DuelistBar | null): boolean => bar === null || (bar !== 'beyond' && DUEL_TIERS.indexOf(tier) >= DUEL_TIERS.indexOf(bar));

/**
 * What standing up to a top or an apex duelist buys: a short delay one tier below (a Master against a top duelist, the top
 * tier against an apex), a long one at their own tier, nothing further down.
 */
export function holdAgainst(tier: DuelTier, bar: DuelistBar | null): 'brief' | 'long' | null {
  if (bar !== 'top' && bar !== 'apex') return null;
  const short = DUEL_TIERS.indexOf(bar) - DUEL_TIERS.indexOf(tier);
  return short <= 0 ? 'long' : short === 1 ? 'brief' : null;
}
