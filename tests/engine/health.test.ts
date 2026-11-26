// health.md §10 required tests (engine level; tests 2 and 13 run at the feature level) and progression-numbers test 23.
import { describe, expect, it } from 'vitest';
import { FORCE_BASE_LOAD } from '../../src/data/health.config';
import { applyDamage, bypassFraction, damageOf, hazardDamage, severityOf, severs } from '../../src/engine/damage';
import { applyForceLoad, forceCapacity, forceLoadPerUse } from '../../src/engine/forceMeter';
import { baseHealDays, healMultiplier, healsOvernight, lastingChance, progressHealing } from '../../src/engine/healing';
import { adapt, lastingPenalty, type LastingInjury } from '../../src/engine/lasting';
import { maxVitality, recoverVitality } from '../../src/engine/vitality';
import {
  dyingMinutes,
  isDying,
  isIncapacitated,
  killsWhileDying,
  stabilize,
  statusLabel,
  suppressionCrashMental,
  takesMinionOut,
  willpowerSuppression,
  woundPenalty,
  type Wound,
} from '../../src/engine/wounds';

const wound = (over: Partial<Wound>): Wound => ({ id: 'w', part: 'torso', severity: 'minor', W: 5, stabilized: false, healProgress: 0, day: 0, source: 'test', ...over });

describe('Vitality (health §3)', () => {
  it('max Vitality reference values: youngling 32, Knight 63.5, Master 97', () => {
    expect(maxVitality({ endurance: 15, strength: 10, bodyAbility: 0 })).toBeCloseTo(32);
    expect(maxVitality({ endurance: 50, strength: 45, bodyAbility: 0 })).toBeCloseTo(63.5);
    expect(maxVitality({ endurance: 80, strength: 70, bodyAbility: 40 })).toBeCloseTo(97);
  });
  it('recovers 50% per hour at rest, 15% light, none in combat', () => {
    expect(recoverVitality(0, 60, 1, 'rest')).toBe(30);
    expect(recoverVitality(0, 60, 1, 'light')).toBeCloseTo(9);
    expect(recoverVitality(10, 60, 1, 'combat')).toBe(10);
  });
  it('test 1: Vitality at 0 never changes status by itself', () => {
    const r = applyDamage(10, 30, 0, true);
    expect(r.vitality).toBe(0);
    expect(r.W).toBe(0);
    expect(statusLabel([])).toBe('Healthy');
  });
});

describe('damage (health §4)', () => {
  it('test 3 (amended by D-161): rifle grazes below margin 8 are Vitality-only until Vitality is empty, then a minor wound; wounds follow the margin', () => {
    let v = 63.5;
    const graze = damageOf({ weapon: 'blasterRifle', quality: 'graze', armor: 'none', saberResistant: false });
    expect(graze).toBe(10);
    for (let i = 0; i < 6; i++) {
      const r = applyDamage(v, graze, bypassFraction('blasterRifle', 'graze', 6), false, true);
      expect(r.W).toBe(0);
      v = r.vitality;
    }
    // Past an empty Vitality the overflow is banded: a graze is a minor wound (a lightsaber's overflow would go straight in).
    const seventh = applyDamage(v, graze, bypassFraction('blasterRifle', 'graze', 6), false, true);
    expect(seventh.vitality).toBe(0);
    expect(severityOf(seventh.W)).toBe('minor');
    const W = (q: 'solid' | 'clean' | 'critical', m: number) => applyDamage(63.5, damageOf({ weapon: 'blasterRifle', quality: q, armor: 'none', saberResistant: false }), bypassFraction('blasterRifle', q, m), false, true).W;
    expect(severityOf(W('solid', 11))).toBe('minor');
    expect(severityOf(W('clean', 14))).toBe('moderate');
    expect(severityOf(W('critical', 17))).toBe('severe');
  });
  it('test 4: a clean saber hit to the torso is mortal (D 60, fully bypassed); to a limb it severs', () => {
    const D = damageOf({ weapon: 'lightsaber', quality: 'clean', armor: 'none', saberResistant: false });
    expect(D).toBe(60);
    const r = applyDamage(63.5, D, bypassFraction('lightsaber', 'clean', 12));
    expect(r.W).toBe(60);
    expect(severityOf(r.W)).toBe('mortal');
    expect(severs('lightsaber', 'leftArm', r.W)).toBe(true);
    expect(severs('lightsaber', 'torso', r.W)).toBe(false);
  });
  it('test 5: a solid saber hit sends 50% to wounds (severe wound, 20 off Vitality)', () => {
    const r = applyDamage(63.5, 40, bypassFraction('lightsaber', 'solid', 8));
    expect(r.W).toBe(20);
    expect(severityOf(r.W)).toBe('severe');
    expect(r.vitalityLost).toBe(20);
  });
  it('armor counts x0.25 against sabers unless saber-resistant', () => {
    expect(damageOf({ weapon: 'lightsaber', quality: 'solid', armor: 'heavy', saberResistant: false })).toBe(37.5);
    expect(damageOf({ weapon: 'lightsaber', quality: 'solid', armor: 'heavy', saberResistant: true })).toBe(30);
  });
  it('training sabers never bypass Vitality (D-144)', () => {
    expect(bypassFraction('trainingSaber', 'critical', 20)).toBe(0);
  });
  it('hazards (D-149): severity 1 a minor wound, 2 moderate, 3 severe for a fall', () => {
    const at = (s: 1 | 2 | 3) => {
      const h = hazardDamage('fall', s);
      return severityOf(applyDamage(60, h.D, h.bypass, false, true).W);
    };
    expect(at(1)).toBe('minor');
    expect(at(2)).toBe('moderate');
    expect(at(3)).toBe('severe');
  });
});

describe('status, dying and death (health §6)', () => {
  it('test 6: dying timer End 50 = 15 min; stabilizing converts mortal to critical; a second mortal while Dying kills', () => {
    expect(dyingMinutes(50)).toBe(15);
    const ws = [wound({ severity: 'mortal', W: 60 })];
    expect(isDying(ws)).toBe(true);
    const st = stabilize(ws);
    expect(isDying(st)).toBe(false);
    expect(statusLabel(st)).toBe('Wounded');
    expect(killsWhileDying(ws, wound({ severity: 'mortal', W: 55, part: 'leftLeg' }))).toBe(true);
    expect(killsWhileDying(st, wound({ severity: 'mortal', W: 55 }))).toBe(false);
  });
  it('incapacitated at load 20+ or a critical torso / head wound', () => {
    expect(isIncapacitated([wound({ severity: 'critical', W: 40, part: 'head' })])).toBe(true);
    expect(isIncapacitated([wound({ severity: 'critical', W: 40, part: 'leftLeg' })])).toBe(false);
    expect(isIncapacitated([wound({ severity: 'critical', W: 40, part: 'leftLeg' }), wound({ id: 'w2', severity: 'critical', W: 40, part: 'rightLeg' })])).toBe(true);
  });
  it('the penalty is status + location, capped at 50%', () => {
    const ws = [wound({ severity: 'moderate', W: 12, part: 'rightArm' })];
    expect(woundPenalty(ws, 'soresu', { willpower: 0 })).toBeCloseTo(0.0225 + 0.05);
    expect(woundPenalty(ws, 'meditation', { willpower: 0 })).toBeCloseTo(0.0225);
    const many = Array.from({ length: 6 }, (_, i) => wound({ id: `w${i}`, severity: 'severe', W: 25, part: 'rightArm' }));
    expect(woundPenalty(many, 'soresu', { willpower: 0 })).toBe(0.5);
  });
  it('the penalty eases as the wound heals: scaled by the unhealed share (D-203; combat pass 1: -12% at 67% healed)', () => {
    const fresh = [wound({ severity: 'severe', W: 25, part: 'rightArm' })];
    const twoThirds = [wound({ severity: 'severe', W: 25, part: 'rightArm', healProgress: 2 / 3 })];
    const full = woundPenalty(fresh, 'soresu', { willpower: 0 });
    expect(full).toBeGreaterThan(0.1);
    expect(woundPenalty(twoThirds, 'soresu', { willpower: 0 })).toBeCloseTo(full / 3);
    expect(woundPenalty([wound({ severity: 'severe', W: 25, part: 'rightArm', healProgress: 1 })], 'soresu', { willpower: 0 })).toBe(0);
    // The wound load and its label do not ease until the wound has healed.
    expect(statusLabel(twoThirds)).toBe(statusLabel(fresh));
  });
  it('test 9: pain suppression changes penalties only, never status or timers', () => {
    const ws = [wound({ severity: 'severe', W: 25 })];
    const before = { label: statusLabel(ws), dying: isDying(ws) };
    expect(woundPenalty(ws, 'soresu', { willpower: 0, suppression: 0.6 })).toBeLessThan(woundPenalty(ws, 'soresu', { willpower: 0 }));
    expect({ label: statusLabel(ws), dying: isDying(ws) }).toEqual(before);
  });
  it('test 10: minions leave the fight on a moderate wound', () => {
    expect(takesMinionOut('minor')).toBe(false);
    expect(takesMinionOut('moderate')).toBe(true);
  });
  it('test 11: Willpower 60 removes 15% of wound penalties; 100+ removes 25% (cap)', () => {
    expect(willpowerSuppression(60)).toBeCloseTo(0.15);
    expect(willpowerSuppression(100)).toBe(0.25);
    expect(willpowerSuppression(140)).toBe(0.25);
  });
  it('test 12: ending Battlemind or Force Valor while wounded adds +0.5 mental load', () => {
    expect(suppressionCrashMental([wound({})])).toBe(0.5);
    expect(suppressionCrashMental([])).toBe(0);
  });
});

describe('healing (health §7, D-150)', () => {
  it('test 7: healing times per severity and multiplier', () => {
    const days = (w: Wound, mult: number) => baseHealDays(w) / mult;
    expect(days(wound({ severity: 'moderate', W: 12 }), healMultiplier({ care: 'none' }))).toBe(7);
    expect(days(wound({ severity: 'severe', W: 25 }), healMultiplier({ care: 'none' }))).toBe(21);
    expect(days(wound({ severity: 'critical', W: 40 }), healMultiplier({ care: 'none' }))).toBe(45);
    expect(days(wound({ severity: 'mortal', W: 60, stabilized: true }), healMultiplier({ care: 'none' }))).toBe(90);
    expect(days(wound({ severity: 'moderate', W: 12 }), healMultiplier({ care: 'medical' }))).toBe(3.5);
    // A kolto tank: a minor wound in 6 hours at x4 (health §7's tank); bacta x5 (D-511) in 4.8.
    expect(days(wound({ severity: 'minor' }), healMultiplier({ care: 'kolto' })) * 24).toBe(6);
    expect(days(wound({ severity: 'minor' }), healMultiplier({ care: 'bacta' })) * 24).toBeCloseTo(4.8);
    expect(healMultiplier({ care: 'medical', healerLevel: 50 })).toBe(4);
    expect(healMultiplier({ care: 'medical', trainingInjured: true })).toBe(1);
  });
  it('bacta replaces medical care (no stacking); a Force healer multiplies on top; the cap is x6', () => {
    expect([healMultiplier({ care: 'kolto' }), healMultiplier({ care: 'bacta' })]).toEqual([4, 5]);
    expect(healMultiplier({ care: 'bacta', healerLevel: 100 })).toBe(6);
  });
  it('progress accumulates day by day; minor wounds heal overnight on 7h+ sleep', () => {
    let w = wound({ severity: 'moderate', W: 12 });
    for (let d = 0; d < 7; d++) w = progressHealing(w, 1, 1);
    expect(w.healProgress).toBeCloseTo(1);
    expect(healsOvernight(wound({}), 7)).toBe(true);
    expect(healsOvernight(wound({}), 6)).toBe(false);
  });
  it('lasting chance: severe 10%, critical 35%, stabilized mortal 70%; none for minor', () => {
    expect(lastingChance(wound({ severity: 'severe', W: 25 }))).toBe(0.1);
    expect(lastingChance(wound({ severity: 'critical', W: 40 }))).toBe(0.35);
    expect(lastingChance(wound({ severity: 'mortal', W: 60, stabilized: true }))).toBe(0.7);
    expect(lastingChance(wound({}))).toBe(0);
  });
});

describe('Force meter (health §2)', () => {
  it('test 8: capacity and loads match; backlash only above 1.0 (1.3 when channeling anger)', () => {
    expect(forceCapacity(0, 0)).toBe(3);
    expect(forceCapacity(100, 100)).toBe(7);
    expect(forceLoadPerUse(FORCE_BASE_LOAD['forcePush']!, 'standard', 0)).toBeCloseTo(0.15);
    expect(forceLoadPerUse(0.3, 'allOut', 120)).toBeCloseTo(0.3 * 3.5 * 0.4);
    const cap = 3;
    const under = applyForceLoad({ p: 0, m: 0, f: 2.5 }, cap, 0.5);
    expect(under.overLimit).toBe(false);
    expect(under.backlashMental).toBe(0);
    const over = applyForceLoad({ p: 0, m: 0, f: 2.8 }, cap, 0.6);
    expect(over.overLimit).toBe(true);
    expect(over.backlashMental).toBeCloseTo(0.2);
    const anger = applyForceLoad({ p: 0, m: 0, f: 2.8 }, cap, 0.6, true);
    expect(anger.overLimit).toBe(false);
    expect(anger.backlashMental).toBe(0);
    expect(anger.angerPointsOver1).toBeCloseTo(0.4);
  });
});

describe('lasting injuries (progression-numbers §18, test 23)', () => {
  const injury = (aid: LastingInjury['aid']): LastingInjury => ({ id: 'l', kind: 'lostHand', part: 'rightHand', adaptation: 0, aid, adaptedToday: 0, adaptDay: -1, day: 0 });
  it('a quality cybernetic reaches full adaptation in 30-40 days at 3h/day; a basic prosthetic leaves 8%', () => {
    let l = injury('qualityCybernetic');
    let days = 0;
    while (l.adaptation < 1 - 1e-9 && days < 100) l = adapt(l, 3, days++);
    expect(days).toBeGreaterThanOrEqual(30);
    expect(days).toBeLessThanOrEqual(40);
    expect(lastingPenalty([l], 'soresu')).toBeCloseTo(0);
    let b = injury('basicProsthetic');
    for (let d = 0; d < 100; d++) b = adapt(b, 3, d);
    expect(lastingPenalty([b], 'soresu')).toBeCloseTo(0.08);
  });
  it('adaptation is at most 3% a day', () => {
    const l = adapt(adapt(injury('qualityCybernetic'), 2, 5), 2, 5);
    expect(l.adaptation).toBeCloseTo(0.03);
  });
});
