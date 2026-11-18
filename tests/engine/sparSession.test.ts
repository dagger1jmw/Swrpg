// Sparring sessions (Jared, D-168; rolls §3, combat-xp §6): a spar is a session of bouts up to 34 exchanges in total.
import { describe, expect, it } from 'vitest';
import { SPAR_SESSION } from '../../src/data/combat.config';
import { runUntilBeat, startDuel, type DuelContext } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { afterBout, newSession, runSession, sessionOutcome, sessionTally } from '../../src/engine/sparSession';
import { forceUser } from '../support/duelSim';

const CONTROLLED: DuelContext = { sparring: 'controlled', situations: [], footing: 0, dyingRiskStakes: false };
const TRAINING: DuelContext = { sparring: 'trainingSaber', situations: [], footing: 0, dyingRiskStakes: false };
const saber = (id: string, level: number) => forceUser(id, level, { weapon: 'trainingSaber' });

describe('sparring sessions (D-168)', () => {
  it('runs bouts until 34 exchanges in total; numbering and the log run on across bouts', () => {
    let rng = seedRng('sess');
    for (let i = 0; i < 200; i++) {
      const r = runSession(startDuel(forceUser('A', 50), [forceUser('B', 55)], rng), newSession(), CONTROLLED, 0);
      rng = r.duel.rng;
      expect(r.duel.exchange).toBeLessThanOrEqual(SPAR_SESSION.exchanges);
      expect(r.duel.log.length).toBe(r.duel.exchange);
      expect(r.duel.log.map((x) => x.n)).toEqual(Array.from({ length: r.duel.exchange }, (_, k) => k + 1));
      expect(r.session.bouts.reduce((a, b) => a + b.exchanges, 0)).toBe(r.duel.exchange);
      expect(r.session.ended).not.toBeNull();
      if (r.session.ended === 'exchanges') expect(r.duel.exchange).toBe(SPAR_SESSION.exchanges);
    }
  });
  it('a controlled bout ends on a point, so a session holds several bouts', () => {
    let rng = seedRng('bouts');
    let bouts = 0;
    for (let i = 0; i < 200; i++) {
      const r = runSession(startDuel(forceUser('A', 50), [forceUser('B', 50)], rng), newSession(), CONTROLLED, 0);
      rng = r.duel.rng;
      bouts += r.session.bouts.length;
    }
    expect(bouts / 200).toBeGreaterThan(2);
  });
  it('between bouts both sides get back part of their Vitality (config); the bout state resets', () => {
    let s = startDuel(saber('A', 50), [saber('B', 60)], seedRng('rec'));
    s = runUntilBeat(s, TRAINING, 0, 'toEnd', 400).state;
    expect(s.end).not.toBeNull();
    const r = afterBout(newSession(), s);
    if (r.next) {
      expect(r.next.a.vitality).toBeCloseTo(Math.min(s.a.maxVitality, s.a.vitality + SPAR_SESSION.recoverBetweenBouts * s.a.maxVitality), 6);
      expect(r.next.end).toBeNull();
      expect(r.next.advantage).toBe(0);
      expect(r.next.exchange).toBe(s.exchange);
      expect(r.session.bouts).toHaveLength(1);
      expect(r.session.boutStart).toBe(s.exchange);
    } else expect(r.session.ended).not.toBeNull();
  });
  it('a real injury (an accident) ends the session early', () => {
    let s = startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng('inj'));
    s = { ...s, end: { winner: 'B', reason: 'point' }, a: { ...s.a, wounds: [{ id: 'w', part: 'torso', severity: 'critical', W: 40, stabilized: false, healProgress: 0, day: 0, source: 'accident' }] } };
    expect(afterBout(newSession(), s).session.ended).toBe('injury');
  });
  it('the outcome is the bout tally: more won is won, more lost is lost, equal is a truce', () => {
    const sess = (w: ('A' | 'B' | null)[]) => ({ ...newSession(), bouts: w.map((winner) => ({ winner, reason: 'point', exchanges: 5 })) });
    expect(sessionOutcome(sess(['A', 'A', 'B']))).toBe('won');
    expect(sessionOutcome(sess(['A', 'B', 'B', null]))).toBe('lost');
    expect(sessionOutcome(sess(['A', 'B']))).toBe('truce');
    expect(sessionTally(sess(['A', 'B', null]))).toEqual({ won: 1, lost: 1, unfinished: 1 });
  });
});
