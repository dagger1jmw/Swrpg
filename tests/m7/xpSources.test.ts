// The M7 XP sources (Jared, D-427): the daily-life blocks, study of texts, teaching, learning from a stronger opponent,
// the natural Intelligence and Charisma, and the Sith required-training rows.
import { describe, expect, it } from 'vitest';
import { ORDER_REQUIREMENTS, REQUIREMENT_ROW } from '../../src/data/orderRequirements';
import { NATURAL_CHARISMA, NATURAL_INTELLIGENCE, STRONGER_DUEL } from '../../src/data/progression.config';
import { absDayFromDate, weekday } from '../../src/engine/calendar';
import { strongerDuelXp } from '../../src/engine/combatXp';
import { xpForLevel } from '../../src/engine/curve';
import { naturalLevel } from '../../src/engine/species';
import { resolveTraining } from '../../src/features/progression/training';
import { dailyLifeBlocks, orderRowKey } from '../../src/features/routines/scheduler';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const make = (age: number, rank: string, path: 'jedi' | 'sith' = 'jedi'): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'xp',
    start: { day: at(-3661), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(-3661) - Math.round(age * 368), path, archetype: path === 'jedi' ? 'jediGuardian' : 'sithWarrior', mainFormId: path === 'jedi' ? 'soresu' : 'djemSo', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(50), djemSo: xpForLevel(50), forceKnowledge: xpForLevel(10) },
    rank,
  });
const goTo = (s: GameState, name: string): GameState => applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name, kind: 'planet', region: name, description: '', moveHere: true }], { source: 'ai' }).state;

describe('daily-life blocks (outside the training budget)', () => {
  it('meditation every training day from Padawan on (D-431); the Knight studies on 3 days of 7; nothing for Initiates', () => {
    const ids = (s: GameState, day: number) => dailyLifeBlocks(s, s.ranks.rank === 'initiate' ? 'initiate' : s.ranks.rank === 'padawan' ? 'padawan' : 'knight', day, false).map((b) => b.activityId);
    expect(ids(make(9, 'initiate'), 0)).toEqual([]);
    expect(ids(make(15, 'padawan'), 0)).toEqual(['basicCentering']);
    const knight = make(30, 'knight');
    const week = Array.from({ length: 7 }, (_, i) => at(-3661) + i).filter((d) => ids(knight, d).includes('jediCode'));
    expect(week).toHaveLength(3);
    expect(week.every((d) => weekday(d) % 2 === 0)).toBe(true);
    // The accelerated path keeps the meditation block (using the Force) and drops the study.
    expect(dailyLifeBlocks(knight, 'knight', week[0]!, true).map((b) => b.activityId)).toEqual(['basicCentering']);
    expect(ids(make(30, 'lord', 'sith'), week[0]!)).toContain('forceLore');
  });
});

describe('the Sith required-training rows (Korriban, then apprenticeship)', () => {
  it('own rows mirroring the Jedi time structure, with the Korriban content', () => {
    expect(REQUIREMENT_ROW['acolyte']).toBe('acolyte');
    expect(ORDER_REQUIREMENTS['acolyte']!.reduce((a, b) => a + b.hours, 0)).toBe(ORDER_REQUIREMENTS['initiate']!.reduce((a, b) => a + b.hours, 0));
    expect(ORDER_REQUIREMENTS['apprentice']!.reduce((a, b) => a + b.hours, 0)).toBe(ORDER_REQUIREMENTS['padawan']!.reduce((a, b) => a + b.hours, 0));
    expect(ORDER_REQUIREMENTS['acolyte']!.map((b) => b.activityId)).toEqual(['shiiChoBasics', 'forceControlDrill', 'basicCentering', 'forceLore']);
    expect(orderRowKey(make(12, 'acolyte', 'sith'))).toBe('acolyte');
  });
});

describe('study of texts', () => {
  it('the full Archives only in the Temple; journals anywhere (possession trusted until items)', () => {
    const s = make(30, 'knight');
    const req = { activityId: 'forceLore', hours: 1, source: { kind: 'record' as const, id: 'record:jediArchivesTemple' } };
    const away = resolveTraining(goTo(s, 'Tatooine'), req);
    expect(away.ok).toBe(false);
    if (!away.ok) expect(away.reason).toMatch(/only at Jedi Temple or Tython/);
    expect(resolveTraining(goTo(s, 'Tython'), req).ok).toBe(true);
    expect(resolveTraining(goTo(s, 'Tatooine'), { ...req, source: { kind: 'record', id: 'journal:jediMaster' } }).ok).toBe(true);
  });
});

describe('teaching and mentoring', () => {
  it("a Knight of 25+ takes a Padawan; teaching opens; the form XP is only the instructor's share (D-450)", () => {
    let s = make(30, 'knight');
    expect(resolveTraining(s, { activityId: 'teachingPadawan', hours: 1 }).ok).toBe(false);
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Tarin Vos', species: 'human', faction: 'jediOrder', role: 'padawan', ageApprox: 14, description: '' }], { source: 'ai' }).state;
    const p = Object.keys(s.npcs.byId)[0]!;
    s = applyEvents(REGISTRY, s, [{ type: 'apprenticeTaken', npcRef: p }], { source: 'player' }).state;
    expect(s.ranks.apprenticeId).toBe(p);
    const r = resolveTraining(s, { activityId: 'teachingPadawan', hours: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.card.credited)).toEqual(expect.arrayContaining(['forceKnowledge', 'soresu']));
      // D-450: no review share on the same hours; the main form's XP is the instructor's share alone.
      const share = Number(r.card.notes.find((n) => n.startsWith("instructor's share"))!.match(/\+([\d.]+) XP/)![1]);
      expect(r.card.credited['soresu']).toBeCloseTo(share, 2);
    }
    const k = applyEvents(REGISTRY, s, [{ type: 'apprenticeKnighted' }], { source: 'player' }).state;
    expect([k.ranks.apprenticeId, k.ranks.padawansKnighted]).toEqual([null, 1]);
  });
  it('a Padawan cannot take one', () => {
    let s = make(20, 'padawan');
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Tarin Vos', species: 'human', faction: 'jediOrder', role: 'padawan', ageApprox: 14, description: '' }], { source: 'ai' }).state;
    const r = applyEvents(REGISTRY, s, [{ type: 'apprenticeTaken', npcRef: Object.keys(s.npcs.byId)[0]! }], { source: 'player' });
    expect(r.state.ranks.apprenticeId ?? null).toBeNull();
  });
});

describe('learning by dueling a stronger opponent', () => {
  it('a serious fight 10+ stronger gives a share of the form XP to the opponent\'s form; x2 on the accelerated path', () => {
    const credited = { soresu: 4, willpower: 1 };
    expect(strongerDuelXp('serious', 12, 'djemSo', credited, false)).toEqual({ form: 'djemSo', xp: 4 * STRONGER_DUEL.share });
    expect(strongerDuelXp('lethal', 12, 'djemSo', credited, true)!.xp).toBeCloseTo(4 * STRONGER_DUEL.share * 2);
    expect(strongerDuelXp('serious', 9, 'djemSo', credited, false)).toBeNull();
    expect(strongerDuelXp('spar', 20, 'djemSo', credited, false)).toBeNull();
    expect(strongerDuelXp('serious', 20, 'willpower', credited, false)).toBeNull();
  });
});

describe('natural Intelligence and Charisma', () => {
  it('a small baseline by age, as Willpower has', () => {
    expect(naturalLevel('intelligence', 'human', 30)).toBe(NATURAL_INTELLIGENCE.find(([a]) => a === 30)![1]);
    expect(naturalLevel('charisma', 'human', 60)).toBe(NATURAL_CHARISMA.find(([a]) => a === 60)![1]);
    expect(naturalLevel('tactics', 'human', 30)).toBe(0);
  });
});
