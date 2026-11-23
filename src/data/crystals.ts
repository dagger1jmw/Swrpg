// Lightsaber crystals (D-442; SW_Lightsaber_Crystals.md, the single source of truth for crystal types, D-439). One
// dated list (D-438): what is obtainable is resolved from the year and the place. Years are calendar years
// (negative = BBY, positive = ABY).
//
// Rules (Jared, 2026-11-22; SW_Lightsaber_Crystals decisions 1-3):
// - A natural crystal with no dated limit is obtainable at any date from its source world(s). Its earliest dated use
//   (`firstDatedUse`) is a citation only, never a gate.
// - Dated limits restrict: `availableFrom` (synthetic and unique crystals from their first dated year; a natural crystal
//   only when its source is dated: Lambent, a Yuuzhan Vong harvest, from Vong contact c. 25 ABY), `lostAfter` (Ruusan),
//   `rare`, `controlled`, `extinct` (the source creature).
// - Rows the file marks NOT USED (19 Star Wars Galaxies and Force Unleashed loot crystals with no story foundation:
//   Katak, Vexxtal, Amplification, Impact, Incineration, Corrosion, Life Drain, Blackwing and the 11 Galaxies named
//   crystals) are left out of this table.
// - TYPE ONLY rows (Lava, Permafrost, Windu's Guile) are natural crystal types from their source worlds, not named
//   items. Natural and synthetic rows are types (`item: 'type'`); unique rows are named items (`item: 'named'`).

export type CrystalKind = 'natural' | 'synthetic' | 'unique';

export interface CrystalLimits {
  /** Obtainable only from this year on. */
  availableFrom?: number;
  /** No longer obtainable after this year. */
  lostAfter?: number;
  rare?: true;
  /** Its trade or use is controlled (by whom: `notes`). */
  controlled?: true;
  /** The source creature is extinct: only fossil finds remain. */
  extinct?: true;
}

export interface Crystal {
  id: string;
  name: string;
  kind: CrystalKind;
  item: 'type' | 'named';
  /** Source world(s); empty when the file names none. */
  worlds: readonly string[];
  /** Where it comes from, in the file's words. */
  origin: string;
  effect: string;
  limits: CrystalLimits;
  /** The earliest dated use (citation aid only, never a gate for a natural crystal). */
  firstDatedUse?: number;
  /** A TYPE ONLY row that is another type under a later name: the type it is, and the first year the name is used. */
  typeOf?: { id: string; nameFrom: number };
  notes?: string;
  source: string;
}

const W = 'https://starwars.fandom.com/wiki/';

export const CRYSTALS: readonly Crystal[] = [
  { id: 'adegan', name: 'Adegan crystals (family)', kind: 'natural', item: 'type', worlds: ['Adega system'], origin: 'the Adega system', effect: 'Various colours; the commonest crystal of the Old Republic, used by Jedi for thousands of years.', limits: {}, source: `${W}Adegan_crystal/Legends` },
  { id: 'relacite', name: 'Relacite (Adegan)', kind: 'natural', item: 'type', worlds: ['Adega system', 'Mygeeto', 'Ilum'], origin: 'Adega; also identified on Mygeeto and in the Old Republic mines on Ilum', effect: 'A relatively common Adegan variant.', limits: {}, firstDatedUse: -3653, source: `${W}Relacite/Legends` },
  { id: 'danite', name: 'Danite (Adegan)', kind: 'natural', item: 'type', worlds: ['Adega system'], origin: 'the Adegan family', effect: 'Medium rarity; channels energy less well than mephite but better than relacite.', limits: {}, source: `${W}Danite/Legends` },
  { id: 'kathracite', name: 'Kathracite (Adegan)', kind: 'natural', item: 'type', worlds: ['Adega system'], origin: 'the Adegan family', effect: 'Used by Jedi for millennia.', limits: {}, firstDatedUse: -3653, source: `${W}Kathracite_crystal/Legends` },
  { id: 'mephite', name: 'Mephite (Adegan)', kind: 'natural', item: 'type', worlds: ['Adega system'], origin: 'the Adegan family', effect: 'Used by Jedi for millennia.', limits: {}, firstDatedUse: -3653, source: `${W}Mephite_crystal/Legends` },
  { id: 'pontite', name: 'Pontite (Adegan)', kind: 'natural', item: 'type', worlds: ['Adega system'], origin: 'the Adegan family', effect: 'The rarest and most powerful Adegan form.', limits: { rare: true }, firstDatedUse: -4000, source: `${W}Pontite_crystal/Legends` },
  { id: 'ilum', name: 'Ilum crystal', kind: 'natural', item: 'type', worlds: ['Ilum'], origin: "Ilum's crystal caves (Unknown Regions)", effect: 'Similar in structure to mephite and pontite, in whole caves of high quality; always blue or green.', limits: {}, firstDatedUse: -3951, notes: 'Almost the only Jedi crystal from 1000 BBY to the Great Jedi Purge.', source: `${W}Ilum_crystal/Legends` },
  { id: 'dantari', name: 'Dantari (Dantooine) crystal', kind: 'natural', item: 'type', worlds: ['Dantooine'], origin: 'kinrath eggs, Dantooine', effect: "Some reflect the wielder's alignment; helps recover spent Force energy. Popular with the Jedi before Ilum's better source was found.", limits: {}, firstDatedUse: -3956, source: `${W}Dantari_crystal/Legends` },
  { id: 'synthetic', name: 'Synthetic crystal', kind: 'synthetic', item: 'type', worlds: [], origin: 'made in a furnace or compressor, often with the Force', effect: 'Usually red or silver; a slightly stronger blade when charged by the dark side.', limits: { availableFrom: -3961 }, notes: 'Developed between 6900 and 3961 BBY (certain by 3961); standard for the Sith from the Sith Emperor\'s reign.', source: `${W}Synthetic_lightsaber_crystal/Legends` },
  { id: 'kunda-stone', name: 'Kunda stone', kind: 'natural', item: 'type', worlds: ['Kadril'], origin: 'Kadril', effect: 'Added to other crystals, gives a broader beam; also has medical and communications uses.', limits: {}, firstDatedUse: -3955, notes: 'Used for many lightsabers in the Dark Wars (c. 3955-3951 BBY).', source: `${W}Lightsaber_crystal/Legends` },
  { id: 'bondar', name: 'Bondar', kind: 'natural', item: 'type', worlds: [], origin: 'not stated', effect: 'Converts blade energy so it stuns, not cuts; used in training sabers.', limits: {}, firstDatedUse: -3956, source: `${W}Bondar` },
  { id: 'damind', name: 'Damind', kind: 'natural', item: 'type', worlds: ['Daminia'], origin: 'Daminia only (mineral form: damindium)', effect: 'Wider, longer blade; easier to deflect blaster fire. Used in Sith lightsabers.', limits: {}, firstDatedUse: -3956, source: `${W}Damind` },
  { id: 'firkrann', name: 'Firkrann', kind: 'natural', item: 'type', worlds: ['Rafa V'], origin: 'Rafa V', effect: 'Heavy; gives an electrical charge, devastating to droids. Used by Dark Lords of the Sith.', limits: {}, firstDatedUse: -3956, source: `${W}Firkrann` },
  { id: 'eralam', name: 'Eralam', kind: 'natural', item: 'type', worlds: ['Erai'], origin: 'the third moon of Erai (mineral form: eraladium)', effect: 'A clear, superior blade.', limits: { rare: true }, firstDatedUse: -3956, notes: 'Rare after ancient Sith orbital bombardments of the moon (undated).', source: `${W}Eralam` },
  { id: 'jenruax', name: 'Jenruax', kind: 'natural', item: 'type', worlds: ['Fyrth system'], origin: 'refined opila, cleansed of impurities', effect: 'More agile blade; better at deflecting blaster fire.', limits: {}, firstDatedUse: -3956, source: `${W}Jenruax` },
  { id: 'luxum', name: 'Luxum', kind: 'natural', item: 'type', worlds: ['Ambria'], origin: 'Lake Natth, Ambria, formed from minerals and Force energy through long, deep meditation', effect: 'Ion effect, more effective against droids.', limits: {}, firstDatedUse: -3956, source: `${W}Luxum` },
  { id: 'nextor', name: 'Nextor', kind: 'natural', item: 'type', worlds: ["M'haeli"], origin: "the mountains of M'haeli", effect: 'A highly volatile but powerful blade.', limits: {}, firstDatedUse: -3956, source: `${W}Nextor` },
  { id: 'opila', name: 'Opila', kind: 'natural', item: 'type', worlds: ['Fyrth system'], origin: 'an asteroid field in the Fyrth system', effect: 'An intense blade that cuts most materials quickly.', limits: {}, firstDatedUse: -3956, source: `${W}Opila` },
  { id: 'sapith', name: 'Sapith', kind: 'natural', item: 'type', worlds: ['Lwhekk'], origin: 'excreted once every eleven years by the volice worm of Lwhekk; after its extinction only from fossils', effect: 'Serpent-scale shape; an intense blade.', limits: { rare: true, extinct: true }, firstDatedUse: -3956, notes: 'The worm is extinct (undated): only fossil finds.', source: `${W}Sapith` },
  { id: 'phond', name: 'Phond', kind: 'natural', item: 'type', worlds: [], origin: 'a rare byproduct of impurities bonding during certain alloy-making', effect: 'A fiercely burning blade.', limits: { rare: true }, firstDatedUse: -3956, source: `${W}Phond` },
  { id: 'rubat', name: 'Rubat', kind: 'natural', item: 'type', worlds: ['Phemis'], origin: 'Phemis only', effect: 'A sharper, better-defined blade that is easier to track; faster attacks.', limits: { controlled: true }, firstDatedUse: -3956, notes: 'Use controlled by the Galactic Senate, later the Empire (undated; gray-area source).', source: `${W}Rubat` },
  { id: 'sigil', name: 'Sigil', kind: 'natural', item: 'type', worlds: ['Sigil system'], origin: 'the Sigil system', effect: 'Brownish-yellow; costly; a searing, more damaging blade. Owned by the Jedi Nemo and by Marka Ragnos.', limits: {}, firstDatedUse: -5000, source: `${W}Sigil_(crystal)` },
  { id: 'upari', name: 'Upari', kind: 'natural', item: 'type', worlds: [], origin: 'scattered in orbit of forest worlds', effect: 'Brittle but versatile; a Master can draw many effects from it. Kashyyyk Wookiee clans cut it for jewellery, which makes it stronger.', limits: {}, firstDatedUse: -3956, source: `${W}Upari` },
  { id: 'krayt-dragon-pearl', name: 'Krayt dragon pearl', kind: 'natural', item: 'type', worlds: ['Tatooine'], origin: 'the gizzards of krayt dragons', effect: 'Blue, green, red, white or black; usable after difficult cleaning and preparation.', limits: {}, firstDatedUse: -3956, source: `${W}Krayt_dragon_pearl/Legends` },
  { id: 'solari', name: 'Solari crystal', kind: 'natural', item: 'type', worlds: [], origin: 'not stated', effect: "Light orange; one of the Order's oldest and most powerful. Only a Jedi pure in spirit can use it, and it can't be corrupted.", limits: { rare: true }, firstDatedUse: -3956, notes: "The file marks it N/U: Ood Bnar's Solari is unique; others are rarer than average.", source: `${W}Solari_crystal/Legends` },
  { id: 'heart-of-the-guardian', name: 'Heart of the Guardian', kind: 'unique', item: 'named', worlds: ['Yavin 4'], origin: 'rediscovered on Yavin 4 by Suvam Tan (sold at Yavin Station)', effect: 'Bronze blade with a yellow core; possibly used by the redeemed Revan.', limits: { availableFrom: -3956 }, notes: 'Rediscovered before the Jedi Civil War (on sale in 3956 BBY).', source: `${W}Heart_of_the_Guardian` },
  { id: 'mantle-of-the-force', name: 'Mantle of the Force', kind: 'unique', item: 'named', worlds: ['Yavin 4'], origin: 'rediscovered by Suvam Tan (Yavin Station)', effect: "Cyan; amplifies whatever the lightsaber's other crystals do.", limits: { availableFrom: -3956 }, notes: 'Bought by Revan near the end of the Star Forge search (3956 BBY).', source: `${W}Mantle_of_the_Force` },
  { id: 'corusca-gem', name: 'Corusca gem', kind: 'natural', item: 'type', worlds: ['Yavin Prime'], origin: 'gas giant atmospheres, such as Yavin Prime', effect: 'Extremely rare and valuable.', limits: { rare: true }, source: `${W}Corusca_gem/Legends` },
  { id: 'kaiburr', name: 'Kaiburr crystal', kind: 'unique', item: 'named', worlds: ['Mimban'], origin: 'the Temple of Pomojema, Circarpous V (Mimban)', effect: "In its temple it multiplies a Force-sensitive's power a thousandfold: healing, Force connection, Force lightning for those who normally can't, and energising the tired.", limits: { availableFrom: -3951 }, source: `${W}Kaiburr_crystal` },
  { id: 'ankarres-sapphire', name: 'Ankarres Sapphire (Antares crystal)', kind: 'unique', item: 'named', worlds: [], origin: 'not stated', effect: 'Blue; legendary healing powers; one of the most potent lightsaber crystals; aids a Jedi in battle.', limits: { availableFrom: -3951 }, source: `${W}Ankarres_Sapphire` },
  { id: 'dragite', name: 'Dragite', kind: 'natural', item: 'type', worlds: ["M'haeli"], origin: "the D'olop Mountains, M'haeli", effect: 'Prized power source; a loud, resonating blade that does minor sonic damage.', limits: {}, firstDatedUse: -3951, source: `${W}Dragite_crystal` },
  { id: 'hurrikaine', name: 'Hurrikaine (Hurikane)', kind: 'natural', item: 'type', worlds: ['Hurikane'], origin: 'Hurikane', effect: 'Deep blue to violet; beautiful; good at penetrating defences.', limits: {}, firstDatedUse: -3951, notes: "Mace Windu's mission there, 58 BBY.", source: `${W}Hurrikaine_crystal` },
  { id: 'kasha', name: 'Kasha', kind: 'natural', item: 'type', worlds: ['Cerea'], origin: 'Cerea (Cerean meditation crystal)', effect: "Clears the wielder's mind of distractions, even in combat. Faces scribed with patterns, possibly by Bi-Dar Tyunda.", limits: {}, firstDatedUse: -3951, source: `${W}Kasha` },
  { id: 'durindfire', name: 'Durindfire', kind: 'natural', item: 'type', worlds: ['Tatooine'], origin: 'Tatooine', effect: 'A distinctive look; few left the planet.', limits: {}, firstDatedUse: -3951, notes: 'Few left Tatooine; the Empire traded them to fund the Death Star (Galactic Civil War).', source: `${W}Durindfire_(crystal)` },
  { id: 'barab-ingot', name: 'Barab ingot', kind: 'natural', item: 'type', worlds: ['Barab I'], origin: 'inside ore on radiation-baked Barab I', effect: 'A blade burning almost to the point of losing cohesion.', limits: {}, firstDatedUse: -3951, source: `${W}Barab_ingot/Legends` },
  { id: 'velmorite', name: 'Velmorite', kind: 'natural', item: 'type', worlds: ['Velmor'], origin: 'Velmor only', effect: 'Yellow; a fine, thin blade for fluid wielding; also Velmorite energy swords.', limits: {}, firstDatedUse: -3951, source: `${W}Velmorite` },
  { id: 'ultima-pearl', name: 'Ultima-Pearl', kind: 'natural', item: 'type', worlds: ['Dac'], origin: 'the deep ocean floor of Dac', effect: 'Silvery sphere; hard to install. Used by Cilghal.', limits: {}, firstDatedUse: -3951, source: `${W}Ultima-Pearl` },
  { id: 'qixoni', name: 'Qixoni', kind: 'natural', item: 'type', worlds: [], origin: 'not stated', effect: 'Dark red, exceedingly rare; needs a firm dark side alignment to use well.', limits: { rare: true }, firstDatedUse: -3951, source: `${W}Qixoni_crystal/Legends` },
  { id: 'lorrdian-gemstone', name: 'Lorrdian gemstone', kind: 'synthetic', item: 'type', worlds: ['Lorrd'], origin: 'imbued by Force-sensitive Lorrdians', effect: "Grants something like Lorrdian kinetic reading (predicting others' actions).", limits: { availableFrom: -3951 }, notes: 'Origin in the Kanz Disorders (c. 3970-3670 BBY); the first dated use (KOTOR II) gates it.', source: `${W}Lorrdian_gemstone/Legends` },
  { id: 'ruusan', name: 'Ruusan crystal', kind: 'natural', item: 'type', worlds: ['Ruusan'], origin: 'Ruusan (Mid Rim)', effect: 'Prized for beauty and used as currency in the Core; helps a Jedi focus the Force.', limits: { lostAfter: -1000 }, firstDatedUse: -3951, notes: 'Lost after the Ruusan Reformation (c. 1000 BBY).', source: `${W}Ruusan_crystal` },
  { id: 'stygium', name: 'Stygium', kind: 'natural', item: 'type', worlds: ['Aeten II'], origin: 'Aeten II only', effect: 'Better known for cloaking devices.', limits: {}, firstDatedUse: -3951, source: `${W}Stygium/Legends` },
  { id: 'meetra-surik', name: 'Meetra Surik Crystal', kind: 'unique', item: 'named', worlds: ['Dantooine'], origin: 'a crystal formation in a Force-sensitive cave, Dantooine', effect: 'Green; bonded to Surik and grows her powers.', limits: { availableFrom: -3951 }, notes: 'Found 3951 BBY.', source: `${W}Meetra_Surik_Crystal` },
  { id: 'meditation-crystal', name: 'Meditation crystal', kind: 'natural', item: 'type', worlds: ['Tython'], origin: 'grows on Tython', effect: 'Slivers make a coherent blade; keep the wielder close to the Force in combat, saving energy.', limits: {}, firstDatedUse: -3653, source: `${W}Meditation_crystal` },
  { id: 'rainbow-gem', name: 'Rainbow gem', kind: 'natural', item: 'type', worlds: ['Gallinore'], origin: 'Gallinore (silicon-based lifeforms that take thousands of years to mature)', effect: 'Usable as a crystal. Tenel Ka used some from her tiara.', limits: {}, firstDatedUse: -3653, source: `${W}Rainbow_gem` },
  { id: 'lignan', name: 'Lignan crystal', kind: 'synthetic', item: 'type', worlds: ['Kesh'], origin: 'crafted from Lignan ore; the Lost Tribe of the Sith on Kesh', effect: "Longer-lasting, hotter blade; strengthens a dark-sider's Force powers.", limits: { availableFrom: -5000 }, notes: 'Lost Tribe era, from c. 5000 BBY on Kesh [inferred].', source: `${W}Lignan_crystal` },
  { id: 'dahgee', name: 'Dahgee crystal', kind: 'natural', item: 'type', worlds: [], origin: 'used by the Dahgee Jedi', effect: 'Zigzag blade with a dark silver core and coloured aura.', limits: {}, notes: '"The days of the Galactic Republic".', source: `${W}Dahgee_Lightsaber_crystal` },
  { id: 'etaan', name: 'Etaan crystal', kind: 'natural', item: 'type', worlds: ['Etai'], origin: 'Etai only (Mid Rim)', effect: 'Rare.', limits: { rare: true }, source: `${W}Etaan_crystal/Legends` },
  { id: 'ghostfire', name: 'Ghostfire crystal', kind: 'natural', item: 'type', worlds: [], origin: 'various Outer Rim worlds', effect: 'Translucent.', limits: {}, source: `${W}Ghostfire_crystal/Legends` },
  { id: 'banes-heart', name: "Bane's Heart", kind: 'unique', item: 'named', worlds: [], origin: 'Darth Bane to Darth Zannah', effect: 'Carmine.', limits: { availableFrom: -1000 }, notes: 'Given after the Seventh Battle of Ruusan (1000 BBY); later a Dark Jedi\'s, then Grievous\'s; recovered on Kashyyyk, 1 ABY.', source: `${W}Bane%27s_Heart_(crystal)` },
  { id: 'compressed-energy', name: 'Compressed energy crystal (CEC)', kind: 'synthetic', item: 'type', worlds: [], origin: "not stated (also used in Ves Volette's light sculptures)", effect: 'Pulsing blade with a thinner core.', limits: { availableFrom: -19 }, notes: 'Earliest dated use Coruscant Nights (19 BBY).', source: `${W}Compressed_energy_crystal` },
  { id: 'focus', name: 'Focus crystal', kind: 'natural', item: 'type', worlds: ['Dagobah', 'Cerea'], origin: "Dagobah (found by Galen Marek's clone, 1 BBY); also Kasha from Cerea", effect: 'Keeps the user in tune with the Force, especially when spending Force energy.', limits: {}, firstDatedUse: -1, source: `${W}Focus` },
  { id: 'lava', name: 'Lava crystal', kind: 'natural', item: 'type', worlds: ['Mustafar'], origin: 'volcanic worlds such as Mustafar', effect: 'Less focused; a lava-like blade that drips flame; rumoured very powerful.', limits: {}, firstDatedUse: 0, notes: 'TYPE ONLY.', source: `${W}Lava_crystal/Legends` },
  { id: 'permafrost', name: 'Permafrost crystal', kind: 'natural', item: 'type', worlds: ['Hoth'], origin: 'Hoth', effect: 'Icy blue.', limits: {}, firstDatedUse: 0, notes: 'TYPE ONLY. One held by the township of Aurilia, Dathomir, in the Galactic Civil War.', source: `${W}Permafrost_crystal/Legends` },
  { id: 'windus-guile', name: "Windu's Guile", kind: 'natural', item: 'type', worlds: ['Hurikane'], origin: 'a Hurrikaine variant', effect: 'Violet; used by both Rebel and Imperial Force-sensitives.', limits: {}, typeOf: { id: 'hurrikaine', nameFrom: -72 }, notes: "TYPE ONLY: a Hurrikaine crystal, obtainable at any date as Hurrikaine; the name is not used before Mace Windu's time (from his birth, c. 72 BBY [inferred]).", source: `${W}Windu%27s_Guile` },
  { id: 'enhancement-jewel', name: 'Enhancement jewel', kind: 'synthetic', item: 'type', worlds: ['Yavin 4'], origin: 'scavenged from Rebel equipment in the Great Temple, Yavin 4', effect: 'A spherical projector component used as a crystal by Lowbacca.', limits: { availableFrom: 23 }, source: `${W}Enhancement_jewel` },
  { id: 'lambent', name: 'Lambent', kind: 'natural', item: 'type', worlds: [], origin: 'harvested by the Yuuzhan Vong', effect: "Anakin Solo's crystal.", limits: { availableFrom: 25 }, firstDatedUse: 25, notes: 'Yuuzhan Vong-grown: available only with Vong contact, c. 25 ABY on.', source: `${W}Lambent` },
];

/** Why a crystal is or isn't obtainable in a year. */
export interface CrystalAvailability {
  obtainable: boolean;
  rare: boolean;
  controlled: boolean;
  /** Only from fossils (the source creature is extinct). */
  fossilOnly: boolean;
  reason?: 'not yet available' | 'lost';
}

/** Whether a crystal is obtainable in `year` (D-442), from its dated limits only (the place is `crystalsFromWorld`). */
export function crystalAvailability(c: Crystal, year: number): CrystalAvailability {
  const l = c.limits;
  const base = { rare: l.rare === true, controlled: l.controlled === true, fossilOnly: l.extinct === true };
  if (l.availableFrom !== undefined && year < l.availableFrom) return { ...base, obtainable: false, reason: 'not yet available' };
  if (l.lostAfter !== undefined && year > l.lostAfter) return { ...base, obtainable: false, reason: 'lost' };
  return { ...base, obtainable: true };
}

/** The name a crystal goes by in `year`: a TYPE ONLY row's later name is not used before its time (Windu's Guile). */
export function crystalNameAt(c: Crystal, year: number): string {
  if (!c.typeOf || year >= c.typeOf.nameFrom) return c.name;
  return CRYSTALS.find((x) => x.id === c.typeOf!.id)?.name ?? c.name;
}

/** The crystals obtainable in `year`. */
export function crystalsAt(year: number): Crystal[] {
  return CRYSTALS.filter((c) => crystalAvailability(c, year).obtainable);
}

/** The crystals obtainable in `year` whose source world is `world` (case-insensitive). */
export function crystalsFromWorld(world: string, year: number): Crystal[] {
  const w = world.toLowerCase();
  return crystalsAt(year).filter((c) => c.worlds.some((x) => x.toLowerCase() === w));
}
