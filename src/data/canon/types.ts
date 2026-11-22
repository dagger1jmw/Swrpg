// Canon NPC entry shape (npc-generation.md §5; D-152 as amended by D-155). One file per lore era, matching
// Docs/SWRPG lore/SW_Characters_NN_*.md, added over time; every era gets the same level of detail. Who is present
// at a campaign date is computed (src/engine/canonRoster.ts): born, not yet dead, not unavailable, and old enough
// for the role they hold at that date. Nothing here favours any start year.
import type { FactionId, NpcRole, SpeciesId } from '../entities.config';
import type { WeaponKind } from '../health.config';

export type YearSource = 'lore' | 'estimate';

export interface CanonNpc {
  canonId: string;
  name: string;
  speciesId: SpeciesId;
  faction: FactionId;
  /** The role the figure holds from `roleFrom` on (or always, when there is no earlier role). */
  role: NpcRole;
  archetype: string;
  birthBby: number;
  /** 'lore' when the lore files give the year; 'estimate' is a design default (Jared, D-155: keep the estimates, marked). */
  birthSource: YearSource;
  deathBby?: number;
  deathSource?: YearSource;
  /** Earlier roles, oldest first: the role held until (and including) the year `untilBby`. */
  earlierRoles?: readonly { role: NpcRole; untilBby: number }[];
  /** Years the figure cannot appear (stasis, prison, hiding), inclusive. */
  unavailable?: readonly { fromBby: number; toBby: number; reason: string }[];
  /** The year the sheet's levels describe (BBY). */
  snapshotBby: number;
  levels: Readonly<Record<string, number>>;
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
  /** Canon IDs the figure had under the old lore file (lore batch 19: "Grand Master Zym" -> "Zym"); still resolve. */
  formerCanonIds?: readonly string[];
  /**
   * Where the levels come from (lore batch 19, D-391). Absent = the hand-set sheet. 'provisional' = an active adult at
   * the default start with no sheet yet: levels are the npc-generation closed form for the archetype and age, for
   * Jared's review. 'factsOnly' = a child, unborn or dead in 3661 BBY: no sheet; the same closed form when they appear.
   */
  statsSource?: 'provisional' | 'factsOnly';
  /** Sourced facts from the lore files that the engine does not read yet (sex, homeworld, ranks, teachers, alignment). */
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
  /** Status at the default start (3661 BBY): the "who is on the board" filter (lore batch 19). */
  status3661?: CanonStatus;
  /** Status at the Sacking of Coruscant (3653 BBY), as the lore file words it. */
  status3653?: string;
}

/** A figure's status at a snapshot year (lore batch 19, D-391). */
export interface CanonStatus {
  kind: 'active' | 'child' | 'unborn' | 'dead' | 'imprisoned' | 'notStated';
  /** Age in years, for children. */
  age?: number;
  /** The lore file's wording (location where stated). */
  note: string;
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
