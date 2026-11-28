// m9-tune2 (Jared, 27 Nov 2026; report docs-v2/reports/m9-tune2.md): long duels pay more and no daily combat limit (items 7, 8; the
// engine's own tests are tests/engine/combatXp.test.ts), the trooper's service record (item 3), the Sith side by date (item 4), the
// duty player's withdrawal (item 5) and the front pace (item 1).
import { describe, expect, it } from 'vitest';
import { FRONTS } from '../../src/data/missions.config';
import { FRONT_PACE, GOOD_FORM, PUSH_ENDURANCE, STRAIN_WILLPOWER } from '../../src/data/progression.config';
import { SITH_POWERS, sithSideAt } from '../../src/data/wars';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import type { DuelState, ExchangeRecord } from '../../src/engine/duel';
import { computeCombatXp, fightExchanges, goodFormMult, goodFormThreshold } from '../../src/engine/combatXp';
import { efficiency, fatigueWillpowerRate } from '../../src/engine/fatigue';
import { resolveExchange, sparInjuryChance } from '../../src/engine/duel';
import { PUSH_THROUGH, SPAR_INJURY } from '../../src/data/combat.config';
import type { Wound } from '../../src/engine/wounds';
import { frontsFor, postingEligible, selectSideWar } from '../../src/features/duty/missions';
import { selectFrontPace } from '../../src/features/progression/training';
import { selectSide } from '../../src/features/ranks/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { resolveTurn } from '../../src/turn/resolve';
import { createInitialState } from '../../src/state/registryTools';
import { DUTY_WITHDRAWAL, playDutyTurn, wantsOut } from '../support/dutyPlayer';
import { base } from '../support/schemaSituations';

const ev = (s: GameState, events: object[], source: 'engine' | 'player' | 'ai' = 'engine') => applyEvents(REGISTRY, s, events, { source });
const at = (s: GameState, year: number): GameState => ({ ...s, clock: { ...s.clock, now: { ...s.clock.now, day: absDayFromDate({ year, month: 3, day: 1 }) } } });
const wound = (severity: Wound['severity']): Wound => ({ id: `w-${severity}`, part: 'leftArm', severity, W: 20, stabilized: true, healProgress: 0, day: 0, source: 'test' }) as Wound;

function trooper(optionId = 'republic-trooper', faction = 'republic'): GameState {
  const day = absDayFromDate({ year: -3661, month: 3, day: 1 });
  return createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'trooper',
    start: { day, second: 9 * 3600 },
    character: { name: 'Tamsin', birthDay: day - 24 * 368, path: 'career', archetype: 'soldier', start: { optionId, faction, imperialBorn: false } },
    rank: 'career',
  });
}

describe('item 3: the trooper start has a service record (enlisted)', () => {
  it('the trooper and the conscript start in the ranks, so a total war posts them', () => {
    const s = trooper();
    expect(s.ranks.service).toMatchObject({ ladderId: 'republicArmy', rung: 0, enlisted: true });
    expect(postingEligible(s)).toBe(true);
    expect(trooper('imperial-soldier', 'sithEmpire').ranks.service).toMatchObject({ ladderId: 'sithImperialArmy', enlisted: true });
    // The officer starts hold the first officer rung (addendum 4).
    expect(trooper('republic-pilot').ranks.service).toEqual({ ladderId: 'republicNavy', rung: 0, since: expect.any(Number), deeds: 0 });
    expect(trooper('imperial-officer', 'sithEmpire').ranks.service).toEqual({ ladderId: 'sithImperialNavy', rung: 0, since: expect.any(Number), deeds: 0 });
  });

  it('enlisting needs no entry minimum; a commission from the ranks needs the first rung\'s', () => {
    const s = base({ path: 'career', archetype: 'soldier' });
    expect(ev(s, [{ type: 'serviceJoined', ladderId: 'republicArmy' }], 'player').rejected).toHaveLength(1);
    const e = ev(s, [{ type: 'serviceJoined', ladderId: 'republicArmy', enlisted: true }], 'player');
    expect(e.rejected).toEqual([]);
    expect(e.state.ranks.service).toMatchObject({ rung: 0, enlisted: true });
    expect(ev(s, [{ type: 'serviceJoined', ladderId: 'sis', enlisted: true }], 'player').rejected).toHaveLength(1);
    expect(ev(e.state, [{ type: 'servicePromotionProposed' }], 'player').rejected[0]!.reason).toMatch(/commission refused: tactics 10/);
    const trained = { ...e.state, progression: { ...e.state.progression, skills: { ...e.state.progression.skills, tactics: { xp: xpForLevel(12), rust: 0, lastPracticedDay: null } } } } as GameState;
    const c = ev(trained, [{ type: 'servicePromotionProposed' }], 'player');
    expect(c.rejected).toEqual([]);
    expect(c.state.ranks.service?.enlisted).toBeUndefined();
    expect(c.state.ranks.service?.rung).toBe(0);
  });
});

describe('item 4: a Sith serves the era\'s Sith power by date', () => {
  it('one dated list: the Brotherhood in 1,032-995, the Sith Empire where it exists', () => {
    expect(sithSideAt(-1032)).toBe('sith');
    expect(sithSideAt(-1005)).toBe('sith');
    expect(sithSideAt(-995)).toBe('sith');
    expect(sithSideAt(-3661)).toBe('sithEmpire');
    expect(sithSideAt(-4999)).toBe('sithEmpire');
    // Kun's Brotherhood and Revan's Sith while Vitiate's Empire hid: the power that rose latest.
    expect(sithSideAt(-3998)).toBe('sith');
    expect(sithSideAt(-3957)).toBe('sith');
    expect(sithSideAt(-10)).toBe('sithEmpire');
    expect(sithSideAt(30)).toBe('sith');
    for (const p of SITH_POWERS) expect(p.fromBby).toBeGreaterThanOrEqual(p.toBby);
  });

  it('a Sith life in the Light and Darkness War is at war, posted to a Brotherhood front, never an Army of Light base', () => {
    const s = at(base({ path: 'sith', rank: 'lord', archetype: 'sithWarrior' }), -1005);
    expect(selectSide(s)).toBe('sith');
    expect(selectSideWar(s)?.id).toBe('lightAndDarknessWar');
    for (const year of [-1008, -1003, -1001]) {
      const f = frontsFor('lightAndDarknessWar', 'sith', year);
      expect(f.length, String(year)).toBeGreaterThan(0);
      for (const x of f) expect(x.base).not.toMatch(/Army of Light/);
    }
    for (const f of FRONTS.filter((x) => /Army of Light/.test(x.base))) expect(f.sides).not.toContain('sith');
    // In the Empire's years the side is the Empire's.
    expect(selectSide(at(base({ path: 'sith', rank: 'lord', archetype: 'sithWarrior' }), -3661))).toBe('sithEmpire');
  });
});

describe('item 5: the duty player withdraws when hurt and losing', () => {
  const duel = (wounds: Wound[], advantage: number) => ({ a: { wounds }, advantage }) as unknown as DuelState;
  it(`breaks off at a ${DUTY_WITHDRAWAL.wound} or worse wound with the track at ${DUTY_WITHDRAWAL.track} or lower`, () => {
    expect(wantsOut(duel([wound('moderate')], -2))).toBe(true);
    expect(wantsOut(duel([wound('severe')], -4))).toBe(true);
    expect(wantsOut(duel([wound('moderate')], -1))).toBe(false);
    expect(wantsOut(duel([wound('minor')], -4))).toBe(false);
    expect(wantsOut(duel([{ ...wound('moderate'), healProgress: 1 }], -4))).toBe(false);
  });

  it('in a live fight it uses the game\'s Disengage tactic (the fight ends as fled, or fights on when the contest fails)', () => {
    const s0 = ev(base(), [{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind: 'thug', count: 1 }], stakes: 'serious', terrainTags: [] }]).state;
    const a = s0.combat.active!;
    const d = a.duel as DuelState;
    const s = { ...s0, combat: { ...s0.combat, active: { ...a, duel: { ...d, advantage: -3, a: { ...d.a, wounds: [wound('moderate')] } } } } } as GameState;
    const r = playDutyTurn(s)!;
    const notes = r.draft.applied.flatMap((x) => x.notes);
    expect(notes.some((n) => /^disengage/.test(n))).toBe(true);
    if (r.state.combat.active === null) expect(r.state.combat.last?.outcome).toBe('fled');
  });
});

describe('item 7 and addendum 1: a live fight tells combat XP each exchange\'s run against one opponent, the track, form and strain', () => {
  it('fightResolved carries n (restarting at each change of opponent), adv, form and strain from the duel log', () => {
    const s0 = ev(base(), [{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind: 'thug', count: 3 }], stakes: 'serious', terrainTags: [] }]).state;
    const r = resolveTurn(REGISTRY, s0, null, { beat: { action: 'resolve' } as never });
    const fr = r.draft.applied.find((x) => x.event.type === 'fightResolved')!.event as unknown as { exchanges: { n?: number; adv?: number; form?: boolean; strain?: number }[] };
    expect(fr.exchanges.length).toBeGreaterThan(0);
    expect(fr.exchanges[0]!.n).toBe(1);
    for (let i = 1; i < fr.exchanges.length; i++) expect([1, fr.exchanges[i - 1]!.n! + 1]).toContain(fr.exchanges[i]!.n!);
    for (const x of fr.exchanges) {
      expect(typeof x.adv).toBe('number');
      expect(typeof x.form).toBe('boolean');
      expect(x.strain).toBeGreaterThanOrEqual(0);
    }
  });

  it('the run restarts with another opponent: a group fight is many short fights', () => {
    const rec = (n: number, targetId: string) => ({ n, kind: 'buildUp', targetId, effA: 50, effB: 50, advBefore: 0 }) as unknown as ExchangeRecord;
    const log = [rec(1, 'a'), rec(2, 'a'), rec(3, 'b'), rec(4, 'b'), rec(5, 'b'), rec(6, 'a')];
    expect(fightExchanges(log, { skillAt: () => 'soresu', willpower: 0 }).map((x) => x.n)).toEqual([1, 2, 1, 2, 3, 1]);
  });
});

describe('item 1: the front pace W', () => {
  it('applies only while posted at a front in a total war (arrived, not on leave), to forms and Force skills', () => {
    const s = base({ archetype: 'jediGuardian' });
    expect(selectFrontPace(s)).toBe(1);
    const posting = { frontId: 'ggw.balmorra', front: 'the Balmorra front', warId: 'greatGalacticWar', base: { name: 'the forward base on Balmorra', planet: 'Balmorra' }, sinceDay: s.clock.now.day, nextLeaveDay: s.clock.now.day + 120, arrived: true };
    const posted = { ...s, duty: { ...s.duty, posting } } as GameState;
    expect(selectFrontPace(posted)).toBe(FRONT_PACE.byArchetype['jediGuardian']);
    expect(selectFrontPace({ ...posted, duty: { ...posted.duty, posting: { ...posting, arrived: false } } } as GameState)).toBe(1);
    expect(selectFrontPace({ ...posted, duty: { ...posted.duty, leave: { fromDay: s.clock.now.day, untilDay: s.clock.now.day + 7 } } } as GameState)).toBe(1);
  });
});

describe('addendum 3: fighting tired', () => {
  const xp = (exchanges: object[], stakes: 'serious' | 'spar' = 'serious') =>
    computeCombatXp({ session: { stakes, outcome: 'won', exchanges: exchanges as never, forceUses: [] }, m: () => 1, physicalWeights: () => ({}), clamp: (_k, w) => ({ credited: w, discarded: 0 }) }).credited;
  const one = (o: object) => ({ skillId: 'soresu', gap: 0, ...o });

  it('3a: the gap is read from rested levels: being tired never makes the opponent look stronger', () => {
    const rec = { n: 1, kind: 'buildUp', targetId: 'b', effA: 40, effB: 50, restA: 50, restB: 50, advBefore: 0, dieA: 5, strainA: 1 } as unknown as ExchangeRecord;
    expect(fightExchanges([rec], { skillAt: () => 'soresu', willpower: 0 })[0]!.gap).toBe(0);
  });

  it(`3c: good form (d20 ${GOOD_FORM.threshold}+) under strain pays more, up to x${GOOD_FORM.maxMult} at the hard limit; low rolls no bonus, no penalty in a live fight`, () => {
    expect(goodFormMult(0)).toBe(1);
    expect(goodFormMult(2)).toBeCloseTo(1.5, 10);
    expect(goodFormMult(4)).toBeCloseTo(2, 10);
    expect(goodFormMult(9)).toBeCloseTo(2, 10);
    const rest = xp([one({ form: false, strain: 0 })])['soresu']!;
    expect(xp([one({ form: true, strain: 2 })])['soresu']! / rest).toBeCloseTo(1.5, 10);
    expect(xp([one({ form: false, strain: 2 })])['soresu']! / rest).toBeCloseTo(1, 10);
    const rec = (d: number) => ({ n: 1, kind: 'buildUp', targetId: 'b', effA: 50, effB: 50, advBefore: 0, dieA: d, strainA: 1 }) as unknown as ExchangeRecord;
    expect(fightExchanges([rec(14)], { skillAt: () => 'soresu', willpower: 0 })[0]!.form).toBe(true);
    expect(fightExchanges([rec(13)], { skillAt: () => 'soresu', willpower: 0 })[0]!.form).toBe(false);
  });

  it('3d: a spar follows the training efficiency: a tired low roll pays e(strain), good form still earns the bonus', () => {
    const rest = xp([one({ form: false, strain: 0 })], 'spar')['soresu']!;
    expect(xp([one({ form: false, strain: 1 })], 'spar')['soresu']! / rest).toBeCloseTo(efficiency(1), 10);
    expect(xp([one({ form: true, strain: 1 })], 'spar')['soresu']! / rest).toBeCloseTo(goodFormMult(1), 10);
  });

  it(`3b: an exchange at strain ${STRAIN_WILLPOWER.from}+ teaches Willpower by the fatigue curve, never against foes 35+ weaker`, () => {
    expect(xp([one({ strain: 0.5 })])['willpower']).toBeUndefined();
    expect(xp([one({ strain: 1 })])['willpower']).toBeCloseTo(STRAIN_WILLPOWER.perExchange * fatigueWillpowerRate(1), 10);
    expect(xp([one({ strain: 1, gap: -40 })])['willpower']).toBeUndefined();
  });

  it('3e: pushing lowers the threshold by Willpower (never below 10), and good form while pushing teaches Endurance', () => {
    expect(goodFormThreshold(false, 100)).toBe(14);
    expect(goodFormThreshold(true, 50)).toBe(12);
    expect(goodFormThreshold(true, 150)).toBe(10);
    expect(xp([one({ form: true, strain: 1, push: true })])['endurance']).toBeCloseTo(PUSH_ENDURANCE.perExchange, 10);
    expect(xp([one({ form: false, strain: 1, push: true })])['endurance']).toBeUndefined();
  });

  it(`3e: pushing costs x${PUSH_THROUGH.strainMult} the strain each exchange; the setting is the player's (pushSet)`, () => {
    const s0 = ev(base(), [{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind: 'thug', count: 1 }], stakes: 'serious', terrainTags: [] }]).state;
    expect(ev(s0, [{ type: 'pushSet', on: true }], 'ai').rejected).toHaveLength(1);
    const on = ev(s0, [{ type: 'pushSet', on: true }], 'player').state;
    expect((on.combat.active!.duel as DuelState).a.pushing).toBe(true);
    const step = (s: GameState) => {
      const d = s.combat.active!.duel as DuelState;
      const r = resolveExchange({ ...d, advantage: 0 }, { sparring: null, situations: [], footing: 0, dyingRiskStakes: false }, s.clock.now.day);
      return r.a.meters.p - d.a.meters.p;
    };
    expect(step(on) / step(s0)).toBeCloseTo(PUSH_THROUGH.strainMult, 6);
  });
});

describe('addendum 2: training-saber spars injure mildly, never seriously', () => {
  it('the chance per landed hit rises with strain; a training-saber spar never leaves worse than a minor injury', () => {
    expect(sparInjuryChance(0)).toBe(SPAR_INJURY.atRest);
    expect(sparInjuryChance(1)).toBeCloseTo(SPAR_INJURY.atCapacity, 10);
    expect(sparInjuryChance(4)).toBeCloseTo(SPAR_INJURY.atHardLimit, 10);
    expect(sparInjuryChance(0.5)).toBeGreaterThan(sparInjuryChance(0));
    const s = ev(base(), [{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind: 'thug', count: 1 }], stakes: 'spar', terrainTags: [], sparringMode: 'trainingSaber' }]).state;
    const d0 = s.combat.active!.duel as DuelState;
    let injured = 0;
    let duel = { ...d0, a: { ...d0.a, meters: { ...d0.a.meters, p: d0.a.caps.p * 3.9 } } } as DuelState;
    const ctx = { sparring: 'trainingSaber' as const, situations: [], footing: 0, dyingRiskStakes: false };
    for (let i = 0; i < 3000; i++) {
      duel = resolveExchange({ ...duel, end: null, advantage: -3, a: { ...duel.a, vitality: duel.a.maxVitality, meters: { ...duel.a.meters, p: duel.a.caps.p * 3.9 } } }, ctx, s.clock.now.day);
      for (const w of duel.a.wounds) expect(w.severity).toBe('minor');
      injured = duel.a.wounds.length;
    }
    expect(injured).toBeGreaterThan(0);
  });
});
