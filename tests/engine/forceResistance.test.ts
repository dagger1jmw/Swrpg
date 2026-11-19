// What resists the Force (D-192) and the saber throw (D-193). Pure engine tests.
import { describe, expect, it } from 'vitest';
import { ABILITY_FORCE_GROUP, SABER_THROW } from '../../src/data/forceResistance.config';
import { SKILLS } from '../../src/data/skills';
import { forceContest, resolveForceAction, type ForceContestInput, type ForceTarget } from '../../src/engine/combatForce';
import { startDuel, type DuelContext, type Fighter } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { runSequence } from '../../src/engine/sequence';
import { forceUser, REAL } from '../support/duelSim';

const person: ForceTarget = { name: 't', willpower: 40, agility: 40, forceResistance: 0, traits: [], bodySize: 'humanoid', inCover: false, canReact: true, saberLevel: 0 };
const contest = (seed: string, over: Partial<ForceContestInput>, t: Partial<ForceTarget> = {}) =>
  forceContest(seedRng(seed), { kind: 'push', group: 'avoidable', level: 60, modifiers: [], target: { ...person, ...t }, negated: false, ...over })[0];
const outcomes = (n: number, over: Partial<ForceContestInput>, t: Partial<ForceTarget> = {}) => Array.from({ length: n }, (_, i) => contest(`c${i}`, over, t));

describe('every Force ability is in a resolution group (D-192)', () => {
  it('skills.ts abilities all have a group', () => {
    for (const s of SKILLS.filter((x) => x.kind === 'forceAbility')) expect(ABILITY_FORCE_GROUP[s.id], s.id).toBeDefined();
  });
});

describe('mind group: a Willpower contest; droids and lore-immune species cannot be affected', () => {
  it('a droid, a Hutt or a Toydarian is immune (no roll at all)', () => {
    for (const traits of [['droid'], ['mindImmune']] as const) {
      const r = contest('m', { kind: 'mindTrick', group: 'mind' }, { traits });
      expect(r.outcome).toBe('immune');
      expect(r.user).toBeNull();
    }
  });
  it('an ordinary mind rolls Willpower; a Force user adds Force resistance', () => {
    const plain = outcomes(400, { kind: 'mindTrick', group: 'mind' });
    expect(plain.every((r) => r.resistKind === 'willpower' || r.outcome === 'natural1')).toBe(true);
    const fu = outcomes(400, { kind: 'mindTrick', group: 'mind' }, { forceResistance: 80 });
    const rate = (xs: typeof plain) => xs.filter((r) => r.success).length / xs.length;
    expect(rate(fu)).toBeLessThan(rate(plain) - 0.1);
    expect(fu.find((r) => r.resist)!.resist!.modifiers.some((m) => m.source === 'Force resistance')).toBe(true);
  });
});

describe('avoidable group: difficulty, then a dodge only when the target can react; cover; a saber catches lightning', () => {
  it('a surprised non-Force user is never rolled for: only the difficulty', () => {
    const r = outcomes(300, {}, { canReact: false });
    expect(r.every((x) => x.resist === null)).toBe(true);
    expect(new Set(r.map((x) => x.outcome))).toEqual(new Set(['success', 'skillTooLow', 'natural1'].filter((o) => r.some((x) => x.outcome === o))));
    expect(r.some((x) => x.outcome === 'dodged' || x.outcome === 'forceResisted' || x.outcome === 'willResisted')).toBe(false);
  });
  it('a target that can react may dodge (Agility), never resist', () => {
    const r = outcomes(400, {});
    expect(r.some((x) => x.outcome === 'dodged')).toBe(true);
    expect(r.every((x) => x.resistKind === null || x.resistKind === 'dodge')).toBe(true);
  });
  it('cover blocks lightning and thrown objects, not a Push', () => {
    expect(outcomes(50, { kind: 'lightning' }, { inCover: true }).filter((x) => x.outcome !== 'natural1' && x.outcome !== 'skillTooLow').every((x) => x.outcome === 'cover')).toBe(true);
    expect(outcomes(50, { kind: 'throw', objectSize: 'small' }, { inCover: true }).some((x) => x.outcome === 'cover')).toBe(true);
    expect(outcomes(50, { kind: 'push' }, { inCover: true }).some((x) => x.outcome === 'cover')).toBe(false);
  });
  it('a lightsaber deflects lightning; a Force user counters a Push with Force resistance', () => {
    expect(outcomes(200, { kind: 'lightning' }, { saberLevel: 70 }).some((x) => x.outcome === 'deflected')).toBe(true);
    const p = outcomes(200, { kind: 'push' }, { forceResistance: 70 });
    expect(p.some((x) => x.outcome === 'forceResisted')).toBe(true);
    expect(p.every((x) => x.resistKind === null || x.resistKind === 'forceResistance')).toBe(true);
  });
});

describe('grip and object groups: no opposed roll unless the target is a Force user', () => {
  it('a grip on a non-Force user and telekinesis on a body or an object roll only the difficulty', () => {
    expect(outcomes(200, { kind: 'choke', group: 'grip' }).every((x) => x.resist === null)).toBe(true);
    expect(outcomes(200, { kind: 'throw', group: 'object', objectSize: 'medium' }).every((x) => x.resist === null)).toBe(true);
  });
  it('a Force user resists a grip with Force resistance', () => {
    expect(outcomes(200, { kind: 'choke', group: 'grip' }, { forceResistance: 70 }).some((x) => x.outcome === 'forceResisted')).toBe(true);
  });
});

describe('Force negation (D-192)', () => {
  it('a Force-null bubble stops every use', () => {
    expect(contest('n', { negated: true }).outcome).toBe('negated');
  });
  it('the Force-invisible cannot be touched directly, but a thrown object still hits', () => {
    for (const kind of ['push', 'lightning', 'choke', 'mindTrick'] as const) expect(contest('v', { kind, group: kind === 'choke' ? 'grip' : kind === 'mindTrick' ? 'mind' : 'avoidable' }, { traits: ['forceInvisible'] }).outcome).toBe('forceInvisible');
    expect(outcomes(50, { kind: 'throw', objectSize: 'small' }, { traits: ['forceInvisible'] }).some((x) => x.outcome === 'success')).toBe(true);
  });
});

// ---- the saber throw (D-193) ----
const minion = (i: number, over: Partial<Fighter> = {}): Fighter => forceUser(`b1:${i}`, 15, { minion: true, weapon: 'blasterRifle', form: null, skillId: 'blaster', forceSense: 0, vitality: 20, maxVitality: 20, forceTraits: ['droid', 'mindImmune'], ...over });
const knight = (over: Partial<Fighter> = {}) => forceUser('pc', 60, { caps: { p: 5, f: 8 }, ...over });
const CTX: DuelContext = REAL;

describe('saber throw (D-193)', () => {
  it('against minions: up to 3 strikes in the arc, each its own roll and margin', () => {
    let found = false;
    for (let i = 0; i < 60 && !found; i++) {
      const s = startDuel(knight(), [0, 1, 2, 3, 4].map((k) => minion(k)), seedRng(`st${i}`));
      const r = resolveForceAction(s, { side: 'A', kind: 'saberThrow', level: 60, ci: 60, effort: 'standard', forceOutput: 0 }, 0, CTX);
      if (!r.record.success) continue;
      expect(r.record.saberHits!.length).toBe(SABER_THROW.maxTargets);
      const strikes = r.state.log.filter((x) => x.kind === 'strike');
      expect(strikes).toHaveLength(3);
      expect(new Set(strikes.map((x) => x.targetId)).size).toBe(3);
      expect(r.state.a.weapon).toBe('lightsaber');
      found = true;
    }
    expect(found).toBe(true);
  });
  it('a failed control roll drops the saber: unarmed until a recall brings it back', () => {
    let found = false;
    for (let i = 0; i < 200 && !found; i++) {
      const s = startDuel(knight(), [minion(0)], seedRng(`fail${i}`));
      const r = resolveForceAction(s, { side: 'A', kind: 'saberThrow', level: 8, ci: 0, effort: 'standard', forceOutput: 0 }, 0, CTX);
      if (r.record.success || r.record.misfire || r.record.collapse) continue;
      expect(r.record.saberDropped).toBe(true);
      expect(r.state.a.weapon).toBe('unarmed');
      expect(r.state.a.skillId).toBe('agility');
      expect(r.state.a.saberLost?.weapon).toBe('lightsaber');
      // The recall is a Force action (telekinesis vs an easy difficulty).
      let st = r.state;
      for (let k = 0; k < 20 && st.a.saberLost; k++) st = resolveForceAction(st, { side: 'A', kind: 'recall', level: 60, ci: 60, effort: 'standard', forceOutput: 0 }, 0, CTX).state;
      expect(st.a.weapon).toBe('lightsaber');
      expect(st.a.skillId).toBe('soresu');
      found = true;
    }
    expect(found).toBe(true);
  });
  it('against a duelist: one strike they can deflect; a Force user can wrench it from its arc', () => {
    let interrupted = false;
    for (let i = 0; i < 200 && !interrupted; i++) {
      const s = startDuel(knight(), [forceUser('sith', 70, { forceResistance: 90 })], seedRng(`d${i}`));
      const r = resolveForceAction(s, { side: 'A', kind: 'saberThrow', level: 60, ci: 60, effort: 'standard', forceOutput: 0 }, 0, CTX);
      if (r.record.saberHits) expect(r.record.saberHits.length).toBe(1);
      if (r.record.saberDropped && r.record.saberHits) {
        expect(r.record.outcome).toBe('forceResisted');
        expect(r.state.a.weapon).toBe('unarmed');
        interrupted = true;
      }
    }
    expect(interrupted).toBe(true);
  });
  it('a sequence: a saber throw the character cannot make is dropped with its reason, and the chain goes on', () => {
    const s = { duel: startDuel(knight(), [minion(0), minion(1)], seedRng('seq')), patternUses: {}, objects: {} };
    const r = runSequence(s, CTX, 0, [{ kind: 'forceAction', action: 'saberThrow' }, { kind: 'strike' }], 3, {}, { levelOf: () => 0, ciOf: () => 0, forceOutput: 0, trickLevel: 0 });
    expect(r.results[0]!.status).toBe('dropped');
    expect(r.lines[0]).toBe('step 1 saber throw: NOT REACHED (the character does not know telekinesis)');
    expect(r.results[1]!.step.kind).toBe('strike');
  });
});

describe('strike steps against minions are strike rolls, not position contests (D-191)', () => {
  it('a sequence strike step at advantage 0 on a B1 is a strike exchange by the player', () => {
    for (let i = 0; i < 20; i++) {
      const s = { duel: startDuel(knight(), [minion(0), minion(1)], seedRng(`ss${i}`)), patternUses: {}, objects: {} };
      const r = runSequence(s, CTX, 0, [{ kind: 'strike' }], 3, {}, { levelOf: () => 60, ciOf: () => 60, forceOutput: 0, trickLevel: 0 });
      const rec = r.state.duel.log[0]!;
      expect(rec.kind).toBe('strike');
      expect(rec.striker).toBe('A');
    }
  });
  it('against a named duelist the strike step is still a build-up exchange', () => {
    const s = { duel: startDuel(knight(), [forceUser('B', 60)], seedRng('named')), patternUses: {}, objects: {} };
    const r = runSequence(s, CTX, 0, [{ kind: 'strike' }], 3, {}, { levelOf: () => 60, ciOf: () => 60, forceOutput: 0, trickLevel: 0 });
    expect(r.state.duel.log[0]!.kind).toBe('buildUp');
  });
});

describe('saber-throw control difficulty (D-193, corrected)', () => {
  it('is rating 15 (DC 11.5), as the decision records', () => {
    expect(SABER_THROW.controlDifficulty).toBe(15);
    const s = startDuel(knight(), [minion(0)], seedRng('dc'));
    expect(resolveForceAction(s, { side: 'A', kind: 'saberThrow', level: 60, ci: 60, effort: 'standard', forceOutput: 0 }, 0, CTX).record.dc).toBe(11.5);
  });
});
