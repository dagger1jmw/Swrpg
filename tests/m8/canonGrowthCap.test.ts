// Canon growth past the last sheet, and no dark powers before a Jedi's fall (Jared, 2026-11-25; D-503).
import { describe, expect, it } from 'vitest';
import { archetypeDef } from '../../src/data/archetypes';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { PAST_SHEET } from '../../src/data/canon/growthCap';
import type { CanonNpc } from '../../src/data/canon/types';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonFallBby } from '../../src/engine/canonRoster';
import { canonLevelsAt, canonLevelsInCampaign, pastSheetGain, type CanonStatDeps } from '../../src/engine/canonStats';
import { canonFigureLevelsAt, canonTrainedBy, selectNpcLevels } from '../../src/features/npcs/selectors';
import type { GameState } from '../../src/state/gameState';

const day = (bby: number): number => absDayFromDate({ year: -bby, month: 1, day: 1 });
const at = (id: string, bby: number): Record<string, number> => canonFigureLevelsAt(CANON_BY_ID.get(`lore:${id}`)!, bby, day(bby));
/** A figure in a campaign begun in one year, in another. */
const inCampaign = (id: string, start: number, now: number): Readonly<Record<string, number>> => {
  const n = CANON_BY_ID.get(`lore:${id}`)!;
  return selectNpcLevels({ npcs: { byId: { x: { id: 'x', name: n.name, canonId: n.canonId, speciesId: n.speciesId, factionId: n.faction, role: 'other', birthDay: null, gen: null } } }, clock: { now: { day: day(now), second: 0 }, startDay: day(start) }, meta: { campaignId: 'c' } } as unknown as GameState, 'x');
};

describe('past the last sheet', () => {
  it('at most 5 over 20 years, the most of it early, then it holds', () => {
    expect([pastSheetGain(-3), pastSheetGain(0), pastSheetGain(PAST_SHEET.years), pastSheetGain(80)]).toEqual([0, 0, PAST_SHEET.most, PAST_SHEET.most]);
    expect(pastSheetGain(10)).toBeGreaterThan(PAST_SHEET.most / 2);
    for (let y = 1; y <= 20; y++) expect(pastSheetGain(y) - pastSheetGain(y - 1)).toBeGreaterThan(0);
  });

  const figure = (over: Partial<CanonNpc> = {}): CanonNpc => ({ canonId: 'lore:x', name: 'x', speciesId: 'human', faction: 'jediOrder', archetype: 'jediGuardian', birthBby: 3700, birthSource: 'lore', ranks: [], anchors: [{ bby: 3650, complete: true, basis: 'sheet', sources: 't', levels: { soresu: 80, strength: 60 } }], ...over });
  const deps = (over: Partial<CanonStatDeps> = {}): CanonStatDeps => ({ growthAt: (b) => 40 + (3700 - b), lineAt: () => ({}), livedAgeAt: (b) => 3700 - b, trainedBy: 3650, ...over });

  it('each stat holds at the sheet and 5; a slower growth is left alone; the body still ages', () => {
    const n = figure();
    expect(canonLevelsAt(n, 3650, deps())['soresu']).toBeCloseTo(80, 6);
    expect(canonLevelsAt(n, 3640, deps())['soresu']).toBeCloseTo(80 + pastSheetGain(10), 6);
    for (const b of [3630, 3600]) expect(canonLevelsAt(n, b, deps())['soresu']).toBeCloseTo(85, 6);
    expect(canonLevelsAt(n, 3600, deps({ growthAt: (b) => 90 + (3650 - b) * 0.01 }))['soresu']).toBeCloseTo((80 * 90.5) / 90, 6);
    expect(canonLevelsAt(n, 3600, deps({ retentionAt: (s, b) => (s === 'strength' && b < 3650 ? 0.5 : 1) }))['strength']).toBeCloseTo(32.5, 6);
    // Without the trained years the old curve stands.
    expect(canonLevelsAt(n, 3600, { growthAt: (b) => 40 + (3700 - b), lineAt: () => ({}), livedAgeAt: (b) => 3700 - b })['soresu']).toBeGreaterThan(100);
  });

  it('a later sheet resets it', () => {
    const n = figure({ anchors: [...figure().anchors, { bby: 3620, complete: true, basis: 'sheet', sources: 't', levels: { soresu: 95, strength: 60 } }] });
    expect(canonLevelsAt(n, 3620, deps())['soresu']).toBeCloseTo(95, 6);
    expect(canonLevelsAt(n, 3635, deps())['soresu']!).toBeGreaterThan(85);
    expect(canonLevelsAt(n, 3590, deps())['soresu']).toBeCloseTo(100, 6);
  });

  it('a figure sheeted in its training years grows as ever until they end, then the cap', () => {
    const d = deps({ trainedBy: 3640 });
    const free = (b: number): number => (80 * (40 + 3700 - b)) / 90;
    expect(canonLevelsAt(figure(), 3640, d)['soresu']).toBeCloseTo(free(3640), 6);
    expect(canonLevelsAt(figure(), 3600, d)['soresu']).toBeCloseTo(free(3640) + 5, 6);
  });

  it('in a campaign too, begun before the last sheet or after it', () => {
    const g = (b: number): number => 40 + (3700 - b);
    const none = (): null => null;
    const cap = (): number => 3650;
    expect(canonLevelsInCampaign({ soresu: 70 }, g, 3660, 3600, undefined, none)['soresu']).toBeCloseTo((70 * 140) / 80, 6);
    expect(canonLevelsInCampaign({ soresu: 70 }, g, 3660, 3600, undefined, cap)['soresu']).toBeCloseTo((70 * 90) / 80 + 5, 6);
    expect(canonLevelsInCampaign({ soresu: 84 }, g, 3640, 3600, undefined, cap)['soresu']).toBeCloseTo(84 + 5 - pastSheetGain(10), 6);
  });

  it('every sheeted figure past its trained years: never more than 5 over the sheet', () => {
    let seen = 0;
    for (const n of CANON_NPCS) {
      const a = n.anchors.filter((x) => x.complete).sort((x, y) => x.bby - y.bby)[0];
      if (!a || n.fixed || canonTrainedBy(n) < a.bby) continue;
      seen++;
      const played = canonFigureLevelsAt(n, a.bby, day(a.bby));
      for (const b of [a.bby - 10, a.bby - 40]) {
        if (b < (n.deathBby ?? 0)) continue;
        const l = canonFigureLevelsAt(n, b, day(b));
        // Every stat, the sheet's own and the ones it leaves to the game.
        for (const [k, v] of Object.entries(played)) expect(l[k]!, `${n.canonId} ${k} ${b}`).toBeLessThanOrEqual(v + PAST_SHEET.most + 1e-6);
      }
    }
    expect(seen).toBeGreaterThan(12);
  });

  it("Gnost-Dural: 74 in 3,655, 79 for good; a campaign's too", () => {
    expect(at('gnost-dural', 3655)['soresu']).toBeCloseTo(74, 6);
    expect(at('gnost-dural', 3640)['soresu']!).toBeLessThan(79.01);
    expect(at('gnost-dural', 3600)['soresu']).toBeCloseTo(79, 1);
    for (const start of [3661, 3643]) expect(inCampaign('gnost-dural', start, 3625)['soresu']!, `${start}`).toBeLessThan(81);
  });
});

describe('a Jedi who falls', () => {
  it('has no dark power before the fall', () => {
    const fallen = CANON_NPCS.filter((n) => canonFallBby(n) !== null);
    expect(fallen.map((n) => n.canonId.slice(5)).sort()).toEqual(['ako-domi', 'bengel-morr', 'darth-karrid', 'jaesa-willsaam', 'parkanas-tark']);
    for (const n of fallen) for (let b = n.birthBby - 10; b > canonFallBby(n)!; b--) {
      const l = canonFigureLevelsAt(n, b, day(b));
      for (const k of ['forceChoke', 'forceLightning', 'deadlySight']) expect(l[k] ?? 0, `${n.canonId} ${b} ${k}`).toBe(0);
    }
    expect(canonFallBby(CANON_BY_ID.get('lore:darth-karrid')!)).toBe(3645);
    expect(at('darth-karrid', 3645)['forceChoke']!).toBeGreaterThan(0);
    expect(at('jaesa-willsaam', 3642)['forceChoke']!).toBeGreaterThan(0);
  });

  it('in a campaign begun before the fall they come with it; one who was a Sith first is no fallen Jedi', () => {
    expect([inCampaign('darth-karrid', 3661, 3650)['forceChoke'], inCampaign('darth-karrid', 3661, 3650)['forceLightning']]).toEqual([0, 0]);
    expect(inCampaign('darth-karrid', 3661, 3641)['forceLightning']!).toBeGreaterThan(50);
    expect(inCampaign('darth-karrid', 3661, 3641)['forceChoke']!).toBeGreaterThan(0);
    for (const id of ['praven', 'sajar', 'darth-malgus']) expect(canonFallBby(CANON_BY_ID.get(`lore:${id}`)!), id).toBeNull();
    expect(archetypeDef('sithWarrior').path).toBe('sith');
    expect(at('darth-malgus', 3675)['forceChoke']!).toBeGreaterThan(0);
  });
});
