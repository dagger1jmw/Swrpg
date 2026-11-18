// progression-numbers §7-8 tests 8 and 9, combat-xp §3 (E and CI gains), D-143 A (Order classes as sparring).
import { describe, expect, it } from 'vitest';
import { bankCap, drillCeiling, eSourceFor, gainCI, gainE, releaseBank, releaseUntil, splitDrillXp } from '../../src/engine/appliedExperience';
import { levelExact, xpForLevel } from '../../src/engine/curve';

describe('applied experience E (combat-xp §3)', () => {
  it('gains by stakes, scaled by (1 - E/120)', () => {
    expect(gainE({ E: 0, eSpar: 0 }, 'skirmish').E).toBe(3);
    expect(gainE({ E: 60, eSpar: 0 }, 'serious').E).toBe(63);
    expect(gainE({ E: 0, eSpar: 0 }, 'lethalStronger').E).toBe(10);
    expect(eSourceFor('lethal', { opponentGap: 5 })).toBe('lethalStronger');
    expect(eSourceFor('lethal', { opponentGap: 4 })).toBe('lethal');
    expect(eSourceFor('spar', { opponentGap: 0, master: true })).toBe('sparMaster');
  });
  it('sparring E (and Order classes counted as sparring) stops at 15; real fights keep adding', () => {
    let s = { E: 0, eSpar: 0 };
    for (let i = 0; i < 2000; i++) s = gainE(s, 'sparMaster');
    expect(s.E).toBeCloseTo(15, 6);
    s = gainE(s, 'skirmish');
    expect(s.E).toBeGreaterThan(15);
    expect(s.eSpar).toBeCloseTo(15, 6);
  });
});

describe('combat integration CI (progression-numbers §8)', () => {
  it('gains per use by stakes, scaled; sparring CI capped at 20', () => {
    expect(gainCI({ CI: 0, ciSpar: 0 }, 'lethal').CI).toBe(2);
    let s = { CI: 0, ciSpar: 0 };
    for (let i = 0; i < 5000; i++) s = gainCI(s, 'spar');
    expect(s.CI).toBeCloseTo(20, 6);
  });
  it('reference: Force Push CI 10 after 20 skirmish uses -> 18.8; after 10 life-or-death uses -> 27.0', () => {
    let s = { CI: 10, ciSpar: 0 };
    for (let i = 0; i < 20; i++) s = gainCI(s, 'skirmish');
    expect(s.CI).toBeCloseTo(18.8, 1);
    let t = { CI: 10, ciSpar: 0 };
    for (let i = 0; i < 10; i++) t = gainCI(t, 'lethal');
    expect(t.CI).toBeCloseTo(27.0, 1);
  });
});

describe('drill ceiling and bank (progression-numbers §7, tests 8 and 9)', () => {
  it('ceiling = 25 + E', () => {
    expect(drillCeiling(15)).toBe(40);
  });
  it('test 8: with sparring only (E <= 15, ceiling 40), a form gains at most 25% of normal XP above 40', () => {
    const xp = xpForLevel(40);
    const split = splitDrillXp(xp, 100, 15, 0);
    expect(split.applied).toBeCloseTo(25);
    expect(split.banked).toBeCloseTo(75);
    const below = splitDrillXp(xpForLevel(30), 100, 15, 0);
    expect(below.applied).toBe(100);
  });
  it('the bank is capped at the XP for 15 levels above the current level', () => {
    const xp = xpForLevel(40);
    const cap = bankCap(xp);
    expect(cap).toBeCloseTo(xpForLevel(55) - xp);
    const split = splitDrillXp(xp, cap * 3, 0, cap);
    expect(cap + split.banked).toBeCloseTo(bankCap(xp + split.applied));
    expect(split.overflow).toBeGreaterThan(0);
  });
  it('test 9: the plateau scenario gains 2+ levels within 30 days of combat; after day 60 the rest stays banked', () => {
    // Reference (Obi-Wan pace): level 40.9 with 1,022 banked; a life-or-death fight lifts E to 23.8 (ceiling 48.8).
    let xp = xpForLevel(40.9);
    let bank = 1022;
    const start = levelExact(xp);
    const until = releaseUntil(0);
    for (let day = 0; day < 30; day++) {
      const r = releaseBank(xp, bank, 23.8);
      xp += r;
      bank -= r;
    }
    expect(levelExact(xp) - start).toBeGreaterThanOrEqual(2);
    for (let day = 30; day < until; day++) {
      const r = releaseBank(xp, bank, 23.8);
      xp += r;
      bank -= r;
    }
    expect(bank).toBeGreaterThan(0);
    // Past the window nothing more is released (the feature stops calling releaseBank); the bank is kept.
    expect(until).toBe(60);
  });
});
