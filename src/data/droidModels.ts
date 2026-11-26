// Droid models as dated data (M8 checklist item 7; docs-v2/spec/droids.md section 1). One list, every model with the years it
// is made and sold in (D-438: no era sections; the game resolves what exists from the date). Fills the research queue's
// "Droids by era" gap as far as the lore files go, and backs D-213's era minion kinds.
//
// Sources: Docs/SWRPG lore/SW_Droids_Classes.md (classes, the Old Republic models), SW_Economy_Prices_Ships_Weapons_Droids.md
// (in-universe prices, tier 1) and SW_Economy_GamePriceLists_Part6.md (game stats, tier 2: the KOTOR Campaign Guide first).
// `priceTier` and `dateTier` say which; `invented` marks a value no source gives (a gap filled from a comparable model).
// Calendar years: negative = BBY; null = open.
import type { ArmorKind, WeaponKind } from './health.config';
import type { DroidClass, DroidSkill } from './droids.config';

export type Locomotion = 'wheels' | 'treads' | 'legs' | 'one leg' | 'four legs' | 'repulsor';
export type Chassis = 'light' | 'medium' | 'heavy' | 'war';

export interface DroidModel {
  id: string;
  name: string;
  /** The class (degree); `also` a second one for a model built for two (the HK: assassin and protocol). */
  cls: DroidClass;
  also?: DroidClass;
  maker: string;
  /** Republic credits new; null = not sold (military, unique, or the maker's own). */
  price: number | null;
  priceTier: 'lore' | 'game' | 'invented' | null;
  from: number | null;
  to: number | null;
  dateTier: 'lore' | 'inferred' | 'invented';
  /** Ratings over the class's factory programming (droids.config CLASS_SKILLS). */
  skills?: Readonly<Partial<Record<DroidSkill, number>>>;
  /** What it is programmed and built for, in plain words (the narrator's). */
  programming: readonly string[];
  equipment: readonly string[];
  locomotion: Locomotion;
  chassis: Chassis;
  weapon?: WeaponKind;
  armor?: ArmorKind;
  /** A personal shield (the Mark I assault droid's bubble). */
  shield?: true;
  /** Built or modified to resist restraining bolts (lore: security droids, a few custom units). */
  resistsBolt?: true;
  /** How fast its personality grows unwiped (1 = the default; invented except where the note gives the lore). */
  drift?: number;
  /** Plugs into a starfighter (the T3's aftermarket interface; astromechs). */
  starfighterInterface?: true;
  /** Sold only on the black market (military and assassin models). */
  restricted?: true;
  /** A generic model of its kind for the years no named model covers (the lore's gaps; every value invented or generic). */
  generic?: DroidKind;
  source: string;
}

/** The kinds the narrator's generic words name (economyPrices' generic rows) and the generic models stand in for. */
export type DroidKind = 'protocol' | 'astromech' | 'medical' | 'labour' | 'security';

const DC = 'SW_Droids_Classes';
const PS = 'SW_Economy_Prices_Ships_Weapons_Droids';
const GL = 'SW_Economy_GamePriceLists_Part6';
const KCG = 'KOTOR CG, WotC 2008';

export const DROID_MODELS: readonly DroidModel[] = [
  // ---- Protocol and social (class three) ----
  { id: 'a3do', name: '3DO protocol droid', cls: 3, maker: 'unknown', price: 1500, priceTier: 'lore', from: -4100, to: -3900, dateTier: 'invented', programming: ['protocol', 'etiquette', 'translation'], equipment: ['vocabulator'], locomotion: 'legs', chassis: 'light', source: `${PS}: A-3DO bought used by Andur, 1,500 cr (c. 4000 BBY); years around that date invented` },
  { id: 'ge3', name: 'GE3 protocol droid', cls: 3, maker: 'Czerka', price: 2500, priceTier: 'game', from: -3990, to: -3600, dateTier: 'inferred', skills: { social: 40 }, programming: ['protocol', 'translation', 'customs', 'secretary', 'guide', 'diplomatic aide'], equipment: ['vocabulator', 'language database'], locomotion: 'legs', chassis: 'light', source: `${DC}: among the best-selling droids of the Jedi Civil War and Dark Wars; ${GL}: 2,500 cr (${KCG}); the years widened to the Old Republic (invented)` },
  { id: 'et74', name: 'ET-74 communications droid', cls: 3, maker: 'unknown', price: 2700, priceTier: 'game', from: -3963, to: -3951, dateTier: 'lore', skills: { languages: 55 }, programming: ['communications', 'translation'], equipment: ['long-range transceiver'], locomotion: 'legs', chassis: 'light', source: `${GL}: 2,500-2,700 cr, c. 3963-3951 BBY (${KCG})` },
  { id: 'threePo', name: '3PO protocol droid', cls: 3, maker: 'Cybot Galactica', price: 3000, priceTier: 'lore', from: -150, to: null, dateTier: 'invented', skills: { languages: 80 }, programming: ['protocol', 'etiquette', 'translation', 'six million forms of communication'], equipment: ['vocabulator', 'language database'], locomotion: 'legs', chassis: 'light', source: `${PS}: a 3PO unit 3,000 cr on the open market (c. 0 BBY); the years invented (in service from well before the Clone Wars)` },
  { id: 'se4', name: 'SE4 servant droid', cls: 3, maker: 'Industrial Automaton', price: 2600, priceTier: 'lore', from: -20, to: null, dateTier: 'inferred', skills: { languages: 40, social: 40 }, programming: ['household service', 'butler'], equipment: [], locomotion: 'legs', chassis: 'light', source: `${PS}: SE4 servant droid c. 2,600 new / 1,300 used (Galactic Civil War era [inferred]); the start invented` },
  // ---- Medical and sciences (class one) ----
  { id: 'm3m1', name: 'M3-M1 medical droid', cls: 1, maker: 'unknown', price: 2000, priceTier: 'invented', from: -3970, to: -3600, dateTier: 'invented', programming: ['first aid', 'diagnosis', 'surgery assistant'], equipment: ['medical scanner', 'injector'], locomotion: 'legs', chassis: 'light', source: `${DC}: the M3-M1 medical droid in KOTOR-era sources (name only); the price from the MD series (2,000 cr); the years invented` },
  { id: 'impMed', name: 'Imperial medical droid', cls: 1, maker: 'Imperial', price: 2500, priceTier: 'invented', from: -3681, to: -3600, dateTier: 'inferred', skills: { medicine: 55 }, programming: ['battlefield medicine', 'surgery'], equipment: ['medical scanner', 'surgical arms'], locomotion: 'repulsor', chassis: 'light', source: `${DC}: Imperial medical droid (SWTOR, the Great Galactic War and after; name only); the price invented above the M3-M1` },
  { id: 'md', name: 'MD medical droid', cls: 1, maker: 'Industrial Automaton', price: 2000, priceTier: 'lore', from: -22, to: 10, dateTier: 'lore', programming: ['diagnosis', 'pharmacology', 'surgery assistant'], equipment: ['medical scanner', 'injector'], locomotion: 'legs', chassis: 'light', source: `${PS}: MD-0 to MD-4 medical droids 2,000 cr each, c. 22 BBY to the Galactic Civil War` },
  { id: 'twoOneB', name: '2-1B surgical droid', cls: 1, maker: 'Industrial Automaton', price: 4300, priceTier: 'invented', from: -40, to: null, dateTier: 'invented', skills: { medicine: 70, science: 50 }, programming: ['surgery', 'diagnosis', 'bacta tank operation'], equipment: ['surgical arms', 'medical database'], locomotion: 'legs', chassis: 'light', source: 'no file prices or dates it (invented: above the MD series for a full surgeon)' },
  // ---- Engineering, astromech and planning (class two) ----
  { id: 't3', name: 'T3 utility droid', cls: 2, maker: 'Duwani Mechanical Products', price: 3500, priceTier: 'game', from: -4086, to: -3640, dateTier: 'inferred', skills: { slicing: 40 }, programming: ['starship repair', 'engineer', 'co-pilot', 'slicing'], equipment: ['arc welder', 'computer interface'], locomotion: 'treads', chassis: 'light', drift: 1.5, starfighterInterface: true, source: `${DC}: in use about 130 years by 3956 BBY; repairs ships, engineer or co-pilot; favoured by smugglers; develops personality unwiped (drift 1.5: unwiped T3s formed gangs); ${GL}: 3,500 cr (KOTOR, game stat); T3-M4 2,000 on Taris (${PS}); the end invented (the T7 replaces it)` },
  { id: 't7', name: 'T7 astromech droid', cls: 2, maker: 'Duwani Mechanical Products', price: 4000, priceTier: 'invented', from: -3690, to: -3000, dateTier: 'inferred', skills: { astrogation: 50, blaster: 20 }, programming: ['astrogation', 'starship repair', 'co-pilot'], equipment: ['arc welder', 'computer interface', 'combat upgrade mounts'], locomotion: 'treads', chassis: 'light', drift: 1.2, starfighterInterface: true, source: `${DC}: used in the Old Republic, above all the Great Galactic War (T7-O1); Nar Shaddaa combat upgrades c. 3643 BBY; price invented between the T3 (3,500) and the R2 (4,245); the end invented` },
  { id: 'x2c3', name: 'X2-C3 Imperial astromech', cls: 2, maker: 'Imperial', price: 4000, priceTier: 'invented', from: -3681, to: -3600, dateTier: 'inferred', skills: { astrogation: 45 }, programming: ['astrogation', 'starship repair'], equipment: ['arc welder', 'computer interface'], locomotion: 'treads', chassis: 'light', starfighterInterface: true, source: `${DC}: X2-C3 Imperial astromech (SWTOR; name only); the price as the T7's (invented)` },
  { id: 'kx12', name: 'K-X12 probe droid', cls: 2, maker: 'unknown', price: 6000, priceTier: 'game', from: -3960, to: -3900, dateTier: 'inferred', skills: { security: 40 }, programming: ['reconnaissance', 'survey'], equipment: ['sensor suite', 'holorecorder'], locomotion: 'repulsor', chassis: 'light', source: `${GL}: 6,000 cr, c. 3956 BBY (KOTOR, game stat); the years around it invented` },
  { id: 'g0t0', name: 'G0-T0 infrastructure planning system', cls: 2, maker: 'Aratech', price: 60000, priceTier: 'game', from: -3985, to: -3940, dateTier: 'lore', skills: { science: 70, slicing: 60, social: 50 }, programming: ['planetary administration', 'logistics', 'commanding workers'], equipment: ['network interface', 'repulsor field'], locomotion: 'repulsor', chassis: 'light', drift: 2, source: `${DC}: prototypes after 3985 BBY, widely used from 3955, the rogue units put down by the Republic Navy (the end invented, 3940); data overload made its personality (drift 2); 60,000 cr (game stat)` },
  { id: 'r1', name: 'R1 astromech droid', cls: 2, maker: 'Industrial Automaton', price: 3500, priceTier: 'game', from: -400, to: 10, dateTier: 'invented', programming: ['astrogation', 'starship repair'], equipment: ['arc welder', 'computer interface'], locomotion: 'treads', chassis: 'medium', starfighterInterface: true, source: `${GL}: R1 3,500 cr (A&E Guide, game stat; era not stated); the years invented (an older line than the R2)` },
  { id: 'r2', name: 'R2 astromech droid', cls: 2, maker: 'Industrial Automaton', price: 4245, priceTier: 'lore', from: -60, to: 40, dateTier: 'invented', skills: { astrogation: 50, repair: 50 }, programming: ['astrogation', 'starship repair', 'co-pilot', 'computer interface'], equipment: ['arc welder', 'computer interface', 'holoprojector', 'fire extinguisher'], locomotion: 'treads', chassis: 'light', starfighterInterface: true, source: `${PS}: an average R2 c. 4,245 Republic cr (c. 19 BBY); R2 units 4,000-10,000 cr (c. 18 ABY); the years invented` },
  { id: 'r4', name: 'R4 astromech droid', cls: 2, maker: 'Industrial Automaton', price: 2750, priceTier: 'game', from: -40, to: 40, dateTier: 'invented', skills: { astrogation: 35 }, programming: ['astrogation', 'vehicle repair'], equipment: ['arc welder', 'computer interface'], locomotion: 'treads', chassis: 'light', starfighterInterface: true, source: `${GL}: R4 2,500-3,000 cr (A&E Guide, WEG; era not stated); the middle; the years invented` },
  { id: 'nr5', name: 'NR-5 repair droid', cls: 2, maker: 'unknown', price: 2200, priceTier: 'lore', from: -2, to: null, dateTier: 'lore', skills: { repair: 50, astrogation: 0 }, programming: ['repair', 'maintenance'], equipment: ['tool arms'], locomotion: 'treads', chassis: 'light', source: `${PS}: NR-5 introduced 2 BBY, 2,200 cr new` },
  // ---- Military and security (class four) ----
  { id: 'hk', name: 'HK assassin droid', cls: 4, also: 3, maker: 'Czerka', price: 5000, priceTier: 'lore', from: -4015, to: -3600, dateTier: 'inferred', skills: { blaster: 55, melee: 40, security: 45, languages: 50 }, programming: ['assassination', 'protocol (cover)', 'translation'], equipment: ['blaster rifle', 'vocabulator'], locomotion: 'legs', chassis: 'medium', weapon: 'blasterRifle', armor: 'light', resistsBolt: true, drift: 1.5, restricted: true, source: `${DC}: assassin and protocol droid; HK-01 the prototype (4015 BBY), HK-47, HK-50s, HK-51s; ${PS}: HK-47 at Yuka Laka's 5,000 cr, 2,500 with persuasion (3956 BBY); resists bolts (custom units, invented for the line); the end invented` },
  { id: 'markIAssault', name: 'Mark I assault droid', cls: 4, maker: 'Czerka', price: 14910, priceTier: 'game', from: -3980, to: -3600, dateTier: 'inferred', skills: { blaster: 40, melee: 25 }, programming: ['base defence', 'boarding defence'], equipment: ['two heavy blasters', 'energy shield'], locomotion: 'one leg', chassis: 'heavy', weapon: 'heavy', armor: 'medium', shield: true, restricted: true, source: `${DC}: built by the Republic before the Mandalorian Wars, common in Revan's Sith Empire; some carry an energy bubble that briefly absorbs blaster bolts and lightsaber strikes; 14,910 cr (game stat); the start and end invented` },
  { id: 'markIVAssault', name: 'Mark IV assault droid', cls: 4, maker: 'Czerka', price: 16270, priceTier: 'game', from: -3960, to: -3600, dateTier: 'invented', skills: { blaster: 45, melee: 30 }, programming: ['assault', 'base defence'], equipment: ['heavy blaster', 'flamethrower'], locomotion: 'legs', chassis: 'heavy', weapon: 'heavy', armor: 'medium', restricted: true, source: `${GL}: 16,270 cr (KOTOR, game stat; era not stated); KOTOR-era sources; the years invented` },
  { id: 'sentinel', name: 'Sentinel droid', cls: 4, maker: 'unknown', price: 2400, priceTier: 'game', from: -3960, to: -3900, dateTier: 'inferred', skills: { security: 45 }, programming: ['guard duty'], equipment: ['blaster'], locomotion: 'legs', chassis: 'medium', weapon: 'blasterRifle', armor: 'light', resistsBolt: true, restricted: true, source: `${GL}: 2,400 cr, c. 3956 BBY (KOTOR, game stat); a security droid (resists bolts, lore); the years around it invented` },
  { id: 'patrolMkI', name: 'Municipal patrol droid Mark I', cls: 4, maker: 'unknown', price: 4700, priceTier: 'game', from: -3960, to: -3900, dateTier: 'inferred', skills: { security: 45, blaster: 30 }, programming: ['city patrol', 'arrest'], equipment: ['blaster', 'binders'], locomotion: 'legs', chassis: 'medium', weapon: 'blasterPistol', armor: 'light', resistsBolt: true, source: `${GL}: 4,700 cr, c. 3956 BBY (${KCG}); a security droid (resists bolts, lore); legal for municipal sale (invented)` },
  { id: 'juggernaut', name: 'Juggernaut war droid', cls: 4, maker: 'unknown', price: 20000, priceTier: 'game', from: -4020, to: -3950, dateTier: 'inferred', skills: { blaster: 45, melee: 35 }, programming: ['war'], equipment: ['heavy blasters'], locomotion: 'legs', chassis: 'war', weapon: 'heavy', armor: 'heavy', restricted: true, source: `${DC}: Juggernaut war droids in the Great Droid Revolution (4015 BBY); ${GL}: 20,000 cr, c. 3963-3951 BBY (${KCG}); the years invented around both` },
  { id: 'basilisk', name: 'Basilisk war droid', cls: 4, maker: 'Basiliskans', price: null, priceTier: null, from: -4017, to: -3960, dateTier: 'lore', skills: { blaster: 50, melee: 40 }, programming: ['war', 'carrying a rider'], equipment: ['laser cannons', 'pulse-wave cannons', 'shockwave rods', 'shatter-missiles'], locomotion: 'four legs', chassis: 'war', weapon: 'heavy', armor: 'heavy', drift: 1.3, source: `${DC}: semi-sentient; taken by the Mandalorians after conquering Basilisk in 4017 BBY; ordered destroyed after Malachor V (3960), though some clans kept theirs; not sold` },
  { id: 'krathWar', name: 'Krath war droid', cls: 4, maker: 'Cinnagar foundries', price: null, priceTier: null, from: -4000, to: -3990, dateTier: 'lore', skills: { blaster: 40, melee: 40 }, programming: ['war', 'learning Jedi battle tactics'], equipment: ['pulse-wave bow', 'short sword', 'ablative plating'], locomotion: 'legs', chassis: 'heavy', weapon: 'blasterRifle', armor: 'heavy', source: `${DC}: built by the Krath (founded 4000 BBY); the end invented with the Krath's fall; not sold` },
  { id: 'sithWarMkI', name: 'Sith war droid Mark I', cls: 4, maker: 'Colicoids', price: null, priceTier: null, from: -3681, to: -3600, dateTier: 'lore', skills: { blaster: 40 }, programming: ['war'], equipment: ['arm-mounted blaster cannons'], locomotion: 'four legs', chassis: 'war', weapon: 'heavy', armor: 'heavy', source: `${DC}: the Sith Empire's in the Great Galactic War (Alderaan, the Sacking of Coruscant); no shield by default; the Empire's, not sold` },
  { id: 'b1', name: 'B1 battle droid', cls: 4, maker: 'Baktoid Combat Automata', price: null, priceTier: null, from: -32, to: -19, dateTier: 'lore', skills: { blaster: 20, melee: 10, security: 15 }, programming: ['infantry'], equipment: ['E-5 blaster rifle'], locomotion: 'legs', chassis: 'light', weapon: 'blasterRifle', armor: 'light', drift: 0.3, source: 'D-213: the Naboo invasion (32 BBY) through the Clone Wars; the Trade Federation and the Confederacy\'s, not sold' },
  { id: 'b2', name: 'B2 super battle droid', cls: 4, maker: 'Baktoid Combat Automata', price: null, priceTier: null, from: -22, to: -19, dateTier: 'lore', skills: { blaster: 30 }, programming: ['infantry'], equipment: ['wrist blasters'], locomotion: 'legs', chassis: 'heavy', weapon: 'heavy', armor: 'heavy', drift: 0.3, source: 'D-213: the Clone Wars; the Confederacy\'s, not sold' },
  { id: 'droideka', name: 'droideka', cls: 4, maker: 'Colicoids', price: null, priceTier: null, from: -32, to: -19, dateTier: 'lore', skills: { blaster: 40 }, programming: ['assault'], equipment: ['twin blasters', 'deflector shield'], locomotion: 'wheels', chassis: 'heavy', weapon: 'heavy', armor: 'medium', shield: true, source: 'D-213: the Naboo invasion through the Clone Wars; the Confederacy\'s, not sold' },
  { id: 'jk13', name: 'JK-13 security droid', cls: 4, maker: 'Cestus Cybernetics', price: 80000, priceTier: 'lore', from: -22, to: -19, dateTier: 'lore', skills: { melee: 60, security: 55, blaster: 40 }, programming: ['security', 'bodyguard'], equipment: ['electro-shock arms'], locomotion: 'legs', chassis: 'heavy', weapon: 'melee', armor: 'medium', resistsBolt: true, drift: 1.5, restricted: true, source: `${PS}: 80,000 cr during the Clone Wars, c. 22-19 BBY [unclear]` },
  { id: 'markX', name: 'Mark X Executioner droid', cls: 4, maker: 'unknown', price: 35000, priceTier: 'game', from: -5, to: -2, dateTier: 'lore', skills: { melee: 55, blaster: 40 }, programming: ['gladiatorial combat'], equipment: ['blades', 'blasters'], locomotion: 'legs', chassis: 'heavy', weapon: 'melee', armor: 'heavy', restricted: true, source: `${GL}: 35,000 cr, c. 5-2 BBY (Corporate Sector SB, WEG 1993); a gladiator droid` },
  { id: 'r1Recon', name: 'R-1 recon droid', cls: 4, maker: 'unknown', price: 16000, priceTier: 'game', from: -19, to: 0, dateTier: 'lore', skills: { security: 55, blaster: 25 }, programming: ['reconnaissance'], equipment: ['sensor suite', 'blaster'], locomotion: 'repulsor', chassis: 'light', weapon: 'blasterPistol', armor: 'none', restricted: true, source: `${GL}: 16,000 cr, c. 19-0 BBY (the Force Unleashed CG, WotC 2008)` },
  // ---- Labour (class five) ----
  { id: 'r8009', name: 'R-8009 utility droid', cls: 5, maker: 'unknown', price: 800, priceTier: 'game', from: -3960, to: -3900, dateTier: 'inferred', programming: ['maintenance', 'hauling'], equipment: ['manipulator arms'], locomotion: 'treads', chassis: 'light', drift: 0.5, source: `${GL}: 800 cr, c. 3956 BBY (${KCG}); the years around it invented; simple (drift 0.5, invented)` },
  { id: 's6', name: 'S6 security and maintenance droid', cls: 5, also: 4, maker: 'unknown', price: 2000, priceTier: 'game', from: -3960, to: -3900, dateTier: 'inferred', skills: { security: 30, blaster: 15 }, programming: ['maintenance', 'night watch'], equipment: ['tools', 'stun prod'], locomotion: 'legs', chassis: 'medium', drift: 0.6, source: `${GL}: 2,000 cr, c. 3956 BBY (${KCG}); the years invented` },
  { id: 'lb', name: 'LB bulk-loading droid', cls: 5, maker: 'unknown', price: 6000, priceTier: 'game', from: -3963, to: -3951, dateTier: 'lore', skills: { labour: 55 }, programming: ['cargo loading'], equipment: ['lifting arms'], locomotion: 'treads', chassis: 'heavy', drift: 0.4, source: `${GL}: 6,000 cr, c. 3963-3951 BBY (${KCG})` },
  { id: 'pk', name: 'PK worker droid', cls: 5, maker: 'Serv-O-Droid', price: 1000, priceTier: 'lore', from: -40, to: 0, dateTier: 'invented', programming: ['maintenance', 'hauling'], equipment: ['manipulator arms'], locomotion: 'legs', chassis: 'light', drift: 0.5, source: `${PS}: PK worker droid c. 1,000 cr retail (c. 22 BBY); the years invented around it` },
  { id: 'asp', name: 'ASP labour droid', cls: 5, maker: 'Industrial Automaton', price: 1000, priceTier: 'lore', from: -20, to: 40, dateTier: 'inferred', programming: ['labour', 'maintenance'], equipment: ['manipulator arms'], locomotion: 'legs', chassis: 'medium', drift: 0.5, source: `${PS}: ASP labour droid 1,000 cr (Galactic Civil War era [inferred]); the years widened (invented)` },
  { id: 'mse6', name: 'MSE-6 repair droid', cls: 5, maker: 'Rebaxan Columni', price: 350, priceTier: 'game', from: -20, to: 40, dateTier: 'invented', skills: { repair: 25 }, programming: ['simple repairs', 'messages'], equipment: ['manipulator arm'], locomotion: 'wheels', chassis: 'light', drift: 0.3, source: `${GL}: 350 cr (Cynabar's FT: Droids, WEG 1997; c. 0-4 ABY); the years widened (invented)` },
  // ---- Generic models: the years no named model covers (the lore files have long gaps, e.g. no protocol model between 3,600
  // and 150 BBY). Every era; the class's factory programming; prices from the catalog's generic rows. ----
  { id: 'protocolGeneric', name: 'protocol droid', cls: 3, maker: 'various', price: 3000, priceTier: 'lore', from: null, to: null, dateTier: 'invented', programming: ['protocol', 'translation'], equipment: ['vocabulator'], locomotion: 'legs', chassis: 'light', generic: 'protocol', source: `generic (invented); the price is the catalog's protocol droid row (${PS}: a 3PO unit c. 3,000 cr)` },
  { id: 'astromechGeneric', name: 'astromech droid', cls: 2, maker: 'various', price: 4000, priceTier: 'lore', from: null, to: null, dateTier: 'invented', programming: ['astrogation', 'starship repair', 'co-pilot'], equipment: ['arc welder', 'computer interface'], locomotion: 'treads', chassis: 'light', starfighterInterface: true, generic: 'astromech', source: `generic (invented); the price is the catalog's astromech row (${PS}: R2 units 4,000-10,000 cr)` },
  { id: 'medicalGeneric', name: 'medical droid', cls: 1, maker: 'various', price: 2000, priceTier: 'lore', from: null, to: null, dateTier: 'invented', programming: ['first aid', 'diagnosis'], equipment: ['medical scanner'], locomotion: 'legs', chassis: 'light', generic: 'medical', source: `generic (invented); the price is the catalog's medical droid row (${PS}: MD-series c. 2,000 cr)` },
  { id: 'labourGeneric', name: 'labour droid', cls: 5, maker: 'various', price: 1000, priceTier: 'invented', from: null, to: null, dateTier: 'invented', programming: ['labour', 'maintenance'], equipment: ['manipulator arms'], locomotion: 'legs', chassis: 'medium', drift: 0.5, generic: 'labour', source: `generic (invented); the price from the PK and ASP workers (${PS}: 1,000 cr)` },
  { id: 'securityGeneric', name: 'security droid', cls: 4, maker: 'various', price: 4700, priceTier: 'invented', from: null, to: null, dateTier: 'invented', skills: { security: 45, blaster: 30 }, programming: ['guard duty', 'patrol'], equipment: ['blaster'], locomotion: 'legs', chassis: 'medium', weapon: 'blasterPistol', armor: 'light', resistsBolt: true, generic: 'security', source: `generic (invented); the price from the municipal patrol droid (${GL}: 4,700 cr)` },
  // ---- Later eras (the lore files' few) ----
  { id: 'rovingEye', name: 'Roving Eye observation droid', cls: 2, maker: 'unknown', price: 3200, priceTier: 'game', from: 130, to: 137, dateTier: 'lore', skills: { security: 45, astrogation: 0, slicing: 20 }, programming: ['observation', 'surveillance'], equipment: ['holorecorder', 'sensor suite'], locomotion: 'repulsor', chassis: 'light', source: `${GL}: 3,200 cr, c. 130-137 ABY (Legacy Era CG, WotC 2009)` },
];

export const DROID_MODEL_BY_ID: ReadonlyMap<string, DroidModel> = new Map(DROID_MODELS.map((m) => [m.id, m]));

/**
 * The generic catalog rows (economyPrices) a narrator's plain words land on, mapped to the kind of model they mean; the
 * engine picks the model of that kind in service at the date (engine/droids.ts modelForKind).
 */
export const GENERIC_DROID_ROWS: Readonly<Record<string, DroidKind>> = { protocolDroid: 'protocol', astromech: 'astromech', medDroid: 'medical' };

/** What each kind means among the named models (for picking the date's model of a kind). */
export const KIND_OF_MODEL = (m: DroidModel): DroidKind | null => {
  if (m.generic) return m.generic;
  if (m.starfighterInterface) return 'astromech';
  if (m.cls === 3 && m.programming.some((p) => p.startsWith('protocol'))) return 'protocol';
  if (m.cls === 1) return 'medical';
  if (m.cls === 5) return 'labour';
  if (m.cls === 4 && m.programming.some((p) => /guard|security|patrol/.test(p))) return 'security';
  return null;
};
