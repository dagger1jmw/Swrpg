// D-267 candidates (measured only, off by default): (a) danger sense softening a killing blow, (b) the non-saber
// mortal margin, and the candidate switch used by npm run mortals.
import { afterEach, describe, expect, it } from 'vitest';
import { PRECOG_SOFTEN } from '../../src/data/combat.config';
import { NONSABER_MORTAL } from '../../src/data/health.config';
import { damageFighter, precogSoftenChance } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { applyCandidate } from '../support/candidates';
import { forceUser, REAL } from '../support/duelSim';
import { PLAYER_WITHDRAWAL, READINESS } from '../support/lifetime';

afterEach(() => applyCandidate('now'));

const torsoCrit = (soften: number, seed: string) => damageFighter({ ...forceUser('D', 50), vitality: 0 }, 'critical', 20, 'lightsaber', REAL, seedRng(seed), 0, 1, false, 'torso', null, soften);

describe('(a) danger sense softens a killing blow', () => {
  it('off by default: no chance, and the same hit as before', () => {
    expect(precogSoftenChance(forceUser('D', 90), forceUser('A', 50))).toBe(0);
    expect(torsoCrit(0, 's').hit.severity).toBe('mortal');
    expect(torsoCrit(0, 's').softenTried).toBeUndefined();
  });
  it('min(0.6, Force Sense / 150), halved against a Force-user attacker', () => {
    PRECOG_SOFTEN.enabled = true;
    const trooper = { ...forceUser('T', 30), forceSense: 0, forceResistance: 0 };
    expect(precogSoftenChance(forceUser('D', 60), trooper)).toBeCloseTo(0.4);
    expect(precogSoftenChance(forceUser('D', 120), trooper)).toBeCloseTo(0.6);
    expect(precogSoftenChance(forceUser('D', 60), forceUser('S', 60))).toBeCloseTo(0.2);
    expect(precogSoftenChance({ ...forceUser('D', 60), forceSense: 0 }, trooper)).toBe(0);
  });
  it('a softened killing blow is a critical wound; the attempt is marked for its Force load', () => {
    const d = torsoCrit(1, 's');
    expect(d.hit.severity).toBe('critical');
    expect(d.hit.W).toBe(49);
    expect(d.softenTried).toBe(true);
    expect(d.f.dead).toBe(false);
  });
});

describe('(b) the non-saber mortal margin', () => {
  it('below the margin a non-saber hit stops at critical; sabers are untouched', () => {
    const rifle = () => damageFighter({ ...forceUser('D', 50), vitality: 0, forceSense: 0, armor: 'none' }, 'critical', 26, 'blasterRifle', REAL, seedRng('r'), 0, 1, false, 'torso');
    expect(rifle().hit.severity).toBe('mortal');
    NONSABER_MORTAL.minMargin = 30;
    expect(rifle().hit.severity).toBe('critical');
    expect(torsoCrit(0, 's').hit.severity).toBe('mortal');
  });
});

describe('the candidate switch', () => {
  it('sets each rule from its letter and resets with now', () => {
    expect(applyCandidate('a+b30+c+d')).toBe('a+b30+c+d');
    expect([PRECOG_SOFTEN.enabled, NONSABER_MORTAL.minMargin, READINESS.enabled, PLAYER_WITHDRAWAL.strongerIgnoresFatigue]).toEqual([true, 30, true, true]);
    applyCandidate('now');
    expect([PRECOG_SOFTEN.enabled, NONSABER_MORTAL.minMargin, READINESS.enabled, PLAYER_WITHDRAWAL.strongerIgnoresFatigue]).toEqual([false, 0, false, false]);
    expect(() => applyCandidate('x')).toThrow();
  });
});
