// The career youth phase (D-461, Jared): a career that starts before CAREER_YOUTH_TO has one measured pace to that age,
// then its adult pace (the training budget reaches adult hours at 15). The Mandalorian (start 8) is the one such career.
import { describe, expect, it } from 'vitest';
import { TEST_START_DATE } from '../support/dates';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CAREER_YOUTH_TO } from '../../src/data/progression.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { closedFormLevel, phasesFor } from '../../src/engine/closedForm';
import { computeCreation, type CreationInput } from '../../src/features/character/creation';

const START = absDayFromDate(TEST_START_DATE);
const mando = (age: number, start: number): CreationInput => ({
  name: 'Vhett',
  birthDay: START - Math.round(age * 368),
  startDay: START,
  speciesId: 'human',
  path: 'career',
  archetype: 'mandalorian',
  rank: 'career',
  trainingStartAge: start,
  talents: {},
  dominantHand: 'right',
});

describe('the career youth phase (D-461)', () => {
  it('one phase splits at CAREER_YOUTH_TO when the archetype has a youth pace; without one it is unchanged', () => {
    const ages = { padawanAge: 8, knightAge: 8 };
    expect(phasesFor({ knight: 1.4, youth: 1.1 }, ages, true)).toEqual([
      { from: -Infinity, to: CAREER_YOUTH_TO, pace: 1.1 },
      { from: CAREER_YOUTH_TO, to: Infinity, pace: 1.4 },
    ]);
    expect(phasesFor({ knight: 1.4 }, ages, true)).toEqual([{ from: -Infinity, to: Infinity, pace: 1.4 }]);
    // The Order's phases ignore it.
    expect(phasesFor({ initiate: 1, padawan: 2, knight: 3, youth: 9 }, { padawanAge: 12, knightAge: 25 }, false).map((p) => p.pace)).toEqual([1, 2, 3]);
  });

  it('only careers that start before 15 carry one (the Mandalorian), and its youth pace is below the adult pace', () => {
    for (const a of ARCHETYPE_BY_ID.values()) {
      if (a.path === 'career' && a.startAge < CAREER_YOUTH_TO) expect(a.youthPaces, a.id).toBeDefined();
      else expect(a.youthPaces, a.id).toBeUndefined();
    }
    const m = ARCHETYPE_BY_ID.get('mandalorian')!;
    expect(m.youthPaces!['blaster']!).toBeLessThan(m.paces.knight!['blaster']!);
  });

  it('a created Mandalorian (start 8) at 33 matches npc test 7\'s loop (59.75) within 1; one starting at 16 reads the adult pace only', () => {
    const c = computeCreation(mando(33, 8));
    expect(c.errors).toEqual([]);
    expect(Math.abs(c.levels['blaster']! - 59.75)).toBeLessThanOrEqual(1);
    const m = ARCHETYPE_BY_ID.get('mandalorian')!;
    const late = computeCreation(mando(30, 16));
    const adultOnly = closedFormLevel({ row: 'technique', startAge: 16, age: 30, phases: [{ from: -Infinity, to: Infinity, pace: m.paces.knight!['blaster']! }] });
    expect(late.levels['blaster']!).toBeCloseTo(adultOnly, 6);
  });
});
