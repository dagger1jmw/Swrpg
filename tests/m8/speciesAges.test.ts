// Species ages (M8 checklist item 2; D-472): adult, prime and lifespan, the decline after prime, the Force's stretch of it.
import { describe, expect, it } from 'vitest';
import { AGE_TRAINING, FORCE_EXTENSION, PRIME_H } from '../../src/data/ageing.config';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { SPECIES, speciesDef, speciesPrime } from '../../src/data/species';
import { ageLoss, ageingStep, assumedAgeing, bodyAge, bodyAgeFromH, bodyDecline, forceExtension } from '../../src/engine/ageing';
import { bodyCap, humanBodyCap, humanEquivalentAge, naturalLevel, physicalPerformance, speciesAgeFromHuman } from '../../src/engine/species';
import { canonFigureLevelsAt, npcLevelsFor } from '../../src/features/npcs/selectors';
import { selectAgeing, selectBodyCap, selectLevelExact, selectPerformance } from '../../src/features/progression/selectors';
import { speedPartsFor } from '../../src/features/progression/training';
import { advanceTime } from '../../src/state/advanceTime';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { progressionSliceSchema } from '../../src/features/progression/progression';
import { absDayFromDate } from '../../src/engine/calendar';
import type { GameState } from '../../src/state/gameState';
import { TEST_YEAR } from '../support/dates';

const start = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const make = (age: number, startingXp: Record<string, number> = {}): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'ageing',
    branchId: 'b1',
    seed: 'ageing',
    start: { day: start, second: 6 * 3600 },
    character: { name: 'T', birthDay: start - Math.round(age * 368), path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp,
    rank: age < 20 ? 'padawan' : 'knight',
  });
const day = (s: GameState): GameState => advanceTime(REGISTRY, s, { seconds: 86_400, reason: 'next day', source: 'turnDraft' }).state;

describe('adult, prime and lifespan', () => {
  it('every species is adult at 18, in its prime at 30 and at the end of a full life at 100 (Human-equivalent)', () => {
    for (const s of SPECIES) {
      expect(speciesPrime(s), s.id).toBeGreaterThan(s.maturity);
      expect(s.lifespan, s.id).toBeGreaterThan(speciesPrime(s));
      expect(humanEquivalentAge(s, s.maturity), s.id).toBeCloseTo(18, 9);
      expect(humanEquivalentAge(s, speciesPrime(s)), s.id).toBeCloseTo(PRIME_H, 9);
      expect(humanEquivalentAge(s, s.lifespan), s.id).toBeCloseTo(100, 9);
      for (const h of [5, 18, 24, 30, 66, 100, 130]) expect(humanEquivalentAge(s, speciesAgeFromHuman(s, h)), s.id).toBeCloseTo(h, 9);
    }
  });
  it('the age map never runs backwards', () => {
    for (const s of SPECIES) for (let a = 0; a < s.lifespan * 1.2; a += s.lifespan / 100) expect(humanEquivalentAge(s, a + 0.5), s.id).toBeGreaterThan(humanEquivalentAge(s, a));
  });
  it('a species with no sourced prime keeps the old straight line from adult to the end of a full life', () => {
    for (const s of SPECIES.filter((x) => x.prime === undefined)) {
      const a = s.maturity + 0.37 * (s.lifespan - s.maturity);
      expect(humanEquivalentAge(s, a), s.id).toBeCloseTo(18 + 0.37 * 82, 9);
    }
    expect(SPECIES.filter((x) => x.prime !== undefined).map((x) => x.id)).toEqual(['wookiee']);
  });
  it('a Wookiee is adult at 18 and in its prime around 200; Bowdaar, 177, is in his', () => {
    const w = speciesDef('wookiee');
    expect([w.maturity, w.prime, w.lifespan]).toEqual([18, 200, 400]);
    const h = humanEquivalentAge(w, CANON_BY_ID.get('lore:bowdaar')!.birthBby - 3661);
    expect(h).toBeGreaterThan(26);
    expect(h).toBeLessThanOrEqual(PRIME_H);
    expect(bodyCap('wookiee', 'strength', 177)).toBe(bodyCap('wookiee', 'strength', 200));
  });
});

describe('decline', () => {
  it('is slow at first and faster towards old age, and Agility falls first', () => {
    for (const stat of ['strength', 'agility', 'endurance'] as const) {
      let last = 0;
      for (let a = 35; a < 95; a += 10) {
        const step = bodyDecline(stat, a + 10) - bodyDecline(stat, a);
        expect(step, `${stat} ${a}`).toBeGreaterThan(last);
        last = step;
      }
      expect(bodyDecline(stat, 25)).toBe(0);
    }
    for (let a = 35; a <= 100; a += 5) expect(bodyDecline('agility', a)).toBeGreaterThan(bodyDecline('strength', a));
  });
  it('the Human Strength and Endurance caps are the old table', () => {
    for (const [a, c] of [[22, 80], [35, 80], [45, 78], [55, 74], [65, 68], [75, 58], [85, 45], [100, 25]] as const) expect(humanBodyCap(a)).toBeCloseTo(c, 9);
  });
  it('an untrained body at 75 holds what it held before: half the cap', () => {
    const n = naturalLevel('strength', 'human', 75);
    expect(n * (1 - ageLoss('strength', 75, 0))).toBeCloseTo(0.5 * 58, 9);
  });
  it('only the body declines: Willpower, Intelligence, Charisma, Force skills and forms do not', () => {
    for (const id of ['willpower', 'intelligence', 'charisma', 'forceControl', 'soresu']) expect(physicalPerformance(id, 80, 40, 10, 0.5)).toBe(80);
    expect(physicalPerformance('strength', 80, 100, 0, 0.5)).toBe(40);
    const s = make(85, { soresu: 50_000, forceSense: 50_000, strength: 5000 });
    expect(selectPerformance(s, 'soresu')).toBe(selectLevelExact(s, 'soresu'));
    expect(selectPerformance(s, 'strength')).toBeLessThan(selectLevelExact(s, 'strength'));
  });
  it('the ceilings fall too', () => {
    expect(selectBodyCap(make(85), 'endurance')).toBeCloseTo(45, 0);
    expect(selectBodyCap(make(85), 'agility')).toBeLessThan(selectBodyCap(make(85), 'endurance'));
  });
});

describe('Force Control delays it', () => {
  it('only the years after prime stretch', () => {
    for (const h of [5, 18, 30]) expect(bodyAgeFromH(h, 110)).toBe(h);
    expect(bodyAgeFromH(65, 0)).toBe(65);
    expect(bodyAgeFromH(65, 80)).toBeCloseTo(30 + (35 * 70) / (70 + forceExtension(80)), 9);
  });
  it('little for the untrained, the full figure for a Master of very high Control: the body of 100 at 200', () => {
    expect(bodyAgeFromH(100, 5)).toBeGreaterThan(99);
    expect(bodyAgeFromH(200, 110)).toBeCloseTo(100, 9);
    for (let i = 1; i < FORCE_EXTENSION.length; i++) expect(FORCE_EXTENSION[i]![1]).toBeGreaterThan(FORCE_EXTENSION[i - 1]![1]);
  });
  it('it never stops age', () => {
    for (let h = 30; h < 250; h += 5) expect(bodyAgeFromH(h + 5, 135)).toBeGreaterThan(bodyAgeFromH(h, 135));
  });
  it("a lifespan known only from Jedi is not stretched again: Yoda at 900 has the body of 100", () => {
    expect(bodyAge(speciesDef('yodas_species'), 900, 120)).toBeCloseTo(100, 9);
    expect(bodyAge(speciesDef('human'), 100, 120)).toBeLessThan(70);
  });
});

describe('training', () => {
  const years = (from: number, to: number, hours: number) => {
    let a = assumedAgeing(from);
    for (let b = from; b < to; b += 0.1) a = ageingStep(a, b + 0.1, () => hours);
    return a;
  };
  it('slows the loss and cannot stop it', () => {
    const idle = years(40, 80, 0).loss.strength;
    const trained = years(40, 80, AGE_TRAINING.fullHoursPerYear).loss.strength;
    expect(trained).toBeLessThan(idle);
    expect(trained).toBeGreaterThan(0);
    expect(years(40, 80, 5000).loss.strength).toBeCloseTo(trained, 9);
  });
  it('cannot reverse it: no training and no rise in Force Control takes a loss back', () => {
    const a = years(40, 80, 0);
    const b = ageingStep(a, 60, () => 5000);
    expect(b).toEqual(a);
    expect(ageingStep(a, 81, () => 5000).loss.strength).toBeGreaterThan(a.loss.strength);
  });
  it('an old body regains less from training', () => {
    const at = (age: number) => speedPartsFor(make(age), 1)('strength')!.age;
    expect(at(70)).toBeLessThan(at(50));
    expect(at(50)).toBeLessThan(at(25));
    expect(speedPartsFor(make(70), 1)('soresu')!.age).toBeCloseTo(0.9, 9);
  });
  it('the player: tracked from prime on, day by day, and saved', () => {
    let s = make(25);
    s = day(s);
    expect(s.progression.ageing ?? null).toBeNull();
    s = make(60);
    const before = selectAgeing(s);
    s = day(day(s));
    expect(s.progression.ageing!.bodyAge).toBeGreaterThan(before.bodyAge);
    expect(s.progression.ageing!.loss.agility).toBeGreaterThan(before.loss.agility);
    expect(progressionSliceSchema.parse(JSON.parse(JSON.stringify(s.progression)))).toEqual(s.progression);
    const { ageing, ...old } = s.progression;
    void ageing;
    expect(progressionSliceSchema.safeParse(old).success).toBe(true);
  });
});

describe('NPCs and canon figures', () => {
  it('an old NPC keeps its form and loses its body', () => {
    const gen = { archetype: 'jediConsular', path: 'jedi' as const, talents: {}, startAge: 4, warYears: 0, rank: 'master', seed: 'x', minionGrade: 1 };
    const at = (age: number) => npcLevelsFor(gen, 'human', age, start);
    expect(at(90)['agility']!).toBeLessThan(at(45)['agility']!);
    expect(at(90)['forceKnowledge']!).toBeGreaterThanOrEqual(at(45)['forceKnowledge']!);
  });
  it("a canon figure's sheet stands at its date and its body falls after it", () => {
    const orgus = CANON_BY_ID.get('lore:orgus-din')!;
    const a = orgus.anchors.find((x) => x.complete)!;
    const now = canonFigureLevelsAt(orgus, a.bby, start);
    for (const k of ['strength', 'agility', 'endurance']) if (a.levels[k] !== undefined) expect(now[k]).toBeCloseTo(a.levels[k]!, 6);
    const later = canonFigureLevelsAt(orgus, a.bby - 15, start);
    expect((later['agility'] ?? 0) / Math.max(1, now['agility'] ?? 1)).toBeLessThan((later['forceControl'] ?? 0) / Math.max(1, now['forceControl'] ?? 1));
  });
});
