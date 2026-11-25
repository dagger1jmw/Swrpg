// Combat slice (architecture §2 "combat"; rolls.md §3-6; D-143..D-157). Null outside a fight except for a deferred
// combatStarted waiting for the next turn's step b, the fates the player still has to choose, and a summary of the
// last fight for narration and the UI. fightsToday and the day's combat XP stay in progression (D-47).
import { z } from 'zod';
import { NPC_FATES, SPARRING_MODES } from '../../data/combat.config';
import { PLAN_KINDS } from '../../data/duelists';
import { HAZARD_TYPES, WEAPON_KINDS } from '../../data/health.config';
import { MINION_KIND_IDS } from '../../data/npcGen.config';
import { COMBAT_OUTCOMES, COMBAT_STAKES } from '../../data/progression.config';
import { TERRAIN_IDS } from '../../data/terrain';

export const pendingFightSchema = z.object({
  opponentRefs: z.array(z.string()),
  minionGroups: z.array(z.object({ kind: z.enum(MINION_KIND_IDS as [string, ...string[]]), count: z.number().int().min(1).max(12), weapon: z.enum(WEAPON_KINDS).optional(), wantAlive: z.boolean().optional() })),
  stakes: z.enum(COMBAT_STAKES),
  terrainTags: z.array(z.enum(TERRAIN_IDS as [string, ...string[]])),
  ambushClaim: z.boolean(),
  engagedElsewhere: z.array(z.string()),
  /** A spar's stakes chosen for this session as a story event (D-172), else the default by rank and place. */
  sparringMode: z.enum(SPARRING_MODES).nullable().default(null),
  /** Opponents who want the player alive (D-260): they subdue when their loadout can (D-262). Absent on older saves. */
  wantAlive: z.array(z.string()).default([]),
});
export type PendingFight = z.infer<typeof pendingFightSchema>;

/** A sparring session (D-168): the bouts so far, where the current bout began, how it ended, and play-out mode. */
export const sparSessionSchema = z.object({
  bouts: z.array(z.object({ winner: z.enum(['A', 'B']).nullable(), reason: z.string(), exchanges: z.number().int().min(0) })),
  boutStart: z.number().int().min(0),
  ended: z.enum(['exchanges', 'spent', 'injury', 'stopped']).nullable(),
  playing: z.boolean(),
});

/** Who each fighter is outside the duel: a named NPC or a minion of a group. */
export const fighterMetaSchema = z.object({ npcId: z.string().nullable(), minionKind: z.string().nullable(), rank: z.string().nullable() });

export const activeFightSchema = z.object({
  id: z.string(),
  startedAbs: z.number(),
  stakes: z.enum(COMBAT_STAKES),
  sparring: z.enum(SPARRING_MODES).nullable(),
  terrainTags: z.array(z.string()),
  /** The duel context and state (src/engine/duel.ts): engine-made, JSON-serializable, never written by the AI. */
  ctx: z.object({
    sparring: z.enum(SPARRING_MODES).nullable(),
    situations: z.array(z.string()),
    footing: z.number(),
    dyingRiskStakes: z.boolean(),
    /** Bout-start terrain accidents (D-144, D-184); older saves have none. */
    hazards: z.array(z.object({ chance: z.number().min(0).max(1), severity: z.union([z.literal(1), z.literal(2), z.literal(3)]), type: z.enum(HAZARD_TYPES), label: z.string(), note: z.string().optional(), minorOnly: z.boolean().optional() })).default([]),
    positionAttempt: z.number().default(0),
    /** A real fight rolls the terrain every this many exchanges (D-185); null for a sparring bout and older saves. */
    hazardEvery: z.number().int().min(1).nullable().default(null),
    /** Cover for ranged fighters and a Force-null bubble (D-192). Kept in the schema (D-216): a reload stripped them. */
    cover: z.boolean().default(false),
    forceNegated: z.boolean().default(false),
  }),
  duel: z.any(),
  /** Sequence state: pattern uses and the remaining throwable objects (D-146). */
  patternUses: z.record(z.string(), z.number().int().min(0)),
  objects: z.record(z.string(), z.number().int().min(0)),
  objectSizes: z.record(z.string(), z.enum(['small', 'medium', 'large'])),
  meta: z.record(z.string(), fighterMetaSchema),
  /** The player's fighting skill at each exchange (combat XP by skill used, combat-xp §1). */
  exchangeSkills: z.array(z.string()),
  /** The exchange count at the last narrated beat (D-145: one narration covers everything since). */
  lastNarrated: z.number().int().min(0),
  /** The exchange count when the current turn's segment began. */
  segmentStart: z.number().int().min(0),
  beat: z.string().nullable(),
  /** Started by a won perception contest or surprise: +1 to the sequence cap (D-146). */
  hidden: z.boolean(),
  /** A spar's session of bouts (D-168); null for a real fight. */
  session: sparSessionSchema.nullable().default(null),
  /** Top duelists the player's plan held for when the fight began (D-493). */
  planned: z.array(z.string()).optional(),
  /** A truce the narrator offered (D-181): the player accepts it with a beat button; any other action declines it. */
  truceOffer: z.string().nullable().default(null),
});
export type ActiveFight = z.infer<typeof activeFightSchema>;

export const fightSummarySchema = z.object({
  id: z.string(),
  stakes: z.enum(COMBAT_STAKES),
  outcome: z.enum(COMBAT_OUTCOMES),
  reason: z.string(),
  exchanges: z.number().int().min(0),
  seconds: z.number().min(0),
  /** What the opponent did when the player was incapacitated (D-154). */
  playerFate: z.enum(['spared', 'captured', 'left', 'killingStrike']).nullable(),
  recorded: z.boolean(),
  /** The form fought with (recording review). */
  skillId: z.string(),
  day: z.number().int(),
  /** Where it was fought (D-466: a won fight can count against a world condition at its place). Absent in older saves. */
  locationId: z.string().nullable().optional(),
  /** Top duelists held off (D-491): a short delay (a Master) or a long one (the top tier), never a win. */
  heldOff: z.array(z.object({ npcId: z.string(), length: z.enum(['brief', 'long']) })).optional(),
  /** The final duel state (the last turn's roll cards and narration). Engine-made. */
  duel: z.any().optional(),
  /** A sparring session's bouts and how it ended (D-168). */
  session: sparSessionSchema.nullable().optional(),
  /** After an auto-resolved session: the partners for "Play the next bout" when one can go on (D-177). */
  rematch: z.object({ opponentRefs: z.array(z.string()), sparringMode: z.enum(SPARRING_MODES).nullable() }).nullable().optional(),
  /**
   * Who took the player captive (D-242): the winning side's group, its minion kind (null for a named captor), how many
   * still stand and their names, and when and where (the following scenes read it).
   */
  captors: z.object({ group: z.string(), kind: z.string().nullable(), standing: z.number().int(), names: z.array(z.string()), atAbs: z.number(), locationId: z.string().nullable(), weapon: z.string().optional() }).nullable().optional(),
});
export type FightSummary = z.infer<typeof fightSummarySchema>;

/** One line of a plan against a top duelist, laid by a rolled check (D-493); only the engine writes it. */
export const planLineSchema = z.object({ npcId: z.string(), kind: z.enum(PLAN_KINDS), locationId: z.string().nullable(), day: z.number().int(), success: z.boolean() });

export const combatSliceSchema = z.object({
  /** Absent in older saves. */
  plans: z.array(planLineSchema).optional(),
  pending: pendingFightSchema.nullable(),
  active: activeFightSchema.nullable(),
  /** Incapacitated named NPCs whose fate the player chooses (spare, capture, kill). */
  /**
   * Fates the player still has to choose. atAbs (absolute second) and locationId date and place the choice so it expires
   * (issue 18: FATE_CHOICE_EXPIRY); dying: the opponent is dying, so Spare means leaving them. Absent on older saves.
   */
  fates: z.array(z.object({ npcId: z.string(), fightId: z.string(), options: z.array(z.enum(NPC_FATES)), atAbs: z.number().optional(), locationId: z.string().nullable().optional(), dying: z.boolean().optional() })),
  last: fightSummarySchema.nullable(),
  seq: z.number().int().min(1),
});
export type CombatSlice = z.infer<typeof combatSliceSchema>;

export const emptyCombat = (): CombatSlice => ({ pending: null, active: null, fates: [], last: null, seq: 1 });
