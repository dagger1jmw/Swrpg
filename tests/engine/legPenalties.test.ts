// D-251 (a lost leg slows form strikes: 0.5 x the leg's Agility P x (1 - A)), D-252 (the leg's Endurance P cuts the
// fatigue meters' capacity, x (1 - A)), D-253 (a prosthetic fitted at once keeps the dominant hand).
import { describe, expect, it } from 'vitest';
import { LEG_FORM_PENALTY_SHARE } from '../../src/data/health.config';
import { fighterEffectiveLevel } from '../../src/engine/duel';
import { lastingPenalty, type LastingInjury } from '../../src/engine/lasting';
import { capacities } from '../../src/engine/fatigue';
import { buildPlayerFighter } from '../../src/features/combat/build';
import { selectInjuredSkills, selectLasting, selectMaxVitality } from '../../src/features/health/selectors';
import { maxVitalityWithLasting } from '../../src/engine/vitality';
import { capacityEndurance, selectCapacities, selectPerformance } from '../../src/features/progression/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import { testStartInput } from '../../src/turn/testStart';
import { TEST_START_DATE } from '../support/dates';
import { forceUser } from '../support/duelSim';

const leg = (adaptation: number, aid: LastingInjury['aid'] = 'qualityCybernetic', kind: LastingInjury['kind'] = 'lostLeg'): LastingInjury => ({ id: 'l', kind, part: 'leftLeg', adaptation, aid, adaptedToday: 0, adaptDay: 0, day: 0 });
async function knight(seed: string): Promise<GameState> {
  const input = testStartInput({ name: 'Kael Dorran', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed)).state;
}
const ok = (s: GameState, t: string): GameState => {
  const o = runDevCommand(REGISTRY, s, t);
  if (!o.ok) throw new Error(o.line);
  return o.state;
};

describe('D-251: a lost or prosthetic leg slows form strikes', () => {
  it('forms P = 0.5 x 0.35 x (1 - A), any aid; no form penalty once fully adapted', () => {
    expect(LEG_FORM_PENALTY_SHARE).toBe(0.5);
    expect(lastingPenalty([leg(0)], 'soresu')).toBeCloseTo(0.175, 9);
    expect(lastingPenalty([leg(0.6)], 'soresu')).toBeCloseTo(0.07, 9);
    expect(lastingPenalty([leg(1)], 'soresu')).toBeCloseTo(0, 9);
    expect(lastingPenalty([leg(0, 'none')], 'soresu')).toBeCloseTo(0.175, 9);
    // Agility keeps the full 0.35 x (1 - A).
    expect(lastingPenalty([leg(0.6)], 'agility')).toBeCloseTo(0.14, 9);
  });
  it('the duel level of a form fighter drops by it', () => {
    const whole = forceUser('a', 50);
    const oneLeg = forceUser('a', 50, { lasting: [leg(0.2)] });
    expect(fighterEffectiveLevel(oneLeg) / fighterEffectiveLevel(whole)).toBeCloseTo(1 - 0.175 * 0.8, 6);
  });
  it('form practice is not adaptation training for a leg: the routine trains forms as before (D-230\'s pace kept)', async () => {
    const s = ok(await knight('route'), '/sever left leg');
    expect(selectInjuredSkills(s).adapt).not.toContain('soresu');
    // Agility rests while the severe leg wound heals; Endurance is trained as adaptation.
    expect(selectInjuredSkills(s).adapt).toContain('endurance');
  });
});

describe('D-252: the leg\'s Endurance penalty cuts the fatigue meters\' capacity', () => {
  it('capacityEndurance: x (1 - 0.15 x (1 - A)) for a leg; burns or lung damage x (1 - 0.4 x (1 - A)) (D-254)', () => {
    expect(capacityEndurance(40, [leg(0)])).toBeCloseTo(34, 9);
    expect(capacityEndurance(40, [leg(0.5)])).toBeCloseTo(37, 9);
    expect(capacityEndurance(40, [leg(1)])).toBeCloseTo(40, 9);
    expect(capacityEndurance(40, [leg(0, 'none', 'burnsOrLungs')])).toBeCloseTo(24, 9);
    expect(capacityEndurance(40, [leg(0.5, 'scarTissue', 'burnsOrLungs')])).toBeCloseTo(32, 9);
    // Both: multiplicative, as lasting penalties combine.
    expect(capacityEndurance(40, [leg(0), leg(0, 'none', 'burnsOrLungs')])).toBeCloseTo(40 * 0.85 * 0.6, 9);
    // Joint damage has no Endurance penalty.
    expect(capacityEndurance(40, [leg(0, 'scarTissue', 'jointDamage')])).toBe(40);
  });
  it('the player\'s capacity drops after /sever left leg and recovers with adaptation; the duel uses it', async () => {
    const s0 = await knight('cap');
    const s1 = ok(s0, '/sever left leg');
    const a = selectLasting(s1).find((l) => l.kind === 'lostLeg')!.adaptation;
    const expected = capacities(selectPerformance(s1, 'endurance') * (1 - 0.15 * (1 - a)), 0, 0).p;
    expect(selectCapacities(s1).p).toBeCloseTo(expected, 6);
    expect(selectCapacities(s1).p).toBeLessThan(selectCapacities(s0).p);
    expect(buildPlayerFighter(s1).caps.p).toBeCloseTo(selectCapacities(s1).p, 9);
    const s2 = ok(s1, '/skip 40 days');
    expect(selectCapacities(s2).p).toBeGreaterThan(selectCapacities(s1).p);
  });
});

describe('D-255: max Vitality uses the lasting Endurance penalty', () => {
  it('max x (1 - the combined lasting Endurance penalty); the player and an NPC fighter', async () => {
    expect(maxVitalityWithLasting(60, 0)).toBe(60);
    expect(maxVitalityWithLasting(60, lastingPenalty([leg(0)], 'endurance'))).toBeCloseTo(51, 9);
    expect(maxVitalityWithLasting(60, lastingPenalty([leg(0, 'none', 'burnsOrLungs')], 'endurance'))).toBeCloseTo(36, 9);
    const s0 = await knight('mv');
    const s1 = ok(s0, '/sever left leg');
    const a = selectLasting(s1).find((l) => l.kind === 'lostLeg')!.adaptation;
    expect(selectMaxVitality(s1)).toBeCloseTo(selectMaxVitality(s0) * (1 - 0.15 * (1 - a)), 6);
    expect(buildPlayerFighter(s1).maxVitality).toBeCloseTo(selectMaxVitality(s1), 9);
  });
});

describe('D-253: a prosthetic fitted at once keeps the dominant hand', () => {
  it('/sever right arm and /sever right hand: the hand stays right, the fighter still fights with it', async () => {
    for (const limb of ['right arm', 'right hand']) {
      const s = ok(await knight(`hand-${limb}`), `/sever ${limb}`);
      expect(s.character.dominantHand).toBe('right');
      expect(buildPlayerFighter(s).weaponHand).toBe('right');
      const f = ok(s, '/fight 1 duelist at -30');
      expect(f.combat.active).not.toBeNull();
    }
  });
});
