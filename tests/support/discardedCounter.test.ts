// The lifetime harness's discarded counter (D-457, Jared): it reads the clamp's notes where they are written (the routine's
// session logs for training, the fight's notes for combat). Before, it read the applied events, which carry no clamp
// notes, so it always read 0. Here the Average's per-hour table is shrunk so the clamp must fire.
import { describe, expect, it, vi } from 'vitest';
import { AVERAGE } from '../lifetime/profiles';
import { discardedFromDays, discardedFromNotes, runLifetime } from './lifetime';

vi.mock('../../src/data/paceRates', () => ({ R_AVG: {}, R_AVG_FORM: [[0, 0.01]], R_AVG_ALL: [[0, 0.01]] }));

describe('the discarded counter (D-457)', () => {
  it('reads the training and combat clamp notes per skill', () => {
    expect(discardedFromNotes(['4.0x pace clamp: 1.25 XP to soresu discarded', 'combat XP 3.00 (skirmish, won)', '4.0x pace clamp: 0.50 combat XP to soresu discarded', '4.0x pace clamp: 2.00 XP to willpower discarded'])).toEqual({ soresu: 1.75, willpower: 2 });
    expect(discardedFromDays([{ day: 0, label: '', trainingDay: true, recovery: false, hoursTrained: 2, notes: [], notices: [], endF: 0, sessions: [{ activityId: 'a', skillId: 'soresu', hours: 2, credited: {}, outcome: 'normal', discarded: { soresu: 3, strength: 0.5 } }] }])).toEqual({ soresu: 3, strength: 0.5 });
  });

  it('reads non-zero on a life where the clamp fires', () => {
    const r = runLifetime(AVERAGE, 0.1);
    expect(r.discarded).toBeGreaterThan(0);
    expect(Object.values(r.discardedBySkill).reduce((a, b) => a + b, 0)).toBeCloseTo(r.discarded, 6);
    expect(Object.keys(r.discardedBySkill).length).toBeGreaterThan(0);
  }, 60_000);
});
