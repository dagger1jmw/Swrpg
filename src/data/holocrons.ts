// Named holocrons (D-441; SW_Holocrons.md, the catalog). One dated list (D-438): the game resolves which holocrons
// exist at the campaign's start year and who holds them. Years are calendar years (negative = BBY, positive = ABY).
//
// How the file's wording becomes a year (firstAppearance, statusEvents), always the latest year the wording guarantees,
// so a holocron is never offered before it surely exists:
// - "c. X", "X": X. "Before X", "By X", "In or before X", "Thousands of years before X", "Centuries before X": X.
// - "After X": X (the only bound given). A range "X-Y": Y. "More than X BBY": X.
// - Era names: the Golden Age of the Sith c. 5100 BBY; the Mandalorian Wars 3976; the Great Galactic War 3681; the Cold
//   War 3653-3641 (by its start for "by the Cold War", by its end for "before ... (Cold War)"); the Galactic War to 3636;
//   the Clone Wars 22-19 (19 for "Clone Wars", 22 for "before the Clone Wars"); the Great Jedi Purge from 19 BBY; the
//   New Republic era from 5 ABY [inferred]; after the Yuuzhan Vong War 29 ABY.
// - "(found)" or "(discovered)": the find year (the holocron is on record from then).
// Undated rows (the file's last block) have firstAppearance null and are excluded by default (pending Jared's ruling,
// SW_Holocrons decision 1). `dated` keeps the file's own wording.

export type HolocronSide = 'J' | 'S' | 'O';

export interface HolocronStatusEvent {
  year: number;
  /** The holder or location from this year on. */
  holder: string;
  destroyed?: true;
  /** How the year was read when the file gives no number. */
  note?: string;
}

export interface Holocron {
  id: string;
  name: string;
  side: HolocronSide;
  /** Calendar year it is first on record (creation, else the earliest dated mention); null = undated. */
  firstAppearance: number | null;
  /** The file's wording for the first appearance. */
  dated: string;
  /** Dated holder, location and destruction changes, in year order. */
  statusEvents: readonly HolocronStatusEvent[];
  notes: string;
  source: string;
}

const W = 'https://starwars.fandom.com/wiki/';

export const HOLOCRONS: readonly Holocron[] = [
  { id: 'king-adas', name: 'Holocron of King Adas', side: 'S', firstAppearance: -27700, dated: 'c. 27,700 BBY', statusEvents: [{ year: -27700, holder: 'King Adas, its maker' }], notes: 'The original Sith holocron, made with Rakatan knowledge.', source: `${W}Holocron_of_King_Adas` },
  { id: 'anang', name: "Holocron of A'nang", side: 'O', firstAppearance: -25800, dated: "Je'daii era (c. 25,800 BBY) [inferred]", statusEvents: [{ year: -25800, holder: "a Je'daii relic beneath the Kaleth library, Tython" }], notes: "Double pyramid shaped like a golden Tho Yor; holds the presence of A'nang, last of the Tythonian Kwa.", source: `${W}Holocron_of_A%27nang` },
  { id: 'daegen-lok', name: 'Holocron of Daegen Lok', side: 'J', firstAppearance: -25792, dated: 'c. 25,792 BBY', statusEvents: [{ year: -25792, holder: "the Je'daii Order" }], notes: "The Master General's record before the attack on Ska Gora.", source: `${W}Holocron_of_Daegen_Lok` },
  { id: 'rajivari', name: "Master Rajivari's holocron", side: 'J', firstAppearance: -25783, dated: 'Before 25,783 BBY', statusEvents: [{ year: -25783, holder: 'Tython' }, { year: -3643, holder: "found by the Twi'lek colonist Nalen Raloch, who fell to the dark side; recovered by a Jedi" }], notes: 'The Fount of Rajivari.', source: `${W}Master_Rajivari%27s_holocron` },
  { id: 'king-nakgru', name: 'Holocron of King Nakgru', side: 'S', firstAppearance: -16899, dated: 'Before 16,899 BBY', statusEvents: [{ year: -16899, holder: 'the Sanctum of Sakkra-Kla, Korriban' }, { year: -6899, holder: 'Sorzus Syn, who found it' }], notes: '', source: `${W}Holocron_of_King_Nakgru` },
  { id: 'ductavis', name: 'Ductavis Holocron', side: 'J', firstAppearance: -11933, dated: 'After the Pius Dea crusades (after 11,933 BBY) [inferred]', statusEvents: [{ year: -11933, holder: "stored on Ossus after Biel Ductavis's death", note: 'the year of the first-appearance bound' }, { year: -3996, holder: 'lost in the Ossus evacuation (whereabouts unknown)' }], notes: 'Ancient Republic history.', source: `${W}Ductavis_Holocron` },
  { id: 'dathka-graush', name: "Dathka Graush's holocron", side: 'S', firstAppearance: -7000, dated: 'c. 7000 BBY', statusEvents: [{ year: -7000, holder: 'his tomb on Korriban, with his Sith sword' }], notes: 'Sith alchemist.', source: `${W}Dathka_Graush%27s_holocron` },
  { id: 'syn', name: 'Syn Holocron', side: 'S', firstAppearance: -6900, dated: "c. 6900 BBY onward (Sorzus Syn's late life) [inferred]", statusEvents: [{ year: -6900, holder: 'Sorzus Syn' }, { year: -1000, holder: 'back with the Sith (held by the Order of the Sith Lords); the Jedi hold a fake', note: "Bane's time, c. 1000 BBY" }], notes: '', source: `${W}Syn_Holocron` },
  { id: 'xoxaan', name: "XoXaan's holocron", side: 'S', firstAppearance: -6900, dated: 'After the Hundred-Year Darkness (c. 6900 BBY) [inferred]', statusEvents: [{ year: -6900, holder: 'lost in the Korriban tombs' }, { year: -19, holder: "A'Sharad Hett, who found it", note: 'the Great Jedi Purge era, from 19 BBY' }], notes: '', source: `${W}XoXaan%27s_holocron` },
  { id: 'telos', name: 'Telos Holocron', side: 'S', firstAppearance: -5100, dated: 'Before the Golden Age of the Sith', statusEvents: [{ year: -5100, holder: 'passed down through generations of Sith Lords, several of whom became its gatekeepers' }, { year: 40, holder: 'discovered' }], notes: 'Unusual design.', source: `${W}Telos_Holocron` },
  { id: 'dramath', name: "Dramath's holocron", side: 'S', firstAppearance: -5103, dated: '5103 BBY', statusEvents: [{ year: -5103, holder: "Tenebrae's (Vitiate's) vault under the Sanitarium, Nathema" }, { year: -3630, holder: 'found by Lana Beniko and the Alliance Commander' }], notes: "A prison for Dramath's spirit.", source: `${W}Dramath%27s_holocron` },
  { id: 'naga-sadow', name: 'Holocron of Naga Sadow', side: 'S', firstAppearance: -5000, dated: 'In or before 5000 BBY', statusEvents: [{ year: -5000, holder: 'a Sith library; later recovered by the Jedi (no date on record)' }], notes: "Sith alchemy; the Sith species' history.", source: `${W}Holocron_of_Naga_Sadow` },
  { id: 'dark-holocron', name: 'Dark Holocron', side: 'S', firstAppearance: -5000, dated: 'c. 5000 BBY (recovered)', statusEvents: [{ year: -5000, holder: 'Odan-Urr (studied by Vodo-Siosk Baas)' }, { year: -3996, holder: 'Exar Kun, who stole it' }], notes: 'The first Sith holocron in Jedi hands; lore from c. 100,000 BBY.', source: `${W}Dark_Holocron` },
  { id: 'dramath-ii-datacron', name: "Dramath the Second's datacron", side: 'S', firstAppearance: -5000, dated: 'c. 5000 BBY', statusEvents: [{ year: -5000, holder: 'his sarcophagus on Rekkiad' }], notes: 'His life story.', source: `${W}Dramath_the_Second%27s_datacron` },
  { id: 'elcho-kressh', name: "Elcho Kressh's holocron", side: 'S', firstAppearance: -5000, dated: 'Great Hyperspace War (c. 5000 BBY)', statusEvents: [{ year: -5000, holder: 'unknown; found by Mandragall in the Republic Dark Age (no year on record)' }], notes: 'Army-building through mercenary and pirate alliances.', source: `${W}Elcho_Kressh%27s_holocron` },
  { id: 'bo-vanda', name: "Bo Vanda's holocron", side: 'S', firstAppearance: -5000, dated: 'Old Sith Empire (by c. 5000 BBY)', statusEvents: [], notes: "Gatekeeper the Sith Lord Kla; holds Komok-Da's spirit; Sith alchemy.", source: `${W}Bo_Vanda%27s_holocron` },
  { id: 'tascollan-nebula', name: 'Sith holocron (Tascollan Nebula)', side: 'S', firstAppearance: -5000, dated: 'Great Hyperspace War (c. 5000 BBY)', statusEvents: [{ year: 7, holder: 'Valik Kodank, in the Temple of Pain', note: 'examined c. 7 ABY; when he took it is not on record' }], notes: '', source: `${W}Sith_holocron_(Tascollan_Nebula)` },
  { id: 'darth-drear', name: "Darth Drear's holocron", side: 'S', firstAppearance: -4645, dated: 'c. 4645 BBY', statusEvents: [{ year: -4645, holder: 'Darth Drear' }, { year: -3645, holder: 'rediscovered by Darth Scabrous on Odacer-Faustin; presumably destroyed', destroyed: true, note: 'the rediscovery is undated; the presumed destruction is 3645 BBY' }], notes: 'Immortality ritual.', source: `${W}Darth_Drear%27s_holocron` },
  { id: 'keleth-ur', name: "Kel'eth Ur's holocron", side: 'S', firstAppearance: -4606, dated: 'Before 4606 BBY', statusEvents: [], notes: 'Made before his death; his knowledge and personality.', source: `${W}Kel%27eth_Ur%27s_holocron` },
  { id: 'freedon-nadd', name: "Freedon Nadd's holocron", side: 'S', firstAppearance: -4400, dated: 'After Nadd conquered Onderon (c. 4400 BBY) [inferred]', statusEvents: [{ year: -4400, holder: 'a locked room in his tomb on Dxun' }, { year: -1000, holder: 'Darth Bane, who found it' }], notes: 'Orbalisks, Sith sorcery.', source: `${W}Freedon_Nadd%27s_holocron` },
  { id: 'tedryn', name: "Tedryn Holocron (Bodo Baas's)", side: 'J', firstAppearance: -4000, dated: 'More than 4000 BBY', statusEvents: [{ year: 11, holder: 'destroyed', destroyed: true }], notes: 'Gatekeeper Bodo Baas.', source: `${W}Tedryn_Holocron` },
  { id: 'arca-jeth', name: "Arca Jeth's holocron", side: 'J', firstAppearance: -3999, dated: 'Thousands of years before 3999 BBY', statusEvents: [{ year: -3999, holder: 'made by Ood Bnar and passed down to Arca Jeth, who lent it to Master Thon; later lost on Arkania (no year on record)' }, { year: 5, holder: 'Tionne Solusar', note: 'the New Republic era [inferred]' }], notes: '', source: `${W}Arca_Jeth%27s_holocron` },
  { id: 'noetikons', name: 'Noetikons', side: 'J', firstAppearance: -4000, dated: "Arca Jeth's lifetime (c. 4000 BBY) [inferred]", statusEvents: [{ year: -4000, holder: 'Jedi relics' }], notes: 'Archive-search holocrons (designed by Tharis Orne, built by Arca Jeth).', source: `${W}Noetikon` },
  { id: 'odan-urr', name: 'Holocron of Odan-Urr', side: 'J', firstAppearance: -3996, dated: 'Before 3996 BBY', statusEvents: [{ year: -3996, holder: 'lost' }, { year: -3643, holder: 'Yuon Par, who found it', note: 'found before 3643 BBY' }, { year: -3628, holder: 'the Great Jedi Library, Ossus (endangered by the invasion)' }], notes: 'His teachings.', source: `${W}Holocron_of_Odan-Urr` },
  { id: 'exar-kun', name: 'Holocron of Exar Kun', side: 'S', firstAppearance: -3996, dated: 'By 3996 BBY [inferred]', statusEvents: [], notes: 'Force ghosts.', source: `${W}Holocron_of_Exar_Kun` },
  { id: 'qalsneek', name: "Qalsneek's holocron", side: 'J', firstAppearance: -3996, dated: 'By 3996 BBY [inferred]', statusEvents: [{ year: -3996, holder: 'moved from Ossus to the Derem City library on Kamino after the Cron supernova' }], notes: 'Sea-crystal.', source: `${W}Qalsneek%27s_holocron` },
  { id: 'asli-krimsan', name: "Asli Krimsan's holocron", side: 'J', firstAppearance: -3996, dated: 'After 3996 BBY', statusEvents: [{ year: -3996, holder: 'the Exis Station library, Teedio system; later the Coruscant Temple, where more lessons were added (no year on record)' }, { year: 22, holder: 'discovered' }], notes: '', source: `${W}Asli_Krimsan%27s_holocron` },
  { id: 'carbonite-sith-army', name: 'Carbonite Sith Army holocron', side: 'S', firstAppearance: -4000, dated: 'c. 4000 years before the Galactic Civil War [inferred]', statusEvents: [{ year: 0, holder: 'Jabba; stolen by Tyber Zann', note: 'the Galactic Civil War' }], notes: 'Star charts.', source: `${W}Carbonite_Sith_Army_holocron` },
  { id: 'darth-vitus', name: "Darth Vitus's holocron", side: 'S', firstAppearance: -3976, dated: 'By the Mandalorian Wars (3976 BBY) [inferred]', statusEvents: [], notes: 'Records Vitus and his Oricon compound.', source: `${W}Darth_Vitus%27s_holocron` },
  { id: 'tulak-hord-combat', name: "Tulak Hord's holocron (lightsaber combat)", side: 'S', firstAppearance: -3956, dated: 'By 3956 BBY', statusEvents: [{ year: -3956, holder: 'recovered from Hord\'s tomb on Korriban by Revan and Lashowe' }], notes: "Hord's lightsaber technique.", source: `${W}Tulak_Hord%27s_holocron` },
  { id: 'tulak-hord-ragnos', name: "Tulak Hord's holocron (Tomb of Marka Ragnos)", side: 'S', firstAppearance: -4643, dated: 'Over a millennium before its recovery', statusEvents: [{ year: -4643, holder: 'the Tomb of Marka Ragnos, Korriban', note: 'a millennium before the recovery of c. 3643 BBY' }, { year: -3643, holder: 'a former slave of the reconstituted Empire, who recovered it', note: 'the Sith Inquisitor story, Cold War' }], notes: '', source: `${W}Tulak_Hord%27s_holocron_(Tomb_of_Marka_Ragnos)` },
  { id: 'darth-revan', name: "Darth Revan's Sith Holocron", side: 'S', firstAppearance: -3957, dated: '3959–3957 BBY', statusEvents: [{ year: -3957, holder: 'the Temple of the Ancients, Lehon' }, { year: -1000, holder: 'found and destroyed by Darth Bane', destroyed: true }], notes: "Revan's teachings and Sith rituals.", source: `${W}Darth_Revan%27s_Sith_Holocron` },
  { id: 'mical', name: "Mical's holocron", side: 'J', firstAppearance: -3951, dated: 'After 3951 BBY', statusEvents: [{ year: -3642, holder: 'discovered', note: 'discovered 3653-3642 BBY' }], notes: '', source: `${W}Mical%27s_holocron` },
  { id: 'darth-nihilus', name: "Darth Nihilus's holocron", side: 'S', firstAppearance: -3951, dated: 'By 3951 BBY [inferred]', statusEvents: [{ year: -3643, holder: 'the Lightspring, Tatooine, contested by Vaverone Zare and Nariel Pridence', note: 'discovered before 3643 BBY (Cold War)' }, { year: 137, holder: 'Darth Krayt' }], notes: '', source: `${W}Darth_Nihilus%27_holocron` },
  { id: 'qel-droma', name: 'Qel-Droma Holocron', side: 'O', firstAppearance: -3681, dated: 'By the Great Galactic War', statusEvents: [{ year: -3681, holder: 'studied by Darth Malgus' }], notes: 'The Dark Reaper.', source: `${W}Qel-Droma_Holocron` },
  { id: 'darth-angral', name: "Darth Angral's holocron", side: 'S', firstAppearance: -3641, dated: "Before Angral's death (Cold War)", statusEvents: [{ year: -3641, holder: 'recovered on Taris by Darth Nox; shown to Ashara Zavros' }], notes: '', source: `${W}Darth_Angral%27s_holocron` },
  { id: 'master-satele', name: "Master Satele's holocron", side: 'J', firstAppearance: -3636, dated: 'Cold War or Galactic War', statusEvents: [{ year: -3636, holder: "Satele Shan; sent to the Hero of Tython after the Emperor's defeat" }], notes: 'Two octahedrons and a ring.', source: `${W}Master_Satele%27s_holocron` },
  { id: 'shining-man-vitalicron', name: "Shining Man's vitalicron", side: 'O', firstAppearance: -3653, dated: 'By the Cold War', statusEvents: [{ year: -3653, holder: 'the Wellspring of the Shrine of Healing, Voss; recovered by Cipher Nine' }], notes: 'Voss vitalicron.', source: `${W}Shining_Man%27s_vitalicron` },
  { id: 'third-barsenthor', name: "Third Barsen'thor's holocron", side: 'J', firstAppearance: -3637, dated: 'c. 3637 BBY', statusEvents: [{ year: -3637, holder: "made on Rishi with Master Kutri O'a" }], notes: "All the Barsen'thor's knowledge.", source: `${W}Third_Barsen%27thor%27s_holocron` },
  { id: 'darth-nul', name: "Darth Nul's holocron", side: 'S', firstAppearance: -3625, dated: 'c. 3625 BBY (discovered)', statusEvents: [], notes: 'All the secrets of the maker of the Children of the Emperor.', source: `${W}Darth_Nul%27s_holocron` },
  { id: 'kruskan', name: 'Sith holocron (Kruskan)', side: 'S', firstAppearance: -3000, dated: 'By 3000 BBY', statusEvents: [{ year: -3000, holder: "hidden on Kruskan; found by Regera Girawn's servants, when it exploded (no year on record)" }], notes: "Its explosion woke Girawn's Force abilities.", source: `${W}Sith_holocron_(Kruskan)` },
  { id: 'belia-darzu', name: 'Holocron of Belia Darzu', side: 'S', firstAppearance: -1230, dated: 'Before 1230 BBY', statusEvents: [{ year: -1230, holder: 'her stronghold on Tython' }, { year: -990, holder: 'found' }], notes: 'Alchemy, mechu-deru.', source: `${W}Holocron_of_Belia_Darzu` },
  { id: 'heresies', name: 'Holocron of Heresies', side: 'S', firstAppearance: -980, dated: 'Thousands of years before 980 BBY', statusEvents: [{ year: -980, holder: 'found; later Dooku (Tyranus), then Darth Krayt (no years on record)' }, { year: 137, holder: 'destroyed', destroyed: true }], notes: "Moving one's spirit into another body.", source: `${W}Holocron_of_Heresies` },
  { id: 'darth-bane', name: "Darth Bane's holocron", side: 'S', firstAppearance: -1000, dated: 'c. 1000 BBY [inferred]', statusEvents: [], notes: 'Possibly the only true holocron of the Rule of Two Sith.', source: `${W}Darth_Bane%27s_holocron` },
  { id: 'ceriun', name: 'Unidentified Jedi holocron (Ceriun)', side: 'J', firstAppearance: -1000, dated: 'By 1000 BBY', statusEvents: [{ year: -1000, holder: 'crashed with a Jedi on Ceriun; taken by a Sith (no year on record)' }], notes: 'A map.', source: `${W}Unidentified_Jedi_holocron_(Ceriun)` },
  { id: 'samuro', name: "Samuro's Jedi holocron", side: 'J', firstAppearance: -22, dated: 'Centuries before 22 BBY', statusEvents: [{ year: -22, holder: 'the droid Z-18; then Mace Windu' }], notes: 'How to destroy Countess Rajine.', source: `${W}Samuro%27s_Jedi_holocron` },
  { id: 'alaris-prime', name: 'Jedi holocron (Alaris Prime)', side: 'J', firstAppearance: -36, dated: '39–36 BBY (found)', statusEvents: [{ year: -36, holder: 'a Jedi temple built for it' }], notes: 'Nova crystals.', source: `${W}Jedi_holocron_(Alaris_Prime)` },
  { id: 'grand-republic-medical', name: 'Sith holocron (Grand Republic Medical Facility)', side: 'S', firstAppearance: -19, dated: 'By 19 BBY', statusEvents: [{ year: -19, holder: "moved from Korriban to Sidious's surgical centre on Coruscant" }], notes: '', source: `${W}Sith_holocron_(Grand_Republic_Medical_Facility)/Legends` },
  { id: 'quinlan-vos', name: "Quinlan Vos's holocron", side: 'J', firstAppearance: -19, dated: 'c. 19 BBY', statusEvents: [{ year: -19, holder: 'Quinlan Vos; then Khaleen Hentz' }], notes: 'Pyramid-shaped.', source: `${W}Quinlan_Vos%27s_holocron` },
  { id: 'yoda', name: "Yoda's holocron", side: 'J', firstAppearance: -19, dated: 'Before 19 BBY', statusEvents: [{ year: -19, holder: 'taken from the Coruscant Temple by Jax Pavan' }], notes: 'The Jedi Code.', source: `${W}Yoda%27s_holocron` },
  { id: 'master-sirrus', name: "Master Sirrus's holocron", side: 'J', firstAppearance: -19, dated: 'Clone Wars', statusEvents: [{ year: -19, holder: 'Sirrus' }], notes: '', source: `${W}Master_Sirrus%27s_holocron` },
  { id: 'suljo-warde', name: 'Holocron of Suljo Warde', side: 'J', firstAppearance: -19, dated: 'Clone Wars', statusEvents: [{ year: -19, holder: 'its kyber crystals split up near the end of the war', destroyed: true, note: 'split up, not intact after the Clone Wars' }], notes: '', source: `${W}Holocron_of_Suljo_Warde` },
  { id: 'dawn-temple', name: "Curator's, Jailor's and Warden's holocrons", side: 'J', firstAppearance: -19, dated: 'Clone Wars era', statusEvents: [{ year: -19, holder: "the Dawn Temple, Spintir; only the Warden survived the Temple's ruin (no year on record)" }], notes: 'Gatekeepers running a sanctuary for Jedi who had lost their way.', source: `${W}Dawn_Temple` },
  { id: 'umbara', name: 'Sith holocron (Umbara)', side: 'S', firstAppearance: -19, dated: 'Clone Wars', statusEvents: [{ year: -19, holder: 'the Dark Acolytes, Umbara Sith Academy' }], notes: 'A door key.', source: `${W}Unidentified_Sith_holocron_(Umbara)` },
  { id: 'sith-nova', name: 'Sith Nova Holocron', side: 'S', firstAppearance: -19, dated: 'Clone Wars', statusEvents: [{ year: -19, holder: 'split between Tatooine, Christophsis and Rodia' }], notes: 'Locating Padawans.', source: `${W}Sith_Nova_Holocron` },
  { id: 'geonosis', name: 'Unidentified holocron (Geonosis)', side: 'O', firstAppearance: -19, dated: 'Clone Wars', statusEvents: [{ year: -19, holder: 'recovered by a 501st jet trooper' }], notes: '', source: `${W}Unidentified_holocron` },
  { id: 'qornah', name: 'Qornah Holocron', side: 'J', firstAppearance: -22, dated: 'Before the Clone Wars [inferred]', statusEvents: [{ year: -22, holder: "hidden in Master Qornah's bust, Almas Academy" }], notes: '9 cubic cm.', source: `${W}Qornah_Holocron` },
  { id: 'codex-of-tython', name: 'Codex of Tython', side: 'J', firstAppearance: 1, dated: '1 ABY (discovered)', statusEvents: [], notes: 'Icosahedron; rumoured to hold the oldest Jedi secrets.', source: `${W}Codex_of_Tython` },
  { id: 'bail-organa', name: "Bail Organa's data holocron", side: 'O', firstAppearance: 0, dated: 'Before 0 BBY', statusEvents: [{ year: 0, holder: "survived Alderaan's destruction (phrik casing)" }], notes: 'Rebel base locations.', source: `${W}Bail_Organa%27s_data_holocron` },
  { id: 'mustafar', name: 'Mustafar Sith holocron', side: 'S', firstAppearance: 2, dated: 'c. 1.5 ABY (found)', statusEvents: [{ year: 2, holder: 'Mustafar' }], notes: '', source: `${W}Mustafar_Sith_holocron` },
  { id: 'x1', name: "X1's holocron", side: 'S', firstAppearance: 4, dated: 'After 4 ABY', statusEvents: [{ year: 4, holder: 'Bast Castle' }], notes: '', source: `${W}X1%27s_holocron` },
  { id: 'dray', name: "Dray's holocron", side: 'J', firstAppearance: 25, dated: 'c. 25 ABY', statusEvents: [{ year: 25, holder: 'bought on Nar Shaddaa' }], notes: 'Yuuzhan Vong infiltrators.', source: `${W}Dray%27s_holocron` },
  { id: 'darth-vectivus', name: 'Holocron of Darth Vectivus', side: 'S', firstAppearance: 40, dated: '40 ABY (discovered)', statusEvents: [{ year: 40, holder: 'passed from the Korriban Sith to Alema Rar' }], notes: 'Force phantoms; business information.', source: `${W}Holocron_of_Darth_Vectivus` },
  { id: 'luke-skywalker', name: 'Holocron of Luke Skywalker', side: 'J', firstAppearance: 44, dated: '44 ABY', statusEvents: [], notes: 'Abeloth; the Lost Tribe.', source: `${W}Holocron_of_Luke_Skywalker` },
  { id: 'sakuub', name: 'Sakuub Holocron', side: 'J', firstAppearance: 44, dated: '44 ABY (found)', statusEvents: [{ year: 44, holder: 'the Sky Temple of Karsol ruins' }], notes: 'Possibly on Abeloth.', source: `${W}Sakuub_Holocron` },
  { id: 'darth-vua', name: "Darth Vua's holocron", side: 'S', firstAppearance: 29, dated: 'After the Yuuzhan Vong War', statusEvents: [], notes: '', source: `${W}Darth_Vua%27s_holocron` },
  { id: 'darth-krayt', name: 'Holocron of Darth Krayt', side: 'S', firstAppearance: 130, dated: 'c. 130 ABY', statusEvents: [], notes: 'Incomplete.', source: `${W}Holocron_of_Darth_Krayt` },
  { id: 'eshkar-niin', name: "Eshkar Niin's holocron", side: 'O', firstAppearance: 137, dated: 'Before 137 ABY', statusEvents: [{ year: 137, holder: 'Antares Draco' }], notes: 'Imperial Knight.', source: `${W}Eshkar_Niin%27s_holocron` },
  // Undated (the file's last block): excluded by default, pending Jared's ruling (SW_Holocrons decision 1).
  { id: 'ergast', name: "Ergast's holocron", side: 'S', firstAppearance: null, dated: "Undated (Ergast's tomb)", statusEvents: [], notes: 'The Dark Temple, Dromund Kaas; used by Lord Kallig in the Cold War. Force-walking ritual.', source: `${W}Ergast%27s_holocron` },
  { id: 'mournful', name: 'Mournful Holocron', side: 'J', firstAppearance: null, dated: 'Early Jedi Order (undated)', statusEvents: [], notes: 'Force healing and bedside manner; opens only once its grieving gatekeeper is comforted.', source: `${W}Mournful_Holocron` },
  { id: 'dakshee', name: 'Dakshee Holocron', side: 'J', firstAppearance: null, dated: '"Old Republic period" (undated)', statusEvents: [], notes: 'Djinn Kylo (Galactic Civil War). Its hum aids focus and attunement.', source: `${W}Dakshee_Holocron` },
  { id: 'great-holocron', name: 'Great Holocron', side: 'J', firstAppearance: null, dated: 'Ancient (undated)', statusEvents: [], notes: 'Dodecahedral.', source: `${W}Great_Holocron/Legends` },
  { id: 'allya', name: "Allya's Holocron", side: 'J', firstAppearance: null, dated: 'Undated', statusEvents: [], notes: 'Allya founded the Witches of Dathomir.', source: `${W}Allya%27s_Holocron` },
  { id: 'sar-agorn', name: "Sar Agorn's holocron", side: 'J', firstAppearance: null, dated: 'Undated', statusEvents: [], notes: 'Jedi philosophy; a cautious gatekeeper.', source: `${W}Sar_Agorn%27s_holocron` },
  { id: 'allynic-ekles', name: "Allynic E'Kles's holocron", side: 'J', firstAppearance: null, dated: 'Undated', statusEvents: [], notes: 'Memnii for telepathic Jedi.', source: `${W}Allynic_E%27Kles%27s_holocron` },
  { id: 'tharence-wo', name: "Tharence Wo's holocron", side: 'J', firstAppearance: null, dated: 'Undated (before the Yinchorri Uprising, 33 BBY) [inferred]', statusEvents: [], notes: 'Rediscovered by the High Council. The Yinchorri.', source: `${W}Tharence_Wo%27s_holocron` },
  { id: 'darth-rivan', name: "Darth Rivan's holocron", side: 'S', firstAppearance: null, dated: "Undated (Rivan's reign)", statusEvents: [], notes: 'Valin Draco.', source: `${W}Darth_Rivan%27s_holocron` },
  { id: 'sd41263-i', name: 'SD41263.I', side: 'S', firstAppearance: null, dated: 'Undated (Darth Ramage)', statusEvents: [], notes: 'Hath Monchar. Pyronium and bota.', source: `${W}SD41263.I` },
  { id: 'eben-kinahay', name: "Eben Kinahay's Sith holocron", side: 'S', firstAppearance: null, dated: 'Undated', statusEvents: [], notes: 'Stolen near Ziost; his estate.', source: `${W}Eben_Kinahay%27s_Sith_holocron` },
  { id: 'fake-noetikon', name: 'Fake Noetikon of Secrets', side: 'S', firstAppearance: null, dated: 'Undated', statusEvents: [], notes: 'Lars Baddeg. Holds the Master of Questions.', source: `${W}Fake_Noetikon_of_Secrets` },
  { id: 'destiny', name: 'Holocron of Destiny', side: 'J', firstAppearance: null, dated: 'Undated', statusEvents: [], notes: "A training trial that decides the user's destiny.", source: `${W}Holocron_of_Destiny` },
  { id: 'kaerobani', name: "Kaerobani's holocron", side: 'J', firstAppearance: null, dated: 'Undated (New Republic theft)', statusEvents: [], notes: 'Kaerobani, Rathalay.', source: `${W}Kaerobani%27s_holocron` },
  { id: 'tionne', name: "Tionne's Holocron", side: 'J', firstAppearance: null, dated: 'Undated (New Jedi Order)', statusEvents: [], notes: 'Jedi Archives.', source: `${W}Tionne%27s_Holocron` },
];

/** A holocron as it stands in a year: its holder or location then (null when none is on record). */
export interface HolocronAtYear {
  id: string;
  name: string;
  side: HolocronSide;
  holder: string | null;
  notes: string;
  source: string;
}

/**
 * The holocrons that exist in `year` (D-441), for character creation: first on record in or before the year and not
 * destroyed by then, each with the holder or location of its latest status event at or before the year. Undated
 * entries are excluded unless `includeUndated` (pending Jared's ruling). Catalog order (by first appearance).
 */
export function holocronsAt(year: number, opts: { includeUndated?: boolean } = {}): HolocronAtYear[] {
  const out: HolocronAtYear[] = [];
  for (const h of HOLOCRONS) {
    if (h.firstAppearance === null ? !opts.includeUndated : h.firstAppearance > year) continue;
    const past = h.statusEvents.filter((e) => e.year <= year);
    if (past.some((e) => e.destroyed)) continue;
    const latest = past.length ? past.reduce((a, b) => (b.year >= a.year ? b : a)) : null;
    out.push({ id: h.id, name: h.name, side: h.side, holder: latest?.holder ?? null, notes: h.notes, source: h.source });
  }
  return out;
}

const SIDE_WORD: Readonly<Record<HolocronSide, string>> = { J: 'Jedi', S: 'Sith', O: 'other' };

/** One line per holocron for the narrator: "Name (Sith; holder)". */
export function holocronLine(h: HolocronAtYear): string {
  return `${h.name} (${SIDE_WORD[h.side]}${h.holder ? `; ${h.holder}` : '; whereabouts not on record'})`;
}
