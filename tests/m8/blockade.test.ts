// M8 Phase C (D-469): running a blockade. The pure rules (ratings, age, knowledge, the runs) and the Hydian Way blockade in
// play, tied to its world events. Every number in the rules is invented; the tests check the order and the shape the design
// notes give, not the numbers.
import { describe, expect, it } from 'vitest';
import { BLOCKADES, type BlockadeApproach, type BlockadeDef } from '../../src/data/blockades';
import { AROUND_BY_AGE, CAPTIVE_DAYS, OBSERVE, TRAINED_RANGE_KM } from '../../src/data/blockade.config';
import { approachOptions, approachRating, aroundRating, blockadeAge, landingKnowledge, runBlockade, safeKm, sensorKm, watchBlockade, type Runner } from '../../src/engine/blockade';
import { absDayFromDate } from '../../src/engine/calendar';
import { seedRng } from '../../src/engine/rng';
import type { LevelInputs } from '../../src/engine/rolls';
import { selectNetworkState, selectStandingBlockades } from '../../src/features/world/selectors';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { Registry } from '../../src/state/types';
import { makeEstimator } from '../../src/ai/tokenRatio';
import type { Intent } from '../../src/ai/schemas/intent';
import { selectCaptors, stateBlock } from '../../src/turn/context';
import { expandChoice } from '../../src/turn/expandChoice';
import { resolveTurn } from '../../src/turn/resolve';
import { blockadeChoices, describeTravel, planTravel } from '../../src/turn/travel';

/** The Hydian Way blockade, and the same with an untrained line (the young blockade of the design notes' table). */
const HYDIAN = BLOCKADES[0]!;
const LOOSE: BlockadeDef = { ...HYDIAN, disciplined: false };
const START = absDayFromDate({ year: -3661, month: 1, day: 1 });
const lv = (level: number): LevelInputs => ({ level, woundPenalty: 0, rust: 0, vitalitySpent: false, fatigueEfficiency: 1 });
const runner = (over: Partial<Runner> = {}, level = 40): Runner => ({
  trained: false,
  observed: null,
  protector: null,
  contact: null,
  smuggler: null,
  masking: false,
  fleet: false,
  noShip: false,
  shipOutside: null,
  ...over,
  levels: { charisma: lv(level), intelligence: lv(level), piloting: lv(level), stealth: lv(level), endurance: lv(level), tracking: lv(level), forceSense: lv(0), ...(over.levels ?? {}) },
});
/** The share of seeded runs that get through. */
const odds = (approach: BlockadeApproach, r: Runner, b: BlockadeDef = HYDIAN, day = START + 60, direction: 'in' | 'out' = 'in'): number => {
  let n = 0;
  for (let i = 0; i < 400; i++) if (runBlockade(seedRng(`${approach}${i}`), { blockade: b, day, approach, runner: r, direction }).result === 'through') n++;
  return n / 400;
};
const level = (l: 1 | 2 | 3): BlockadeDef => ({ ...HYDIAN, states: [{ ...HYDIAN.states[0]!, level: l }] });

describe('how hard each approach is', () => {
  it('follows the design table: protection, undercover, smuggling, sneaking, forcing', () => {
    const r = (a: BlockadeApproach): number => approachRating(HYDIAN, a, START);
    expect(r('ride')).toBeLessThan(r('undercover'));
    expect(r('undercover')).toBeLessThan(r('smuggle'));
    expect(r('smuggle')).toBeLessThan(r('sneak'));
    expect(r('sneak')).toBeLessThan(r('force'));
  });
  it('the level makes every approach harder', () => {
    for (const a of ['ride', 'undercover', 'smuggle', 'sneak', 'aroundClose', 'aroundOnFoot', 'force'] as const) {
      const at = ([1, 2, 3] as const).map((l) => approachRating(level(l), a, START + 200));
      expect(at[0]!, a).toBeLessThan(at[1]!);
      expect(at[1]!, a).toBeLessThan(at[2]!);
    }
  });
  it('going around hardens with age, smoothly: medium, very hard, hardest', () => {
    expect([aroundRating(LOOSE, 3, 0), aroundRating(LOOSE, 3, 365)]).toEqual([AROUND_BY_AGE[0]![1], AROUND_BY_AGE[4]![1]]);
    let last = -1;
    for (let d = 0; d <= 400; d += 5) {
      const now = aroundRating(LOOSE, 3, d);
      expect(now).toBeGreaterThanOrEqual(last);
      last = now;
    }
  });
  it('level matters more than age at the low end: a trade blockade barely tightens', () => {
    const tighten = (l: 1 | 2 | 3): number => aroundRating(LOOSE, l, 365) - aroundRating(LOOSE, l, 0);
    expect(tighten(1)).toBeLessThan(tighten(3) / 5);
    expect(tighten(2)).toBeLessThan(tighten(3));
  });
  it('a trained military leaves no holes in its first days', () => {
    expect(HYDIAN.disciplined).toBe(true); // the Mandalorians (D-470)
    expect(aroundRating(HYDIAN, 3, 0)).toBeGreaterThan(aroundRating(LOOSE, 3, 0) + 20);
    expect(aroundRating(HYDIAN, 3, 365)).toBe(aroundRating(LOOSE, 3, 365));
    expect(blockadeAge(HYDIAN, START)).toBe(60);
  });
  it('sensor coverage grows the longer it stands; alertness, strength and money count', () => {
    expect(sensorKm(HYDIAN, 0)).toBe(HYDIAN.sensors.startKm);
    expect(sensorKm(HYDIAN, 200)).toBeGreaterThan(sensorKm(HYDIAN, 30));
    expect(sensorKm(HYDIAN, 5000)).toBeCloseTo(HYDIAN.sensors.fullKm, 3);
    const s = HYDIAN.states[0]!;
    const w = (x: Partial<typeof s>): BlockadeDef => ({ ...HYDIAN, states: [{ ...s, ...x }] });
    expect(approachRating(w({ alertness: 5 }), 'undercover', START)).toBeGreaterThan(approachRating(HYDIAN, 'undercover', START));
    expect(approachRating(w({ strength: 5 }), 'sneak', START)).toBeGreaterThan(approachRating(HYDIAN, 'sneak', START));
    expect(approachRating(w({ strength: 5 }), 'undercover', START)).toBe(approachRating(HYDIAN, 'undercover', START));
    expect(approachRating(w({ corruptibility: 5 }), 'smuggle', START)).toBeLessThan(approachRating(HYDIAN, 'smuggle', START));
    expect(approachRating(w({ corruptibility: 5 }), 'sneak', START)).toBe(approachRating(HYDIAN, 'sneak', START));
  });
  it('is one system: a dated state takes over on its day, and any blockade at any date uses it', () => {
    const s = HYDIAN.states[0]!;
    const naboo: BlockadeDef = { ...HYDIAN, id: 'test-32', start: { year: -32 }, ageOnFirstDay: 0, zone: { worlds: ['Naboo'] }, states: [{ ...s, from: { year: -32 }, level: 1 }, { ...s, from: { year: -32, month: 3 }, level: 3 }] };
    const day = (m: number) => absDayFromDate({ year: -32, month: m, day: 5 });
    expect(blockadeAge(naboo, day(1))).toBe(4);
    expect(approachRating(naboo, 'undercover', day(1))).toBeLessThan(approachRating(naboo, 'undercover', day(4)));
  });
});

describe('what each approach needs', () => {
  const open = (r: Runner, direction: 'in' | 'out' | 'through' = 'in') => approachOptions(HYDIAN, START, r, direction).filter((o) => o.available).map((o) => o.approach);
  it('with nothing and nobody, only the way around is open, and the rest say what they need', () => {
    expect(open(runner())).toEqual(['aroundClose', 'aroundOnFoot']);
    const notes = approachOptions(HYDIAN, START, runner()).filter((o) => !o.available).map((o) => o.note).join('; ');
    for (const n of ['papers', 'identities and codes', 'a smuggler', 'sensor masking', 'fleet']) expect(notes).toContain(n);
  });
  it('papers or a friend, a contact or tradecraft, a smuggler, the tech, a fleet or one of the best pilots', () => {
    expect(open(runner({ protector: 'x' }))).toContain('ride');
    expect(open(runner({ contact: 'x' }))).toContain('undercover');
    expect(open(runner({ trained: true }))).toContain('undercover');
    expect(open(runner({ smuggler: { name: 'x', level: 50 } }))).toContain('smuggle');
    expect(open(runner({ masking: true }))).toContain('sneak');
    expect(open(runner({ fleet: true }))).toContain('force');
    expect(open(runner({}, 95))).toContain('force');
    expect(open(runner({}, 80))).not.toContain('force');
  });
  it('out uses the same approaches; a ship left outside means walking back to it', () => {
    expect(open(runner({ protector: 'x', contact: 'y' }), 'out')).toEqual(['ride', 'undercover', 'aroundClose']);
    expect(open(runner({ protector: 'x', shipOutside: { days: 4 } }), 'out')).toEqual(['aroundOnFoot']);
    expect(open(runner(), 'through')).toEqual(['aroundClose']);
  });
});

describe('knowing where it is safe to land', () => {
  it('training gives a general range that never expires', () => {
    const r = runner({ trained: true });
    for (const d of [0, 100, 5000]) expect(landingKnowledge(HYDIAN, START + d, r)).toEqual({ kind: 'range', from: TRAINED_RANGE_KM[3][0], to: TRAINED_RANGE_KM[3][1] });
  });
  it('watching gives the exact figure for this blockade, which fades after a few weeks', () => {
    const at = (daysAgo: number, trained = false) => landingKnowledge(HYDIAN, START, runner({ trained, observed: { km: 120, daysAgo } })).kind;
    expect([at(0), at(OBSERVE.freshDays), at(OBSERVE.freshDays + 1), at(OBSERVE.goneDays + 1)]).toEqual(['exact', 'exact', 'faded', 'guess']);
    expect([at(OBSERVE.freshDays + 1, true), at(OBSERVE.goneDays + 1, true)]).toEqual(['range', 'range']);
  });
  it('without it, landing is offered as a guess, and is worse for it', () => {
    expect(landingKnowledge(HYDIAN, START, runner())).toEqual({ kind: 'guess' });
    expect(approachOptions(HYDIAN, START, runner()).find((o) => o.approach === 'aroundOnFoot')!.note).toMatch(/a guess/);
    const known = odds('aroundOnFoot', runner({ observed: { km: Math.round(safeKm(HYDIAN, START + 60)), daysAgo: 1 } }));
    expect(known).toBeGreaterThan(odds('aroundOnFoot', runner()));
  });
  it('the option never gives the figure to someone who does not know it', () => {
    const clear = String(Math.round(safeKm(HYDIAN, START)));
    for (const r of [runner(), runner({ trained: true })]) expect(JSON.stringify(approachOptions(HYDIAN, START, r))).not.toContain(`${clear} km`);
  });
  it('the Force never gives it: danger sense is a warning on a failure, and leaves the landing a guess', () => {
    const seer = runner({ levels: { ...runner().levels, forceSense: lv(90) } });
    expect(landingKnowledge(HYDIAN, START, seer)).toEqual({ kind: 'guess' });
    const worst = (r: Runner): number => {
      let n = 0;
      for (let i = 0; i < 400; i++) if (['firedOn', 'captured'].includes(runBlockade(seedRng(`s${i}`), { blockade: HYDIAN, day: START + 60, approach: 'aroundClose', runner: r, direction: 'in' }).result)) n++;
      return n;
    };
    expect(worst(seer)).toBeLessThan(worst(runner()));
    const felt = Array.from({ length: 400 }, (_, i) => runBlockade(seedRng(`s${i}`), { blockade: HYDIAN, day: START + 60, approach: 'aroundClose', runner: seer, direction: 'in' })).find((x) => x.notes.some((n) => /Force warned/.test(n)))!;
    expect(felt.cards.map((c) => c.label)).toContain('Danger sense');
    // A cover story, papers and a hired pilot are not patrols to feel coming.
    expect(runBlockade(seedRng('t'), { blockade: HYDIAN, day: START, approach: 'undercover', runner: { ...seer, contact: 'x' }, direction: 'in' }).cards.map((c) => c.label)).not.toContain('Danger sense');
  });
});

describe('a run', () => {
  it('protection is the safest and forcing the hardest, at the same skill', () => {
    const r = runner({ protector: 'x', contact: 'y', smuggler: { name: 'z', level: 60 }, masking: true, fleet: true }, 60);
    const o = (['ride', 'undercover', 'smuggle', 'sneak', 'force'] as const).map((a) => odds(a, r));
    for (let i = 1; i < o.length; i++) expect(o[i]!, String(i)).toBeLessThanOrEqual(o[i - 1]!);
    expect(o[0]!).toBeGreaterThan(0.6);
  });
  it('landing outside patrol range and walking in is the safest way around, for someone who knows how far out that is', () => {
    for (const l of [20, 40, 60, 80]) {
      const close = odds('aroundClose', runner({}, l));
      const guess = odds('aroundOnFoot', runner({}, l));
      const trained = odds('aroundOnFoot', runner({ trained: true }, l));
      const watched = odds('aroundOnFoot', runner({ observed: { km: Math.round(safeKm(HYDIAN, START + 60)), daysAgo: 1 } }, l));
      expect(trained, `trained ${l}`).toBeGreaterThan(close);
      expect(watched, `watched ${l}`).toBeGreaterThan(close);
      expect(Math.min(trained, watched), `guess ${l}`).toBeGreaterThan(guess);
    }
  });
  it('the trek is its own risk: days pass, and patrols or the land can end it', () => {
    const r = runner({ trained: true });
    const runs = Array.from({ length: 300 }, (_, i) => runBlockade(seedRng(`w${i}`), { blockade: HYDIAN, day: START + 60, approach: 'aroundOnFoot', runner: r, direction: 'in' }));
    const walked = runs.filter((x) => x.cards.some((c) => /trek/.test(c.label)));
    expect(walked.some((x) => x.result === 'through' && x.notes.some((n) => /days? on foot/.test(n)))).toBe(true);
    expect(walked.some((x) => x.result !== 'through')).toBe(true);
    expect(walked.every((x) => x.result !== 'through' || x.extraHours >= 72 + 24)).toBe(true);
  });
  it('the longer the stay, the likelier the ship left outside is found', () => {
    const found = (days: number): number => Array.from({ length: 300 }, (_, i) => runBlockade(seedRng(`f${i}`), { blockade: HYDIAN, day: START + 90, approach: 'aroundOnFoot', runner: runner({ shipOutside: { days } }), direction: 'out' })).filter((x) => x.shipFound).length;
    expect(found(60)).toBeGreaterThan(found(3));
  });
  it('getting out is as hard as getting in, and harder after a longer stay', () => {
    const r = runner({}, 70);
    expect(odds('aroundClose', r, HYDIAN, START, 'out')).toBe(odds('aroundClose', r, HYDIAN, START, 'in'));
    expect(odds('aroundClose', r, HYDIAN, START + 400, 'out')).toBeLessThan(odds('aroundClose', r, HYDIAN, START, 'out'));
  });
  it('a failure follows the blockade\'s own ladder, and a failed bluff can become a run, once and harder', () => {
    const runs = Array.from({ length: 400 }, (_, i) => runBlockade(seedRng(`l${i}`), { blockade: HYDIAN, day: START, approach: 'undercover', runner: runner({ contact: 'x' }, 20), direction: 'in' }));
    const by = (r: string) => runs.filter((x) => x.result === r);
    for (const r of ['turnedBack', 'boarded', 'firedOn']) expect(by(r).length, r).toBeGreaterThan(0);
    expect(by('turnedBack')[0]!).toMatchObject({ turnsInto: ['force'], penalty: 10 });
    expect(by('boarded')[0]!.credits).toBeGreaterThan(by('turnedBack')[0]!.credits); // the fine
    expect(by('firedOn')[0]!).toMatchObject({ hazard: { type: 'crash', severity: 1 }, turnsInto: [] });
    const again = runBlockade(seedRng('l1'), { blockade: HYDIAN, day: START, approach: 'force', runner: runner({}, 5), direction: 'in', penalty: 10 });
    expect(again.turnsInto).toEqual([]);
    expect(again.cards[0]!.rating).toBe(approachRating(HYDIAN, 'force', START) + 10);
  });
  it('a trade blockade answers more mildly, and a run\'s fame follows the approach and the level', () => {
    const r = runner({ contact: 'x' }, 5);
    const worst = (b: BlockadeDef): boolean => Array.from({ length: 300 }, (_, i) => runBlockade(seedRng(`m${i}`), { blockade: b, day: START, approach: 'undercover', runner: r, direction: 'in' }).result).includes('firedOn');
    expect([worst(level(1)), worst(HYDIAN)]).toEqual([false, true]);
    const ace = runner({ fleet: true, protector: 'x' }, 120);
    const win = (a: BlockadeApproach, b = HYDIAN) => Array.from({ length: 300 }, (_, i) => runBlockade(seedRng(`a${i}`), { blockade: b, day: START, approach: a, runner: ace, direction: 'in' })).find((x) => x.result === 'through')!;
    expect(win('force').fame).toBeGreaterThan(win('force', level(1)).fame);
    expect([win('ride').fame, win('force').witnessed, win('ride').witnessed]).toEqual([0, true, false]);
  });
  it('watching takes time, and a bad watch is noticed', () => {
    const w = Array.from({ length: 300 }, (_, i) => watchBlockade(seedRng(`o${i}`), HYDIAN, START, lv(20), 12));
    expect(new Set(w.map((x) => x.counted))).toEqual(new Set([0, 6, 12]));
    expect(w.filter((x) => x.noticed).every((x) => x.counted === 0)).toBe(true);
  });
});

// ---- In play ----

/** Only the world's time hook, so days pass quickly. */
const FAST: Registry<GameState> = REGISTRY.map((f) => {
  if (f.id === 'world') return f;
  const { onTimeAdvanced: _hook, ...rest } = f;
  return rest;
});
const fresh = (over: { optionId?: string; faction?: string; path?: 'jedi' | 'career'; archetype?: string } = {}, day = START): GameState => {
  const s = createInitialState<GameState>(FAST, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'block',
    start: { day, second: 8 * 3600 },
    character: {
      name: 'Kael',
      birthDay: day - 25 * 368,
      path: over.path ?? 'jedi',
      archetype: over.archetype ?? 'jediGuardian',
      ...(over.path === 'career' ? {} : { mainFormId: 'soresu', trainingStartAge: 4 }),
      ...(over.optionId ? { start: { optionId: over.optionId, faction: over.faction ?? 'republic', imperialBorn: false } } : {}),
    },
    rank: over.path === 'career' ? 'career' : 'knight',
  });
  return applyEvents(FAST, s, [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: '', moveHere: true }], { source: 'ai' }).state;
};
const go = (names: string[], blockade?: Intent['blockade']): Intent => ({ actionType: 'travel', targets: [], references: [], unknownNames: names, ...(blockade ? { blockade } : {}) });
const pass = (s: GameState, days: number): GameState => advanceTime(FAST, s, { seconds: days * 86_400, reason: 't', source: 'turnDraft' }).state;
const befriend = (s: GameState, name: string, faction: string, role: string): GameState => {
  let x = applyEvents(FAST, s, [{ type: 'npcIntroduced', name, species: 'human', faction, role, ageApprox: 40, description: '' }], { source: 'ai' }).state;
  const id = Object.values(x.npcs.byId).find((n) => n.name === name)!.id;
  for (let i = 0; i < 3; i++) x = applyEvents(FAST, x, [{ type: 'relationshipChanged', npcRef: id, delta: 3, reason: 'a debt' }], { source: 'ai' }).state;
  return x;
};

describe('the Hydian Way blockade in play', () => {
  it('stands from the 3,661 start until the battle breaks it on 15 January 3,660, and no longer', () => {
    const s = fresh();
    expect(selectStandingBlockades(s).map((b) => b.id)).toEqual(['hydian-way-3661']);
    const jan14 = pass(s, absDayFromDate({ year: -3660, month: 1, day: 14 }) - START);
    expect(planTravel(jan14, go(['Malastare']))).toMatchObject({ ok: false });
    expect(selectStandingBlockades(pass(jan14, 2))).toEqual([]);
    expect(planTravel(pass(jan14, 2), go(['Malastare']))).toMatchObject({ ok: true });
    expect(selectStandingBlockades(fresh({}, START - 400))).toEqual([]); // not before it begins
  });
  it('a blockade the story never breaks goes on', () => {
    const s0 = fresh();
    const net = selectNetworkState(s0);
    const s = { ...s0, world: { ...s0.world, network: { ...net, tags: { ...net.tags, 'E.3660.hydian_battle#cond.hutt_backing': { day: START, cause: 'test', toldTurn: null } } } } };
    expect(selectStandingBlockades(pass(s, 800)).length).toBe(1);
  });
  it('the flat refusal is gone: the refusal lists what is open and what the rest need, and code offers the open ones', () => {
    const t = planTravel(fresh(), go(['Malastare']))!;
    expect(t.blockade).toMatchObject({ id: 'hydian-way-3661', direction: 'in' });
    const text = describeTravel(t);
    expect(text).toMatch(/Go around and slip in close \[open/);
    expect(text).toMatch(/Ride under protection \[not open: needs papers from a permitted party, or a friend in Hutt-backed shipping\]/);
    expect(text).not.toMatch(/running it is a story event/);
    const choices = blockadeChoices(t);
    expect(choices.map((c) => c.intent.blockade)).toEqual(['aroundClose', 'aroundOnFoot']);
    const { intent, notes } = expandChoice(choices[0]!, () => null);
    expect([intent.blockade, intent.unknownNames, notes]).toEqual(['aroundClose', ['Malastare'], []]);
  });
  it('contacts open approaches: a friend among Hutt-backed shippers, and an official who gets codes', () => {
    const open = (s: GameState): string[] => planTravel(s, go(['Malastare']))!.blockade!.options.filter((o) => o.available).map((o) => o.approach);
    expect(open(befriend(fresh(), 'Dara Voss', 'underworld', 'merchant'))).toContain('ride');
    expect(open(befriend(fresh(), 'Captain Orl', 'republic', 'officer'))).toContain('undercover');
    const met = applyEvents(FAST, fresh(), [{ type: 'npcIntroduced', name: 'Tam Renn', species: 'human', faction: 'underworld', role: 'smuggler', ageApprox: 30, description: '' }], { source: 'ai' }).state;
    expect(open(met)).toContain('smuggle');
    expect(open(fresh({ optionId: 'sis-agent', path: 'career', archetype: 'soldier' }))).toContain('undercover'); // trained
    expect(open(applyEvents(FAST, fresh(), [{ type: 'flagSet', flag: 'shipSystem:masking' }], { source: 'engine' }).state)).toContain('sneak');
  });
  it('those who pass freely are not stopped', () => {
    const s = fresh({ optionId: 'mandalorian-blockade', faction: 'mandalorians', path: 'career', archetype: 'mandalorian' });
    expect(planTravel(s, go(['Malastare']))).toMatchObject({ ok: true });
  });
  it('a run in a turn: the roll, the time, the record, and the way out from the other side', () => {
    let s = fresh();
    let got: GameState | null = null;
    for (let i = 0; i < 40 && !got; i++) {
      const r = resolveTurn(FAST, { ...s, meta: { ...s.meta, rngState: seedRng(`r${i}`) } }, go(['Malastare'], 'aroundClose'));
      expect(r.draft.rejected).toEqual([]);
      expect(r.draft.checks[0]!.label).toBe('Slipping in close');
      expect(r.state.world.blockades.runs.length).toBe(1);
      expect(r.state.clock.now.day).toBeGreaterThan(s.clock.now.day);
      if (r.draft.travel!.ok) got = r.state;
      else expect(r.draft.travel!.run!.result).not.toBe('through');
    }
    expect(got).not.toBeNull();
    s = applyEvents(FAST, got!, [{ type: 'locationIntroduced', name: 'Malastare', kind: 'planet', region: 'Mid Rim', description: '', moveHere: true }], { source: 'ai' }).state;
    expect(planTravel(s, go(['Coruscant']))!.blockade!.direction).toBe('out');
    expect(stateBlock(s, makeEstimator(4)).text).toMatch(/Blockade: the Mandalorian blockade of the Hydian Way.*a full cordon\)\. Leaving this world means running it/);
  });
  it('an approach that is not open is refused, rolls nothing and takes no time', () => {
    const s = fresh();
    const r = resolveTurn(FAST, s, go(['Malastare'], 'ride'));
    expect([r.draft.checks.length, r.state.clock.now, r.state.world.blockades.runs.length]).toEqual([0, s.clock.now, 0]);
    expect(r.draft.travel!.reason).toMatch(/needs papers/);
  });
  it('a failed attempt leaves the line sharper, and may become another on the next turn only', () => {
    const s = befriend(fresh(), 'Captain Orl', 'republic', 'officer');
    let failed: GameState | null = null;
    for (let i = 0; i < 60 && !failed; i++) {
      const r = resolveTurn(FAST, { ...s, meta: { ...s.meta, rngState: seedRng(`p${i}`) } }, go(['Malastare'], 'undercover'));
      if (r.draft.travel!.run!.turnsInto.length) {
        failed = r.state;
        expect(describeTravel(r.draft.travel!)).toMatch(/can still turn into: force a way through/);
        expect(blockadeChoices(r.draft.travel!).map((c) => c.intent.blockade)).toEqual(['force']);
      }
    }
    expect(failed!.world.blockades.heat['hydian-way-3661']!.points).toBe(1);
    const next = { ...failed!, meta: { ...failed!.meta, turn: failed!.meta.turn + 1 } };
    expect(planTravel(next, go(['Malastare']))!.blockade).toMatchObject({ penalty: expect.any(Number), options: [{ approach: 'force', available: true }] });
    const later = { ...failed!, meta: { ...failed!.meta, turn: failed!.meta.turn + 3 } };
    expect(planTravel(later, go(['Malastare']))!.blockade!.penalty).toBe(0);
  });
  it('watching from the strip teaches the exact figure for three days\' work, and it fades', () => {
    let s = applyEvents(FAST, fresh(), [{ type: 'locationIntroduced', name: 'Sullust', kind: 'planet', region: 'Outer Rim Territories', description: '', moveHere: true }], { source: 'ai' }).state;
    const watch: Intent = { actionType: 'investigate', targets: [], references: [], unknownNames: [], blockade: 'observe' };
    for (let i = 0; i < 30 && !s.world.blockades.watched['hydian-way-3661']?.knownDay; i++) s = resolveTurn(FAST, s, watch).state;
    const known = s.world.blockades.watched['hydian-way-3661']!;
    expect(known.hours).toBeGreaterThanOrEqual(OBSERVE.hoursNeeded);
    expect(known.km).toBe(Math.round(safeKm(HYDIAN, known.knownDay!)));
    const note = (x: GameState): string => planTravel(x, go(['Malastare']))!.blockade!.options.find((o) => o.approach === 'aroundOnFoot')!.note;
    expect(note(s)).toMatch(/watched: landing beyond about \d+ km/);
    expect(note(pass(s, OBSERVE.freshDays + 2))).toMatch(/some weeks ago/);
    expect(note(pass(s, OBSERVE.goneDays + 2))).toMatch(/a guess/);
    // Nothing to watch from Coruscant.
    expect(resolveTurn(FAST, fresh(), watch).draft.report.join()).toMatch(/no blockade to watch/);
  });
  it('the narrator has no event that runs a blockade, and the figures are never sent', () => {
    for (const e of [{ type: 'blockadeRunRecorded' }, { type: 'blockadeWatched', blockadeId: 'hydian-way-3661', counted: 99, noticed: false }]) expect(applyEvents(FAST, fresh(), [e], { source: 'ai' }).applied).toEqual([]);
    const s = applyEvents(FAST, fresh(), [{ type: 'locationIntroduced', name: 'Malastare', kind: 'planet', region: 'Mid Rim', description: '', moveHere: true }], { source: 'ai' }).state;
    expect(stateBlock(s, makeEstimator(4)).text).not.toMatch(/\bkm\b/);
  });
  it('runs through the full day loop, however it comes out; a capture and damage are recorded', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const s = fresh();
      const r = resolveTurn(REGISTRY, { ...s, meta: { ...s.meta, rngState: seedRng(`full${i}`) } }, go(['Malastare'], 'aroundOnFoot'));
      expect(r.draft.rejected).toEqual([]);
      const { result } = r.state.world.blockades.runs[0]!;
      seen.add(result);
      expect(r.state.clock.now.day, result).toBeGreaterThan(s.clock.now.day);
      expect(r.state.world.blockades.captive !== null).toBe(result === 'captured');
      if (result === 'through') expect(r.state.world.blockades.shipOutside).not.toBeNull();
    }
    expect(seen.size).toBeGreaterThan(1);
  }, 60_000);
  describe('a capture (D-470 [6])', () => {
    /** Forced through and taken, aboard the ship. */
    const taken = (): { before: GameState; r: ReturnType<typeof resolveTurn> } => {
      const before = applyEvents(FAST, fresh(), [{ type: 'flagSet', flag: 'fleetCommand' }], { source: 'engine' }).state;
      for (let i = 0; i < 60; i++) {
        const r = resolveTurn(FAST, { ...before, meta: { ...before.meta, rngState: seedRng(`cap${i}`) } }, go(['Malastare'], 'force'));
        if (r.state.world.blockades.runs[0]!.result === 'captured') return { before, r };
      }
      throw new Error('no capture in 60 seeds');
    };
    const nextTurn = (s: GameState): GameState => ({ ...s, meta: { ...s.meta, turn: s.meta.turn + 1 } });
    it('takes a prisoner, the ship and the cargo, and names the captors as a fight does', () => {
      const { r } = taken();
      const b = r.state.world.blockades;
      expect(b.captive).toMatchObject({ group: 'Mandalorian warriors of the Mandalorian blockade of the Hydian Way', kind: 'mandalorian' });
      expect([b.impounded?.blockadeId, b.shipOutside]).toEqual(['hydian-way-3661', null]);
      expect(b.ledger.map((l) => l.reason).join()).toMatch(/cargo seized/);
      expect(selectCaptors(r.state)).toMatchObject({ kind: 'mandalorian', blockade: true });
      expect(stateBlock(r.state, makeEstimator(4)).text).toMatch(/CAPTIVE: the player character was captured by Mandalorian warriors of .* at the blockade\. Name these captors.*Their ship is impounded/);
      expect(describeTravel(r.draft.travel!)).toMatch(/taken prisoner; the ship is impounded and its cargo seized/);
      expect(r.draft.travel!.run!.turnsInto).toEqual([]);
    });
    it('a prisoner goes nowhere; wherever they are held, they stay one until it ends', () => {
      const { r } = taken();
      expect(planTravel(r.state, go(['Alderaan']))).toMatchObject({ ok: false, reason: expect.stringMatching(/a prisoner of Mandalorian warriors/) });
      const cell = applyEvents(FAST, r.state, [{ type: 'locationIntroduced', name: 'Brig', kind: 'ship', region: 'Hydian Way', description: '', moveHere: true }], { source: 'ai' }).state;
      expect(selectCaptors(cell)).not.toBeNull();
      expect(selectCaptors(pass(r.state, CAPTIVE_DAYS + 5))).toBeNull(); // at most this long
    });
    it('the story ends it on a later turn, with or without the ship, and only for a prisoner the engine recorded', () => {
      const { before, r } = taken();
      const free = { type: 'captivityEnded', how: 'escaped', withShip: false };
      expect(applyEvents(FAST, before, [free], { source: 'ai' }).applied).toEqual([]);
      expect(applyEvents(FAST, r.state, [free], { source: 'ai' }).rejected.map((x) => x.reason).join()).toMatch(/taken this turn/);
      const out = applyEvents(FAST, nextTurn(r.state), [free], { source: 'ai' }).state;
      expect([selectCaptors(out), out.world.blockades.impounded !== null]).toEqual([null, true]);
      // Without the ship: a civilian transport, and nothing that needs a ship of one's own.
      expect(planTravel(out, go(['Alderaan']))).toMatchObject({ ok: true, shipClass: 3 });
      const open = planTravel({ ...out, flags: { set: [] } }, go(['Malastare']))!.blockade!.options.filter((o) => o.available).map((o) => o.approach);
      expect(open).toEqual([]);
      const back = applyEvents(FAST, nextTurn(r.state), [{ ...free, how: 'released', withShip: true }], { source: 'ai' }).state;
      expect(planTravel(back, go(['Alderaan']))).toMatchObject({ shipClass: 2 });
    });
    it('the narrator is offered the ending only while the character is held', () => {
      const { before, r } = taken();
      const offered = (s: GameState): boolean => REGISTRY.find((f) => f.id === 'world')!.events['captivityEnded']!.narrative!(s, { timeAdvancedByDraft: true });
      expect([offered(before), offered(r.state)]).toEqual([false, true]);
    });
    it('taken on foot, the ship is not with them', () => {
      for (let i = 0; i < 200; i++) {
        const x = runBlockade(seedRng(`foot${i}`), { blockade: HYDIAN, day: START, approach: 'aroundOnFoot', runner: runner({ trained: true }, 20), direction: 'in' });
        if (x.result === 'captured') return void expect(x.onFoot).toBe(true);
      }
      throw new Error('no capture on foot in 200 seeds');
    });
  });
  it('a v3 save\'s "talk" run is "undercover" now', () => {
    const s = resolveTurn(FAST, fresh(), go(['Malastare'], 'aroundClose')).state;
    const env = JSON.parse(JSON.stringify(makeEnvelope(FAST, s, 'now')));
    env.featureVersions.world = 3;
    env.state.world.blockades.runs[0].approach = 'talk';
    env.state.world.blockades.captive = { by: 'x', day: 1, locationId: null };
    delete env.state.world.blockades.impounded;
    const r = loadEnvelope(FAST, env);
    expect(r.ok && [r.state.world.blockades.runs[0]!.approach, r.state.world.blockades.captive, r.state.world.blockades.impounded]).toEqual(['undercover', null, null]);
  });
  it('the save keeps it, and an older save (v2) has none', () => {
    const s = resolveTurn(FAST, fresh(), go(['Malastare'], 'aroundClose')).state;
    const env = JSON.parse(JSON.stringify(makeEnvelope(FAST, s, 'now')));
    const r = loadEnvelope(FAST, env);
    expect(r.ok && r.state.world.blockades).toEqual(s.world.blockades);
    env.featureVersions.world = 2;
    delete env.state.world.blockades;
    const old = loadEnvelope(FAST, env);
    expect(old.ok && old.state.world.blockades.runs).toEqual([]);
  });
});
