// The gate on who the player is (D-491): pure reads of the player as game state has them.
import { PLAN, TOP_TIER, type DuelistBar } from '../data/duelists';
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
 * seat, or every skill of the Master row (combat in place of the main specialty), whatever the title. Top: a Master at
 * Yoda's or Mace's level in combat, in the Force and in will.
 */
export function duelTier(x: { forceUser: boolean; masterRank: boolean; meetsMasterSkills: boolean; combat: number; forceControl: number; willpower: number }): DuelTier {
  // Fights with top duelists are a matter for Force users (D-493).
  if (!x.forceUser) return 'below';
  if (!x.masterRank && !x.meetsMasterSkills) return 'below';
  return x.combat >= TOP_TIER.combat && x.forceControl >= TOP_TIER.forceControl && x.willpower >= TOP_TIER.willpower ? 'top' : 'master';
}

/** Whether a non-Force fighter is one of the few who can plan for a top duelist (D-493). */
export const canPlan = (x: { forceUser: boolean; archetype: string; combat: number }): boolean => !x.forceUser && PLAN.archetypes.includes(x.archetype) && x.combat >= PLAN.combat;

/** Whether the lines recorded make a plan: enough different kinds laid against the foe, here, in time. */
export const planReady = (lines: readonly { npcId: string; kind: string; day: number; here: boolean; success: boolean }[], npcId: string, day: number): boolean =>
  new Set(lines.filter((l) => l.success && l.npcId === npcId && l.here && day - l.day <= PLAN.days).map((l) => l.kind)).size >= PLAN.lines;

/** Whether a fighter of this tier can beat a figure with this bar. */
export const canBeat = (tier: DuelTier, bar: DuelistBar | null): boolean => bar === null || (bar === 'master' ? tier !== 'below' : bar === 'top' ? tier === 'top' : false);

/** What standing up to a top duelist buys: nothing below Master, a short delay for a Master, a long one for the top tier. */
export const holdAgainst = (tier: DuelTier, bar: DuelistBar | null): 'brief' | 'long' | null => (bar !== 'top' || tier === 'below' ? null : tier === 'top' ? 'long' : 'brief');
