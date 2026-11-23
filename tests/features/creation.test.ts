// Computed creation: character-creation.md §6 tests 1-6 (M3 step 7), plus the campaign wiring.
import { TEST_START_DATE, TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { computeCreation, defaultFocus, fillFactor, ranksFor, type CreationInput } from '../../src/features/character/creation';
import { planSplit } from '../../src/engine/closedForm';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND, validateNewCampaign } from '../../src/turn/campaign';

const START = absDayFromDate(TEST_START_DATE);
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
  talents: {},
  dominantHand: 'right',
  ...over,
});
/** The highest form level of a creation (every "main form" target reads it, D-118). */
const top = (c: ReturnType<typeof computeCreation>): number => c.highestForm?.level ?? 0;
const near = (a: number, b: number, tol = 1) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

describe('computed creation (character-creation §6)', () => {
  it('test 1: a 24-year-old Average Jedi Knight (start 4) gets highest form 45.8 +/-1 (Soresu; the day loop, D-459) and meets the Knight minimums', () => {
    const c = computeCreation(jedi(24, 'knight'));
    expect(c.errors).toEqual([]);
    expect(c.highestForm?.id).toBe('soresu');
    near(top(c), 45.8);
    expect(c.unmet).toEqual([]);
    expect(c.ok).toBe(true);
    expect(c.levels['forceSense']!).toBeGreaterThanOrEqual(31);
    expect(c.levels['forceControl']!).toBeGreaterThanOrEqual(34);
    expect(c.levels['willpower']!).toBeGreaterThanOrEqual(53);
    // The day loop at 24 (gated seed, D-459: the Initiate curriculum, K 11.5): Shii-Cho 24.3, Soresu 45.8, Ataru 28.2.
    near(c.levels['shiiCho']!, 24.3);
    near(c.levels['ataru']!, 28.2);
  });

  it('test 2: a 9-year-old Initiate (start 4) trains Shii-Cho only: 18.4 +/-1, the day loop at 5 years (D-459: from the gate)', () => {
    const c = computeCreation(jedi(9, 'initiate'));
    expect(c.errors).toEqual([]);
    near(c.levels['shiiCho']!, 18.4);
    expect(Object.keys(c.startingXp).filter((k) => ['soresu', 'ataru', 'makashi'].includes(k))).toEqual([]);
    expect(c.mainFormId).toBe('shiiCho');
    expect(c.secondFormId).toBeNull();
  });

  it('test 3: a Luke-style outsider (start 19, Force prodigy) at 24 matches the Luke profile at 5 years', () => {
    // docs-v2/calc Luke-style run (outsider: no Order rows, one Knight+-style phase from 19, Force
    // prodigy, main share 0.4 of the fill, 300 days) at 5 years: main form 17.5, second form 11.5,
    // Force Control 17.2, Force Sense 16.4; scaled to K 11.5 by (12.45 / 11.5)^(1 / 1.75) = 1.046 (D-459): 18.0, 17.2, 18.3.
    const def = defaultFocus(ARCHETYPE_BY_ID.get('jediGuardian')!);
    const mainShare = 0.5 / def['$forms']!; // the main form's part of the forms pool
    const focus = toward('$forms', 0.4 / mainShare);
    const c = computeCreation(jedi(24, 'none', { path: 'outsider', trainingStartAge: 19, talents: { force: 'prodigy' }, focus }));
    expect(c.errors).toEqual([]);
    near(c.levels['forceControl']!, 18.0, 2);
    near(c.levels['forceSense']!, 17.2, 2);
    near(c.levels['soresu']!, 18.3, 3);
    expect(c.levels['shiiCho'] ?? 0).toBe(0);
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
    expect(master.unmet.map((u) => u.skillId)).toContain('soresu');
  });

  it('test 5: talent point costs and caps hold; no combination exceeds 4.0x pace', () => {
    expect(computeCreation(jedi(24, 'knight', { talents: { combat: 'exceptional', force: 'gifted' } })).errors.join()).toMatch(/limit is 3/);
    expect(computeCreation(jedi(24, 'knight', { talents: { combat: 'gifted', force: 'prodigy' } })).errors).toEqual([]);
    const focusAll = { $forms: 1, forceControl: 0, forceSense: 0, strength: 0, agility: 0, endurance: 0, willpower: 0 };
    for (const talents of [{ combat: 'exceptional' as const }, { combat: 'prodigy' as const, force: 'gifted' as const }, { force: 'exceptional' as const }]) {
      for (const species of ['human', 'miraluka', 'mirialan', 'wookiee']) {
        const c = computeCreation(jedi(species === 'wookiee' ? 120 : 30, 'knight', { talents, speciesId: species, focus: focusAll, storyException: true, trainingStartAge: species === 'wookiee' ? 40 / 3 : 4 }));
        expect(c.errors).toEqual([]);
        expect(c.maxPace).toBeLessThanOrEqual(4);
      }
    }
  });

  it('offers only the species known for the start year, and no NPC-only species (lore batch 21, D-399)', () => {
    const at3661 = { startDay: absDayFromDate({ year: -3661, month: 1, day: 1 }), birthDay: absDayFromDate({ year: -3685, month: 1, day: 1 }) };
    expect(computeCreation(jedi(24, 'knight', { ...at3661, speciesId: 'voss' })).errors.join()).toMatch(/Voss are not known to the galaxy in 3,661 BBY/);
    expect(computeCreation(jedi(24, 'knight', { speciesId: 'voss' })).errors).toEqual([]); // a later start
    expect(computeCreation(jedi(24, 'knight', { speciesId: 'houk' })).errors.join()).toMatch(/not offered at character creation/);
    expect(computeCreation(jedi(24, 'knight', { ...at3661, speciesId: 'kel_dor' })).errors).toEqual([]);
    expect(computeCreation(jedi(24, 'knight', { speciesId: 'houk', npc: true })).errors).toEqual([]);
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

describe('form plans and the fundamentals transfer (D-118, D-119)', () => {
  it('a 16-year-old Padawan has Shii-Cho, a main form and a second form all above 0', () => {
    const c = computeCreation(jedi(16, 'padawan'));
    expect(c.errors).toEqual([]);
    // The day loop at 16 (D-459: the Initiate curriculum, K 11.5): Shii-Cho 24.3, Soresu 30.3, Ataru 21.5.
    near(c.levels['shiiCho']!, 24.3);
    near(c.levels['soresu']!, 30.3);
    near(c.levels['ataru']!, 21.5);
    expect(c.mainFormId).toBe('soresu');
    expect(c.secondFormId).toBe('ataru');
    expect(c.highestForm?.id).toBe('soresu');
  });

  it('a 3-form plan splits the hours as set: the master session goes largest first, then the solo hour', () => {
    expect(planSplit({ soresu: 1.5, ataru: 1, makashi: 0.5 })).toEqual({
      soresu: { master: 0.75, solo: 0, fill: 0.5 },
      ataru: { master: 0.25, solo: 0.5, fill: 1 / 3 },
      makashi: { master: 0, solo: 0.5, fill: 1 / 6 },
    });
    const c = computeCreation(jedi(16, 'padawan', { padawanPlan: { soresu: 1.5, ataru: 1, makashi: 0.5 } }));
    expect(c.errors).toEqual([]);
    expect(c.levels['soresu']!).toBeGreaterThan(c.levels['ataru']!);
    expect(c.levels['ataru']!).toBeGreaterThan(c.levels['makashi']!);
    expect(c.levels['makashi']!).toBeGreaterThan(0);
    expect(computeCreation(jedi(16, 'padawan', { padawanPlan: { soresu: 2, ataru: 0.5 } })).errors.join()).toMatch(/total 3 h/);
  });

  it('every form the Initiate survey starts begins at 0.75 x the highest form at that moment (D-119, D-459: Shii-Cho at 10)', () => {
    // Just past the survey's start the new forms have had almost no training: transfer only.
    const c = computeCreation(jedi(10.01, 'initiate'));
    for (const f of ['makashi', 'soresu', 'ataru', 'shien', 'djemSo']) expect(c.startingXp[f]!, f).toBeGreaterThan(0.74 * c.startingXp['shiiCho']!);
    // The Padawan plan's forms were started by the survey: no second transfer at 12.
    const p = computeCreation(jedi(12.01, 'padawan', { padawanPlan: { soresu: 2, makashi: 1 } }));
    expect(p.startingXp['soresu']!).toBeLessThan(0.9 * p.startingXp['shiiCho']!);
  });

  it('dropping Shii-Cho from the plan never removes its XP; keeping it trains it', () => {
    const dropped = computeCreation(jedi(16, 'padawan'));
    const initiate12 = computeCreation(jedi(12, 'initiate'));
    near(dropped.levels['shiiCho']!, initiate12.levels['shiiCho']!, 0.05);
    const kept = computeCreation(jedi(16, 'padawan', { padawanPlan: { soresu: 2, shiiCho: 1 } }));
    expect(kept.levels['shiiCho']!).toBeGreaterThan(dropped.levels['shiiCho']!);
  });

  it('a separate Knight+ plan changes only the Knight+ years', () => {
    const same = computeCreation(jedi(30, 'knight'));
    const changed = computeCreation(jedi(30, 'knight', { knightPlan: { makashi: 3 } }));
    expect(changed.levels['makashi']!).toBeGreaterThan(0.74 * 0); // started at Knight with the transfer
    expect(changed.levels['makashi']!).toBeGreaterThan(same.levels['makashi'] ?? 0);
    near(changed.levels['shiiCho']!, same.levels['shiiCho']!, 0.01);
    expect(changed.levels['soresu']!).toBeLessThan(same.levels['soresu']!);
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
      expect(top(moved), `${rank} ${age}`).toBeLessThanOrEqual(top(base) + 1e-9);
      expect(moved.focusWeights['forceSense']).toBeCloseTo(0.5, 9);
    }
  });

  it('the Order-fixed phases move only by their fill hours (budget minus Order hours, over the 6 h Knight day)', () => {
    expect(fillFactor('initiate', 4, 9)).toBe(0);
    expect(fillFactor('padawan', 12, 20.5)).toBeGreaterThan(0.1);
    // D-431: the young Padawan's 4 fixed hours leave more fill.
    expect(fillFactor('padawan', 12, 20.5)).toBeLessThan(0.3);
    expect(fillFactor('knight', 20.5, 24)).toBe(1);
    // The default focus changes nothing (test 1 values hold).
    near(top(computeCreation(jedi(24, 'knight', { focus: toward('$forms', defaultFocus(ARCHETYPE_BY_ID.get('jediGuardian')!)['$forms']!) }))), 45.8);
  });
});

describe('talent point bypass (D-116)', () => {
  const all = { combat: 'exceptional', force: 'exceptional', physical: 'exceptional', mind: 'exceptional' } as const;
  it('without the toggle, the 3-point limit holds', () => {
    expect(computeCreation(jedi(24, 'knight', { talents: all })).errors.join()).toMatch(/limit is 3/);
  });
  it('with it, any number of talents is accepted, flagged unbalanced, still capped at 4.0x pace', () => {
    const c = computeCreation(jedi(24, 'knight', { talents: all, ignoreTalentLimit: true, focus: toward('$forms', 1) }));
    expect(c.errors).toEqual([]);
    expect(c.unbalanced).toBe(true);
    expect(c.maxPace).toBeLessThanOrEqual(4);
    expect(top(c)).toBeGreaterThan(top(computeCreation(jedi(24, 'knight'))));
    // Within 3 points the toggle changes nothing and the campaign is not flagged.
    expect(computeCreation(jedi(24, 'knight', { talents: { combat: 'gifted' }, ignoreTalentLimit: true })).unbalanced).toBe(false);
  });
});

describe('campaign creation (M3)', () => {
  it('a created campaign starts with the computed XP, rank, character fields and backstory facts', async () => {
    const input = {
      name: 'Kael',
      // 25 (D-459): at K 11.5 the Average's highest form passes the Knight minimum 47 at about 24.8 (reported).
      birthDate: { year: TEST_YEAR - 25, month: 1, day: 1 },
      startDate: TEST_START_DATE,
      startSecond: DEFAULT_START_SECOND,
      creation: { speciesId: 'human', path: 'jedi' as const, archetype: 'jediGuardian', rank: 'knight', trainingStartAge: 4, talents: {}, dominantHand: 'right' as const },
    };
    expect(validateNewCampaign(input)).toEqual([]);
    const s = await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c', branchId: 'b' }, 'x');
    expect(s.state.character).toMatchObject({ path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', secondFormId: 'ataru', trainingStartAge: 4 });
    expect(s.state.character.formPlan).toEqual({ padawan: { soresu: 2, ataru: 1 }, knight: { soresu: 2, ataru: 1 } });
    expect(s.state.ranks.rank).toBe('knight');
    near(selectLevelExact(s.state, 'soresu'), 47.3);
    // The survey started Forms II-VI (D-459).
    expect(s.state.progression.formsStarted.sort()).toEqual(['ataru', 'djemSo', 'makashi', 'niman', 'shien', 'shiiCho', 'soresu']);
    expect(s.state.memory.facts.some((f) => f.text.includes('Jedi Temple on Coruscant'))).toBe(true);
    // The forms pool (0.545) is shared out by the Knight plan's hours: Soresu 2/3, Ataru 1/3.
    expect(s.state.character.focusWeights['soresu']! + s.state.character.focusWeights['ataru']!).toBeCloseTo(defaultFocus(ARCHETYPE_BY_ID.get('jediGuardian')!)['$forms']!, 9);
    expect(s.state.character.unbalanced).toBe(false);
  });

  it('an unbalanced campaign carries the flag on the character', async () => {
    const input = {
      name: 'Kael',
      birthDate: { year: TEST_YEAR - 24, month: 1, day: 1 },
      startDate: TEST_START_DATE,
      startSecond: DEFAULT_START_SECOND,
      creation: {
        speciesId: 'human',
        path: 'jedi' as const,
        archetype: 'jediGuardian',
        rank: 'knight',
        trainingStartAge: 4,
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
      birthDate: { year: TEST_YEAR - 19, month: 1, day: 1 },
      startDate: TEST_START_DATE,
      startSecond: DEFAULT_START_SECOND,
      creation: { speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: 'knight', trainingStartAge: 4, talents: {}, dominantHand: 'right' },
    });
    expect(errors.join(' ')).toMatch(/story exception/);
  });
});
