// M5 balance table row 19 (pass 5 flag 10): Varek, mortally wounded by a clean saber hit in 3 exchanges, captured and
// stabilized, showed "69 / 69" Vitality beside a stabilized critical wound. Not a bug (health.md §3, amended): a clean or
// critical saber hit sends all of D to the wound (bypass 1), so it takes no Vitality, and stabilizing marks the mortal
// wound stabilized (shown as "stabilized critical") without touching Vitality. Vitality is the short-term buffer; the wound and
// its penalty are what weaken the character.
import { describe, expect, it } from 'vitest';
import { damageFighter } from '../../src/engine/duel';
import { seedRng, type RngState } from '../../src/engine/rng';
import type { Wound } from '../../src/engine/wounds';
import { selectMaxVitality, selectVitality } from '../../src/features/health/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { testStartInput } from '../../src/turn/testStart';
import { TEST_START_DATE } from '../support/dates';
import { forceUser, REAL } from '../support/duelSim';

describe('Vitality after a stabilized mortal wound (health §3)', () => {
  it('a clean or critical saber hit that makes a mortal wound takes no Vitality', () => {
    let rng: RngState = seedRng('stab-vit');
    let mortals = 0;
    for (let i = 0; i < 400 && mortals < 10; i++) {
      for (const q of ['clean', 'critical'] as const) {
        const f = forceUser('V', 45);
        const d = damageFighter(f, q, 25, 'lightsaber', REAL, rng, 0, 1, false);
        rng = d.rng;
        if (d.hit.severity !== 'mortal') continue;
        mortals++;
        expect(d.hit.vitalityLost).toBe(0);
        expect(d.f.vitality).toBe(f.vitality);
      }
    }
    expect(mortals).toBeGreaterThan(0);
  });
  it('stabilizing ends Dying and leaves Vitality as it was', async () => {
    const input = testStartInput({ name: 'Varek Thane', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND, archetype: 'sithWarrior' });
    let s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c-stab', branchId: 'b' }, 'stab')).state;
    const max = selectMaxVitality(s);
    // The duel's sync: a clean saber hit's mortal wound, no Vitality lost.
    const mortal: Wound = { id: 'm', part: 'torso', severity: 'mortal', W: 55, stabilized: false, healProgress: 0, day: s.clock.now.day, source: 'duel' };
    s = applyEvents(REGISTRY, s, [{ type: 'healthSynced', vitalityLost: 0, addWounds: [mortal], cause: 'duel' }], { source: 'engine' }).state;
    expect(s.health.dying).not.toBeNull();
    s = applyEvents(REGISTRY, s, [{ type: 'woundsStabilized', by: 'the captors' }], { source: 'engine' }).state;
    expect(s.health.dying).toBeNull();
    const w = (s.health.wounds as Wound[])[0]!;
    // Kept as a stabilized mortal wound (the panel shows "stabilized critical"; health §5: stabilized mortal 90 days).
    expect(w.severity).toBe('mortal');
    expect(w.stabilized).toBe(true);
    expect(selectVitality(s)).toBe(max);
    // A fight that also drained Vitality keeps that loss through the stabilizing.
    let t = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c-stab2', branchId: 'b' }, 'stab2')).state;
    t = applyEvents(REGISTRY, t, [{ type: 'healthSynced', vitalityLost: 30, addWounds: [mortal], cause: 'duel' }], { source: 'engine' }).state;
    t = applyEvents(REGISTRY, t, [{ type: 'woundsStabilized', by: 'the captors' }], { source: 'engine' }).state;
    expect(selectVitality(t)).toBe(max - 30);
  });
});
