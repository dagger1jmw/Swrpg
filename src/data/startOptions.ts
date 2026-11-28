// Start options (D-401 [2], [10]; architecture §15's M7 start options from lore batches 8-18; date-keyed in D-413). A
// start is mechanical: it sets the paths and ranks the character may take, the side they start on, the places they start
// in (seeded as location records), and the opening story threads. Each start has the years it is valid for (where its
// setting holds); its threads, place notes and premise are dated, so a start in another year gets only what is true then.
// The 17 starts were written for 3,661 BBY; their 3,661 text is kept as the 3,661 version. The premise is a default the
// player may edit. No start puts the player in a SWTOR protagonist's role (D-377). Places not on record carry `invented: true`
// (D-364); places attested only later carry "unconfirmed in window" in their source.
import type { CharacterPath } from './archetypes';
import type { FactionId, LocationKind } from './entities.config';

/** A dated piece of text (years BBY, inclusive); absent ends = the start's whole range. */
export interface DatedText {
  fromBby?: number;
  toBby?: number;
  text: string;
}

const covers = (d: { fromBby?: number; toBby?: number }, bby: number): boolean => bby <= (d.fromBby ?? Infinity) && bby >= (d.toBby ?? -Infinity);

export interface StartPlace {
  name: string;
  kind: LocationKind;
  /** Planet or sector, as the location record names it. */
  region: string;
  /** True in every year of the start's range. */
  description: string;
  /** Dated additions to the description (the 3,661 blockade, the riots). */
  notes?: readonly DatedText[];
  invented?: boolean;
  source: string;
}

export interface StartThread {
  title: string;
  stakes: string;
  source: string;
  /** The years the thread is true (absent = the start's whole range). */
  fromBby?: number;
  toBby?: number;
}

/** Whether a Sith Pureblood may take this start (D-401 [10]). */
export type PurebloodRule = 'allowed' | 'imperialBornOnly' | 'refused';

/**
 * Whether a non-Human may take this Imperial start before aliens are formally admitted after Ilum (D-388 [10], D-407):
 * - 'allowed': any species (and no role note);
 * - 'refused': the regular forces (Humans only);
 * - 'chissLiaison': a Chiss only, as a liaison from the Ascendancy (naval starts);
 * - 'chissOrInformer': a Chiss as an agent, any other alien as an informer or asset outside the formal ranks (Intelligence);
 * - 'slaveBornRoute': Humans and Purebloods only; an alien Force-sensitive takes the slave-born route (Imperial-born; D-411 [6]).
 * Near-Humans (Miraluka, Rattataki, Echani) count as aliens: only `human` and `sith_pureblood` are exempt (D-411 [6]).
 * Sith Purebloods follow their own rule (`pureblood`), not this one. Absent = 'allowed'.
 */
export type AlienRule = 'allowed' | 'refused' | 'chissLiaison' | 'chissOrInformer' | 'slaveBornRoute';
/** Aliens are admitted to the Imperial forces after the Battle of Ilum (3,640; D-388 [10]); the rule applies before it. */
export const ALIEN_ADMISSION_BBY = 3640;

export interface StartOption {
  id: string;
  title: string;
  /** The years (BBY, inclusive) the start is offered for. */
  fromBby: number;
  toBby: number;
  paths: readonly CharacterPath[];
  /** Ranks offered (the creation rank must be one of these); empty = any rank of the paths. */
  ranks: readonly string[];
  /** Archetypes offered; empty = any of the paths. */
  archetypes: readonly string[];
  faction: FactionId;
  /** Outermost first: the planet, then the place inside it where the character is. */
  places: readonly StartPlace[];
  threads: readonly StartThread[];
  /** The default premise, editable by the player: the first that covers the year; "{year}" is filled in. */
  premises: readonly DatedText[];
  pureblood: PurebloodRule;
  /** Non-Human species on an Imperial start (D-388 [10], D-407). Absent = any species. */
  alien?: AlienRule;
  /**
   * A military start's service record (m9-tune2 item 3 and addendum 4): the ladder, and whether the character serves in the ranks
   * below its first (officer) rung (the trooper, the conscript) or holds that first rung (the pilot, the junior naval officer). A
   * total war posts serving soldiers (missions.md section 6).
   */
  service?: { ladderId: string; enlisted: boolean };
  /** The architecture §15 note and decisions it comes from. */
  source: string;
}

const CORUSCANT: StartPlace = { name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: 'The Republic capital.', notes: [{ fromBby: 3661, toBby: 3661, text: 'Starving under the Hydian Way blockade; food riots in the lower levels.' }], source: 'Timeline slice Part 1 (3,661); D-380' };
const KORRIBAN: StartPlace = { name: 'Korriban', kind: 'planet', region: 'Horuset system', description: 'The Sith homeworld, Imperial since 3,681, seat of the reopened Sith Academy.', source: 'Timeline slice Part 1 (3,681); D-376' };
const DROMUND_KAAS: StartPlace = { name: 'Dromund Kaas', kind: 'planet', region: 'Dromund system', description: 'The Sith Empire\'s jungle capital under perpetual storm.', source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 (lore batch 9)' };
const NAR_SHADDAA: StartPlace = { name: 'Nar Shaddaa', kind: 'moon', region: 'Hutt Space', description: 'The Smugglers\' Moon over Nal Hutta, neutral in the war.', notes: [{ fromBby: 3661, toBby: 3661, text: 'Hutt money is behind the blockade runs.' }], source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 (lore batch 16); D-380 [10]' };
const BLOCKADE: StartThread = { fromBby: 3661, toBby: 3661, title: 'The Hydian Way blockade', stakes: 'Mandalorian cruisers have closed the Hydian Way and Coruscant is starving; whoever breaks or holds the blockade shifts the war.', source: 'Timeline slice Part 1 (3,661); D-379, D-380' };
const RIM: StartThread = { fromBby: 3661, toBby: 3660, title: 'The Rim Campaign', stakes: 'The Empire is opening a campaign in the Outer Rim; Ord Radama and Serenno are in its path.', source: 'Timeline slice Part 1 (c. 3,661–3,660); D-388 [5]' };

export const START_OPTIONS: readonly StartOption[] = [
  {
    id: 'jedi-temple',
    title: 'Jedi at the Coruscant Temple',
    fromBby: 3681,
    toBby: 3654,
    paths: ['jedi'],
    ranks: ['initiate', 'padawan', 'knight', 'master'],
    archetypes: [],
    faction: 'jediOrder',
    places: [CORUSCANT, { name: 'Jedi Temple', kind: 'building', region: 'Coruscant', description: 'The Jedi Temple on Coruscant; Masters come and go from the front.', notes: [{ fromBby: 3661, toBby: 3661, text: 'The Council debates the blockade.' }], source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (lore batch 8); D-364, D-379' }],
    threads: [BLOCKADE, { fromBby: 3661, toBby: 3661, title: 'The Council and the strike near Devaron', stakes: 'The Council weighs a fighter strike to break the blockade; Gnost-Dural readies the attack near Devaron.', source: 'Timeline slice Part 1 (3,661); D-378 [4], D-379' }],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A Jedi of the Coruscant Temple in {year}, as the Hydian Way blockade starves the capital and the Council argues over how to answer it.' }, { text: 'A Jedi of the Coruscant Temple in {year}, in the war with the Sith Empire.' }],
    pureblood: 'refused',
    source: 'architecture §15 "M7 Jedi starts" and "M7 start locations: Coruscant and the Temple"; D-364, D-378, D-379',
  },
  {
    id: 'jedi-front',
    title: 'Jedi at the front, Minos Cluster',
    fromBby: 3681,
    toBby: 3654,
    paths: ['jedi'],
    ranks: ['padawan', 'knight', 'master'],
    archetypes: [],
    faction: 'jediOrder',
    places: [{ name: 'Minos Cluster', kind: 'other', region: 'Minos Cluster', description: 'A front for the whole war, where Jedi fight beside the Republic Army against the Imperial Army and Sith.', source: 'SW_Great_Galactic_War_Part1; Timeline slice Part 1 (3,680)' }],
    threads: [{ fromBby: 3681, toBby: 3654, title: 'The Minos Cluster front', stakes: 'The Empire holds rich resource sites in the Cluster; the Jedi and the Army are trying to push it out.', source: 'SW_Great_Galactic_War_Part1; D-393 [17]' }, BLOCKADE],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A Jedi posted to the Minos Cluster front in {year}, serving with the Republic Army, while news of the blockade reaches the line.' }, { text: 'A Jedi posted to the Minos Cluster front in {year}, serving with the Republic Army.' }],
    pureblood: 'refused',
    source: 'architecture §15 "M7 Jedi starts" (field postings); D-379 (at the front)',
  },
  {
    id: 'korriban-acolyte',
    title: 'Acolyte at the Korriban Academy',
    fromBby: 3681,
    toBby: 3642,
    paths: ['sith'],
    ranks: ['acolyte'],
    archetypes: [],
    faction: 'sithEmpire',
    places: [KORRIBAN, { name: 'Sith Academy', kind: 'building', region: 'Korriban', description: 'The reopened Academy: an Overseer runs a cohort of six or seven acolytes, and a visiting Lord chooses an apprentice.', source: 'SW_Korriban_Academy_Part1 (lore batch 12); D-376' }],
    threads: [{ title: 'The trials of the cohort', stakes: 'Only one of the cohort may be chosen by a visiting Lord; the others may die in the trials or at a rival\'s hand.', source: 'SW_Korriban_Academy_Part1 §B–§E; D-376' }],
    premises: [{ text: 'An acolyte newly arrived at the Sith Academy on Korriban in {year}, in a cohort under an Overseer, competing to be chosen.' }],
    pureblood: 'allowed',
    source: 'architecture §15 "M7 Imperial-born and slave-born starts"; D-366, D-376',
  },
  {
    id: 'kaas-imperial-born',
    title: 'Imperial-born on Dromund Kaas',
    fromBby: 3681,
    toBby: 3642,
    paths: ['sith', 'outsider'],
    ranks: ['acolyte', 'none'],
    archetypes: [],
    faction: 'sithEmpire',
    places: [DROMUND_KAAS, { name: 'Kaas City', kind: 'city', region: 'Dromund Kaas', description: 'The Imperial capital: a military-family townhouse, private Force instructors, Imperial Guard sentries, parade routes and the jungle edge.', source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 and _Part2 (lore batch 9); D-366, D-367' }],
    threads: [{ title: 'Sent to Korriban', stakes: 'A Force-sensitive child of the Empire is bound for the Academy; the family\'s standing rides on what follows.', source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part2, Game notes; D-366' }],
    premises: [{ text: 'An Imperial-born Force-sensitive in Kaas City in {year}, raised by private instructors, about to leave for Korriban.' }],
    pureblood: 'allowed',
    alien: 'slaveBornRoute',
    source: 'architecture §15 "M7 Imperial-born and slave-born starts"; D-366 to D-368',
  },
  {
    id: 'korriban-slave',
    title: 'Slave-born Force-sensitive sent to Korriban',
    fromBby: 3681,
    toBby: 3642,
    paths: ['sith'],
    ranks: ['acolyte'],
    archetypes: [],
    faction: 'sithEmpire',
    places: [KORRIBAN, { name: 'Sith Academy', kind: 'building', region: 'Korriban', description: 'The reopened Academy, where a slave-born acolyte is sent "willing or not".', source: 'SW_Korriban_Academy_Part1 (lore batch 12); D-366, D-376' }],
    threads: [{ title: 'The trials of the cohort', stakes: 'Only one of the cohort may be chosen by a visiting Lord; a slave-born acolyte has no patron to protect them.', source: 'SW_Korriban_Academy_Part1; D-366, D-376' }],
    premises: [{ text: 'A slave found to be Force-sensitive and sent to the Sith Academy on Korriban in {year}, willing or not.' }],
    pureblood: 'allowed',
    source: 'architecture §15 "M7 Imperial-born and slave-born starts"; D-366',
  },
  {
    id: 'mandalorian-blockade',
    title: 'Mandalorian on the blockade',
    fromBby: 3661,
    toBby: 3661,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['mandalorian'],
    faction: 'mandalorians',
    places: [{ name: 'Hydian Way', kind: 'other', region: 'Hydian Way', description: 'The closed stretch between Devaron and the Minos Cluster.', source: 'Timeline slice Part 1 (3,661); D-382' }, { name: 'Mandalorian blockade cruiser', kind: 'ship', region: 'Hydian Way', description: 'A Mandalorian cruiser on picket duty: hail, warn, intercept.', invented: true, source: 'SW_Mandalorians_GGW_Part1, Game notes (picket duty sourced); the ship is invented' }],
    threads: [BLOCKADE, { fromBby: 3661, toBby: 3661, title: 'Picket duty', stakes: 'Every freighter that runs the blockade is a test of the clans\' honour and of the Lesser\'s bargain with the Empire.', source: 'SW_Mandalorians_GGW_Part1, Game notes; D-383' }],
    premises: [{ text: 'A Mandalorian warrior under Mandalore the Lesser in {year}, on picket duty aboard a cruiser closing the Hydian Way.' }],
    pureblood: 'imperialBornOnly',
    source: 'architecture §15 "M7 Mandalorian starts" (the blockade warrior); D-382, D-383',
  },
  {
    id: 'mandalorian-nomad',
    title: 'Mandalorian nomad mercenary',
    fromBby: 3667,
    toBby: 3660,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['mandalorian'],
    faction: 'mandalorians',
    places: [{ name: 'Nomad camp', kind: 'wilderness', region: 'Outer Rim', description: 'A clan\'s nomad camp, one of those who refused the Sith in 3,667.', invented: true, source: 'SW_Mandalorians_GGW_Part1; D-382 [9]; the camp is invented' }],
    threads: [{ fromBby: 3667, toBby: 3660, title: 'The clans who refused', stakes: 'Your clan refused the Sith in 3,667; the Lesser\'s followers call you traitors, and Republic coin is on offer.', source: 'SW_Mandalorians_GGW_Part1; D-382 [9], D-383' }],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A Mandalorian of a nomad clan that refused the Sith in 3,667 BBY, hiring out as a mercenary in {year} while the Lesser holds the Hydian Way.' }, { text: 'A Mandalorian of a nomad clan that refused the Sith in 3,667 BBY, hiring out as a mercenary in {year} while Mandalore the Lesser leads the clans.' }],
    pureblood: 'imperialBornOnly',
    source: 'architecture §15 "M7 Mandalorian starts" (the nomad mercenary); D-382 [9], D-383',
  },
  {
    id: 'underworld-smuggler',
    title: 'Freelance smuggler on Nar Shaddaa',
    fromBby: 3681,
    toBby: 3642,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['smuggler'],
    faction: 'underworld',
    places: [NAR_SHADDAA, { name: 'Duros Sector docks', kind: 'district', region: 'Nar Shaddaa', description: 'Busy docking bays where freighters take on cargo and crews.', source: 'SW_NarShaddaa_HuttSpace_GGW_Part1; D-384 [7] (unconfirmed in window)' }],
    threads: [{ fromBby: 3661, toBby: 3661, title: 'A run through the blockade', stakes: 'A Hutt patron will pay well for a run to Coruscant; the Mandalorian pickets will kill anyone they catch.', source: 'D-380 [10]; SW_NarShaddaa_HuttSpace_GGW_Part1, Game notes; D-385' }],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A freelance smuggler on Nar Shaddaa in {year}, with a ship, a debt and a Hutt patron who wants a run through the blockade.' }, { text: 'A freelance smuggler on Nar Shaddaa in {year}, with a ship, a debt and a Hutt patron.' }],
    pureblood: 'imperialBornOnly',
    source: 'architecture §15 "M7 underworld starts" (freelance smuggler); D-384, D-385',
  },
  {
    id: 'underworld-orphan',
    title: 'Undercity orphan on Nar Shaddaa',
    fromBby: 3681,
    toBby: 3642,
    paths: ['career', 'outsider'],
    ranks: ['career', 'none'],
    archetypes: ['civilian', 'smuggler', 'jediGuardian', 'jediConsular', 'jediSentinel'],
    faction: 'underworld',
    places: [NAR_SHADDAA, { name: 'Undercity', kind: 'district', region: 'Nar Shaddaa', description: 'The moon\'s lightless lower levels, where orphans run errands for gangs and Cartel thugs.', source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 (Hylo Visz\'s early life); D-385' }],
    threads: [{ title: 'Getting out of the Undercity', stakes: 'A way up means owing someone: a gang, the Exchange, or a Hutt.', source: 'SW_NarShaddaa_HuttSpace_GGW_Part1, Game notes; D-385' }],
    premises: [{ text: 'An orphan of the Nar Shaddaa Undercity in {year}, scraping by among gangs and Cartel thugs.' }],
    pureblood: 'imperialBornOnly',
    source: 'architecture §15 "M7 underworld starts" (Undercity orphan); D-385',
  },
  {
    id: 'underworld-mechanic',
    title: 'Cartel dock mechanic on Nar Shaddaa',
    fromBby: 3681,
    toBby: 3642,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['civilian', 'smuggler'],
    faction: 'underworld',
    places: [NAR_SHADDAA, { name: 'Cartel docking bay', kind: 'building', region: 'Nar Shaddaa', description: 'A Hutt Cartel docking bay.', notes: [{ fromBby: 3661, toBby: 3661, text: 'It services blockade runners.' }], invented: true, source: 'SW_NarShaddaa_HuttSpace_GGW_Part1 (Hylo Visz\'s life); the bay is invented' }],
    threads: [{ fromBby: 3661, toBby: 3661, title: 'The blockade runners\' ships', stakes: 'The ships you fix are the ones that try the blockade; their crews talk, and some owe the Exchange.', source: 'SW_NarShaddaa_HuttSpace_GGW_Part1, Game notes; D-385' }],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A mechanic in a Hutt Cartel docking bay on Nar Shaddaa in {year}, fixing the freighters that try the blockade.' }, { text: 'A mechanic in a Hutt Cartel docking bay on Nar Shaddaa in {year}.' }],
    pureblood: 'imperialBornOnly',
    source: 'architecture §15 "M7 underworld starts" (Cartel dock mechanic); D-385',
  },
  {
    id: 'coruscant-lower-levels',
    title: 'Coruscant lower levels in the riots',
    fromBby: 3681,
    toBby: 3654,
    paths: ['career', 'outsider'],
    ranks: ['career', 'none'],
    archetypes: ['civilian', 'smuggler', 'soldier', 'jediGuardian', 'jediConsular', 'jediSentinel'],
    faction: 'republic',
    places: [CORUSCANT, { name: 'Lower levels', kind: 'district', region: 'Coruscant', description: 'The districts below the Senate towers, policed by the CSF and the Underworld Police.', notes: [{ fromBby: 3661, toBby: 3661, text: 'Starving; prices soar and the riots begin.' }], source: 'SW_Coruscant_City_GGW_Part1 (lore batch 14); D-380 [8], [11]; D-381' }],
    threads: [{ fromBby: 3661, toBby: 3661, title: 'The food riots', stakes: 'The blockade has emptied the markets; the lower levels march on the Senate, and short lockdowns follow.', source: 'Timeline slice Part 1 (3,661); D-380 [11], D-381' }, BLOCKADE],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A resident of Coruscant\'s lower levels in {year}, as food runs out under the blockade and the riots begin.' }, { text: 'A resident of Coruscant\'s lower levels in {year}.' }],
    pureblood: 'refused',
    source: 'architecture §15 "M7 Coruscant in 3661 BBY"; D-380, D-381',
  },
  {
    id: 'republic-trooper',
    title: 'Republic Army trooper',
    fromBby: 3665,
    toBby: 3654,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['soldier'],
    faction: 'republic',
    places: [{ name: 'Geonosis', kind: 'planet', region: 'Arkanis sector', description: 'An active front of the war since 3,665.', source: 'Timeline slice Part 1 (3,665)' }, { name: 'Republic forward base', kind: 'building', region: 'Geonosis', description: 'A Republic Army forward base on the Geonosis front.', invented: true, source: 'the base is invented' }],
    threads: [{ fromBby: 3665, toBby: 3653, title: 'The Geonosis campaign', stakes: 'A long, grinding front; veterans of Alderaan and Hoth tell new recruits what the Empire does to the losing side.', source: 'Timeline slice Part 1 (3,665); SW_Republic_Military_GGW_Part1; D-387' }, BLOCKADE],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A Republic Army trooper in {year}, a veteran of four to six years since joining after Alderaan, on the Geonosis front.' }, { text: 'A Republic Army trooper in {year}, on the Geonosis front.' }],
    pureblood: 'refused',
    service: { ladderId: 'republicArmy', enlisted: true },
    source: 'architecture §15 "M7 Republic military starts" (trooper); D-386, D-387',
  },
  {
    id: 'republic-pilot',
    title: 'Republic starfighter pilot',
    fromBby: 3681,
    toBby: 3654,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['soldier'],
    faction: 'republic',
    places: [{ name: 'Intercessor', kind: 'ship', region: 'Republic space', description: 'A Valor-class cruiser carrying 110 starfighters.', source: 'SW_Republic_Military_GGW_Part1 (lore batch 17); D-387' }],
    threads: [BLOCKADE],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A Liberator pilot flying off the Valor-class cruiser Intercessor in {year}, as the Navy weighs breaking the blockade.' }, { text: 'A Liberator pilot flying off the Valor-class cruiser Intercessor in {year}.' }],
    pureblood: 'refused',
    service: { ladderId: 'republicNavy', enlisted: false },
    source: 'architecture §15 "M7 Republic military starts" (pilot); D-387',
  },
  {
    id: 'sis-agent',
    title: 'SIS agent',
    fromBby: 3681,
    toBby: 3642,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['soldier', 'civilian'],
    faction: 'republic',
    places: [CORUSCANT, { name: 'SIS headquarters', kind: 'building', region: 'Coruscant', description: 'The Strategic Information Service, now a full espionage bureau.', source: 'SW_Coruscant_City_GGW_Part1; D-381 (the Heorem Complex, start date unclear: unconfirmed in window)' }],
    threads: [{ fromBby: 3661, toBby: 3661, title: 'The Shange operation', stakes: 'The SIS is abducting the Cathar hero Prince Shange for stasis on Belsavis, a morally gray order you are part of.', source: 'Timeline slice Part 1 (3,661); SW_SWTOR_Era_Power_Structures_Part2; D-387' }],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A Strategic Information Service agent in {year}, assigned to the secret operation against the Cathar prince Shange.' }, { text: 'A Strategic Information Service agent in {year}.' }],
    pureblood: 'refused',
    source: 'architecture §15 "M7 Republic military starts" (spy); D-387',
  },
  {
    id: 'imperial-soldier',
    title: 'Imperial soldier, Rim Campaign',
    fromBby: 3681,
    toBby: 3642,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['soldier'],
    faction: 'sithEmpire',
    places: [DROMUND_KAAS, { name: 'Imperial garrison', kind: 'building', region: 'Dromund Kaas', description: 'A garrison where conscripts muster.', notes: [{ fromBby: 3661, toBby: 3660, text: 'They muster for the Rim Campaign.' }], invented: true, source: 'SW_Imperial_Military_Intelligence_GGW_Part1 (conscription); the garrison is invented' }],
    threads: [RIM],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'An Imperial conscript in {year}, mustering for the Rim Campaign under officers who answer to Sith Lords.' }, { text: 'An Imperial conscript in {year}, under officers who answer to Sith Lords.' }],
    pureblood: 'allowed',
    service: { ladderId: 'sithImperialArmy', enlisted: true },
    alien: 'refused',
    source: 'architecture §15 "M7 Imperial non-Sith starts" (soldier); D-388, D-389',
  },
  {
    id: 'imperial-officer',
    title: 'Junior Imperial naval officer',
    fromBby: 3681,
    toBby: 3642,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['soldier'],
    faction: 'sithEmpire',
    places: [{ name: 'Gage-class transport', kind: 'ship', region: 'Imperial space', description: 'A Gage-class transport under a junior captain.', source: 'SW_Imperial_Military_Intelligence_GGW_Part1 (lore batch 18); D-389' }],
    threads: [RIM],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'The junior captain of a Gage-class transport in {year}, carrying troops for the Rim Campaign.' }, { text: 'The junior captain of a Gage-class transport in {year}, carrying troops to the front.' }],
    pureblood: 'allowed',
    service: { ladderId: 'sithImperialNavy', enlisted: false },
    alien: 'chissLiaison',
    source: 'architecture §15 "M7 Imperial non-Sith starts" (junior naval officer); D-389',
  },
  {
    id: 'imperial-agent',
    title: 'Imperial Intelligence agent',
    fromBby: 3681,
    toBby: 3642,
    paths: ['career'],
    ranks: ['career'],
    archetypes: ['soldier', 'civilian'],
    faction: 'sithEmpire',
    places: [DROMUND_KAAS, { name: 'Kaas City', kind: 'city', region: 'Dromund Kaas', description: 'The Imperial capital, where Imperial Intelligence\'s Minders and Fixers report to their Watchers.', source: 'SW_Imperial_Military_Intelligence_GGW_Part1 (lore batch 18); D-389' }],
    threads: [{ fromBby: 3667, toBby: 3660, title: 'Handling the Mandalorians', stakes: 'Imperial Intelligence keeps Mandalore the Lesser\'s blockade on course; the clans are proud, and some resent their patrons.', source: 'SW_Imperial_Military_Intelligence_GGW_Part1, Game notes; D-389' }, BLOCKADE],
    premises: [{ fromBby: 3661, toBby: 3661, text: 'A Minder of Imperial Intelligence in {year}, under a Watcher, handling the Mandalorians who hold the Hydian Way.' }, { text: 'A Minder of Imperial Intelligence in {year}, under a Watcher.' }],
    pureblood: 'allowed',
    alien: 'chissOrInformer',
    source: 'architecture §15 "M7 Imperial non-Sith starts" (agent); D-389',
  },
];

export const START_OPTION_BY_ID: ReadonlyMap<string, StartOption> = new Map(START_OPTIONS.map((o) => [o.id, o]));

/** The start options offered for a start in `year` (negative = BBY). */
export function startOptionsFor(year: number): readonly StartOption[] {
  const bby = -year;
  return START_OPTIONS.filter((o) => bby <= o.fromBby && bby >= o.toBby);
}

const yearWords = (bby: number): string => (bby > 0 ? `${bby.toLocaleString('en-US')} BBY` : `${(-bby).toLocaleString('en-US')} ABY`);

/** The start's threads that are true in `bby` (D-413). */
export function startThreadsAt(o: StartOption, bby: number): StartThread[] {
  return o.threads.filter((t) => covers(t, bby));
}

/** A start place's description in `bby`: the timeless line plus its notes for the year (D-413). */
export function startPlaceDescription(p: StartPlace, bby: number): string {
  return [p.description, ...(p.notes ?? []).filter((n) => covers(n, bby)).map((n) => n.text)].join(' ');
}

/** The default premise for a start in `year` (negative = BBY), with the year filled in (D-413). */
export function startPremiseAt(o: StartOption, year: number): string {
  const bby = -year;
  const p = o.premises.find((x) => covers(x, bby)) ?? o.premises[o.premises.length - 1]!;
  return p.text.replace('{year}', yearWords(bby));
}

export interface StartCheck {
  optionId: string;
  path: CharacterPath;
  rank: string;
  archetype: string;
  speciesId: string;
  /** The player marks an Imperial-born character (a defector or underworld Pureblood, D-401 [10]). */
  imperialBorn: boolean;
  /** The start year as BBY (positive); the alien rule applies before 3,640. Absent = the start's own first year. */
  bby?: number;
}

const ALIEN_ROUTES = 'the routes for an alien are a Chiss agent or liaison (the Intelligence or naval starts), a Force-sensitive slave sent to Korriban (the Sith path), or an informer for Imperial Intelligence';

function alienApplies(o: StartOption, c: StartCheck): boolean {
  return c.speciesId !== 'human' && c.speciesId !== 'sith_pureblood' && (c.bby ?? o.fromBby) > ALIEN_ADMISSION_BBY;
}

/** The role an alien takes on this start (an opening thread for the narrator), or null (D-407). */
export function alienRole(o: StartOption, c: StartCheck): StartThread | null {
  if (!alienApplies(o, c)) return null;
  const source = 'SW_Imperial_Military_Intelligence_GGW_Part1; D-388 [10], D-407';
  if (o.alien === 'chissLiaison' && c.speciesId === 'chiss') return { title: 'A Chiss liaison', stakes: 'The character serves as a liaison from the Chiss Ascendancy, the Empire\'s only true ally; aliens are not admitted to the regular forces, and the crew knows it.', source };
  if (o.alien === 'chissOrInformer') {
    return c.speciesId === 'chiss'
      ? { title: 'A Chiss agent', stakes: 'The character is a Chiss agent of Imperial Intelligence, on loan from the Ascendancy; the Empire values the alliance but admits no aliens to its formal ranks.', source }
      : { title: 'An informer, not an officer', stakes: 'The character is an informer and asset of Imperial Intelligence, outside the formal ranks; aliens are not admitted to the Empire\'s service, and a handler can disown them at will.', source };
  }
  return null;
}

/** Errors for a creation that does not fit the chosen start (empty when it fits). */
export function checkStart(o: StartOption, c: StartCheck): string[] {
  const errors: string[] = [];
  if (!o.paths.includes(c.path)) errors.push(`The start "${o.title}" takes the ${o.paths.join(' or ')} path.`);
  if (o.ranks.length && !o.ranks.includes(c.rank)) errors.push(`The start "${o.title}" takes the rank ${o.ranks.join(', ')}.`);
  if (o.archetypes.length && !o.archetypes.includes(c.archetype)) errors.push(`The start "${o.title}" takes the archetype ${o.archetypes.join(', ')}.`);
  if (c.speciesId === 'sith_pureblood') {
    if (o.pureblood === 'refused') errors.push(`A Sith Pureblood can't take the start "${o.title}" in ${yearWords(c.bby ?? o.fromBby)}: Purebloods need an Imperial origin (D-401 [10]).`);
    else if (o.pureblood === 'imperialBornOnly' && !c.imperialBorn) errors.push(`A Sith Pureblood takes the start "${o.title}" only as an Imperial-born defector (mark the character Imperial-born).`);
  }
  if (alienApplies(o, c)) {
    if (o.alien === 'refused') errors.push(`The start "${o.title}" is the Empire's regular forces, which admit only Humans in ${yearWords(c.bby ?? o.fromBby)} (aliens are admitted after Ilum, 3,640). As a non-Human, ${ALIEN_ROUTES} (D-388 [10]).`);
    else if (o.alien === 'slaveBornRoute') errors.push(`The start "${o.title}" is for Humans and Sith Purebloods. An alien Force-sensitive in the Empire takes the slave-born route to Korriban (D-388 [10], D-411 [6]).`);
    else if (o.alien === 'chissLiaison' && c.speciesId !== 'chiss') errors.push(`The start "${o.title}" is the Imperial Navy, which takes no aliens in ${yearWords(c.bby ?? o.fromBby)} except Chiss liaisons from the Ascendancy. As a non-Human, ${ALIEN_ROUTES} (D-388 [10]).`);
  }
  return errors;
}
