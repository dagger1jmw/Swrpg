// The canon NPC stat model (D-414), on a synthetic figure with a simple growth curve.
import { describe, expect, it } from 'vitest';
import type { CanonNpc } from '../../src/data/canon/types';
import { canonLivedAgeAt } from '../../src/engine/canonRoster';
import { canonLevelsAt, canonLevelsDiverged, eventFactor, type CanonStatDeps } from '../../src/engine/canonStats';

// Born 3,700; G grows with lived age; the generator's line is 0.6 × G for every stat.
const figure = (over: Partial<CanonNpc> = {}): CanonNpc => ({
  canonId: 'lore:test',
  name: 'Test',
  speciesId: 'human',
  faction: 'jediOrder',
  archetype: 'jediGuardian',
  birthBby: 3700,
  birthSource: 'estimate',
  ranks: [{ role: 'jediKnight', title: 'Jedi Knight', fromBby: 3675, source: 'test' }],
  anchors: [],
  ...over,
});
const deps = (n: CanonNpc): CanonStatDeps => {
  const g = (bby: number) => 10 + 2 * canonLivedAgeAt(n, bby);
  return { growthAt: g, lineAt: (bby) => ({ forceControl: 0.6 * g(bby), shiiCho: 0.6 * g(bby), strength: 0.6 * g(bby) }), livedAgeAt: (bby) => canonLivedAgeAt(n, bby) };
};

describe('canon stats from anchors (D-414)', () => {
  const sheet = { bby: 3660, complete: true, basis: 'sheet' as const, sources: 'test', levels: { forceControl: 90, shiiCho: 80, strength: 70 } };
  it('the same figure at three ages: the sheet at its year, weaker before, stronger after', () => {
    const n = figure({ anchors: [sheet] });
    const at = (bby: number) => canonLevelsAt(n, bby, deps(n)).shiiCho!;
    expect(at(3660)).toBeCloseTo(80);
    expect(at(3680)).toBeLessThan(at(3670));
    expect(at(3670)).toBeLessThan(at(3660));
    expect(at(3650)).toBeGreaterThan(at(3660));
    expect(at(3680) / at(3660)).toBeCloseTo((10 + 2 * 20) / (10 + 2 * 40));
  });
  it('a partial anchor: Force stats from one source, saber stats from the complete line', () => {
    const novel = { bby: 3670, complete: false, basis: 'sheet' as const, sources: 'a novel at 30', levels: { forceControl: 75 } };
    const n = figure({ anchors: [sheet, novel] });
    const l = canonLevelsAt(n, 3670, deps(n));
    expect(l.forceControl).toBeCloseTo(75); // the novel's anchor
    expect(l.shiiCho).toBeCloseTo(80 * (10 + 2 * 30) / (10 + 2 * 40)); // the sheet carried back
    // Between the two anchors the Force stat fits both.
    expect(canonLevelsAt(n, 3660, deps(n)).forceControl).toBeCloseTo(90);
    const mid = canonLevelsAt(n, 3665, deps(n)).forceControl!;
    expect(mid).toBeGreaterThan(75);
    expect(mid).toBeLessThan(90);
  });
  it('going backward is clamped at the archetype baseline for that age, never above what the sheet sets (D-495)', () => {
    const weak = { bby: 3660, complete: true, basis: 'sheet' as const, sources: 'test', levels: { forceControl: 20, shiiCho: 20, strength: 20 } };
    const n = figure({ anchors: [weak] });
    const d = deps(n);
    expect(0.6 * d.growthAt(3665)).toBeGreaterThan(20);
    expect(canonLevelsAt(n, 3665, d).forceControl).toBeCloseTo(20);
    const unset = figure({ anchors: [{ ...weak, levels: { shiiCho: 20 } }] });
    expect(canonLevelsAt(unset, 3665, d).forceControl).toBeCloseTo(0.6 * d.growthAt(3665));
  });
  it('a stat no anchor shows takes the generator line; with no anchors the whole line is generated', () => {
    const n = figure();
    expect(canonLevelsAt(n, 3660, deps(n))).toEqual(deps(n).lineAt(3660));
  });
  it('stasis: no ageing and no growth during it', () => {
    const n = figure({ anchors: [sheet], status: [{ kind: 'stasis', fromBby: 3655, toBby: 3646, note: 'test', source: 'test' }] });
    expect(canonLivedAgeAt(n, 3650)).toBe(canonLivedAgeAt(n, 3655));
    expect(canonLivedAgeAt(n, 3640)).toBe(3700 - 3640 - 9); // ages 45 at 3,655 and still 45 at 3,646
    const at = (bby: number) => canonLevelsAt(n, bby, deps(n)).shiiCho!;
    expect(at(3650)).toBeCloseTo(at(3655));
    expect(at(3646)).toBeCloseTo(at(3655));
    expect(at(3640)).toBeGreaterThan(at(3646));
  });
  it('dated events apply from their date on; an anchor after an event already includes it', () => {
    const n = figure({ anchors: [sheet], events: [{ bby: 3655, kind: 'limbLoss', note: 'test', factors: { shiiCho: 0.8 }, source: 'test' }] });
    expect(eventFactor(n, 'shiiCho', 3656)).toBe(1);
    expect(eventFactor(n, 'shiiCho', 3655)).toBe(0.8);
    const g = deps(n).growthAt;
    expect(canonLevelsAt(n, 3650, deps(n)).shiiCho).toBeCloseTo(80 * 0.8 * g(3650) / g(3660));
    expect(canonLevelsAt(n, 3650, deps(n)).strength).toBeCloseTo(70 * g(3650) / g(3660));
    const later = figure({ anchors: [{ ...sheet, bby: 3650 }], events: [{ bby: 3655, kind: 'limbLoss', note: 'test', factors: { shiiCho: 0.8 }, source: 'test' }] });
    expect(canonLevelsAt(later, 3650, deps(later)).shiiCho).toBeCloseTo(80);
  });
  it('fixed figures keep their sheet', () => {
    const n = figure({ anchors: [sheet], fixed: 'immortal' });
    expect(canonLevelsAt(n, 3690, deps(n))).toEqual(sheet.levels);
  });
  it('a figure off its canon course grows from that day by its own growth, with no runaway (D-504)', () => {
    const start = { shiiCho: 50 };
    const g = (bby: number) => 3700 - bby;
    expect(canonLevelsDiverged(start, { shiiCho: 50 }, g, g, 3661, 3661)).toEqual(start);
    expect(canonLevelsDiverged(start, { shiiCho: 90 }, g, g, 3661, 3651).shiiCho).toBeCloseTo(50 * 49 / 39);
    expect(canonLevelsDiverged(start, { shiiCho: 55 }, g, g, 3661, 3651).shiiCho).toBe(55);
    expect(canonLevelsDiverged(start, { shiiCho: 55 }, (b) => g(b) / 1.1, g, 3661, 3651).shiiCho).toBeCloseTo(55 * 1.1);
    // Barely trained that day: no runaway multiplication.
    expect(canonLevelsDiverged(start, { shiiCho: 60 }, () => 30, (b) => (b === 3661 ? 0.1 : 30), 3661, 3651).shiiCho).toBe(60);
  });
});
