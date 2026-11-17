// combat-xp.md §7 tests 1, 2, 3, 6, 7 (the combat branch of computeXp, D-55).
import { describe, expect, it } from 'vitest';
import { combatChallenge, computeCombatXp, type CombatSession } from '../../src/engine/combatXp';

const ex = (n: number, gap: number, skillId = 'soresu') => Array.from({ length: n }, () => ({ skillId, gap }));
const run = (session: CombatSession, today: Record<string, number> = {}, fights: Record<string, number> = {}) =>
  computeCombatXp({
    session,
    m: () => 1,
    physicalWeights: () => ({}),
    todayBeforeM: (k) => today[k] ?? 0,
    fightsToday: (k) => fights[k] ?? 0,
    clamp: (_k, wanted) => ({ credited: wanted, discarded: 0 }),
  });
const total = (r: ReturnType<typeof run>) => Object.values(r.credited).reduce((a, b) => a + b, 0);

describe('combat XP (combat-xp.md §6 reference values, M 1.0)', () => {
  it('even serious duel, 34 exchanges: 12.75 capped at 12', () => {
    const r = run({ stakes: 'serious', outcome: 'won', exchanges: ex(34, 0), forceUses: [] });
    expect(r.beforeM['soresu']).toBeCloseTo(12, 10);
    expect(total(r)).toBeCloseTo(12, 10);
  });
  it('even spar, 34 exchanges: 4.25', () => {
    expect(total(run({ stakes: 'spar', outcome: 'won', exchanges: ex(34, 0), forceUses: [] }))).toBeCloseTo(4.25, 10);
  });
  it('lethal, opponent 12 stronger, lost: 25.5 capped at 12', () => {
    const uncapped = 34 * 0.25 * combatChallenge(12) * 2 * 1.2;
    expect(uncapped).toBeCloseTo(25.5, 10);
    expect(total(run({ stakes: 'lethal', outcome: 'lost', exchanges: ex(34, 12), forceUses: [] }))).toBeCloseTo(12, 10);
  });
  it('Jedi (70) vs trooper (15): 0', () => {
    expect(total(run({ stakes: 'serious', outcome: 'won', exchanges: ex(34, -55), forceUses: [] }))).toBe(0);
  });
});

describe('combat XP limits', () => {
  it('the daily cap counts XP already earned today, per skill', () => {
    const r = run({ stakes: 'serious', outcome: 'won', exchanges: [...ex(20, 0), ...ex(20, 0, 'blaster')], forceUses: [] }, { soresu: 10 });
    expect(r.beforeM['soresu']).toBeCloseTo(2, 10);
    expect(r.beforeM['blaster']).toBeCloseTo(7.5, 10);
  });
  it('the third fight of the day for a skill is halved', () => {
    const s: CombatSession = { stakes: 'skirmish', outcome: 'won', exchanges: ex(10, 0), forceUses: [] };
    expect(total(run(s, {}, { soresu: 1 }))).toBeCloseTo(2.5, 10);
    expect(total(run(s, {}, { soresu: 2 }))).toBeCloseTo(1.25, 10);
  });
  it('challenge ramps from 0.3 at gap -25 to 0 at -35 with no step (D-65)', () => {
    expect(combatChallenge(-25)).toBeCloseTo(0.3, 10);
    expect(combatChallenge(-30)).toBeCloseTo(0.15, 10);
    expect(combatChallenge(-35)).toBe(0);
    expect(combatChallenge(-50)).toBe(0);
    for (let g = -40; g < 0; g += 0.5) expect(Math.abs(combatChallenge(g + 0.5) - combatChallenge(g))).toBeLessThan(0.08);
  });
  it('0.75 to the skill used, 0.25 to physical stats by weight; Force uses are not split', () => {
    const r = computeCombatXp({
      session: { stakes: 'skirmish', outcome: 'won', exchanges: ex(8, 0), forceUses: [{ abilityId: 'forcePush', gap: 0 }] },
      m: () => 1,
      physicalWeights: () => ({ endurance: 3, agility: 1 }),
      todayBeforeM: () => 0,
      fightsToday: () => 0,
      clamp: (_k, w) => ({ credited: w, discarded: 0 }),
    });
    expect(r.credited['soresu']).toBeCloseTo(1.5, 10);
    expect(r.credited['endurance']).toBeCloseTo(0.375, 10);
    expect(r.credited['agility']).toBeCloseTo(0.125, 10);
    expect(r.credited['forcePush']).toBeCloseTo(0.1, 10);
  });
  it('the clamp is applied (combat XP counts toward the 4.0x limit, test 4)', () => {
    const r = computeCombatXp({
      session: { stakes: 'serious', outcome: 'won', exchanges: ex(34, 0), forceUses: [] },
      m: () => 1,
      physicalWeights: () => ({}),
      todayBeforeM: () => 0,
      fightsToday: () => 0,
      clamp: (_k, w) => ({ credited: w / 2, discarded: w / 2 }),
    });
    expect(r.credited['soresu']).toBeCloseTo(6, 10);
    expect(r.discarded['soresu']).toBeCloseTo(6, 10);
  });
});
