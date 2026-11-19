// Wounds that change how, or whether, a fighter fights (D-198): a severed leg ends the duel for that fighter; the
// weapon-arm rule (built, off until M6) switches hands or ends it.
import { afterEach, describe, expect, it } from 'vitest';
import { WOUND_FIGHTING } from '../../src/data/health.config';
import { cannotDuel, cannotStand, fighterEffectiveLevel, resolveExchange, runUntilBeat, settleEnd, startDuel, weaponArmState, type Fighter } from '../../src/engine/duel';
import type { LastingInjury } from '../../src/engine/lasting';
import { seedRng } from '../../src/engine/rng';
import type { Wound } from '../../src/engine/wounds';
import { forceUser, REAL } from '../support/duelSim';

const wound = (part: Wound['part'], severity: Wound['severity'], over: Partial<Wound> = {}): Wound => ({ id: `w-${part}`, part, severity, W: 27, stabilized: false, healProgress: 0, day: 0, source: 'combat', ...over });
const lostLeg = (aid: LastingInjury['aid']): LastingInjury => ({ id: 'l1', kind: 'lostLeg', part: 'leftLeg', adaptation: 0, aid, adaptedToday: 0, adaptDay: 0, day: 0 });
const cfg = WOUND_FIGHTING as { severedLegOut: boolean; weaponArmLost: boolean; weaponArm: boolean };
afterEach(() => {
  cfg.severedLegOut = true;
  cfg.weaponArm = false;
});

describe('a severed leg (D-198, lore-required)', () => {
  it('a fighter whose leg is severed cannot stand or duel; a wounded leg can', () => {
    expect(cannotStand(forceUser('x', 50, { wounds: [wound('rightLeg', 'severe', { severed: true })] }))).toBe(true);
    expect(cannotDuel(forceUser('x', 50, { wounds: [wound('rightLeg', 'severe', { severed: true })] }))).toBe('leg');
    expect(cannotStand(forceUser('x', 50, { wounds: [wound('rightLeg', 'severe')] }))).toBe(false);
    expect(cannotStand(forceUser('x', 50, { wounds: [wound('rightArm', 'severe', { severed: true })] }))).toBe(false);
  });
  it('a prosthetic or cybernetic leg is exempt; a leg lost with no prosthetic is not', () => {
    for (const aid of ['basicProsthetic', 'qualityCybernetic'] as const) expect(cannotStand(forceUser('x', 50, { lasting: [lostLeg(aid)] })), aid).toBe(false);
    for (const aid of ['none', 'scarTissue'] as const) expect(cannotStand(forceUser('x', 50, { lasting: [lostLeg(aid)] })), aid).toBe(true);
  });
  it('the duel ends when the opponent loses a leg, and nobody fights on one leg', () => {
    const b = forceUser('B', 50, { wounds: [wound('leftLeg', 'severe', { severed: true })] });
    const s = settleEnd(startDuel(forceUser('A', 50), [b], seedRng('leg')));
    expect(s.end).toEqual({ winner: 'A', reason: 'allOut' });
    expect(s.opponents[0]!.out).toBe(true);
    // The player too: out of the fight, the opponent decides what happens next.
    const lost = settleEnd(startDuel(forceUser('A', 50, { wounds: [wound('leftLeg', 'severe', { severed: true })] }), [forceUser('B', 50)], seedRng('leg2')));
    expect(lost.end?.winner).toBe('B');
    // In 400 lethal duels no exchange is ever fought by someone who has lost a leg.
    for (let i = 0; i < 400; i++) {
      const end = runUntilBeat(startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng(`d${i}`)), REAL, 0, 'toEnd', 2000).state;
      const legless = [end.a, ...end.opponents].filter((f) => f.wounds.some((w) => w.severed && w.part.endsWith('Leg')));
      for (const f of legless) {
        expect(f.out).toBe(true);
        const at = end.log.findIndex((r) => r.hit?.severed && r.hit.part.endsWith('Leg'));
        expect(end.log.length - 1, `duel ${i}`).toBe(at);
      }
    }
  });
  it('the exchange that severs the leg says so', () => {
    let noted = false;
    for (let i = 0; i < 3000 && !noted; i++) {
      let s = startDuel(forceUser('A', 70), [forceUser('B', 40)], seedRng(`n${i}`));
      for (let k = 0; k < 60 && !s.end; k++) s = resolveExchange(s, REAL, 0);
      const r = s.log.find((x) => x.hit?.severed && x.hit.part.endsWith('Leg'));
      if (r) {
        expect(r.notes.join(' ')).toMatch(/has lost a leg and cannot stand: out of the fight/);
        noted = true;
      }
    }
    expect(noted).toBe(true);
  });
  it('minions follow their own rule (out on a moderate wound), not this one', () => {
    expect(cannotDuel(forceUser('m', 20, { minion: true, wounds: [wound('leftLeg', 'severe', { severed: true })] }))).toBeNull();
  });
});

describe('the weapon arm (D-198; the loss adopted by D-244, the hand switch off)', () => {
  it('a severe wound to the weapon arm changes only the usual penalties (the hand switch is off)', () => {
    expect(WOUND_FIGHTING.weaponArm).toBe(false);
    expect(weaponArmState(forceUser('x', 50, { wounds: [wound('rightArm', 'severe')] }))).toBe('ok');
  });
  it('D-244: a severed weapon arm or hand ends the duel; an off-hand weapon fights on at the penalty; a prosthetic is whole', () => {
    expect(WOUND_FIGHTING.weaponArmLost).toBe(true);
    expect(cannotDuel(forceUser('x', 50, { wounds: [wound('rightArm', 'severe', { severed: true })] }))).toBe('arm');
    expect(cannotDuel(forceUser('x', 50, { wounds: [wound('rightHand', 'severe', { severed: true })] }))).toBe('arm');
    expect(cannotDuel(forceUser('x', 50, { wounds: [wound('leftArm', 'severe', { severed: true })] }))).toBeNull();
    const second = forceUser('x', 50, { offHandWeapon: 'lightsaber', wounds: [wound('rightArm', 'severe', { severed: true })] });
    expect(weaponArmState(second)).toBe('offHand');
    expect(cannotDuel(second)).toBeNull();
    const whole = fighterEffectiveLevel(forceUser('x', 50, { wounds: [wound('leftArm', 'severe', { severed: true })] }));
    expect(fighterEffectiveLevel(second)).toBeCloseTo(whole * (1 - WOUND_FIGHTING.offHandPenalty), 6);
    const fitted = forceUser('x', 50, { wounds: [wound('rightArm', 'severe', { severed: true })], lasting: [{ id: 'l', kind: 'lostArm', part: 'rightArm', adaptation: 0.5, aid: 'qualityCybernetic', adaptedToday: 0, adaptDay: 0, day: 0 }] });
    expect(cannotDuel(fitted)).toBeNull();
    // A left-handed fighter mirrors it.
    expect(cannotDuel(forceUser('x', 50, { weaponHand: 'left', wounds: [wound('leftHand', 'severe', { severed: true })] }))).toBe('arm');
  });
  it('when on: a severe wound switches to the off hand at the penalty; a severed weapon arm ends the fight; the other arm does neither', () => {
    cfg.weaponArm = true;
    const base = fighterEffectiveLevel(forceUser('x', 50, { wounds: [wound('leftArm', 'severe')] }));
    const off = forceUser('x', 50, { wounds: [wound('rightArm', 'severe')] });
    expect(weaponArmState(off)).toBe('offHand');
    expect(fighterEffectiveLevel(off)).toBeCloseTo(base * (1 - WOUND_FIGHTING.offHandPenalty), 6);
    expect(weaponArmState(forceUser('x', 50, { wounds: [wound('rightArm', 'moderate')] }))).toBe('ok');
    expect(weaponArmState(forceUser('x', 50, { wounds: [wound('rightArm', 'severe', { healProgress: 1 })] }))).toBe('ok');
    expect(cannotDuel(forceUser('x', 50, { wounds: [wound('rightHand', 'severe', { severed: true })] }))).toBe('arm');
    expect(cannotDuel(forceUser('x', 50, { wounds: [wound('leftHand', 'severe', { severed: true })] }))).toBeNull();
    // A left-handed fighter mirrors it.
    const lefty: Partial<Fighter> = { weaponHand: 'left', wounds: [wound('leftArm', 'critical')] };
    expect(weaponArmState(forceUser('x', 50, lefty))).toBe('offHand');
  });
});
