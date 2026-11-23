// Era rules the narrator can't read from the lore index (D-401 [8]): the topical lore files are not indexed (D-81), so
// their rulings for a year reach the narrator through this table, sent only when a rule's place is in the current
// location chain or its faction is in play (the character's side, or someone present). Years are BBY as positive
// numbers, both ends inclusive. Each rule is one or two short sentences, written as instructions.
import type { FactionId } from './entities.config';

export interface EraRule {
  id: string;
  fromBby: number;
  toBby: number;
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
    fromBby: 3681,
    toBby: 3653,
    places: ['Coruscant'],
    text: 'Security: Senate Security Officers and the CSF in the Senate District, the CSF in the mid-levels, the Underworld Police below. "Senate guards" may be said informally; the formal Senate Guard (blue robes, Senate Commandos) is a later era and does not appear.',
    source: 'D-380 [7], [8]; D-381',
  },
  {
    id: 'coruscant-places',
    fromBby: 3681,
    toBby: 3653,
    places: ['Coruscant'],
    text: 'Coruscant keeps the strict rule: name only places on record for these years (no market kiosks, no market air-taxi station; generic air taxis and turbolifts are fine). The underworld is the Migrant Merchants\' Guild, the Exchange and Hutt money; small local gangs may be invented, but no galaxy-wide syndicate.',
    source: 'D-380 [10], [12]; D-365',
  },
  {
    id: 'nar-shaddaa-districts',
    fromBby: 3681,
    toBby: 3653,
    places: ['Nar Shaddaa'],
    text: 'Districts that may appear (unconfirmed in these years): the Corellian, Nikto and Duros Sectors, the Promenade, the Red Light Sector, Network Access. Not yet existing: Shadow Town, the Bounty Brokers Association, the Republic Embassy, the Shadow Syndicate.',
    source: 'D-384 [7]',
  },
  {
    id: 'tatooine-rule',
    fromBby: 3681,
    toBby: 3653,
    places: ['Tatooine'],
    text: 'Tatooine is not Hutt-ruled in these years. The Exchange holds Mos Ila, founded during the war, which may be newly founded or not yet taken [unclear].',
    source: 'D-384 [8]',
  },
  {
    id: 'jedi-life',
    fromBby: 3681,
    toBby: 3653,
    factions: ['jediOrder'],
    text: 'Jedi of this era: Padawans wear plain tunics and have no braid; a Padawan serves a sequence of Masters, with field postings to specialists, and Knighthood comes in the field. Recruits are normally young children; older recruits are exceptions.',
    source: 'D-378 [1], [6]; D-379',
  },
  {
    id: 'korriban-academy',
    fromBby: 3681,
    toBby: 3654,
    places: ['Korriban'],
    text: 'At the Academy acolytes wear plain dark robes (invented) and carry a warblade; the lightsaber comes with apprenticeship. Staff wear black and red. Harkun and Zash are not on the staff yet; other staff may be invented.',
    source: 'D-376',
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

/** The rules relevant at `bby` for these place names and the factions in play. */
export function eraRulesAt(bby: number, placeNames: readonly string[], factions: readonly string[]): EraRule[] {
  return ERA_RULES.filter(
    (r) =>
      bby <= r.fromBby &&
      bby >= r.toBby &&
      (r.always === true ||
        (r.places ?? []).some((p) => placeNames.some((n) => mentions(n, p))) ||
        (r.factions ?? []).some((f) => factions.includes(f))),
  );
}
