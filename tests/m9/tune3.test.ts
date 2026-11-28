// m9-tune3 (Jared, 27 Nov 2026; report docs-v2/reports/m9-tune3.md): fighting tired retuned (item 1; the measurement is
// tests/measure/tiredFight.measure.ts), the front pace of the Sith Inquisitor and the soldier (items 2, 3), and the data fixes (item 5).
// Luke's body gate (item 4) is in tests/lifetime/checks.ts.
import { describe, expect, it } from 'vitest';
import { FRONTS } from '../../src/data/missions.config';
import { FRONT_PACE, GOOD_FORM } from '../../src/data/progression.config';
import { IMPERIAL_BORN_YEARS } from '../../src/data/traits';
import { SITH_POWERS, sithSideAt } from '../../src/data/wars';
import { goodFormMult, goodFormThreshold } from '../../src/engine/combatXp';
import { frontBaseFor } from '../../src/features/duty/missions';
import { frontPaced, selectFrontPace, speedPartsFor } from '../../src/features/progression/training';
import { traitRefusal, type TraitContext } from '../../src/features/traits/rules';
import type { GameState } from '../../src/state/gameState';
import { sithFactionAt } from '../../src/turn/devCommands';
import { base } from '../support/schemaSituations';

describe('item 1: fighting tired rewards keeping form', () => {
  it('a good-form exchange at capacity pays about x2, flat near rest, still rising to the hard limit', () => {
    expect(goodFormMult(1)).toBeGreaterThan(1.85);
    expect(goodFormMult(1)).toBeLessThan(2.1);
    expect(goodFormMult(0.3)).toBeLessThan(1.05);
    for (const s of [1, 1.5, 2, 3]) expect(goodFormMult(s + 0.5)).toBeGreaterThan(goodFormMult(s));
  });
  it('pushing lowers the threshold by Willpower: a Willpower-50 Knight keeps form on 12+ pushing, 16+ otherwise', () => {
    expect(goodFormThreshold(false, 50)).toBe(GOOD_FORM.threshold);
    expect(goodFormThreshold(true, 50)).toBe(12);
    expect(goodFormThreshold(true, 0)).toBe(GOOD_FORM.threshold);
  });
});

describe('items 2 and 3: the front pace by archetype and path', () => {
  const posting = { frontId: 'ggw.balmorra', front: 'the Balmorra front', warId: 'greatGalacticWar', base: { name: 'the forward base on Balmorra', planet: 'Balmorra' }, sinceDay: 0, nextLeaveDay: 99_999, arrived: true };
  const posted = (s: GameState): GameState => ({ ...s, duty: { ...s.duty, posting: { ...posting, sinceDay: s.clock.now.day } } }) as GameState;

  it('the Inquisitor and the soldier have their own W; the Sith Warrior keeps the Guardian\'s', () => {
    expect(FRONT_PACE.byArchetype['sithWarrior']).toBe(FRONT_PACE.byArchetype['jediGuardian']);
    expect(FRONT_PACE.byArchetype['sithInquisitor']).not.toBe(FRONT_PACE.byArchetype['jediConsular']);
    expect(FRONT_PACE.byArchetype['soldier']).toBeGreaterThan(1);
    expect(selectFrontPace(posted(base({ path: 'career', archetype: 'soldier' })))).toBe(FRONT_PACE.byArchetype['soldier']);
  });

  it('a non-Force career\'s front pace covers its weapon skills; the Jedi and Sith keep forms and Force skills', () => {
    expect(frontPaced('blaster', 'career')).toBe(true);
    expect(frontPaced('melee', 'career')).toBe(true);
    expect(frontPaced('gunnery', 'career')).toBe(true);
    expect(frontPaced('tactics', 'career')).toBe(false);
    expect(frontPaced('soresu', 'career')).toBe(false);
    expect(frontPaced('blaster', 'jedi')).toBe(false);
    expect(frontPaced('soresu', 'jedi')).toBe(true);
    expect(frontPaced('forceKnowledge', 'sith')).toBe(true);
    const w = FRONT_PACE.byArchetype['soldier']!;
    const parts = speedPartsFor(posted(base({ path: 'career', archetype: 'soldier' })), 1);
    expect(parts('blaster')!.front).toBe(w);
    expect(parts('tactics')!.front).toBe(1);
  });
});

describe('item 5: the data fixes', () => {
  const REP = ['republic', 'jediOrder'];
  // Allied sides share a base (the Imperial Remnant fought the Yuuzhan Vong beside the Alliance).
  const ALLIED_WARS = ['yuuzhanVongWar'];

  it('a front fought by opposed sides names each side\'s own base', () => {
    for (const f of FRONTS) {
      const others = f.sides.filter((x) => !REP.includes(x));
      if (!f.sides.some((x) => REP.includes(x)) || !others.length || ALLIED_WARS.includes(f.warId)) continue;
      for (const side of others) expect(frontBaseFor(f, side), `${f.id} ${side}`).not.toBe(f.base);
      expect(frontBaseFor(f, 'republic')).toBe(f.base);
    }
    const dantooine = FRONTS.find((f) => f.id === 'jcw.dantooine')!;
    expect(frontBaseFor(dantooine, 'sith')).not.toMatch(/Jedi/);
    const core = FRONTS.find((f) => f.id === 'ggw.core')!;
    expect(frontBaseFor(core, 'sithEmpire')).not.toMatch(/Republic/);
  });

  it(`one dated list of Sith powers: the dev duelists read SITH_POWERS; Revan's Sith a power of their own (D-580)`, () => {
    for (let y = -6000; y <= 200; y += 7) expect(sithFactionAt(y)).toBe(sithSideAt(y));
    const revan = SITH_POWERS.find((p) => p.fromBby === 3959)!;
    expect(revan.faction).toBe('sith');
    expect(revan.name).toMatch(/Revan's Sith Empire/);
    expect(sithSideAt(-3957)).toBe('sith');
    // Krayt's Empire (130-138 ABY, SW_Characters_18_LegacyEra).
    expect(sithSideAt(135)).toBe('sithEmpire');
    expect(sithSideAt(139)).toBe('sith');
  });

  it(`Imperial-born opens only for a birth in Vitiate's Sith Empire, its own dated list (D-581)`, () => {
    const ctx = (birthYear: number, path: TraitContext['path'] = 'sith', imperialBorn?: boolean): TraitContext => ({ path, speciesId: 'human', archetype: 'sithWarrior', birthYear, startYear: birthYear + 20, trainingStartAge: 8, ...(imperialBorn !== undefined ? { imperialBorn } : {}) });
    expect(IMPERIAL_BORN_YEARS).toEqual({ from: -4980, to: -3600 });
    // Open: Vitiate's Empire, from Kaas City's founding to its end.
    for (const y of [-4980, -3700, -3681, -3600]) expect(traitRefusal('imperialBorn', ctx(y)), String(y)).toBeNull();
    expect(traitRefusal('imperialBorn', ctx(-3690, 'career', true))).toBeNull();
    // Closed: not Imperial; the ancient Empire, the Brotherhood, Palpatine's Empire, Krayt's Empire.
    expect(traitRefusal('imperialBorn', ctx(-3690, 'career'))).not.toBeNull();
    for (const y of [-5100, -4990, -3599, -1020, -10, 135]) expect(traitRefusal('imperialBorn', ctx(y)), String(y)).not.toBeNull();
  });
});
