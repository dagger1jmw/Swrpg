// opt-2 E (audit U2; Jared: wire them): pain suppression, training an injured part, the martial styles' shared rules, one path to
// the lasting-injury chance.
import { describe, expect, it } from 'vitest';
import { LASTING_CHANCE, SUPPRESSION_CRASH_MENTAL } from '../../src/data/health.config';
import { xpForLevel } from '../../src/engine/curve';
import { lastingChance } from '../../src/engine/healing';
import { lastingChanceAt } from '../../src/engine/medicine';
import { forceSensePrecog, precogDefence, stackedSkill } from '../../src/engine/martialStyles';
import type { Wound } from '../../src/engine/wounds';
import { selectSuppression, selectWoundPenalty } from '../../src/features/health/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { base } from '../support/schemaSituations';

const ev = (s: GameState, events: object[], source: 'ai' | 'player' | 'engine' = 'player') => applyEvents(REGISTRY, s, events, { source });
const wound = (o: Partial<Wound>): Wound => ({ id: 'w1', part: 'rightArm', severity: 'severe', W: 25, stabilized: false, healProgress: 0, day: 0, source: 'test', ...o }) as Wound;
/** A trained Knight: Force Control and Battle Meditation at 60 (base() has no starting XP). */
const trained = (s: GameState): GameState => {
  const skill = (xp: number) => ({ ...(Object.values(s.progression.skills)[0] ?? {}), xp, rust: 0 });
  return { ...s, progression: { ...s.progression, skills: { ...s.progression.skills, forceControl: skill(xpForLevel(60)), battleMeditation: skill(xpForLevel(60)) } as GameState['progression']['skills'] } };
};
const hurt = (s: GameState, ...w: Wound[]): GameState => ({ ...trained(s), health: { ...s.health, wounds: w as GameState['health']['wounds'] } });
const later = (s: GameState, seconds: number): GameState => ev(s, [{ type: 'timeElapsed', seconds, reason: 'time passes' }], 'ai').state;

describe('E1: pain suppression in play', () => {
  it('Control Pain eases the wound penalty by min(60%, Force Control / 150), never the status', () => {
    const s0 = hurt(base(), wound({}));
    const before = selectWoundPenalty(s0, 'soresu');
    const r = ev(s0, [{ type: 'suppressionBegun', abilityId: 'controlPain' }]);
    expect(r.rejected).toEqual([]);
    const share = selectSuppression(r.state);
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThanOrEqual(0.6);
    expect(selectWoundPenalty(r.state, 'soresu')).toBeLessThan(before);
    expect(r.state.health.wounds).toEqual(s0.health.wounds);
  });

  it('the narrator may start it when the player asks; a career cannot; channeling is a Sith\'s', () => {
    const s0 = hurt(base(), wound({}));
    expect(ev(s0, [{ type: 'suppressionBegun', abilityId: 'controlPain' }], 'ai').rejected).toEqual([]);
    // A career has no Force powers, whatever its sheet shows.
    expect(ev(hurt(base({ path: 'career', archetype: 'soldier' }), wound({})), [{ type: 'suppressionBegun', abilityId: 'controlPain' }]).rejected).toHaveLength(1);
    expect(ev(s0, [{ type: 'suppressionBegun', abilityId: 'painChanneling' }]).rejected).toHaveLength(1);
  });

  it('a dying commander can use it (staying at the post)', () => {
    const s0 = hurt(base(), wound({ part: 'torso', severity: 'mortal', W: 60 }));
    expect(ev(s0, [{ type: 'suppressionBegun', abilityId: 'controlPain' }]).rejected).toEqual([]);
  });

  it('it costs Force load by the minute; ending Battlemind while wounded crashes (+0.5 mental load)', () => {
    const s0 = hurt(base(), wound({}));
    const on = ev(s0, [{ type: 'suppressionBegun', abilityId: 'battlemind' }]).state;
    const f0 = on.health.meters.f;
    const ran = later(on, 600);
    expect(ran.health.meters.f).toBeGreaterThan(f0);
    const off = ev(ran, [{ type: 'suppressionEnded', abilityId: 'battlemind' }]).state;
    expect(off.health.meters.m).toBeCloseTo(ran.health.meters.m + SUPPRESSION_CRASH_MENTAL, 6);
    expect(off.health.suppression).toEqual([]);
  });

  it('it ends by itself when no wound is left', () => {
    const on = ev(hurt(base(), wound({})), [{ type: 'suppressionBegun', abilityId: 'controlPain' }]).state;
    const healed = later({ ...on, health: { ...on.health, wounds: [] } }, 60);
    expect(healed.health.suppression).toEqual([]);
  });
});

describe('E2: training an injured part', () => {
  it('a session on a skill the wound penalizes marks the wound; that day it heals at half the rate', () => {
    const s0 = hurt(base(), wound({ part: 'rightArm', severity: 'moderate', W: 12 }));
    const r = ev(s0, [{ type: 'injuredPartTrained', skills: ['soresu'] }], 'engine');
    const marked = r.state.health.wounds[0]!;
    expect(marked.trainedDay).toBe(s0.clock.now.day);
    // Through the next midnight: half the progress of the unmarked wound.
    const toMidnight = 86_400 - s0.clock.now.second + 60;
    const run = (s: GameState) => advanceTime(REGISTRY, s, { seconds: toMidnight, reason: 'a day', source: 'turnDraft' }).state;
    const a = run(s0).health.wounds[0]!.healProgress;
    const b = run(r.state).health.wounds[0]?.healProgress ?? 0;
    expect(b).toBeGreaterThan(0);
    expect(b).toBeLessThan(a);
  });
});

describe('E3, E4: one path for each rule', () => {
  it('the duel\'s precognition and stacked skill are the shared functions', () => {
    expect(precogDefence(80, 0)).toBe(forceSensePrecog(80));
    expect(stackedSkill(50, 1, 4)).toBe(54);
  });
  it('the lasting chance comes from one reader of the table', () => {
    expect(lastingChanceAt('critical')).toBe(LASTING_CHANCE.critical);
    expect(lastingChance(wound({ severity: 'critical' }))).toBe(LASTING_CHANCE.critical);
    expect(lastingChance(wound({ severity: 'mortal', stabilized: true }))).toBe(LASTING_CHANCE.stabilizedMortal);
  });
});
