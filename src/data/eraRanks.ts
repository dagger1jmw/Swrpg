// Rank names by era for the narrator (architecture §15 "M7 era rank names"; D-298, D-299, D-308; m7-start-checklist.md
// item 15; D-405). The narrator can't read the topical lore files (D-81), so the cross-era rank tables of
// SW_Jedi_Training_AllEras_Part1/2, SW_Jedi_Ranks_Councils_Roles_AllEras_Part1 and SW_Sith_Training_AllEras_Part1/2 are
// data here, keyed by campaign year ([fromYear, toYear), negative = BBY), the same pattern as D-320's role eras.
// Overlapping rows are both sent (two Sith orders can exist at once: Vitiate's hidden Empire and Kun's Brotherhood).

export interface RankEra {
  order: 'Jedi' | 'Sith';
  era: string;
  fromYear: number;
  toYear: number;
  /** The ladder, low to high, and the titles in use. */
  names: string;
  source: string;
}

const JT = 'SW_Jedi_Training_AllEras_Part1/2, cross-era table';
const JR = 'SW_Jedi_Ranks_Councils_Roles_AllEras_Part1, cross-era overview';
const ST = 'SW_Sith_Training_AllEras_Part1/2, cross-era rank table; D-308';

export const RANK_ERAS: readonly RankEra[] = [
  { order: 'Jedi', era: "Je'daii", fromYear: -36453, toYear: -25783, names: "initiate, Padawan, Journeyer, Ranger, Master, Temple Master (the Je'daii Council of nine Temple Masters)", source: `${JT}; D-299` },
  { order: 'Jedi', era: 'the early Order', fromYear: -25783, toYear: -4000, names: 'apprentice, Knight, Master (also Watchman); Grand Master', source: `${JT}; ${JR}` },
  { order: 'Jedi', era: 'the Great Sith War', fromYear: -4000, toYear: -3976, names: 'apprentice, Knight, Master; Watchman; the High Council (by 3,997)', source: `${JT}; ${JR}` },
  { order: 'Jedi', era: 'the Old Republic to the New Sith Wars', fromYear: -3976, toYear: -2000, names: 'youngling (Initiate), Padawan, Knight, Master; the High Council and Grand Master (Zym, Satele Shan); Battlemaster', source: `${JT} (era 4); ${JR} (3,600–1,000 row); D-298` },
  { order: 'Jedi', era: 'the New Sith Wars', fromYear: -2000, toYear: -1000, names: 'Initiate, Padawan, Knight, Master, plus Jedi Lord, Battlemaster and General; the Jedi Grand Council of Jedi Lords', source: `${JT} (era 5b); ${JR}` },
  { order: 'Jedi', era: 'the late Republic', fromYear: -1000, toYear: -19, names: 'Initiate, Padawan, Knight, Master; Grand Master and Master of the Order; Jedi Commander (Padawan) and Jedi General in the Clone Wars', source: `${JT} (eras 5c, 6); ${JR}` },
  { order: 'Jedi', era: 'the Dark Times', fromYear: -19, toYear: 4, names: 'none formal: survivors in hiding, no Knights promoted', source: `${JT} (era 7); ${JR}` },
  { order: 'Jedi', era: 'the New Jedi Order', fromYear: 4, toYear: 127, names: 'student or apprentice, Knight, Master; Grand Master (from 36 ABY)', source: `${JT} (era 8); ${JR}` },
  { order: 'Jedi', era: 'the Legacy era', fromYear: 127, toYear: 140, names: 'Initiate, Padawan, Knight, Master; the High Council under its head (Kol Skywalker); Sentinel by 137 ABY', source: JR },
  { order: 'Sith', era: 'the Ancient Sith Empire', fromYear: -100000, toYear: -5000, names: "castes (Zuguruk, Kissai priest-teachers, Massassi warriors), Sith Kings and the Sith'ari; after 6,900: Sith Lords, the Sith Council, the Dark Lord of the Sith; the Shadow Hand", source: ST },
  { order: 'Sith', era: "Vitiate's Empire", fromYear: -5000, toYear: -3636, names: "acolyte, apprentice, Sith Lord, Darth, the Dark Council (twelve Dark Lords, one Sphere each), the Emperor's Wrath, the Emperor; Overseer and Assistant Overseer are staff roles", source: ST },
  { order: 'Sith', era: "Kun's Brotherhood of the Sith", fromYear: -4000, toYear: -3995, names: 'disciples, Sith Lord, Dark Lord of the Sith (no Darth)', source: ST },
  { order: 'Sith', era: 'Revan and the Triumvirate', fromYear: -3959, toYear: -3950, names: 'Dark Lord and apprentice; the Shadow Hand; Sith assassins and marauders; the Triumvirate\'s self-styled "Lord of" titles', source: ST },
  { order: 'Sith', era: 'after 3,636 BBY', fromYear: -3636, toYear: -2000, names: 'apprentices, Lords, the Dark Council rebuilt by Empress Acina, the Spheres; Darth among Councillors', source: ST },
  { order: 'Sith', era: 'the New Sith Wars', fromYear: -2000, toYear: -1010, names: 'feudal Dark Lords and warlords with disciples; acolytes and adepts, assassins and spies, warriors and marauders, Sith Lords, the Sith Council', source: ST },
  { order: 'Sith', era: 'the Brotherhood of Darkness', fromYear: -1010, toYear: -1000, names: 'acolytes and adepts, assassins, warriors and marauders; every Master a "Dark Lord of the Sith"; Darth discouraged', source: ST },
  { order: 'Sith', era: 'the Rule of Two', fromYear: -1000, toYear: 4, names: 'exactly two: the Master (Dark Lord of the Sith) and the apprentice; Darth plus a name chosen by the Master. Dark Acolytes, assassins and Inquisitors are not Sith', source: `${ST}; D-311` },
  { order: 'Sith', era: 'the New Republic', fromYear: 4, toYear: 43, names: 'no Sith order: Dark Jedi groups (not Sith); Lumiya as Dark Lady; the Lost Tribe (Tyro, apprentice, Saber, Master, Lord, High Lord, Grand Consort, Grand Lord)', source: ST },
  { order: 'Sith', era: 'the One Sith', fromYear: 25, toYear: 139, names: 'acolyte, apprentice, Lord or Lady, Darth by merit only; the Hand, Fist, Voice or Regent, Loremaster and Inquisitor; the Dark Lord', source: ST },
];

/** The rank rows in use in `year` (campaign year, negative = BBY). */
export function rankErasAt(year: number): RankEra[] {
  return RANK_ERAS.filter((r) => year >= r.fromYear && year < r.toYear);
}
