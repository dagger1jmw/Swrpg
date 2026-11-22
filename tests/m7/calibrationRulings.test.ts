// The 2026-11-22 calibration rulings (Jared; D-417 to D-422): the accelerated path, divergence from canon promotions,
// on-record whereabouts for the narrator, the hand-set lines, Rans, Nico Okarr and the warrior archetype.
import { describe, expect, it } from 'vitest';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { onRecordAt, onRecordFor } from '../../src/data/canonPlacements';
import { RANK_TYPICAL_AGE } from '../../src/data/canon/rankAges';
import { ACCELERATED_PATH, FORCE_RICH_FACTOR, M_CAP } from '../../src/data/progression.config';
import { LOADOUT_BY_ARCHETYPE } from '../../src/data/weapons';
import { absDayFromDate } from '../../src/engine/calendar';
import { canonOffBoard, canonRankAt } from '../../src/engine/canonRoster';
import { xpForLevel } from '../../src/engine/curve';
import { rollNpcInputs } from '../../src/engine/npcGen';
import { conditionedCap, conditionedM } from '../../src/engine/speed';
import { FORCE_NEXUSES, forceRichWorldAt, nexusSitesAt } from '../../src/data/forceNexus';
import { selectNpcLevels } from '../../src/features/npcs/selectors';
import { selectTrainingConditions } from '../../src/features/progression/training';
import { planDay } from '../../src/features/routines/scheduler';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { stateBlock } from '../../src/turn/context';

const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const fresh = (year: number, extra: { trainingPath?: 'accelerated'; rank?: string } = {}): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: at(year), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(year) - 8 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4, ...(extra.trainingPath ? { trainingPath: extra.trainingPath } : {}) },
    startingXp: { shiiCho: xpForLevel(15) },
    rank: extra.rank ?? 'initiate',
  });
const goTo = (s: GameState, name: string, region: string): GameState =>
  applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name, kind: 'planet', region, description: '', moveHere: true }], { source: 'ai' }).state;
const est = makeEstimator(4);
const canon = (id: string) => CANON_BY_ID.get(`lore:${id}`)!;

describe('the accelerated path and Force-rich places (D-418)', () => {
  it('a Force-rich place speeds a Force skill inside the M cap; the accelerated path goes past it for Force skills and forms only', () => {
    expect(conditionedM(1, 'forceControl', { forceRich: true, accelerated: false })).toBeCloseTo(FORCE_RICH_FACTOR);
    expect(conditionedM(1, 'soresu', { forceRich: true, accelerated: false })).toBe(1);
    expect(conditionedM(M_CAP, 'forceControl', { forceRich: true, accelerated: false })).toBe(M_CAP);
    expect(conditionedM(M_CAP, 'soresu', { forceRich: false, accelerated: true })).toBeCloseTo(M_CAP * ACCELERATED_PATH.mult);
    expect(conditionedM(1, 'forceKnowledge', { forceRich: true, accelerated: true })).toBe(1);
    expect(conditionedM(1, 'intelligence', { forceRich: false, accelerated: true })).toBe(1);
  });
  it('only the accelerated path raises the 4.0x clamp, and only for its skills', () => {
    expect(conditionedCap(100, 'djemSo', true)).toBeCloseTo(100 * ACCELERATED_PATH.capMult);
    expect(conditionedCap(100, 'meditation', true)).toBe(100);
    expect(conditionedCap(100, 'djemSo', false)).toBe(100);
  });
  it('D-425: Force-rich worlds and nexus planets count; sites are data only (the Temple, the Valley, the cave)', () => {
    expect(forceRichWorldAt(['Dagobah'])?.nexus).toBe(false);
    expect(forceRichWorldAt(['Korriban'])?.leaning).toBe('dark');
    expect(forceRichWorldAt(['Coruscant'])).toBeNull();
    expect(forceRichWorldAt(['Jedi Temple', 'Coruscant'])).toBeNull();
    expect(forceRichWorldAt(['Byss'], -3661)).toBeNull();
    expect(nexusSitesAt(['Valley of the Dark Lords', 'Korriban']).map((n) => n.id)).toEqual(['valley-of-the-dark-lords']);
    for (const n of FORCE_NEXUSES) expect(n.source, n.id).toBeTruthy();
    expect(selectTrainingConditions(goTo(fresh(-3661), 'Tython', 'Deep Core')).forceRich).toBe(true);
  });
  it('the accelerated path drops the Order knowledge block from an Initiate day (Force Lore), and the event switches it back', () => {
    const blocks = (s: GameState) => planDay(s, s.routines.active, {}).items.map((b) => ('activityId' in b ? b.activityId : ''));
    expect(blocks(fresh(-3661))).toContain('forceLore');
    const acc = fresh(-3661, { trainingPath: 'accelerated' });
    expect(blocks(acc)).not.toContain('forceLore');
    const back = applyEvents(REGISTRY, acc, [{ type: 'trainingPathSet', path: 'standard' }], { source: 'player' }).state;
    expect(back.character.trainingPath).toBeUndefined();
    expect(blocks(back)).toContain('forceLore');
  });
});

describe('canon promotions after the start, unless the campaign diverged (D-419)', () => {
  const linked = (startYear: number, nowYear: number): { s: GameState; id: string } => {
    let s = fresh(startYear);
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Satele Shan', species: 'human', faction: 'jediOrder', role: 'jediKnight', ageApprox: 20, description: '' }], { source: 'ai' }).state;
    const id = Object.keys(s.npcs.byId)[0]!;
    s = applyEvents(REGISTRY, s, [{ type: 'npcCanonLinked', npcRef: id, canonId: 'lore:satele-shan' }], { source: 'engine' }).state;
    return { s: { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: at(nowYear) } } }, id };
  };
  // The closed form's phases: a Padawan held back keeps the Padawan pace (the master's sessions) instead of the Knight's.
  it('a capture stops later canon promotions: a Padawan captured before her knighting keeps the Padawan course, not the canon one', () => {
    const { s, id } = linked(-3685, -3665);
    const free = selectNpcLevels(s, id);
    const caught = applyEvents(REGISTRY, { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: at(-3684) } } }, [{ type: 'npcCanonDiverged', npcRef: id, reason: 'captured' }], { source: 'engine' }).state;
    expect(caught.npcs.byId[id]!.canonDiverged?.reason).toBe('captured');
    const later = selectNpcLevels({ ...caught, clock: s.clock }, id);
    const best = (l: Readonly<Record<string, number>>) => Math.max(...['shiiCho', 'soresu', 'ataru', 'djemSo', 'makashi', 'shien', 'juyo', 'niman'].map((k) => l[k] ?? 0));
    expect(Math.abs(best(later) - best(free))).toBeGreaterThan(0.5);
    // Without a divergence the same figure follows the canon course exactly.
    expect(best(selectNpcLevels(s, id))).toBe(best(free));
  });
  it('a death records the divergence; the first divergence stands; a story NPC cannot diverge', () => {
    const { s, id } = linked(-3661, -3661);
    const dead = applyEvents(REGISTRY, s, [{ type: 'npcDied', npcRef: id, cause: 'test' }], { source: 'engine' }).state;
    expect(dead.npcs.byId[id]!.canonDiverged?.reason).toBe('killed');
    const again = applyEvents(REGISTRY, dead, [{ type: 'npcCanonDiverged', npcRef: id, reason: 'turned' }], { source: 'ai' }).state;
    expect(again.npcs.byId[id]!.canonDiverged?.reason).toBe('killed');
    let t = applyEvents(REGISTRY, fresh(-3661), [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Dorn Vasko', species: 'human', faction: 'republic', role: 'soldier', ageApprox: 30, description: '' }], { source: 'ai' }).state;
    const story = Object.keys(t.npcs.byId)[0]!;
    t = applyEvents(REGISTRY, t, [{ type: 'npcCanonDiverged', npcRef: story, reason: 'turned' }], { source: 'ai' }).state;
    expect(t.npcs.byId[story]!.canonDiverged).toBeUndefined();
  });
});

describe('on-record whereabouts for the narrator (D-420)', () => {
  it('at the current place: location spans and the year\'s status facts naming it (Satele recalled to Coruscant in 3,661)', () => {
    expect(onRecordAt(['Coruscant'], 3661).map((r) => r.name)).toContain('Satele Shan');
    expect(onRecordAt(['Korriban'], 3661).map((r) => r.name)).toEqual(expect.arrayContaining(['Overseer Ragate', 'Overseer Tremel', 'Spindrall']));
    expect(stateBlock(goTo(fresh(-3661), 'Coruscant', 'Core Worlds'), est).text).toMatch(/Canon figures here .*Satele Shan: Jedi; recalled to Coruscant/);
  });
  it('a figure named in the player\'s words gets its on-record whereabouts, wherever the scene is; no full list', () => {
    const s = goTo(fresh(-3653), 'Tatooine', 'Outer Rim');
    expect(stateBlock(s, est).text).not.toMatch(/Named canon figures/);
    const named = stateBlock(s, est, undefined, [], 'I ask about Kellian Jarro').text;
    expect(named).toMatch(/Named canon figures on record this year .*Kellian Jarro: Coruscant, fighting Mandalorians/);
    expect(onRecordFor('lore:kellian-jarro', 3653).length).toBeGreaterThan(0);
  });
});

describe('the data rulings (D-417, D-421, D-422)', () => {
  it('rank ages: the Jedi Knight at 25, the Sith ladder mirrors it (Lord 25, Darth 40)', () => {
    expect([RANK_TYPICAL_AGE['Jedi Knight'], RANK_TYPICAL_AGE['Jedi Master'], RANK_TYPICAL_AGE['Sith Lord'], RANK_TYPICAL_AGE['Darth']]).toEqual([25, 40, 25, 40]);
  });
  it('Rans: no Supreme Commander span before the Sacking; Stantorrs in 3,643; Rans after him to Ilum; born 3,703', () => {
    expect(canonRankAt(canon('rans'), 3661)?.title).toBe('officer');
    expect(canonRankAt(canon('rans'), 3653)?.title).toBe('Supreme Commander');
    expect(canonRankAt(canon('stantorrs'), 3643)?.title).toBe('Supreme Commander');
    expect(canonRankAt(canon('rans'), 3641)?.title).toBe('Supreme Commander');
    expect(canon('rans').birthBby).toBe(3703);
  });
  it('Nico Okarr is on the board in 3,681 (captured on Korriban, the escape) and off from 3,680', () => {
    expect(canonOffBoard(canon('nico-okarr'), 3681)).toBeNull();
    expect(canonOffBoard(canon('nico-okarr'), 3680)).toBe('unavailable');
    expect(canon('nico-okarr').archetype).toBe('smuggler');
  });
  it('hand-set lines: Karagga (a Hutt crime lord), Oteg (Yoda\'s species, among the Council Masters), Ragate (in the roster)', () => {
    const k = canon('karagga-the-unyielding').anchors[0]!.authored!;
    expect(k['strength']!).toBeGreaterThan(100);
    expect(k['agility']!).toBeLessThan(20);
    expect(canon('oteg').speciesId).toBe('yodasSpecies');
    expect(canon('ragate').facts?.sex).toBe('female');
  });
  it('the warrior archetype: melee, NPC only; Khem Val, Broonmark and Mandalore the Lesser; Talz and Dashade fighters', () => {
    expect(ARCHETYPE_BY_ID.get('warrior')?.main).toBe('melee');
    expect(LOADOUT_BY_ARCHETYPE['warrior']?.weapon).toBe('melee');
    for (const id of ['khem-val', 'broonmark', 'mandalore-the-lesser']) expect(canon(id).archetype, id).toBe('warrior');
    expect(rollNpcInputs({ campaignSeed: 's', npcId: 'npc:x', role: 'bountyHunter', faction: 'independent', age: 30, year: -3661, species: 'talz' }).archetype).toBe('warrior');
  });
});

describe('the stat scale (D-423, revised by D-429)', () => {
  it('per-group factors (capped at 1.0), the authored numbers kept, forms and abilities by kind', async () => {
    const { SHEET_TO_GAME_BY_GROUP, sheetFactor } = await import('../../src/data/canon/sheetScale');
    for (const g of Object.values(SHEET_TO_GAME_BY_GROUP)) for (const f of Object.values(g)) expect(f).toBeLessThanOrEqual(1);
    const kaedan = canon('jaric-kaedan').anchors[0]!;
    expect(kaedan.scale).toBe('game');
    expect(kaedan.levels['juyo']).toBeCloseTo(kaedan.authored!['juyo']! * sheetFactor('juyo', 'jedi'), 1);
    expect(sheetFactor('juyo', 'sith')).toBe(SHEET_TO_GAME_BY_GROUP.sith['$forms']);
    expect(sheetFactor('forceChoke', 'sith')).toBe(SHEET_TO_GAME_BY_GROUP.sith['$abilities']);
  });
  it('Force Knowledge, Meditation, Intelligence and Tactics come from the bands, never above the authored value', async () => {
    const { bandValue, standingBand } = await import('../../src/data/canon/sheetScale');
    const kaedan = canon('jaric-kaedan');
    expect(standingBand(kaedan, kaedan.anchors[0]!.bby)).toBe(60);
    // A Guardian Master: one band below the Master's 60 for Force Knowledge.
    expect(kaedan.anchors[0]!.levels['forceKnowledge']).toBe(40);
    expect(bandValue('forceKnowledge', 30, 60, 'jediConsular')).toBe(30);
    expect(bandValue('tactics', 90, 80, 'soldier')).toBe(80);
  });
  it('the apex and focus figures carry hand-set game-scale lines', async () => {
    const { GAME_SCALE_LINES } = await import('../../src/data/canon/sheetScale');
    for (const id of Object.keys(GAME_SCALE_LINES)) expect(CANON_BY_ID.has(id), id).toBe(true);
    expect(canon('vitiate').anchors[0]!.levels['forceOutput']).toBe(125);
    expect(canon('zym').anchors[0]!.levels['forceKnowledge']).toBe(110);
  });
  it('the Sith no longer default to Soresu: Warriors Djem So and Shien, Inquisitors Makashi and Niman', async () => {
    const { defaultFormPlan } = await import('../../src/features/character/creation');
    expect(defaultFormPlan('sithWarrior')).toEqual({ djemSo: 2, shien: 1 });
    expect(defaultFormPlan('sithInquisitor')).toEqual({ makashi: 2, niman: 1 });
    expect(defaultFormPlan('jediGuardian')).toEqual({ soresu: 2, ataru: 1 });
    const line = (await import('../../src/features/npcs/selectors')).canonProgressionLineAt(canon('darth-vindican'), 3681, at(-3681));
    expect((line['djemSo'] ?? 0)).toBeGreaterThan(line['soresu'] ?? 0);
  });
});

describe('long lives in the NPC closed form (D-429)', () => {
  it('diminishing returns above the band top, toward the apex', async () => {
    const { softCapLevel } = await import('../../src/features/character/creation');
    expect(softCapLevel(90)).toBe(90);
    expect(softCapLevel(110)).toBe(110);
    expect(softCapLevel(150)).toBeGreaterThan(125);
    expect(softCapLevel(500)).toBeLessThan(135);
  });
  it('Zym (a Kel Dor of 120) no longer overshoots: the generator line stays under the apex', async () => {
    const { canonProgressionLineAt } = await import('../../src/features/npcs/selectors');
    const line = canonProgressionLineAt(canon('zym'), 3660, at(-3660));
    for (const v of Object.values(line)) expect(v).toBeLessThan(135);
  });
});
