// D-208 (combat pass 2, the blocker): a dropped saber is recalled by the passive buttons; nobody fights on past the
// physical hard limit; a fight with no outcome after FIGHT_SAFETY_CAP exchanges ends as an exhausted stalemate.
import { describe, expect, it } from 'vitest';
import { FIGHT_SAFETY_CAP } from '../../src/data/combat.config';
import { PHYSICAL_COLLAPSE } from '../../src/data/health.config';
import { collapsedFromExhaustion, resolveExchange, runUntilBeat, startDuel, type Fighter } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { canAutoRecall, runPassive, type ForceProfile } from '../../src/engine/sequence';
import { forceUser, REAL } from '../support/duelSim';
import { devCharacter, runFight } from '../support/fightHarness';

const force: ForceProfile = { levelOf: () => 40, ciOf: () => 20, forceOutput: 30, trickLevel: 40 };
const unarmed = (over: Partial<Fighter> = {}): Fighter =>
  forceUser('pc', 50, { weapon: 'unarmed', skillId: 'agility', form: null, saberLost: { weapon: 'lightsaber', skillId: 'soresu', level: 50, form: 'soresu' }, caps: { p: 5, f: 20 }, ...over });
const droid = (id: string): Fighter => forceUser(id, 20, { skillId: 'blaster', form: null, weapon: 'blasterRifle', forceSense: 0, minion: true, vitality: 35, maxVitality: 35, caps: { p: 4.6, f: 0 } });

describe('the passive buttons recall a dropped saber first (D-208)', () => {
  it('Resolve to end retries the recall until the saber is back, then fights armed', () => {
    for (let i = 0; i < 40; i++) {
      const s0 = { duel: startDuel(unarmed(), [droid('d1'), droid('d2')], seedRng(`rc${i}`)), patternUses: {}, objects: {} };
      const r = runPassive(s0, REAL, 0, 'toEnd', {}, force);
      expect(r.lines.length).toBeGreaterThan(0);
      expect(r.lines.every((l) => l.startsWith('auto recall: step 1 saber recall: '))).toBe(true);
      // Ends with the saber back in hand, or the fight over while still trying.
      if (!r.state.duel.end) throw new Error('toEnd must end the fight');
      const recalled = r.lines.some((l) => l.includes(': DONE ('));
      if (recalled) expect(r.state.duel.log.some((x) => x.kind !== 'force' && x.effA > 0)).toBe(true);
    }
  });
  it('Next beat stops after one attempt (a Force-action beat); Fight on stops after a failed attempt', () => {
    let beatStops = 0;
    for (let i = 0; i < 40; i++) {
      const s0 = { duel: startDuel(unarmed(), [droid('d1')], seedRng(`nb${i}`)), patternUses: {}, objects: {} };
      const b = runPassive(s0, REAL, 0, 'beat', {}, force);
      expect(b.lines.length).toBe(1);
      if (!b.state.duel.end) {
        expect(b.beat).toBe('forceAction');
        beatStops++;
      }
      const f = runPassive(s0, REAL, 0, 'fightOn', {}, force);
      if (f.state.duel.a.saberLost && !f.state.duel.end) expect(f.beat).toBe('forceAction');
    }
    expect(beatStops).toBeGreaterThan(0);
  });
  it('no recall without telekinesis, inside a Force-null bubble, or with the saber in hand', () => {
    const d = startDuel(unarmed(), [droid('d1')], seedRng('x'));
    expect(canAutoRecall(d, REAL, force)).toBe(true);
    expect(canAutoRecall(d, REAL, { ...force, levelOf: () => 0 })).toBe(false);
    expect(canAutoRecall(d, { ...REAL, forceNegated: true }, force)).toBe(false);
    expect(canAutoRecall(startDuel(forceUser('pc', 50), [droid('d1')], seedRng('y')), REAL, force)).toBe(false);
  });
  it('through the turn: a Knight who dropped the saber recalls it on Resolve to end and wins in a normal length', async () => {
    const base = await devCharacter('knight', 30);
    let won = 0;
    let recalls = 0;
    for (let i = 0; i < 6; i++) {
      // Throw until the saber drops, then Resolve to end (the pass-2 blocker: 322 bare-handed exchanges, lost).
      const f = runFight(base, { minionGroups: [{ kind: 'battleDroid', count: 6 }], terrainTags: ['unevenGround', 'cover', 'fallenTimber', 'looseRock'], stakes: 'serious' }, (t, d) => (!d.a.saberLost && t < 12 ? { action: 'force', force: { kind: 'saberThrow' } } : { action: 'resolve' }), `blk${i}`, 40);
      if (f.notes.some((n) => n.startsWith('auto recall:'))) recalls++;
      if (f.outcome === 'won') won++;
      expect(f.exchanges).toBeLessThan(FIGHT_SAFETY_CAP.exchanges);
    }
    expect(recalls).toBeGreaterThan(0);
    expect(won).toBeGreaterThanOrEqual(5);
  });
});

describe('physical exhaustion has consequences (D-208)', () => {
  it('a fighter cannot pass the hard limit and keep fighting: the exchange that crosses it puts them out', () => {
    const cap = 5;
    let collapses = 0;
    for (let i = 0; i < 200; i++) {
      const a = forceUser('pc', 50, { meters: { p: cap * PHYSICAL_COLLAPSE.hardLimit - 0.01, f: 0 }, caps: { p: cap, f: 20 } });
      const s = resolveExchange(startDuel(a, [forceUser('b', 50)], seedRng(`ex${i}`)), REAL, 0);
      if (collapsedFromExhaustion(s.a)) {
        collapses++;
        expect(s.end?.winner).toBe('B');
        expect(s.a.out).toBe(true);
        if (!s.a.wounds.length && !s.a.dead) expect(s.end?.reason).toBe('exhausted');
        expect(s.log[0]!.notes.some((n) => n.includes('collapses from exhaustion'))).toBe(true);
      }
    }
    expect(collapses).toBe(200);
  });
  it('a long run never shows a fighter still fighting past the limit; a minion collapses too', () => {
    const r = runUntilBeat(startDuel(forceUser('pc', 50, { vitality: 1e9, maxVitality: 1e9, caps: { p: 2, f: 20 } }), [forceUser('b', 50, { vitality: 1e9, maxVitality: 1e9, caps: { p: 50, f: 20 } })], seedRng('long')), REAL, 0, 'toEnd');
    for (const rec of r.state.log.slice(0, -1)) expect(rec.notes.some((n) => n.includes('collapses'))).toBe(false);
    if (r.state.end?.reason === 'exhausted') expect(r.state.a.meters.p).toBeLessThanOrEqual(2 * PHYSICAL_COLLAPSE.hardLimit + 0.2);
    const m = resolveExchange(startDuel(forceUser('pc', 50), [{ ...droid('d1'), meters: { p: 4.6 * PHYSICAL_COLLAPSE.hardLimit - 0.01, f: 0 } }], seedRng('min')), REAL, 0);
    expect(m.opponents[0]!.out).toBe(true);
    expect(m.end?.winner).toBe('A');
  });
});

describe('the safety cap (D-208)', () => {
  it(`a real fight still undecided at ${FIGHT_SAFETY_CAP.exchanges} exchanges ends as an exhausted stalemate, both sides Spent`, () => {
    const s0 = { ...startDuel(forceUser('pc', 50), [forceUser('b', 50)], seedRng('cap')), exchange: FIGHT_SAFETY_CAP.exchanges - 1 };
    const s = resolveExchange(s0, REAL, 0);
    if (s.end && s.end.reason !== 'stalemate') return; // the last exchange decided it on its own
    expect(s.end).toEqual({ winner: null, reason: 'stalemate' });
    expect(s.a.vitality).toBe(0);
    expect(s.opponents[0]!.vitality).toBe(0);
    expect(s.log[0]!.notes.some((n) => n.includes('exhausted stalemate'))).toBe(true);
  });
  it('a sparring session is exempt (its own budget)', () => {
    const s0 = { ...startDuel(forceUser('pc', 50), [forceUser('b', 50)], seedRng('cap2')), exchange: FIGHT_SAFETY_CAP.exchanges + 5 };
    const s = resolveExchange(s0, { ...REAL, sparring: 'trainingSaber' }, 0);
    expect(s.end?.reason).not.toBe('stalemate');
  });
});
