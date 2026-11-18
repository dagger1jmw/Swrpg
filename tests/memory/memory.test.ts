import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate, DAYS_PER_YEAR } from '../../src/engine/calendar';
import { buildChapterClosed, decideChapterClose, type ChapterTurn } from '../../src/memory/chapterClose';
import { mentionedEntityIds, retrieveMemory } from '../../src/memory/retrieve';
import { CompositeScorer, recencyScorer, tagOverlapScorer, type MemoryItem, type MemoryQuery } from '../../src/memory/scorer';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { EventSource } from '../../src/state/types';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const est = (s: string): number => Math.ceil(s.length / 4);
const fresh = (): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: 's',
    start: { day: START, second: 7 * 3600 },
    character: { name: 'Kael', birthDay: START - 14 * DAYS_PER_YEAR },
  });
const apply = (state: GameState, events: unknown[], source: EventSource = 'ai'): GameState => {
  const r = applyEvents(REGISTRY, state, events, { source });
  if (r.rejected.length) throw new Error(JSON.stringify(r.rejected));
  return r.state;
};
/** Applies events as turn meta.turn + 1 and commits it. */
const turn = (state: GameState, events: unknown[]): GameState => {
  const s = apply(state, events);
  return { ...s, meta: { ...s.meta, turn: s.meta.turn + 1 } };
};
const npc = (name: string, key: string) => ({ type: 'npcIntroduced', key, name, species: 'human', faction: 'jediOrder', role: 'jediKnight', description: `${name}.` });
const place = (name: string, kind: string, key: string, extra: object = {}) => ({ type: 'locationIntroduced', key, name, kind, region: 'Core', description: '', moveHere: false, ...extra });

describe('chapter close policy (D-17)', () => {
  const world = (): GameState =>
    turn(fresh(), [
      place('Coruscant', 'planet', 'tmp:1'),
      place('Jedi Temple', 'building', 'tmp:2', { parentRef: 'tmp:1', moveHere: true }),
      place('Dantooine', 'planet', 'tmp:3'),
      place('Jedi Enclave', 'building', 'tmp:4', { parentRef: 'tmp:3' }),
    ]);

  it('moving within one major location does not close; a new major location closes before this turn', () => {
    let s = world();
    s = turn(s, [place('Archives', 'room', 'tmp:1', { parentRef: 'loc:jedi-temple', moveHere: true })]);
    const before = s;
    expect(decideChapterClose(fresh(), s, 0)).toBeNull();
    s = turn(s, [{ type: 'locationChanged', locationRef: 'loc:jedi-enclave' }]);
    expect(decideChapterClose(before, s, 0)).toEqual({ reason: 'major location changed (loc:coruscant -> loc:dantooine)', lastTurn: 2 });
  });
  it('a sceneEnded hint closes only with 8+ turns and only in its own turn', () => {
    let s = world();
    for (let i = 0; i < 6; i++) s = turn(s, []);
    let prev = s;
    s = turn(s, [{ type: 'sceneEnded', reason: 'done' }]); // turn 8
    expect(decideChapterClose(prev, s, 0)).toMatchObject({ lastTurn: 8 });
    // With 7 turns the hint does nothing, and it does not linger.
    let t = world();
    for (let i = 0; i < 5; i++) t = turn(t, []);
    prev = t;
    t = turn(t, [{ type: 'sceneEnded', reason: 'early' }]); // turn 7
    expect(decideChapterClose(prev, t, 0)).toBeNull();
    prev = t;
    t = turn(t, []);
    expect(decideChapterClose(prev, t, 0)).toBeNull();
  });
  it('30 turns close; a 7-day jump closes before the jump', () => {
    let s = world();
    for (let i = 0; i < 28; i++) s = turn(s, []);
    const prev = s;
    s = turn(s, []);
    expect(decideChapterClose(prev, s, 0)).toMatchObject({ reason: '30 turns', lastTurn: 30 });
    expect(decideChapterClose(prev, s, 7 * 86_400)).toMatchObject({ lastTurn: 29 });
  });
  it('tags come from the applied events and the entities created in the chapter', () => {
    let s = turn(world(), [npc('Orren', 'tmp:1'), { type: 'factLearned', aboutRef: 'tmp:1', fact: 'x', importance: 'minor' }]);
    const turns: ChapterTurn[] = [
      { turn: 1, day: START, events: [] },
      { turn: 2, day: START + 1, events: [{ type: 'factLearned', aboutRef: 'npc:orren', fact: 'x', importance: 'minor' }] },
    ];
    const e = buildChapterClosed(s, { reason: 'test', lastTurn: 2 }, turns);
    expect(e).toMatchObject({ turnRange: [0, 2], dayRange: [START, START + 1], entityIds: ['npc:orren'], locationIds: ['loc:coruscant', 'loc:dantooine', 'loc:jedi-enclave', 'loc:jedi-temple'] });
    s = apply(s, [e], 'engine');
    expect(s.memory.chapters).toHaveLength(1);
  });
});

describe('scorer', () => {
  it('composes overlap and recency', () => {
    const item: MemoryItem = { kind: 'fact', id: 'fact:1', tags: ['npc:a'], turn: 10, text: 'x' };
    const q: MemoryQuery = { turn: 10, tags: new Map([['npc:a', 'scene']]), openThreadIds: new Set() };
    expect(new CompositeScorer([tagOverlapScorer, recencyScorer]).score(item, q)).toBe(30 + 10);
  });
});

describe('memory retrieval', () => {
  const campaign = (): GameState => {
    let s = turn(fresh(), [
      npc('Master Orren Vash', 'tmp:1'),
      npc('Knight Selis Daar', 'tmp:2'),
      { type: 'factLearned', aboutRef: 'tmp:1', fact: 'Orren lost his first apprentice at Alderaan.', importance: 'major' },
      { type: 'factLearned', aboutRef: 'tmp:2', fact: 'Selis owes Kael a favor.', importance: 'minor' },
    ]);
    for (let i = 0; i < 60; i++) s = turn(s, []); // the facts are old now
    return s;
  };

  it('finds whole-word name mentions in the player text', () => {
    expect(mentionedEntityIds(campaign(), 'I go and ask Master Orren about the war.')).toEqual(['npc:orren-vash']);
    expect(mentionedEntityIds(campaign(), 'I order food.')).toEqual([]);
  });
  it('a mention pulls the NPC card and their fact; unrelated old facts stay out', () => {
    const sel = retrieveMemory(campaign(), { referencedIds: [], playerText: 'I ask Orren Vash about Alderaan.', rawFromTurn: null }, 4000, est);
    const ids = sel.included.map((s) => s.item.id);
    expect(ids.slice(0, 2).sort()).toEqual(['fact:1', 'npc:orren-vash']);
    expect(ids).not.toContain('fact:2');
    expect(sel.included.find((s) => s.item.id === 'fact:1')!.matched).toEqual(['npc:orren-vash']);
  });
  it('a referenced ID counts like a mention; pinned facts always go in', () => {
    const s = apply(campaign(), [{ type: 'factPinned', factId: 'fact:2', pinned: true }], 'player');
    const sel = retrieveMemory(s, { referencedIds: ['npc:orren-vash'], playerText: '', rawFromTurn: null }, 4000, est);
    expect(sel.included[0]!.item.id).toBe('fact:2');
    expect(sel.included[0]!.pinned).toBe(true);
    expect(sel.included.map((x) => x.item.id)).toContain('fact:1');
  });
  it('respects the cap, never splitting an item', () => {
    const sel = retrieveMemory(campaign(), { referencedIds: ['npc:orren-vash', 'npc:selis-daar'], playerText: '', rawFromTurn: null }, 30, est);
    expect(sel.tokens).toBeLessThanOrEqual(30);
    expect(sel.dropped.length).toBeGreaterThan(0);
  });
  it('skips chapter summaries whose turns are already sent raw', () => {
    let s = campaign();
    s = apply(s, [{ type: 'chapterClosed', reason: 't', turnRange: [0, 61], dayRange: [START, START], locationIds: [], entityIds: ['npc:orren-vash'], threadIds: [] }], 'engine');
    s = apply(s, [{ type: 'chapterSummarized', chapterId: 'chapter:3', chapterSummary: 'Met Orren.', arcSummary: 'Arc.' }], 'summary');
    const q = { referencedIds: ['npc:orren-vash'], playerText: '' };
    expect(retrieveMemory(s, { ...q, rawFromTurn: 50 }, 4000, est).included.map((x) => x.item.kind)).toContain('chapter');
    expect(retrieveMemory(s, { ...q, rawFromTurn: 0 }, 4000, est).included.map((x) => x.item.kind)).not.toContain('chapter');
  });
});
