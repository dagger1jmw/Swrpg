// Era rules the narrator can't read from the lore index (D-401 [8]): the topical lore files are not indexed (D-81), so
// their rulings for a year reach the narrator through this table, sent only when a rule's place is in the current
// location chain or its faction is in play (the character's side, or someone present). Years are BBY as positive
// numbers, both ends inclusive. Each rule is one or two short sentences, written as instructions.
import type { FactionId } from './entities.config';
import type { OutcomeLinks } from './worldControl';

/** A day of a year. */
export interface MonthDay {
  month: number;
  day: number;
}
/** The Treaty of Coruscant is signed (3,653) and collapses (mid-3,641): the world network's dates (worldNetwork3661.ts). */
export const TREATY_SIGNED: MonthDay = { month: 6, day: 23 };
export const TREATY_COLLAPSE: MonthDay = { month: 6, day: 15 };
/** The Senate's vote on the Temple (3,653), as the world network has it; the day is invented. */
export const TEMPLE_VOTE: MonthDay = { month: 7, day: 10 };
const BEFORE_VOTE: MonthDay = { month: 7, day: 9 };
const BEFORE_TREATY: MonthDay = { month: 6, day: 22 };
const BEFORE_COLLAPSE: MonthDay = { month: 6, day: 14 };

/**
 * Cold War rules follow the campaign, as the control table does (Jared, D-476): `dependsOn` and `endsWith` are the world
 * network's outcomes, and the rules of one `subject` freeze together (a rule that does not start leaves the one before it
 * in force). Absent: the lore's dates alone.
 */
export interface EraRule extends OutcomeLinks {
  id: string;
  subject?: string;
  fromBby: number;
  toBby: number;
  /** The first day in fromBby and the last in toBby, for a boundary inside a year (D-475); absent = the whole year. */
  fromDate?: MonthDay;
  toDate?: MonthDay;
  /** Sent when the current location chain names one of these places. */
  places?: readonly string[];
  /** Sent when one of these factions is in play. */
  factions?: readonly FactionId[];
  /** Sent every turn in its years (a rule about all places). */
  always?: boolean;
  text: string;
  source: string;
}

export const ERA_RULES: readonly EraRule[] = [
  {
    id: 'places-and-populations',
    fromBby: 3681,
    toBby: 3600,
    always: true,
    text: 'Places on record only from SWTOR-era works (c. 3,643–3,622) may be used, as unconfirmed in these years, unless they exist only because of a later event (the Taris resettlement, the Tython Temple, Mek-Sha); Coruscant keeps its strict rule. Give populations only as orders of magnitude, never an exact figure.',
    source: 'D-402 [11], [12]',
  },
  {
    id: 'odacer-faustin',
    fromBby: 3681,
    toBby: 3656,
    places: ['Odacer-Faustin'],
    text: 'Odacer-Faustin is Imperial space with no Sith academy named yet (its first dated student is in 3,655).',
    source: 'D-402 [9]',
  },
  {
    id: 'coruscant-shortage',
    fromBby: 3661,
    toBby: 3660,
    places: ['Coruscant'],
    text: 'Show shortages, soaring prices and volunteer enlistment. There is no formal rationing, no conscription and no standing curfew; short district lockdowns during riots may be narrated (invented).',
    source: 'D-380 [11]',
  },
  {
    id: 'coruscant-security',
    subject: 'coruscant-security',
    fromBby: 3681,
    toBby: 3653,
    toDate: BEFORE_TREATY,
    places: ['Coruscant'],
    text: 'Security: Senate Security Officers and the CSF in the Senate District, the CSF in the mid-levels, the Underworld Police below. "Senate guards" may be said informally; the formal Senate Guard (blue robes, Senate Commandos) is a later era and does not appear.',
    source: 'D-380 [7], [8]; D-381',
  },
  {
    id: 'coruscant-places',
    subject: 'coruscant-places',
    fromBby: 3681,
    toBby: 3653,
    toDate: BEFORE_TREATY,
    places: ['Coruscant'],
    text: 'Coruscant keeps the strict rule: name only places on record for these years (no market kiosks, no market air-taxi station; generic air taxis and turbolifts are fine). The underworld is the Migrant Merchants\' Guild, the Exchange and Hutt money; small local gangs may be invented, but no galaxy-wide syndicate.',
    source: 'D-380 [10], [12]; D-365',
  },
  {
    id: 'nar-shaddaa-districts',
    subject: 'nar-shaddaa',
    fromBby: 3681,
    toBby: 3653,
    toDate: BEFORE_TREATY,
    places: ['Nar Shaddaa'],
    text: 'Districts that may appear (unconfirmed in these years): the Corellian, Nikto and Duros Sectors, the Promenade, the Red Light Sector, Network Access. Not yet existing: Shadow Town, the Bounty Brokers Association, the Republic Embassy, the Shadow Syndicate.',
    source: 'D-384 [7]',
  },
  {
    id: 'tatooine-rule',
    fromBby: 3681,
    toBby: 3640,
    places: ['Tatooine'],
    text: 'Tatooine is not Hutt-ruled (the Hutts take it only in 65 BBY).',
    source: 'D-384 [8]; SW_NarShaddaa_HuttSpace_GGW_Part1 §H; D-475',
  },
  {
    id: 'jedi-life',
    subject: 'order-home',
    fromBby: 3681,
    toBby: 3653,
    toDate: BEFORE_TREATY,
    factions: ['jediOrder'],
    text: 'Jedi of this era: a Padawan serves a sequence of Masters, with field postings to specialists, and Knighthood comes in the field. Recruits are normally young children; older recruits are exceptions.',
    source: 'D-378 [1], [6]; D-379',
  },
  {
    id: 'jedi-dress',
    subject: 'jedi-dress',
    fromBby: 3681,
    toBby: 3653,
    toDate: BEFORE_TREATY,
    factions: ['jediOrder'],
    text: 'Padawans wear plain tunics and have no braid.',
    source: 'D-378 [1]',
  },
  {
    id: 'korriban-academy',
    fromBby: 3681,
    toBby: 3644,
    places: ['Korriban'],
    text: 'At the Academy acolytes wear plain dark robes (invented) and carry a warblade; the lightsaber comes with apprenticeship. Staff wear black and red; staff not on record may be invented.',
    source: 'D-376; D-475 (to 3,644, as the staff placements)',
  },
  {
    id: 'mandalorians-war',
    fromBby: 3667,
    toBby: 3660,
    factions: ['mandalorians'],
    places: ['Hydian Way'],
    text: 'Mandalorians under the Lesser: most wear ordinary Mandalorian armour, and full beskar marks wealth or standing (invented). Blockade ships are Mandalorian cruisers and support ships. Clans Ordo, Itera, Kelborn and Cadera are loyal in form but dissenters in waiting.',
    source: 'D-382 [5], [8], [10]',
  },
  {
    id: 'imperial-forces',
    fromBby: 3681,
    toBby: 3641,
    factions: ['sithEmpire', 'sith'],
    text: 'No aliens serve in the regular Imperial forces (formal admission comes after 3,640); field hospitals treat only favoured species. No Moff, admiral or general is named as "the" commander in these years; Imperial Intelligence\'s Keeper and Minister go by title only.',
    source: 'D-388 [1], [9], [10]',
  },
  // The Cold War versions (Jared, 2026-11-24; M8 item 9, D-475): only what the lore states, from the Treaty to its collapse in
  // mid-3,641 (to 3,640 where the lore carries on); a period with no lore is silent (RESEARCH_QUEUE.md). 3,650 and 3,647 are
  // year boundaries, as the lore gives no month.
  {
    id: 'coruscant-treaty',
    dependsOn: ['O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Coruscant'],
    text: 'Coruscant lives under the Treaty: Treaty protocol droids shadow chosen Republic officials, only a vote of the full Senate could overturn it, many blame the Jedi for the defeat, and a long depression slows rebuilding.',
    source: 'SW_Coruscant_City_GGW_Part1 (post-window: Treaty §Terms; the Jedi blamed); SW_SWTOR_Era_Power_Structures_Part2; SW_Economy_Events; D-475',
  },
  {
    id: 'coruscant-security-cold-war',
    subject: 'coruscant-security',
    dependsOn: ['O.coruscant_occupied', 'O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Coruscant'],
    text: 'The CSF is drained of lives and resources. In the 3,653 riots it was pulled back from the lower levels to guard the Senate Building and key infrastructure, and some sectors stay lost for years. Senate security is the CSF with the military\'s Senate Security Officers; the formal Senate Guard is a later era.',
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part2 (Law enforcement); SW_Coruscant_City_GGW_Part1 §C (3653 riots), §D; D-380 [7]; D-475',
  },
  {
    id: 'coruscant-underworld-cold-war',
    dependsOn: ['O.coruscant_occupied', 'O.coruscant_unrest'],
    endsWith: 'O.galactic_war',
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Coruscant'],
    text: 'Refugees fill the Old Galactic Market, and the Migrant Merchants\' Guild takes most of it and sells food at a price. Gangs seize lower-level neighbourhoods; Black Sun (Gnawer\'s Roost) and the Justicars\' Brigade (ex-soldiers, sector 439) both form after the Sacking, years not on record.',
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part2 (Old Galactic Market, Gnawer\'s Roost, Crime and gangs, After 3653 BBY); D-475',
  },
  {
    id: 'coruscant-places-cold-war',
    subject: 'coruscant-places',
    dependsOn: ['O.coruscant_occupied'],
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3640,
    places: ['Coruscant'],
    text: 'Coruscant keeps the strict rule: name only places on record. On record after the Sacking: the Senate Plaza and Avenue of the Core Founders (cleared and reopened), Coruscant Spaceport, the Old Galactic Market, The Works (ruined, cthons and rogue droids), Gnawer\'s Roost and the Temple ruins.',
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part2 (locations table; The Works); D-380 [12]; D-475',
  },
  {
    id: 'coruscant-temple-ruins',
    subject: 'coruscant-temple',
    dependsOn: ['O.temple_destroyed'],
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3653,
    toDate: BEFORE_VOTE,
    places: ['Coruscant'],
    text: 'The Jedi Temple is a ruin: the four towers and the outside have fallen, but much of the inside is intact.',
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (3653 BBY; The ruins); D-475, D-476',
  },
  {
    id: 'coruscant-temple-shelved',
    subject: 'coruscant-temple',
    dependsOn: ['O.rebuilding_postponed'],
    fromBby: 3653,
    fromDate: TEMPLE_VOTE,
    toBby: 3640,
    places: ['Coruscant'],
    text: 'The Jedi Temple stays a ruin: the Senate has voted to put off rebuilding it indefinitely, and the Order\'s home is Tython.',
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (3653 BBY: the vote; Am-Ris tells Zym); D-476',
  },
  {
    id: 'coruscant-jedi-remaining',
    dependsOn: ['O.order_on_tython'],
    endsWith: 'O.galactic_war',
    fromBby: 3650,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Coruscant'],
    text: 'The Jedi who stay on Coruscant form a delegation in the Senate, and others guard the Temple ruins and the treasures left in them.',
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (Cold War); SW_SWTOR_Era_Power_Structures_Part2 (Jedi in the Senate); D-475',
  },
  {
    id: 'nar-shaddaa-cold-war',
    subject: 'nar-shaddaa',
    dependsOn: ['O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Nar Shaddaa'],
    text: 'On record in the Cold War: the Promenade (casinos, a golden Karagga), the Red Light Sector, Network Access, the Nikto Sector (Kintan Kings), the poor Duros Sector (war refugees) and the Corellian Sector (Exchange spice). The SIS and Imperial Intelligence fight over the moon, the Exchange and the Hutts are rivals, and the Bounty Brokers Association now exists.',
    source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 §A (Attested only in the Cold War), §C, §F, §G; D-475',
  },
  {
    id: 'nar-shaddaa-sis',
    dependsOn: ['O.trant_sis'],
    endsWith: 'O.trant_director',
    fromBby: 3654,
    toBby: 3651,
    places: ['Nar Shaddaa'],
    text: 'Marcus Trant runs the SIS bureau here and is setting up safe houses (56 over four years). In 3,650 he becomes Director of the SIS.',
    source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 §G; Timeline slice Part 2 (3,650 BBY); D-475',
  },
  {
    id: 'nar-shaddaa-shadow-town',
    dependsOn: ['O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3649,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Nar Shaddaa'],
    text: 'Shadow Town exists: an Imperial prison slum, paid for to the Hutts.',
    source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 §A; SW_Characters_09_GGW_ColdWar_Part1 (Ako Domi sent there in 3,649 [unclear on the date]); D-475',
  },
  {
    id: 'nar-shaddaa-shadow-syndicate',
    dependsOn: ['O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3643,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Nar Shaddaa'],
    text: 'The Shadow Syndicate is active: an Imperial-aligned bloc that includes Godoba the Hutt.',
    source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 §C (by 3643 BBY); D-475',
  },
  {
    id: 'tatooine-mos-ila',
    subject: 'mos-ila',
    fromBby: 3681,
    toBby: 3653,
    toDate: BEFORE_TREATY,
    places: ['Tatooine'],
    text: 'The Exchange holds Mos Ila, founded during the war, which may be newly founded or not yet taken [unclear].',
    source: 'D-384 [8]',
  },
  {
    id: 'tatooine-cold-war',
    subject: 'mos-ila',
    dependsOn: ['O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Tatooine'],
    text: 'Mos Ila was an Exchange town until the Empire came and deposed it, at a date not on record: either may hold it. The Empire encroaches on Anchorhead, and the SIS and Imperial Intelligence fight over the planet.',
    source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 §C, §G; SW_Species_OldRepublic_Part2 (Miraluka); D-475',
  },
  {
    id: 'jedi-tython-no-temple',
    subject: 'order-home',
    dependsOn: ['O.temple_destroyed', 'O.treaty_signed'],
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3651,
    factions: ['jediOrder'],
    text: 'The Order has left the ruined Coruscant Temple for Tython, and has no Temple there yet. The Republic blames the Jedi for losing the war.',
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (3653: "Jedi to Tython"); Timeline slice Part 1 (3,653 BBY); D-476',
  },
  {
    id: 'jedi-dress-cold-war',
    subject: 'jedi-dress',
    dependsOn: ['O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    factions: ['jediOrder'],
    text: 'Padawans wear plain tunics and the Padawan braid (later-era default).',
    source: 'SW_Jedi_Temple_Life_GGW_Part1 (decision 1: later-era default); D-476',
  },
  {
    id: 'jedi-tython-building',
    subject: 'order-home',
    dependsOn: ['O.order_on_tython'],
    fromBby: 3650,
    toBby: 3648,
    places: ['Tython'],
    factions: ['jediOrder'],
    text: 'The Order is on Tython and is building its new Temple there on an ancient temple\'s foundations, of local timber and stone. Lives are lost to the land and the Flesh Raiders, and Gnost-Dural gathers records for the new Archives.',
    source: 'Timeline slice Part 2 (3,650, 3,647 BBY); SW_Jedi_Daily_Life_Training_OldRepublic (Jedi Temple (Tython); Temple duties); SW_Tython; D-475',
  },
  {
    id: 'jedi-tython-temple',
    subject: 'order-home',
    dependsOn: ['O.tython_temple'],
    fromBby: 3647,
    toBby: 3640,
    places: ['Tython'],
    factions: ['jediOrder'],
    text: 'The Tython Temple is finished: the Archives under a domed second-storey chamber, training grounds in the valley, the Gnarls outpost and the lakeside Masters\' Retreat where new Padawans land. No quarters for learners are on record.',
    source: 'Timeline slice Part 2 (3,647 BBY); SW_Jedi_Daily_Life_Training_OldRepublic (Jedi Temple (Tython)); D-475',
  },
  {
    id: 'jedi-training-cold-war',
    dependsOn: ['O.order_on_tython'],
    endsWith: 'O.galactic_war',
    fromBby: 3650,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    factions: ['jediOrder'],
    text: 'Training leans to practical military readiness and diplomatic service. A Padawan may pass to a new Master, and older recruits (adolescent, even eighteen) are taken as exceptions.',
    source: 'SW_Jedi_Daily_Life_Training_OldRepublic (Padawan training; Recruitment); SW_Jedi_Ranks_Councils_Roles_AllEras_Part1; D-475',
  },
  {
    id: 'jedi-forge',
    dependsOn: ['O.order_on_tython'],
    fromBby: 3650,
    toBby: 3643,
    factions: ['jediOrder'],
    text: 'A Padawan trains with a shock practice saber, and builds a lightsaber at the Forge on Tython as the last rite before Knighthood.',
    source: 'SW_Jedi_Daily_Life_Training_OldRepublic (Lightsaber construction and the Tython Forge: the decade after 3653); D-475',
  },
  {
    id: 'korriban-not-on-staff',
    fromBby: 3681,
    toBby: 3656,
    places: ['Korriban'],
    text: 'Harkun and Zash are not on the Academy staff yet.',
    source: 'D-376; the roster has Harkun an Overseer from 3,655 (estimate); D-475',
  },
  {
    id: 'korriban-cold-war',
    dependsOn: ['O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3653,
    fromDate: TREATY_SIGNED,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Korriban'],
    text: 'Korriban is a major centre of learning, built over the tombs and old Dreshdae; acolytes land at the Arrival Port. The law sends every Force-sensitive in Imperial territory to the Academy, slaves and aliens included (many Imperials frown on it). Trials often leave one survivor. Murder between acolytes is illegal, even punishable by death, so it is staged as accidents in the tombs.',
    source: 'SW_Korriban_Academy_Part1 §A, §C, §D; SW_Korriban_Academy_Part2 §F; SW_Korriban_Planet (Cold War); D-475',
  },
  {
    id: 'korriban-acolytes-late',
    dependsOn: ['O.treaty_signed'],
    endsWith: 'O.galactic_war',
    fromBby: 3643,
    toBby: 3641,
    toDate: BEFORE_COLLAPSE,
    places: ['Korriban'],
    text: 'Acolytes still carry a warblade until a Sith takes them as apprentice and they get a red lightsaber; staff wear black and red. Classes are six or seven under one Overseer.',
    source: 'SW_Korriban_Academy_Part1 §C, §D, §E; SW_Korriban_Academy_Part2 §H (c. 3,643 BBY); D-475',
  },
  // The Nov 22 lore update (D-440): plain dated facts about places (D-438), sent when the place is in the location chain.
  // A span ends at its last recorded year (D-411 [5]); -Infinity = a lasting fact with no end on record.
  {
    id: 'malachor-v-wreckage',
    fromBby: 3951,
    toBby: -Infinity,
    places: ['Malachor V', 'Malachor system'],
    text: 'Malachor V was destroyed in 3,951 BBY: it is a field of asteroids and wreckage in the Malachor system, with unstable gravity, Sith and Mandalorian Wars relics, and no Force nexus. Whether any dark presence lingers is unknown: use it only as a story hazard, never a training benefit.',
    source: 'SW_Malachor_V (Timeline 3951; decisions 1-2); D-440',
  },
  {
    id: 'malachor-v-surveyed',
    fromBby: 3640,
    toBby: -Infinity,
    places: ['Malachor V', 'Malachor system'],
    text: 'By 3,640 BBY surveys have found small pockets of life still active in the remains of Malachor V, and treasure hunters excavate it for artifacts.',
    source: 'SW_Malachor_V (Timeline: by 3640 BBY); D-440',
  },
  {
    id: 'tython-no-settlement',
    fromBby: 25783,
    toBby: -Infinity,
    places: ['Tython'],
    text: 'Tython is not open to ordinary settlement: the planet reacts to imbalance with Force storms and is unsafe for those who cannot sense the Force.',
    source: 'SW_Tython (Summary; the cataclysm of 25,783 BBY); SW_Force_Nexus_Vergence decision 1; D-440',
  },
  {
    id: 'tython-kalikori',
    fromBby: 3651,
    toBby: 3636,
    places: ['Tython', 'Kalikori'],
    text: "Kalikori is an illegal settlement of Twi'lek Pilgrims in the Tythonian hills that survives only through hardship, under constant Flesh Raider attack; it is not evidence that Tython is open to settlers.",
    source: 'SW_Tython (Kalikori village; decision 2); D-440',
  },
  {
    id: 'korriban-zakuul-bombardment',
    fromBby: 3636,
    toBby: -Infinity,
    places: ['Korriban'],
    text: "Zakuul's fleet bombarded Korriban's temples to rubble c. 3,636 BBY. They were later rebuilt (no date on record), and many artifacts are still buried.",
    source: 'SW_Korriban_Planet (Timeline: the Eternal Empire conquest, c. 3636 BBY); D-440',
  },
  {
    id: 'ossus-ruin',
    fromBby: 3996,
    toBby: 3628,
    places: ['Ossus'],
    text: 'Ossus has been an irradiated desert ruin since the Cron Cluster supernova of 3,996 BBY: known, but unsettled until a Jedi colony comes some time after 3,636.',
    source: 'SW_Ossus (Summary; decision 2); D-440',
  },
  {
    id: 'ossus-colony',
    fromBby: 3636,
    toBby: 3628,
    places: ['Ossus'],
    text: 'Some time after 3,636 BBY (the year is not on record) Gnost-Dural leads a Jedi colony to Ossus, fleeing Zakuul. In 3,628 Sith forces under Darth Malora attack, the Republic relieves it, and the colony is evacuated.',
    source: 'SW_Ossus (the Jedi colony; Timeline after 3636, 3628); D-440',
  },
];

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const mentions = (text: string, name: string): boolean => (` ${norm(text)} `).includes(` ${norm(name)} `);

const dayOf = (d: MonthDay): number => d.month * 100 + d.day;
/** Whether a rule holds in a year, on a day of it (no day = the start of the year, as the control table reads it). */
export const eraRuleHolds = (r: EraRule, bby: number, date: MonthDay = { month: 1, day: 1 }): boolean =>
  bby <= r.fromBby && bby >= r.toBby && !(bby === r.fromBby && r.fromDate && dayOf(date) < dayOf(r.fromDate)) && !(bby === r.toBby && r.toDate && dayOf(date) > dayOf(r.toDate));

/** Whether a rule is about these places or the factions in play. */
export const eraRuleApplies = (r: EraRule, placeNames: readonly string[], factions: readonly string[]): boolean =>
  r.always === true || (r.places ?? []).some((p) => placeNames.some((n) => mentions(n, p))) || (r.factions ?? []).some((f) => factions.includes(f));

/** The rules relevant at `bby` (and the day of it) for these place names and the factions in play, by the lore's dates. */
export function eraRulesAt(bby: number, placeNames: readonly string[], factions: readonly string[], date?: MonthDay): EraRule[] {
  return ERA_RULES.filter((r) => eraRuleHolds(r, bby, date) && eraRuleApplies(r, placeNames, factions));
}
