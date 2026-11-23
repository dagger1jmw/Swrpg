// The Jedi Order's rules on powers (D-346, D-436): forbidden and dark-side powers, a Master's permission, the Masters'
// controlled study, covert learning and the Order standing it risks.
import { describe, expect, it } from 'vitest';
import { COVERT_LEARNING, ORDER_POWER_RULES } from '../../src/data/orderPowerRules';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { resolveTraining } from '../../src/features/progression/training';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { covertDiscoveryChance, covertEscalation, orderPowerVerdict } from '../../src/features/ranks/rules';
import { selectCovertEscalation, selectStanding } from '../../src/features/ranks/selectors';
import { stateBlock } from '../../src/turn/context';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const make = (rank: string, path: 'jedi' | 'sith' = 'jedi', year = -3661): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'op',
    start: { day: at(year), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(year) - 30 * 368, path, archetype: path === 'jedi' ? 'jediGuardian' : 'sithWarrior', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(50), forceControl: xpForLevel(40), electricJudgment: xpForLevel(5), forceLightning: xpForLevel(5) },
    rank,
  });
const v = (o: Partial<Parameters<typeof orderPowerVerdict>[0]>) => orderPowerVerdict({ abilityId: 'electricJudgment', name: 'Electric Judgment', year: -3661, path: 'jedi', rank: 'knight', permitted: false, orderTeacher: false, ...o }).kind;
const withMaster = (s: GameState): { s: GameState; id: string } => {
  const r = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Master Orgus', species: 'human', faction: 'jediOrder', role: 'jediMaster', ageApprox: 60, description: '' }], { source: 'ai' }).state;
  return { s: r, id: Object.keys(r.npcs.byId)[0]! };
};

describe('the verdict (pure)', () => {
  it('forbidden: an Order teacher refuses; otherwise covert; a permission or a Master in the study years opens it', () => {
    expect(v({ orderTeacher: true })).toBe('refused');
    expect(v({})).toBe('covert');
    expect(v({ permitted: true, orderTeacher: true })).toBe('open');
    expect(v({ rank: 'master', year: -900 })).toBe('open');
    expect(v({ rank: 'master' })).toBe('covert');
    // D-449: still forbidden in 10 ABY (a permission opens it), open from 11 ABY (Luke's Praxeum).
    expect(v({ year: 10 })).toBe('covert');
    expect(v({ year: 10, permitted: true })).toBe('open');
    expect(v({ year: 11 })).toBe('open');
    expect(v({ abilityId: 'morichro', name: 'Morichro', year: -3661 })).toBe('open');
    expect(v({ abilityId: 'morichro', name: 'Morichro', year: -900 })).toBe('covert');
  });
  it('dark-side powers are never permitted; non-Jedi are not bound', () => {
    expect(v({ abilityId: 'forceLightning', name: 'Force Lightning', permitted: true, rank: 'master', orderTeacher: true })).toBe('refused');
    expect(v({ abilityId: 'forceLightning', name: 'Force Lightning', path: 'sith' })).toBe('open');
    expect(v({ abilityId: 'telekinesis', name: 'Telekinesis', orderTeacher: true })).toBe('open');
    expect(Object.values(ORDER_POWER_RULES).every((r) => r.source.length > 0)).toBe(true);
  });
  it('the discovery chance grows with the hours, to a cap', () => {
    expect(covertDiscoveryChance(1)).toBeCloseTo(COVERT_LEARNING.perHour);
    expect(covertDiscoveryChance(100)).toBe(COVERT_LEARNING.maxChance);
  });
});

describe('in play', () => {
  it('the master stub refuses Electric Judgment to a Knight; self-study is covert', () => {
    const s = make('knight');
    const taught = resolveTraining(s, { activityId: 'abilityDrill', skillId: 'electricJudgment', hours: 1, source: { kind: 'master' } });
    expect(taught.ok).toBe(false);
    if (!taught.ok) expect(taught.reason).toMatch(/forbidden by the Jedi Order/);
    const solo = resolveTraining(s, { activityId: 'abilityDrill', skillId: 'electricJudgment', hours: 1, source: { kind: 'solo' } });
    expect(solo.ok).toBe(true);
    if (solo.ok) expect(solo.card.notes.some((n) => n.includes('covertly'))).toBe(true);
  });
  it("a Jedi Master's permission opens it to the Order's teachers", () => {
    const { s, id } = withMaster(make('knight'));
    const p = applyEvents(REGISTRY, s, [{ type: 'forbiddenPermissionGranted', abilityId: 'electricJudgment', byNpcRef: id }], { source: 'ai' });
    expect(p.rejected).toHaveLength(0);
    expect(resolveTraining(p.state, { activityId: 'abilityDrill', skillId: 'electricJudgment', hours: 1, source: { kind: 'master' } }).ok).toBe(true);
    const dark = applyEvents(REGISTRY, s, [{ type: 'forbiddenPermissionGranted', abilityId: 'forceLightning', byNpcRef: id }], { source: 'ai' });
    expect(dark.rejected).toHaveLength(1);
  });
  it('a discovery costs Order standing, which fades month by month', () => {
    const s = make('padawan');
    const before = selectStanding(s);
    const d = applyEvents(REGISTRY, s, [{ type: 'covertLearningDiscovered', abilityId: 'forceLightning' }], { source: 'engine' }).state;
    expect(d.ranks.reputationPenalty).toBe(COVERT_LEARNING.standingPenalty);
    expect(selectStanding(d)).toBeCloseTo(Math.max(0, before - COVERT_LEARNING.standingPenalty), 6);
    // Discovery happens over enough covert sessions.
    let t = make('padawan');
    let found = false;
    for (let i = 0; i < 80 && !found; i++) {
      const r = resolveTraining(t, { activityId: 'abilityDrill', skillId: 'forceLightning', hours: 2, source: { kind: 'solo' } });
      if (!r.ok) throw new Error(r.reason);
      found = r.events.some((e) => e.type === 'covertLearningDiscovered');
      t = { ...t, meta: { ...t.meta, rngState: r.rng } };
    }
    expect(found).toBe(true);
  });
});

describe('the discovery escalation (D-448)', () => {
  const d = (abilityId: string) => ({ abilityId });
  const notesOf = (r: { applied: readonly { notes: readonly string[] }[] }): string => r.applied.flatMap((a) => a.notes).join('\n');
  it('1st the reprimand, 2nd a Council summons, 3rd trials held back; a dark-side power brings the judgment', () => {
    expect(covertEscalation([]).flags).toEqual([]);
    expect(covertEscalation([d('morichro')]).flags).toEqual(['reprimand']);
    expect(covertEscalation([d('morichro'), d('deadlySight')]).flags).toEqual(['reprimand', 'councilSummons']);
    expect(covertEscalation([d('morichro'), d('morichro'), d('morichro'), d('morichro')])).toEqual({ count: 4, flags: ['reprimand', 'councilSummons', 'trialsHeldBack'] });
    expect(covertEscalation([d('forceChoke')]).flags).toEqual(['reprimand', 'councilJudgment']);
  });
  it('the code tracks it; each new step is a note to narrate, and the state block lists what was reached', () => {
    const one = applyEvents(REGISTRY, make('padawan'), [{ type: 'covertLearningDiscovered', abilityId: 'morichro' }], { source: 'engine' });
    expect(notesOf(one)).toMatch(/consequence to narrate now: the Master's reprimand/);
    const two = applyEvents(REGISTRY, one.state, [{ type: 'covertLearningDiscovered', abilityId: 'forceLightning' }], { source: 'engine' });
    const notes = notesOf(two);
    expect(notes).toMatch(/discovery 2/);
    expect(notes).toMatch(/a summons before the Council; the Council's judgment/);
    expect(notes).not.toMatch(/reprimand/);
    expect(selectCovertEscalation(two.state).flags).toEqual(['reprimand', 'councilSummons', 'councilJudgment']);
    const block = stateBlock(two.state, makeEstimator(4), undefined, [], '').text;
    expect(block).toMatch(/discoveries 2, consequences reached: the Master's reprimand, a summons before the Council, the Council's judgment \(possible expulsion\)/);
  });
});
