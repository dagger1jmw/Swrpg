// Canon growth past the last sheet, the same in every campaign, and no dark powers before a Jedi's fall (Jared, 2026-11-25;
// D-503, D-504).
import { describe, expect, it } from 'vitest';
import { archetypeDef } from '../../src/data/archetypes';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { CLASS_HEROES, PAST_SHEET } from '../../src/data/canon/growthCap';
import type { CanonNpc } from '../../src/data/canon/types';
import { DUELISTS } from '../../src/data/duelists';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonFallBby } from '../../src/engine/canonRoster';
import { canonLevelsAt, pastSheetGain, type CanonStatDeps } from '../../src/engine/canonStats';
import { canonFigureLevelsAt, canonFullMemberBy, selectNpcLevels } from '../../src/features/npcs/selectors';
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
  const deps = (over: Partial<CanonStatDeps> = {}): CanonStatDeps => ({ growthAt: (b) => 40 + (3700 - b), lineAt: () => ({}), livedAgeAt: (b) => 3700 - b, pastSheet: (b) => ({ from: b, most: 5 }), ...over });

  it('each stat holds at the sheet and 5; a slower growth is left alone; the body still ages', () => {
    const n = figure();
    expect(canonLevelsAt(n, 3650, deps())['soresu']).toBeCloseTo(80, 6);
    expect(canonLevelsAt(n, 3640, deps())['soresu']).toBeCloseTo(80 + pastSheetGain(10), 6);
    for (const b of [3630, 3600]) expect(canonLevelsAt(n, b, deps())['soresu']).toBeCloseTo(85, 6);
    expect(canonLevelsAt(n, 3600, deps({ growthAt: (b) => 90 + (3650 - b) * 0.01 }))['soresu']).toBeCloseTo((80 * 90.5) / 90, 6);
    expect(canonLevelsAt(n, 3600, deps({ retentionAt: (s, b) => (s === 'strength' && b < 3650 ? 0.5 : 1) }))['strength']).toBeCloseTo(32.5, 6);
    // An early-career sheet has more to come.
    expect(canonLevelsAt(n, 3600, deps({ pastSheet: (b) => ({ from: b, most: 15 }) }))['soresu']).toBeCloseTo(95, 6);
    // Without the cap the old curve stands.
    expect(canonLevelsAt(n, 3600, { growthAt: (b) => 40 + (3700 - b), lineAt: () => ({}), livedAgeAt: (b) => 3700 - b })['soresu']).toBeGreaterThan(100);
  });

  it('a later sheet resets it', () => {
    const n = figure({ anchors: [...figure().anchors, { bby: 3620, complete: true, basis: 'sheet', sources: 't', levels: { soresu: 95, strength: 60 } }] });
    expect(canonLevelsAt(n, 3620, deps())['soresu']).toBeCloseTo(95, 6);
    expect(canonLevelsAt(n, 3635, deps())['soresu']!).toBeGreaterThan(85);
    expect(canonLevelsAt(n, 3590, deps())['soresu']).toBeCloseTo(100, 6);
  });

  it('a Padawan or an apprentice sheeted in training grows as ever until a full member, then the cap from there', () => {
    const d = deps({ pastSheet: () => ({ from: 3640, most: 5 }) });
    const free = (b: number): number => (80 * (40 + 3700 - b)) / 90;
    expect(canonLevelsAt(figure(), 3640, d)['soresu']).toBeCloseTo(free(3640), 6);
    expect(canonLevelsAt(figure(), 3600, d)['soresu']).toBeCloseTo(free(3640) + 5, 6);
    const ranks = [{ role: 'padawan', title: 'Padawan', fromBby: 3660, toBby: 3646, source: 't' }, { role: 'jediKnight', title: 'Jedi Knight', fromBby: 3645, source: 't' }] as never;
    expect(canonFullMemberBy({ ranks }, 3650)).toBe(3645);
    expect(canonFullMemberBy({ ranks }, 3644)).toBe(3644);
    expect(canonFullMemberBy({ ranks: [] }, 3644)).toBe(3644);
  });

  it('every sheeted figure: never more than 5 over the figure as it was at its sheet, 15 for an early-career one', () => {
    for (const n of CANON_NPCS) {
      const a = n.anchors.filter((x) => x.complete).sort((x, y) => x.bby - y.bby)[0];
      if (!a || n.fixed) continue;
      const most = CLASS_HEROES.includes(n.canonId) || n.birthBby - a.bby < PAST_SHEET.earlyBefore ? PAST_SHEET.early : PAST_SHEET.most;
      const played = canonFigureLevelsAt(n, a.bby, day(a.bby));
      for (const b of [a.bby - 10, a.bby - 40]) {
        const l = canonFigureLevelsAt(n, b, day(b));
        // Every stat, the sheet's own and the ones it leaves to the game.
        for (const [k, v] of Object.entries(played)) expect(l[k]!, `${n.canonId} ${k} ${b}`).toBeLessThanOrEqual(v + most + 1e-6);
      }
    }
    for (const id of CLASS_HEROES) expect(CANON_BY_ID.has(id), id).toBe(true);
  });

  it("Gnost-Dural: 74 in 3,655, 79 for good; a campaign's too", () => {
    expect(at('gnost-dural', 3655)['soresu']).toBeCloseTo(74, 6);
    expect(at('gnost-dural', 3640)['soresu']!).toBeLessThan(79.01);
    expect(at('gnost-dural', 3600)['soresu']).toBeCloseTo(79, 1);
    for (const start of [3661, 3643]) expect(inCampaign('gnost-dural', start, 3625)['soresu'], `${start}`).toBeCloseTo(79, 1);
  });
});

describe('the same in every campaign (D-504)', () => {
  const NAMED = ['voidhound', 'kaliyo-djannis', 'pierce', 'andronikos-revel', 'meteor', 'aric-jorgan', 'malavai-quinn', 'gault-rennow', 'zenith'];

  it('campaigns from 3,661, 3,653 and 3,640 give one stat line for a figure at a date, every figure', () => {
    for (const n of CANON_NPCS) for (const b of [3640, 3630, 3620]) {
      if ((n.deathBby ?? 0) > b || n.birthBby - b < 10) continue;
      const id = n.canonId.slice(5);
      const dated = at(id, b);
      for (const start of [3681, 3661, 3653, 3640]) if (start >= b) for (const [k, v] of Object.entries(inCampaign(id, start, b))) expect(v, `${id} ${start}>${b} ${k}`).toBeCloseTo(dated[k] ?? 0, 6);
    }
  });

  it('a figure whose training starts after the campaign does is no runaway, and meets its sheet at its date', () => {
    for (const id of NAMED) for (const b of [3651, 3646, 3641, 3631]) for (const [k, v] of Object.entries(inCampaign(id, 3661, b))) expect(v, `${id} ${b} ${k}`).toBeLessThan(110);
    for (const n of CANON_NPCS) for (const a of n.anchors.filter((x) => x.complete)) {
      const l = inCampaign(n.canonId.slice(5), 3681, a.bby);
      if (a.bby <= 3681 && n.birthBby - 3681 > -60) for (const k of ['willpower', 'forceControl']) if (a.levels[k] !== undefined) expect(l[k]!, `${n.canonId} ${k}`).toBeCloseTo(Math.max(a.levels[k]!, at(n.canonId.slice(5), a.bby)[k]!), 6);
    }
    expect(inCampaign('voidhound', 3661, 3641)['willpower']!).toBeLessThan(85);
  });

  it('nobody but those beyond any duelist passes their highest sheet by more than 15, at any date', () => {
    const beyond = new Set(DUELISTS.filter((d) => d.bar === 'beyond').map((d) => d.canonId));
    const over: string[] = [];
    for (const n of CANON_NPCS) {
      const sheets = n.anchors.filter((x) => x.complete);
      if (!sheets.length || beyond.has(n.canonId)) continue;
      const played = sheets.map((a) => canonFigureLevelsAt(n, a.bby, day(a.bby)));
      for (let b = n.fixed ? 3700 : n.birthBby - 10; b >= Math.max(3590, n.deathBby ?? 0); b--) {
        const l = canonFigureLevelsAt(n, b, day(b));
        for (const [k, v] of Object.entries(l)) {
          // The sheet's own number, and what the figure had at its sheet's date (a stat the sheet leaves to the game).
          const top = Math.max(...sheets.map((a) => a.authored?.[k] ?? 0), ...played.map((p) => p[k] ?? 0));
          if (v > top + 15 + 1e-6) over.push(`${n.canonId} ${k} ${b}: ${v.toFixed(1)} over ${top.toFixed(1)}`);
        }
      }
    }
    expect(over).toEqual([]);
  }, 120_000);
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
