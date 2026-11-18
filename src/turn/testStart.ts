// Dev-only test start (Jared, D-178): pick a rank (Initiate, Padawan, Knight, Master) and an age; the character is an
// Average Human Jedi Guardian (training from 4, no talents) whose levels come from the closed form (computed creation,
// the same growth NPC generation uses), with creation's starting E and a sparring-level CI for the rank. It is kept as a
// story exception when the rank's minimums are not met, and marked testCharacter in the save. Behind the ?dev=1 flag
// only: never part of the normal creation flow. Pure.
import { FORCE_ACTION_ABILITY } from '../engine/combatForce';
import { absDayFromDate, dateFromAbsDay, type CalendarDate } from '../engine/calendar';
import type { NewCampaignInput } from './campaign';

export const TEST_START_RANKS = ['initiate', 'padawan', 'knight', 'master'] as const;
export type TestStartRank = (typeof TEST_START_RANKS)[number];

/**
 * CI for the combat Force abilities the character knows, by rank (design default): sparring CI is capped at 20
 * (progression-numbers §8), so a Knight or Master who has sparred for years sits at the cap; a Padawan halfway.
 */
export const TEST_START_CI: Readonly<Record<TestStartRank, number>> = { initiate: 0, padawan: 10, knight: 20, master: 20 };

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
}

/** The new-campaign input for a test start: the Average Jedi Guardian at that rank and age. */
export function testStartInput(r: TestStartRequest): NewCampaignInput {
  const startDay = absDayFromDate(r.startDate);
  const birthDate = dateFromAbsDay(startDay - Math.round(r.age * 368));
  return {
    name: r.name.trim() || `Test ${r.rank}`,
    birthDate,
    startDate: r.startDate,
    startSecond: r.startSecond,
    premise: `A test character: a ${r.rank} of the Jedi Order, age ${r.age}.`,
    creation: { speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: r.rank, trainingStartAge: 4, talents: {}, dominantHand: 'right', storyException: true },
    test: { ci: TEST_START_CI[r.rank], abilities: Object.values(FORCE_ACTION_ABILITY), ...(r.scenario?.trim() ? { scenario: r.scenario.trim() } : {}) },
  };
}
