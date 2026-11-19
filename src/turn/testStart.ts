// Dev-only test start (Jared, D-178; archetypes and species D-215): pick an archetype (Jedi Guardian, Consular,
// Sentinel, Sith Warrior, Inquisitor, soldier, smuggler, bounty hunter), a species, a rank and an age; the character's
// levels come from the closed form (computed creation, the same growth NPC generation uses), with creation's starting E
// and a sparring-level CI for the rank. Skills and equipment follow the archetype (a smuggler carries a blaster pistol
// and has no Force; a Sith knows Choke and, in the test start, Lightning). It is kept as a story exception when the
// rank's minimums are not met, and marked testCharacter in the save. Behind the ?dev=1 flag only: never part of the
// normal creation flow. Pure.
import { FORCE_ACTION_ABILITY } from '../engine/combatForce';
import { absDayFromDate, dateFromAbsDay, type CalendarDate } from '../engine/calendar';
import { ARCHETYPE_BY_ID } from '../data/archetypes';
import { RANKS } from '../data/rankMinimums';
import type { NewCampaignInput } from './campaign';

export const TEST_START_RANKS = ['initiate', 'padawan', 'knight', 'master'] as const;
export type TestStartRank = (typeof TEST_START_RANKS)[number];

/** The archetypes the test start offers (D-215), each with its path. */
export const TEST_START_ARCHETYPES = {
  jediGuardian: 'jedi',
  jediConsular: 'jedi',
  jediSentinel: 'jedi',
  sithWarrior: 'sith',
  sithInquisitor: 'sith',
  soldier: 'career',
  smuggler: 'career',
  bountyHunter: 'career',
} as const;
export type TestStartArchetype = keyof typeof TEST_START_ARCHETYPES;

/** The rank of each test-start tier on each path (D-215): a Sith Knight is a Sith Lord; a career has one rank. */
const RANK_ON_PATH: Readonly<Record<'jedi' | 'sith' | 'career', Readonly<Record<TestStartRank, string>>>> = {
  jedi: { initiate: 'initiate', padawan: 'padawan', knight: 'knight', master: 'master' },
  sith: { initiate: 'acolyte', padawan: 'apprentice', knight: 'lord', master: 'lord' },
  career: { initiate: 'career', padawan: 'career', knight: 'career', master: 'career' },
};
/** The age training starts at by path (design defaults inside PATH_START_RANGE): Jedi 4, Sith 10, a career 16. */
const TRAINING_START: Readonly<Record<'jedi' | 'sith' | 'career', number>> = { jedi: 4, sith: 10, career: 16 };

/**
 * CI for the combat Force abilities the character knows, by rank (design default): sparring CI is capped at 20
 * (progression-numbers §8), so a Knight or Master who has sparred for years sits at the cap; a Padawan halfway.
 */
export const TEST_START_CI: Readonly<Record<TestStartRank, number>> = { initiate: 0, padawan: 10, knight: 20, master: 20 };

/**
 * Force abilities a test start adds beyond the archetype's own, with the ability whose starting XP they copy (D-215):
 * Jared's test plan has the Sith use Lightning, which the Sith archetypes do not train (D-191's Sith core is Telekinesis,
 * Push, Choke and Jump). Test starts only; normal creation and NPCs are unchanged.
 */
export const TEST_START_GRANTS: Readonly<Partial<Record<TestStartArchetype, Readonly<Record<string, string>>>>> = {
  sithWarrior: { forceLightning: 'forceChoke' },
  sithInquisitor: { forceLightning: 'forceChoke' },
};

/** True when the page was opened with ?dev=1 (the dev flag for the test start). */
export function devFlag(search: string): boolean {
  return new URLSearchParams(search).get('dev') === '1';
}

export interface TestStartRequest {
  name: string;
  rank: TestStartRank;
  /** Age in years at the start date. */
  age: number;
  startDate: CalendarDate;
  startSecond: number;
  /** D-180: the situation the opening starts in, overriding the generated opening (optional). */
  scenario?: string;
  /** D-215: the archetype (default the Jedi Guardian) and the species (default human). */
  archetype?: TestStartArchetype;
  speciesId?: string;
}

/** The new-campaign input for a test start: the Average character of that archetype at that rank and age. */
export function testStartInput(r: TestStartRequest): NewCampaignInput {
  const archetype = r.archetype ?? 'jediGuardian';
  const path = TEST_START_ARCHETYPES[archetype];
  const rank = RANK_ON_PATH[path][r.rank];
  const startDay = absDayFromDate(r.startDate);
  const birthDate = dateFromAbsDay(startDay - Math.round(r.age * 368));
  const force = path !== 'career';
  const rankName = RANKS.find((x) => x.id === rank)?.name ?? rank;
  const archName = ARCHETYPE_BY_ID.get(archetype)?.name ?? archetype;
  const grants = TEST_START_GRANTS[archetype];
  return {
    name: r.name.trim() || `Test ${rank}`,
    birthDate,
    startDate: r.startDate,
    startSecond: r.startSecond,
    premise: `A test character: ${path === 'career' ? `a ${archName.toLowerCase()}` : `a ${rankName} (${archName})`}, age ${r.age}.`,
    creation: { speciesId: r.speciesId ?? 'human', path, archetype, rank, trainingStartAge: Math.min(TRAINING_START[path], Math.max(1, Math.floor(r.age) - 1)), talents: {}, dominantHand: 'right', storyException: true },
    test: {
      ci: force ? TEST_START_CI[r.rank] : 0,
      abilities: force ? Object.values(FORCE_ACTION_ABILITY) : [],
      ...(grants ? { grants } : {}),
      ...(r.scenario?.trim() ? { scenario: r.scenario.trim() } : {}),
    },
  };
}
