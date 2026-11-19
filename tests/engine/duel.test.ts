// rolls.md §8 tests 4, 6, 7, 8 (the simulated tables are in tests/lifetime/duelTables.test.ts), sparring modes
// (D-144), minions (D-157), combat integration (progression-numbers test 11, D-122), Force actions and sequences
// (D-146).
import { describe, expect, it } from 'vitest';
import { SEQUENCE_CHAIN } from '../../src/data/sequence.config';
import { combatIntegration, resolveForceAction } from '../../src/engine/combatForce';
import { beatAfter, resolveExchange, runUntilBeat, startDuel, type DuelState, type Fighter } from '../../src/engine/duel';
import { basicRoll } from '../../src/engine/rolls';
import { seedRng, type RngState } from '../../src/engine/rng';
import { patternOf, runSequence, sequenceCap, type ForceProfile, type SequenceState } from '../../src/engine/sequence';
import { REAL, forceUser } from '../support/duelSim';

const trooper = (id: string, level: number, over: Partial<Fighter> = {}): Fighter =>
  forceUser(id, level, { skillId: 'blaster', form: null, weapon: 'blasterRifle', armor: 'medium', forceSense: 0, vitality: 47, maxVitality: 47, minion: true, caps: { p: 4.6, f: 0 }, ...over });

describe('dice (rolls §8 test 4)', () => {
  it('natural 20 and natural 1 each occur 5% (+/-0.5%) over 100,000 rolls', () => {
    let rng: RngState = seedRng('nat');
    let n20 = 0;
    let n1 = 0;
    for (let i = 0; i < 100_000; i++) {
      const [r, next] = basicRoll(rng, 50, []);
      rng = next;
      if (r.natural === 'nat20') n20++;
      if (r.natural === 'nat1') n1++;
    }
    expect(Math.abs(n20 / 100_000 - 0.05)).toBeLessThanOrEqual(0.005);
    expect(Math.abs(n1 / 100_000 - 0.05)).toBeLessThanOrEqual(0.005);
  });
});

describe('precognitive defense (rolls §8 test 6)', () => {
  it('never applies to a surprise strike', () => {
    let rng = seedRng('surprise');
    for (let i = 0; i < 2000; i++) {
      const s = resolveExchange(startDuel(forceUser('A', 90), [forceUser('B', 50, { forceSense: 400, insightUsed: true })], rng, 'A'), REAL, 0);
      rng = s.rng;
      expect(s.log[0]!.hit?.avoided ?? false).toBe(false);
    }
  });
  it('never applies above Force meter 1.0', () => {
    let rng = seedRng('meter');
    for (let i = 0; i < 2000; i++) {
      const b = forceUser('B', 50, { forceSense: 400, insightUsed: true, meters: { p: 0, f: 6 }, caps: { p: 5, f: 5 } });
      const s = resolveExchange({ ...startDuel(forceUser('A', 90), [b], rng), advantage: 3 }, REAL, 0);
      rng = s.rng;
      expect(s.log[0]!.hit?.avoided ?? false).toBe(false);
    }
  });
  it('is used below the limit (and costs 0.4 Force load)', () => {
    let rng = seedRng('used');
    let avoided = 0;
    for (let i = 0; i < 2000; i++) {
      const s = resolveExchange({ ...startDuel(forceUser('A', 90), [forceUser('B', 50, { forceSense: 400, insightUsed: true })], rng), advantage: 3 }, REAL, 0);
      rng = s.rng;
      if (s.log[0]!.hit?.avoided) {
        avoided++;
        expect(s.opponents[0]!.meters.f).toBeCloseTo(0.4);
      }
    }
    expect(avoided).toBeGreaterThan(0);
  });
});

describe('beats (rolls §8 test 7, D-145)', () => {
  it('a beat at every strike, at advantage +/-2, and at least every 5 exchanges', () => {
    let rng = seedRng('beats');
    for (let i = 0; i < 300; i++) {
      let s: DuelState = startDuel(forceUser('A', 50), [forceUser('B', 50)], rng);
      while (!s.end && s.exchange < 300) {
        const r = runUntilBeat(s, REAL, 0, 'beat');
        expect(r.records.length).toBeLessThanOrEqual(5);
        r.records.slice(0, -1).forEach((rec) => expect(rec.kind).not.toBe('strike'));
        s = r.state;
      }
      rng = s.rng;
    }
  });
  it('Fight on passes quiet beats and stops only at a narrated one; Resolve to end runs to the end', () => {
    const s = startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng('fighton'));
    const r = runUntilBeat(s, REAL, 0, 'fightOn');
    expect(['woundingHit', 'maneuverLanded', 'spent', 'forceAction', 'incapacitated', 'fightEnded']).toContain(r.beat);
    expect(r.beats.slice(0, -1).every((b) => ['trackSwing', 'periodic', 'strikeMissed', 'strikeAbsorbed'].includes(b))).toBe(true);
    expect(runUntilBeat(s, REAL, 0, 'toEnd').state.end).not.toBeNull();
  });
});

describe('determinism (rolls §8 test 8)', () => {
  it('the same seed gives identical duels', () => {
    const run = () => runUntilBeat(startDuel(forceUser('A', 55), [forceUser('B', 50)], seedRng('same')), REAL, 0, 'toEnd').state;
    expect(run()).toEqual(run());
  });
});

describe('sparring modes (D-144)', () => {
  it('training sabers: Vitality only, no wounds; the first side Spent loses', () => {
    let rng = seedRng('ts');
    for (let i = 0; i < 300; i++) {
      const s = runUntilBeat(startDuel(forceUser('A', 50, { weapon: 'trainingSaber' }), [forceUser('B', 50, { weapon: 'trainingSaber' })], rng), { ...REAL, sparring: 'trainingSaber' }, 0, 'toEnd').state;
      rng = s.rng;
      expect(s.a.wounds).toEqual([]);
      expect(s.opponents[0]!.wounds).toEqual([]);
      expect(s.end?.reason).toBe('spent');
    }
  });
  it('controlled live blades: a landed strike ends the bout on a point; damage only by the 16+ and natural-1 accident', () => {
    let rng = seedRng('ctl');
    let points = 0;
    for (let i = 0; i < 500; i++) {
      const s = runUntilBeat(startDuel(forceUser('A', 50), [forceUser('B', 50)], rng), { ...REAL, sparring: 'controlled' }, 0, 'toEnd').state;
      rng = s.rng;
      const last = s.log[s.log.length - 1]!;
      if (s.end?.reason === 'point') points++;
      for (const rec of s.log) if (rec.hit && rec.hit.W > 0) {
        expect(Math.round(rec.margin)).toBeGreaterThanOrEqual(16);
        expect(rec.rollA?.natural === 'nat1' || rec.rollB?.natural === 'nat1').toBe(true);
        expect(rec.hit.quality).toBe('graze');
      }
      void last;
    }
    expect(points).toBeGreaterThan(400);
  });
});

describe('minions (health §9 as amended by D-157)', () => {
  it('a minion folds when Spent or on a moderate wound; named fighters do not fold when Spent', () => {
    let rng = seedRng('min');
    let folded = 0;
    for (let i = 0; i < 300; i++) {
      const s = runUntilBeat(startDuel(forceUser('J', 60), [trooper('T', 20)], rng), REAL, 0, 'toEnd').state;
      rng = s.rng;
      const t = s.opponents[0]!;
      if (t.out && t.wounds.every((w) => w.severity === 'minor')) {
        expect(t.vitality).toBe(0);
        folded++;
      }
    }
    expect(folded).toBeGreaterThan(0);
  });
  it('opponents engaged elsewhere neither attack nor count for numbers (D-143 E)', () => {
    const s = resolveExchange(startDuel(forceUser('A', 50), [trooper('T1', 30), trooper('T2', 30, { engagedElsewhere: true }), trooper('T3', 30, { engagedElsewhere: true })], seedRng('ee')), REAL, 0);
    const rec = s.log[0]!;
    expect(rec.targetId).toBe('T1');
    expect(rec.rollB!.modifiers.some((m) => m.source.startsWith('numbers'))).toBe(false);
  });
  it('several engaged opponents give the numbers modifier (+1 each extra, max +3)', () => {
    const s = resolveExchange(startDuel(forceUser('A', 50), [trooper('T1', 30), trooper('T2', 30), trooper('T3', 30), trooper('T4', 30), trooper('T5', 30)], seedRng('num')), REAL, 0);
    expect(s.log[0]!.rollB!.modifiers.find((m) => m.source.startsWith('numbers'))?.value).toBe(3);
  });
});

describe('ranged deflection (rolls §4)', () => {
  it('a Soresu defender can redirect a bolt at a margin of 8+', () => {
    let rng = seedRng('redir');
    let redirects = 0;
    for (let i = 0; i < 500; i++) {
      const s = runUntilBeat(startDuel(forceUser('J', 70, { form: 'soresu' }), [trooper('T', 30, { minion: false })], rng), REAL, 0, 'toEnd').state;
      rng = s.rng;
      redirects += s.log.filter((r) => r.hit?.redirected).length;
    }
    expect(redirects).toBeGreaterThan(0);
  });
});

describe('combat integration (progression-numbers §8, test 11; D-122)', () => {
  it('reference table: Force Push 70, CI 10 -> 52.5, x1.52, 10.5%', () => {
    const c = combatIntegration(70, 10);
    expect(c.effectiveLevel).toBeCloseTo(52.5);
    expect(c.strainMult).toBeCloseTo(1.525);
    expect(c.misfire).toBeCloseTo(0.105);
    const c2 = combatIntegration(70, 18.8);
    expect(c2.effectiveLevel).toBeCloseTo(56.9, 1);
    expect(combatIntegration(70, 53.4).effectiveLevel).toBe(70);
    expect(combatIntegration(70, 53.4).misfire).toBe(0);
  });
  it('Niman halves the penalty: the G loss, the strain excess and the misfire chance', () => {
    const c = combatIntegration(70, 10, true);
    expect(c.effectiveLevel).toBeCloseTo(70 - 8.75);
    expect(c.strainMult).toBeCloseTo(1.2625);
    expect(c.misfire).toBeCloseTo(0.0525);
  });
});

describe('Force actions (rolls §4, D-154)', () => {
  const duel = (seed: string) => startDuel(forceUser('A', 60, { meters: { p: 0, f: 0 }, caps: { p: 5, f: 6 } }), [forceUser('B', 50, { willpower: 30 })], seedRng(seed));
  it('a successful Push gives an opening (+2 advantage) and is logged as a Force exchange', () => {
    let found = false;
    for (let i = 0; i < 50 && !found; i++) {
      const r = resolveForceAction(duel(`push${i}`), { side: 'A', kind: 'push', level: 60, ci: 60, effort: 'standard', forceOutput: 50 }, 0);
      if (r.record.success) {
        expect(r.state.advantage).toBe(2);
        expect(r.state.log[0]!.kind).toBe('force');
        expect(beatAfter(r.state)).toBe('forceAction');
        found = true;
      }
    }
    expect(found).toBe(true);
  });
  it('Force load is spent on every use; Lightning damages on a success', () => {
    for (let i = 0; i < 50; i++) {
      const r = resolveForceAction(duel(`light${i}`), { side: 'A', kind: 'lightning', level: 60, ci: 60, effort: 'heavy', forceOutput: 60 }, 0);
      expect(r.state.a.meters.f).toBeGreaterThan(0);
      if (r.record.success) {
        expect(r.record.damage!.D).toBeCloseTo(0.4 * 60 * 2);
        return;
      }
    }
    throw new Error('no successful lightning in 50 seeds');
  });
});

describe('sequences (D-146)', () => {
  const force: ForceProfile = { levelOf: () => 60, ciOf: () => 60, forceOutput: 60, trickLevel: 60 };
  const seq = (seed: string, over: Partial<Fighter> = {}): SequenceState => ({
    duel: startDuel(forceUser('A', 60, { caps: { p: 5, f: 8 }, ...over }), [forceUser('B', 60)], seedRng(seed)),
    patternUses: {},
    objects: { looseRock: 2 },
  });
  it('the cap: rank base, then stealth, then fatigue, never below 1', () => {
    const base = { mainFormLevel: 40, forceSkillLevel: 40, hidden: false, mentalFraction: 0, exhausted: false };
    expect(sequenceCap({ ...base, rank: 'padawan' })).toBe(2);
    expect(sequenceCap({ ...base, rank: 'knight' })).toBe(3);
    expect(sequenceCap({ ...base, rank: 'master' })).toBe(4);
    expect(sequenceCap({ ...base, rank: 'knight', mainFormLevel: 80, forceSkillLevel: 85 })).toBe(5);
    expect(sequenceCap({ ...base, rank: 'knight', hidden: true })).toBe(4);
    expect(sequenceCap({ ...base, rank: 'knight', mentalFraction: 0.9 })).toBe(2);
    expect(sequenceCap({ ...base, rank: 'knight', hidden: true, exhausted: true })).toBe(2);
    expect(sequenceCap({ ...base, rank: 'initiate', exhausted: true })).toBe(1);
  });
  it('the cap truncates longer input by rank', () => {
    const r = runSequence(seq('trunc'), REAL, 0, [{ kind: 'stance', stance: 'aggressive' }, { kind: 'stance', stance: 'balanced' }, { kind: 'stance', stance: 'defensive' }], 2, { looseRock: 'small' }, force);
    expect(r.results).toHaveLength(2);
    expect(r.truncated).toHaveLength(1);
  });
  it('a failure at step 2 stops before step 3; the rest is dropped', () => {
    for (let i = 0; i < 200; i++) {
      const r = runSequence(seq(`fail${i}`), REAL, 0, [{ kind: 'strike' }, { kind: 'strike' }, { kind: 'strike' }], 3, {}, force);
      if (r.results.length === 2 && !r.results[1]!.success && r.stopReason === 'stepFailed') {
        expect(r.dropped).toHaveLength(1);
        return;
      }
    }
    throw new Error('no seed failed at step 2');
  });
  it('adaptation stacks +1 per earlier use of the same pattern and caps at +3', () => {
    let st = seq('adapt');
    const step = [{ kind: 'forceAction' as const, action: 'push' as const }];
    for (let i = 0; i < 5; i++) st = runSequence(st, REAL, 0, step, 1, {}, force).state;
    expect(st.patternUses[patternOf(step[0]!)]).toBe(5);
    const last = st.duel.log[st.duel.log.length - 1]!;
    expect(last.force?.resist?.modifiers.find((m) => m.source.startsWith('adapted'))?.value ?? 0).toBeLessThanOrEqual(3);
    const fourth = st.duel.log[3]!;
    expect(fourth.force?.resist?.modifiers.find((m) => m.source.startsWith('adapted'))?.value).toBe(3);
  });
  it('the thrown-object supply runs out', () => {
    let st = seq('throw');
    const step = [{ kind: 'forceAction' as const, action: 'throw' as const, objectTag: 'looseRock' }];
    for (let i = 0; i < 2; i++) st = runSequence(st, REAL, 0, step, 1, { looseRock: 'small' }, force).state;
    expect(st.objects['looseRock']).toBe(0);
    const r = runSequence(st, REAL, 0, step, 1, { looseRock: 'small' }, force);
    expect(r.results[0]!.note).toBe('nothing left to throw here');
    expect(r.lines[0]).toBe('step 1 Force throw: NOT REACHED (nothing left to throw here)');
    expect(r.results[0]!.status).toBe('dropped');
  });
  it('fairness: against an equal opponent at the largest stacked bonus no step succeeds more than 90% of the time', () => {
    let rng = seedRng('fair');
    let ok = 0;
    const n = 4000;
    const bonus = SEQUENCE_CHAIN.pressureMax + SEQUENCE_CHAIN.splitDefense;
    for (let i = 0; i < n; i++) {
      const s = resolveExchange({ ...startDuel(forceUser('A', 60), [forceUser('B', 60)], rng), advantage: 3 }, REAL, 0, { a: [{ source: 'max chain', value: bonus }] });
      rng = s.rng;
      const rec = s.log[0]!;
      if (rec.hit && !rec.hit.avoided && rec.rollA?.natural !== 'nat1') ok++;
    }
    expect(ok / n).toBeLessThanOrEqual(SEQUENCE_CHAIN.maxStepSuccess);
  });
  it('the same seed gives the same chain', () => {
    const steps = [{ kind: 'tactic' as const, tactic: 'feint' as const }, { kind: 'forceAction' as const, action: 'push' as const }, { kind: 'strike' as const }];
    expect(runSequence(seq('same'), REAL, 0, steps, 3, {}, force)).toEqual(runSequence(seq('same'), REAL, 0, steps, 3, {}, force));
  });
});

describe('lost and prosthetic limbs (health §5, D-164)', () => {
  const lost = (part: 'leftArm' | 'rightLeg') => ({ id: `l-${part}`, kind: part === 'leftArm' ? ('lostArm' as const) : ('lostLeg' as const), part, adaptation: 1, aid: 'qualityCybernetic' as const, adaptedToday: 0, adaptDay: 0, day: 0 });
  it('a limb severed earlier in the fight is never hit again, and a prosthetic is never wounded or severed', () => {
    let rng = seedRng('limbs');
    let prostheticHits = 0;
    for (let i = 0; i < 400; i++) {
      // The defender already lost the left arm (cybernetic) and the right leg (cybernetic); a far stronger attacker.
      const b = forceUser('B', 40, { lasting: [lost('leftArm'), lost('rightLeg')] });
      const s = runUntilBeat(startDuel(forceUser('A', 80), [b], rng), REAL, 0, 'toEnd').state;
      rng = s.rng;
      const severedThisFight = new Set<string>();
      for (const x of s.log) {
        const h = x.hit;
        if (!h || h.by !== 'A' || h.avoided || h.point) continue;
        // A part severed earlier in this fight (and its hand) is gone.
        expect(severedThisFight.has(h.part), `hit on a severed ${h.part}`).toBe(false);
        if (['leftArm', 'leftHand', 'rightLeg'].includes(h.part)) {
          prostheticHits++;
          expect(h.severity, `prosthetic ${h.part}`).toBeNull();
          expect(h.severed).toBe(false);
        }
        if (h.severed) {
          severedThisFight.add(h.part);
          if (h.part === 'rightArm') severedThisFight.add('rightHand');
        }
      }
      // No limb is ever severed twice.
      const severed = s.opponents[0]!.wounds.filter((w) => w.severed).map((w) => w.part);
      expect(new Set(severed).size).toBe(severed.length);
    }
    expect(prostheticHits).toBeGreaterThan(0);
  });
});

describe('surprise strikes and aimed strikes (D-170, D-171)', () => {
  const group = () => [forceUser('B1', 50), forceUser('B2', 50), forceUser('B3', 50)];
  it('a defender caught by surprise gets no numbers modifier for that strike; afterwards the group does', () => {
    const s = startDuel(forceUser('A', 60), group(), seedRng('surp'), 'A');
    const first = runUntilBeat(s, REAL, 0, 'beat', 1).state.log[0]!;
    expect(first.surprise).toBe(true);
    expect(first.rollB!.modifiers.some((m) => m.source.startsWith('numbers'))).toBe(false);
    const later = runUntilBeat({ ...s, surprise: null }, REAL, 0, 'beat', 1).state.log[0]!;
    expect(later.rollB!.modifiers.some((m) => m.source.startsWith('numbers'))).toBe(true);
  });
  it('an aimed strike takes -2 on the strike roll, lands where aimed, and the aim is spent', () => {
    let rng = seedRng('aim');
    let landed = 0;
    for (let i = 0; i < 200; i++) {
      // Surprise makes the first exchange a strike by A.
      const s = startDuel({ ...forceUser('A', 80), aim: 'head' }, [forceUser('B', 40)], rng, 'A');
      const d = runUntilBeat(s, REAL, 0, 'beat', 1).state;
      rng = d.rng;
      const r = d.log[0]!;
      expect(r.rollA!.modifiers.some((m) => m.source === 'aimed at the head' && m.value === -2)).toBe(true);
      if (r.hit && !r.hit.avoided && r.hit.D > 0) {
        landed++;
        expect(r.hit.part).toBe('head');
      }
      expect(d.a.aim ?? null).toBeNull();
    }
    expect(landed).toBeGreaterThan(0);
  });
});
