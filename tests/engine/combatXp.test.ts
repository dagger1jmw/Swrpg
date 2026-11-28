// combat-xp.md §7 tests 1, 2, 3, 6, 7, 9 (the combat branch of computeXp, D-55; no daily limits and long bouts, m9-tune2 items 7-8).
import { describe, expect, it } from 'vitest';
import { COMBAT_XP, LONG_BOUT } from '../../src/data/progression.config';
import { boutNumbers, combatChallenge, computeCombatXp, longBoutFactor, type CombatSession } from '../../src/engine/combatXp';

const ex = (n: number, gap: number, skillId = 'soresu') => Array.from({ length: n }, () => ({ skillId, gap }));
/** One continuous bout of n exchanges at a gap, the track at `adv` throughout. */
const bout = (n: number, gap: number, adv = 0, skillId = 'soresu') => Array.from({ length: n }, (_, i) => ({ skillId, gap, n: i + 1, adv }));
const run = (session: CombatSession) =>
  computeCombatXp({
    session,
    m: () => 1,
    physicalWeights: () => ({}),
    clamp: (_k, wanted) => ({ credited: wanted, discarded: 0 }),
  });
const total = (r: ReturnType<typeof run>) => Object.values(r.credited).reduce((a, b) => a + b, 0);

describe('combat XP (combat-xp.md §6 reference values, M 1.0)', () => {
  it('the base is 0.16 (0.25 until m9-tune2: lowered for the combat shares with the daily cap gone)', () => {
    expect(COMBAT_XP.perExchange).toBe(0.16);
  });
  it('even serious duel, 34 exchanges in one close bout: 10.56 (8.16 at the plain rate, 44 ramp-weighted exchanges)', () => {
    const r = run({ stakes: 'serious', outcome: 'won', exchanges: bout(34, 0), forceUses: [] });
    expect(r.beforeM['soresu']).toBeCloseTo(10.56, 10);
    expect(total(r)).toBeCloseTo(10.56, 10);
    expect(total(run({ stakes: 'serious', outcome: 'won', exchanges: ex(34, 0), forceUses: [] }))).toBeCloseTo(8.16, 10);
  });
  it('even spar, 34 exchanges: 2.72', () => {
    expect(total(run({ stakes: 'spar', outcome: 'won', exchanges: ex(34, 0), forceUses: [] }))).toBeCloseTo(2.72, 10);
  });
  it('lethal, opponent 12 stronger, lost, 34 exchanges in one close bout: 21.12 (16.32 at the plain rate)', () => {
    const plain = 34 * 0.16 * combatChallenge(12) * 2 * 1.2;
    expect(plain).toBeCloseTo(16.32, 10);
    expect(total(run({ stakes: 'lethal', outcome: 'lost', exchanges: ex(34, 12), forceUses: [] }))).toBeCloseTo(16.32, 10);
    expect(total(run({ stakes: 'lethal', outcome: 'lost', exchanges: bout(34, 12), forceUses: [] }))).toBeCloseTo(21.12, 10);
  });
  it('Jedi (70) vs trooper (15): 0', () => {
    expect(total(run({ stakes: 'serious', outcome: 'won', exchanges: ex(34, -55), forceUses: [] }))).toBe(0);
  });
});

describe('combat XP limits (m9-tune2 item 8: no daily limit; the challenge curve, stakes and the drill ceiling stay)', () => {
  it('a long fight pays in full: no daily cap, no later-fight halving', () => {
    const r = run({ stakes: 'serious', outcome: 'won', exchanges: [...ex(200, 0), ...ex(20, 0, 'blaster')], forceUses: [] });
    expect(r.beforeM['soresu']).toBeCloseTo(48, 10);
    expect(r.beforeM['blaster']).toBeCloseTo(4.8, 10);
    expect(r.notes.some((n) => n.includes('cap') || n.includes('later'))).toBe(false);
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
      clamp: (_k, w) => ({ credited: w, discarded: 0 }),
    });
    expect(r.credited['soresu']).toBeCloseTo(0.96, 10);
    expect(r.credited['endurance']).toBeCloseTo(0.24, 10);
    expect(r.credited['agility']).toBeCloseTo(0.08, 10);
    expect(r.credited['forcePush']).toBeCloseTo(0.1, 10);
  });
  it('the clamp is applied (combat XP counts toward the 4.0x limit, test 4)', () => {
    const r = computeCombatXp({
      session: { stakes: 'serious', outcome: 'won', exchanges: ex(34, 0), forceUses: [] },
      m: () => 1,
      physicalWeights: () => ({}),
      clamp: (_k, w) => ({ credited: w / 2, discarded: w / 2 }),
    });
    expect(r.credited['soresu']).toBeCloseTo(4.08, 10);
    expect(r.discarded['soresu']).toBeCloseTo(4.08, 10);
  });
});

describe('long duels grant increasing returns (m9-tune2 item 7, LONG_BOUT)', () => {
  it(`x1 through exchange ${LONG_BOUT.from}, rising linearly to x${LONG_BOUT.maxMult} at ${LONG_BOUT.full}, capped`, () => {
    const f = (n: number) => longBoutFactor({ skillId: 'soresu', gap: 0, n, adv: 0 });
    expect(f(1)).toBe(1);
    expect(f(10)).toBe(1);
    expect(f(11)).toBeCloseTo(1 + 1 / 30, 10);
    expect(f(25)).toBeCloseTo(1.5, 10);
    expect(f(40)).toBeCloseTo(2, 10);
    expect(f(90)).toBeCloseTo(2, 10);
  });
  it('only while close: the track within +/-2 and a challenge above 0; no bout number, no ramp', () => {
    expect(longBoutFactor({ skillId: 'soresu', gap: 0, n: 30, adv: 2 })).toBeGreaterThan(1);
    expect(longBoutFactor({ skillId: 'soresu', gap: 0, n: 30, adv: -2 })).toBeGreaterThan(1);
    expect(longBoutFactor({ skillId: 'soresu', gap: 0, n: 30, adv: 3 })).toBe(1);
    expect(longBoutFactor({ skillId: 'soresu', gap: 0, n: 30, adv: -3 })).toBe(1);
    expect(longBoutFactor({ skillId: 'soresu', gap: -40, n: 30, adv: 0 })).toBe(1);
    expect(longBoutFactor({ skillId: 'soresu', gap: 0 })).toBe(1);
    // A long beating of a weaker foe (the track at +4) pays the plain rate.
    expect(total(run({ stakes: 'serious', outcome: 'won', exchanges: bout(34, -10, 4), forceUses: [] }))).toBeCloseTo(total(run({ stakes: 'serious', outcome: 'won', exchanges: ex(34, -10), forceUses: [] })), 10);
  });
  it('normal bouts of 5-10 exchanges pay exactly as before', () => {
    for (const n of [5, 8, 10]) expect(total(run({ stakes: 'serious', outcome: 'won', exchanges: bout(n, 0), forceUses: [] }))).toBeCloseTo(n * 0.16 * 1.5, 10);
  });
  it('a spar of short bouts never ramps: the count restarts each bout', () => {
    expect(boutNumbers([1, 2, 3, 4, 5, 6, 7, 8], [3, 3])).toEqual([1, 2, 3, 1, 2, 3, 1, 2]);
    expect(boutNumbers([1, 2, 3, 4], [])).toEqual([1, 2, 3, 4]);
    const ns = boutNumbers(Array.from({ length: 34 }, (_, i) => i + 1), [8, 9, 7, 10]);
    const spar = ns.map((n) => ({ skillId: 'soresu', gap: 0, n, adv: 0 }));
    expect(total(run({ stakes: 'spar', outcome: 'won', exchanges: spar, forceUses: [] }))).toBeCloseTo(2.72, 10);
  });
});
