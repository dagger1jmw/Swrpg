// The price catalog (M8 checklist item 5; docs-v2/spec/economy.md section 2). Every good and service the code can price, with
// its base in Republic credits at a Mid Rim market, and where the base comes from. Lore: Docs/SWRPG lore/SW_Economy_* (in-universe
// first, game stat as the backup, D-464); `tier` says which, and `invented` marks a base no source gives (filled from the class
// table's damage order or a neighbouring item). The credit is stable across eras: dates move prices only through events
// (economy.config.ts PRICE_EVENTS). The equipment catalog (spec 22) prices its items through `priceId` on these rows.
import { DROID_MODELS } from './droidModels';

/** How location moves the price: manufactured goods follow it in full, food and services half (economy.config LOCATION). */
export const PRICE_KINDS = ['manufactured', 'military', 'food', 'service', 'luxury'] as const;
export type PriceKind = (typeof PRICE_KINDS)[number];

/** legal: sold openly. restricted: the black market only, at its markup (economy.config BLACK_MARKET). */
export type Legality = 'legal' | 'restricted';

export interface PriceEntry {
  id: string;
  name: string;
  kind: PriceKind;
  /** Republic credits, Mid Rim, no event. */
  base: number;
  legality: Legality;
  /** in-universe (tier 1), a game stat (tier 2), or invented. */
  tier: 'lore' | 'game' | 'invented';
  source: string;
  /** Issued by the Order's quartermaster or the military (equipment spec: getting gear). */
  issued?: boolean;
}

const P = (id: string, name: string, kind: PriceKind, base: number, tier: PriceEntry['tier'], source: string, over: Partial<PriceEntry> = {}): PriceEntry => ({ id, name, kind, base, legality: 'legal', tier, source, ...over });
const R = { legality: 'restricted' as const };
const PG = 'SW_Economy_Prices_Goods';
const PS = 'SW_Economy_Prices_Ships_Weapons_Droids';
const GL = 'SW_Economy_GamePriceLists';
const CT = 'class table (m8-design-notes, Equipment)';

export const PRICE_CATALOG: readonly PriceEntry[] = [
  // ---- Food and drink ----
  P('meal', 'a cantina or diner meal', 'food', 10, 'lore', `${PG}: nelab stew 10 cr (c. 40 ABY); Dex's dinner plates 9.7-14.7 cr (c. 28-19 BBY)`),
  P('streetFood', 'street food or a snack', 'food', 4, 'lore', `${PG}: Dex's sandwiches 4.5-8.7, sides 1.7-3.7 cr`),
  P('drink', 'a cantina drink', 'food', 10, 'lore', `${PG}: two drinks at the Upper City Cantina 20 cr (Taris, 3,956)`),
  P('fineBottle', 'a bottle of fine liquor', 'luxury', 300, 'lore', `${PG}: Shashay Idlewil 300 cr; Merenzane Gold over 100; rimble-wine 1,000`),
  P('rations', "a day's travel rations", 'food', 5, 'invented', 'below a street meal (no source)'),
  // ---- Lodging and services ----
  P('roomCheap', 'a cheap room for the night', 'service', 15, 'game', `${GL} Part 9: Exovar's Emporium 10-15 cr a night (game stat)`),
  P('room', 'a decent room for the night', 'service', 100, 'lore', `${PG}: Kuari Princess cabins 50-150 cr a night [unclear]`),
  P('roomLuxury', 'a luxury suite for the night', 'luxury', 400, 'lore', `${PG}: Kuari Princess staterooms 250-450, top suites 1,000`),
  P('coverCharge', 'a club cover charge', 'service', 50, 'lore', `${PG}: the Crooked Finger 50 cr (c. 3,640)`),
  P('information', 'a tip or a piece of street information', 'service', 20, 'lore', 'SW_Economy_Wages_Bounties: information 20 creds (Kaul, 3,951)'),
  P('brokerRecords', "an information broker's records", 'service', 5000, 'lore', 'SW_Economy_Wages_Bounties: Boulad 5,000 cr for travel records (19 BBY)'),
  P('introduction', 'a fixer arranging a meeting with the powerful', 'service', 4000, 'lore', 'SW_Economy_Wages_Bounties: Sechel 4,000 cr for a meeting with a Sith Lord (3,950)'),
  P('permit', 'a visa or travel permit', 'service', 1000, 'lore', `${PG}: visas and permits 500-3,000 cr (3,951, KOTOR II)`),
  P('forgedPapers', 'forged identity papers', 'service', 3000, 'invented', `${PG} has no forgery price; the permit's top end`, R),
  P('doctor', "a doctor's treatment", 'service', 500, 'lore', `${PG}: Bastila's mother's Coruscant doctor 500 cr (3,956)`),
  P('clothes', 'a set of ordinary clothes', 'manufactured', 50, 'invented', `${PG}: no clothing prices; a Baran Do novice robe c. 100 cr`),
  P('fineClothes', 'fine clothes', 'luxury', 500, 'invented', 'ten sets of ordinary clothes (no source)'),
  // ---- Fares ----
  P('localTransit', 'a city transit fare', 'service', 2, 'lore', `${PG}: the Coruscant subway 2 Republic cr (c. 19 BBY)`),
  P('passage', 'passage to a nearby system', 'service', 500, 'lore', `${PG}: a pilot off Nar Shaddaa 500 cr (3,951)`),
  P('passageFar', 'passage across the galaxy', 'service', 9000, 'lore', `${PG}: the 9,000 cr transport Slyssk agreed (c. 3,963); Solo's charter 17,000 (0 BBY)`),
  // ---- Personal weapons (class table; damage order sets the invented bases) ----
  P('holdout', 'a hold-out blaster', 'manufactured', 300, 'game', `${GL}: hold-out blaster 200-300 cr, illegal (Saga, EotE)`, R),
  P('pistol', 'a blaster pistol', 'manufactured', 500, 'lore', `${PS}: DH-23 500 cr (Fact File)`),
  P('heavyPistol', 'a heavy blaster pistol', 'manufactured', 750, 'lore', `${PS}: DH-17 550-800 cr on the black market`, R),
  P('carbine', 'a blaster carbine', 'manufactured', 800, 'invented', `${CT}: between the pistol and the rifle`),
  P('rifle', 'a blaster rifle', 'manufactured', 1000, 'lore', `${PS}: a typical blaster rifle c. 1,000 cr legally`),
  P('heavyRifle', 'a heavy blaster rifle', 'military', 1500, 'invented', `${CT}: above the rifle`, R),
  P('sniper', 'a sniper rifle', 'military', 1500, 'game', `${GL}: Sith sniper rifle 1,500 cr (KOTOR, 3,956)`, R),
  P('lightRepeater', 'a light repeating blaster', 'military', 2000, 'lore', `${PS}: T-21 light repeating blaster 2,000 cr`, { ...R, issued: true }),
  P('heavyRepeater', 'a heavy repeating blaster', 'military', 8000, 'lore', `${PS}: E-Web 8,000 cr retail`, { ...R, issued: true }),
  P('scattergun', 'a scattergun', 'manufactured', 600, 'invented', `${CT}: a rifle's damage up close, cheaper`),
  P('disruptorPistol', 'a disruptor pistol', 'manufactured', 1500, 'invented', `${CT}: illegal`, R),
  P('disruptorRifle', 'a disruptor rifle', 'manufactured', 3000, 'invented', `${CT}: illegal`, R),
  P('sonicPistol', 'a sonic pistol', 'manufactured', 800, 'invented', CT),
  P('sonicRifle', 'a sonic rifle', 'manufactured', 1500, 'invented', CT),
  P('ionBlaster', 'an ion blaster', 'manufactured', 250, 'lore', 'SW_Weapons_Armor_AllEras: ion blaster 250 cr'),
  P('flamethrower', 'a flamethrower', 'military', 1500, 'invented', CT, R),
  P('bowcaster', 'a bowcaster', 'manufactured', 1200, 'invented', CT),
  P('slugPistol', 'a slugthrower pistol', 'manufactured', 250, 'invented', `${PS}: below the cycler rifle`),
  P('slugRifle', 'a slugthrower rifle', 'manufactured', 300, 'lore', `${PS}: cycler rifle 200-400 cr`),
  P('vibroknife', 'a vibroknife', 'manufactured', 150, 'invented', `${CT}: below the vibroblade`),
  P('vibroblade', 'a vibroblade', 'manufactured', 250, 'game', `${GL}: vibroblade 250 cr (Saga); ${PS}: vibroknuckler 200-350`),
  P('vibrosword', 'a vibrosword', 'manufactured', 800, 'invented', `${CT}: two-handed, cortosis weave in this era`),
  P('vibroAx', 'a vibro-ax', 'manufactured', 600, 'invented', CT),
  P('sword', 'a sword', 'manufactured', 300, 'invented', CT),
  P('quarterstaff', 'a quarterstaff', 'manufactured', 30, 'invented', CT),
  P('forcePike', 'a force pike', 'manufactured', 500, 'game', `${GL}: force pike 500 cr (Saga)`),
  P('electrostaff', 'an electrostaff', 'manufactured', 3000, 'game', `${GL}: electrostaff 3,000-4,500 cr (Saga, F&D)`, R),
  P('stunBaton', 'a stun baton', 'manufactured', 150, 'invented', CT),
  P('lightsaber', 'a lightsaber (black market)', 'manufactured', 20000, 'lore', `${PS}: Lauli Wahlo knew where to get one for 20,000 cr (c. 21 BBY); Jedi build their own`, R),
  P('fragGrenade', 'a fragmentation grenade', 'military', 200, 'game', `${GL}: fragmentation grenade 50-200 cr, military only (Saga, EotE)`, { ...R, issued: true }),
  P('concussionGrenade', 'a concussion grenade', 'military', 300, 'invented', `${CT}: above the frag grenade`, R),
  P('thermalDetonator', 'a thermal detonator', 'military', 2000, 'lore', `${PS}: Class-A thermal detonator 2,000 cr`, R),
  P('stunNetLauncher', 'a stun net launcher', 'manufactured', 500, 'lore', `${PS}: RL-40 500 cr; a canister of ten nets 50`),
  P('powerPack', 'a blaster power pack', 'manufactured', 25, 'game', `${GL}: power packs 10-100 cr (Droid Disabler 25 cr)`),
  // ---- Armour and shields ----
  P('blastVest', 'a blast vest', 'manufactured', 300, 'invented', `${CT}: torso only`),
  P('armorLight', 'light armour', 'manufactured', 1000, 'invented', `${CT}; below the game's combat armour`),
  P('armorMedium', 'medium armour', 'military', 5000, 'game', `${GL}: 611 Combat Armor 5,000 cr (SWAJ)`, { issued: true }),
  P('armorHeavy', 'heavy armour', 'military', 12000, 'game', `${GL}: AV-1C Combat Armor 12,000-25,000 cr`, { ...R, issued: true }),
  P('personalShield', 'a personal energy shield', 'military', 10000, 'invented', 'rare elite issue in this era (m8-design-notes, Personal shields)', R),
  // ---- Gear ----
  P('medpac', 'a medpac', 'manufactured', 500, 'lore', `${PS}: FastFlesh medpac 500-600 cr`),
  P('comlink', 'a comlink', 'manufactured', 200, 'game', `${GL}: C1 personal comlink 200 cr (A&E Guide)`),
  P('glowrod', 'a glow rod', 'manufactured', 10, 'invented', 'no source'),
  P('breathMask', 'a breath mask', 'manufactured', 50, 'game', `${GL}: Easy Breathing breath mask 50 cr`),
  P('macrobinoculars', 'macrobinoculars', 'manufactured', 100, 'game', `${GL}: 1000 Field Macrobinoculars 100 cr`),
  P('datapad', 'a datapad', 'manufactured', 100, 'lore', `${PS}: Companion2000 datapad c. 100 cr`),
  P('backpack', 'a backpack', 'manufactured', 75, 'game', `${GL}: Mk. IV Modular Backpack 75 cr [gray]`),
  P('utilityBelt', 'a utility belt', 'manufactured', 50, 'invented', 'no ordinary belt price; Calrissian\'s is a unique 3,000'),
  P('binders', 'binders', 'manufactured', 75, 'game', `${GL}: Biodegradable Binders 75 cr`),
  // m8-skills (D-513): the tool kit Repair needs for the character's own jobs.
  P('toolKit', 'a tool kit', 'manufactured', 200, 'game', `${GL}: Droid tool kit and Vehicle Tool Kit 200 cr (WEG 1987); 60-Piece Ship's Engineering tool kit 350 cr (FFG 2014)`),
  P('cyberImplant', 'a cybernetic implant', 'manufactured', 7500, 'lore', `${PG}: Beemon package implant up to 7,500 cr (c. 3,956)`),
  P('bactaTank', 'a bacta tank', 'manufactured', 100000, 'lore', `${PG}: a bacta tank alone c. 100,000 cr [unclear]; medicine is checklist item 6`),
  // ---- Medicine (checklist item 6, D-511; services are priced in medicine.config MEDICAL_PRICE) ----
  P('antidote', 'an antidote', 'manufactured', 250, 'game', `${GL} Part 7: bio-antidote package 75-500 cr (KOTOR, c. 3,951); the middle of the range`),
  P('prosthetic', 'a basic prosthetic limb', 'manufactured', 2000, 'game', `${GL} Part 8: Repli-Limb prosthetic arm or leg 2,000 cr (WEG 1998)`),
  P('prostheticHand', 'a basic prosthetic hand', 'manufactured', 1000, 'game', `${GL} Part 8: Repli-Limb prosthetic hand 1,000 cr (WEG 1998)`),
  // ---- Vehicles and droids (droids are checklist item 7) ----
  P('speeder', 'a landspeeder', 'manufactured', 10000, 'lore', `${PS}: Vanush Thriin's lot 10,000 cr a vehicle (c. 3,643)`),
  P('speederBike', 'a speeder bike', 'manufactured', 11500, 'lore', `${PS}: 88-R Nightscreamer at least 11,500 cr`),
  P('protocolDroid', 'a protocol droid', 'manufactured', 3000, 'lore', `${PS}: a 3PO unit c. 3,000 cr`),
  P('astromech', 'an astromech droid', 'manufactured', 4000, 'lore', `${PS}: R2 units 4,000-10,000 cr; T3-M4 2,000 on Taris (3,956)`),
  P('medDroid', 'a medical droid', 'manufactured', 2000, 'lore', `${PS}: MD-series c. 2,000 cr`),
  // ---- Contraband ----
  P('spice', 'a dose of spice', 'luxury', 100, 'invented', `${PG} lists spice as goods with no usable unit price`, R),
  // ---- Droid models (checklist item 7, D-512): one row for each model sold (data/droidModels.ts holds the dates and sources;
  // the generic rows above stand for the date's model of their kind). Military and assassin models only on the black market.
  ...DROID_MODELS.filter((m) => m.price !== null && !m.generic).map((m) =>
    P(`droid:${m.id}`, `a ${m.name}`, 'manufactured', m.price!, m.priceTier === 'game' ? 'game' : m.priceTier === 'lore' ? 'lore' : 'invented', `droidModels.ts: ${m.source}`, m.restricted ? R : {}),
  ),
];

export const PRICE_BY_ID: ReadonlyMap<string, PriceEntry> = new Map(PRICE_CATALOG.map((p) => [p.id, p]));

/** A droid model's designation alone ("a T3", "an R2 unit", "an HK") names its row (D-512). */
const DROID_DESIGNATIONS: Readonly<Record<string, string>> = Object.fromEntries(
  DROID_MODELS.filter((m) => m.price !== null && !m.generic)
    .map((m) => [m.name.split(' ')[0]!.toLowerCase(), `droid:${m.id}`] as const)
    .filter(([w]) => /\d/.test(w) || w === 'hk'),
);

/**
 * Plain words the narrator may use, mapped to a catalog row (an item it names maps to a generic class and never gets a price
 * from the narrator: m8-design-notes, Equipment). Matched with the catalog's own names; whole words, longest phrase first.
 */
export const PRICE_WORDS: Readonly<Record<string, string>> = {
  blaster: 'pistol', 'blaster pistol': 'pistol', 'heavy blaster': 'heavyPistol', 'blaster rifle': 'rifle', carbine: 'carbine', rifle: 'rifle',
  'sniper rifle': 'sniper', repeater: 'lightRepeater', 'e-web': 'heavyRepeater', 'hold-out': 'holdout', holdout: 'holdout', disruptor: 'disruptorPistol',
  'ion blaster': 'ionBlaster', slugthrower: 'slugPistol', 'scatter gun': 'scattergun', vibroknife: 'vibroknife', knife: 'vibroknife', vibroblade: 'vibroblade',
  blade: 'vibroblade', vibrosword: 'vibrosword', sword: 'sword', staff: 'quarterstaff', 'force pike': 'forcePike', electrostaff: 'electrostaff', baton: 'stunBaton',
  grenade: 'fragGrenade', 'thermal detonator': 'thermalDetonator', detonator: 'thermalDetonator', 'power cell': 'powerPack', 'power pack': 'powerPack',
  armor: 'armorLight', armour: 'armorLight', 'combat armor': 'armorMedium', 'combat armour': 'armorMedium', 'heavy armor': 'armorHeavy', 'heavy armour': 'armorHeavy',
  vest: 'blastVest', shield: 'personalShield', medkit: 'medpac', medpac: 'medpac', comm: 'comlink', comlink: 'comlink', 'glow rod': 'glowrod', glowrod: 'glowrod',
  'breath mask': 'breathMask', macrobinoculars: 'macrobinoculars', binoculars: 'macrobinoculars', datapad: 'datapad', pack: 'backpack', backpack: 'backpack',
  belt: 'utilityBelt', binders: 'binders', cuffs: 'binders', 'tool kit': 'toolKit', toolkit: 'toolKit', tools: 'toolKit', 'repair kit': 'toolKit', implant: 'cyberImplant', cybernetic: 'cyberImplant', 'bacta tank': 'bactaTank',
  'kolto tank': 'bactaTank', 'kolto medpac': 'medpac', 'kolto pack': 'medpac', antidote: 'antidote', antitoxin: 'antidote', antivenom: 'antidote',
  prosthetic: 'prosthetic', 'prosthetic arm': 'prosthetic', 'prosthetic leg': 'prosthetic', 'prosthetic hand': 'prostheticHand', 'cybernetic arm': 'cyberImplant',
  speeder: 'speeder', landspeeder: 'speeder', 'speeder bike': 'speederBike', swoop: 'speederBike', 'protocol droid': 'protocolDroid', astromech: 'astromech',
  'medical droid': 'medDroid', droid: 'protocolDroid', lightsaber: 'lightsaber', saber: 'lightsaber', spice: 'spice', glitterstim: 'spice',
  meal: 'meal', dinner: 'meal', lunch: 'meal', breakfast: 'meal', food: 'meal', stew: 'meal', snack: 'streetFood', 'street food': 'streetFood', drink: 'drink',
  ale: 'drink', wine: 'fineBottle', bottle: 'fineBottle', liquor: 'fineBottle', rations: 'rations', room: 'room', bunk: 'roomCheap', 'cheap room': 'roomCheap',
  flophouse: 'roomCheap', suite: 'roomLuxury', 'cover charge': 'coverCharge', tip: 'information', information: 'information', info: 'information',
  records: 'brokerRecords', introduction: 'introduction', permit: 'permit', visa: 'permit', 'forged papers': 'forgedPapers', 'false identity': 'forgedPapers',
  doctor: 'doctor', medic: 'doctor', treatment: 'doctor', clothes: 'clothes', clothing: 'clothes', outfit: 'clothes', 'fine clothes': 'fineClothes',
  fare: 'localTransit', subway: 'localTransit', taxi: 'localTransit', passage: 'passage', ticket: 'passage', charter: 'passageFar',
};

const STOP = new Set(['a', 'an', 'the', 'of', 'for', 'or', 'set', 'some']);
const words = (t: string): string[] => t.toLowerCase().replace(/[^a-z0-9\- ]+/g, ' ').split(/\s+/).filter(Boolean);
const PHRASES: readonly (readonly [readonly string[], string])[] = [
  // A droid's designation first: "a T7 astromech" is the T7, not the generic astromech (equal lengths keep this order).
  ...Object.entries(DROID_DESIGNATIONS).map(([k, id]) => [words(k), id] as const),
  ...PRICE_CATALOG.map((p) => [words(p.name.replace(/\(.*\)/, '')).filter((w) => !STOP.has(w)), p.id] as const),
  ...Object.entries(PRICE_WORDS).map(([k, id]) => [words(k), id] as const),
]
  .filter(([ph]) => ph.length > 0)
  .sort((x, y) => y[0].length - x[0].length);

/** The catalog row for what the narrator named: an id, a catalog name, or plain words (longest phrase first); null when none fits. */
export function resolvePriceId(text: string): string | null {
  const t = text.trim();
  const byId = PRICE_CATALOG.find((p) => p.id.toLowerCase() === t.toLowerCase());
  if (byId) return byId.id;
  const ws = words(t);
  for (const [phrase, id] of PHRASES) {
    for (let i = 0; i + phrase.length <= ws.length; i++) if (phrase.every((w, j) => ws[i + j] === w || ws[i + j] === `${w}s`)) return id;
  }
  return null;
}

