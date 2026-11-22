// M5 step 5c: NPC generation in play (npc-generation §7 tests 3 and 4), canon scaling (D-152, D-155), NPC health and
// death (D-33), teacher levels from NPC generation, and the flags feature (flag-registry §7 tests 2 and 5).
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { computeCreation } from '../../src/features/character/creation';
import { selectNpcGen, selectNpcLevel, selectNpcLevels } from '../../src/features/npcs/selectors';
import { resolveTraining } from '../../src/features/progression/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { LORE_TEST_YEAR, TEST_YEAR } from '../support/dates';

const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const fresh = (year = TEST_YEAR): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: at(year), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(year) - 16 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(30) },
    rank: 'padawan',
  });
const introduce = (s: GameState, name: string, role: string, ageApprox: number, faction = 'jediOrder') =>
  applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name, species: 'human', faction, role, ageApprox, description: '' }], { source: 'ai' }).state;
const idOf = (s: GameState, name: string) => Object.values(s.npcs.byId).find((n) => n.name === name)!.id;

describe('NPC generation in play (npc-generation §4)', () => {
  it('npcGenerated stores the inputs (seeded by campaign + ID), never the levels', () => {
    let s = introduce(fresh(), 'Master Orren', 'jediMaster', 45);
    const id = idOf(s, 'Master Orren');
    const derived = selectNpcGen(s, id);
    s = applyEvents(REGISTRY, s, [{ type: 'npcGenerated', npcRef: id }], { source: 'engine' }).state;
    expect(s.npcs.byId[id]!.gen).toEqual(derived);
    expect(JSON.stringify(s.npcs.byId[id])).not.toMatch(/"levels"/);
    expect(selectNpcLevel(s, id, 'forceControl')).toBeGreaterThan(30);
  });
  it('test 4: an NPC met again years later has levels recomputed for the new age', () => {
    let s = introduce(fresh(), 'Tavik', 'padawan', 14);
    const id = idOf(s, 'Tavik');
    s = applyEvents(REGISTRY, s, [{ type: 'npcGenerated', npcRef: id }], { source: 'engine' }).state;
    const before = Math.max(...Object.entries(selectNpcLevels(s, id)).filter(([k]) => ['shiiCho', 'soresu', 'ataru', 'makashi', 'djemSo', 'shien', 'niman'].includes(k)).map(([, v]) => v));
    const later = { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: s.clock.now.day + 6 * 368 } } };
    const after = Math.max(...Object.entries(selectNpcLevels(later, id)).filter(([k]) => ['shiiCho', 'soresu', 'ataru', 'makashi', 'djemSo', 'shien', 'niman'].includes(k)).map(([, v]) => v));
    expect(after).toBeGreaterThan(before + 5);
  });
  it('test 3: no generated NPC exceeds 4.0x pace', () => {
    const s = fresh();
    for (let i = 0; i < 60; i++) {
      const roles = ['jediKnight', 'sithLord', 'soldier', 'smuggler', 'jediMaster'] as const;
      const role = roles[i % roles.length]!;
      const gen = { ...selectNpcGen(introduce(s, `N${i}`, role, 30 + (i % 20), role.startsWith('sith') ? 'sithEmpire' : 'jediOrder'), idOf(introduce(s, `N${i}`, role, 30 + (i % 20), role.startsWith('sith') ? 'sithEmpire' : 'jediOrder'), `N${i}`))! };
      const r = computeCreation({ name: 'x', birthDay: s.clock.now.day - (30 + (i % 20)) * 368, startDay: s.clock.now.day, speciesId: 'human', path: gen.path, archetype: gen.archetype, rank: gen.rank, trainingStartAge: gen.startAge, talents: gen.talents, warYears: gen.warYears, dominantHand: 'right', npc: true });
      expect(r.maxPace).toBeLessThanOrEqual(4 + 1e-9);
    }
  });
});

describe('canon NPCs in play (D-152, D-155)', () => {
  it("Satele Shan met at Korriban (3,681) is far below her Galactic War sheet; a campaign started at the sheet's year matches it (D-414)", () => {
    const early = fresh(-3681);
    let s = introduce(early, 'Satele Shan', 'padawan', 18);
    const id = idOf(s, 'Satele Shan');
    s = applyEvents(REGISTRY, s, [{ type: 'npcCanonLinked', npcRef: id, canonId: 'lore:satele-shan' }], { source: 'engine' }).state;
    const young = selectNpcLevel(s, id, 'ataru');
    expect(young).toBeLessThan(70);
    // Calculated once at the 3,681 start, she then grows by the normal maths: stronger by 3,643, not pulled to the sheet.
    const later = { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: at(-3643) } } };
    expect(selectNpcLevel(later, id, 'ataru')).toBeGreaterThan(young + 10);
    let p = introduce(fresh(-3643), 'Satele Shan', 'jediMaster', 56);
    const pid = idOf(p, 'Satele Shan');
    p = applyEvents(REGISTRY, p, [{ type: 'npcCanonLinked', npcRef: pid, canonId: 'lore:satele-shan' }], { source: 'engine' }).state;
    // Her sheet's Ataru 88 in the game scale (D-423: forms x0.83).
    expect(selectNpcLevel(p, pid, 'ataru')).toBeCloseTo(73, 0);
  });
  it('fixed canon entries (Vitiate) do not scale', () => {
    let s = introduce(fresh(LORE_TEST_YEAR), 'Vitiate', 'sithLord', 900, 'sithEmpire');
    const id = idOf(s, 'Vitiate');
    s = applyEvents(REGISTRY, s, [{ type: 'npcCanonLinked', npcRef: id, canonId: 'lore:vitiate' }], { source: 'engine' }).state;
    // His sheet's Force Control 130 in the game scale (D-423: x0.64).
    expect(selectNpcLevel(s, id, 'forceControl')).toBe(83.2);
  });
});

describe('NPC health and death (health §9, D-33)', () => {
  it('npcDied is engine-only and one-way; the AI cannot set deceased', () => {
    let s = introduce(fresh(), 'Guard', 'soldier', 30, 'republic');
    const id = idOf(s, 'Guard');
    const ai = applyEvents(REGISTRY, s, [{ type: 'npcDied', npcRef: id, cause: 'x' }], { source: 'ai' });
    expect(ai.rejected).toHaveLength(1);
    s = applyEvents(REGISTRY, s, [{ type: 'npcDied', npcRef: id, cause: 'killed in a duel' }], { source: 'engine' }).state;
    expect(s.npcs.byId[id]!.status).toBe('deceased');
    expect(applyEvents(REGISTRY, s, [{ type: 'npcStatusChanged', npcRef: id, state: 'active' }], { source: 'ai' }).rejected).toHaveLength(1);
  });
  it('named NPCs heal day by day', () => {
    let s = introduce(fresh(), 'Guard', 'soldier', 30, 'republic');
    const id = idOf(s, 'Guard');
    const w = { id: 'g:w1', part: 'leftLeg' as const, severity: 'moderate' as const, W: 12, stabilized: false, healProgress: 0, day: s.clock.now.day, source: 'duel' };
    s = applyEvents(REGISTRY, s, [{ type: 'npcHealthSynced', npcRef: id, health: { vitalityLost: 10, wounds: [w], lasting: [] } }], { source: 'engine' }).state;
    for (let d = 0; d < 7; d++) s = advanceTime(REGISTRY, s, { seconds: 86_400, reason: 't', source: 'turnDraft' }).state;
    expect(s.npcs.byId[id]!.health!.wounds).toHaveLength(0);
    expect(s.npcs.byId[id]!.health!.vitalityLost).toBe(0);
  });
});

describe('teacher levels from NPC generation (replacing the M3 stub)', () => {
  it("a named teacher's instruction uses their own generated level in the skill", () => {
    let s = introduce(fresh(), 'Master Orren', 'jediMaster', 50);
    const id = idOf(s, 'Master Orren');
    s = applyEvents(REGISTRY, s, [{ type: 'npcGenerated', npcRef: id }], { source: 'engine' }).state;
    const plan = resolveTraining(s, { activityId: 'soresuBasics', hours: 2, source: { kind: 'npc', id } });
    if (!plan.ok) throw new Error(plan.reason);
    expect(plan.card.instruction.teacherId).toBe(id);
    expect(plan.card.instruction.factor).toBeGreaterThan(1);
  });
});

describe('flags (flag-registry §7 tests 2 and 5)', () => {
  it('flagSet from a source the flag does not list is rejected and logged', () => {
    const s = fresh();
    expect(applyEvents(REGISTRY, s, [{ type: 'flagSet', flag: 'heroicAct:fight-1' }], { source: 'ai' }).rejected[0]!.reason).toMatch(/does not allow the ai source/);
    expect(applyEvents(REGISTRY, s, [{ type: 'flagSet', flag: 'madeUp' }], { source: 'ai' }).rejected[0]!.reason).toMatch(/unregistered/);
    const ok = applyEvents(REGISTRY, s, [{ type: 'flagSet', flag: 'visitedArchives' }], { source: 'ai' });
    expect(ok.state.flags.set).toEqual(['visitedArchives']);
  });
  it('heroicAct and masterApproval are set only by the engine', () => {
    const s = fresh();
    for (const flag of ['heroicAct:fight-1', 'masterApproval']) {
      expect(applyEvents(REGISTRY, s, [{ type: 'flagSet', flag }], { source: 'player' }).rejected).toHaveLength(1);
      expect(applyEvents(REGISTRY, s, [{ type: 'flagSet', flag }], { source: 'engine' }).state.flags.set).toContain(flag);
    }
  });
});
