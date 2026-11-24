// Who controls key places, and who leads the powers, in the Great Galactic War window (M7 playable 3,661 BBY start;
// D-400). Lore only: every span comes from the timeline slice (SW_Timeline_3700_3600BBY_Part1-2, lore batch 20) or the
// topic files and rulings of lore batches 12-21 (cited per entry). Years are BBY as positive numbers, both ends
// inclusive, as in the canon rosters. A place the lore leaves unstated is not listed (D-399 [18]: leave it blank, never
// invent it); `inferred` marks a reading the sources only imply. Covers 3,681-3,653 BBY (the war), and the Cold War's
// recorded changes to 3,640 from the timeline slice Part 2 (D-408); other eras get their own entries when their lore is
// in (D-155). A span ends at its last recorded year and is blank after it (D-411 [5]: never held to an inferred end).

export const CONTROL_SIDES = ['republic', 'sithEmpire', 'hutts', 'mandalorians', 'chiss', 'contested', 'neutral', 'independent', 'unknown to the galaxy'] as const;
export type ControlSide = (typeof CONTROL_SIDES)[number];

/**
 * A dated fact tied to the world-event network (D-466): in a campaign it only starts once every outcome in `dependsOn`
 * was produced, and it lasts until `endsWith` is produced. If one is broken, the fact before it holds (the freeze).
 * Absent, or an outcome the network does not know: the lore's dates apply.
 */
export interface OutcomeLinks {
  dependsOn?: readonly string[];
  endsWith?: string;
}

export interface ControlSpan extends OutcomeLinks {
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
  { place: 'Coruscant', fromBby: 3653, toBby: 3653, dependsOn: ['O.coruscant_occupied'], endsWith: 'O.treaty_signed', side: 'sithEmpire', note: 'sacked and held two days under martial law, then returned under the Treaty of Coruscant', source: `${S1} (3,653)` },
  { place: 'Korriban', fromBby: 3681, toBby: 3637, side: 'sithEmpire', note: 'retaken in 3,681; the Sith Academy re-established; the Republic attacks of 3,678 and 3,660 failed', source: `${S1} (3,681, 3,678, 3,660); D-376` },
  { place: 'Dromund Kaas', aliases: ['Kaas City'], fromBby: 3681, toBby: 3637, side: 'sithEmpire', note: 'the Sith Empire\'s capital', source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 (lore batch 9)' },
  { place: 'Ziost', fromBby: 3681, toBby: 3637, side: 'sithEmpire', note: 'Imperial; Darth Marr repelled the Republic offensive of 3,660', source: `${S1} (3,660)` },
  { place: 'Hydian Way', fromBby: 3661, toBby: 3661, endsWith: 'O.blockade_broken', side: 'mandalorians', note: 'closed by Mandalore the Lesser\'s cruisers, for the Empire (broken by Hylo Visz in 3,660)', source: `${S1} (3,661, 3,660); D-380 [6], D-382 [3]` },
  { place: 'Seswenna sector', fromBby: 3671, toBby: 3653, side: 'sithEmpire', note: 'seized by the Empire at the third battle of the Seswenna sector (3,671)', source: `${S1} (3,671)` },
  { place: 'Rimma Trade Route', fromBby: 3680, toBby: 3653, side: 'republic', note: 'retaken by the Republic in 3,680, ending the Imperial blockade', source: `${S1} (3,680)` },
  { place: 'Balmorra', fromBby: 3670, toBby: 3654, side: 'contested', note: 'under Imperial attack for its arms factories since before 3,670; still contested', source: `${S1} (3,670, 3,665)` },
  { place: 'Balmorra', fromBby: 3653, toBby: 3643, dependsOn: ['O.balmorra_imperial'], side: 'sithEmpire', note: 'Imperial after the Republic ended its support (freed in 3,642)', source: `${S1} (after 3,653); ${S2} (3,642)` },
  { place: 'Geonosis', fromBby: 3665, toBby: 3653, side: 'contested', note: 'the Geonosis campaign, an active front; the Mandalorian clans rallied here 3,667–3,665', source: `${S1} (3,665); D-382 [1]` },
  { place: 'Minos Cluster', fromBby: 3681, toBby: 3654, endsWith: 'O.minos_quiet', side: 'contested', note: 'a front for the whole war (the Jedi fleet arrived in 3,680); fighting ends with the peace offer of 3,654 and the Empire withdraws in 3,653', source: `${S1} (3,680, 3,654); D-393 [17]` },
  { place: 'Serenno', fromBby: 3681, toBby: 3661, side: 'republic', note: "Republic-held, with Jedi Master Ven Zallow's base; it falls to Malgus c. 3,660 in the Rim Campaign", source: 'D-402 [2]; SW_Planets_Travel_OldRepublic_Part1 (Serenno)' },
  { place: 'Ord Radama', fromBby: 3681, toBby: 3653, side: 'republic', note: 'Republic-held; taken by Malgus and Venemal in 3,660 and retaken the same year (the "Harrower Disaster")', source: `${S1} (3,660)` },
  { place: 'Alderaan', fromBby: 3667, toBby: 3654, endsWith: 'O.alderaan_civil_war', side: 'republic', note: 'the Imperial invasion of 3,667 was repelled', source: `${S1} (3,667)` },
  { place: 'Bothawui', fromBby: 3671, toBby: 3654, side: 'republic', note: 'Republic-defended since the two battles of 3,671 halted the Sith advance', source: `${S1} (3,671); SW_Species_OldRepublic_Part1 (Bothan)` },
  { place: 'Belsavis', fromBby: 3691, toBby: 3642, endsWith: 'O.dread_masters_free', side: 'republic', note: 'the Republic\'s secret Tomb prison (the Dread Masters held there from 3,668; Prince Shange and Lord Raxxus from c. 3,661)', source: `${S1} (3,691, 3,668, 3,661); ${S2} (3,641)` },
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
  { place: 'Tython', fromBby: 3681, toBby: 3652, endsWith: 'O.tython_found', side: 'unknown to the galaxy', note: 'the lost Jedi homeworld, rediscovered by Satele Shan in 3,651', source: `${S2} (3,651, 3,650); D-283 amended` },
  { place: 'Belkadan', aliases: ['Ruuria', 'Sernpidal', 'Dalonbian sector'], fromBby: 3681, toBby: 3681, side: 'sithEmpire', note: 'secretly Imperial-controlled puppet worlds from before the war', source: `${S1} (before 3,681)` },
  // The Cold War and the Galactic War's opening, from the timeline slice Part 2 (D-408 [2]). Coruscant is returned inside
  // 3,653, when the Treaty is signed (D-467).
  { place: 'Coruscant', fromBby: 3653, toBby: 3632, dependsOn: ['O.treaty_signed'], side: 'republic', note: 'the Republic capital, returned under the Treaty of Coruscant; the Jedi Temple lies in ruins, and in 3,650 the Senate puts off rebuilding it', source: `${S1} (3,653); ${S2} (3,650, 3,643, 3,641, 3,632); D-408 [2], D-411 [5]` },
  { place: 'Alderaan', fromBby: 3652, toBby: 3638, dependsOn: ['O.alderaan_civil_war'], side: 'independent', note: 'seceded from the Republic after the Treaty, when Senator Gaul Panteer walked out; the Alderaan Civil War follows (still going in 3,641 and 3,638)', source: `${S2} (after 3,653, 3,641, 3,638); D-408 [2], D-411 [5]` },
  { place: 'Tython', fromBby: 3651, toBby: 3638, dependsOn: ['O.tython_found'], side: 'republic', note: 'the Jedi homeworld, rediscovered by Satele Shan in 3,651; the Order moves there in 3,650 and finishes its Temple in 3,647', source: `${S2} (3,651, 3,650, 3,647, 3,637); D-408 [2]` },
  { place: 'Taris', fromBby: 3648, toBby: 3643, dependsOn: ['O.taris_resettled'], side: 'republic', note: 'the Republic\'s Taris Resettlement Initiative', source: `${S2} (3,648); D-408 [2]` },
  { place: 'Taris', fromBby: 3642, toBby: 3642, dependsOn: ['O.taris_imperial'], side: 'sithEmpire', note: 'invaded and occupied by the Empire, halting the resettlement', source: `${S2} (3,642); D-408 [2], D-411 [5]` },
  { place: 'Voss', fromBby: 3645, toBby: 3640, side: 'independent', note: 'rediscovered c. 3,645; the Voss stay independent, and from c. 3,640 both powers court them', source: `SW_Species_OldRepublic_Part2 (Voss); D-399 [15]; ${S2} (c. 3,640); D-408 [2], D-411 [5]` },
  { place: 'Balmorra', fromBby: 3642, toBby: 3642, dependsOn: ['O.balmorra_republic'], side: 'republic', note: 'freed from Imperial control by the Republic and the Balmorran resistance', source: `${S2} (3,642); D-408 [2], D-411 [5]` },
  { place: 'Corellia', fromBby: 3640, toBby: 3640, dependsOn: ['O.corellia_contested'], side: 'contested', note: 'invaded by Darth Decimus in the Battle of Corellia', source: `${S2} (3,640); D-408 [2], D-411 [5]` },
  { place: 'Ilum', fromBby: 3640, toBby: 3636, dependsOn: ['O.ilum_contested'], side: 'contested', note: 'contested for the rest of the Galactic War after the Battle of Ilum', source: `${S2} (3,640); D-408 [2]` },
  // The Nov 22 lore update (D-440).
  { place: 'Dromund Kaas', aliases: ['Kaas City'], fromBby: 3636, toBby: 3631, side: 'sithEmpire', note: 'the Sith Empire under Empress Acina, a vassal of Zakuul blockaded by the Eternal Fleet, not occupied; no longer the Dark Council\'s seat', source: 'SW_Dromund_Kaas_History (c. 3636 BBY; decision 1); D-440' },
  { place: 'Manaan', fromBby: 3625, toBby: 3625, side: 'contested', note: 'the Sith Empire invades to seize its kolto', source: `${S2} (3,625); SW_Kolto_Bacta; D-440` },
];

export interface LeaderSpan extends OutcomeLinks {
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
  { office: 'Sith Emperor', holder: 'the Emperor (Vitiate), unseen on Dromund Kaas', fromBby: 3681, toBby: 3640, endsWith: 'O.dark_council_rules', source: 'SW_SWTOR_Era_Power_Structures_Part1; Timeline slice Part 2 (3,640: his Voice is killed); D-408 [3]' },
  { office: 'Sith Emperor', holder: 'none in power: the Emperor\'s essence lies dormant and the Dark Council rules', fromBby: 3640, toBby: 3637, dependsOn: ['O.dark_council_rules'], source: 'Timeline slice Part 2 (3,640; Darth Acina declares herself Empress in 3,636); D-408 [3]' },
  { office: 'Sith Emperor', holder: 'Empress Acina (self-declared), sworn to Arcann of Zakuul and ruling from blockaded Dromund Kaas', fromBby: 3636, toBby: 3631, dependsOn: ['O.dark_council_rules'], source: 'SW_Dromund_Kaas_History (c. 3636 BBY: about five years); D-440' },
  { office: 'Supreme Chancellor', holder: 'Berooken', fromBby: 3661, toBby: 3653, endsWith: 'O.berooken_dead', inferred: true, source: 'D-363; D-381 (elected "late in the war", no date)' },
  { office: 'Supreme Chancellor', holder: 'Dorian Janarus', fromBby: 3653, toBby: 3640, dependsOn: ['O.janarus_chancellor'], endsWith: 'O.saresh_chancellor', source: 'Timeline slice Part 2 (elected shortly after the Treaty in 3,653; re-elected 3,649 and 3,645; killed 3,640); D-408 [3]' },
  { office: 'Supreme Chancellor', holder: 'Leontyne Saresh', fromBby: 3640, toBby: 3632, dependsOn: ['O.saresh_chancellor'], source: 'Timeline slice Part 2 (3,640, 3,632); D-408 [3]' },
  // D-421 (Jared): the inferred Rans span of 3,681-3,643 is removed; the years not on record (3,661 among them) are blank.
  { office: 'Supreme Commander of the Republic military', holder: 'Rans', fromBby: 3653, toBby: 3653, source: 'SW_Characters_09_GGW_ColdWar_Part3a (Rans: in office at the Sacking); D-421' },
  { office: 'Supreme Commander of the Republic military', holder: 'Stantorrs', fromBby: 3643, toBby: 3643, source: 'SW_Characters_09_GGW_ColdWar_Part3a (Stantorrs: Supreme Commander in 3,643, replaced by Rans); D-421' },
  { office: 'Supreme Commander of the Republic military', holder: 'Rans', fromBby: 3642, toBby: 3640, inferred: true, source: 'SW_Characters_09_GGW_ColdWar_Part3a (Rans replaced Stantorrs; retired after Ilum, 3,640); D-421' },
  { office: 'Supreme Commander of the Republic military', holder: 'Jace Malcom', fromBby: 3640, toBby: 3640, source: 'Timeline slice Part 2 (3,640); later years are not on record (D-411 [5]); D-408 [3]' },
  { office: 'Grand Master of the Jedi Order', holder: 'Zym', fromBby: 3661, toBby: 3653, endsWith: 'O.grand_master_vacant', inferred: true, source: 'D-379; D-390 [1]' },
  { office: 'Grand Master of the Jedi Order', holder: 'vacant: the Jedi Council leads the Order', fromBby: 3653, toBby: 3652, dependsOn: ['O.grand_master_vacant'], endsWith: 'O.grand_master_set', source: 'Zym dies in 3,653 and Satele Shan is made Grand Master in 3,651; no acting head is on record (D-411 [3])' },
  { office: 'Grand Master of the Jedi Order', holder: 'Satele Shan', fromBby: 3651, toBby: 3636, dependsOn: ['O.grand_master_set'], source: 'D-283 amended' },
  { office: 'Mandalore', holder: 'Mandalore the Lesser (backed by Imperial Intelligence)', fromBby: 3667, toBby: 3660, endsWith: 'O.new_mandalore', source: `${S1} (3,667, 3,660); D-382 [1], [4]` },
  { office: 'Mandalore', holder: 'Mandalore the Vindicated (Artus Lok)', fromBby: 3660, toBby: 3636, dependsOn: ['O.new_mandalore'], source: `${S1} (3,660); ${S2} (3,636–3,630)` },
];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const mentions = (text: string, name: string): boolean => new RegExp(`(^| )${norm(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(norm(text));

/** Whether a place (with its aliases) is among these names, by whole words. */
export function placeAmong(place: string, aliases: readonly string[], placeNames: readonly string[]): boolean {
  return placeNames.some((p) => [place, ...aliases].some((n) => mentions(p, n)));
}

/** The control spans at `bby` for any of these place names (a location and its ancestors), in table order. */
export function controlAt(placeNames: readonly string[], bby: number): ControlSpan[] {
  return WORLD_CONTROL.filter((c) => bby <= c.fromBby && bby >= c.toBby && placeAmong(c.place, c.aliases ?? [], placeNames));
}

/** The leaders in office at `bby`. */
export function leadersAt(bby: number): LeaderSpan[] {
  return FACTION_LEADERS.filter((l) => bby <= l.fromBby && bby >= l.toBby);
}
