import { describe, expect, it } from 'vitest';
import { absDayFromDate, DAYS_PER_YEAR } from '../../src/engine/calendar';
import { selectMajorLocationId } from '../../src/features/locations/selectors';
import { relationshipLabel, selectRelationshipLabel } from '../../src/features/relationships/selectors';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate({ year: -3661, month: 1, day: 1 });
const fresh = (): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: 's',
    start: { day: START, second: 7 * 3600 },
    character: { name: 'Kael', birthDay: START - 14 * DAYS_PER_YEAR },
  });
const ai = (state: GameState, events: unknown[]) => applyEvents(REGISTRY, state, events, { source: 'ai' });
const orren = { type: 'npcIntroduced', key: 'tmp:1', name: 'Master Orren Vash', species: 'human', faction: 'jediOrder', role: 'jediMaster', ageApprox: 52, description: 'Grey-bearded, patient.' };

describe('npcs', () => {
  it('introduces an NPC with a stable ID and a derived birth day', () => {
    const r = ai(fresh(), [orren]);
    expect(r.rejected).toEqual([]);
    const npc = r.state.npcs.byId['npc:orren-vash']!;
    expect(npc.name).toBe('Master Orren Vash');
    expect(npc.birthDay).toBe(START - 52 * DAYS_PER_YEAR);
    expect(r.tempMap['tmp:1']).toBe('npc:orren-vash');
  });
  it('an exact alias match never creates a duplicate', () => {
    const s = ai(fresh(), [orren]).state;
    const r = ai(s, [{ ...orren, key: undefined, name: 'orren vash' }]);
    expect(Object.keys(r.state.npcs.byId)).toEqual(['npc:orren-vash']);
    expect(r.applied[0]!.notes[0]).toMatch(/matched existing/);
  });
  it('rejects unregistered enums and AI deaths', () => {
    const s = ai(fresh(), [orren]).state;
    const r = ai(s, [
      { ...orren, name: 'X', species: 'gungan' },
      { type: 'npcStatusChanged', npcRef: 'npc:orren-vash', state: 'deceased' },
    ]);
    expect(r.applied).toHaveLength(0);
    expect(r.rejected).toHaveLength(2);
  });
  it('status changes resolve refs by alias; unknown refs go to unknownRefs', () => {
    const s = ai(fresh(), [orren]).state;
    const r = ai(s, [
      { type: 'npcStatusChanged', npcRef: 'Master Orren Vash', state: 'departed' },
      { type: 'npcStatusChanged', npcRef: 'Tarsk', state: 'dormant' },
    ]);
    expect(r.state.npcs.byId['npc:orren-vash']!.status).toBe('departed');
    expect(r.unknownRefs.map((u) => u.name)).toEqual(['Tarsk']);
  });
  it('player aliases map review names to an NPC', () => {
    const s = ai(fresh(), [orren]).state;
    const r = applyEvents(REGISTRY, s, [{ type: 'npcAliasAdded', npcRef: 'npc:orren-vash', alias: 'the old master' }], { source: 'player' });
    expect(r.state.npcs.byId['npc:orren-vash']!.aliases).toEqual(['the old master']);
    expect(ai(r.state, [{ type: 'npcStatusChanged', npcRef: 'The Old Master', state: 'dormant' }]).rejected).toEqual([]);
  });
});

describe('relationships (D-82)', () => {
  it('scales the delta, clamps, and derives labels', () => {
    let s = ai(fresh(), [orren, { type: 'relationshipChanged', npcRef: 'tmp:1', delta: 3, reason: 'kept a promise' }]).state;
    expect(s.relationships.byNpcId['npc:orren-vash']!.value).toBe(15);
    expect(selectRelationshipLabel(s, 'npc:orren-vash')).toBe('neutral');
    for (let i = 0; i < 40; i++) s = ai(s, [{ type: 'relationshipChanged', npcRef: 'npc:orren-vash', delta: 3, reason: 'r' }]).state;
    expect(s.relationships.byNpcId['npc:orren-vash']!.value).toBe(100);
    expect(relationshipLabel(-60)).toBe('hostile');
    expect(relationshipLabel(-20)).toBe('unfriendly');
    expect(relationshipLabel(60)).toBe('close');
  });
  it('one change per NPC per reply (D-36)', () => {
    const s = ai(fresh(), [orren]).state;
    const r = ai(s, [
      { type: 'relationshipChanged', npcRef: 'npc:orren-vash', delta: 3, reason: 'a' },
      { type: 'relationshipChanged', npcRef: 'npc:orren-vash', delta: 3, reason: 'b' },
    ]);
    expect(r.state.relationships.byNpcId['npc:orren-vash']!.value).toBe(15);
  });
});

describe('locations', () => {
  const coruscant = { type: 'locationIntroduced', key: 'tmp:1', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: 'City-planet.', moveHere: false };
  const temple = { type: 'locationIntroduced', key: 'tmp:2', name: 'Jedi Temple', kind: 'building', region: 'Coruscant', parentRef: 'tmp:1', description: 'Spires.', moveHere: true };

  it('creates places with parents and moves the character', () => {
    const r = ai(fresh(), [coruscant, temple]);
    expect(r.rejected).toEqual([]);
    expect(r.state.locations.currentId).toBe('loc:jedi-temple');
    expect(r.state.locations.byId['loc:jedi-temple']!.parentId).toBe('loc:coruscant');
    expect(r.state.locations.byId['loc:jedi-temple']!.firstVisitDay).toBe(START);
    expect(r.state.locations.byId['loc:coruscant']!.firstVisitDay).toBeNull();
  });
  it('derives the major location from CHAPTER_PLACE_KINDS', () => {
    const s = ai(fresh(), [coruscant, temple]).state;
    expect(selectMajorLocationId(s, 'loc:jedi-temple')).toBe('loc:coruscant');
  });
  it('locationChanged needs a known place', () => {
    const s = ai(fresh(), [coruscant, temple]).state;
    expect(ai(s, [{ type: 'locationChanged', locationRef: 'Coruscant' }]).state.locations.currentId).toBe('loc:coruscant');
    expect(ai(s, [{ type: 'locationChanged', locationRef: 'Tython' }]).unknownRefs[0]!.name).toBe('Tython');
  });
});

describe('threads', () => {
  it('opens with an engine-mapped deadline, progresses and resolves', () => {
    let r = ai(fresh(), [orren, { type: 'threadOpened', key: 'tmp:2', title: 'The missing holocron', stakes: 'Trust of the Archives', deadlineHint: 'weeks', entityRefs: ['tmp:1', 'Nobody'] }]);
    const t = r.state.threads.byId['thread:the-missing-holocron']!;
    expect(t.deadlineDay).toBe(START + 14);
    expect(t.entityRefs).toEqual(['npc:orren-vash']);
    expect(r.unknownRefs.map((u) => u.name)).toEqual(['Nobody']);
    r = ai(r.state, [{ type: 'threadProgressed', threadRef: 'thread:the-missing-holocron', note: 'A clue in the stacks.' }]);
    r = ai(r.state, [{ type: 'threadResolved', threadRef: 'The missing holocron', outcome: 'resolved', note: 'Returned.' }]);
    expect(r.state.threads.byId['thread:the-missing-holocron']).toMatchObject({ status: 'resolved', notes: ['A clue in the stacks.', 'Returned.'] });
    expect(ai(r.state, [{ type: 'threadProgressed', threadRef: 'thread:the-missing-holocron', note: 'x' }]).rejected[0]!.reason).toMatch(/is resolved/);
  });
});

describe('saves from before M2', () => {
  it('load with empty entity slices', () => {
    const env = makeEnvelope(REGISTRY, fresh(), 'now') as unknown as { featureVersions: Record<string, number>; state: Record<string, unknown> };
    for (const id of ['npcs', 'relationships', 'locations', 'threads']) {
      delete env.featureVersions[id];
      delete env.state[id];
    }
    const loaded = loadEnvelope(REGISTRY, env);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.state.npcs).toEqual({ byId: {} });
  });
});
