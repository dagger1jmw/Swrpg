// skills-and-activities.md §6 tests 1-4 and species.md §5 test 6 (M3 step 2).
import { describe, expect, it } from 'vitest';
import { ACTIVITIES, ACTIVITY_BY_ID, DEFAULT_ACTIVITY, INTENSITIES, activityDef, isActivityId } from '../../src/data/activities';
import { ARCHETYPES, focusShares, sharesFromWeights } from '../../src/data/archetypes';
import { ORDER_REQUIREMENTS, REQUIREMENT_ROW } from '../../src/data/orderRequirements';
import { AGE_ROWS, RUST } from '../../src/data/progression.config';
import { RANKS } from '../../src/data/rankMinimums';
import { CATEGORY_RULES, SKILLS, SKILL_BY_ID, isSkillId, skillDef } from '../../src/data/skills';
import { SPECIES, TRAIT_LIMITS, speciesOfferedAt } from '../../src/data/species';

const TOKENS = new Set(['$mainForm', '$secondForm', '$knownForms', '$pairedStat', '$primary', '$main', '$highestForm', '$planMaster', '$planSolo']);
const known = (id: string): boolean => TOKENS.has(id) || isSkillId(id);

describe('skills and activities (spec §6)', () => {
  it('test 1: every skill id read by an activity, archetype, requirement, rank or species exists with a category', () => {
    const refs: string[] = [];
    for (const a of ACTIVITIES) {
      if (a.primary.kind === 'skill') refs.push(a.primary.skill);
      if (a.primary.kind === 'options') refs.push(...a.primary.options);
      refs.push(...Object.keys(a.secondaries));
      for (const u of a.unlock) if ('skill' in u) refs.push(u.skill);
    }
    for (const ar of ARCHETYPES) {
      refs.push(ar.main, ...Object.keys(ar.weights));
      for (const p of Object.values(ar.paces)) refs.push(...Object.keys(p ?? {}));
    }
    for (const r of RANKS) refs.push(...Object.keys(r.minimums));
    for (const s of SPECIES) for (const l of s.learning) if (l.target.kind === 'skill') refs.push(l.target.skill);
    for (const id of Object.keys(DEFAULT_ACTIVITY)) refs.push(id);
    const missing = refs.filter((r) => !known(r));
    expect(missing).toEqual([]);
    for (const s of SKILLS) expect(CATEGORY_RULES[s.category]).toBeDefined();
  });

  it('test 2: every activity declares loads, a default intensity, ratings and weights that normalize to the 0.25 share', () => {
    for (const a of ACTIVITIES) {
      expect(Number.isFinite(a.load.p) && Number.isFinite(a.load.m) && Number.isFinite(a.load.f), a.id).toBe(true);
      expect(INTENSITIES).toContain(a.defaultIntensity);
      expect(a.ratings[0]).toBe(10);
      const total = Object.values(a.secondaries).reduce((x, y) => x + y, 0);
      expect(total, a.id).toBeGreaterThan(0);
      const normalized = Object.values(a.secondaries).map((w) => (0.25 * w) / total);
      expect(normalized.reduce((x, y) => x + y, 0)).toBeCloseTo(0.25, 10);
    }
  });

  it('test 3: the age row and rust row of each skill match its category', () => {
    for (const s of SKILLS) {
      const rules = CATEGORY_RULES[s.category];
      expect(AGE_ROWS[rules.ageRow]).toBeDefined();
      expect(RUST[rules.rustRow]).toBeDefined();
    }
    expect(CATEGORY_RULES[skillDef('forceKnowledge').category]).toMatchObject({ ageRow: 'wisdom', rustRow: 'knowledge' });
    expect(CATEGORY_RULES[skillDef('intelligence').category]).toMatchObject({ ageRow: 'academic', rustRow: 'knowledge' });
    expect(CATEGORY_RULES[skillDef('endurance').category]).toMatchObject({ ageRow: 'physical', rustRow: 'physical', bodyCapped: true });
    expect(CATEGORY_RULES[skillDef('meditation').category]).toMatchObject({ ageRow: 'wisdom', rustRow: 'technique' });
    expect(CATEGORY_RULES[skillDef('shiiCho').category]).toMatchObject({ ageRow: 'technique', rustRow: 'technique' });
  });

  it('test 4: unknown skill or activity ids are rejected, with no alias fallback', () => {
    expect(isSkillId('Shii-Cho')).toBe(false);
    expect(isSkillId('shii cho')).toBe(false);
    expect(() => skillDef('lightsaber')).toThrow(/Unknown skill/);
    expect(isActivityId('shiiCho')).toBe(false);
    expect(() => activityDef('saber practice')).toThrow(/Unknown activity/);
  });

  it('each default activity trains its skill', () => {
    for (const [skill, actId] of Object.entries(DEFAULT_ACTIVITY)) {
      const a = ACTIVITY_BY_ID.get(actId);
      expect(a, `${skill} -> ${actId}`).toBeDefined();
      const p = a!.primary;
      const ok =
        (p.kind === 'skill' && p.skill === skill) ||
        (p.kind === 'options' && p.options.includes(skill)) ||
        (p.kind === 'anyForm' && SKILL_BY_ID.get(skill)?.kind === 'form') ||
        (p.kind === 'anyAbility' && SKILL_BY_ID.get(skill)?.kind === 'forceAbility');
      expect(ok, `${skill} -> ${actId}`).toBe(true);
    }
  });

  it('archetype shares sum to 1 (npc-generation test 7, first half)', () => {
    for (const a of ARCHETYPES) {
      const s = sharesFromWeights(a.weights);
      expect(Object.values(s).reduce((x, y) => x + y, 0)).toBeCloseTo(1, 10);
      const f = focusShares(a.weights, a.main);
      expect(Object.values(f).reduce((x, y) => x + y, 0)).toBeCloseTo(1, 10);
      expect(f[a.main]).toBe(0.5);
      expect(a.weights[a.main]).toBe(1);
    }
  });

  it('order requirement rows use known activities', () => {
    for (const blocks of Object.values(ORDER_REQUIREMENTS)) {
      for (const b of blocks) expect(b.activityId === '$formBasics' || isActivityId(b.activityId), b.activityId).toBe(true);
    }
    for (const row of Object.values(REQUIREMENT_ROW)) expect(ORDER_REQUIREMENTS[row]).toBeDefined();
  });
});

describe('species (species.md §5)', () => {
  it('test 6: every species row has a lifespan, maturity, bodyScale and a source or design note', () => {
    expect(SPECIES).toHaveLength(45);
    for (const s of SPECIES) {
      expect(s.lifespan).toBeGreaterThan(s.maturity);
      expect(s.maturity).toBeGreaterThan(0);
      expect(s.bodyScale).toBeGreaterThan(0);
      expect(s.source.length).toBeGreaterThan(0);
      // Lore batch 21 (D-399): every age number carries a source tag and a basis.
      for (const tag of [s.ageSource.lifespan, s.ageSource.maturity]) expect(['lore', 'game stat', 'house default']).toContain(tag);
      expect(s.ageSource.basis.length).toBeGreaterThan(0);
    }
  });

  it('lore batch 21 (D-399): 38 species offered in 3,661 BBY, the Voss only from 3,645 BBY, seven NPC-only', () => {
    expect(speciesOfferedAt(-3661)).toHaveLength(37);
    expect(speciesOfferedAt(-3661).map((s) => s.id)).not.toContain('voss');
    expect(speciesOfferedAt(-3645).map((s) => s.id)).toContain('voss');
    expect(speciesOfferedAt(-3645)).toHaveLength(38);
    expect(SPECIES.filter((s) => !s.playable).map((s) => s.id).sort()).toEqual(['aqualish', 'echani', 'gektl', 'gormak', 'houk', 'sarkhai', 'yodas_species']);
  });
  it('lore batch 21 (D-399): rulings 2-6, 19 in the age data', () => {
    const d = (id: string) => SPECIES.find((s) => s.id === id)!;
    for (const id of ['sith_pureblood', 'twilek', 'mirialan', 'rattataki', 'mon_calamari', 'rodian', 'voss', 'nikto', 'devaronian', 'houk', 'sullustan', 'gormak', 'gektl', 'echani', 'sarkhai']) {
      expect([d(id).lifespan, d(id).maturity, d(id).ageSource.lifespan], id).toEqual([100, 18, 'house default']);
    }
    expect([d('falleen').lifespan, d('wookiee').lifespan, d('zabrak').lifespan, d('zabrak').ageSource.lifespan]).toEqual([250, 400, 80, 'lore']);
    expect([d('hutt').lifespan, d('hutt').maturity]).toEqual([1000, 200]);
    expect(d('gran').ageSource).toMatchObject({ lifespan: 'game stat', unverified: true });
    expect(d('aqualish').ageSource).toMatchObject({ lifespan: 'game stat', unverified: true });
  });

  it('traits stay within the species.md §3 limits', () => {
    for (const s of SPECIES) {
      for (const v of Object.values(s.capBonus)) expect(v).toBeLessThanOrEqual(TRAIT_LIMITS.maxCapBonus);
      for (const l of s.learning) {
        expect(l.factor).toBeGreaterThanOrEqual(TRAIT_LIMITS.minLearning);
        expect(l.factor).toBeLessThanOrEqual(TRAIT_LIMITS.maxLearning);
      }
    }
  });
});
