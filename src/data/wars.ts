// The wars (opt-2 A1; D-438: one dated list). Read by the NPC generator (war years), the traits (War veteran, the quiz's
// first battle), the economy (military goods in wartime) and the ranks (wartime for the character's side). Years in BBY,
// negative = ABY, as the lore's dated lists. Each war's factions are the game's faction ids (entities.config FACTIONS):
// the Galactic Empire and the later Imperial states read as sithEmpire, the Alliance, the New Republic and the Galactic
// Alliance as republic, the Confederacy (both of them) as independent (the shipBattles.config CLASS_SIDES reading). The
// faction assignments are listed for Jared's check in reports/opt-2.md; the ones marked "reading" are not stated as such in
// the lore files.

export interface War {
  id: string;
  name: string;
  /** First year of the war (BBY; negative = ABY). */
  fromBby: number;
  /** Last year of the war (BBY; negative = ABY). */
  toBby: number;
  /** The factions that fought it (entities.config faction ids). */
  factions: readonly string[];
  source: string;
}

export const WARS: readonly War[] = [
  {
    id: 'greatHyperspaceWar', name: 'the Great Hyperspace War', fromBby: 5000, toBby: 4999,
    factions: ['republic', 'jediOrder', 'sithEmpire', 'sith'],
    source: 'SW_Timeline_5000_3997BBY; SW_Characters_03 (Naga Sadow\'s Sith Empire against the Republic and the Jedi)',
  },
  {
    id: 'greatSithWar', name: 'the Great Sith War', fromBby: 4000, toBby: 3996,
    factions: ['republic', 'jediOrder', 'sith', 'mandalorians'],
    source: 'SW_Characters_04-05_GreatSithWar (4,000-3,996 BBY: Exar Kun\'s Brotherhood and the Krath; Ulic Qel-Droma led the Mandalorians after beating Mandalore the Indomitable)',
  },
  {
    id: 'mandalorianWars', name: 'the Mandalorian Wars', fromBby: 3976, toBby: 3960,
    // jediOrder: a reading. The Council kept the Order out; Revan's Jedi went to war against its word.
    factions: ['republic', 'jediOrder', 'mandalorians'],
    source: 'SW_Characters_06_MandalorianWars (3,976-3,960 BBY)',
  },
  {
    id: 'jediCivilWar', name: 'the Jedi Civil War', fromBby: 3959, toBby: 3956,
    // sith, not sithEmpire: Revan's and Malak's empire is not the Emperor's (a reading of the faction ids).
    factions: ['republic', 'jediOrder', 'sith'],
    source: 'SW_Characters_07_JediCivilWar (3,959-3,956 BBY)',
  },
  {
    id: 'greatGalacticWar', name: 'the Great Galactic War', fromBby: 3681, toBby: 3653,
    factions: ['republic', 'jediOrder', 'sithEmpire', 'sith', 'mandalorians'],
    source: 'Timeline slice Part 1 (Great Galactic War; D-01); SW_Mandalorians_GGW_Part1 (the Mandalorians fought it)',
  },
  {
    id: 'galacticWar', name: 'the Galactic War', fromBby: 3641, toBby: 3637,
    // mandalorians: a reading (the clans fought in the Empire's service in the war's early years; not stated by date in the lore files).
    factions: ['republic', 'jediOrder', 'sithEmpire', 'sith', 'mandalorians'],
    source: 'SW_Characters_09 "Cold War and Galactic War (3653-3637 BBY)": the war years the lore covers',
  },
  {
    id: 'newSithWars', name: 'the New Sith Wars', fromBby: 2000, toBby: 1000,
    factions: ['republic', 'jediOrder', 'sith'],
    source: 'SW_Characters_10_NewSithWars_DarthBane ("the thousand-year twilight struggle", c. 2,000-1,000 BBY, ending at Ruusan)',
  },
  {
    id: 'cloneWars', name: 'the Clone Wars', fromBby: 22, toBby: 19,
    // independent: the Confederacy; sith: Dooku and his Dark Acolytes (a reading).
    factions: ['republic', 'jediOrder', 'independent', 'sith'],
    source: 'SW_Timeline_32_19BBY; SW_Characters_12_CloneWars; economy lore (22-19 BBY)',
  },
  {
    id: 'galacticCivilWar', name: 'the Galactic Civil War', fromBby: 0, toBby: -4,
    factions: ['republic', 'sithEmpire'],
    source: 'SW_Timeline_19BBY_4ABY (the Alliance against the Empire)',
  },
  {
    id: 'yuuzhanVongWar', name: 'the Yuuzhan Vong War', fromBby: -25, toBby: -29,
    // sithEmpire: the Imperial Remnant fought at Ithor (25 ABY) and joined the Alliance after Bastion (28 ABY).
    factions: ['republic', 'jediOrder', 'sithEmpire'],
    source: 'SW_Timeline_25_44ABY; SW_Characters_15_NewJediOrder_YuuzhanVongWar (Pellaeon)',
  },
  {
    id: 'secondGalacticCivilWar', name: 'the Second Galactic Civil War', fromBby: -40, toBby: -41,
    factions: ['republic', 'jediOrder', 'independent', 'sithEmpire', 'mandalorians'],
    source: 'SW_Characters_16_LegacyOfTheForce (the Galactic Alliance against the Confederation, with the Imperial Remnant and the Mandalorians)',
  },
  {
    id: 'sithImperialWar', name: 'the Sith-Imperial War', fromBby: -127, toBby: -130,
    factions: ['republic', 'jediOrder', 'sithEmpire', 'sith'],
    source: 'SW_Characters_18_LegacyEra (the Fel Empire against the Galactic Alliance and the Jedi; Krayt\'s One Sith)',
  },
];

/** The wars running in a year (as a signed year: negative = BBY). */
export const warsInYear = (year: number): War[] => WARS.filter((w) => year >= -w.fromBby && year <= -w.toBby);

/** Whether a faction is at war in a year (signed). */
export const factionAtWar = (faction: string | null, year: number): boolean => faction !== null && warsInYear(year).some((w) => w.factions.includes(faction));

/**
 * The age war years are served from (invented, the veteran age): the character's form (character creation), the traits'
 * War veteran gate and the quiz's first battle (m8-fixes D1, m8-audit A3). One constant (opt-2 A1; was VETERAN_AGE and
 * WAR_SERVICE_FROM_AGE).
 */
export const WAR_SERVICE_FROM_AGE = 14;

/**
 * The share of a war year a generated NPC counts, by archetype (Jared, 26 Nov 2026, opt-2 A2): front-line roles every war
 * year, support roles half, non-combat roles none. Jared's rulings: Jedi Guardians and Sentinels 1, Consulars 0.5; scholars,
 * archivists and healers 0 (no posting state exists for an NPC, so "unless a posting is recorded" has nothing to read yet).
 * The rest are a proposal (reports/opt-2.md): the Sith Warrior front line, the Inquisitor support; soldiers, Mandalorians,
 * warriors, pilots and officers front line; agents, bounty hunters and smugglers half; everyone else none.
 */
export const WAR_YEAR_SHARE: Readonly<Record<string, number>> = {
  jediGuardian: 1,
  jediSentinel: 1,
  jediConsular: 0.5,
  sithWarrior: 1,
  sithInquisitor: 0.5,
  soldier: 1,
  mandalorian: 1,
  warrior: 1,
  yuuzhanVongWarrior: 1,
  sniper: 1,
  officer: 1,
  navalOfficer: 1,
  starfighterPilot: 1,
  shipGunner: 1,
  intelAgent: 0.5,
  bountyHunter: 0.5,
  smuggler: 0.5,
};
