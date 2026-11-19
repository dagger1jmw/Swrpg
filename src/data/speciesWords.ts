// Species and weapons read from the narrator's words (D-239; combat pass 3 issue 2: "a Yuuzhan Vong warrior in vonduun
// crab armor, amphistaff in hand" arrived as species unknown and fought as a soldier with a blaster rifle). The rules
// that hang on a species (Force immunity, the Vong archetype and capture rule, droid traits) need the species field;
// when the narrator leaves it out, the name and description give it.
import type { WeaponKind } from './health.config';
import type { SpeciesId } from './entities.config';

export interface SpeciesWord {
  species: SpeciesId;
  /** Whole words or phrases, case-insensitive. */
  words: RegExp;
  /** Calendar years the species is in the galaxy to be met ([from, to), negative = BBY); absent = every era. */
  eras?: readonly (readonly [number, number])[];
}

/**
 * Legends: the Yuuzhan Vong came from outside the galaxy; their scouts met Outbound Flight (27 BBY) and Vergere (29 BBY),
 * and the invasion began in 25 ABY (Timeline, 25-29 ABY). Before 30 BBY the words name nobody the story can meet.
 * Design default: from 30 BBY on.
 */
export const SPECIES_WORDS: readonly SpeciesWord[] = [
  { species: 'yuuzhanVong', words: /\b(?:yuuzhan[- ]vong|vonduun|amphistaffs?|coralskippers?|vong (?:warrior|warriors|commander|priest|shaper|war ?master|subaltern|intendant))\b/i, eras: [[-30, 1000]] },
  { species: 'hutt', words: /\bhutts?\b/i },
  { species: 'toydarian', words: /\btoydarians?\b/i },
  { species: 'droid', words: /\b(?:droid|droids|automaton|automatons)\b/i },
  { species: 'wookiee', words: /\bwookiees?\b/i },
  { species: 'twilek', words: /\btwi'?leks?\b/i },
  { species: 'zabrak', words: /\bzabraks?\b|\biridonian\b/i },
  { species: 'trandoshan', words: /\btrandoshans?\b/i },
  { species: 'rodian', words: /\brodians?\b/i },
  { species: 'gamorrean', words: /\bgamorreans?\b/i },
  { species: 'jawa', words: /\bjawas?\b/i },
  { species: 'monCalamari', words: /\bmon ?calamari\b|\bmon cal\b/i },
  { species: 'chiss', words: /\bchiss\b/i },
  { species: 'cathar', words: /\bcathars?\b/i },
  { species: 'mirialan', words: /\bmirialans?\b/i },
  { species: 'togruta', words: /\btogrutas?\b/i },
  { species: 'kelDor', words: /\bkel ?dors?\b/i },
  { species: 'bothan', words: /\bbothans?\b/i },
  { species: 'duros', words: /\bduros\b/i },
  { species: 'nautolan', words: /\bnautolans?\b/i },
  { species: 'ithorian', words: /\bithorians?\b/i },
  { species: 'rattataki', words: /\brattataki\b/i },
  { species: 'sithPureblood', words: /\bsith pureblood\b/i },
  { species: 'miraluka', words: /\bmiraluka\b/i },
  { species: 'echani', words: /\bechani\b/i },
  { species: 'iktotchi', words: /\biktotchi\b/i },
  { species: 'cerean', words: /\bcereans?\b/i },
  { species: 'arkanian', words: /\barkanians?\b/i },
];

/** The species the narrator's own species field is trusted over the words for. A lazy "human" is not. */
const WEAK_SPECIES: readonly string[] = ['unknown', 'other', 'human'];

const inEra = (w: SpeciesWord, year: number): boolean => !w.eras || w.eras.some(([a, b]) => year >= a && year < b);

/**
 * The species for an NPC the narrator introduces (D-239). The narrator's field stands unless it is unknown, other or
 * human and the words say otherwise: the name decides first (a "Yuuzhan Vong warrior" is one whatever the field says,
 * when the field is weak), then the description (only for unknown or other: a human may wear vonduun armor as a trophy).
 * A species out of its era is not inferred, and the note says so.
 */
export function inferSpecies(input: { name: string; description: string; given: string; year: number }): { species: string; note: string | null } {
  if (!WEAK_SPECIES.includes(input.given)) return { species: input.given, note: null };
  const pick = (text: string): SpeciesWord | undefined => SPECIES_WORDS.find((w) => w.words.test(text));
  const byName = pick(input.name);
  const byDesc = input.given === 'human' ? undefined : pick(input.description);
  const hit = byName ?? byDesc;
  if (!hit || hit.species === input.given) return { species: input.given, note: null };
  const where = byName ? 'name' : 'description';
  if (!inEra(hit, input.year)) return { species: input.given, note: `"${input.name}": ${hit.species} from the ${where}, but none are met in the galaxy in ${input.year < 0 ? `${-input.year} BBY` : `${input.year} ABY`}; species kept as ${input.given}` };
  return { species: hit.species, note: `"${input.name}": species ${hit.species} from the ${where} (the narrator sent ${input.given}) (D-239)` };
}

/**
 * The weapon an NPC's description names (D-239), or null. Melee words win over a ranged default; blaster words keep a
 * ranged one. Only the unmistakable words: an amphistaff, a vibroblade, a sword, a staff, an axe, a knife or claws.
 */
export function weaponFromDescription(description: string): WeaponKind | null {
  if (/\b(?:amphistaffs?|vibro-?(?:blades?|swords?|axes?|knives|knife|staffs?)|swords?|staffs?|axes?|knives|knife|daggers?|spears?|clubs?|claws?|cortosis (?:blade|sword|staff))\b/i.test(description) && !/\b(?:light ?sabers?|saberstaff|blasters?|rifles?|pistols?)\b/i.test(description)) return 'melee';
  return null;
}
