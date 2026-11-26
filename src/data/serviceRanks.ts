// Rank ladders for the non-Force careers (m8-skills, D-513; ranks.md section 3a; design: m8-design-notes "Rank ladders").
// Each faction's branches as dated data (D-438: one dated list, read for the campaign year; negative = BBY), with the lore's
// titles where a faction's differ (SW_Characters_09_GGW_ColdWar_Part3a/3b: the SIS's Bureau Chief and Director (Marcus
// Trant), Imperial Intelligence's Cipher, Watcher, Keeper and Minister of Intelligence, the Republic's Supreme Commander,
// the Empire's Moffs and Grand Moffs). Promotion takes years of service in the rank, a skill minimum and recorded deeds; the
// years, minimums and deeds are invented (set against the officer and intelligence lines, spec/skills-m8.md section 8). The
// faction years are inferred from the eras the lore places them in. A story-only rung (Supreme Commander, Grand Moff) is
// an appointment the story makes, never a promotion by the ladder.
import type { MilitaryGrade } from './economy.config';

export type ServiceBranch = 'army' | 'navy' | 'intelligence';

export interface ServiceRung {
  title: string;
  /** Years in the rung below before this one (0 for the entry rung). */
  years: number;
  /** The skill minimum: the best of these skills must reach `min`. */
  skills: readonly string[];
  min: number;
  /** Recorded deeds needed since joining (flags the engine records, never the narrator). */
  deeds: number;
  /** The military pay grade it draws (economy.config MILITARY_PAY). */
  pay: MilitaryGrade;
  /** An appointment the story makes, not a promotion by the ladder. */
  storyOnly?: boolean;
}

export interface ServiceLadder {
  id: string;
  /** The faction in words (the game's faction ids are coarser). */
  faction: string;
  branch: ServiceBranch;
  from: number | null;
  to: number | null;
  rungs: readonly ServiceRung[];
  source: string;
}

const TAC = ['tactics'];
const INTEL = ['intelligence', 'investigation', 'stealth'];

const army = (o: { entry?: string; titles?: Partial<Record<'lieutenant' | 'captain' | 'major' | 'colonel' | 'general', string>>; top?: readonly ServiceRung[] } = {}): ServiceRung[] => [
  { title: o.titles?.lieutenant ?? 'lieutenant', years: 0, skills: TAC, min: 10, deeds: 0, pay: 'lieutenant' },
  { title: o.titles?.captain ?? 'captain', years: 3, skills: TAC, min: 25, deeds: 0, pay: 'captain' },
  { title: o.titles?.major ?? 'major', years: 4, skills: TAC, min: 35, deeds: 1, pay: 'major' },
  { title: o.titles?.colonel ?? 'colonel', years: 4, skills: TAC, min: 45, deeds: 2, pay: 'colonel' },
  { title: o.titles?.general ?? 'general', years: 5, skills: TAC, min: 55, deeds: 3, pay: 'general' },
  ...(o.top ?? []),
];
const navy = (top: readonly ServiceRung[] = []): ServiceRung[] => [
  { title: 'ensign', years: 0, skills: TAC, min: 10, deeds: 0, pay: 'lieutenant' },
  { title: 'lieutenant', years: 2, skills: TAC, min: 20, deeds: 0, pay: 'captain' },
  { title: 'captain', years: 5, skills: TAC, min: 35, deeds: 1, pay: 'colonel' },
  { title: 'commodore', years: 5, skills: TAC, min: 48, deeds: 2, pay: 'general' },
  { title: 'admiral', years: 5, skills: TAC, min: 58, deeds: 3, pay: 'general' },
  ...top,
];
const intel = (t: readonly [string, string, string, string]): ServiceRung[] => [
  { title: t[0], years: 0, skills: INTEL, min: 20, deeds: 0, pay: 'lieutenant' },
  { title: t[1], years: 4, skills: INTEL, min: 35, deeds: 1, pay: 'captain' },
  { title: t[2], years: 5, skills: INTEL, min: 48, deeds: 2, pay: 'colonel' },
  { title: t[3], years: 6, skills: INTEL, min: 60, deeds: 3, pay: 'general' },
];
const story = (title: string): ServiceRung => ({ title, years: 0, skills: TAC, min: 0, deeds: 0, pay: 'general', storyOnly: true });

const P3A = 'SW_Characters_09_GGW_ColdWar_Part3a';
const P3B = 'SW_Characters_09_GGW_ColdWar_Part3b';

export const SERVICE_LADDERS: readonly ServiceLadder[] = [
  // ---- the Galactic Republic (to the Empire, 19 BBY) ----
  { id: 'republicArmy', faction: 'the Republic Army', branch: 'army', from: null, to: -19, rungs: army({ top: [story('Supreme Commander')] }), source: `${P3A} (Jace Malcom: corporal 3,681, Supreme Commander 3,640; Garza a general)` },
  { id: 'republicNavy', faction: 'the Republic Navy', branch: 'navy', from: null, to: -19, rungs: navy(), source: `${P3A}; Andronikos Revel a Republic Navy captain` },
  { id: 'sis', faction: 'the Strategic Information Service (SIS)', branch: 'intelligence', from: -3700, to: -19, rungs: intel(['field agent', 'handler', 'Bureau Chief', 'Director of SIS']), source: `${P3A} (Marcus Trant: analyst, field agent, Bureau Chief, Director)` },
  // ---- the Sith Empire (Vitiate's; years inferred) ----
  { id: 'sithImperialArmy', faction: 'the Imperial Army (Sith Empire)', branch: 'army', from: -5000, to: -3000, rungs: army({ top: [story('Moff'), story('Grand Moff')] }), source: `${P3B} (Quinn a lieutenant 3,653; Kilran a captain at the Sacking, Grand Moff after it; Moffs Broysc, Tarrick)` },
  { id: 'sithImperialNavy', faction: 'the Imperial Navy (Sith Empire)', branch: 'navy', from: -5000, to: -3000, rungs: navy(), source: `${P3B} (Layek Davos an admiral)` },
  { id: 'sithImperialIntelligence', faction: 'Imperial Intelligence (Sith Empire)', branch: 'intelligence', from: -5000, to: -3000, rungs: intel(['Cipher agent', 'Watcher', 'Keeper', 'Minister of Intelligence']), source: `${P3B} (Cipher Nine; Shara Jenn, Watcher Two, later Keeper; Keeper, head of Operations, later Minister)` },
  // ---- the Galactic Empire (19 BBY on) ----
  { id: 'imperialArmy', faction: 'the Imperial Army', branch: 'army', from: -19, to: null, rungs: army({ top: [story('Moff'), story('Grand Moff')] }), source: 'SW_Martial_Cultures_AllEras_Part3 §3 (the Imperial Academy system)' },
  { id: 'imperialNavy', faction: 'the Imperial Navy', branch: 'navy', from: -19, to: null, rungs: navy([story('Grand Admiral')]), source: 'SW_Martial_Cultures_AllEras_Part3 §3; SW_Characters_14 (Grand Admiral Thrawn)' },
  { id: 'imperialIntelligence', faction: 'Imperial Intelligence', branch: 'intelligence', from: -19, to: null, rungs: intel(['agent', 'handler', 'section chief', 'Director of Imperial Intelligence']), source: 'SW_Timeline_4_25ABY_Part1 (Ysanne Isard)' },
  // ---- the Rebel Alliance and the New Republic ----
  { id: 'allianceArmy', faction: 'the Alliance Army', branch: 'army', from: -2, to: 4, rungs: army(), source: 'SW_Characters_13 (Lando Calrissian a general)' },
  { id: 'allianceNavy', faction: 'the Alliance Fleet', branch: 'navy', from: -2, to: 4, rungs: navy(), source: 'SW_Characters_13 (Admiral Ackbar)' },
  { id: 'allianceIntelligence', faction: 'Alliance Intelligence', branch: 'intelligence', from: -2, to: 4, rungs: intel(['agent', 'handler', 'section chief', 'head of Alliance Intelligence']), source: 'the timeline (Airen Cracken)' },
  { id: 'newRepublicArmy', faction: 'the New Republic Army', branch: 'army', from: 4, to: null, rungs: army(), source: 'SW_Martial_Cultures_AllEras_Part3 §6' },
  { id: 'newRepublicNavy', faction: 'the New Republic Defense Fleet', branch: 'navy', from: 4, to: null, rungs: navy(), source: 'SW_Martial_Cultures_AllEras_Part3 §6; SW_Characters_14 (Wedge Antilles a general)' },
  { id: 'newRepublicIntelligence', faction: 'New Republic Intelligence', branch: 'intelligence', from: 4, to: null, rungs: intel(['agent', 'handler', 'section chief', 'Director of New Republic Intelligence']), source: 'SW_Martial_Cultures_AllEras_Part3 §1 (Kubariet, an NRI agent)' },
];

export const SERVICE_LADDER_BY_ID: ReadonlyMap<string, ServiceLadder> = new Map(SERVICE_LADDERS.map((l) => [l.id, l]));
export const SERVICE_LADDER_IDS: readonly string[] = SERVICE_LADDERS.map((l) => l.id);

/** A ladder's branch (training: staff work and tradecraft open to the branches). */
export const serviceBranchOf = (ladderId: string): string => SERVICE_LADDER_BY_ID.get(ladderId)?.branch ?? 'none';

/** Whether a ladder exists in a campaign year. */
export const ladderExists = (l: ServiceLadder, year: number): boolean => (l.from === null || year >= l.from) && (l.to === null || year <= l.to);
