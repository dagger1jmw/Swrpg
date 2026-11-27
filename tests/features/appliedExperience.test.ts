// M5 step 5: E, CI, the drill ceiling and bank in the progression feature (progression-numbers §7-8, §19; combat-xp §3;
// D-45; D-143 A), starting E at creation (character-creation §2) and the v3 -> v4 migration.
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { FORM_IDS } from '../../src/data/skills';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { computeCreation } from '../../src/features/character/creation';
import { migrateProgressionV3 } from '../../src/features/progression/progression';
import { resolveTraining, selectDrillCeiling, selectE } from '../../src/features/progression/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const fresh = (rank: string, startingXp: Record<string, number>, startingE: Record<string, { E: number; eSpar: number }> = {}): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: START, second: 7 * 3600 },
    character: { name: 'Kael', birthDay: START - 16 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp,
    startingE,
    rank,
  });

describe('the drill ceiling in training (progression-numbers §7)', () => {
  it('above 25 + E a form session applies 25% and banks 75%; the card and the save agree', () => {
    const s = fresh('padawan', { soresu: xpForLevel(35) });
    expect(selectDrillCeiling(s, 'soresu')).toBe(25);
    const plan = resolveTraining(s, { activityId: 'soresuBasics', hours: 2 });
    if (!plan.ok) throw new Error(plan.reason);
    const ev = plan.events.find((e) => e.type === 'activityResolved')!;
    const credited = (ev['credited'] as Record<string, number>)['soresu']!;
    const banked = (ev['banked'] as Record<string, number>)['soresu']!;
    expect(banked / (credited + banked)).toBeCloseTo(0.75, 6);
    const after = applyEvents(REGISTRY, s, plan.events, { source: 'engine' }).state;
    expect(after.progression.bank['soresu']).toBeCloseTo(banked, 9);
    expect(after.progression.skills['soresu']!.xp - s.progression.skills['soresu']!.xp).toBeCloseTo(credited, 9);
  });
  it('a taught Order class counts as sparring for E (D-143 A); sparring E stops at 15', () => {
    // Past the saber gate (D-459, D-460): basic Force Control and study.
    const gate = { forceControl: xpForLevel(20), forceKnowledge: xpForLevel(10) };
    let s = fresh('initiate', { shiiCho: xpForLevel(10), ...gate });
    for (let i = 0; i < 200; i++) {
      const plan = resolveTraining(s, { activityId: 'shiiChoBasics', hours: 1, source: { kind: 'instructor' } });
      if (!plan.ok) throw new Error(plan.reason);
      s = applyEvents(REGISTRY, s, plan.events, { source: 'engine' }).state;
      s = advanceTime(REGISTRY, s, { seconds: 86_400, reason: 'next day', source: 'turnDraft' }).state;
    }
    expect(selectE(s, 'shiiCho')).toBeCloseTo(15, 3);
    const solo = fresh('initiate', { shiiCho: xpForLevel(20), ...gate });
    const plan = resolveTraining(solo, { activityId: 'shiiChoBasics', hours: 1, source: { kind: 'solo' } });
    if (!plan.ok) throw new Error(plan.reason);
    expect(plan.events.find((e) => e.type === 'activityResolved')!['sparring']).toBeUndefined();
  });
});

describe('fights: E, CI and the bank release (combat-xp §3, D-45)', () => {
  const fight = (stakes: string, gap = 0) => ({ type: 'fightResolved', stakes, outcome: 'won', exchanges: Array.from({ length: 30 }, () => ({ skillId: 'soresu', gap })), forceUses: [{ abilityId: 'forcePush', gap }], opponentGap: gap });
  it('a skirmish adds E +3 and CI +0.5, and opens a 60-day release that pays out the bank day by day', () => {
    let s = fresh('knight', { soresu: xpForLevel(30), forcePush: xpForLevel(30) });
    s = { ...s, progression: { ...s.progression, bank: { soresu: 400 } } };
    s = applyEvents(REGISTRY, s, [fight('skirmish', 5)], { source: 'engine' }).state;
    expect(selectE(s, 'soresu')).toBeCloseTo(3);
    expect(s.progression.CI['forcePush']!.CI).toBeCloseTo(0.5);
    expect(s.progression.bankReleaseUntil).toBe(START + 60);
    // E 3 -> ceiling 28 < level 30: nothing released until E is higher.
    const day1 = advanceTime(REGISTRY, s, { seconds: 86_400, reason: 't', source: 'turnDraft' }).state;
    expect(day1.progression.bank['soresu']).toBeCloseTo(400);
    const high = { ...s, progression: { ...s.progression, E: { soresu: { E: 30, eSpar: 0 } } } };
    const after = advanceTime(REGISTRY, high, { seconds: 86_400, reason: 't', source: 'turnDraft' }).state;
    expect(after.progression.bank['soresu']).toBeCloseTo(360);
  });
  it('a lethal fight against an opponent 5+ stronger gives E +10; a spar is ceiling-limited and opens no release', () => {
    const s = applyEvents(REGISTRY, fresh('knight', { soresu: xpForLevel(30) }), [fight('lethal', 6)], { source: 'engine' }).state;
    expect(selectE(s, 'soresu')).toBeCloseTo(10);
    const spar = applyEvents(REGISTRY, fresh('knight', { soresu: xpForLevel(30) }), [fight('spar')], { source: 'engine' }).state;
    expect(spar.progression.bankReleaseUntil).toBeNull();
    expect(spar.progression.bank['soresu'] ?? 0).toBeGreaterThan(0);
  });
});

describe('recording review (progression-numbers §19)', () => {
  it('+5% XP to the skill for 3 days, at most once per 7 days', () => {
    const s = fresh('knight', { soresu: xpForLevel(30) }, { soresu: { E: 60, eSpar: 15 } });
    const r = applyEvents(REGISTRY, s, [{ type: 'recordingReviewed', skillId: 'soresu' }], { source: 'player' });
    expect(r.state.progression.reviewBuff).toEqual({ skillId: 'soresu', untilDay: START + 2 });
    expect(applyEvents(REGISTRY, r.state, [{ type: 'recordingReviewed', skillId: 'soresu' }], { source: 'player' }).rejected).toHaveLength(1);
    const base = resolveTraining(s, { activityId: 'soresuBasics', hours: 2 });
    const buffed = resolveTraining(r.state, { activityId: 'soresuBasics', hours: 2 });
    if (!base.ok || !buffed.ok) throw new Error('refused');
    expect(buffed.card.credited['soresu']! / base.card.credited['soresu']!).toBeCloseTo(1.05, 2);
  });
});

describe('starting E at creation (character-creation §2)', () => {
  it('a Padawan of 16 sparred the stub master (30 ahead): sparring E = highest form + 5 (D-163); war years add on top', () => {
    const base = { name: 'K', speciesId: 'human', path: 'jedi' as const, archetype: 'jediGuardian', trainingStartAge: 4, talents: {}, dominantHand: 'right' as const, birthDay: START - 16 * 368, startDay: START };
    const pad = computeCreation({ ...base, rank: 'padawan' });
    expect(pad.ok).toBe(true);
    const highest = Math.max(...Object.entries(pad.levels).filter(([k]) => (FORM_IDS as readonly string[]).includes(k)).map(([, v]) => v));
    const e = Object.values(pad.startingE)[0]!;
    expect(e.E).toBeCloseTo(highest + 5, 0);
    expect(e.eSpar).toBeCloseTo(e.E, 6);
    // War years are served from 14 (m8-fixes D1): at 16, two.
    const war = computeCreation({ ...base, rank: 'padawan', warYears: 2 });
    expect(Object.values(war.startingE)[0]!.E).toBeGreaterThan(e.E);
  });
  it('an Initiate sparred the stub instructors (10 ahead): stronger partners, but level - 15 is below 15, so E stops at 15', () => {
    const ini = computeCreation({ name: 'K', speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', trainingStartAge: 4, talents: {}, dominantHand: 'right', birthDay: START - 11 * 368, startDay: START, rank: 'initiate' });
    expect(Object.values(ini.startingE)[0]!.E).toBeCloseTo(15, 3);
  });
});

describe('migration v3 -> v4', () => {
  it('starts the M5 fields empty', () => {
    const m = migrateProgressionV3({ skills: {} });
    expect(m).toMatchObject({ E: {}, CI: {}, bank: {}, bankReleaseUntil: null, reviewBuff: null, lastReviewDay: null });
  });
});
