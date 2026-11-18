// Dev-only test start (D-178): rank and age, the Average Jedi Guardian from the closed form, marked as a test character.
import { TEST_START_DATE } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { migrateCharacterV4 } from '../../src/features/character/character';
import { computeCreation } from '../../src/features/character/creation';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { REGISTRY } from '../../src/state/registry';
import { absDayFromDate } from '../../src/engine/calendar';
import { createCampaign, DEFAULT_START_SECOND, validateNewCampaign } from '../../src/turn/campaign';
import { devFlag, TEST_START_CI, TEST_START_RANKS, testStartInput } from '../../src/turn/testStart';

describe('dev test start (D-178)', () => {
  it('only behind ?dev=1', () => {
    expect(devFlag('?dev=1')).toBe(true);
    expect(devFlag('')).toBe(false);
    expect(devFlag('?dev=0')).toBe(false);
  });
  it('each rank starts at the chosen age with closed-form levels, rank E and CI, and the test mark', async () => {
    for (const [rank, age] of [['initiate', 10], ['padawan', 16], ['knight', 28], ['master', 45]] as const) {
      const input = testStartInput({ name: 'Tess', rank, age, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
      expect(validateNewCampaign(input), rank).toEqual([]);
      const s = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${rank}`, branchId: 'b' }, 'x');
      expect(s.state.character.testCharacter).toBe(true);
      expect(s.state.ranks.rank).toBe(rank);
      expect(s.campaign.name).toBe('[TEST] Tess');
      // The same levels as computed creation of the Average Jedi Guardian at that age (the closed form).
      const c = computeCreation({ ...input.creation!, name: 'Tess', birthDay: absDayFromDate(input.birthDate), startDay: absDayFromDate(TEST_START_DATE) });
      for (const [id, lv] of Object.entries(c.levels)) expect(selectLevelExact(s.state, id), `${rank} ${id}`).toBeCloseTo(lv, 6);
      // Every combat Force ability the character knows gets the rank's CI.
      for (const id of ['forcePush', 'forceChoke', 'forceLightning', 'telekinesis']) {
        if ((c.startingXp[id] ?? 0) > 0 && TEST_START_CI[rank] > 0) expect(s.state.progression.CI[id]?.CI, `${rank} ${id}`).toBeGreaterThanOrEqual(TEST_START_CI[rank]);
      }
    }
    expect(TEST_START_RANKS).toEqual(['initiate', 'padawan', 'knight', 'master']);
  });
  it('normal creation never marks a test character, and older saves migrate to false', async () => {
    const input = { ...testStartInput({ name: 'Ned', rank: 'knight', age: 28, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND }) };
    delete (input as { test?: unknown }).test;
    const s = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c-n', branchId: 'b' }, 'x');
    expect(s.state.character.testCharacter).toBe(false);
    expect(migrateCharacterV4({ id: 'x', name: 'Old' }).testCharacter).toBe(false);
  });
});
