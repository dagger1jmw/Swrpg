// progression-numbers §7-8 tests 8 and 9, combat-xp §3 (E and CI gains), D-143 A (Order classes as sparring), D-163
// (sparring a stronger partner, group sparring).
import { describe, expect, it } from 'vitest';
import { bankCap, drillCeiling, eGainFor, gainCI, gainE, releaseBank, releaseUntil, sparGroupLevel, sparringE, splitDrillXp } from '../../src/engine/appliedExperience';
import { levelExact, xpForLevel } from '../../src/engine/curve';

describe('applied experience E (combat-xp §3)', () => {
  it('gains by stakes, scaled by (1 - E/120)', () => {
    expect(gainE({ E: 0, eSpar: 0 }, 'skirmish').E).toBe(3);
    expect(gainE({ E: 60, eSpar: 0 }, 'serious').E).toBe(63);
    expect(gainE({ E: 0, eSpar: 0 }, 'lethalStronger').E).toBe(10);
    expect(eGainFor('lethal', { opponentGap: 5, ownLevel: 50 }).source).toBe('lethalStronger');
    expect(eGainFor('lethal', { opponentGap: 4, ownLevel: 50 }).source).toBe('lethal');
  });
  it('peer sparring E (and Order classes counted as sparring) stops at 15; real fights keep adding', () => {
    let s = { E: 0, eSpar: 0 };
    for (let i = 0; i < 2000; i++) s = gainE(s, 'sparPeer');
    expect(s.E).toBeCloseTo(15, 6);
    s = gainE(s, 'skirmish');
    expect(s.E).toBeGreaterThan(15);
    expect(s.eSpar).toBeCloseTo(15, 6);
  });
});

describe('sparring partners (D-163)', () => {
  it('a partner 10+ levels above is stronger: E toward its level - 25 at 0.4 a session; less than 10 above is a peer', () => {
    expect(sparringE(50, 59)).toEqual({ source: 'sparPeer', cap: 15 });
    expect(sparringE(50, 60)).toEqual({ source: 'sparStronger', cap: 35 });
    expect(sparringE(50, 90)).toEqual({ source: 'sparStronger', cap: 65 });
    // A stronger partner whose level - 25 is under 15 still gives the peer cap.
    expect(sparringE(10, 30).cap).toBe(15);
    expect(gainE({ E: 0, eSpar: 0 }, 'sparStronger').E).toBeCloseTo(0.4);
    let s = { E: 0, eSpar: 0 };
    const p = sparringE(50, 90);
    for (let i = 0; i < 5000; i++) s = gainE(s, p.source, p.cap);
    expect(s.eSpar).toBeCloseTo(65, 6);
    // Still scaled by (1 - E/120): from E 60 a session gives 0.2.
    expect(gainE({ E: 60, eSpar: 0 }, 'sparStronger', 65).E).toBeCloseTo(60.2);
    // A fight: the partner's level is the student's plus the gap.
    expect(eGainFor('spar', { opponentGap: 10, ownLevel: 70 })).toEqual({ source: 'sparStronger', cap: 55 });
    expect(eGainFor('spar', { opponentGap: 5, ownLevel: 70 })).toEqual({ source: 'sparPeer', cap: 15 });
  });
  it('group sparring: the strongest partner + 10 per extra partner, at most 3 partners count', () => {
    expect(sparGroupLevel([60])).toBe(60);
    expect(sparGroupLevel([60, 50])).toBe(70);
    expect(sparGroupLevel([55, 60, 58])).toBe(80);
    expect(sparGroupLevel([60, 60, 60, 60])).toBe(80);
    // The Order's best (70) sparring three Masters at 60 counts as a partner at 80: stronger.
    expect(sparringE(70, sparGroupLevel([60, 60, 60])).source).toBe('sparStronger');
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
