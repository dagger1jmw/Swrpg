// npc-generation §7 tests 5 and 6 (talent frequencies, same seed same NPC), D-143 G (order independence), minions
// (§6), war years and canon scaling (D-152, D-155).
import { describe, expect, it } from 'vitest';
import { MINION_KINDS } from '../../src/data/npcGen.config';
import { minionInputs, npcSeed, npcVariance, rollMinionGrade, rollNpcInputs, warYearsFor } from '../../src/engine/npcGen';
import { seedRng } from '../../src/engine/rng';

const base = { campaignSeed: 'camp', role: 'jediKnight', faction: 'jediOrder', age: 30, year: -1032 };

describe('NPC inputs (npc-generation §2-4)', () => {
  it('test 6: the same seed always produces the same NPC', () => {
    expect(rollNpcInputs({ ...base, npcId: 'npc:a' })).toEqual(rollNpcInputs({ ...base, npcId: 'npc:a' }));
    expect(npcVariance(npcSeed('camp', 'npc:a'), 'soresu')).toBe(npcVariance(npcSeed('camp', 'npc:a'), 'soresu'));
  });
  it('the seed is the campaign seed plus the NPC ID: generation order does not matter (D-143 G)', () => {
    const ids = ['npc:a', 'npc:b', 'npc:c', 'npc:d'];
    const forward = ids.map((id) => rollNpcInputs({ ...base, npcId: id }));
    const backward = [...ids].reverse().map((id) => rollNpcInputs({ ...base, npcId: id })).reverse();
    expect(forward).toEqual(backward);
    expect(rollNpcInputs({ ...base, npcId: 'npc:a' })).not.toEqual(rollNpcInputs({ ...base, campaignSeed: 'other', npcId: 'npc:a' }));
  });
  it('test 5: talent rolls match §2 within 1 point over 100,000 seeded NPCs', () => {
    const count = (role: string, faction: string) => {
      const c = { none: 0, gifted: 0, prodigy: 0, exceptional: 0 };
      for (let i = 0; i < 100_000; i++) {
        const t = rollNpcInputs({ ...base, role, faction, npcId: `npc:${i}` }).talents.combat ?? 'none';
        c[t]++;
      }
      return c;
    };
    const order = count('jediKnight', 'jediOrder');
    expect(Math.abs(order.none / 1000 - 70)).toBeLessThanOrEqual(1);
    expect(Math.abs(order.gifted / 1000 - 22)).toBeLessThanOrEqual(1);
    expect(Math.abs(order.prodigy / 1000 - 7)).toBeLessThanOrEqual(1);
    expect(Math.abs(order.exceptional / 1000 - 1)).toBeLessThanOrEqual(1);
    const other = count('merchant', 'civilian');
    expect(Math.abs(other.none / 1000 - 79.8)).toBeLessThanOrEqual(1);
    expect(Math.abs(other.gifted / 1000 - 17)).toBeLessThanOrEqual(1);
    expect(Math.abs(other.prodigy / 1000 - 3)).toBeLessThanOrEqual(1);
  });
  it('variance is about +/-12% per skill (sd of the log near 0.12)', () => {
    const logs = Array.from({ length: 20_000 }, (_, i) => Math.log(npcVariance(`s${i}`, 'soresu')));
    const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
    const sd = Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / logs.length);
    expect(Math.abs(mean)).toBeLessThan(0.005);
    expect(Math.abs(sd - 0.12)).toBeLessThan(0.005);
  });
  it('archetype by role and faction; rank from role', () => {
    const k = rollNpcInputs({ ...base, npcId: 'npc:k' });
    expect(['jediGuardian', 'jediConsular', 'jediSentinel']).toContain(k.archetype);
    expect(k.rank).toBe('knight');
    expect(rollNpcInputs({ ...base, role: 'soldier', faction: 'mandalorians', npcId: 'npc:m' }).archetype).toBe('mandalorian');
    expect(rollNpcInputs({ ...base, role: 'merchant', faction: 'civilian', npcId: 'npc:c' }).archetype).toBe('civilian');
  });
});

describe('war years (npc-generation §1)', () => {
  it('combatants of a war faction count the overlap of their service with the war; others none', () => {
    // Great Galactic War 3,681-3,653 BBY. A Knight of 30 in 3,661 BBY served from 16 (3,675): 14 years.
    expect(warYearsFor('jediKnight', 'jediOrder', 30, 4, -3661)).toBe(14);
    expect(warYearsFor('merchant', 'jediOrder', 30, 4, -3661)).toBe(0);
    expect(warYearsFor('jediKnight', 'civilian', 30, 4, -3661)).toBe(0);
    // The one war list (opt-2 A1): 1,032 BBY is in the New Sith Wars, split into dated campaigns (m9-missions A1f): served from
    // 1,046, the Grumani campaigns 1,042-1,032 give 10 war years; 500 BBY is peace.
    expect(warYearsFor('jediKnight', 'jediOrder', 30, 4, -1032)).toBe(10);
    expect(warYearsFor('jediKnight', 'jediOrder', 30, 4, -500)).toBe(0);
  });
  it('war years by role (opt-2 A2): Guardians and Sentinels every year, Consulars half, scholars none; a Clone Wars Jedi General has them', () => {
    expect(warYearsFor('jediKnight', 'jediOrder', 30, 4, -3661, 'jediGuardian')).toBe(14);
    expect(warYearsFor('jediKnight', 'jediOrder', 30, 4, -3661, 'jediSentinel')).toBe(14);
    expect(warYearsFor('jediKnight', 'jediOrder', 30, 4, -3661, 'jediConsular')).toBe(7);
    expect(warYearsFor('scholar', 'jediOrder', 30, 4, -3661, 'scholar')).toBe(0);
    expect(warYearsFor('jediKnight', 'jediOrder', 30, 4, -19, 'jediGuardian')).toBe(3);
    expect(warYearsFor('soldier', 'independent', 30, 16, -19, 'soldier')).toBe(3);
  });
});

describe('minions (npc-generation §6)', () => {
  it('grade sets years trained (2, 5, 10, 15, 20) at pace 1.0 with no talents', () => {
    const m = minionInputs('trooper', 3, 'seed');
    expect(m.age - m.startAge).toBe(10);
    expect(m.talents).toEqual({});
    expect(m.minionGrade).toBe(3);
  });
  it('grade rolls follow the kind’s chances', () => {
    let rng = seedRng('grades');
    const c = [0, 0, 0, 0, 0];
    for (let i = 0; i < 20_000; i++) {
      let g: number;
      [g, rng] = rollMinionGrade(rng, 'battleDroid');
      c[g - 1]!++;
    }
    expect(c[4]).toBe(0);
    expect(Math.abs(c[0]! / 20_000 - MINION_KINDS.find((k) => k.id === 'battleDroid')!.grades[0])).toBeLessThan(0.02);
  });
});

