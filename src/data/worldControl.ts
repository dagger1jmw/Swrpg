// Who controls key places, and who leads the powers, in the Great Galactic War window (M7 playable 3,661 BBY start;
// D-400). Lore only: every span comes from the timeline slice (SW_Timeline_3700_3600BBY_Part1-2, lore batch 20) or the
// topic files and rulings of lore batches 12-21 (cited per entry). Years are BBY as positive numbers, both ends
// inclusive, as in the canon rosters. A place the lore leaves unstated is not listed (D-399 [18]: leave it blank, never
// invent it); `inferred` marks a reading the sources only imply. Covers 3,681-3,653 BBY (the war) plus the few spans
// the files carry past it; other eras get their own entries when their lore is in (D-155).

export type ControlSide =
  | 'republic'
  | 'sithEmpire'
  | 'hutts'
  | 'mandalorians'
  | 'chiss'
  | 'contested'
  | 'neutral'
  | 'independent'
  | 'unknown to the galaxy';

export interface ControlSpan {
  /** The place as the lore names it; matched against location names (normalized, whole words). */
  place: string;
  aliases?: readonly string[];
  fromBby: number;
  toBby: number;
  side: ControlSide;
  /** One line for the narrator. */
  note: string;
  inferred?: boolean;
  source: string;
}

const S1 = 'Timeline slice Part 1';
const S2 = 'Timeline slice Part 2';

export const WORLD_CONTROL: readonly ControlSpan[] = [
  { place: 'Coruscant', fromBby: 3681, toBby: 3654, side: 'republic', note: 'the Republic capital; from 3,661 the Hydian Way blockade cuts its supplies and the lower levels riot for food', source: `${S1} (3,661, 3,653); D-380` },
  { place: 'Coruscant', fromBby: 3653, toBby: 3653, side: 'sithEmpire', note: 'sacked and held two days under martial law, then returned under the Treaty of Coruscant', source: `${S1} (3,653)` },
  { place: 'Korriban', fromBby: 3681, toBby: 3637, side: 'sithEmpire', note: 'retaken in 3,681; the Sith Academy re-established; the Republic attacks of 3,678 and 3,660 failed', source: `${S1} (3,681, 3,678, 3,660); D-376` },
  { place: 'Dromund Kaas', aliases: ['Kaas City'], fromBby: 3681, toBby: 3637, side: 'sithEmpire', note: 'the Sith Empire\'s capital', source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 (lore batch 9)' },
  { place: 'Ziost', fromBby: 3681, toBby: 3637, side: 'sithEmpire', note: 'Imperial; Darth Marr repelled the Republic offensive of 3,660', source: `${S1} (3,660)` },
  { place: 'Hydian Way', fromBby: 3661, toBby: 3661, side: 'mandalorians', note: 'closed by Mandalore the Lesser\'s cruisers, for the Empire (broken by Hylo Visz in 3,660)', source: `${S1} (3,661, 3,660); D-380 [6], D-382 [3]` },
  { place: 'Seswenna sector', fromBby: 3671, toBby: 3653, side: 'sithEmpire', note: 'seized by the Empire at the third battle of the Seswenna sector (3,671)', source: `${S1} (3,671)` },
  { place: 'Rimma Trade Route', fromBby: 3680, toBby: 3653, side: 'republic', note: 'retaken by the Republic in 3,680, ending the Imperial blockade', source: `${S1} (3,680)` },
  { place: 'Balmorra', fromBby: 3670, toBby: 3654, side: 'contested', note: 'under Imperial attack for its arms factories since before 3,670; still contested', source: `${S1} (3,670, 3,665)` },
  { place: 'Balmorra', fromBby: 3653, toBby: 3643, side: 'sithEmpire', note: 'Imperial after the Republic ended its support (freed in 3,642)', source: `${S1} (after 3,653); ${S2} (3,642)` },
  { place: 'Geonosis', fromBby: 3665, toBby: 3653, side: 'contested', note: 'the Geonosis campaign, an active front; the Mandalorian clans rallied here 3,667–3,665', source: `${S1} (3,665); D-382 [1]` },
  { place: 'Minos Cluster', fromBby: 3681, toBby: 3654, side: 'contested', note: 'a front for the whole war (the Jedi fleet arrived in 3,680); fighting ends with the peace offer of 3,654 and the Empire withdraws in 3,653', source: `${S1} (3,680, 3,654); D-393 [17]` },
  { place: 'Ord Radama', fromBby: 3681, toBby: 3653, side: 'republic', note: 'Republic-held; taken by Malgus and Venemal in 3,660 and retaken the same year (the "Harrower Disaster")', source: `${S1} (3,660)` },
  { place: 'Alderaan', fromBby: 3667, toBby: 3654, side: 'republic', note: 'the Imperial invasion of 3,667 was repelled', source: `${S1} (3,667)` },
  { place: 'Bothawui', fromBby: 3671, toBby: 3654, side: 'republic', note: 'Republic-defended since the two battles of 3,671 halted the Sith advance', source: `${S1} (3,671); SW_Species_OldRepublic_Part1 (Bothan)` },
  { place: 'Belsavis', fromBby: 3691, toBby: 3642, side: 'republic', note: 'the Republic\'s secret Tomb prison (the Dread Masters held there from 3,668; Prince Shange and Lord Raxxus from c. 3,661)', source: `${S1} (3,691, 3,668, 3,661); ${S2} (3,641)` },
  { place: 'Nal Hutta', fromBby: 3681, toBby: 3653, side: 'hutts', note: 'Hutt Space, neutral and untouched by the war; Hutt money is behind blockade runs', source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 (lore batch 16); D-380 [10]; SW_Species_OldRepublic_Part2 (Hutt)' },
  { place: 'Nar Shaddaa', fromBby: 3681, toBby: 3653, side: 'hutts', note: 'the Hutts\' moon, never sacked; Shadow Town and the Republic Embassy do not exist yet', source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 (lore batch 16); D-384 [7]' },
  { place: 'Kintan', fromBby: 3661, toBby: 3661, side: 'hutts', note: 'the Nikto homeworld, in Hutt Space', inferred: true, source: 'SW_Species_OldRepublic_Part2 (Nikto)' },
  { place: 'Ryloth', fromBby: 3661, toBby: 3661, side: 'hutts', note: 'Hutt-controlled (the Twi\'lek clans regain it only after 3,643)', inferred: true, source: 'SW_Species_OldRepublic_Part1 (Twi\'lek); D-399 [14]' },
  { place: 'Iridonia', fromBby: 3681, toBby: 3653, side: 'contested', note: 'fought over by both powers, each using it as a staging ground', source: 'SW_Species_OldRepublic_Part1 (Zabrak)' },
  { place: 'Csilla', aliases: ['Chiss Ascendancy'], fromBby: 3681, toBby: 3653, side: 'chiss', note: 'the Chiss Ascendancy, the Empire\'s only true ally (resources, revenue and armies for Chiss sovereignty)', source: `${S1} (before 3,681); D-393 [18]; SW_Species_OldRepublic_Part1 (Chiss)` },
  { place: 'Rattatak', fromBby: 3680, toBby: 3653, side: 'contested', note: 'partly occupied by the Sith since Darth Vich\'s failed insurrection', source: 'SW_Species_OldRepublic_Part1 (Rattataki)' },
  { place: 'Manaan', fromBby: 3681, toBby: 3653, side: 'neutral', note: 'Selkath neutrality; the source of kolto', source: 'SW_Species_OldRepublic_Part2 (Selkath)' },
  { place: 'Mirial', fromBby: 3681, toBby: 3653, side: 'republic', note: 'a refuge for Outer Rim refugees since the war began', inferred: true, source: 'SW_Species_OldRepublic_Part1 (Mirialan)' },
  { place: 'Arkania', fromBby: 3661, toBby: 3661, side: 'republic', note: 'a Republic world', source: 'SW_Species_OldRepublic_Part2 (Arkanian)' },
  { place: 'Voss', fromBby: 3681, toBby: 3646, side: 'unknown to the galaxy', note: 'independent and unknown to outsiders until the rediscovery c. 3,645', source: 'SW_Species_OldRepublic_Part2 (Voss); D-399 [15]' },
  { place: 'Tython', fromBby: 3681, toBby: 3652, side: 'unknown to the galaxy', note: 'the lost Jedi homeworld, rediscovered by Satele Shan in 3,651', source: `${S2} (3,651, 3,650); D-283 amended` },
  { place: 'Belkadan', aliases: ['Ruuria', 'Sernpidal', 'Dalonbian sector'], fromBby: 3681, toBby: 3681, side: 'sithEmpire', note: 'secretly Imperial-controlled puppet worlds from before the war', source: `${S1} (before 3,681)` },
];

export interface LeaderSpan {
  /** The office, as the narrator should name it. */
  office: string;
  holder: string;
  fromBby: number;
  toBby: number;
  inferred?: boolean;
  source: string;
}

/** Who leads the powers (lore batches 13-21). Offices the lore leaves unnamed for a year are not listed (D-387 [1], [9]). */
export const FACTION_LEADERS: readonly LeaderSpan[] = [
  { office: 'Sith Emperor', holder: 'the Emperor (Vitiate), unseen on Dromund Kaas', fromBby: 3681, toBby: 3641, source: 'SW_SWTOR_Era_Power_Structures_Part1' },
  { office: 'Supreme Chancellor', holder: 'Berooken', fromBby: 3661, toBby: 3653, inferred: true, source: 'D-363; D-381 (elected "late in the war", no date)' },
  { office: 'Supreme Commander of the Republic military', holder: 'Rans', fromBby: 3681, toBby: 3653, inferred: true, source: 'D-360 [3]; D-386 [1]' },
  { office: 'Grand Master of the Jedi Order', holder: 'Zym', fromBby: 3661, toBby: 3653, inferred: true, source: 'D-379; D-390 [1]' },
  { office: 'Grand Master of the Jedi Order', holder: 'Satele Shan', fromBby: 3651, toBby: 3636, source: 'D-283 amended' },
  { office: 'Mandalore', holder: 'Mandalore the Lesser (backed by Imperial Intelligence)', fromBby: 3667, toBby: 3660, source: `${S1} (3,667, 3,660); D-382 [1], [4]` },
  { office: 'Mandalore', holder: 'Mandalore the Vindicated (Artus Lok)', fromBby: 3660, toBby: 3636, source: `${S1} (3,660); ${S2} (3,636–3,630)` },
];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const mentions = (text: string, name: string): boolean => new RegExp(`(^| )${norm(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(norm(text));

/** The control spans at `bby` for any of these place names (a location and its ancestors), in table order. */
export function controlAt(placeNames: readonly string[], bby: number): ControlSpan[] {
  return WORLD_CONTROL.filter((c) => bby <= c.fromBby && bby >= c.toBby && placeNames.some((p) => [c.place, ...(c.aliases ?? [])].some((n) => mentions(p, n))));
}

/** The leaders in office at `bby`. */
export function leadersAt(bby: number): LeaderSpan[] {
  return FACTION_LEADERS.filter((l) => bby <= l.fromBby && bby >= l.toBby);
}
