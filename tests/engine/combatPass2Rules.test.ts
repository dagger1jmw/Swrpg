// D-212 (combat pass 2, issues 4, 6, 8 and 11): the opponent's initiative stops a sequence before its step; the
// opponents' exchange during a Force action never "gains ground" unless the track moved; the narrator's hazards in a
// fight do no damage and are never applied twice; an opponent fighting an ally never faces the player.
import { describe, expect, it } from 'vitest';
import { resolveExchange, startDuel, type DuelState, type ExchangeRecord, type Fighter } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { runSequence, type ForceProfile } from '../../src/engine/sequence';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { buildUpLead, combatFacts } from '../../src/turn/combatFacts';
import { targetFromText, type CombatDraft, type CombatFighterView } from '../../src/turn/combatTurn';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { forceUser, REAL } from '../support/duelSim';
import { devCharacter } from '../support/fightHarness';

const force: ForceProfile = { levelOf: () => 40, ciOf: () => 20, forceOutput: 30, trickLevel: 40 };

describe("the opponent's initiative (D-199 as confirmed after pass 2; D-212)", () => {
  it('a sequence begun at -3: the opponent strikes, step 1 is NOT REACHED with that reason, the chain stops', () => {
    for (let i = 0; i < 30; i++) {
      const duel = { ...startDuel(forceUser('pc', 50), [forceUser('d2', 50)], seedRng(`ini${i}`)), advantage: -3 };
      const r = runSequence({ duel, patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'strike', aim: 'rightLeg' }, { kind: 'strike', aim: 'rightLeg' }, { kind: 'maneuver', maneuver: 'position' }], 3, {}, force);
      expect(r.lines[0]).toMatch(/^step 1 strike \(aimed at the right leg\): NOT REACHED \(d2 had the initiative and struck first \(#1: /);
      expect(r.lines.slice(1).every((l) => / NOT REACHED \(d2 had the initiative and struck first/.test(l))).toBe(true);
      expect(r.state.duel.log).toHaveLength(1);
      expect(r.state.duel.log[0]!.striker).toBe('B');
      expect(r.state.duel.a.aim ?? null).toBe(null);
      expect(['opponentStrike', 'fightEnded']).toContain(r.stopReason);
    }
  });
  it('a Force step still resolves first at -3 (its own opponents\' exchange follows)', () => {
    const duel = { ...startDuel(forceUser('pc', 50), [forceUser('d2', 50)], seedRng('fs')), advantage: -3 };
    const r = runSequence({ duel, patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'forceAction', action: 'push' }], 3, {}, force);
    expect(r.lines[0]).toMatch(/^step 1 Force push: (DONE|FAILED)/);
  });
});

describe("the opponents' exchange during a Force action (D-212)", () => {
  const rec = (o: Partial<ExchangeRecord>): Pick<ExchangeRecord, 'margin' | 'advBefore' | 'advAfter' | 'duringForce'> => ({ margin: 0, advBefore: 0, advAfter: 0, ...o });
  it('the pass-2 cards: a won roll that held the track is "holds: no gain", never "gains ground"', () => {
    expect(buildUpLead(rec({ margin: 5.7, advBefore: 3, advAfter: 3, duringForce: true }), 'Kael Voss', 'B1 battle droid 1')).toBe('Kael Voss holds: no gain (Kael Voss only defends while using the Force)');
    expect(buildUpLead(rec({ margin: 11.2, advBefore: 0, advAfter: 0, duringForce: true }), 'Kael Voss', 'Duelist 5')).toMatch(/^Kael Voss holds: no gain/);
    expect(buildUpLead(rec({ margin: -9.6, advBefore: 0, advAfter: -3, duringForce: true }), 'Daro Venn', 'Yuuzhan Vong Warrior')).toBe('Yuuzhan Vong Warrior gains ground (reason: Daro Venn was outpaced)');
  });
  it('outside a Force action: a won roll at the end of the track presses with no gain; a real move gains; a tie holds', () => {
    expect(buildUpLead(rec({ margin: 6, advBefore: 5, advAfter: 5 }), 'A', 'B')).toBe('A presses: no gain (the track does not move)');
    expect(buildUpLead(rec({ margin: 4.7, advBefore: 0, advAfter: 1 }), 'A', 'B')).toBe('A gains ground (reason: B gave ground)');
    expect(buildUpLead(rec({ margin: 0.6, advBefore: 2, advAfter: 1 }), 'A', 'B')).toBe('neither gains ground (reason: both held)');
  });
  it('the block line for a real D-204 exchange never says the defending player gained ground', () => {
    const view = (f: Fighter): CombatFighterView => ({ id: f.id, name: f.name, vitality: f.vitality, maxVitality: f.maxVitality, status: 'Healthy', out: false, engagedElsewhere: false, minion: f.minion, weapon: f.weapon, form: f.form, lostParts: [] });
    for (let i = 0; i < 60; i++) {
      const pc = forceUser('pc', 70);
      const d = forceUser('d1', 20, { minion: true, weapon: 'blasterRifle', form: null });
      const s = resolveExchange(startDuel(pc, [d], seedRng(`df${i}`)), REAL, 0, { duringForce: true });
      const c = { fightId: 'f', started: false, records: s.log as ExchangeRecord[], narrate: s.log as ExchangeRecord[], beat: 'forceAction', quiet: false, quietLine: null, ended: null, session: null, advantage: s.advantage, fighters: [view(pc), view(d)], notes: [] } as CombatDraft;
      expect(combatFacts(c).lines[0]).not.toMatch(/pc gains ground/);
    }
  });
});

describe('the narrator\'s hazards in and around a fight (D-212)', () => {
  it('during a fight: applied as an event (an interruption cause) but no damage and nothing pending', async () => {
    let s = await devCharacter('knight', 30);
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'trooper', count: 2 }], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    s = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
    expect(s.combat.active).not.toBeNull();
    const r = applyEvents(REGISTRY, s, [{ type: 'hazardOccurred', hazard: 'fall', severityHint: 1, cause: 'uneven stone' }], { source: 'ai' });
    expect(r.rejected).toEqual([]);
    expect(r.state.health.pendingHazards).toEqual([]);
  });
  it('outside a fight: one hazard per reply; the second is a duplicate', async () => {
    const s = await devCharacter('knight', 30);
    const r = applyEvents(REGISTRY, s, [{ type: 'hazardOccurred', hazard: 'fall', severityHint: 1, cause: 'a ledge' }, { type: 'hazardOccurred', hazard: 'fall', severityHint: 1, cause: 'the same ledge' }], { source: 'ai' });
    expect(r.state.health.pendingHazards).toHaveLength(1);
    expect(r.rejected.map((x) => x.reason).join(' ')).toMatch(/one hazard per reply/);
  });
});

describe('an opponent fighting an ally (D-212)', () => {
  const opps = [
    { id: 'n1', name: 'Sith Duelist', out: false, engagedElsewhere: false, minion: false },
    ...[2, 3, 4, 5].map((k) => ({ id: `d${k}`, name: `B1 battle droid ${k}`, out: false, engagedElsewhere: false, minion: true })),
  ];
  it('the typed target is honoured: the pass-2 inputs pick a droid, not the Sith', () => {
    expect(targetFromText('I ignite my lightsaber and cut down the nearest war droid.', opps)).toBe('d2');
    expect(targetFromText('Master Vash steps in and takes the Sith duelist off me. I leave the Sith to him, turn to the droids and cut at the nearest one.', opps)).toBe('d2');
    expect(targetFromText('I strike at the Sith, ignoring the droids.', opps)).toBe('n1');
    expect(targetFromText('I cut at B1 battle droid 4.', opps)).toBe('d4');
    expect(targetFromText('I parry and wait.', opps)).toBe(null);
    expect(targetFromText('I cut at the Sith.', opps.map((o) => (o.id === 'n1' ? { ...o, engagedElsewhere: true } : o)))).toBe(null);
  });
  it('engine: the player\'s side ends when their own opponents are down: "opponentsDefeated"; the ally\'s opponent is never out', () => {
    let ends = 0;
    for (let i = 0; i < 40; i++) {
      let d: DuelState = startDuel(forceUser('pc', 60), [forceUser('n1', 70, { engagedElsewhere: true }), forceUser('d2', 10, { minion: true, weapon: 'blasterRifle', form: null, vitality: 20, maxVitality: 20 })], seedRng(`al${i}`));
      for (let k = 0; k < 60 && !d.end; k++) d = resolveExchange(d, REAL, 0);
      if (d.end?.winner !== 'A') continue;
      ends++;
      expect(d.end.reason).toBe('opponentsDefeated');
      expect(d.opponents[0]!.out).toBe(false);
      expect(d.log.every((r) => r.targetId !== 'n1')).toBe(true);
    }
    expect(ends).toBeGreaterThan(30);
  });
  it('through the turn: no fate choice, no heroic act and no death for the ally\'s opponent; recorded as "your opponents defeated"', async () => {
    let s = await devCharacter('knight', 30);
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Sith Duelist', species: 'human', faction: 'sithEmpire', role: 'sithLord', ageApprox: 35, description: 'a Sith duelist' }], { source: 'ai' }).state;
    const sith = Object.values(s.npcs.byId).find((n) => n.name === 'Sith Duelist')!.id;
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [sith], engagedElsewhereRefs: [sith], minionGroups: [{ kind: 'battleDroid', count: 2 }], stakes: 'lethal', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    s = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'resolve' } as CombatActionInput });
    const last = r.state.combat.last!;
    expect(last.outcome).toBe('won');
    expect(last.reason).toBe('opponentsDefeated');
    expect(r.state.combat.fates).toEqual([]);
    expect(r.state.npcs.byId[sith]!.status).toBe('active');
    expect(r.state.flags.set.some((f: string) => f.startsWith('heroicAct'))).toBe(false);
  });
});
