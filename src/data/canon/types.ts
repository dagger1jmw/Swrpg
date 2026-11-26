// Canon NPC entry shape (npc-generation.md §5; D-152 as amended by D-155). One file per lore era, matching
// Docs/SWRPG lore/SW_Characters_NN_*.md, added over time; every era gets the same level of detail. Who is present
// at a campaign date is computed (src/engine/canonRoster.ts): born, not yet dead, not unavailable, and old enough
// for the role they hold at that date. Nothing here favours any start year.
import type { FactionId, NpcRole, SpeciesId } from '../entities.config';
import type { ForceTrait } from '../forceResistance.config';
import type { WeaponKind } from '../health.config';

export type YearSource = 'lore' | 'estimate';

/**
 * A dated span of a figure's life (date-agnostic refactor, D-412). Years are BBY as positive numbers, both ends
 * inclusive; an absent `toBby` runs to the figure's death (or on, when no death is recorded). `source` is the lore's
 * wording (or the basis of an estimate); `estimate` marks a span the sources don't date.
 */
export interface CanonSpan {
  fromBby: number;
  toBby?: number;
  source: string;
  estimate?: boolean;
}

/** A rank, role or office held (Padawan, Knight, Master; acolyte, Lord, Darth; Overseer; a military rank; an office). */
export interface RankSpan extends CanonSpan {
  role: NpcRole;
  /** How the narrator names the rank ("Padawan", "Darth", "Overseer", "Supreme Commander"). */
  title: string;
  /** The side served in this span, when it differs from the entry's `faction` (a defector, a fallen or redeemed Jedi). */
  faction?: FactionId;
}

/**
 * A status on record. 'active' carries a cited fact and changes nothing; 'exiled' stays on the board. 'imprisoned' is
 * off the board except at the prison; 'stasis', 'missing', 'captured' and 'offRecord' (identity unknown in these years)
 * are off it. A figure doesn't age or train in stasis.
 */
export type StatusKind = 'active' | 'imprisoned' | 'stasis' | 'missing' | 'captured' | 'exiled' | 'offRecord';
export interface StatusSpan extends CanonSpan {
  kind: StatusKind;
  note: string;
}

/** Where the lore puts a figure. `placed` spans are sent to the narrator at that place (D-401 [3], [4]). */
export interface LocationSpan extends CanonSpan {
  place: string;
  /** One short line: what they are doing there. */
  doing: string;
  placed?: boolean;
  /** Held there: an NPC linked to them at this place is a prisoner (D-401 [5]). */
  imprisoned?: boolean;
  /** How the narrator names them there, when not by name ("Theron Shan (a child of about 5)"). */
  shownAs?: string;
}

/** A dated event that changes the figure's stats from its date on (an injury, a lost limb, a fall, a redemption). */
/** A career left behind (D-516): the stats hold from a date. */
export interface StatHold {
  fromBby: number;
  stats: readonly string[];
  note: string;
}

export interface StatEvent {
  bby: number;
  kind: 'injury' | 'limbLoss' | 'fall' | 'redemption' | 'other';
  note: string;
  /** Multipliers per stat from this date on; absent stats are unchanged. */
  factors?: Readonly<Record<string, number>>;
  source: string;
  estimate?: boolean;
}

/**
 * A stat anchor (D-414): levels the sources show at one date. A complete anchor sets every stat; a partial one only the
 * stats a source shows. Other ages are calculated from the nearest anchor for each stat (src/engine/canonStats.ts).
 */
export interface StatAnchor {
  bby: number;
  complete: boolean;
  levels: Readonly<Record<string, number>>;
  /** The works or rulings the levels rest on. */
  sources: string;
  /** 'sheet': hand set; 'draft': generated from archetype and rank for review (D-415). */
  basis: 'sheet' | 'draft';
  /**
   * 'game' once read by the sheet rule (D-494, src/data/canon/sheetScale.ts, at load): main-specialty stats as written,
   * physical stats without the Force in them, the rest as the game builds it. The authored numbers are kept.
   */
  scale?: 'sheet' | 'game';
  /** The authored sheet levels, kept after the conversion (reports and tests). */
  authored?: Readonly<Record<string, number>>;
}

/** A figure's dated facts (src/data/canon/era09Timeline.ts), merged into the roster entry. */
export interface CanonTimeline {
  ranks: readonly RankSpan[];
  status?: readonly StatusSpan[];
  locations?: readonly LocationSpan[];
  events?: readonly StatEvent[];
  /** The basis of an estimated birth year (D-412: from the rank spans and facts). */
  birthBasis?: string;
}

export interface CanonNpc extends CanonTimeline {
  canonId: string;
  name: string;
  speciesId: SpeciesId;
  /** The figure's main side; a rank span's `faction` overrides it for its years. */
  faction: FactionId;
  archetype: string;
  birthBby: number;
  /** 'lore' when the lore files give the year; 'estimate' is a design default (D-155, re-estimated in D-412). */
  birthSource: YearSource;
  deathBby?: number;
  deathSource?: YearSource;
  /** Stat anchors, oldest first; none = the generator builds the line from archetype and rank (D-414). */
  anchors: readonly StatAnchor[];
  /**
   * Skills left behind (D-516): from `fromBby` on, these stats hold at their value on that date and grow no further (Galena
   * Rans's Piloting and Gunnery after her flying career, Jared, 26 Nov 2026).
   */
  holds?: readonly StatHold[];
  /** Present = the levels do not scale with age; the justification (npc-generation §5). */
  fixed?: string;
  specialTalents?: readonly string[];
  /** Canon armor for Mandalorians (D-158): beskar is saber-resistant; durasteel and duraplast are not. Absent = rolled by era. */
  armor?: 'beskar' | 'durasteel' | 'duraplast';
  /** Canon weapon (D-200: a named Mandalorian's slugthrower or blaster). Absent = the archetype's, or a roll by era. */
  weapon?: WeaponKind;
  /** The blade colour the lore file gives (D-205). Absent = by path (Jedi blue or green, Sith red). */
  bladeColor?: string;
  unmapped?: readonly string[];
  note?: string;
  /**
   * A per-character exception to the species' outside-the-Force block (D-453, Jared): Onimi, the one Force-sensitive
   * Yuuzhan Vong in the lore. The species block stays; this figure gains Force XP, may have Force powers, and can be
   * sensed and touched through the Force.
   */
  insideForce?: true;
  /** A figure that breaks another of its species' Force traits (D-473; the Onimi pattern): the traits it lacks or has, and the lore for it. */
  ownForceTraits?: { without?: readonly ForceTrait[]; with?: readonly ForceTrait[]; why: string };
  /** Canon IDs the figure had under the old lore file (lore batch 19: "Grand Master Zym" -> "Zym"); still resolve. */
  formerCanonIds?: readonly string[];
  /** Sourced facts from the lore files that the engine does not read yet (sex, homeworld, teachers, alignment). */
  facts?: Readonly<{
    sex?: 'male' | 'female';
    homeworld?: string;
    group?: string;
    summary?: string;
    teachers?: string;
    formsAndPowers?: string;
    alignment?: string;
    /** Conflicts between sources, and which one the game follows (lore batch 21). */
    conflicts?: string;
    source?: string;
  }>;
}

export interface CanonEra {
  id: string;
  title: string;
  /** The lore character file this roster matches. */
  loreFile: string;
  fromBby: number;
  toBby: number;
  npcs: readonly CanonNpc[];
}
