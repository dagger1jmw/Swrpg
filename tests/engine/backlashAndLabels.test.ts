// D-194: backlash mental load reaches the character; "cuts down" only when the minion is out; the over-limit warning;
// a mind trick on an immune target costs no exchange.
import { describe, expect, it } from 'vitest';
import { FORCE_BASE_LOAD, FORCE_METER } from '../../src/data/health.config';
import { combatIntegration, resolveForceAction } from '../../src/engine/combatForce';
import { minionHitNote, resolveExchange, startDuel, type Fighter } from '../../src/engine/duel';
import { applyForceLoad, forceLoadPerUse } from '../../src/engine/forceMeter';
import { seedRng } from '../../src/engine/rng';
import { runSequence } from '../../src/engine/sequence';
import { forceMeterView, mindImmune } from '../../src/ui/duelPanel';
import { forceUser, REAL } from '../support/duelSim';
import { devCharacter, runFight } from '../support/fightHarness';

const LEVEL = 46;
const CI = 20;
const CAP_F = 5.5;

describe('Force backlash reaches the mental meter (health §2; D-194)', () => {
  it('28 heavy Pushes: the mental load is +0.5 per Force load point over the limit, as forceMeter computes it', () => {
    let s = startDuel(forceUser('pc', 60, { meters: { p: 0, f: 0, m: 0 }, caps: { p: 50, f: CAP_F } }), [forceUser('wall', 10, { vitality: 1e9, maxVitality: 1e9, willpower: 0 })], seedRng('backlash'));
    // The expected load, step by step, from the meter rules alone (no collapse changes the load).
    const load = forceLoadPerUse(FORCE_BASE_LOAD['forcePush']!, 'heavy', LEVEL, combatIntegration(LEVEL, CI).strainMult);
    let expected = { p: 0, m: 0, f: 0 };
    let backlashUses = 0;
    for (let i = 0; i < 28; i++) {
      const fl = applyForceLoad(expected, CAP_F, load);
      if (fl.backlashMental > 0) backlashUses++;
      expected = fl.meters;
      s = resolveForceAction(s, { side: 'A', kind: 'push', level: LEVEL, ci: CI, effort: 'heavy', forceOutput: 0 }, 0, REAL).state;
    }
    expect(backlashUses).toBeGreaterThan(0);
    const overPoints = 28 * load - CAP_F;
    expect(expected.m).toBeCloseTo(overPoints * FORCE_METER.backlashMentalPerPoint, 6);
    expect(s.a.meters.f).toBeCloseTo(expected.f, 6);
    expect(s.a.meters.m).toBeCloseTo(expected.m, 6);
  });
  it('through the turn: heavy Force use until backlash raises the character’s mental meter', async () => {
    const base = await devCharacter('knight', 50);
    const m0 = base.health.meters.m;
    const f = runFight(base, { minionGroups: [{ kind: 'mandalorian', count: 4 }], terrainTags: ['flatFloor'] }, (_t, d) => (d.a.saberLost ? { action: 'force', force: { kind: 'recall' } } : { action: 'force', force: { kind: 'push', effort: 'allOut' } }), 'bl1', 40);
    const backlash = f.log.reduce((a, r) => a + (r.force?.side === 'A' ? r.force.backlashMental : 0), 0);
    expect(backlash).toBeGreaterThan(0);
    expect(f.state.health.meters.m).toBeGreaterThan(m0 + backlash * 0.5);
  });
});

describe('"cuts down" only when the minion is out (D-194)', () => {
  const minion = (over: Partial<Fighter> = {}) => forceUser('b1', 10, { name: 'B1', minion: true, ...over });
  it('the note names what happened', () => {
    expect(minionHitNote('Kael', 'B1', minion({ out: true }), { severity: null })).toBe('Kael cuts down B1');
    expect(minionHitNote('Kael', 'B1', minion(), { severity: null })).toBe('Kael grazes B1; it fights on');
    expect(minionHitNote('Kael', 'B1', minion(), { severity: 'minor' })).toBe('Kael wounds B1 (minor); it fights on');
  });
  it('in duels: every cut-down note is on a minion that is out after that exchange, and a surviving one is a minionHit beat', () => {
    let survived = 0;
    for (let i = 0; i < 300; i++) {
      const s0 = startDuel(forceUser('pc', 30), [minion({ vitality: 60, maxVitality: 60 }), minion({ id: 'b2', name: 'B2' })], seedRng(`cd${i}`));
      const s = resolveExchange(s0, REAL, 0);
      const r = s.log[0]!;
      const t = s.opponents.find((o) => o.id === r.targetId)!;
      if (r.notes.some((n) => n.includes('cuts down'))) expect(t.out).toBe(true);
      if (r.hit && !t.out) {
        survived++;
        expect(r.notes.join(' ')).toMatch(/(grazes|wounds) .+ fights on/);
      }
    }
    expect(survived).toBeGreaterThan(0);
  });
});

describe('the over-limit warning (D-194)', () => {
  it('above 1.0 the meter is over with the collapse risk per use; at or below it, no warning', () => {
    expect(forceMeterView(4, 5)).toMatchObject({ over: false, risk: 0, text: '' });
    const v = forceMeterView(6, 5);
    expect(v.over).toBe(true);
    expect(v.pct).toBe(120);
    expect(v.text).toBe(`Over your limit: ${Math.round(FORCE_METER.collapseChance * 100)}% collapse risk per use`);
  });
});

describe('a mind trick on an immune target costs nothing (D-194)', () => {
  const force = { levelOf: () => 50, ciOf: () => 20, forceOutput: 0, trickLevel: 0 };
  for (const [label, traits, line] of [
    ['a droid', ['droid', 'mindImmune'], "droids can't be mind-tricked"],
    ['a Hutt', ['mindImmune'], "Jabba can't be mind-tricked"],
    ['a Vong warrior', ['forceInvisible', 'mindImmune'], 'Jabba cannot be touched through the Force'],
  ] as const) {
    it(`${label}: dropped with the reason, no exchange, no load`, () => {
      const t = forceUser('t', 30, { name: 'Jabba', forceTraits: traits });
      expect(mindImmune(t)).toBe(true);
      const s = { duel: startDuel(forceUser('pc', 50), [t], seedRng('mt')), patternUses: {}, objects: {} };
      const r = runSequence(s, REAL, 0, [{ kind: 'forceAction', action: 'mindTrick' }], 3, {}, force);
      expect(r.results[0]!.status).toBe('dropped');
      expect(r.lines[0]).toBe(`step 1 mind trick: NOT REACHED (${line})`);
      expect(r.state.duel.log).toHaveLength(0);
      expect(r.state.duel.a.meters.f).toBe(0);
    });
  }
});
