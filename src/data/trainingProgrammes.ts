// Training programmes (m8-skills, D-513; spec/skills-m8.md section 6; design: m8-design-notes "Training programmes"). Dated
// programmes a character can enrol in, each with entry rules and curriculum weights (the routine's fill shares while
// enrolled). Lengths from SW_Martial_Cultures_AllEras_Part3 (training tables, game notes 2): Carida's stormtrooper programme
// 2 years (full course 4), Carida flight school 2, Prefsbelt IV 3, the Royal Guard 1, Raithal 1, the Mandalorian verd'goten
// ages 8-13, the Wookiee hrrtayyk about 12; clone regulars ten years of accelerated life, commandos close to ten. Where the
// sources give no length (Jared): officer academies 3-4 years, universities 4. Senatorial apprenticeships stay story-only.
// Curriculum weights, entry ages and the hrrtayyk's span are invented; years are campaign years (negative = BBY).
import type { SpeciesId } from './entities.config';

export interface TrainingProgramme {
  id: string;
  name: string;
  where: string;
  from: number | null;
  to: number | null;
  /** Length in years: one number, or a range (the programme's own length is the middle). */
  years: number | readonly [number, number];
  /** 'lore' when the sources give the length. */
  lengthSource: 'lore' | 'invented';
  /** Entry: an age range (by the end of the window the programme must still fit), species, and anything else in words. */
  entry: { minAge?: number; maxAge?: number; species?: readonly SpeciesId[]; archetypes?: readonly string[]; note: string };
  /** Curriculum weights: the routine's fill shares while enrolled (normalized at use). */
  curriculum: Readonly<Record<string, number>>;
  /** What finishing it gives the story (a commission, a rite passed); the narrator's line. */
  graduation: string;
  source: string;
}

const P3 = 'SW_Martial_Cultures_AllEras_Part3';

export const TRAINING_PROGRAMMES: readonly TrainingProgramme[] = [
  {
    id: 'caridaStormtrooper',
    name: "Carida's stormtrooper programme",
    where: 'the Academy of Carida',
    from: -19,
    to: 11,
    years: 2,
    lengthSource: 'lore',
    entry: { minAge: 16, maxAge: 30, note: 'the best and bravest army cadets; most fail the physical requirements or wash out' },
    curriculum: { blaster: 1.0, melee: 0.4, tactics: 0.3, tracking: 0.2, strength: 0.4, agility: 0.4, endurance: 0.5, willpower: 0.3 },
    graduation: 'passes stormtrooper training: a point of honour',
    source: `${P3} §3-4`,
  },
  {
    id: 'caridaFull',
    name: "Carida's full course",
    where: 'the Academy of Carida',
    from: -19,
    to: 11,
    years: 4,
    lengthSource: 'lore',
    entry: { minAge: 16, maxAge: 26, note: 'army, navy and flight cadets; about 500,000 credits a student to the Empire' },
    curriculum: { tactics: 1.0, blaster: 0.6, intelligence: 0.4, melee: 0.3, charisma: 0.2, strength: 0.3, agility: 0.3, endurance: 0.3, willpower: 0.3 },
    graduation: 'graduates Carida: a commission',
    source: `${P3} §3`,
  },
  {
    id: 'caridaFlight',
    name: 'Flight school on Carida',
    where: 'the Academy of Carida',
    from: -19,
    to: 11,
    years: 2,
    lengthSource: 'lore',
    entry: { minAge: 16, maxAge: 28, note: 'top graduates of the sector academies (Han Solo took two years here instead of Prefsbelt)' },
    curriculum: { piloting: 1.0, gunnery: 0.7, repair: 0.2, intelligence: 0.2, agility: 0.3, willpower: 0.2 },
    graduation: 'earns pilot wings',
    source: `${P3} §3`,
  },
  {
    id: 'prefsbelt',
    name: 'The Naval Academy on Prefsbelt IV',
    where: 'Prefsbelt IV',
    from: -10966,
    to: null,
    years: 3,
    lengthSource: 'lore',
    entry: { minAge: 16, maxAge: 26, note: 'midshipmen: tactical simulation and leadership, then rotations as ensigns' },
    curriculum: { tactics: 1.0, intelligence: 0.5, piloting: 0.5, charisma: 0.3, gunnery: 0.2, repair: 0.2, medicine: 0.1, willpower: 0.3 },
    graduation: 'commissioned ensign in the navy',
    source: `${P3} §2-3`,
  },
  {
    id: 'raithal',
    name: 'Raithal Academy',
    where: 'Raithal',
    from: -19,
    to: null,
    years: 1,
    lengthSource: 'lore',
    entry: { minAge: 17, maxAge: 30, note: 'the most prestigious Army school: simulations and live-fire drop camps' },
    curriculum: { tactics: 1.0, blaster: 0.5, intelligence: 0.3, endurance: 0.3, willpower: 0.2 },
    graduation: 'an Army commission (most go on to Corulag)',
    source: `${P3} §3`,
  },
  {
    id: 'royalGuard',
    name: "The Emperor's Royal Guard academy",
    where: 'Yinchorr',
    from: -19,
    to: 11,
    years: 1,
    lengthSource: 'lore',
    entry: { minAge: 20, maxAge: 40, note: 'only the most skilled stormtroopers; size, strength, intelligence and loyalty; failure often meant death (The Squall)' },
    curriculum: { melee: 1.0, blaster: 0.4, strength: 0.5, agility: 0.5, endurance: 0.5, willpower: 0.4 },
    graduation: 'survives The Squall and swears the Oath of Obedience',
    source: `${P3} §5`,
  },
  {
    id: 'verdGoten',
    name: "The verd'goten",
    where: 'with a Mandalorian parent',
    from: null,
    to: null,
    years: 5,
    lengthSource: 'lore',
    entry: { minAge: 8, maxAge: 8, note: 'military and survival skills under a parent from about 8, tested at 13' },
    curriculum: { blaster: 1.0, melee: 0.6, tracking: 0.4, strength: 0.4, agility: 0.4, endurance: 0.4, willpower: 0.2 },
    graduation: 'passes the verd\'goten at 13: a legal adult with equal standing',
    source: `${P3} game notes; SW_Martial_Cultures_AllEras_Part2 §12`,
  },
  {
    id: 'hrrtayyk',
    name: 'The hrrtayyk',
    where: 'the Shadowlands of Kashyyyk',
    from: null,
    to: null,
    years: 0.25,
    lengthSource: 'invented',
    entry: { minAge: 11, maxAge: 14, species: ['wookiee'], note: 'the Wookiee coming of age, usually about 12 (Chewbacca at 13)' },
    curriculum: { tracking: 1.0, stealth: 0.5, melee: 0.5, endurance: 0.4, willpower: 0.3 },
    graduation: "passes the Test of Ascension: the rrakktorr is unlocked",
    source: `${P3} game notes; SW_Martial_Cultures_AllEras_Part2 §6`,
  },
  {
    id: 'cloneRegular',
    name: 'Clone trooper training on Kamino',
    where: 'Tipoca City, Kamino',
    from: -32,
    to: -19,
    years: 10,
    lengthSource: 'lore',
    entry: { minAge: 0, maxAge: 0, note: 'decanted into birth cohorts of 32; flash-training and learning helmets; combat-ready at ten (accelerated growth)' },
    curriculum: { blaster: 1.0, tactics: 0.3, melee: 0.2, strength: 0.4, agility: 0.4, endurance: 0.4, willpower: 0.3 },
    graduation: 'combat-ready: joins the Grand Army with the cohort',
    source: `${P3} §1`,
  },
  {
    id: 'cloneCommando',
    name: 'Clone commando training',
    where: 'Kamino, under the Cuy\'val Dar',
    from: -30,
    to: -19,
    years: 10,
    lengthSource: 'lore',
    entry: { minAge: 0, maxAge: 1, note: 'selected from regular batches; pods of four; close to ten years until Geonosis' },
    curriculum: { blaster: 1.0, stealth: 0.6, melee: 0.6, tactics: 0.5, repair: 0.3, medicine: 0.2, strength: 0.4, agility: 0.4, endurance: 0.4, willpower: 0.4 },
    graduation: 'deployed as a commando squad',
    source: `${P3} §1`,
  },
  {
    id: 'officerAcademy',
    name: 'An officer academy',
    where: 'a military academy (Carida, Corulag, the Republic and Imperial service academies)',
    from: null,
    to: null,
    years: [3, 4],
    lengthSource: 'invented',
    entry: { minAge: 16, maxAge: 26, note: 'officer candidates (Jared: 3-4 years where the sources give none)' },
    curriculum: { tactics: 1.0, intelligence: 0.6, charisma: 0.3, blaster: 0.3, endurance: 0.2, willpower: 0.2 },
    graduation: 'commissioned lieutenant',
    source: 'Jared (m8-design-notes, Training programmes)',
  },
  {
    id: 'university',
    name: 'A university',
    where: 'a university or academy of learning',
    from: null,
    to: null,
    years: 4,
    lengthSource: 'invented',
    entry: { minAge: 16, maxAge: 60, note: 'Jared: 4 years where the sources give none' },
    curriculum: { intelligence: 1.0, investigation: 0.4, charisma: 0.2, medicine: 0.1, willpower: 0.2 },
    graduation: 'graduates with a degree',
    source: 'Jared (m8-design-notes, Training programmes)',
  },
];

export const PROGRAMME_BY_ID: ReadonlyMap<string, TrainingProgramme> = new Map(TRAINING_PROGRAMMES.map((p) => [p.id, p]));

/** The programme's length in years (a range runs its middle). */
export const programmeYears = (p: TrainingProgramme): number => (typeof p.years === 'number' ? p.years : (p.years[0] + p.years[1]) / 2);
