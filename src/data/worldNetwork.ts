// The world-event tag network (M8 items 1 and 8; D-466; docs-v2/spec/world-events.md): the types an era's event data is
// written in, and the shipped network. Facts (dates, who, what) come from the lore files; tags (replaceable or crucial,
// guards) are design calls. Phase A ships the engine with no era data: WORLD_NETWORK is empty until Phase B. The Zod
// schema and the cross-reference checks are in src/features/world/networkSchema.ts.
import type { ActionType } from './checks.config';
import type { FactionId, NpcRole } from './entities.config';
import type { CombatStakes } from './progression.config';
import type { ControlSide } from './worldControl';

/** How hard a condition is to break (the numbers are in worldNetwork.config.ts). */
export const WORLD_GUARDS = ['low', 'medium', 'high'] as const;
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
  | { kind: 'outcome'; outcome: string; state: 'produced' | 'broken' };

/** A player action whose check the engine rolled, or a fight the player won. */
export type DeedTest =
  | { kind: 'action'; actionTypes: readonly ActionType[]; skills?: readonly string[]; places?: readonly string[]; canonIds?: readonly string[] }
  | { kind: 'fight'; canonIds?: readonly string[]; factions?: readonly FactionId[]; places?: readonly string[]; minStakes?: CombatStakes };

export type WorldTest = (StateTest | DeedTest) & {
  /** Weight of a state fact or a won fight (default minor). An action's weight comes from its roll. */
  strength?: TestStrength;
};

export interface RoleTag {
  /** Unique within the event, "role.<name>". */
  id: string;
  label: string;
  kind: 'replaceable' | 'crucial';
  /** The person; absent for a body, a fleet or a team. */
  canonId?: string;
  /** A SWTOR or film protagonist: always an NPC, never the player (tag map section 6). */
  protagonist?: boolean;
  /** Who can stand in (replaceable roles): the side and the standings to look in. Defaults to the person's own. */
  faction?: FactionId;
  roles?: readonly NpcRole[];
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
  /** Needed before anything counts (foreknowledge): any one is enough, and it stays known. */
  prerequisite?: readonly WorldTest[];
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
  /** Stops a montage or a time skip (galaxy-shaking events). */
  interrupts?: boolean;
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
}

/**
 * A saved event's status; an event with none is not due yet. waiting: due, but an input is not settled yet. underway:
 * started, not ended. standing: before the campaign, as recorded. recorded / substituted / adjusted: it happened. altered / cancelled: it diverged.
 */
export const WORLD_EVENT_STATUSES = ['waiting', 'underway', 'standing', 'recorded', 'substituted', 'adjusted', 'altered', 'cancelled'] as const;
export type WorldEventStatus = (typeof WORLD_EVENT_STATUSES)[number];

/** The shipped network: empty in Phase A (D-466); Phase B adds 3,661-3,640 BBY. */
export const WORLD_NETWORK: WorldNetwork = { events: [], plotPoints: [], standing: [] };
