// Jared's calls after combat pass 2 (2026-11-19): D-234 the fatigue curve past 1x capacity, D-230 form hours toward a
// lost leg, D-235 the lifetime pace floor from the clamp's Y_avg table.
import { describe, expect, it } from 'vitest';
import { LEG_FORM_SHARE } from '../../src/data/health.config';
import { fighterEffectiveLevel } from '../../src/engine/duel';
import { fatigueLevelFactor } from '../../src/engine/fatigue';
import type { LastingInjury } from '../../src/engine/lasting';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { paceFloorYears } from '../lifetime/checks';
import { forceUser } from '../support/duelSim';
import { devCharacter } from '../support/fightHarness';

describe('D-234: fatigue keeps biting past 1x capacity', () => {
  it('0.825 at 1.0 (no step), 0.68 at 2x, 0.54 at 3x, 0.40 at the 4.0 hard limit, never below', () => {
    expect(fatigueLevelFactor(0.4)).toBeCloseTo(1, 9);
    expect(fatigueLevelFactor(1.0)).toBeCloseTo(0.825, 9);
    expect(fatigueLevelFactor(1.0001)).toBeCloseTo(0.825, 3);
    expect(fatigueLevelFactor(2)).toBeCloseTo(0.6833, 3);
    expect(fatigueLevelFactor(3)).toBeCloseTo(0.5417, 3);
    expect(fatigueLevelFactor(4)).toBeCloseTo(0.4, 9);
    expect(fatigueLevelFactor(6)).toBeCloseTo(0.4, 9);
    for (let f = 0; f < 4; f += 0.05) expect(fatigueLevelFactor(f + 0.05)).toBeLessThanOrEqual(fatigueLevelFactor(f) + 1e-12);
  });
  it('a fighter at 3x capacity fights far below one at 1.1x (was the same 77.5%)', () => {
    const at = (x: number): number => { const f = forceUser('pc', 50); return fighterEffectiveLevel({ ...f, meters: { ...f.meters, p: f.caps.p * x } }); };
    expect(at(3) / at(1.1)).toBeLessThan(0.7);
  });
});

describe('D-230: form drills count toward a lost leg', () => {
  const withLasting = async (kind: LastingInjury['kind'], part: LastingInjury['part']) => {
    const s = await devCharacter('knight', 30);
    const l: LastingInjury = { id: 'pc:l1', kind, part, adaptation: 0, aid: 'qualityCybernetic', adaptedToday: 0, adaptDay: -1, day: s.clock.now.day };
    return { ...s, health: { ...s.health, lasting: [l] } };
  };
  it(`a lost leg: Agility and Endurance in full, a form at ${LEG_FORM_SHARE}; Willpower not at all`, async () => {
    const s = await withLasting('lostLeg', 'leftLeg');
    const adapt = (hours: Record<string, number>): number => applyEvents(REGISTRY, s, [{ type: 'adaptationTrained', hours }], { source: 'engine' }).state.health.lasting[0]!.adaptation;
    expect(adapt({ agility: 1 })).toBeCloseTo(0.01, 9);
    expect(adapt({ soresu: 1 })).toBeCloseTo(0.01 * LEG_FORM_SHARE, 9);
    expect(adapt({ willpower: 1 })).toBe(0);
  });
  it('a lost hand still counts every form hour in full', async () => {
    const s = await withLasting('lostHand', 'rightHand');
    expect(applyEvents(REGISTRY, s, [{ type: 'adaptationTrained', hours: { soresu: 1 } }], { source: 'engine' }).state.health.lasting[0]!.adaptation).toBeCloseTo(0.01, 9);
  });
});

describe('D-235: the 4.0x floor uses the clamp\'s Y_avg table', () => {
  it('Anakin (start 9): 41 no sooner than about 3.22 y (D-460: K 11.64, the re-measured table); the floor rises with the tier', () => {
    expect(paceFloorYears(9, 41)).toBeCloseTo(3.22, 1);
    const tiers = [21, 41, 61, 81, 101];
    for (let i = 1; i < tiers.length; i++) expect(paceFloorYears(9, tiers[i]!)).toBeGreaterThan(paceFloorYears(9, tiers[i - 1]!));
    // D-459: "below the Average's target / 4 for an age-4 start" no longer holds: the table has no form XP before the
    // Initiate saber gate (about 5.7) and ramps linearly from 0 at 4 to 550 at 8, so that floor runs 2.9 / 5.4 / 8.5 y at
    // 21 / 41 / 61 (targets / 4: 1.25 / 4.0 / 8.0). Reported; the Anakin floor above is unchanged in kind.
    expect(paceFloorYears(4, 41)).toBeGreaterThan(paceFloorYears(9, 41));
  });
});
