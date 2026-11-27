// m8-fixes Part D (Jared's play tests, 26 Nov 2026): D1, trait requirements on the creation form (War veteran needs war years
// above 0; the others added, reported); D2, active wounds shown beside the Vitality bar (health.md keeps them apart on purpose).
import { describe, expect, it } from 'vitest';
import { TRAITS } from '../../src/data/traits';
import { eligibleTraits, traitGreyReason, type TraitContext } from '../../src/features/traits/selectors';
import { selectWoundTag } from '../../src/features/health/selectors';
import { computeCreation, WAR_SERVICE_FROM_AGE } from '../../src/features/character/creation';
import type { GameState } from '../../src/state/gameState';
import { base } from '../support/schemaSituations';

const padawan14: TraitContext = { path: 'jedi', speciesId: 'human', archetype: 'jediGuardian', birthYear: -3675, startYear: -3661, trainingStartAge: 4 };

describe('D1: trait requirements', () => {
  it('War veteran needs war years above 0: greyed with its reason at 0, open at 1', () => {
    const scars = (c: TraitContext): string[] => eligibleTraits(c, 'scar').map((t) => t.id);
    expect(scars(padawan14)).not.toContain('warVeteran');
    expect(traitGreyReason('warVeteran', padawan14)).toBe('needs war years above 0');
    expect(scars({ ...padawan14, birthYear: -3690, warYears: 1 })).toContain('warVeteran');
    expect(traitGreyReason('warVeteran', { ...padawan14, birthYear: -3690, warYears: 1 })).toBeNull();
  });
  it('every requirement added is on the trait with its reason and source; path and date gates stay hidden, not greyed', () => {
    const withReq = TRAITS.filter((t) => t.requires?.length).map((t) => t.id).sort();
    expect(withReq).toEqual(['firstKill', 'forbiddenBond', 'oldDebt', 'warVeteran', 'ward'].sort());
    for (const t of TRAITS) for (const r of t.requires ?? []) expect(r.reason.length && r.source.length).toBeTruthy();
    const young: TraitContext = { ...padawan14, birthYear: -3668 }; // 7 at the start
    expect(traitGreyReason('firstKill', young)).toMatch(/start age of 8/);
    expect(traitGreyReason('ward', padawan14)).toBeNull(); // 14: open
    expect(traitGreyReason('forbiddenBond', { ...padawan14, birthYear: -3674 })).toMatch(/14 or more/);
    // A Sith-only origin is hidden for a Jedi (a path gate), never greyed.
    expect(traitGreyReason('academyRaised', padawan14)).toBeNull();
    // Temple arrival is a form number too: greyed with its reason.
    expect(traitGreyReason('templeRaised', { ...padawan14, trainingStartAge: 12 })).toMatch(/before age 10/);
  });
  it('a background option: war years are served from age 14 (a 14-year-old has none to give)', () => {
    expect(WAR_SERVICE_FROM_AGE).toBe(14);
    const make = (age: number, warYears: number) =>
      computeCreation({ name: 'K', path: 'jedi', speciesId: 'human', archetype: 'jediGuardian', rank: 'padawan', birthDay: 0, startDay: Math.round(age * 368), trainingStartAge: 4, talents: {}, dominantHand: 'right', warYears } as never);
    expect(make(14, 1).errors.join(' ')).toMatch(/War years are served from age 14/);
    expect(make(16, 2).errors.join(' ')).not.toMatch(/War years/);
  });
});

describe('D2: active wounds beside the Vitality bar', () => {
  it('the worst wound in words, with the count of the rest; none without wounds', () => {
    const s = base();
    expect(selectWoundTag(s)).toBeNull();
    const hurt = { ...s, health: { ...s.health, wounds: [{ severity: 'moderate', part: 'leftArm', healProgress: 0 }, { severity: 'severe', part: 'head', healProgress: 0.1 }] } } as unknown as GameState;
    expect(selectWoundTag(hurt)).toBe('severe wound (head) +1 more');
    expect(hurt.health.vitalityLost).toBe(s.health.vitalityLost); // the spec keeps them apart: Vitality untouched
  });
});
