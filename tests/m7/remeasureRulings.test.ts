// The rulings on the 2026-11-22 calibration report (Jared; D-431 to D-435): the age-scaled Padawan hours and the daily
// meditation block, the Sith channelling block, the nexus extras, deeds past the fifth, Kel Dor, the instructor's share.
import { describe, expect, it } from 'vitest';
import { curriculumPhase } from '../../src/features/routines/curriculum';
import { selectHumanAge } from '../../src/features/character/selectors';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { forceBonusAt, leaningMatches } from '../../src/data/forceNexus';
import { ORDER_REQUIREMENTS, blockHours, orderHoursAt } from '../../src/data/orderRequirements';
import { DAILY_LIFE, FORCE_RICH_FACTOR, INSTRUCTOR_SHARE, MAJOR_NEXUS_FACTOR, NEXUS_SITE_FACTOR } from '../../src/data/progression.config';
import { COUNCIL_BYPASS } from '../../src/data/ranks.config';
import { SPECIES_BY_ID } from '../../src/data/species';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { humanEquivalentAge } from '../../src/engine/species';
import { creationSpecies } from '../../src/features/npcs/selectors';
import { resolveTraining, selectTrainingConditions } from '../../src/features/progression/training';
import { deedScore, standing } from '../../src/features/ranks/rules';
import { planDay } from '../../src/features/routines/scheduler';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const make = (age: number, rank: string, path: 'jedi' | 'sith' = 'jedi'): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'rm',
    start: { day: at(-3661), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(-3661) - Math.round(age * 368), path, archetype: path === 'jedi' ? 'jediGuardian' : 'sithWarrior', mainFormId: path === 'jedi' ? 'soresu' : 'djemSo', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(50), djemSo: xpForLevel(50) },
    rank,
  });
const goTo = (s: GameState, name: string, region: string): GameState =>
  applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name, kind: 'planet', region, description: '', moveHere: true }], { source: 'ai' }).state;
const ids = (s: GameState): string[] => planDay(s, s.routines.active, {}).items.map((b) => ('activityId' in b ? b.activityId : ''));

describe('the Padawan day (D-431)', () => {
  it('the fixed hours scale with age: 4 h to 16, 4.5 h at 17, 5 h from 18', () => {
    expect([12, 14, 16, 16.9, 17, 17.9, 18, 24].map((a) => orderHoursAt('padawan', a))).toEqual([4, 4, 4, 4, 4.5, 4.5, 5, 5]);
    expect(orderHoursAt('apprentice', 13)).toBe(orderHoursAt('padawan', 13));
    expect(blockHours(ORDER_REQUIREMENTS['padawan']![0]!, 12)).toBe(2);
  });
  it('the daily meditation block runs for Padawans and Knights (and Sith on the same rows), not Initiates', () => {
    expect(DAILY_LIFE.meditation.fromRows).toEqual(['padawan', 'knight']);
    // An Initiate's only centering is the saber curriculum's before the gate (D-459), never the daily-life block.
    const ini = make(9, 'initiate');
    const pre = curriculumPhase({ age: selectHumanAge(ini), level: (k) => selectLevelExact(ini, k) }) === 'preGate';
    const centering = planDay(ini, ini.routines.active, {}).items.filter((b) => 'activityId' in b && b.activityId === 'basicCentering');
    expect(centering.reduce((a, b) => a + ('hours' in b ? b.hours : 0), 0)).toBe(pre ? 0.5 : 0);
    expect(ids(make(14, 'padawan'))).toContain('basicCentering');
    expect(ids(make(30, 'knight'))).toContain('basicCentering');
    expect(ids(make(14, 'apprentice', 'sith'))).toContain('basicCentering');
  });
  it('the Sith apprentice row has the channelling (Force Output) block', () => {
    expect(ORDER_REQUIREMENTS['apprentice']!.map((b) => b.activityId)).toContain('outputDrill');
    expect(ids(make(14, 'apprentice', 'sith'))).toContain('outputDrill');
  });
});

describe('nexus extras (D-432)', () => {
  const f = { world: FORCE_RICH_FACTOR, major: MAJOR_NEXUS_FACTOR, site: NEXUS_SITE_FACTOR };
  it('a site x1.15, no stacking (the stronger wins), only on a matching or balanced leaning', () => {
    expect(forceBonusAt(['the Valley of the Dark Lords', 'Korriban'], -3661, 'dark', f)?.factor).toBe(NEXUS_SITE_FACTOR);
    expect(forceBonusAt(['Korriban'], -3661, 'dark', f)?.factor).toBe(MAJOR_NEXUS_FACTOR); // D-451: a major nexus planet
    expect(forceBonusAt(['the Valley of the Dark Lords', 'Korriban'], -3661, 'light', f)).toBeNull();
    // Dagobah is balanced, its cave dark (from about 700 BBY, D-445): a Jedi gets the planet's factor in the cave, a Sith the cave's.
    expect(forceBonusAt(['the cave on Dagobah', 'Dagobah'], 3, 'light', f)?.nexus.id).toBe('dagobah');
    expect(forceBonusAt(['the cave on Dagobah', 'Dagobah'], 3, 'dark', f)?.nexus.id).toBe('dagobah-cave');
    expect(forceBonusAt(['Tython'], -3661, 'dark', f)?.factor).toBe(MAJOR_NEXUS_FACTOR);
    expect(leaningMatches('balanced', 'balanced')).toBe(true);
    expect(leaningMatches('light', 'balanced')).toBe(false);
  });
  it('the conditions read the character: a Jedi gets the Temple site, a Sith nothing there', () => {
    expect(selectTrainingConditions(goTo(make(14, 'padawan'), 'Jedi Temple', 'Coruscant')).forceFactor).toBe(NEXUS_SITE_FACTOR);
    expect(selectTrainingConditions(goTo(make(14, 'apprentice', 'sith'), 'Jedi Temple', 'Coruscant')).forceFactor).toBe(1);
    expect(selectTrainingConditions(goTo(make(14, 'apprentice', 'sith'), 'Korriban', 'Outer Rim')).forceFactor).toBe(MAJOR_NEXUS_FACTOR);
  });
});

describe('deeds past the fifth (D-435)', () => {
  it('count with diminishing returns toward 130', () => {
    expect(deedScore(5)).toBe(100);
    expect(deedScore(6)).toBeGreaterThan(100);
    expect(deedScore(10) - deedScore(9)).toBeLessThan(deedScore(6) - deedScore(5));
    expect(deedScore(1000)).toBeLessThan(130.0001);
  });
  it('an average Padawan never reaches the bypass; a strong one with sustained deeds does', () => {
    expect(standing({ percentile: 0.26, deeds: 1000, relationships: 100 })).toBeLessThan(COUNCIL_BYPASS.standing);
    expect(standing({ percentile: 0.6, deeds: 5, relationships: 40 })).toBeLessThan(COUNCIL_BYPASS.standing);
    expect(standing({ percentile: 0.6, deeds: 13, relationships: 40 })).toBeGreaterThanOrEqual(COUNCIL_BYPASS.standing);
  });
});

describe('Kel Dor (D-434)', () => {
  it('Zym at about 120 fits the band and needs no full-life cap', () => {
    const zym = CANON_BY_ID.get('lore:zym')!;
    const sp = SPECIES_BY_ID.get(creationSpecies(zym.speciesId))!;
    expect(sp.lifespan).toBe(150);
    const h = humanEquivalentAge(sp, zym.birthBby! - 3653);
    expect(h).toBeGreaterThan(75);
    expect(h).toBeLessThan(100);
  });
});

describe("the instructor's share (D-433)", () => {
  it('teaching a Padawan adds a share of the student drill XP to the taught form, capped per hour', () => {
    let s = make(30, 'knight');
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Tarin Vos', species: 'human', faction: 'jediOrder', role: 'padawan', ageApprox: 14, description: '' }], { source: 'ai' }).state;
    const p = Object.keys(s.npcs.byId)[0]!;
    s = applyEvents(REGISTRY, s, [{ type: 'apprenticeTaken', npcRef: p }], { source: 'player' }).state;
    const r = resolveTraining(s, { activityId: 'teachingPadawan', hours: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const note = r.card.notes.find((n) => n.startsWith("instructor's share"));
    expect(note).toBeDefined();
    const got = Number(note!.match(/\+([\d.]+) XP/)![1]);
    expect(got).toBeGreaterThan(0);
    expect(got).toBeLessThanOrEqual(INSTRUCTOR_SHARE.maxPerHour * 2 + 1e-9);
  });
});
