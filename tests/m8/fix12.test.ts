// Leaving the canon line by a change of training, and NPC training that stops by years trained (Jared, 2026-11-25; D-506).
import { describe, expect, it } from 'vitest';
import { APPRENTICESHIPS, cutShortBy } from '../../src/data/canon/apprenticeships';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { bodyCapAt } from '../../src/engine/species';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonFigureLevelsAt, canonLevelsOffLine, npcLevelsFor, selectNpcLevels } from '../../src/features/npcs/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const day = (bby: number): number => absDayFromDate({ year: -bby, month: 1, day: 1 });
const KARRID = CANON_BY_ID.get('lore:darth-karrid')!;

const game = (bby: number): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c-fix12',
    branchId: 'b1',
    seed: 'fix12',
    start: { day: day(bby), second: 9 * 3600 },
    character: { name: 'Kael', birthDay: day(bby) - 20 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 } as never,
    startingXp: {},
    rank: 'padawan',
  });
const meet = (s: GameState, name: string, canonId: string): [GameState, string] => {
  let t = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name, species: 'human', faction: 'jediOrder', role: 'jediMaster', ageApprox: 50, description: '' }], { source: 'ai' }).state;
  const id = Object.values(t.npcs.byId).find((n) => n.name === name)!.id;
  t = { ...t, npcs: { ...t.npcs, byId: { ...t.npcs.byId, [id]: { ...t.npcs.byId[id]!, canonId } } } };
  return [t, id];
};
/** A figure in play in a campaign on a date, with what the campaign recorded about it. */
const inPlay = (canonId: string, bby: number, extra: object = {}): Readonly<Record<string, number>> => {
  const n = CANON_BY_ID.get(canonId)!;
  return selectNpcLevels({ npcs: { byId: { x: { id: 'x', name: n.name, canonId, speciesId: n.speciesId, factionId: n.faction, role: 'other', birthDay: null, gen: null, ...extra } } }, clock: { now: { day: day(bby), second: 0 }, startDay: day(3668) }, meta: { campaignId: 'c' } } as unknown as GameState, 'x');
};

describe('a recorded change of training takes a canon figure off its line (D-506)', () => {
  it('the apprenticeships are on the roster and dated by the students\' spans', () => {
    for (const x of APPRENTICESHIPS) {
      expect(CANON_BY_ID.has(x.student), x.student).toBe(true);
      expect(CANON_BY_ID.has(x.master), x.master).toBe(true);
      if (x.toBby !== undefined) expect(x.fromBby).toBeGreaterThan(x.toBby);
    }
    expect(cutShortBy('lore:gnost-dural', 3668).map((x) => x.student)).toEqual(['lore:darth-karrid']);
    expect(cutShortBy('lore:gnost-dural', 3660).map((x) => x.student)).toEqual(['lore:darth-karrid']);
    expect(cutShortBy('lore:gnost-dural', 3650)).toEqual([]);
  });
  it('Karrid: Gnost-Dural killed in 3,668 changes her line from then', () => {
    const off = (bby: number): Record<string, number> => canonLevelsOffLine(KARRID, day(3668), day(bby));
    // Her Padawan years with him, Malgus's apprenticeship and her fall never happen: she grows as a Temple initiate.
    for (const bby of [3650, 3645]) {
      const on = canonFigureLevelsAt(KARRID, bby, day(bby));
      expect(off(bby)['forceControl']!, String(bby)).toBeLessThan(on['forceControl']! - 2);
      expect(off(bby)['niman']!).toBeLessThan(on['niman']! - 2);
    }
    expect(canonFigureLevelsAt(KARRID, 3640, day(3640))['forceLightning']).toBeGreaterThan(50);
    expect(off(3640)['forceLightning'] ?? 0).toBe(0);
    // Before that day nothing changes.
    expect(canonLevelsOffLine(KARRID, day(3668), day(3670))).toEqual(canonFigureLevelsAt(KARRID, 3670, day(3670)));
  });
  it('the engine records it when the master dies: on the student, or kept until the student comes into play', () => {
    let s = game(3668);
    const [s_gd, gd] = meet(s, 'Gnost-Dural', 'lore:gnost-dural');
    s = s_gd;
    const r = applyEvents(REGISTRY, s, [{ type: 'npcDied', npcRef: gd, cause: 'killed in the war' }], { source: 'engine' });
    expect(r.rejected).toEqual([]);
    s = r.state;
    expect(s.npcs.canonTraining?.['lore:darth-karrid']).toEqual({ day: day(3668), reason: 'masterKilled', recordedBy: 'engine' });
    // Karrid comes into play: the change goes with her.
    const [s_k, k] = meet(s, 'Kana Terrid', null as unknown as string);
    s = s_k;
    const linked = applyEvents(REGISTRY, s, [{ type: 'npcCanonLinked', npcRef: k, canonId: 'lore:darth-karrid' }], { source: 'engine' });
    expect(linked.rejected).toEqual([]);
    expect(linked.state.npcs.byId[k]!.canonTraining?.reason).toBe('masterKilled');
    // Her levels later in that campaign are the off-line ones.
    const later = inPlay('lore:darth-karrid', 3645, { canonTraining: { day: day(3668), reason: 'masterKilled', recordedBy: 'engine' } });
    expect(later).toEqual(canonLevelsOffLine(KARRID, day(3668), day(3645)));
    expect(inPlay('lore:darth-karrid', 3645)).toEqual(canonFigureLevelsAt(KARRID, 3645, day(3645)));
  });
  it('a student already in play changes at once; a death after the apprenticeship changes nothing', () => {
    let s = game(3668);
    const [s1, gd] = meet(s, 'Gnost-Dural', 'lore:gnost-dural');
    const [s2, k] = meet(s1, 'Kana Terrid', 'lore:darth-karrid');
    s = s2;
    s = applyEvents(REGISTRY, s, [{ type: 'npcDied', npcRef: gd, cause: 'killed' }], { source: 'engine' }).state;
    expect(s.npcs.byId[k]!.canonTraining?.reason).toBe('masterKilled');
    expect(s.npcs.byId[k]!.canonDiverged).toBeUndefined();
    const [l1, gd2] = meet(game(3650), 'Gnost-Dural', 'lore:gnost-dural');
    const late = applyEvents(REGISTRY, l1, [{ type: 'npcDied', npcRef: gd2, cause: 'killed' }], { source: 'engine' }).state;
    expect(late.npcs.canonTraining).toBeUndefined();
  });
  it('the narrator reports an apprenticeship broken or another order joined; only canon figures, the first change stands', () => {
    let s = game(3660);
    const [s1, k] = meet(s, 'Kana Terrid', 'lore:darth-karrid');
    const [s2, plain] = meet(s1, 'Nobody', null as unknown as string);
    s = s2;
    const r = applyEvents(REGISTRY, s, [{ type: 'npcTrainingChanged', npcRef: k, reason: 'joinedOrder' }, { type: 'npcTrainingChanged', npcRef: plain, reason: 'apprenticeshipBroken' }], { source: 'ai' });
    expect(r.rejected.length).toBe(1);
    expect(r.state.npcs.byId[k]!.canonTraining).toMatchObject({ reason: 'joinedOrder', recordedBy: 'narrator' });
    const again = applyEvents(REGISTRY, r.state, [{ type: 'npcTrainingChanged', npcRef: k, reason: 'apprenticeshipBroken' }], { source: 'ai' }).state;
    expect(again.npcs.byId[k]!.canonTraining?.reason).toBe('joinedOrder');
  });
});

describe('NPCs without a sheet: every trained skill stops by years trained (D-506)', () => {
  const gen = (archetype: string, path: 'jedi' | 'career') => ({ archetype, path, talents: {}, startAge: path === 'jedi' ? 4 : 17, warYears: 0, rank: path === 'jedi' ? 'knight' : 'career', seed: 'x', minionGrade: 1 });
  const today = day(3661);
  it('a Human is as before until 80', () => {
    for (const [a, p] of [['jediGuardian', 'jedi'], ['soldier', 'career']] as const)
      for (const age of [30, 55, 70, 79]) {
        const before = npcLevelsFor(gen(a, p), 'human', age, today, undefined, false, false, true);
        const now = npcLevelsFor(gen(a, p), 'human', age, today);
        for (const k of Object.keys(before)) if (k !== 'willpower') expect(now[k]!, `${a} ${age} ${k}`).toBeCloseTo(before[k]!, 6);
      }
  });
  it('a long-lived figure stops training when a Human of the same years would; the sheeted line does not', () => {
    const at = (age: number, sheeted: boolean): Readonly<Record<string, number>> => npcLevelsFor(gen('jediGuardian', 'jedi'), 'wookiee', age, today, undefined, false, false, sheeted);
    expect(at(300, false)['soresu']).toBeCloseTo(at(200, false)['soresu']!, 6);
    expect(at(200, true)['soresu']).toBeGreaterThan(at(200, false)['soresu']! + 5);
    expect(at(60, false)['soresu']).toBeGreaterThan(at(40, false)['soresu']!);
    const hutt = (age: number): Readonly<Record<string, number>> => npcLevelsFor(gen('soldier', 'career'), 'hutt', age, today);
    expect(hutt(700)['blaster']).toBeCloseTo(hutt(500)['blaster']!, 6);
  });
  it('Bowdaar and Suudaa Nemro come down; species caps still bound the body', () => {
    const peak = (id: string): number => {
      const n = CANON_BY_ID.get(`lore:${id}`)!;
      let most = 0;
      for (let bby = 3681; bby >= 3591; bby -= 10) if (bby <= n.birthBby - 18 && (n.deathBby === undefined || bby >= n.deathBby)) most = Math.max(most, ...Object.values(canonFigureLevelsAt(n, bby, day(bby))));
      return most;
    };
    expect(peak('bowdaar')).toBeLessThan(100);
    expect(peak('suudaa-nemro')).toBeLessThan(115);
    for (const n of CANON_NPCS.filter((x) => x.anchors.length === 0 && (x.speciesId === 'wookiee' || x.speciesId === 'hutt'))) {
      const lv = canonFigureLevelsAt(n, 3661, today);
      for (const stat of ['strength', 'agility', 'endurance'] as const) expect(lv[stat] ?? 0).toBeLessThanOrEqual(Math.max(...[20, 40, 80, 150, 300].map((b) => bodyCapAt(n.speciesId, stat, b))) + 1e-6);
    }
  });
});
