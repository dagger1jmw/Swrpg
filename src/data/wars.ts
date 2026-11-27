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
  /**
   * A faction that fought only part of the war (m9-missions A1d: the Jedi Order in the Galactic Civil War from Luke's academy):
   * its own first and last years, inside the war's. A faction not listed here fought the whole war.
   */
  factionSpans?: Readonly<Record<string, { fromBby?: number; toBby?: number }>>;
  /**
   * Total or limited (Jared, 27 Nov 2026, m9-missions B5a). In a total war Jedi Knights and Masters (and soldiers) are posted to a
   * front by default; in a limited war and in peace they go out on missions from home and come back.
   */
  intensity: 'total' | 'limited';
  source: string;
}

export const WARS: readonly War[] = [
  {
    id: 'greatHyperspaceWar', name: 'the Great Hyperspace War', fromBby: 5000, toBby: 4999,
    factions: ['republic', 'jediOrder', 'sithEmpire', 'sith'],
    // limited: a reading (a short invasion, beaten back within the year).
    intensity: 'limited',
    source: 'SW_Timeline_5000_3997BBY; SW_Characters_03 (Naga Sadow\'s Sith Empire against the Republic and the Jedi)',
  },
  {
    id: 'greatSithWar', name: 'the Great Sith War', fromBby: 4000, toBby: 3996,
    factions: ['republic', 'jediOrder', 'sith', 'mandalorians'],
    // limited: a reading, flagged for Jared (the Order fought it at its own heart).
    intensity: 'limited',
    source: 'SW_Characters_04-05_GreatSithWar (4,000-3,996 BBY: Exar Kun\'s Brotherhood and the Krath; Ulic Qel-Droma led the Mandalorians after beating Mandalore the Indomitable)',
  },
  {
    id: 'mandalorianWars', name: 'the Mandalorian Wars', fromBby: 3976, toBby: 3960,
    // No jediOrder (Jared, 27 Nov 2026, m9-missions A1a): the Council kept the Order out. Jedi who followed Revan count through
    // their own record. limited: a reading (the Order stayed out).
    factions: ['republic', 'mandalorians'],
    intensity: 'limited',
    source: 'SW_Characters_06_MandalorianWars (3,976-3,960 BBY)',
  },
  {
    id: 'jediCivilWar', name: 'the Jedi Civil War', fromBby: 3959, toBby: 3956,
    // sith, not sithEmpire: Revan's and Malak's empire is not the Emperor's (a reading of the faction ids).
    factions: ['republic', 'jediOrder', 'sith'],
    // limited: a reading, flagged for Jared.
    intensity: 'limited',
    source: 'SW_Characters_07_JediCivilWar (3,959-3,956 BBY)',
  },
  {
    id: 'greatGalacticWar', name: 'the Great Galactic War', fromBby: 3681, toBby: 3653,
    factions: ['republic', 'jediOrder', 'sithEmpire', 'sith', 'mandalorians'],
    intensity: 'total',
    source: 'Timeline slice Part 1 (Great Galactic War; D-01); SW_Mandalorians_GGW_Part1 (the Mandalorians fought it)',
  },
  {
    id: 'galacticWar', name: 'the Galactic War', fromBby: 3641, toBby: 3637,
    // mandalorians: on the Empire's side under Mandalore the Vindicated (Jared, 27 Nov 2026, m9-missions A1b). The list names who
    // fought, not which side.
    factions: ['republic', 'jediOrder', 'sithEmpire', 'sith', 'mandalorians'],
    intensity: 'total',
    source: 'SW_Characters_09 "Cold War and Galactic War (3653-3637 BBY)": the war years the lore covers; Mandalore the Vindicated (Jared)',
  },
  // The New Sith Wars in their dated campaigns, with peace between them (Jared, 27 Nov 2026, m9-missions A1f; was one war of a
  // thousand years). SW_Timeline_2000_1000BBY Parts 1-2.
  {
    id: 'newSithWarsAscendancy', name: 'the New Sith Wars: the Schism and the Dark Underlord', fromBby: 2000, toBby: 1750,
    // A reading: the lore dates the war's start (Darth Ruin, c. 2,000) and the Dark Underlord's death at Malrev IV (1,750) and says
    // "the first quarter of the war was dominated by the Dark Underlord"; nothing between is dated, so the span is that quarter.
    factions: ['republic', 'jediOrder', 'sith'],
    intensity: 'limited',
    source: 'SW_Timeline_2000_1000BBY_Part1 (2,000-1,501: the Fourth Great Schism, the Black Knights, the First Battle of Malrev IV, 1,750)',
  },
  {
    id: 'newSithWarsRepublicOffensive', name: 'the New Sith Wars: Gap Nine to Mizra', fromBby: 1500, toBby: 1466,
    factions: ['republic', 'jediOrder', 'sith'],
    intensity: 'limited',
    source: 'SW_Timeline_2000_1000BBY_Part1 (c. 1,500: the Republic drafts troops, Gap Nine, Corphelion, King\'s Galquek; 1,466: the Battle of Mizra)',
  },
  {
    id: 'sictisWars', name: 'the Sictis Wars', fromBby: 1250, toBby: 1230,
    factions: ['republic', 'jediOrder', 'sith'],
    intensity: 'limited',
    source: 'SW_Timeline_2000_1000BBY_Part1 (1,250-1,230: Belia Darzu\'s technobeasts against the Republic and the Jedi)',
  },
  {
    id: 'grumaniCampaigns', name: 'the New Sith Wars: the Grumani campaigns', fromBby: 1042, toBby: 1032,
    // The Sith civil war from c. 1,100 is the Sith against each other (the Republic "made no attempt to win it back"); the Republic
    // and the Jedi are at war again from Chagras' campaign (1,042) to Operation Influx and Vanahame (1,032).
    factions: ['republic', 'jediOrder', 'sith'],
    intensity: 'limited',
    source: 'SW_Timeline_2000_1000BBY_Part1 (1,042: Chagras launches a campaign against the Republic, Aquilaris; 1,032: Operation Influx, Chelloa, Vanahame)',
  },
  {
    id: 'lightAndDarknessWar', name: 'the Light and Darkness War (the Ruusan campaign)', fromBby: 1010, toBby: 1000,
    factions: ['republic', 'jediOrder', 'sith'],
    intensity: 'total',
    source: 'SW_Timeline_2000_1000BBY_Part2 (1,010: the Brotherhood of Darkness and the Army of Light; the seven battles of Ruusan to 1,000)',
  },
  {
    id: 'cloneWars', name: 'the Clone Wars', fromBby: 22, toBby: 19,
    // independent: the Confederacy; sith: Dooku and his Dark Acolytes; mandalorians: Spar's Protectors fought with the Confederacy
    // (Jared, 24 Nov 2026; m9-missions A1c).
    factions: ['republic', 'jediOrder', 'independent', 'sith', 'mandalorians'],
    intensity: 'total',
    source: 'SW_Timeline_32_19BBY; SW_Characters_12_CloneWars; economy lore (22-19 BBY)',
  },
  {
    id: 'galacticCivilWar', name: 'the Galactic Civil War', fromBby: 2, toBby: -19,
    // From the Corellian Treaty (2 BBY) to the Pellaeon-Gavrisom Treaty (19 ABY) (Jared, 27 Nov 2026, m9-missions A1d); the Jedi
    // Order counts from Luke's academy (about 11 ABY).
    factions: ['republic', 'sithEmpire', 'jediOrder'],
    factionSpans: { jediOrder: { fromBby: -11 } },
    // limited: a reading, flagged (a rebellion and a long war of attrition, not every Knight at a front).
    intensity: 'limited',
    source: 'SW_Timeline_19BBY_4ABY; SW_Timeline_4_25ABY (the Corellian Treaty, 2 BBY; the Pellaeon-Gavrisom Treaty, 19 ABY; the Jedi academy, 11 ABY)',
  },
  {
    id: 'yuuzhanVongWar', name: 'the Yuuzhan Vong War', fromBby: -25, toBby: -29,
    // sithEmpire: the Imperial Remnant fought at Ithor (25 ABY) before it formally joined after Bastion (28 ABY); kept from 25
    // (Jared, 27 Nov 2026, m9-missions A1e).
    factions: ['republic', 'jediOrder', 'sithEmpire'],
    intensity: 'total',
    source: 'SW_Timeline_25_44ABY; SW_Characters_15_NewJediOrder_YuuzhanVongWar (Pellaeon)',
  },
  {
    id: 'secondGalacticCivilWar', name: 'the Second Galactic Civil War', fromBby: -40, toBby: -41,
    factions: ['republic', 'jediOrder', 'independent', 'sithEmpire', 'mandalorians'],
    intensity: 'limited',
    source: 'SW_Characters_16_LegacyOfTheForce (the Galactic Alliance against the Confederation, with the Imperial Remnant and the Mandalorians)',
  },
  {
    id: 'sithImperialWar', name: 'the Sith-Imperial War', fromBby: -127, toBby: -130,
    factions: ['republic', 'jediOrder', 'sithEmpire', 'sith'],
    // limited: a reading, flagged for Jared (it ends with the Alliance broken and the Jedi in hiding).
    intensity: 'limited',
    source: 'SW_Characters_18_LegacyEra (the Fel Empire against the Galactic Alliance and the Jedi; Krayt\'s One Sith)',
  },
];

/** A faction's own years in a war (signed years: negative = BBY), or null when it did not fight it. */
export function factionWarYears(w: War, faction: string): { from: number; to: number } | null {
  if (!w.factions.includes(faction)) return null;
  const span = w.factionSpans?.[faction];
  return { from: -(span?.fromBby ?? w.fromBby), to: -(span?.toBby ?? w.toBby) };
}

/** The wars running in a year (as a signed year: negative = BBY). */
export const warsInYear = (year: number): War[] => WARS.filter((w) => year >= -w.fromBby && year <= -w.toBby);

/** Whether a faction is at war in a year (signed). */
export const factionAtWar = (faction: string | null, year: number): boolean => factionWar(faction, year) !== null;

/** The war a faction fights in a year (signed), by its own years in it; null in peace. A total war first when two overlap. */
export function factionWar(faction: string | null, year: number): War | null {
  if (faction === null) return null;
  const at = warsInYear(year).filter((w) => {
    const y = factionWarYears(w, faction);
    return y !== null && year >= y.from && year <= y.to;
  });
  return at.find((w) => w.intensity === 'total') ?? at[0] ?? null;
}

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
 * The Inquisitor's half share is approved (Jared, 27 Nov 2026, m9-missions A2). The rest are a proposal (reports/opt-2.md): the
 * Sith Warrior front line; soldiers, Mandalorians,
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
