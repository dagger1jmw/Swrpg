// Species traits (M8 checklist item 3; D-473): sourced, in the six kinds, with natural ceilings and lore body scales.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPECIES, TRAIT_LIMITS, speciesDef } from '../../src/data/species';
import { HUMAN_HEIGHT, SPECIES_HEIGHT, SPECIES_TRAITS, TRAIT_KINDS, traitCapBonus, traitCeilings, traitHazardFactor, traitHide, traitsOf } from '../../src/data/speciesTraits';
import { SPECIES_FORCE_TRAITS, TRAIT_RESISTANCE } from '../../src/data/forceResistance.config';
import { characterForceTraits, forceContest, type ForceTarget } from '../../src/engine/combatForce';
import { damageOf } from '../../src/engine/damage';
import { bodyCap, humanBodyCap, physicalPerformance } from '../../src/engine/species';
import { seedRng } from '../../src/engine/rng';

const OLDER = ['human', 'twilek', 'zabrak', 'mirialan', 'togruta', 'miraluka', 'chiss', 'cathar', 'sith_pureblood', 'rattataki', 'mon_calamari', 'wookiee'];
const NEW33 = SPECIES.map((s) => s.id).filter((id) => !OLDER.includes(id));

describe('the trait list', () => {
  it('all 33 species of lore batch 21 have traits, every one sourced and in the six kinds', () => {
    expect(NEW33).toHaveLength(33);
    for (const id of NEW33) expect(traitsOf(id).length, id).toBeGreaterThan(0);
    for (const [id, list] of Object.entries(SPECIES_TRAITS)) {
      expect(SPECIES.some((s) => s.id === id), id).toBe(true);
      for (const t of list) {
        expect(TRAIT_KINDS).toContain(t.kind);
        const m = /^(SW_Species_OldRepublic_Part[12]), (.+)$/.exec(t.source)!;
        const file = readFileSync(`Docs/SWRPG lore/${m[1]}.md`, 'utf8');
        expect(file, t.source).toContain(`### ${m[2]}`);
      }
    }
  });
  it('the drawbacks the lore gives are there', () => {
    expect(traitsOf('kel_dor').some((t) => t.drawback && /mask and goggles/.test(t.text))).toBe(true);
    expect(traitsOf('wookiee').some((t) => t.drawback && /Basic/.test(t.text))).toBe(true);
  });
  it('a dated social trait holds only in its years', () => {
    expect(traitsOf('duros', -3661).some((t) => /Imperial slaves/.test(t.text))).toBe(true);
    expect(traitsOf('duros', -20).some((t) => /Imperial slaves/.test(t.text))).toBe(false);
  });
});

describe('body', () => {
  it('body scale is the lore height over a Human one; with no height it stays 1.0 (the Hutt 1.5, invented)', () => {
    for (const id of NEW33) {
      const s = speciesDef(id);
      const h = SPECIES_HEIGHT[id];
      if (h) expect([s.bodyScale, s.bodyScaleSource], id).toEqual([Math.round((h.m / HUMAN_HEIGHT) * 100) / 100, h.tag]);
      else if (id !== 'hutt') expect([s.bodyScale, s.bodyScaleSource], id).toEqual([1, undefined]);
    }
    expect([speciesDef('hutt').bodyScale, speciesDef('hutt').bodyScaleSource]).toEqual([1.5, 'invented']);
  });
  const peakOf = (id: string, stat: 'strength' | 'agility' | 'endurance') => Math.max(...[...Array(100).keys()].map((i) => bodyCap(id, stat, (speciesDef(id).lifespan * i) / 100)));
  it('size scales neither Strength nor Agility, in any species (D-474): both are the Human ceiling unless the lore says otherwise', () => {
    for (const s of SPECIES) for (const stat of ['strength', 'agility'] as const) {
      const own = traitCeilings(s.id)[stat] ?? 80 + (s.capBonus[stat] ?? 0);
      expect(peakOf(s.id, stat), `${s.id} ${stat}`).toBeCloseTo(own, 0);
    }
    for (const id of ['duros', 'cerean', 'jawa', 'yodas_species', 'ithorian', 'epicanthix', 'cathar', 'mon_calamari']) expect(peakOf(id, 'strength'), id).toBeCloseTo(80, 0);
    expect(peakOf('hutt', 'agility')).toBeCloseTo(80, 0);
    expect(peakOf('wookiee', 'agility')).toBeCloseTo(100, 0);
    expect(peakOf('jawa', 'endurance')).toBeCloseTo(0.57 * 80, 0);
  });
  it('every Strength above the Human ceiling, and every ceiling set directly, rests on a cited body trait', () => {
    expect(SPECIES.filter((s) => peakOf(s.id, 'strength') > 80.5).map((s) => s.id).sort()).toEqual(['houk', 'hutt', 'talz', 'trandoshan', 'wookiee']);
    for (const s of SPECIES) {
      expect(s.ceilings ?? {}, s.id).toEqual(traitCeilings(s.id));
      if ((s.capBonus.strength ?? 0) > 0) expect(traitCapBonus(s.id).strength, s.id).toBe(s.capBonus.strength);
    }
  });
  it('a Wookiee is the strongest, a Houk next, and no trained Human passes the Human ceiling', () => {
    const peak = (id: string) => peakOf(id, 'strength');
    const ranked = SPECIES.filter((s) => s.id !== 'hutt').map((s) => s.id).sort((a, b) => peak(b) - peak(a));
    expect(ranked.slice(0, 2)).toEqual(['wookiee', 'houk']);
    expect(peak('trandoshan')).toBeGreaterThan(peak('human') * 1.15);
    expect(physicalPerformance('strength', 400, peak('human'), 0)).toBe(80);
    for (const s of SPECIES) for (const v of Object.values(s.capBonus)) expect(v).toBeLessThanOrEqual(TRAIT_LIMITS.maxCapBonus);
  });
  it('the ceilings follow prime and decline', () => {
    expect(bodyCap('houk', 'strength', 85)).toBeLessThan(bodyCap('houk', 'strength', 30));
    expect(bodyCap('houk', 'strength', 85) / bodyCap('houk', 'strength', 30)).toBeCloseTo(humanBodyCap(85) / humanBodyCap(30), 9);
  });
});

describe('resistances', () => {
  it('a hide takes armor points off a blow, a quarter of them off a lightsaber', () => {
    expect(traitHide('weequay')).toBe(2);
    const hit = { weapon: 'blasterPistol', quality: 'solid', armor: 'none', saberResistant: false } as const;
    expect(damageOf(hit) - damageOf({ ...hit, hide: 2 })).toBeCloseTo(2, 9);
    const saber = { ...hit, weapon: 'lightsaber' } as const;
    expect(damageOf(saber) - damageOf({ ...saber, hide: 2 })).toBeCloseTo(0.5, 9);
  });
  it('poison does little to a Devaronian or a Hutt; everyone else takes it in full', () => {
    expect(traitHazardFactor('devaronian', 'poison')).toBe(0.25);
    expect(traitHazardFactor('hutt', 'poison')).toBe(0.5);
    expect(traitHazardFactor('human', 'poison')).toBe(1);
  });
});

describe('the Force', () => {
  const target = (speciesId: string, own?: Parameters<typeof characterForceTraits>[2]): ForceTarget => ({ name: 't', willpower: 40, agility: 30, forceResistance: 0, traits: characterForceTraits(speciesId, false, own), bodySize: 'humanoid', inCover: false, canReact: true, saberLevel: 0 });
  const wins = (t: ForceTarget, kind: 'mindTrick' | 'choke' | 'throw', group: 'mind' | 'grip' | 'avoidable'): number => {
    let n = 0;
    for (let i = 0; i < 400; i++) if (forceContest(seedRng(`${kind}${i}`), { kind, group, level: 60, modifiers: [], target: t, negated: false })[0].success) n++;
    return n;
  };
  it('Falleen resist mind tricks, Hutts cannot be mind-tricked, and only the mind is guarded', () => {
    expect(wins(target('falleen'), 'mindTrick', 'mind')).toBeLessThan(wins(target('human'), 'mindTrick', 'mind'));
    expect(wins(target('hutt'), 'mindTrick', 'mind')).toBe(0);
    expect(wins(target('falleen'), 'choke', 'grip')).toBe(wins(target('human'), 'choke', 'grip'));
  });
  it('a Dashade resists a Force grip and a mind trick, and a thrown object not at all', () => {
    expect(wins(target('dashade'), 'choke', 'grip')).toBeLessThan(wins(target('human'), 'choke', 'grip'));
    expect(wins(target('dashade'), 'mindTrick', 'mind')).toBeLessThan(wins(target('human'), 'mindTrick', 'mind'));
    expect(wins(target('dashade'), 'throw', 'avoidable')).toBe(wins(target('human'), 'throw', 'avoidable'));
    expect(TRAIT_RESISTANCE).toBeGreaterThan(0);
  });
  it('every Force trait in the list is the one the engine rules by', () => {
    for (const [id, list] of Object.entries(SPECIES_TRAITS)) for (const t of list) for (const e of t.effects ?? []) if (e.kind === 'forceTrait') expect(SPECIES_FORCE_TRAITS[id], id).toContain(e.trait);
  });
  it('one figure can break its species rule (the Onimi pattern)', () => {
    expect(characterForceTraits('falleen', false, { without: ['mindResistant'] })).toEqual([]);
    expect(characterForceTraits('epicanthix', false, { with: ['mindResistant'] })).toEqual(['mindResistant']);
    expect(characterForceTraits('yuuzhanVong', true)).toEqual(['mindImmune']);
  });
});
