import { describe, expect, it } from 'vitest';
import {
  STUB_FIGHT_AS_SINGLE_CHECK,
  STUB_ALIGNMENT_MULT,
  STUB_DARK_PRESSURE,
  STUB_TEACHER_ARCHETYPE,
  STUB_TEACHER_START_AGE,
  stubVitalitySpent,
  stubWoundPenalty,
} from '../../src/data/stubs';

// architecture §15: each stub's value holds until the named milestone replaces it.
describe('stubs (D-56, D-70)', () => {
  it('wound penalty 0 and Vitality not spent until M5', () => {
    expect(stubWoundPenalty()).toBe(0);
    expect(stubVitalitySpent()).toBe(false);
  });
  // Rust, e(f) and skill levels were replaced in M3 by progression and health selectors.
  it('teacher levels use the Average Jedi Guardian from age 4 until M5', () => {
    expect(STUB_TEACHER_ARCHETYPE).toBe('jediGuardian');
    expect(STUB_TEACHER_START_AGE).toBe(4);
  });
  it('alignment multiplier 1.0 and dark pressure 0 until M6', () => {
    expect(STUB_ALIGNMENT_MULT).toBe(1);
    expect(STUB_DARK_PRESSURE).toBe(0);
  });
  it('fight resolves as a single check until M5', () => {
    expect(STUB_FIGHT_AS_SINGLE_CHECK).toBe(true);
  });
});
