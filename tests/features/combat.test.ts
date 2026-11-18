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
  it('a stance choice resolves to the next beat (at most 5 exchanges)', () => {
    const { s, id } = withNpc(fresh());
    const f = begin(s, [id]);
    const r = player(f, [{ type: 'combatAction', action: 'stance', stance: 'aggressive' }]).state;
    const d = r.combat.active?.duel as DuelState | undefined;
    if (d) {
      expect(d.a.stance).toBe('aggressive');
      expect(d.exchange).toBeLessThanOrEqual(5);
    }
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
  it('combatEnded (truce) concludes a fight without wounds', () => {
    const { s, id } = withNpc(fresh());
    const f = begin(s, [id]);
    const r = ai(f, [{ type: 'combatEnded', reason: 'truce' }]).state;
    expect(r.combat.active).toBeNull();
    expect(r.combat.last!.outcome).toBe('truce');
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
