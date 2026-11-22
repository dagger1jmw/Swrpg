// The works of the Old Republic era with their in-universe dates (date-agnostic refactor, D-415; brief §3). Anchors are
// set from a work: a figure's age at a source is the work's year minus the birth year. Dates come from the lore files:
// each work's year is the year the timeline slice (SW_Timeline_3700_3600BBY_Part1-2) or the character files give for the
// events it shows, cited in `dateSource`. A work whose date the lore files don't settle is marked `dated: false`, for the
// lore chat or the research bot. Years are BBY as positive numbers, both ends inclusive. All of these are Legends
// (SWTOR and its tie-ins, including KOTFE and KOTET; CLAUDE.md).

export type WorkKind = 'novel' | 'comic' | 'game' | 'classStory' | 'flashpoint' | 'cinematic' | 'reference';

export interface Work {
  id: string;
  title: string;
  kind: WorkKind;
  fromBby: number;
  toBby: number;
  /** False when the lore files don't settle the in-universe date (the years are then a placeholder). */
  dated: boolean;
  /** Where the date comes from (the lore event it shows). */
  dateSource: string;
}

const S1 = 'Timeline slice Part 1';
const S2 = 'Timeline slice Part 2';

export const WORKS: readonly Work[] = [
  // Cinematics.
  { id: 'return', title: 'Return', kind: 'cinematic', fromBby: 3681, toBby: 3681, dated: true, dateSource: `${S1} (3,681: the attack on the Korriban station; Darach dies, Satele and Malcom escape)` },
  { id: 'hope', title: 'Hope', kind: 'cinematic', fromBby: 3667, toBby: 3667, dated: true, dateSource: `${S1} (3,667: the Battle of Alderaan; Malcom fights Malgus)` },
  { id: 'deceived-cinematic', title: 'Deceived', kind: 'cinematic', fromBby: 3653, toBby: 3653, dated: true, dateSource: `${S1} (3,653: the Sacking of Coruscant; Malgus kills Ven Zallow in the Temple)` },
  // Novels.
  { id: 'deceived', title: 'Deceived', kind: 'novel', fromBby: 3653, toBby: 3653, dated: true, dateSource: `${S1} (3,653: the Sacking and the Treaty); Aryn Leneer a Knight in it (brief §4)` },
  { id: 'fatal-alliance', title: 'Fatal Alliance', kind: 'novel', fromBby: 3643, toBby: 3643, dated: true, dateSource: `${S2} (3,643: the Sebaddon affair and the Hex droid crisis, Lema Xandret's droids auctioned)` },
  { id: 'revan', title: 'Revan', kind: 'novel', fromBby: 3954, toBby: 3950, dated: false, dateSource: 'before this era (Revan\'s capture, 3,950 on the roster); its exact span is not in the era files' },
  { id: 'annihilation', title: 'Annihilation', kind: 'novel', fromBby: 3640, toBby: 3640, dated: true, dateSource: 'SW_Characters_09 (Darth Karrid dies over Duro, 3,640); Theron Shan\'s novel' },
  // Comics.
  { id: 'threat-of-peace', title: 'Threat of Peace', kind: 'comic', fromBby: 3653, toBby: 3653, dated: false, dateSource: 'the Treaty and the peace that follows (3,653; Zym\'s death is cited to Act 1); its end year is not in the era files' },
  { id: 'blood-of-the-empire', title: 'Blood of the Empire', kind: 'comic', fromBby: 3678, toBby: 3678, dated: true, dateSource: 'SW_Characters_09 (the 3,678 Blood of the Empire webcomic: Teneb Kel and Exal Kressh)' },
  { id: 'the-lost-suns', title: 'The Lost Suns', kind: 'comic', fromBby: 3643, toBby: 3643, dated: false, dateSource: 'Theron Shan in the Vesla system, where Ngani Zho dies c. 3,643 (SW_Characters_09); the files cite issue 1 for Satele\'s youth but give no year for the series' },
  // The game: the class stories and flashpoints of SWTOR (3,643 on), and its expansions.
  { id: 'swtor', title: 'Star Wars: The Old Republic', kind: 'game', fromBby: 3643, toBby: 3637, dated: true, dateSource: `${S2} (3,643: the Desolator crisis and the class stories' Chapter 1; to 3,637: the Emperor's host destroyed)` },
  { id: 'swtor-jedi-knight', title: 'SWTOR: the Jedi Knight story', kind: 'classStory', fromBby: 3643, toBby: 3640, dated: true, dateSource: `${S2} (3,643: Angral dies above Tython; the Hero of Tython)` },
  { id: 'swtor-jedi-consular', title: 'SWTOR: the Jedi Consular story', kind: 'classStory', fromBby: 3643, toBby: 3640, dated: true, dateSource: 'SW_Characters_09 (the Barsen\'thor; Yuon Par and Syo Bakarn meet a young Padawan in 3,643)' },
  { id: 'swtor-sith-warrior', title: 'SWTOR: the Sith Warrior story', kind: 'classStory', fromBby: 3643, toBby: 3640, dated: true, dateSource: 'SW_Characters_09 (Overseer Tremel dies on Korriban in 3,643; the Wrath)' },
  { id: 'swtor-sith-inquisitor', title: 'SWTOR: the Sith Inquisitor story', kind: 'classStory', fromBby: 3643, toBby: 3640, dated: true, dateSource: 'SW_Characters_09 (Harkun gathers Zash\'s class c. 3,643; Darth Nox)' },
  { id: 'swtor-smuggler', title: 'SWTOR: the Smuggler story', kind: 'classStory', fromBby: 3643, toBby: 3640, dated: true, dateSource: 'SW_Characters_09 (the Voidhound on Ord Mantell; Skavak)' },
  { id: 'swtor-trooper', title: 'SWTOR: the Trooper story', kind: 'classStory', fromBby: 3643, toBby: 3640, dated: true, dateSource: 'SW_Characters_09 (Havoc Squad\'s defection c. 3,643; Meteor)' },
  { id: 'swtor-bounty-hunter', title: 'SWTOR: the Bounty Hunter story', kind: 'classStory', fromBby: 3643, toBby: 3640, dated: true, dateSource: 'SW_Characters_09 (Nem\'ro sponsors Braden\'s protégé in 3,643; the Great Hunt)' },
  { id: 'swtor-imperial-agent', title: 'SWTOR: the Imperial Agent story', kind: 'classStory', fromBby: 3643, toBby: 3640, dated: true, dateSource: 'SW_Characters_09 (Cipher Nine; Ula Vii poses as Stantorrs\'s aide c. 3,643)' },
  { id: 'flashpoint-maelstrom-prison', title: 'SWTOR: Maelstrom Prison', kind: 'flashpoint', fromBby: 3642, toBby: 3642, dated: true, dateSource: `${S2} (3,642: a Republic strike team frees Revan from the Maelstrom Prison; Oteg leads the attack)` },
  { id: 'flashpoint-foundry', title: 'SWTOR: The Foundry', kind: 'flashpoint', fromBby: 3642, toBby: 3642, dated: true, dateSource: `${S2} (3,642: Revan's use of the Foundry stopped)` },
  { id: 'swtor-battle-of-ilum', title: 'SWTOR: the Battle of Ilum', kind: 'game', fromBby: 3640, toBby: 3640, dated: true, dateSource: `${S2} (3,640: the Battle of Ilum; Rans captured and rescued; Kaedan killed)` },
  { id: 'swtor-rise-of-the-hutt-cartel', title: 'SWTOR: Rise of the Hutt Cartel', kind: 'game', fromBby: 3639, toBby: 3639, dated: false, dateSource: 'Makeb; not dated in the era files' },
  { id: 'swtor-shadow-of-revan', title: 'SWTOR: Shadow of Revan', kind: 'game', fromBby: 3637, toBby: 3637, dated: true, dateSource: 'the roster (Revan dies again on Yavin 4 in 3,637)' },
  { id: 'swtor-kotfe', title: 'SWTOR: Knights of the Fallen Empire', kind: 'game', fromBby: 3636, toBby: 3631, dated: true, dateSource: `${S2} (3,636-3,630: the Eternal Empire's conquest)` },
  { id: 'swtor-kotet', title: 'SWTOR: Knights of the Eternal Throne', kind: 'game', fromBby: 3631, toBby: 3630, dated: true, dateSource: `${S2} (3,630: the Battle of Zakuul; Vitiate dies for the last time)` },
  { id: 'swtor-onslaught', title: 'SWTOR: Onslaught', kind: 'game', fromBby: 3628, toBby: 3626, dated: true, dateSource: `${S2} (3,628: Malgus returns at Ossus; to 3,626)` },
  { id: 'swtor-legacy-of-the-sith', title: 'SWTOR: Legacy of the Sith', kind: 'game', fromBby: 3625, toBby: 3622, dated: true, dateSource: `${S2} (3,624-c. 3,622: the Hidden Chain crisis)` },
  { id: 'tor-encyclopedia', title: 'The Old Republic Encyclopedia', kind: 'reference', fromBby: 3681, toBby: 3637, dated: false, dateSource: 'a reference work covering the whole era' },
];

export const WORK_BY_ID: ReadonlyMap<string, Work> = new Map(WORKS.map((w) => [w.id, w]));

/**
 * Which works a hand-set figure appears in, and what each shows (brief §3 step 2). `gaps` lists what the era files
 * don't settle, for the lore chat or the research bot (each figure's Wookieepedia appearances list).
 */
export interface Appearance {
  canonId: string;
  works: readonly { work: string; shows: string }[];
  gaps: readonly string[];
}

export const APPEARANCES: readonly Appearance[] = [
  { canonId: 'lore:satele-shan', works: [{ work: 'return', shows: 'a Padawan at Korriban, escaping with Malcom (saber work, Force push)' }, { work: 'hope', shows: 'a Knight at Alderaan beside Malcom (saber work, telekinesis)' }, { work: 'fatal-alliance', shows: 'a Master: strong telekinesis, tutaminis, a Force crush, foresight' }, { work: 'swtor', shows: 'Grand Master: the hand-set Galactic War sheet (3,643)' }], gaps: ['her Knight and Master years between Hope (3,667) and Fatal Alliance (3,643) have no work'] },
  { canonId: 'lore:jace-malcom', works: [{ work: 'return', shows: 'a soldier at Korriban' }, { work: 'hope', shows: 'a soldier at Alderaan fighting Malgus (blaster, tactics)' }, { work: 'swtor', shows: 'Supreme Commander from 3,640 (the hand-set sheet, 3,643)' }], gaps: ['no work shows him between 3,667 and 3,643'] },
  { canonId: 'lore:darth-malgus', works: [{ work: 'return', shows: 'Vindican\'s apprentice at Korriban' }, { work: 'hope', shows: 'a Sith Lord at Alderaan (Juyo, Force lightning)' }, { work: 'deceived', shows: 'a Darth: the Temple duel with Zallow, Force choke, lightning (the sheet, 3,653)' }, { work: 'deceived-cinematic', shows: 'the Temple assault' }, { work: 'swtor-onslaught', shows: 'his return at Ossus' }], gaps: [] },
  { canonId: 'lore:ven-zallow', works: [{ work: 'deceived-cinematic', shows: 'a Jedi Master duelling Malgus in the Temple (saber work, Force push)' }, { work: 'deceived', shows: 'his death and Aryn Leneer\'s grief' }], gaps: ['the Rim Campaign and Serenno (c. 3,660) have no work; his sheet year (3,655) rests on the 3,653 duel'] },
  { canonId: 'lore:zym', works: [{ work: 'threat-of-peace', shows: 'Grand Master at the Treaty; his death (Act 1)' }], gaps: ['no work shows him fighting; the sheet (3,660) is a Grand Master estimate', 'Threat of Peace has no settled year range in the era files'] },
  { canonId: 'lore:ngani-zho', works: [{ work: 'the-lost-suns', shows: 'Satele\'s first master (flashback, issue 1); his death in the Vesla system c. 3,643' }], gaps: ['no work shows his Force or saber use in detail; The Lost Suns is undated in the era files'] },
  { canonId: 'lore:darth-angral', works: [{ work: 'swtor-jedi-knight', shows: 'the Desolator crisis; killed above Tython (3,643; the sheet)' }, { work: 'threat-of-peace', shows: 'the Sacking fleet and Berooken\'s death (3,653)' }], gaps: [] },
  { canonId: 'lore:rans', works: [{ work: 'threat-of-peace', shows: 'Supreme Commander, outplayed by the Sith plan for the Sacking' }, { work: 'swtor-battle-of-ilum', shows: 'captured and rescued at Ilum, then retired' }], gaps: ['no stat line on record: the D-415 draft was rejected pending the stat scale (D-421); the generator builds the line', 'D-421: Supreme Commander on record at the Sacking (3,653) and after Stantorrs (3,642-3,640); the inferred 3,681 start removed'] },
  { canonId: 'lore:karagga-the-unyielding', works: [{ work: 'swtor-smuggler', shows: 'Supreme Mogul on Nal Hutta (Hutta)' }, { work: 'swtor-bounty-hunter', shows: 'the Great Hunt on Hutta' }], gaps: ['no stat line on record: a hand-set line (D-421)', 'the Karagga\'s Palace operation is not in the era files'] },
  { canonId: 'lore:spindrall', works: [{ work: 'swtor-sith-warrior', shows: 'the hermit prophet in Ajunta Pall\'s tomb testing acolytes (3,643)' }, { work: 'swtor-sith-inquisitor', shows: 'the same tests for Zash\'s class' }], gaps: ['no stat line on record: the D-415 draft was rejected pending the stat scale (D-421); the generator builds the line', 'no work shows him fight'] },
  { canonId: 'lore:tremel', works: [{ work: 'swtor-sith-warrior', shows: 'the Overseer who sponsors the future Wrath; dies in 3,643' }], gaps: ['no stat line on record: the D-415 draft was rejected pending the stat scale (D-421); the generator builds the line'] },
  { canonId: 'lore:oteg', works: [{ work: 'flashpoint-maelstrom-prison', shows: 'Fleet Admiral leading the attack on Maelstrom Prison (3,642)' }], gaps: ['no stat line on record: a hand-set line (D-421)'] },
  { canonId: 'lore:shol-bestros', works: [{ work: 'swtor-jedi-knight', shows: 'a High Council member on Tython' }], gaps: ['no stat line on record: the D-415 draft was rejected pending the stat scale (D-421); the generator builds the line'] },
  { canonId: 'lore:jerbhen-hulis', works: [{ work: 'blood-of-the-empire', shows: 'hunting Exal Kressh aboard the Grace of Champalan Tides (3,678)' }, { work: 'swtor-jedi-knight', shows: 'a Master in the Cold War' }], gaps: ['no stat line on record: the D-415 draft was rejected pending the stat scale (D-421); the generator builds the line'] },
  { canonId: 'lore:jaric-kaedan', works: [{ work: 'swtor', shows: 'High Council after the Treaty' }, { work: 'swtor-battle-of-ilum', shows: 'killed at Ilum (3,640)' }], gaps: ['the strike that captured the Dread Masters (3,668, his sheet year) has no work in the era files'] },
];
