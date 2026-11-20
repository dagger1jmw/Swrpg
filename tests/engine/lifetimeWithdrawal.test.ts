// D-264: the lifetime harness plays as a sensible Jedi and disengages from a losing fight.
import { afterEach, describe, expect, it } from 'vitest';
import { runUntilBeat, startDuel, type DuelState } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { forceUser, REAL } from '../support/duelSim';
import { fightWithWithdrawal, PLAYER_WITHDRAWAL, wantsToWithdraw } from '../support/lifetime';

afterEach(() => {
  PLAYER_WITHDRAWAL.enabled = true;
});

describe('player withdrawal in the lifetime harness', () => {
  it('with the rule off, the beat-by-beat fight is the fight run to its end', () => {
    PLAYER_WITHDRAWAL.enabled = false;
    for (let i = 0; i < 20; i++) {
      const start = startDuel(forceUser('PC', 40), [forceUser('B', 45)], seedRng(`same${i}`));
      expect(JSON.stringify(fightWithWithdrawal(start, REAL, 0))).toBe(JSON.stringify(runUntilBeat(start, REAL, 0, 'toEnd', 3000).state));
    }
  });
  it('withdraws when severely wounded, near Spent while losing, or against a clearly stronger opponent', () => {
    const d = startDuel(forceUser('PC', 40), [forceUser('B', 40)], seedRng('w'));
    expect(wantsToWithdraw(d, 0)).toBe(false);
    const severe: DuelState = { ...d, a: { ...d.a, wounds: [{ id: 'w', part: 'leftArm', severity: 'severe', W: 25, stabilized: false, healProgress: 0, day: 0, source: 'combat' }] } };
    expect(wantsToWithdraw(severe, 0)).toBe(true);
    expect(wantsToWithdraw(severe, 1)).toBe(false);
    const low = { ...d.a, vitality: d.a.maxVitality * 0.1 };
    expect(wantsToWithdraw({ ...d, a: low, advantage: -3 }, 0)).toBe(true);
    expect(wantsToWithdraw({ ...d, a: low, advantage: 1 }, 0)).toBe(false);
    expect(wantsToWithdraw({ ...d, opponents: [forceUser('B', 55)] }, 0)).toBe(true);
  });
  it('a disengage ends the fight as fled (no winner); a losing profile gets out of some fights', () => {
    let fled = 0;
    for (let i = 0; i < 40; i++) {
      const out = fightWithWithdrawal(startDuel(forceUser('PC', 40), [forceUser('B', 48)], seedRng(`lose${i}`)), REAL, 0);
      if (out.end?.reason === 'stopped') {
        fled++;
        expect(out.end.winner).toBeNull();
      }
    }
    expect(fled).toBeGreaterThan(0);
  });
});
