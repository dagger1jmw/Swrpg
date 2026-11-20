// D-267 adopted rules: the non-saber mortal band (margin 30) and the lifetime harness's fight readiness; the tuning
// switch used by npm run mortals.
import { afterEach, describe, expect, it } from 'vitest';
import { NONSABER_MORTAL } from '../../src/data/health.config';
import { damageFighter } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { applyCandidate } from '../support/candidates';
import { forceUser, REAL } from '../support/duelSim';
import { READINESS } from '../support/lifetime';

afterEach(() => applyCandidate('now'));

const torsoHit = (weapon: 'lightsaber' | 'blasterRifle', margin: number) =>
  damageFighter({ ...forceUser('D', 50), vitality: 0, forceSense: 0, armor: 'none' }, 'critical', margin, weapon, REAL, seedRng('r'), 0, 1, false, 'torso');

describe('the non-saber mortal band (D-267)', () => {
  it('is margin 30 by default', () => expect(NONSABER_MORTAL.minMargin).toBe(30));
  it('below the margin a non-saber hit stops at critical (W 49); at the margin it can kill', () => {
    const below = torsoHit('blasterRifle', 26).hit;
    expect(below.severity).toBe('critical');
    expect(below.W).toBeLessThanOrEqual(49);
    expect(torsoHit('blasterRifle', 34).hit.severity).toBe('mortal');
  });
  it('sabers are untouched', () => expect(torsoHit('lightsaber', 20).hit.severity).toBe('mortal'));
  it('b0 switches it off (the pre-D-267 curve)', () => {
    applyCandidate('b0');
    expect(torsoHit('blasterRifle', 26).hit.severity).toBe('mortal');
  });
});

describe('the tuning switch', () => {
  it('now is the adopted rules; b<margin> and noready override them', () => {
    expect(applyCandidate('now')).toBe('now');
    expect([NONSABER_MORTAL.minMargin, READINESS.enabled]).toEqual([30, true]);
    expect(applyCandidate('b25+noready')).toBe('b25+noready');
    expect([NONSABER_MORTAL.minMargin, READINESS.enabled]).toEqual([25, false]);
    expect(() => applyCandidate('a')).toThrow();
  });
});
