// Training records (progression-numbers §15; D-125): archive records and holocrons act as teachers
// with a fixed level for the skills they cover, x0.9 effectiveness for physical techniques (forms)
// and x1.0 for Force and knowledge skills. A record opens a form's basics drill like a teacher does
// ("known or with a teacher"), so a new form can be started from one (the D-119 transfer applies).
// Levels and the list are design defaults (no Legends source gives numbers); names are generic.
// Archive records need the path's archives (Jedi Archives / Sith archives). Holocrons need
// possession: until items exist (M8) the player's choice is trusted.
import type { CharacterPath } from './archetypes';

export interface TrainingRecordDef {
  id: string;
  name: string;
  kind: 'archive' | 'holocron' | 'journal';
  /** Paths whose archives hold it (archive records); holocrons work for anyone holding one. */
  paths: readonly CharacterPath[];
  /** Fixed teaching level per covered skill. */
  levels: Readonly<Record<string, number>>;
  /** First calendar year the record exists (negative = BBY); none = every era. */
  fromYear?: number;
  /** Only at these places (matched against the current location and its ancestors): the Archives in the Temple (D-427). */
  places?: readonly string[];
  /** A Jedi or Sith text (D-436): Jedi texts teach only what the Order permits; archives take it from their paths. */
  tradition?: 'jedi' | 'sith';
}

/** Design default: the New Jedi Order's academy and its recovered Form VII records, c. 11 ABY (D-352 [21], D-370). */
export const NJO_FORM_RECORDS_YEAR = 11;

const ARCHIVE_FORM_LEVEL = 35;
const FORMS_IN_ARCHIVES = ['shiiCho', 'makashi', 'soresu', 'ataru', 'shien', 'djemSo', 'niman', 'trakata', 'jarKai', 'sokan', 'saberstaff', 'zeroG'];
const forms = (ids: readonly string[], level: number): Record<string, number> => Object.fromEntries(ids.map((f) => [f, level]));

export const TRAINING_RECORDS: readonly TrainingRecordDef[] = [
  { id: 'record:jediArchiveForms', name: 'Jedi Archives: lightsaber form records', kind: 'archive', paths: ['jedi'], levels: forms(FORMS_IN_ARCHIVES, ARCHIVE_FORM_LEVEL) },
  { id: 'record:jediArchiveLore', name: 'Jedi Archives: Force lore and meditation texts', kind: 'archive', paths: ['jedi'], levels: { forceKnowledge: 45, meditation: 35, forceSense: 30 } },
  { id: 'record:sithArchiveForms', name: 'Sith archives: combat form records', kind: 'archive', paths: ['sith'], levels: forms([...FORMS_IN_ARCHIVES, 'juyo', 'dunMoch'], ARCHIVE_FORM_LEVEL) },
  // Lore batch 10 (D-370): Vaapad is Windu's late-Republic technique and not in the Sith archives. Its records survived
  // the Purge and were recovered by the New Jedi Order (The Jedi Path, the Great Holocron), kept into the Legacy era.
  { id: 'record:njoFormVII', name: 'Jedi Archives: recovered Form VII records (Juyo and Vaapad)', kind: 'archive', paths: ['jedi'], levels: forms(['juyo', 'vaapad'], ARCHIVE_FORM_LEVEL), fromYear: NJO_FORM_RECORDS_YEAR },
  { id: 'record:sithArchiveLore', name: 'Sith archives: teachings of the dark side', kind: 'archive', paths: ['sith'], levels: { forceKnowledge: 45, forceLightning: 30, forceChoke: 30 } },
  { id: 'holocron:formMaster', name: 'Holocron of a lightsaber master', kind: 'holocron', paths: [], levels: forms(FORMS_IN_ARCHIVES, 60) },
  { id: 'holocron:forceMaster', name: 'Holocron of a Force master', kind: 'holocron', paths: [], levels: { forceControl: 60, forceSense: 60, telekinesis: 60, forceKnowledge: 65, meditation: 55 } },
  // Study of texts (Jared, D-427; levels invented): the full Archives in the Temple, journals and gatekeeper holocrons.
  // The Archives stand in the Coruscant Temple and, after the Sacking, on Tython (the Order's seats, orderSeats.ts).
  { id: 'record:jediArchivesTemple', name: 'Jedi Archives: the full collection, studied in the Temple', kind: 'archive', paths: ['jedi'], levels: { forceKnowledge: 75, meditation: 50, forceSense: 40 }, places: ['Jedi Temple', 'Tython'] },
  { id: 'record:sithLibraryKorriban', name: 'the Sith Library of the Korriban Academy', kind: 'archive', paths: ['sith'], levels: { forceKnowledge: 70, forceOutput: 40 }, places: ['Korriban'] },
  { id: 'journal:jediMaster', tradition: 'jedi', name: "A Jedi Master's journal", kind: 'journal', paths: [], levels: { forceKnowledge: 55, forceControl: 50, meditation: 50 } },
  // Legends: Obi-Wan Kenobi kept journals in his exile on Tatooine (19-0 BBY), which Luke read; the levels are invented.
  { id: 'journal:obiWanKenobi', tradition: 'jedi', name: "Obi-Wan Kenobi's journal", kind: 'journal', paths: [], levels: { forceKnowledge: 70, meditation: 60, forceControl: 65, soresu: 70 }, fromYear: -19 },
  { id: 'holocron:jediGatekeeper', tradition: 'jedi', name: 'A Jedi holocron with its gatekeeper', kind: 'holocron', paths: [], levels: { forceKnowledge: 85, meditation: 70, forceSense: 70 } },
  { id: 'holocron:sithLord', tradition: 'sith', name: "A Sith Lord's holocron", kind: 'holocron', paths: [], levels: { forceKnowledge: 80, forceOutput: 60, forceLightning: 55 } },
];

export const TRAINING_RECORD_BY_ID: ReadonlyMap<string, TrainingRecordDef> = new Map(TRAINING_RECORDS.map((r) => [r.id, r]));
