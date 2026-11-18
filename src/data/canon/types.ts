// Canon NPC entry shape (npc-generation.md §5; D-152 as amended by D-155). One file per lore era, matching
// Docs/SWRPG lore/SW_Characters_NN_*.md, added over time; every era gets the same level of detail. Who is present
// at a campaign date is computed (src/engine/canonRoster.ts): born, not yet dead, not unavailable, and old enough
// for the role they hold at that date. Nothing here favours any start year.
import type { FactionId, NpcRole, SpeciesId } from '../entities.config';

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
  unmapped?: readonly string[];
  note?: string;
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
