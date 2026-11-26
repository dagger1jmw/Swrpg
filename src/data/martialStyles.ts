// Melee styles (m8-skills, D-513; spec/skills-m8.md section 5; design: m8-design-notes "Melee styles"). One Melee skill does
// the real work; a style is a proficiency on top (0-1, as weapon proficiency is), dated and tied to its culture. Lore:
// Docs/SWRPG lore/SW_Martial_Cultures_AllEras_Part1-3.md (styles in Part 1-2, who teaches outsiders in Part 3 and the rulings
// of 24 Nov 2026). Years are campaign years (negative = BBY): `from` is the first year the lore attests the style (null: no
// recorded start), `to` the last (null: no recorded end). D-438: one dated list; the game resolves what exists from the date.
//
// Every number here is invented (the bonuses, the edge values, the teaching threshold) except where marked Jared's. The edge
// of each style is a proposal for Jared (listed in the report). Teräs Käsi's speed, strike power and anticipation come from
// RPG books and game guides (Threats of the Galaxy, Hero's Guide, the Revenge of the Sith Prima guide, The Clone Wars
// Campaign Guide): mechanics only, never narrator lore. Game-derived powers (Matukai, Teräs Käsi meditation healing) are
// not built: noted as possible perks.
import type { FactionId, SpeciesId } from './entities.config';

/** What a style fights with: unarmed only (Teräs Käsi), weapons only, or both (Echani, Mandalorian). */
export type StyleWeapons = 'unarmed' | 'armed' | 'both';

/**
 * A style's one situational edge (a proposal; invented values). Each is a +1 on the roll it names once the style's
 * proficiency is at STYLE.edgeFrom or more:
 * - longFight: build-up rolls from the fight's 3rd exchange (reading the opponent)
 * - opening: build-up rolls in the first 3 exchanges (a fast opening flurry that fades)
 * - tireless: build-up rolls from the 6th exchange
 * - vsRanged: defence against a ranged attacker (dodging bolts)
 * - surprise: the strike roll of a surprise strike (a silent takedown)
 * - strike: every strike roll (one blow disables)
 * - counter: defence against the opponent's strikes (deflect and turn the attack)
 * - armoured: every roll while in medium or heavy armour or beskar
 * - vsArmed: every roll fighting unarmed against an armed opponent
 * - footing: cancels up to 1 of bad footing (balance)
 * - vsSeveral: every roll against two or more opponents (arena fighting)
 * - vsSaber: defence against a lightsaber (a cortosis shield)
 */
export type StyleEdgeKind = 'longFight' | 'opening' | 'tireless' | 'vsRanged' | 'surprise' | 'strike' | 'counter' | 'armoured' | 'vsArmed' | 'footing' | 'vsSeveral' | 'vsSaber' | 'none';

export interface StyleTeaching {
  /** Teachers of the style's culture (a species or a faction), besides anyone who holds the style (STYLE.teachFrom). */
  cultureSpecies?: readonly SpeciesId[];
  cultureFaction?: readonly FactionId[];
  /** Only students of these species may learn it (the full Echani art, Wrruushi, the Iridonian art). */
  studentSpecies?: readonly SpeciesId[];
  /** Before this year only the culture's own learn it (Stava: taught to outsiders after 9 ABY, ruled). */
  outsidersFrom?: number;
  /** The student needs a Force connection (Matukai, the Bakuuni Hand). */
  forceSensitive?: boolean;
  /** The proficiency a teacher who holds the style needs (Teräs Käsi: one of the graduate masters). */
  teacherMin?: number;
  /** One line from the lore: who teaches outsiders. */
  note: string;
}

export interface MartialStyle {
  id: string;
  name: string;
  culture: string;
  from: number | null;
  to: number | null;
  /** The lore's dating, in words. */
  dated: string;
  weapons: StyleWeapons;
  /** The bonus on the skill scale at 100% proficiency (+5; Teräs Käsi +10, Jared). */
  maxBonus: number;
  edge: StyleEdgeKind;
  /** The proposed edge in words, from the lore. */
  edgeWhy: string;
  teaching: StyleTeaching;
  source: string;
}

/** Style numbers (invented unless marked). */
export const STYLE = {
  /** The bonus of an ordinary style at 100% (Jared: up to +5). */
  maxBonus: 5,
  /** Teräs Käsi at 100% (Jared: up to +10). */
  terasKasiBonus: 10,
  /** The edge applies from this proficiency (invented). */
  edgeFrom: 0.5,
  edgeValue: 1,
  /** A holder teaches the style from this proficiency (invented). */
  teachFrom: 0.5,
  /** Growth: proficiency = 1 - e^(-hours / H); 75% after about 150 effective hours, 99% after about 500 (invented). */
  growthHours: 108,
  /** A fight with the style counts as this many training hours, times the stakes (combat counts for more; invented). */
  fightHours: { spar: 0.5, skirmish: 1, serious: 2, lethal: 3 } as Readonly<Record<string, number>>,
  /** Higher Melee learns faster: up to +50% at Melee 100 (Jared), on a smoothstep (invented shape). */
  meleeSpeedUp: 0.5,
  /** Fading: after `graceDays` unused, toward `floor` of the peak with time constant `days` (invented: about half the peak). */
  fade: { graceDays: 30, floor: 0.5, days: 730 },
  /** Below the peak, training and fighting regrow it this many times faster (back quickly with use; invented). */
  regrowFactor: 3,
} as const;

/**
 * Teräs Käsi (Jared, 25 Nov 2026; RPG and game-guide sources, mechanics only). Up to +10 at 100%; no bonus against Force
 * users. Speed: +2 on the melee contest that moves the advantage track, by proficiency (invented scaling). Strike power: a
 * master's strikes count as blaster-pistol damage in the realistic damage rules (when built), the share by proficiency from
 * 50% (invented), and ignore part of light and medium body armour (invented: 50% and 25% at 100%). Anticipation: proficiency
 * 100% and Melee 81+ (High Master): half the precognitive defence a Force user of that tier gets from Force Sense; Melee 101+
 * (Legendary): all of it; never stacked with the fighter's own Force Sense (the higher applies). In melee only, never against
 * surprise.
 */
export const TERAS_KASI = {
  id: 'terasKasi',
  speed: 2,
  pistolFrom: 0.5,
  armourIgnored: { light: 0.5, medium: 0.25 },
  anticipation: { proficiency: 1, masterMelee: 81, grandmasterMelee: 101, masterShare: 0.5, grandmasterShare: 1 },
} as const;

const T = (o: StyleTeaching): StyleTeaching => o;
const P1 = 'SW_Martial_Cultures_AllEras_Part1';
const P2 = 'SW_Martial_Cultures_AllEras_Part2';
const P3 = 'SW_Martial_Cultures_AllEras_Part3';

export const MARTIAL_STYLES: readonly MartialStyle[] = [
  {
    id: 'terasKasi',
    name: 'Teräs Käsi',
    culture: 'the Followers of Palawa (Bunduki, Pacanth Reach)',
    from: -24500,
    to: null,
    dated: 'founded before 24,500 BBY; taught into the Galactic Civil War and after',
    weapons: 'unarmed',
    maxBonus: STYLE.terasKasiBonus,
    edge: 'none',
    edgeWhy: 'none beyond its own rules (speed, strike power, anticipation); made to fight Jedi but no in-fight edge for it (Jared)',
    teaching: T({ teacherMin: 0.9, note: 'a Follower of Palawa or one of their graduate masters; the Followers can refuse a student' }),
    source: `${P1} §1-3; ${P3} timeline and game notes`,
  },
  {
    id: 'echani',
    name: 'the Echani art (full)',
    culture: 'the Echani castes (Eshan and the Six Sisters)',
    from: -3976,
    to: null,
    dated: 'c. 3,976 BBY on',
    weapons: 'both',
    maxBonus: STYLE.maxBonus,
    edge: 'longFight',
    edgeWhy: 'reading the opponent: Echani know where a strike will land before it lands',
    teaching: T({ cultureSpecies: ['echani'], studentSpecies: ['echani'], note: 'the full art stays within the Echani castes (ruled 24 Nov 2026)' }),
    source: `${P1} §4-5; ${P2} §1-2`,
  },
  {
    id: 'echaniMilitary',
    name: 'the Echani art (military version)',
    culture: 'special forces, the Sun Guard, the Royal Guard and Imperial Intelligence',
    from: -3976,
    to: null,
    dated: 'Old Republic special forces (c. 3,976 BBY on); the Sun Guard after 899 BBY; the Royal Guard and Imperial Intelligence after 19 BBY',
    weapons: 'both',
    maxBonus: STYLE.maxBonus,
    edge: 'longFight',
    edgeWhy: 'reading the opponent, as the full art',
    teaching: T({ cultureSpecies: ['echani'], note: 'outsiders learn military versions from special-forces, Royal Guard and Imperial Intelligence instructors (ruled 24 Nov 2026)' }),
    source: `${P1} §4; ${P3} §2, §3, §5`,
  },
  {
    id: 'stava',
    name: 'Stava',
    culture: 'the Noghri of Honoghr',
    from: -19,
    to: null,
    dated: '19 BBY on (the Imperial era); taught to outsiders after 9 ABY',
    weapons: 'both',
    maxBonus: STYLE.maxBonus,
    edge: 'vsRanged',
    edgeWhy: 'speed and endurance: Noghri dodge blaster bolts with acrobatics and rolls',
    teaching: T({ outsidersFrom: 9, note: 'mainly taught only to Noghri before 9 ABY; after it, to outsiders (ruled 24 Nov 2026); Lumiya learned it in Imperial training' }),
    source: `${P1} §6; ${P2} §5`,
  },
  {
    id: 'ktara',
    name: "K'tara",
    culture: 'Alliance Special Forces',
    from: -2,
    to: null,
    dated: '2 BBY on (the Rebel Alliance)',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'surprise',
    edgeWhy: 'the most damage with the least noise: silences, disarms and disables very quickly',
    teaching: T({ note: 'military (SpecForces) training' }),
    source: `${P1} §7`,
  },
  {
    id: 'kthri',
    name: "K'thri",
    culture: 'sporting events (Old Republic and after)',
    from: null,
    to: null,
    dated: '"dating back to the time of the Old Republic"; no start date',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'opening',
    edgeWhy: 'fast, fluid strikes and footwork; flashy moves that can make it inefficient as a fight goes on',
    teaching: T({ note: 'a sport style: any trained holder teaches it' }),
    source: `${P1} §8`,
  },
  {
    id: 'wrruushi',
    name: 'Wrruushi',
    culture: 'Wookiees',
    from: null,
    to: null,
    dated: 'not dated',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'strike',
    edgeWhy: 'huge upper-body strength: few strikes at a time, able to disable with a single blow',
    teaching: T({ cultureSpecies: ['wookiee'], studentSpecies: ['wookiee'], note: 'often performable only by Wookiees' }),
    source: `${P1} §9`,
  },
  {
    id: 'hijkata',
    name: 'Hijkata',
    culture: 'the Senate Guard of the Republic',
    from: null,
    to: -19,
    dated: 'Republic era to 19 BBY (the Senate Guard dissolved)',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'counter',
    edgeWhy: "deflecting and countering, turning the opponent's attacks against them",
    teaching: T({ note: 'drilled into Senate Guards' }),
    source: `${P1} §11; ${P3} §2`,
  },
  {
    id: 'mandalorian',
    name: 'Mandalorian martial training',
    culture: 'the Mandalorians',
    from: null,
    to: null,
    dated: 'all eras',
    weapons: 'both',
    maxBonus: STYLE.maxBonus,
    edge: 'armoured',
    edgeWhy: 'fighting armoured with mixed weapons (the design notes)',
    teaching: T({ cultureFaction: ['mandalorians'], note: 'open membership: anyone who joins; Boba Fett trained Jaina Solo (c. 40 ABY)' }),
    source: `${P2} §12; ${P1} §11 (Keldabe kiss, Battle Circle)`,
  },
  {
    id: 'iridonian',
    name: 'the Iridonian Zabrak art',
    culture: 'Iridonian Zabraks',
    from: null,
    to: null,
    dated: 'not dated',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'vsArmed',
    edgeWhy: 'a highly physical art; Iridonians are among the best hand-to-hand fighters in the galaxy',
    teaching: T({ cultureSpecies: ['zabrak'], studentSpecies: ['zabrak'], note: 'young Iridonian Zabraks are required to learn it (Iridonian upbringing)' }),
    source: `${P1} §12`,
  },
  {
    id: 'brokenGate',
    name: 'Broken Gate',
    culture: 'Jedi Knights of the Republic',
    from: null,
    to: null,
    dated: 'Republic era, no dates',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'vsArmed',
    edgeWhy: 'striking, throwing and joint locks (Ilena Xan)',
    teaching: T({ note: 'Jedi instructors (Ilena Xan)' }),
    source: `${P1} §11`,
  },
  {
    id: 'taeJitsu',
    name: 'Tae-Jitsu',
    culture: 'unknown; also practised by Jedi',
    from: -44,
    to: null,
    dated: "Obi-Wan's Padawan years (c. 44 BBY, inferred) to 20 BBY and after",
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'footing',
    edgeWhy: 'eight forms in which balance matters',
    teaching: T({ note: 'any trained holder' }),
    source: `${P1} §11`,
  },
  {
    id: 'verdanaian',
    name: 'Verdanaian "sliding hands"',
    culture: 'the Verdanaia system',
    from: -33,
    to: null,
    dated: 'before 33 BBY',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'longFight',
    edgeWhy: "constant contact with the opponent to read the next move",
    teaching: T({ note: 'any trained holder (Micah Giiett and Anoon Bondara taught Bultar Swan)' }),
    source: `${P1} §11`,
  },
  {
    id: 'bakuuniHand',
    name: 'the Bakuuni Hand',
    culture: 'some Jedi of the Republic era',
    from: null,
    to: null,
    dated: 'Republic era',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'strike',
    edgeWhy: 'the Force strengthens hands, feet and forearms in a strike',
    teaching: T({ forceSensitive: true, note: 'Jedi teachers; needs the Force' }),
    source: `${P1} §11`,
  },
  {
    id: 'matukai',
    name: 'Matukai',
    culture: 'the Matukai (Force adepts of the body)',
    from: -4000,
    to: null,
    dated: 'founded c. 4,000 BBY; through the Purge and the Yuuzhan Vong War',
    weapons: 'both',
    maxBonus: STYLE.maxBonus,
    edge: 'tireless',
    edgeWhy: 'trainees push past their stamina; a stance held for hours (the [game-derived] powers are not built)',
    teaching: T({ forceSensitive: true, note: 'an adept teaches apprentices; at least a weak Force connection' }),
    source: `${P1} §10; ${P2} §4`,
  },
  {
    id: 'talGun',
    name: 'Tal-Gun',
    culture: 'taught on Xagobah',
    from: -22,
    to: null,
    dated: 'the Clone Wars',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'opening',
    edgeWhy: 'no technique detail in the lore: a generic opening edge (proposal)',
    teaching: T({ note: 'learned by travelling to Xagobah' }),
    source: `${P1} §11`,
  },
  {
    id: 'jeswandi',
    name: 'Jeswandi',
    culture: 'the Bothans',
    from: null,
    to: null,
    dated: 'ancient',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'counter',
    edgeWhy: 'a meditation and martial art: composure under attack (proposal)',
    teaching: T({ cultureSpecies: ['bothan'], note: 'a Bothan art' }),
    source: `${P1} §11`,
  },
  {
    id: 'forbelean',
    name: 'the Forbelean Defense',
    culture: 'the Chiss (Forbelea system)',
    from: null,
    to: null,
    dated: 'no date (a New Jedi Order era source)',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'counter',
    edgeWhy: 'a posture that lets every attack be intercepted and deflected',
    teaching: T({ cultureSpecies: ['chiss'], note: 'a Chiss art' }),
    source: `${P1} §11`,
  },
  {
    id: 'gandFindsman',
    name: "the Gand findsmen's art",
    culture: 'Gand findsmen',
    from: null,
    to: null,
    dated: 'Galactic Civil War era sources',
    weapons: 'unarmed',
    maxBonus: STYLE.maxBonus,
    edge: 'strike',
    edgeWhy: 'Ooryl Qrygg punched through stormtrooper armour (lore); the named moves are [game-derived]',
    teaching: T({ cultureSpecies: ['gand'], studentSpecies: ['gand'], note: 'tenets little understood outside' }),
    source: `${P1} §11`,
  },
  {
    id: 'thrarkor',
    name: "Thrar'kor",
    culture: 'Trandoshans',
    from: null,
    to: null,
    dated: 'all eras',
    weapons: 'armed',
    maxBonus: STYLE.maxBonus,
    edge: 'opening',
    edgeWhy: 'a bladed melee form; no detail beyond it (proposal)',
    teaching: T({ cultureSpecies: ['trandoshan'], note: 'a Trandoshan blade form' }),
    source: `${P2} §7`,
  },
  {
    id: 'petranaki',
    name: 'Petranaki',
    culture: 'the Geonosians (arena combat)',
    from: -22,
    to: null,
    dated: 'Republic era (the Petranaki arena, 22 BBY)',
    weapons: 'armed',
    maxBonus: STYLE.maxBonus,
    edge: 'vsSeveral',
    edgeWhy: 'an arena art of five weapons, made to settle hive disputes',
    teaching: T({ note: 'arena teachers (any trained holder)' }),
    source: `${P2} §9`,
  },
  {
    id: 'desolous',
    name: "Darth Desolous's style",
    culture: "the Pau'an army of Darth Desolous",
    from: -3522,
    to: null,
    dated: 'after c. 3,522 BBY (birth worked out on the page); the Jedi kept a simulacrum for the Trials',
    weapons: 'armed',
    maxBonus: STYLE.maxBonus,
    edge: 'vsSaber',
    edgeWhy: 'a cortosis shield with a melee weapon, made to fight Jedi (duel tiers still rule)',
    teaching: T({ note: 'any trained holder' }),
    source: `${P2} §9`,
  },
];

export const STYLE_BY_ID: ReadonlyMap<string, MartialStyle> = new Map(MARTIAL_STYLES.map((m) => [m.id, m]));
export const STYLE_IDS: readonly string[] = MARTIAL_STYLES.map((m) => m.id);

/** Whether a style exists in a campaign year (D-438: one dated list). */
export const styleExists = (m: MartialStyle, year: number): boolean => (m.from === null || year >= m.from) && (m.to === null || year <= m.to);
