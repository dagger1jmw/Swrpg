// Duel rules (rolls.md §3-6; M5). Every number here is tunable; the spec values are marked, design
// defaults are logged in docs-v2/decisions.md (D-143 onward). 1 modifier point = 10 levels.
import type { CombatStakes } from './progression.config';

// ---- Advantage track and exchanges (rolls §3) ----
export const ADVANTAGE_MAX = 5;
/** A side at this advantage or more is the striker; the exchange is a strike exchange. */
export const STRIKE_AT = 3;

/** Build-up exchange: net margin -> track movement for the winner. |m| <= 1 moves 1 toward 0. */
export const BUILD_UP = { tieWithin: 1, steps: [[10, 3], [6, 2], [2, 1]] as readonly (readonly [number, number])[] } as const;

export const HIT_QUALITIES = ['graze', 'solid', 'clean', 'critical'] as const;
export type HitQuality = (typeof HIT_QUALITIES)[number];
/** Strike margin -> hit quality (rolls §3): below 4 the defender recovers. */
export const STRIKE_QUALITY: readonly (readonly [number, HitQuality])[] = [
  [16, 'critical'],
  [12, 'clean'],
  [8, 'solid'],
  [4, 'graze'],
];
export const STRIKE_MIN_MARGIN = 4;
/** An aimed strike (Jared, D-171): the strike roll takes this, and the chosen body part replaces the location roll. */
export const AIMED_STRIKE = { attackPenalty: -2 } as const;
/**
 * Cut-down (Jared, D-158): against a minion, a build-up exchange won by this margin (or more) is already a hit (quality
 * by the margin), unless the minion wears saber-resistant armor. Cleave (keeping the advantage after taking a minion
 * out) is recorded for later as a candidate Shii-Cho / Sokan form trait, not built.
 */
export const CUT_DOWN_MARGIN = 6;
/**
 * A strike that misses or is blocked (precognitive defense, a recovery) keeps the pressure: the track moves this
 * many steps toward 0 instead of resetting (D-156, Jared; rolls §3 amended). A landed hit or maneuver still resets.
 * 2 since D-206 (was 1): retuned with PRECOG to bring duel length back after the severed-leg rule (D-198).
 */
export const MISSED_STRIKE_STEP = 2;

export const MANEUVERS = ['position', 'knockdown', 'disarm'] as const;
export type Maneuver = (typeof MANEUVERS)[number];
/** Minimum strike margin for a maneuver taken instead of a hit (rolls §3). */
export const MANEUVER_MIN: Record<Maneuver, number> = { position: 2, knockdown: 4, disarm: 8 };
/** What a landed maneuver gives (design defaults, D-143). Knockdown: the next exchange starts at this advantage. */
export const MANEUVER_EFFECT = { positionBonus: 1, knockdownAdvantage: 2, disarmedAttack: -4 } as const;

/** Seconds per exchange, rolled uniformly (rolls §3: 5-10). */
export const EXCHANGE_SECONDS = { min: 5, max: 10 } as const;
/** Physical load per exchange before the form's stamina multiplier (rolls §3, tunable). */
export const EXERTION_PER_EXCHANGE = 0.08;

// ---- Precognitive defense, Force insight, shatterpoint (rolls §3, §6) ----
/**
 * Precognitive defense (rolls §3 as amended by D-156 and D-206, Jared): chance min(0.4, Force Sense / 250), +0.10
 * centered. Was min(0.5, FS / 200) at first, min(0.25, FS / 400) under D-156; retuned in D-206 with MISSED_STRIKE_STEP
 * after the severed-leg rule (D-198) shortened duels.
 */
export const PRECOG = { load: 0.4, maxChance: 0.4, perForceSense: 1 / 250, centeredBonus: 0.1, maxForceMeter: 1.0 } as const;
export const FORCE_INSIGHT = { minForceSense: 60, gapAtLeast: 15, perForceSense: 1 / 200, lightBonus: 0.1, advantage: 2 } as const;
export const SHATTERPOINT_COMBAT = { dc: 15, advantage: 3, forceLoad: 0.3 } as const;

// ---- Circumstances (rolls §5; d20 points) ----
export const CIRCUMSTANCE = {
  surpriseAdvantage: 3,
  openingAdvantage: 2,
  position: 1,
  decisivePosition: 2,
  unstableFooting: -1,
  confinedFormPenalty: -1,
  perExtraAttacker: 1,
  maxNumbers: 3,
} as const;

/** State of mind in combat (rolls §5): attack / defense points, precog bonus. */
export const STATE_OF_MIND_COMBAT: Readonly<Record<string, { attack: number; defense: number; precog?: number }>> = {
  centered: { attack: 0, defense: 0, precog: 0.1 },
  anger: { attack: 1, defense: -2 },
  hatred: { attack: 1, defense: -2 },
  fear: { attack: -1, defense: -1 },
  despair: { attack: -1, defense: -1 },
  grief: { attack: -1, defense: -1 },
  /** Pride or overconfidence, only against an opponent believed weaker. */
  pride: { attack: 0, defense: -1 },
};

// ---- Beats (rolls §3 as amended by D-143: quiet and narrated beats) ----
export const STANCES = ['aggressive', 'balanced', 'defensive'] as const;
export type Stance = (typeof STANCES)[number];
/** Design defaults (D-143). */
export const STANCE_MODS: Record<Stance, { attack: number; defense: number }> = {
  aggressive: { attack: 1, defense: -1 },
  balanced: { attack: 0, defense: 0 },
  defensive: { attack: -1, defense: 1 },
};
export const TACTICS = ['feint', 'taunt', 'takePosition', 'disengage', 'surrender', 'useEnvironment'] as const;
export type Tactic = (typeof TACTICS)[number];
/** Form change at a beat costs this many advantage steps toward the opponent (Q32). */
export const FORM_CHANGE_COST = 1;
/** A beat at least every N exchanges (rolls §3). */
export const BEAT_EVERY = 5;
/** Track swing that makes a beat (rolls §3: advantage reaches +/-2). */
export const BEAT_TRACK = 2;

/**
 * Beat classes (Jared, D-143). Quiet beats make no AI call (code template lines and roll cards); narrated
 * beats call the narrator once for every exchange since the last narrated beat.
 */
/** strikeAbsorbed: a hit that only takes Vitality (no wound) is quiet too. */
/** noEffect: nothing could be attempted (a mind trick on a droid, D-194): no exchange, no time, a quiet line. */
/** minionHit: a hit on a minion that leaves it fighting (D-194); quiet like minionDown. */
/** minionDown: a hit on a minion that takes it out (cut-down or strike) is quiet; wounds to the player or a named opponent are narrated. */
/** clarify: the player's input named no move the game could read; no exchange, the beat buttons ask (D-179). */
export const QUIET_BEATS = ['trackSwing', 'periodic', 'strikeMissed', 'strikeAbsorbed', 'minionDown', 'minionHit', 'clarify', 'noEffect'] as const;
/** boutEnded: a sparring bout the player played out ended and the session goes on (D-168). */
export const NARRATED_BEATS = ['woundingHit', 'maneuverLanded', 'spent', 'forceAction', 'sequence', 'incapacitated', 'fightEnded', 'playerNarrate', 'boutEnded'] as const;
export type BeatReason = (typeof QUIET_BEATS)[number] | (typeof NARRATED_BEATS)[number];
export const isNarratedBeat = (r: BeatReason): boolean => (NARRATED_BEATS as readonly string[]).includes(r);
/** Budget target: a 150-exchange duel with default play stays at or under this many calls. */
export const DUEL_CALL_BUDGET = { exchanges: 150, maxCalls: 12 } as const;

// ---- Contests used by tactics (rolls §5) ----
/** Disengage: d20 + Agility/10 (+ position) vs d20 + the opponent's form/10; success ends the fight as fled (D-143). */
export const DISENGAGE = { advantagePenaltyPerStep: 1 } as const;

// ---- Ranged (rolls §4) ----
/** A defender margin this high redirects a bolt (Soresu / Shien per the lore). */
export const DEFLECT_REDIRECT_MARGIN = 8;

// ---- Sparring modes (Jared, D-143; D-144; D-172) ----
// Routine sparring uses the rank default below (Sith master and apprentice: controlled live blades). Sith-academy stakes
// (live blades, real wounds) apply to spars at an academy (SITH_ACADEMIES) and to trials; a master can call them for
// one session as a story event (combatStarted sparringMode; Sith path only).
/** A real fight rolls its terrain accidents once per this many exchanges (D-185); a sparring bout rolls once. */
export const TERRAIN_HAZARD_EVERY = 10;
export const SPARRING_MODES = ['trainingSaber', 'controlled', 'academy'] as const;
export type SparringMode = (typeof SPARRING_MODES)[number];
/** Controlled live blades: a would-be strike lands for real as a graze when the margin is this high AND a natural 1 was rolled. */
export const CONTROLLED_ACCIDENT = { minMargin: 16, quality: 'graze' as HitQuality } as const;
/** Default mode by rank (anyone may choose a training saber). */
export const SPARRING_DEFAULT_BY_RANK: Readonly<Record<string, SparringMode>> = {
  initiate: 'trainingSaber',
  acolyte: 'trainingSaber',
  padawan: 'controlled',
  knight: 'controlled',
  master: 'controlled',
  apprentice: 'controlled',
  lord: 'controlled',
  none: 'trainingSaber',
  career: 'trainingSaber',
};
/**
 * A sparring session (Jared, D-168; combat-xp §6's 34-exchange spar): bouts until this many exchanges in total, each bout
 * ending by its mode's rule (a point, or Spent). Between bouts each side gets back this share of its maximum Vitality
 * (design default); a side still Spent after that, or a real injury (an accident, an academy wound), ends the session.
 */
export const SPAR_SESSION = { exchanges: 34, recoverBetweenBouts: 0.5 } as const;

/**
 * Sith academies with live-blade sparring (Jared, D-143; checked against Docs/SWRPG lore). Years are BBY
 * as negative numbers would be confusing here, so `fromBby` > `toBby`. A Sith spar at one of these places
 * in these years uses the academy mode; academy trials are lethal stakes.
 */
export interface SithAcademy {
  id: string;
  location: string;
  fromBby: number;
  toBby: number;
  source: string;
  designDefault?: string;
}
export const SITH_ACADEMIES: readonly SithAcademy[] = [
  {
    id: 'korriban-jcw',
    location: 'korriban',
    fromBby: 3959,
    toBby: 3956,
    source: 'Timeline :239 (Revan and Malak "revitalize Sith Academy")',
    designDefault: 'end year 3,956 BBY confirmed by Jared',
  },
  {
    id: 'trayus',
    location: 'malachor-v',
    fromBby: 3954,
    toBby: 3951,
    source: 'Timeline :266, :276 (Trayus Academy, Sith Triumvirate base)',
    designDefault: 'academy attested, training methods not; Sith academy rules by Jared',
  },
  {
    id: 'korriban-ggw',
    location: 'korriban',
    fromBby: 3681,
    toBby: 3636,
    source: 'Timeline :322 (Sith retake Korriban), :506 (Eternal Empire raids)',
    designDefault: 'academy era by Jared; end year 3,636 BBY confirmed',
  },
  {
    id: 'korriban-brotherhood',
    location: 'korriban',
    fromBby: 1010,
    toBby: 1000,
    source: 'Timeline :572; Characters_10 :62, :293 (Qordis heads the Korriban academy)',
    designDefault: 'end at Ruusan ~1,000 BBY confirmed by Jared',
  },
];

/** Sparring environment accidents (Jared, D-143): hazard chance per bout by terrain, plus a flat-floor floor. */
export const SPARRING_ACCIDENT = { flatFloorChance: 1 / 200, flatFloorSeverity: 1 } as const;

// ---- The narrator stopping a fight (D-181; D-196) ----
/**
 * The only outside events that may interrupt a fight from the narration (Jared, D-196). Each needs its cause in the same
 * reply (INTERRUPT_CAUSES): an interruption the engine cannot see is refused and the fight goes on.
 */
export const INTERRUPT_CATEGORIES = ['reinforcements', 'environmentCollapse', 'alarmOrAuthorities', 'thirdParty'] as const;
export type InterruptCategory = (typeof INTERRUPT_CATEGORIES)[number];
/**
 * The events that can cause each interruption (Jared, D-196 amended). npcEntered: an npcIntroduced, or a sceneUpdated
 * that adds someone present who is not a fighter and was not present before the reply. The cause must be applied in the
 * same reply as the combatEnded.
 */
export type InterruptCause = 'npcEntered' | 'hazardOccurred' | 'alarmRaised';
export const INTERRUPT_CAUSES: Readonly<Record<InterruptCategory, readonly InterruptCause[]>> = {
  reinforcements: ['npcEntered'],
  thirdParty: ['npcEntered'],
  environmentCollapse: ['hazardOccurred'],
  alarmOrAuthorities: ['alarmRaised', 'npcEntered'],
};
/** A why that only restates the fight is not an outside event ("the combat is still ongoing"); lower case, tested on the whole text. */
export const INTERRUPT_RESTATES: readonly RegExp[] = [
  /\b(combat|fight|fighting|battle|duel|bout|melee|skirmish|exchange)\b.{0,40}\b(still|ongoing|on-going|continues|continuing|goes on|going on|in progress|not over|rages|raging|underway|under way|unresolved|remains)\b/,
  /\b(still|continue|continues|continuing|keep|keeps)\b.{0,30}\b(fighting|fight|combat|battle|duel|ongoing)\b/,
  /^(n\/?a|none|no reason|unknown|ongoing|in progress|interrupted|the fight|combat)\.?$/,
];

// ---- Opponent fate when the player is incapacitated (D-143 design defaults) ----
export type FateKind = 'spared' | 'captured' | 'left' | 'killingStrike';
/** By stakes; lethal and serious roll by the opponent's archetype group. */
export const FATE_BY_STAKES: Record<CombatStakes, FateKind | 'roll'> = { spar: 'spared', skirmish: 'spared', serious: 'roll', lethal: 'roll' };
/** Chances per archetype group. lethal: [killingStrike, captured, left]; serious: [captured, left] (never a killing strike). */
export const FATE_ROLL: Readonly<Record<'sith' | 'jedi' | 'military' | 'underworld' | 'other', { lethal: readonly [number, number, number]; serious: readonly [number, number] }>> = {
  sith: { lethal: [0.7, 0.25, 0.05], serious: [0.6, 0.4] },
  jedi: { lethal: [0, 0.9, 0.1], serious: [0.8, 0.2] },
  military: { lethal: [0.4, 0.55, 0.05], serious: [0.7, 0.3] },
  underworld: { lethal: [0.5, 0.3, 0.2], serious: [0.4, 0.6] },
  other: { lethal: [0.3, 0.4, 0.3], serious: [0.3, 0.7] },
};
/** NPC fate chosen by the player at the NPC's incapacitation. */
export const NPC_FATES = ['spare', 'capture', 'kill'] as const;
/**
 * A fate choice lasts until the next fight, a change of place, or this much game time (design default, combat pass 1
 * issue 18: a choice was still offered two weeks and three fights later).
 */
export const FATE_CHOICE_EXPIRY = { seconds: 3600 } as const;
export type NpcFate = (typeof NPC_FATES)[number];

// ---- heroicAct (flag-registry §2) ----
export const HEROIC_ACT = { gapAtLeast: 10, ranks: ['lord', 'master'] as readonly string[] } as const;

// ---- Recording review (progression-numbers §19) ----
export const RECORDING_REVIEW = { bonus: 0.05, days: 3, everyDays: 7, recordedModes: ['trainingSaber', 'controlled', 'academy'] as readonly SparringMode[] } as const;

/** Words for the fighters themselves: a thirdParty why that uses one describes the fight (D-196). */
export const INTERRUPT_FIGHTER_WORDS: readonly string[] = ['opponent', 'opponents', 'enemy', 'enemies', 'attacker', 'attackers', 'foe', 'foes', 'combatants', 'fighters', 'duelists'];
