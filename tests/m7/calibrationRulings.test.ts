// The 2026-11-22 calibration rulings (Jared; D-417 to D-422): the accelerated path, divergence from canon promotions,
// on-record whereabouts for the narrator, the hand-set lines, Rans, Nico Okarr and the warrior archetype.
import { describe, expect, it } from 'vitest';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { FORM_IDS } from '../../src/data/skills';
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
    expect(conditionedM(1, 'forceControl', { forceFactor: FORCE_RICH_FACTOR, accelerated: false })).toBeCloseTo(FORCE_RICH_FACTOR);
    expect(conditionedM(1, 'soresu', { forceFactor: FORCE_RICH_FACTOR, accelerated: false })).toBe(1);
    expect(conditionedM(M_CAP, 'forceControl', { forceFactor: FORCE_RICH_FACTOR, accelerated: false })).toBe(M_CAP);
    expect(conditionedM(M_CAP, 'soresu', { forceFactor: 1, accelerated: true })).toBeCloseTo(M_CAP * ACCELERATED_PATH.mult);
    expect(conditionedM(1, 'forceKnowledge', { forceFactor: FORCE_RICH_FACTOR, accelerated: true })).toBe(1);
    expect(conditionedM(1, 'intelligence', { forceFactor: 1, accelerated: true })).toBe(1);
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
  it('main-specialty stats as written; the Force comes out of the physical ones; the rest is the game\'s (D-494)', async () => {
    const { sheetToGame, sheetBody } = await import('../../src/data/canon/sheetScale');
    const malgus = canon('darth-malgus');
    const g = malgus.anchors[0]!.levels;
    expect(malgus.anchors[0]!.scale).toBe('game');
    for (const [k, v] of [['djemSo', 92], ['juyo', 80], ['forceControl', 88], ['forceOutput', 90], ['willpower', 94], ['telekinesis', 88], ['forceLightning', 85]] as const) expect(g[k], k).toBe(v);
    // Force Sense is every Force user's (D-495).
    expect([g['forceSense'], canon('satele-shan').anchors[0]!.levels['forceSense'], canon('darth-baras').anchors[0]!.levels['forceSense']]).toEqual([84, 92, 84]);
    // Knowledge and meditation as written where the focus holds them, else the measured curves.
    for (const [id, fk, med] of [['satele-shan', 90, 94], ['revan', 98, 90], ['vitiate', 134, 124], ['zym', 88, 90], ['ragate', 80, 70]] as const) expect([canon(id).anchors[0]!.levels['forceKnowledge'], canon(id).anchors[0]!.levels['meditation']], id).toEqual([fk, med]);
    expect([g['forceKnowledge']! < 30, g['meditation']! < 30]).toEqual([true, true]);
    // Strength 90 in combat, less the boost Force Control 88 and Force Body 86 give: 0.3 x 48 + 0.2 x 86 = 31.6.
    expect(g['strength']).toBeCloseTo(58.4, 1);
    expect(sheetBody({ archetype: 'soldier' }, {}, 100)).toBeCloseTo(80, 9);
    expect(sheetBody({ archetype: 'soldier' }, {}, 40)).toBe(40);
    // A smuggler's tongue goes by the one Charisma curve (D-495); a soldier's command is the focus.
    expect(sheetToGame({ ...canon('darth-malgus'), archetype: 'smuggler' }, { bby: 3653, levels: { charisma: 88 } })).toEqual({ charisma: 78.4 });
    expect(sheetToGame({ ...canon('darth-malgus'), archetype: 'soldier' }, { bby: 3653, levels: { tactics: 70 } })).toEqual({ tactics: 70 });
  });
  it('Charisma keeps the sheets\' order, and the great leaders stay high (D-495)', async () => {
    const { CHARISMA_SCALE } = await import('../../src/data/canon/sheetScale');
    for (let i = 1; i < CHARISMA_SCALE.length; i++) expect(CHARISMA_SCALE[i]![1]).toBeGreaterThan(CHARISMA_SCALE[i - 1]![1]);
    const { canonFigureLevelsAt } = await import('../../src/features/npcs/selectors');
    const all = CANON_NPCS.flatMap((n) => n.anchors.filter((a) => a.complete && a.authored?.['charisma'] !== undefined).map((a) => ({ id: n.canonId, sheet: a.authored!['charisma']!, game: canonFigureLevelsAt(n, a.bby, at(-a.bby))['charisma']! }))).sort((x, y) => x.sheet - y.sheet);
    expect(all.length).toBeGreaterThan(40);
    for (let i = 1; i < all.length; i++) if (all[i]!.sheet > all[i - 1]!.sheet) expect(all[i]!.game, `${all[i]!.id} ${all[i - 1]!.id}`).toBeGreaterThan(all[i - 1]!.game);
    const of = (id: string): number => all.find((x) => x.id === `lore:${id}`)!.game;
    expect([of('vitiate') > 110, of('revan') > 80, of('satele-shan') > 75, of('darth-marr') > 70]).toEqual([true, true, true, true]);
  });
  it('the floor is never above the sheet, and lifts what the sheet leaves unset; nothing is above its body (D-494, D-495)', async () => {
    const { canonFigureLevelsAt, canonBodyAge, canonProgressionLineAt } = await import('../../src/features/npcs/selectors');
    const { bodyCapAt } = await import('../../src/engine/species');
    const { speciesTableId } = await import('../../src/data/species');
    for (const n of CANON_NPCS) {
      for (const a of n.anchors.filter((x) => x.complete)) {
        const today = at(-a.bby);
        const now = canonFigureLevelsAt(n, a.bby, today);
        const bare = canonProgressionLineAt(n, a.bby, today);
        const sheet = a.authored ?? a.levels;
        const own0 = Math.max(0, ...FORM_IDS.filter((k) => k !== 'jarKai').map((k) => (sheet[k] !== undefined ? now[k]! : 0)));
        if (!n.events?.length)
          for (const [k, v] of Object.entries(bare)) {
            if (FORM_IDS.includes(k) && sheet[k] === undefined && own0 > 0) expect(now[k]!, `${n.canonId} ${k}`).toBeLessThan(own0); // held under its own forms
            else expect(now[k]!, `${n.canonId} ${k}`).toBeGreaterThanOrEqual(Math.min(v, sheet[k] ?? Infinity) - 1e-6);
            if (sheet[k] !== undefined) expect(now[k]!, `${n.canonId} ${k} over the sheet`).toBeLessThanOrEqual(sheet[k]! + 1e-6);
          }
        // The figure's own best form is its best.
        const own = Object.keys(a.levels).filter((k) => FORM_IDS.includes(k) && k !== 'jarKai');
        if (own.length) expect(Math.max(...own.map((k) => now[k]!)), n.canonId).toBe(Math.max(...FORM_IDS.filter((k) => k !== 'jarKai').map((k) => now[k] ?? 0)));
        if (!n.fixed) for (const k of ['strength', 'agility', 'endurance'] as const) expect(now[k]!, `${n.canonId} ${k}`).toBeLessThanOrEqual(Math.max(bare[k] ?? 0, bodyCapAt(speciesTableId(n.speciesId), k, canonBodyAge(n, a.bby, 0))) + 1e-6);
      }
    }
  });
  it('Force Knowledge, Meditation, Intelligence and Tactics come from the bands, never above the authored value', async () => {
    const { bandValue, standingBand } = await import('../../src/data/canon/sheetScale');
    const kaedan = canon('jaric-kaedan');
    expect(standingBand(kaedan, kaedan.anchors[0]!.bby)).toBe(60);
    // A Guardian Master: the measured Guardian curve read at his own age (D-465: estimated birth 3715 BBY, 47 at the 3668
    // BBY sheet: 22; D-461 read the Master's midpoint 50: 23; D-429 had 40, one band below 60).
    expect(kaedan.anchors[0]!.levels['forceKnowledge']).toBe(22);
    expect(bandValue('forceKnowledge', 30, 60, 'jediConsular')).toBe(30);
    expect(bandValue('forceKnowledge', 99, 60, 'jediConsular')).toBe(79);
    expect(bandValue('meditation', 99, 40, 'sithInquisitor')).toBe(17);
    // The D-429 rule stays for careers, Intelligence and Tactics, and the ancient band (100).
    expect(bandValue('tactics', 90, 80, 'soldier')).toBe(80);
    expect(bandValue('forceKnowledge', 120, 100, 'jediGuardian')).toBe(80);
  });
  it('the ruled sheets (Jared, D-494)', () => {
    const l = (id: string): Readonly<Record<string, number>> => canon(id).anchors[0]!.levels;
    expect([l('revan')['niman'], l('revan')['forceControl'], l('revan')['willpower']]).toEqual([94, 94, 106]);
    expect(Math.max(...FORM_IDS.map((f) => l('revan')[f] ?? 0))).toBe(94);
    expect(Math.max(...FORM_IDS.map((f) => l('vitiate')[f] ?? 0))).toBe(80);
    expect(l('satele-shan')['forceOutput']).toBe(90);
    expect([l('darth-baras')['soresu'], l('darth-baras')['shien'], l('darth-baras')['makashi']]).toEqual([84, 82, undefined]);
    expect([l('scourge')['soresu'], l('scourge')['juyo'], l('scourge')['ataru'], l('scourge')['djemSo']]).toEqual([88, 82, 78, undefined]);
    expect(l('kao-cen-darach')['jarKai']).toBe(86);
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
