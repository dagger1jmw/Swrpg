// The rulings on followups-2026-11-22 (Jared, 2026-11-23; D-451 to D-454): the major-nexus tier, the order seats by date,
// Luke's month on Dagobah (profiles), the Onimi exception to the Vong block, and the trials held back in code.
import { describe, expect, it } from 'vitest';
import { makeEstimator } from '../../src/ai/tokenRatio';
import type { CanonNpc } from '../../src/data/canon/types';
import { FORCE_NEXUSES, forceBonusAt } from '../../src/data/forceNexus';
import { planetByName } from '../../src/data/galaxyMap';
import { homeSeatAt, ORDER_SEATS, SITH_SEATS } from '../../src/data/orderSeats';
import { FORCE_RICH_FACTOR, MAJOR_NEXUS_FACTOR, NEXUS_SITE_FACTOR } from '../../src/data/progression.config';
import { KNIGHT_TRIAL_IDS } from '../../src/data/ranks.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { characterForceTraits } from '../../src/engine/combatForce';
import { xpForLevel } from '../../src/engine/curve';
import { isForceXpSkill, isOutsideForce } from '../../src/engine/speed';
import { canonProgressionLineAt, npcLevelsFor } from '../../src/features/npcs/selectors';
import type { NpcGen } from '../../src/features/npcs/npcs';
import { selectTrainingConditions } from '../../src/features/progression/training';
import { trialBlock, trialsHeldUntil } from '../../src/features/ranks/rules';
import { selectTrialBlock, selectTrialsHeldUntil } from '../../src/features/ranks/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { stateBlock } from '../../src/turn/context';
import { archetypeSeat, AVERAGE, SITH_SEAT_YEAR } from '../lifetime/profiles';
import { profileState } from '../support/lifetime';

const F = { world: FORCE_RICH_FACTOR, major: MAJOR_NEXUS_FACTOR, site: NEXUS_SITE_FACTOR };
const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const make = (year: number, path: 'jedi' | 'sith' = 'jedi', rank = path === 'jedi' ? 'padawan' : 'apprentice'): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'seat',
    start: { day: at(year), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(year) - 30 * 368, path, archetype: path === 'jedi' ? 'jediGuardian' : 'sithWarrior', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(50), forceControl: xpForLevel(40) },
    rank,
  });
const goTo = (s: GameState, name: string, region: string): GameState =>
  applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name, kind: 'planet', region, description: '', moveHere: true }], { source: 'ai' }).state;
const here = (s: GameState): { name: string; parent: string | null } => {
  const l = s.locations.byId[s.locations.currentId!]!;
  return { name: l.name, parent: l.parentId ? s.locations.byId[l.parentId]!.name : null };
};

describe('the major-nexus tier (D-451)', () => {
  it('a Jedi on Tython gets x1.15, and the leaning check still applies (Korriban gives a Jedi nothing)', () => {
    expect(selectTrainingConditions(goTo(make(-3650), 'Tython', 'Deep Core')).forceFactor).toBe(MAJOR_NEXUS_FACTOR);
    expect(MAJOR_NEXUS_FACTOR).toBe(1.15);
    expect(selectTrainingConditions(goTo(make(-3650), 'Korriban', 'Horuset system')).forceFactor).toBe(1);
    expect(selectTrainingConditions(goTo(make(-3650, 'sith'), 'Korriban', 'Horuset system')).forceFactor).toBe(MAJOR_NEXUS_FACTOR);
    expect(selectTrainingConditions(goTo(make(-3650, 'sith'), 'Dromund Kaas', 'Dromund system')).forceFactor).toBe(MAJOR_NEXUS_FACTOR);
  });
  it('the three major planets; ordinary nexus and Force-rich worlds stay x1.10; sites x1.15; the stronger wins, no stacking', () => {
    expect(FORCE_NEXUSES.filter((n) => n.major).map((n) => n.id).sort()).toEqual(['dromund-kaas', 'korriban', 'tython']);
    expect(forceBonusAt(['Vjun'], 0, 'dark', F)?.factor).toBe(FORCE_RICH_FACTOR);
    expect(forceBonusAt(['Dagobah'], 3, 'light', F)?.factor).toBe(FORCE_RICH_FACTOR);
    // The Valley and the Dark Temple equal their planets.
    expect(forceBonusAt(['the Valley of the Dark Lords', 'Korriban'], -3661, 'dark', F)?.factor).toBe(1.15);
    expect(forceBonusAt(['the Dark Temple', 'Dromund Kaas'], -3661, 'dark', F)?.factor).toBe(1.15);
    expect(FORCE_NEXUSES.find((n) => n.id === 'valley-of-the-dark-lords')?.strongerThanPlanet).toBeUndefined();
  });
  it('Mortis is story-only: no multiplier and no map access', () => {
    const mortis = FORCE_NEXUSES.find((n) => n.id === 'mortis')!;
    expect(mortis.storyOnly).toBe(true);
    for (const leaning of ['light', 'dark', 'balanced'] as const) expect(forceBonusAt(['Mortis'], -20, leaning, F)).toBeNull();
    expect(planetByName('Mortis')).toBeUndefined();
  });
});

describe('the order seats by date (D-451)', () => {
  it('Jedi: the Coruscant Temple, its ruins, Tython from 3,650, Coruscant again, none in the Purge, the Praxeum, Ossus', () => {
    expect(homeSeatAt('jedi', 'padawan', -3661)).toEqual({ name: 'the Jedi Temple', planet: 'Coruscant' });
    expect(homeSeatAt('jedi', 'knight', -3651)).toEqual({ name: 'Tython', planet: 'Tython' });
    expect(homeSeatAt('jedi', 'knight', -3647)).toEqual({ name: 'the Jedi Temple on Tython', planet: 'Tython' });
    expect(homeSeatAt('jedi', 'initiate', -1032)?.planet).toBe('Coruscant');
    expect(homeSeatAt('jedi', 'knight', -10)).toBeNull();
    expect(homeSeatAt('jedi', 'padawan', 12)?.planet).toBe('Yavin 4');
    expect(homeSeatAt('jedi', 'padawan', 40)?.planet).toBe('Ossus');
    expect(ORDER_SEATS.filter((s) => s.seat !== null).every((s) => s.home)).toBe(true);
  });
  it('Sith: the Korriban academy for acolytes and Dromund Kaas for Lords while the Empire holds them; none while abandoned', () => {
    expect(homeSeatAt('sith', 'initiate', -3661)).toEqual({ name: 'the Sith Academy', planet: 'Korriban' });
    expect(homeSeatAt('sith', 'padawan', -3661)).toEqual({ name: 'Kaas City', planet: 'Dromund Kaas' });
    expect(homeSeatAt('sith', 'knight', -3661)?.planet).toBe('Dromund Kaas');
    expect(homeSeatAt('sith', 'initiate', -3700)).toBeNull(); // Korriban not Imperial until 3,681
    expect(homeSeatAt('sith', 'knight', -3700)?.planet).toBe('Dromund Kaas');
    expect(homeSeatAt('sith', 'initiate', -3636)).toBeNull(); // held by the Republic, then bombarded
    expect(homeSeatAt('sith', 'initiate', -1032)).toBeNull();
    expect(homeSeatAt('sith', 'initiate', -1005)?.planet).toBe('Korriban'); // the Brotherhood of Darkness
    expect(homeSeatAt('sith', 'knight', -500)).toBeNull();
    for (const r of SITH_SEATS) expect(r.fromYear).toBeLessThan(r.toYear);
  });
  it('the harness puts a life at its seat as a building on its world: the Average in the Temple, a Sith acolyte at the academy', () => {
    expect(here(profileState(AVERAGE))).toEqual({ name: 'the Jedi Temple', parent: 'Coruscant' });
    const sith = profileState({ ...AVERAGE, archetype: 'sithWarrior', path: 'sith', seed: 'sith', ...archetypeSeat('sith') });
    expect(here(sith)).toEqual({ name: 'the Sith Academy', parent: 'Korriban' });
    expect(selectTrainingConditions(sith).forceFactor).toBe(MAJOR_NEXUS_FACTOR);
    expect(SITH_SEAT_YEAR).toBe(-3671);
  });
});

describe('the Onimi exception to the Yuuzhan Vong block (D-453)', () => {
  const onimi = {
    canonId: 'test:onimi',
    name: 'Onimi',
    speciesId: 'yuuzhanVong',
    faction: 'yuuzhanVong',
    archetype: 'sithInquisitor',
    birthBby: -10,
    birthSource: 'estimate',
    ranks: [],
    anchors: [],
  } as unknown as CanonNpc;
  it('the species block stays; the flagged figure is inside the Force', () => {
    expect(isOutsideForce('yuuzhanVong')).toBe(true);
    expect(isOutsideForce('yuuzhanVong', true)).toBe(false);
    expect(characterForceTraits('yuuzhanVong')).toContain('forceInvisible');
    expect(characterForceTraits('yuuzhanVong', true)).not.toContain('forceInvisible');
  });
  it('a flagged figure gains Force skills; the same figure without the flag gets none', () => {
    const force = (c: CanonNpc) => Object.entries(canonProgressionLineAt(c, -25, at(25))).filter(([k, v]) => isForceXpSkill(k) && v > 0).length;
    expect(force({ ...onimi, insideForce: true })).toBeGreaterThan(0);
    expect(force(onimi)).toBe(0);
  });
  it('root fix: a story Vong built on the human body still reads its own species for the block', () => {
    const gen: NpcGen = { archetype: 'sithInquisitor', path: 'sith', talents: {}, startAge: 8, warYears: 0, rank: 'lord', seed: 'vong', minionGrade: 1 };
    expect(Object.keys(npcLevelsFor(gen, 'yuuzhanVong', 40, at(25))).filter(isForceXpSkill)).toEqual([]);
    expect(Object.keys(npcLevelsFor(gen, 'human', 40, at(25))).filter(isForceXpSkill).length).toBeGreaterThan(0);
  });
});

describe('the trials held back, enforced (D-454)', () => {
  const d = (day: number) => ({ day });
  it('from the 3rd discovery each adds a year from the later of its day and the running hold; it lifts on its own', () => {
    expect(trialsHeldUntil([d(100), d(200)])).toBeNull();
    expect(trialsHeldUntil([d(100), d(200), d(300)])).toBe(300 + 368);
    expect(trialsHeldUntil([d(100), d(200), d(300), d(400)])).toBe(300 + 368 + 368);
    expect(trialsHeldUntil([d(100), d(200), d(300), d(1000)])).toBe(1000 + 368);
    const c = { rank: 'padawan', age: 30, padawanYears: 12, masterApproval: true, unmetKnight: [], unmetInitiate: [], corps: false };
    const rec = { passed: false, fails: 0, lastDay: null };
    expect(trialBlock(KNIGHT_TRIAL_IDS[0]!, { ...c, heldUntil: 668 }, rec, 500)).toMatch(/held back after covert study was discovered \(168 days left\)/);
    expect(trialBlock(KNIGHT_TRIAL_IDS[0]!, { ...c, heldUntil: 668 }, rec, 668)).toBeNull();
  });
  it('through the game: the 3rd discovery blocks the Knight Trials, the narrator is told, and a year later they reopen', () => {
    let s = make(-3661, 'jedi', 'padawan');
    const notes: string[] = [];
    for (const id of ['morichro', 'deadlySight', 'morichro']) {
      const r = applyEvents(REGISTRY, s, [{ type: 'covertLearningDiscovered', abilityId: id }], { source: 'engine' });
      notes.push(r.applied.flatMap((a) => a.notes).join('\n'));
      s = r.state;
    }
    expect(notes[1]).not.toMatch(/held back until/);
    expect(notes[2]).toMatch(/consequence to narrate now: the trials held back/);
    expect(notes[2]).toMatch(/the Knight Trials are held back until/);
    expect(selectTrialsHeldUntil(s)).toBe(s.clock.now.day + 368);
    expect(selectTrialBlock(s, KNIGHT_TRIAL_IDS[0]!)).toMatch(/held back/);
    expect(stateBlock(s, makeEstimator(4), undefined, [], '').text).toMatch(/the Knight Trials are held back until .* \(enforced\)/);
    const later = { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: s.clock.now.day + 368 } } };
    expect(selectTrialsHeldUntil(later)).toBeNull();
    expect(selectTrialBlock(later, KNIGHT_TRIAL_IDS[0]!) ?? '').not.toMatch(/held back/);
  });
});
