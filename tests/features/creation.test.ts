// Computed creation: character-creation.md §6 tests 1-6 (M3 step 7), plus the campaign wiring.
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { computeCreation, defaultFocus, fillFactor, ranksFor, type CreationInput } from '../../src/features/character/creation';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START, validateNewCampaign } from '../../src/turn/campaign';

const START = absDayFromDate(DEFAULT_START.date);
const born = (age: number) => START - Math.round(age * 368);
const jedi = (age: number, rank: string, over: Partial<CreationInput> = {}): CreationInput => ({
  name: 'Kael',
  birthDay: born(age),
  startDay: START,
  speciesId: 'human',
  path: 'jedi',
  archetype: 'jediGuardian',
  rank,
  trainingStartAge: 4,
  mainFormId: 'shiiCho',
  secondFormId: 'soresu',
  talents: {},
  dominantHand: 'right',
  ...over,
});
const near = (a: number, b: number, tol = 1) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

describe('computed creation (character-creation §6)', () => {
  it('test 1: a 24-year-old Average Jedi Knight (start 4) gets main form 46.6 +/-1 and meets the Knight minimums', () => {
    const c = computeCreation(jedi(24, 'knight'));
    expect(c.errors).toEqual([]);
    near(c.levels['shiiCho']!, 46.6);
    expect(c.unmet).toEqual([]);
    expect(c.ok).toBe(true);
    expect(c.levels['forceSense']!).toBeGreaterThanOrEqual(26);
    expect(c.levels['forceControl']!).toBeGreaterThanOrEqual(30);
    expect(c.levels['willpower']!).toBeGreaterThanOrEqual(48);
  });

  it('test 2: a 9-year-old Initiate (start 4) gets main form 20.1 +/-1, within +/-1 of the day loop at 5 years (19.8)', () => {
    const c = computeCreation(jedi(9, 'initiate'));
    expect(c.errors).toEqual([]);
    near(c.levels['shiiCho']!, 20.1);
    near(c.levels['shiiCho']!, 19.8);
  });

  it('test 3: a Luke-style outsider (start 19, Force prodigy) at 24 matches the Luke profile at 5 years', () => {
    // docs-v2/calc Luke run (outsider, standard, Force prodigy, main share 0.4) at 5 years:
    // main form 18.6, Force Control 14.1, Force Sense 13.8.
    const a = ARCHETYPE_BY_ID.get('jediGuardian')!;
    const def = defaultFocus(a);
    const rest = 1 - def['$mainForm']!;
    const focus = Object.fromEntries(Object.entries(def).map(([k, v]) => [k, k === '$mainForm' ? 0.4 : (v / rest) * 0.6]));
    const c = computeCreation(jedi(24, 'none', { path: 'outsider', trainingStartAge: 19, talents: { force: 'prodigy' }, focus }));
    expect(c.errors).toEqual([]);
    near(c.levels['forceControl']!, 14.1, 2);
    near(c.levels['forceSense']!, 13.8, 2);
    near(c.levels['shiiCho']!, 18.6, 3);
  });

  it('test 4: an unreachable rank always triggers the validation options', () => {
    const c = computeCreation(jedi(19, 'knight'));
    expect(c.unmet.length).toBeGreaterThan(0);
    expect(c.ok).toBe(false);
    expect(c.options).toHaveLength(4);
    const kept = computeCreation(jedi(19, 'knight', { storyException: true }));
    expect(kept.ok).toBe(true);
    expect(kept.options).toEqual([]);
    expect(kept.facts.some((f) => f.includes('story exception'))).toBe(true);
    const master = computeCreation(jedi(31, 'master'));
    expect(master.unmet.map((u) => u.skillId)).toContain('shiiCho');
  });

  it('test 5: talent point costs and caps hold; no combination exceeds 4.0x pace', () => {
    expect(computeCreation(jedi(24, 'knight', { talents: { combat: 'exceptional', force: 'gifted' } })).errors.join()).toMatch(/limit is 3/);
    expect(computeCreation(jedi(24, 'knight', { talents: { combat: 'gifted', force: 'prodigy' } })).errors).toEqual([]);
    const focusAll = { $mainForm: 1, $secondForm: 0, forceControl: 0, forceSense: 0, strength: 0, agility: 0, endurance: 0, willpower: 0 };
    for (const talents of [{ combat: 'exceptional' as const }, { combat: 'prodigy' as const, force: 'gifted' as const }, { force: 'exceptional' as const }]) {
      for (const species of ['human', 'miraluka', 'mirialan', 'wookiee']) {
        const c = computeCreation(jedi(species === 'wookiee' ? 120 : 30, 'knight', { talents, speciesId: species, focus: focusAll, storyException: true, trainingStartAge: species === 'wookiee' ? 40 / 3 : 4 }));
        expect(c.errors).toEqual([]);
        expect(c.maxPace).toBeLessThanOrEqual(4);
      }
    }
  });

  it('test 6: the same inputs always produce the same character', () => {
    expect(computeCreation(jedi(24, 'knight'))).toEqual(computeCreation(jedi(24, 'knight')));
  });

  it('ranks shown for a path and age', () => {
    expect(ranksFor('jedi', 9).map((r) => r.id)).toEqual(['initiate']);
    expect(ranksFor('jedi', 12).map((r) => r.id)).toEqual(['initiate', 'padawan']);
    expect(ranksFor('jedi', 24).map((r) => r.id)).toEqual(['padawan', 'knight']);
    expect(ranksFor('career', 30).map((r) => r.id)).toEqual(['career']);
  });

  it('species read on the Human-equivalent age: a Wookiee of 30 trains like a child of 9', () => {
    // A Wookiee child of 30 is h 9; training from species age 13.3 is h 4 (species.md §1).
    const w = computeCreation(jedi(30, 'initiate', { speciesId: 'wookiee', trainingStartAge: 40 / 3 }));
    expect(w.errors).toEqual([]);
    near(w.levels['shiiCho']!, computeCreation(jedi(9, 'initiate')).levels['shiiCho']!, 0.2);
  });
});

/** Focus shares with one key moved to `v`, the others renormalized (as the creation sliders do). */
function toward(key: string, v: number): Record<string, number> {
  const def = defaultFocus(ARCHETYPE_BY_ID.get('jediGuardian')!);
  const rest = Object.entries(def).filter(([k]) => k !== key);
  const t = rest.reduce((a, [, x]) => a + x, 0);
  return { ...Object.fromEntries(rest.map(([k, x]) => [k, (x / t) * (1 - v)])), [key]: v };
}

describe('focus sliders reach the closed form (play-test fix, D-115)', () => {
  it('moving focus toward a skill raises its starting level, for a Padawan and for a Knight', () => {
    for (const [age, rank] of [
      [14, 'padawan'],
      [16, 'padawan'],
      [24, 'knight'],
    ] as const) {
      const base = computeCreation(jedi(age, rank));
      const moved = computeCreation(jedi(age, rank, { focus: toward('forceSense', 0.5) }));
      expect(moved.errors).toEqual([]);
      expect(moved.levels['forceSense']!, `${rank} ${age}`).toBeGreaterThan(base.levels['forceSense']! + 0.3);
      expect(moved.levels['shiiCho']!, `${rank} ${age}`).toBeLessThan(base.levels['shiiCho']!);
      expect(moved.focusWeights['forceSense']).toBeCloseTo(0.5, 9);
    }
  });

  it('the Order-fixed phases move only by their fill hours (budget minus Order hours, over the 6 h Knight day)', () => {
    expect(fillFactor('initiate', 4, 9)).toBe(0);
    expect(fillFactor('padawan', 12, 20.5)).toBeGreaterThan(0.1);
    expect(fillFactor('padawan', 12, 20.5)).toBeLessThan(0.2);
    expect(fillFactor('knight', 20.5, 24)).toBe(1);
    // The default focus changes nothing (test 1 values hold).
    near(computeCreation(jedi(24, 'knight', { focus: toward('$mainForm', 0.5) })).levels['shiiCho']!, 46.6);
  });
});

describe('talent point bypass (D-116)', () => {
  const all = { combat: 'exceptional', force: 'exceptional', physical: 'exceptional', mind: 'exceptional' } as const;
  it('without the toggle, the 3-point limit holds', () => {
    expect(computeCreation(jedi(24, 'knight', { talents: all })).errors.join()).toMatch(/limit is 3/);
  });
  it('with it, any number of talents is accepted, flagged unbalanced, still capped at 4.0x pace', () => {
    const c = computeCreation(jedi(24, 'knight', { talents: all, ignoreTalentLimit: true, focus: toward('$mainForm', 1) }));
    expect(c.errors).toEqual([]);
    expect(c.unbalanced).toBe(true);
    expect(c.maxPace).toBeLessThanOrEqual(4);
    expect(c.levels['shiiCho']!).toBeGreaterThan(computeCreation(jedi(24, 'knight')).levels['shiiCho']!);
    // Within 3 points the toggle changes nothing and the campaign is not flagged.
    expect(computeCreation(jedi(24, 'knight', { talents: { combat: 'gifted' }, ignoreTalentLimit: true })).unbalanced).toBe(false);
  });
});

describe('campaign creation (M3)', () => {
  it('a created campaign starts with the computed XP, rank, character fields and backstory facts', async () => {
    const input = {
      name: 'Kael',
      birthDate: { year: -3685, month: 1, day: 1 },
      startDate: DEFAULT_START.date,
      startSecond: DEFAULT_START.second,
      creation: { speciesId: 'human', path: 'jedi' as const, archetype: 'jediGuardian', rank: 'knight', trainingStartAge: 4, mainFormId: 'shiiCho', secondFormId: 'soresu', talents: {}, dominantHand: 'right' as const },
    };
    expect(validateNewCampaign(input)).toEqual([]);
    const s = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c', branchId: 'b' }, 'x');
    expect(s.state.character).toMatchObject({ path: 'jedi', archetype: 'jediGuardian', mainFormId: 'shiiCho', trainingStartAge: 4 });
    expect(s.state.ranks.rank).toBe('knight');
    near(selectLevelExact(s.state, 'shiiCho'), 46.6);
    expect(s.state.memory.facts.some((f) => f.text.includes('Jedi Temple on Coruscant'))).toBe(true);
    expect(s.state.character.focusWeights['shiiCho']).toBe(0.5);
    expect(s.state.character.unbalanced).toBe(false);
  });

  it('an unbalanced campaign carries the flag on the character', async () => {
    const input = {
      name: 'Kael',
      birthDate: { year: -3685, month: 1, day: 1 },
      startDate: DEFAULT_START.date,
      startSecond: DEFAULT_START.second,
      creation: {
        speciesId: 'human',
        path: 'jedi' as const,
        archetype: 'jediGuardian',
        rank: 'knight',
        trainingStartAge: 4,
        mainFormId: 'shiiCho',
        secondFormId: 'soresu',
        talents: { combat: 'exceptional' as const, force: 'prodigy' as const },
        dominantHand: 'right' as const,
        ignoreTalentLimit: true,
      },
    };
    expect(validateNewCampaign(input)).toEqual([]);
    const s = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c', branchId: 'b' }, 'x');
    expect(s.state.character.unbalanced).toBe(true);
    expect(s.state.character.talents).toEqual({ combat: 'exceptional', force: 'prodigy' });
  });

  it('an unreachable rank blocks the campaign with the four options', () => {
    const errors = validateNewCampaign({
      name: 'Kael',
      birthDate: { year: -3680, month: 1, day: 1 },
      startDate: DEFAULT_START.date,
      startSecond: DEFAULT_START.second,
      creation: { speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: 'knight', trainingStartAge: 4, mainFormId: 'shiiCho', secondFormId: null, talents: {}, dominantHand: 'right' },
    });
    expect(errors.join(' ')).toMatch(/story exception/);
  });
});
