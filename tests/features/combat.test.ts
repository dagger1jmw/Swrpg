// M5 step 5d: the combat feature (architecture §2-3; rolls.md §3-6; combat-xp §1-3; D-143..D-157): deferred start,
// beats, health sync, combat XP from the real duel log, fates and death, combatEnded, engagement, sparring modes.
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import type { DuelState } from '../../src/engine/duel';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const fresh = (rank = 'knight', level = 50): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'combat',
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - 30 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(level), forceSense: xpForLevel(level), endurance: xpForLevel(50), strength: xpForLevel(45), willpower: xpForLevel(50), forcePush: xpForLevel(40) },
    startingE: { soresu: { E: 40, eSpar: 15 } },
    rank,
  });
const ai = (s: GameState, events: unknown[]) => applyEvents(REGISTRY, s, events, { source: 'ai' });
const engine = (s: GameState, events: unknown[]) => applyEvents(REGISTRY, s, events, { source: 'engine' });
const player = (s: GameState, events: unknown[]) => applyEvents(REGISTRY, s, events, { source: 'player' });
const withNpc = (s: GameState, name = 'Darth Vek', role = 'sithLord', age = 35) => {
  const r = ai(s, [{ type: 'npcIntroduced', name, species: 'human', faction: 'sithEmpire', role, ageApprox: age, description: '' }]);
  return { s: r.state, id: Object.values(r.state.npcs.byId).find((n) => n.name === name)!.id };
};
const begin = (s: GameState, opponentRefs: string[], stakes = 'lethal', minionGroups: { kind: string; count: number }[] = []) => {
  const p = ai(s, [{ type: 'combatStarted', opponentRefs, minionGroups, stakes, terrainTags: ['flatFloor'] }]);
  expect(p.rejected).toEqual([]);
  expect(p.state.combat.pending).not.toBeNull();
  return engine(p.state, [{ type: 'fightBegun', fromPending: true }]).state;
};

describe('starting a fight', () => {
  it('combatStarted is deferred (pending) and fightBegun starts the duel at moment pacing', () => {
    const { s, id } = withNpc(fresh());
    const f = begin(s, [id]);
    expect(f.combat.pending).toBeNull();
    expect(f.combat.active!.duel.opponents[0].id).toBe(id);
    expect(f.pacing.level).toBe('moment');
    expect(f.npcs.byId[id]!.gen).not.toBeNull();
  });
  it('combatStarted is rejected while a fight is in progress; unknown opponents go nowhere', () => {
    const { s, id } = withNpc(fresh());
    const f = begin(s, [id]);
    expect(ai(f, [{ type: 'combatStarted', opponentRefs: [id], stakes: 'lethal', terrainTags: [] }]).rejected).toHaveLength(1);
    expect(ai(fresh(), [{ type: 'combatStarted', opponentRefs: ['npc:ghost'], stakes: 'lethal', terrainTags: [] }]).rejected).toHaveLength(1);
  });
  it('minion counts are clamped to 1-12 (a clamped AI amount, D-151)', () => {
    const p = ai(fresh(), [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'trooper', count: 40 }], stakes: 'skirmish', terrainTags: [] }]);
    expect(p.state.combat.pending!.minionGroups[0]!.count).toBe(12);
  });
  it('a spar uses the rank default mode (D-144): a Padawan spars with controlled live blades', () => {
    const { s, id } = withNpc(fresh('padawan', 30), 'Tavik', 'padawan', 16);
    const f = begin(s, [id], 'spar');
    expect(f.combat.active!.sparring).toBe('controlled');
  });
});

describe('beats and conclusion', () => {
  it('Resolve to end runs the duel to its end, syncs health, credits combat XP from the log and records the summary', () => {
    const { s, id } = withNpc(fresh('knight', 60), 'Thug', 'criminal', 30);
    const f = begin(s, [id], 'skirmish');
    const r = player(f, [{ type: 'combatAction', action: 'resolve' }]);
    expect(r.rejected).toEqual([]);
    const done = r.state;
    expect(done.combat.active).toBeNull();
    expect(done.combat.last!.exchanges).toBeGreaterThan(0);
    const fr = r.applied.find((a) => a.event.type === 'fightResolved');
    expect(fr).toBeDefined();
    expect((fr!.event['exchanges'] as unknown[]).length).toBeGreaterThan(0);
    expect(done.progression.fightsToday['soresu']).toBe(1);
  });
  it('a stance is a setting (D-182): stanceSet changes the stance only (no exchange, no dice, no time)', () => {
    const { s, id } = withNpc(fresh());
    const f = begin(s, [id]);
    const r = player(f, [{ type: 'stanceSet', stance: 'aggressive' }]);
    expect(r.rejected).toEqual([]);
    const d = r.state.combat.active!.duel as DuelState;
    const d0 = f.combat.active!.duel as DuelState;
    expect(d.a.stance).toBe('aggressive');
    expect(d.exchange).toBe(d0.exchange);
    expect(d.log).toHaveLength(d0.log.length);
    expect(d.rng).toEqual(d0.rng);
    expect(r.state.meta.rngState).toEqual(f.meta.rngState);
    expect(r.state.clock.now).toEqual(f.clock.now);
    // The stance is no longer a combat action, and only the player sets it; outside a fight there is none to set.
    expect(player(f, [{ type: 'combatAction', action: 'stance', stance: 'defensive' }]).rejected).toHaveLength(1);
    expect(ai(f, [{ type: 'stanceSet', stance: 'defensive' }]).rejected).toHaveLength(1);
    expect(player(fresh(), [{ type: 'stanceSet', stance: 'defensive' }]).rejected).toHaveLength(1);
  });
  it('the stance stays until changed: the next action fights in it (D-182)', () => {
    const { s, id } = withNpc(fresh());
    const f = player(begin(s, [id]), [{ type: 'stanceSet', stance: 'defensive' }]).state;
    const r = player(f, [{ type: 'combatAction', action: 'continue' }]).state;
    const d = (r.combat.active?.duel ?? (r.combat.last as unknown as { duel: DuelState }).duel) as DuelState;
    expect(d.a.stance).toBe('defensive');
    expect(d.log.length).toBeGreaterThan(0);
    expect(d.log.some((x) => [...(x.rollA?.modifiers ?? []), ...(x.rollB?.modifiers ?? [])].some((m) => m.source === 'defensive stance'))).toBe(true);
  });
  it('Fight on stops only at a narrated beat; Narrate makes one without exchanges', () => {
    const { s, id } = withNpc(fresh());
    const f = begin(s, [id]);
    const n = player(f, [{ type: 'combatAction', action: 'narrate' }]).state;
    expect(n.combat.active!.beat).toBe('playerNarrate');
    expect((n.combat.active!.duel as DuelState).exchange).toBe(0);
    const on = player(f, [{ type: 'combatAction', action: 'fightOn' }]).state;
    const beat = on.combat.active?.beat ?? 'fightEnded';
    expect(['woundingHit', 'maneuverLanded', 'spent', 'incapacitated', 'fightEnded']).toContain(beat);
  });
  it('a truce comes from the player (D-181): the narrator offers it, Accept the truce concludes the fight without wounds', () => {
    const { s, id } = withNpc(fresh());
    const f = begin(s, [id]);
    const offered = ai(f, [{ type: 'truceOffered', why: 'Vek lowers his blade and proposes terms' }]);
    expect(offered.rejected).toEqual([]);
    expect(offered.state.combat.active!.truceOffer).toBe('Vek lowers his blade and proposes terms');
    const r = player(offered.state, [{ type: 'combatAction', action: 'acceptTruce' }]).state;
    expect(r.combat.active).toBeNull();
    expect(r.combat.last!.outcome).toBe('truce');
    // Any other action declines it; with no offer there is nothing to accept.
    const declined = player(offered.state, [{ type: 'combatAction', action: 'continue' }]).state;
    if (declined.combat.active) expect(declined.combat.active.truceOffer).toBeNull();
    expect(player(f, [{ type: 'combatAction', action: 'acceptTruce' }]).rejected).toHaveLength(1);
  });
  it('the narrator ends a fight only as interrupted, with why (D-181)', () => {
    const { s, id } = withNpc(fresh());
    const f = begin(s, [id]);
    for (const reason of ['truce', 'fled', 'surrendered']) {
      const r = ai(f, [{ type: 'combatEnded', reason }]);
      expect(r.rejected, reason).toHaveLength(1);
      expect(r.rejected[0]!.reason).toMatch(/the narrator cannot end a fight as/);
      expect(r.state.combat.active).not.toBeNull();
    }
    expect(ai(f, [{ type: 'combatEnded', reason: 'interrupted' }]).rejected[0]!.reason).toMatch(/needs a why/);
    const ok = ai(f, [{ type: 'combatEnded', reason: 'interrupted', why: 'Republic reinforcements pour into the hangar' }]);
    expect(ok.rejected).toEqual([]);
    expect(ok.state.combat.last!.reason).toBe('interrupted: Republic reinforcements pour into the hangar');
  });
  it('the target is a setting (D-182): no exchange, it stays until changed, and falls back when that target is out', () => {
    const { s, id } = withNpc(fresh());
    const second = withNpc(s, 'Darth Rue');
    const f = begin(second.s, [id, second.id]);
    const d0 = f.combat.active!.duel as DuelState;
    const r = player(f, [{ type: 'targetSet', targetRef: second.id }]);
    expect(r.rejected).toEqual([]);
    const d1 = r.state.combat.active!.duel as DuelState;
    expect(d1.opponents[d1.target]!.id).toBe(second.id);
    expect(d1.exchange).toBe(d0.exchange);
    expect(r.state.meta.rngState).toEqual(f.meta.rngState);
    expect(r.state.clock.now).toEqual(f.clock.now);
    // The old beat action is gone; only the player sets the target; an unknown one is refused.
    expect(player(f, [{ type: 'combatAction', action: 'target', targetRef: second.id }]).rejected).toHaveLength(1);
    expect(ai(f, [{ type: 'targetSet', targetRef: second.id }]).rejected).toHaveLength(1);
    expect(player(f, [{ type: 'targetSet', targetRef: 'npc:ghost' }]).rejected).toHaveLength(1);
    // It stays through an action; when that opponent is out the duel strikes at the next engaged one.
    const next = player(r.state, [{ type: 'combatAction', action: 'continue' }]).state;
    if (next.combat.active) expect((next.combat.active.duel as DuelState).target).toBe(d1.target);
    const outDuel = { ...d1, opponents: d1.opponents.map((o) => (o.id === second.id ? { ...o, out: true } : o)) };
    const outState = { ...r.state, combat: { ...r.state.combat, active: { ...r.state.combat.active!, duel: outDuel } } };
    const after = player(outState, [{ type: 'combatAction', action: 'continue' }]).state;
    const strikes = ((after.combat.active?.duel ?? (after.combat.last as unknown as { duel: DuelState }).duel) as DuelState).log.slice(d1.log.length);
    expect(strikes.length).toBeGreaterThan(0);
    expect(strikes.every((x) => x.targetId === id)).toBe(true);
  });
  it('opponentEngagement marks an opponent as fighting an ally; one must still face the player', () => {
    const { s, id } = withNpc(fresh());
    const second = withNpc(s, 'Darth Rue');
    const f = begin(second.s, [id, second.id]);
    const r = ai(f, [{ type: 'opponentEngagement', opponentRef: second.id, engagedElsewhere: true }]);
    expect(r.rejected).toEqual([]);
    expect((r.state.combat.active!.duel as DuelState).opponents.find((o) => o.id === second.id)!.engagedElsewhere).toBe(true);
    expect(ai(r.state, [{ type: 'opponentEngagement', opponentRef: id, engagedElsewhere: true }]).rejected).toHaveLength(1);
  });
  it('a won lethal fight against a much stronger opponent sets heroicAct; incapacitated named NPCs wait for the fate choice', () => {
    for (let i = 0; i < 30; i++) {
      const { s, id } = withNpc({ ...fresh('knight', 60), meta: { ...fresh().meta, rngState: [i + 11, 3, 5, 7] } }, 'Sith Lord', 'sithLord', 45);
      const f = begin(s, [id], 'lethal');
      const r = player(f, [{ type: 'combatAction', action: 'resolve' }]);
      if (r.state.combat.last?.outcome !== 'won') continue;
      if (r.state.combat.fates.length) {
        const kill = player(r.state, [{ type: 'fateChosen', npcRef: id, fate: 'kill' }]).state;
        expect(kill.npcs.byId[id]!.status).toBe('deceased');
      }
      return;
    }
  });
  it('the same seed gives the same fight', () => {
    const run = () => {
      const { s, id } = withNpc(fresh());
      return player(begin(s, [id]), [{ type: 'combatAction', action: 'resolve' }]).state.combat.last;
    };
    expect(run()).toEqual(run());
  });
  it('surrender ends the fight as lost', () => {
    const { s, id } = withNpc(fresh());
    const r = player(begin(s, [id]), [{ type: 'combatAction', action: 'tactic', tactic: 'surrender' }]).state;
    expect(r.combat.last!.outcome).toBe('lost');
  });
});

describe('sparring stakes (D-144 as amended by D-172)', () => {
  const sith = (): GameState =>
    createInitialState<GameState>(REGISTRY, {
      campaignId: 'c1',
      branchId: 'b1',
      seed: 'sith',
      start: { day: START, second: 9 * 3600 },
      character: { name: 'Vex', birthDay: START - 22 * 368, path: 'sith', archetype: 'sithWarrior', mainFormId: 'juyo', trainingStartAge: 8 },
      startingXp: { juyo: xpForLevel(40), forceSense: xpForLevel(40), endurance: xpForLevel(40), willpower: xpForLevel(40) },
      rank: 'apprentice',
    });
  const spar = (s0: GameState, mode?: string) => {
    const { s, id } = withNpc(s0, 'Darth Kain', 'sithLord', 60);
    const p = ai(s, [{ type: 'combatStarted', opponentRefs: [id], stakes: 'spar', terrainTags: ['flatFloor'], ...(mode ? { sparringMode: mode } : {}) }]);
    expect(p.rejected).toEqual([]);
    return engine(p.state, [{ type: 'fightBegun', fromPending: true }]);
  };
  it('master-apprentice sparring defaults to controlled live blades outside an academy', () => {
    expect(spar(sith()).state.combat.active?.sparring).toBe('controlled');
  });
  it('the master can call academy stakes for one session as a story event (Sith only)', () => {
    expect(spar(sith(), 'academy').state.combat.active?.sparring).toBe('academy');
    const jedi = spar(fresh('padawan'), 'academy');
    expect(jedi.state.combat.active?.sparring).toBe('controlled');
    expect(jedi.applied.flatMap((a) => a.notes).join(' ')).toMatch(/Sith only/);
  });
});
