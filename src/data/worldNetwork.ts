// The world-event tag network (M8 items 1 and 8; D-466; docs-v2/spec/world-events.md): the types an era's event data is
// written in, and the shipped network. Facts (dates, who, what) come from the lore files; tags (replaceable or crucial,
// guards) are design calls. The 3,661-3,640 data is in worldNetwork3661.ts. The Zod
// schema and the cross-reference checks are in src/features/world/networkSchema.ts.
import type { ActionType } from './checks.config';
import type { FactionId, NpcRole } from './entities.config';
import type { CombatStakes } from './progression.config';
import type { Who } from './who';
import type { ControlSide } from './worldControl';
import { NETWORK_3661 } from './worldNetwork3661';

/** How hard a condition is to break (the numbers are in worldNetwork.config.ts). */
export const WORLD_GUARDS = ['low', 'medium', 'high', 'veryHigh'] as const;
export type WorldGuard = (typeof WORLD_GUARDS)[number];

/** How much a recorded fact weighs against a guard. */
export const TEST_STRENGTHS = ['minor', 'major', 'decisive'] as const;
export type TestStrength = (typeof TEST_STRENGTHS)[number];

/** What a broken tag does to its event: it happens differently, or not at all. */
export const BREAK_EFFECTS = ['altered', 'cancelled'] as const;
export type BreakEffect = (typeof BREAK_EFFECTS)[number];

/** A calendar date; a missing month means the start of the year, as the control table reads it. */
export interface WorldDate {
  /** Signed year: BBY negative, ABY positive (calendar.ts). */
  year: number;
  month?: number;
  day?: number;
  /** The lore says "c.". */
  circa?: boolean;
  /** 'invented': the lore gives only the year, and the month or day is a design default. */
  placed?: 'lore' | 'invented';
}

/** A fact about recorded game state. Nothing here reads narration. */
export type StateTest =
  /** A canon figure, met in this campaign, the engine recorded as dead or taken (lost = either). */
  | { kind: 'npc'; canonId: string; state: 'dead' | 'captured' | 'lost' }
  /** Who holds a place now, with this campaign's changes; `is: false` = anyone else. */
  | { kind: 'control'; place: string; side: ControlSide; is?: boolean }
  /** A registered flag no AI source may set (checked by the schema). */
  | { kind: 'flag'; flag: string }
  | { kind: 'outcome'; outcome: string; state: 'produced' | 'broken' }
  /** The player has the foreknowledge a condition asks for (its prerequisites are met); tag = "<event>#<condition>". */
  | { kind: 'known'; tag: string };

/** A player action whose check the engine rolled, or a fight the player won. */
export type DeedTest =
  | { kind: 'action'; actionTypes: readonly ActionType[]; skills?: readonly string[]; places?: readonly string[]; canonIds?: readonly string[] }
  /** hold: not a win but time bought against a top duelist (D-491): a short delay one tier below the duelist, a long one at their tier. */
  | { kind: 'fight'; canonIds?: readonly string[]; factions?: readonly FactionId[]; places?: readonly string[]; minStakes?: CombatStakes; hold?: 'brief' | 'long' }
  /**
   * A ship battle the player fought (m8-ship-battles, D-517): won (or lost) against these factions at these places; `major`
   * asks for a major battle (a fleet battle with capital ships on both sides, or a standing force).
   */
  | { kind: 'battle'; scale?: 'dogfight' | 'fleet'; factions?: readonly FactionId[]; places?: readonly string[]; result?: 'won' | 'lost'; major?: boolean };

export type WorldTest = (StateTest | DeedTest) & {
  /** Weight of a state fact or a won fight (default minor). An action's weight comes from its roll. */
  strength?: TestStrength;
  /** Counts only while the event is under way (inside the battle itself, D-491). */
  during?: boolean;
};

/**
 * What can start an investigation (Jared, D-468): something recorded in play. A player's out-of-game knowledge never
 * counts, so an action on a place with no lead scores nothing. (An action on a person the character has met starts from
 * that meeting, and one after foreknowledge starts from what is known.)
 */
export interface Lead {
  /** Any of these figures met, or a fact or story thread recorded about one. */
  canonIds?: readonly string[];
  /** A fact or story thread recorded about one of these places (being there is not a lead). */
  places?: readonly string[];
  /** A particular site found (visited), not a world or a city. */
  sites?: readonly string[];
  /** A recorded discovery. */
  facts?: readonly StateTest[];
}

/**
 * Foreknowledge (Jared, D-467): its own step at a medium guard (actions and won fights add up), or one recorded discovery
 * fact (any state test). Once met it stays met.
 */
export interface Prerequisite {
  /** Unique within the condition, "know.<name>". */
  id: string;
  text: string;
  tests: readonly WorldTest[];
  leads?: readonly Lead[];
  /** Who can learn it. Absent = the condition's own `who`. */
  who?: readonly Who[];
}

/**
 * A scene outcome the engine records as the flag sceneOutcome:<id>: a rolled success against the guard's DC, or a won
 * fight, that meets one of `on`. Open while its event is unsettled, inside its window, and while `requires` holds.
 */
export interface SceneDef {
  id: string;
  title: string;
  event: string;
  guard: WorldGuard;
  fromYear: number;
  /** Inclusive. Absent = until the event settles. */
  toYear?: number;
  on: readonly DeedTest[];
  requires?: readonly StateTest[];
  leads?: readonly Lead[];
  /** Who the player must be (D-491). */
  who?: readonly Who[];
}

export interface RoleTag {
  /** Unique within the event, "role.<name>". */
  id: string;
  label: string;
  kind: 'replaceable' | 'crucial';
  /** The person; absent for a body, a fleet or a team. */
  canonId?: string;
  /** A person the lore index has no entry for: the story NPC of exactly this name, dead by the engine's record. */
  npcName?: string;
  /** A SWTOR or film protagonist: always an NPC, never the player (tag map section 6). */
  protagonist?: boolean;
  /** Who can stand in (replaceable roles): the side and the standings to look in. Defaults to the person's own. */
  faction?: FactionId;
  roles?: readonly NpcRole[];
  /** Out of every player's reach (a prisoner in a sealed system): losing the figure never counts (D-491). */
  closed?: boolean;
  /** Extra ways to lose the role; being dead or captured always counts when `canonId` is set. */
  breakIf?: readonly StateTest[];
  /** A crucial role only. Default 'altered'. */
  onBreak?: BreakEffect;
}

export interface ConditionTag {
  /** Unique within the event, "cond.<name>". */
  id: string;
  /** What must hold. Never sent to the narrator while it holds. */
  text: string;
  /** What the narrator may say once it is broken. */
  brokenText: string;
  crucial: boolean;
  guard: WorldGuard;
  /** Facts and deeds that count towards breaking it. Empty = only its inputs can stop the event. */
  breakIf: readonly WorldTest[];
  /** Needed by an action on a place alone, when no foreknowledge comes first. */
  leads?: readonly Lead[];
  /**
   * Who the player must be for a deed, or a figure taken, to count (D-491). Required wherever the player can break it. What
   * the world does (outcomes, control, scene flags, foreknowledge already had) is not gated.
   */
  who?: readonly Who[];
  /** Foreknowledge needed before anything counts: one, or two distinct ones for a very high guard. */
  prerequisites?: readonly Prerequisite[];
  /** Only while the event is under way (an occupation that must hold), or from a year on. Default: until it is settled. */
  window?: 'underway' | { fromYear: number };
  onBreak?: BreakEffect;
}

export interface ConsumedOutcome {
  outcome: string;
  /** False: the event goes ahead without it, adjusted. */
  required: boolean;
  /** Default 'cancelled'. */
  onBreak?: BreakEffect;
}

export interface ProducedOutcome {
  outcome: string;
  /** Multi-day events: produced when the event starts rather than when it ends. Default 'end'. */
  at?: 'start' | 'end';
  /**
   * Absent: produced unless the event diverges. Present: produced when every `intact` tag holds and, if `broken` is
   * given, at least one of those is broken; this also applies when the event is altered (never when cancelled). Refs are
   * the event's own tag ids or the outcomes it consumes.
   */
  when?: { intact?: readonly string[]; broken?: readonly string[] };
  /** A place that changes hands when it is produced (an outcome the record does not have: Korriban taken). */
  control?: { place: string; side: ControlSide; note: string };
}

export interface WorldEventDef {
  /** "E.<year>.<name>". */
  id: string;
  title: string;
  /** What happened on record, one line, for the narrator once it has happened. */
  summary: string;
  date: WorldDate;
  /** A campaign or an occupation: outcomes settle at its end. */
  endDate?: WorldDate;
  places?: readonly string[];
  roles: readonly RoleTag[];
  conditions: readonly ConditionTag[];
  consumes: readonly ConsumedOutcome[];
  produces: readonly ProducedOutcome[];
  /** The plot point it feeds ("PP-n"). */
  plotPoint?: string;
  /**
   * A closed system (D-489): no step inside it exists. No deed counts against its conditions, no scene belongs to it, and a
   * figure lost once it has begun changes nothing; only what it consumes, and who was lost before it, reach it.
   */
  closed?: boolean;
  /**
   * Stops a montage or a time skip (galaxy-shaking events) when it touches the character (opt-2 D4): one of its places is where
   * the character is or their home, one of its people is someone the character knows, or it is a major turn for the character's
   * side (`turnFor`). Otherwise it goes into the skip's report without stopping.
   */
  interrupts?: boolean;
  /** The sides for which this is a major turn (a treaty, the fall of a capital: opt-2 D4); allies count (the Order with the Republic). */
  turnFor?: readonly string[];
  /**
   * An all-hands-on-deck situation for these sides while it runs (opt-2 D3: a major offensive, the defence of a capital): a minor
   * wound does not keep the character from an assignment. From its start to its end (or `days` after it settles; default
   * duty.config ALL_HANDS_TAIL_DAYS).
   */
  allHands?: { factions: readonly string[]; days?: number };
  /** The timeline row. */
  source: string;
}

/** A condition over the network, for trackers and alternatives. */
export type WorldExpr =
  | { outcome: string; is: 'produced' | 'broken' }
  | { tag: string; is: 'broken' | 'intact' }
  | { event: string; is: readonly WorldEventStatus[] }
  | { test: StateTest }
  | { alternative: string; of: string }
  | { all: readonly WorldExpr[] }
  | { any: readonly WorldExpr[] }
  | { not: WorldExpr }
  | { atLeast: number; of: readonly WorldExpr[] };

export interface PlotAlternative {
  id: string;
  title: string;
  /** How it reads, for the narrator: direction, not a script. */
  heading: string;
  parameters: readonly string[];
  /** Must hold for this one to be possible. */
  requires?: WorldExpr;
  /** Fit from the current state: the weights of the criteria that hold, plus `base`. */
  base?: number;
  criteria: readonly { when: WorldExpr; weight: number }[];
  effects?: {
    /** New outcomes no event produces: an alternative can never put a broken outcome back. */
    produces?: readonly string[];
    /** Outcomes the recorded path would have produced that now never will be. */
    breaks?: readonly string[];
    /** Moves events that have not started. With `toNow` they fall due at once. */
    reschedule?: readonly { events: readonly string[]; byDays: number; toNow?: boolean }[];
    control?: readonly { place: string; side: ControlSide; note: string }[];
  };
}

export interface PlotPointDef {
  /** "PP-n". */
  id: string;
  title: string;
  events: readonly string[];
  /** It only exists while this holds (PP-2 needs the Treaty). */
  appliesIf?: WorldExpr;
  /** Nothing is chosen until this holds. */
  tracker: WorldExpr;
  alternatives: readonly PlotAlternative[];
}

export interface WorldNetwork {
  events: readonly WorldEventDef[];
  plotPoints: readonly PlotPointDef[];
  /** Outcomes already true when the network opens, with no event in it producing them. */
  standing: readonly { outcome: string; note: string }[];
  /** Scene outcomes the network's flag tests read. */
  scenes?: readonly SceneDef[];
}

/**
 * A saved event's status; an event with none is not due yet. waiting: due, but an input is not settled yet. underway:
 * started, not ended. standing: before the campaign, as recorded. recorded / substituted / adjusted: it happened. altered / cancelled: it diverged.
 */
export const WORLD_EVENT_STATUSES = ['waiting', 'underway', 'standing', 'recorded', 'substituted', 'adjusted', 'altered', 'cancelled'] as const;
export type WorldEventStatus = (typeof WORLD_EVENT_STATUSES)[number];

/** The shipped network: 3,661-3,640 BBY (Phase B, D-467). Other eras get their own files when their maps are approved. */
export const WORLD_NETWORK: WorldNetwork = NETWORK_3661;
