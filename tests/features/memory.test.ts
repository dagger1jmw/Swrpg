import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate, DAYS_PER_YEAR } from '../../src/engine/calendar';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { EventSource } from '../../src/state/types';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const fresh = (): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: 's',
    start: { day: START, second: 7 * 3600 },
    character: { name: 'Kael', birthDay: START - 14 * DAYS_PER_YEAR },
  });
const apply = (state: GameState, events: unknown[], source: EventSource = 'ai') => applyEvents(REGISTRY, state, events, { source });
const orren = { type: 'npcIntroduced', key: 'tmp:1', name: 'Master Orren Vash', species: 'human', faction: 'jediOrder', role: 'jediMaster', description: 'Patient.' };
const closed = (from: number, to: number) => ({ type: 'chapterClosed', reason: 'test', turnRange: [from, to], dayRange: [START, START], locationIds: [], entityIds: [], threadIds: [] });

describe('facts and pins', () => {
  it('records facts about NPCs (temp keys) and the player character; five per turn at most', () => {
    const r = apply(fresh(), [
      orren,
      { type: 'factLearned', aboutRef: 'tmp:1', fact: 'Orren lost his first apprentice at Alderaan.', importance: 'major' },
      { type: 'factLearned', aboutRef: 'pc', fact: 'Kael fears deep water.', importance: 'minor' },
      ...[1, 2, 3, 4].map((n) => ({ type: 'factLearned', aboutRef: 'pc', fact: `extra ${n}`, importance: 'minor' })),
    ]);
    expect(r.state.memory.facts.map((f) => f.aboutRef)).toEqual(['npc:orren-vash', 'pc', 'pc', 'pc', 'pc']);
    expect(r.rejected[0]!.reason).toMatch(/cap exceeded/);
  });
  it('a fact about an unknown name is rejected and the name queued', () => {
    const r = apply(fresh(), [{ type: 'factLearned', aboutRef: 'Tarsk', fact: 'x', importance: 'minor' }]);
    expect(r.state.memory.facts).toEqual([]);
    expect(r.unknownRefs[0]!.name).toBe('Tarsk');
  });
  it('the player pins and unpins facts', () => {
    const s = apply(fresh(), [{ type: 'factLearned', aboutRef: 'pc', fact: 'x', importance: 'minor' }]).state;
    const pinned = apply(s, [{ type: 'factPinned', factId: 'fact:1', pinned: true }], 'player').state;
    expect(pinned.memory.playerPins).toEqual(['fact:1']);
    expect(apply(pinned, [{ type: 'factPinned', factId: 'fact:1', pinned: false }], 'player').state.memory.playerPins).toEqual([]);
    expect(apply(s, [{ type: 'factPinned', factId: 'fact:1', pinned: true }], 'ai').rejected).toHaveLength(1);
  });
});

describe('scene presence', () => {
  it('stores present NPC IDs, marks them seen, drops unknown names to review', () => {
    const s = apply(fresh(), [orren]).state;
    const r = apply(s, [{ type: 'sceneUpdated', moodTags: ['calm'], presentNpcRefs: ['Master Orren Vash', 'a stranger'] }]);
    expect(r.state.pacing.scene.presentNpcIds).toEqual(['npc:orren-vash']);
    expect(r.applied.map((a) => a.event.type)).toEqual(['sceneUpdated', 'npcsSeen']);
    expect(r.unknownRefs.map((u) => u.name)).toEqual(['a stranger']);
  });
});

describe('review queue', () => {
  it('queues once per open name and resolves by the player', () => {
    let s = apply(fresh(), [{ type: 'reviewQueued', name: 'Tarsk', context: 'factLearned' }, { type: 'reviewQueued', name: 'tarsk', context: 'again' }], 'engine').state;
    expect(s.memory.review).toHaveLength(1);
    s = apply(s, [{ type: 'npcCreatedByPlayer', name: 'Tarsk' }, { type: 'reviewResolved', reviewId: 'review:1', resolution: 'created', entityRef: 'npc:tarsk' }], 'player').state;
    expect(s.memory.review[0]).toMatchObject({ status: 'created', entityId: 'npc:tarsk' });
    expect(s.npcs.byId['npc:tarsk']!.speciesId).toBe('unknown');
  });
});

describe('chapters and the arc', () => {
  it('a close starts the next chapter; a summary is written once', () => {
    let r = apply(fresh(), [{ type: 'sceneEnded', reason: 'lesson over' }]);
    expect(r.state.memory.current.signals).toHaveLength(1);
    r = apply(r.state, [closed(0, 9)], 'engine');
    expect(r.state.memory.current).toEqual({ startTurn: 10, startDay: START, signals: [] });
    expect(r.state.memory.chapters[0]!.status).toBe('summaryPending');
    const summary = { type: 'chapterSummarized', chapterId: 'chapter:1', chapterSummary: 'Kael met Orren.', arcSummary: 'A padawan begins.' };
    r = apply(r.state, [summary], 'summary');
    expect(r.state.memory.chapters[0]).toMatchObject({ status: 'closed', summary: 'Kael met Orren.' });
    expect(r.state.memory.arc).toEqual({ text: 'A padawan begins.', atChapter: 'chapter:1' });
    expect(apply(r.state, [summary], 'summary').rejected[0]!.reason).toMatch(/already has its summary/);
    expect(apply(r.state, [summary], 'ai').rejected[0]!.reason).toMatch(/source ai/);
  });
  it('rejects a close that does not start at the open chapter', () => {
    expect(apply(fresh(), [closed(3, 9)], 'engine').rejected).toHaveLength(1);
  });
  it('a late summary of an older chapter does not overwrite a newer arc', () => {
    let s = apply(fresh(), [closed(0, 4)], 'engine').state;
    s = apply(s, [closed(5, 9)], 'engine').state;
    s = apply(s, [{ type: 'chapterSummarized', chapterId: 'chapter:2', chapterSummary: 'two', arcSummary: 'arc after two' }], 'summary').state;
    s = apply(s, [{ type: 'chapterSummarized', chapterId: 'chapter:1', chapterSummary: 'one', arcSummary: 'arc after one' }], 'summary').state;
    expect(s.memory.arc).toEqual({ text: 'arc after two', atChapter: 'chapter:2' });
    expect(s.memory.chapters.map((c) => c.summary)).toEqual(['one', 'two']);
  });
});

describe('pre-M2 saves', () => {
  it('start memory at the save turn and day, and migrate pacing to v2', () => {
    const state = { ...fresh(), meta: { ...fresh().meta, turn: 7 } };
    const env = makeEnvelope(REGISTRY, state, 'now') as unknown as { featureVersions: Record<string, number>; state: Record<string, unknown> };
    delete env.featureVersions['memory'];
    delete env.state['memory'];
    env.featureVersions['pacing'] = 1;
    env.state['pacing'] = { level: 'moment', scene: { moodTags: ['calm'] } };
    const loaded = loadEnvelope(REGISTRY, env);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.memory.current).toEqual({ startTurn: 7, startDay: START, signals: [] });
    expect(loaded.state.pacing.scene).toEqual({ moodTags: ['calm'], presentNpcIds: [] });
  });
});
