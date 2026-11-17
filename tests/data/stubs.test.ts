import { describe, expect, it } from 'vitest';
import {
  STUB_FIGHT_AS_SINGLE_CHECK,
  stubFatigueEfficiency,
  stubRust,
  stubSkillLevel,
  stubVitalitySpent,
  stubWoundPenalty,
} from '../../src/data/stubs';

// architecture §15: each stub's value holds until the named milestone replaces it.
describe('M1 stubs (D-56, D-70)', () => {
  it('wound penalty 0 and Vitality not spent until M5', () => {
    expect(stubWoundPenalty()).toBe(0);
    expect(stubVitalitySpent()).toBe(false);
  });
  it('rust 0 and e(f) = 1 until M3', () => {
    expect(stubRust('anything')).toBe(0);
    expect(stubFatigueEfficiency()).toBe(1);
  });
  it('skill level 0 until M3', () => {
    expect(stubSkillLevel(undefined)).toBe(0);
    expect(stubSkillLevel('formIII')).toBe(0);
  });
  it('fight resolves as a single check until M5', () => {
    expect(STUB_FIGHT_AS_SINGLE_CHECK).toBe(true);
  });
});
