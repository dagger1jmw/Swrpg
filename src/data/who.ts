// Who the player must be (D-489's three tests, built in D-491): the gate on a world condition, prerequisite, scene or
// guarded figure. Everything is read from game state; the narrator sets none of it.
import type { FactionId } from './entities.config';
import type { WorldPostId } from './worldPosts';

/** Standing on the ladder: 1 Padawan or apprentice, 2 Knight or Sith Lord, 3 Master (or a Lord with a Master's strength). */
export const RANK_STEPS = { padawan: 1, knight: 2, master: 3 } as const;
export type RankStep = keyof typeof RANK_STEPS;

/** The player's fighting tier against a top duelist (D-489). */
export const DUEL_TIERS = ['below', 'master', 'top'] as const;
export type DuelTier = (typeof DUEL_TIERS)[number];

/** Every part given must hold. A gate is a list of these: any one that holds opens it. */
export interface Who {
  sides?: readonly FactionId[];
  archetypes?: readonly string[];
  minRank?: RankStep;
  /** Standing in the Order or the Sith (0-100, ranks.md §1). */
  minStanding?: number;
  /** Trusted by any of these figures (known long enough and warm enough, or their master or apprentice). */
  trustOf?: readonly string[];
  /** Holds any of these posts: a posting, a crew, a household. */
  posts?: readonly WorldPostId[];
  /** In any of these places now. */
  at?: readonly string[];
  minTier?: DuelTier;
  /** Any of these engine-only flags (physical proof carried out of a scene). */
  flags?: readonly string[];
}

/** The player as the gates see them. */
export interface WorldPlayer {
  side: FactionId | null;
  archetype: string;
  rankStep: number;
  standing(): number;
  tier: DuelTier;
  posts: readonly string[];
  places: readonly string[];
  trusts(canonId: string): boolean;
  hasFlag(flag: string): boolean;
}

/** Trust (invented): the Knight Trials' "friend" line with a master (MASTER_APPROVAL), and time, so no one scene makes it. */
export const WORLD_TRUST = { relationship: 40, knownDays: 30 } as const;
