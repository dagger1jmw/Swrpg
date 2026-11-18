import { describe, expect, it } from 'vitest';
import { ACTION_TYPES, CHECK_RULES } from '../../src/data/checks.config';
import {
  basicRoll,
  check,
  clampDifficulty,
  dcForRating,
  effectiveLevel,
  gradeMargin,
  isCheckRequired,
  type LevelInputs,
} from '../../src/engine/rolls';
import { rollD20, seedRng, type RngState } from '../../src/engine/rng';

const rested = (level: number): LevelInputs => ({ level, woundPenalty: 0, rust: 0, vitalitySpent: false, fatigueEfficiency: 1 });

/** Finds an RNG state whose next d20 is the wanted face. */
function stateRolling(face: number): RngState {
  for (let i = 0; i < 10_000; i++) {
    const s = seedRng(`find-${i}`);
    if (rollD20(s)[0] === face) return s;
  }
  throw new Error('not found');
}

describe('rolls.md §1 basic roll', () => {
  it('effective level follows the formula', () => {
    expect(effectiveLevel(rested(50))).toBe(50);
    expect(effectiveLevel({ level: 50, woundPenalty: 0.2, rust: 0.1, vitalitySpent: true, fatigueEfficiency: 0.6 })).toBeCloseTo(
      50 * 0.8 * 0.9 * 0.9 * (1 - 0.25 * 0.4),
    );
  });

  it('total = d20 + level/10 + modifiers, each modifier kept with its source', () => {
    const [r] = basicRoll(stateRolling(11), 35, [
      { source: 'position', value: 1 },
      { source: 'terrain', value: -1 },
      { source: 'cover', value: 2 },
    ]);
    expect(r.d20).toBe(11);
    expect(r.levelBonus).toBe(3.5);
    expect(r.total).toBeCloseTo(11 + 3.5 + 2);
    expect(r.natural).toBeNull();
    expect(r.modifiers.map((m) => m.source)).toEqual(['position', 'terrain', 'cover']);
  });

  it('natural 20 adds 5, natural 1 subtracts 5', () => {
    const [hi] = basicRoll(stateRolling(20), 0, []);
    expect(hi.natural).toBe('nat20');
    expect(hi.total).toBe(25);
    const [lo] = basicRoll(stateRolling(1), 0, []);
    expect(lo.natural).toBe('nat1');
    expect(lo.total).toBe(-4);
  });

  it('test 5 (checks): no tier-gap bonus; one level changes the total by exactly 0.1', () => {
    const s = seedRng('tier');
    for (const lvl of [0, 20, 40, 60, 80, 100]) {
      const [a] = basicRoll(s, lvl, []);
      const [b] = basicRoll(s, lvl + 1, []);
      expect(b.total - a.total).toBeCloseTo(0.1);
    }
  });
});

describe('rolls.md §2 checks', () => {
  it('DC = 10 + rating / 10', () => {
    expect(dcForRating(40)).toBe(14);
    expect(dcForRating(80)).toBe(18);
  });

  it('margin, success and grade (D-69)', () => {
    const [c] = check(stateRolling(15), { label: 'Search', skillId: null, levelInputs: rested(0), modifiers: [], difficulty: 'moderate' });
    expect(c.dc).toBe(15);
    expect(c.margin).toBe(0);
    expect(c.success).toBe(true);
    expect(c.grade).toBe('narrow success');
    expect(gradeMargin(3.9)).toBe('narrow success');
    expect(gradeMargin(4)).toBe('clear success');
    expect(gradeMargin(16)).toBe('exceptional success');
    expect(gradeMargin(-0.1)).toBe('narrow failure');
    expect(gradeMargin(-3)).toBe('narrow failure');
    expect(gradeMargin(-4)).toBe('clear failure');
    expect(gradeMargin(-8.5)).toBe('bad failure');
  });

  it('a check is deterministic for the same state and advances the RNG', () => {
    const s = seedRng('det');
    const input = { label: 'x', skillId: null, levelInputs: rested(10), modifiers: [], difficulty: 'hard' as const };
    const [a, s1] = check(s, input);
    const [b, s2] = check(s, input);
    expect(a).toEqual(b);
    expect(s1).toEqual(s2);
    expect(s1).not.toEqual(s);
  });
});

describe('engine-decided checks (D-37)', () => {
  it('requirement comes from the action type and targets only', () => {
    expect(isCheckRequired('investigate', 0)).toBe(true);
    // M5: fights are duels, not a check (the D-70 stub is gone).
    expect(isCheckRequired('fight', 0)).toBe(false);
    expect(isCheckRequired('dialogue', 0)).toBe(false);
    expect(isCheckRequired('dialogue', 1)).toBe(true);
    expect(isCheckRequired('sleep', 3)).toBe(false);
  });

  it('clamps the proposed difficulty per action type and defaults when missing', () => {
    expect(clampDifficulty('dialogue', 'extreme')).toEqual({ difficulty: 'hard', clampedFrom: 'extreme' });
    expect(clampDifficulty('fight', 'trivial')).toEqual({ difficulty: 'easy', clampedFrom: 'trivial' });
    expect(clampDifficulty('investigate', 'hard')).toEqual({ difficulty: 'hard' });
    expect(clampDifficulty('forceUse', undefined)).toEqual({ difficulty: 'moderate' });
  });

  it('every action type has a rule whose default lies inside its range', () => {
    for (const t of ACTION_TYPES) {
      const r = CHECK_RULES[t];
      expect(clampDifficulty(t, r.default)).toEqual({ difficulty: r.default });
    }
  });
});
