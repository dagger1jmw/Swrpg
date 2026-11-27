import { LORE_TEST_YEAR as TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { CONTEXT_CAPS } from '../../src/ai/context.config';
import { keywordsUsed, SUPPORTED_KEYWORDS, toGeminiSchema } from '../../src/ai/jsonSchema';
import { SCHEMA_SIZE_CAP_CHARS } from '../../src/ai/models.config';
import { composeNarrativeSchema, narrativeEventTypes } from '../../src/ai/schemas/compose';
import { calibrate, makeEstimator, ratioFor } from '../../src/ai/tokenRatio';
import { absDayFromDate, DAYS_PER_YEAR } from '../../src/engine/calendar';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { buildIntentRequest, buildNarrativeRequest, buildSummaryRequest, stateBlock } from '../../src/turn/context';
import type { TurnRecord } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const fresh = (): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c',
    branchId: 'b',
    seed: 's',
    start: { day: START, second: 7 * 3600 },
    character: { name: 'Kael', birthDay: START - 14 * DAYS_PER_YEAR },
  });
const apply = (s: GameState, events: unknown[]): GameState => {
  const r = applyEvents(REGISTRY, s, events, { source: 'ai' });
  if (r.rejected.length) throw new Error(JSON.stringify(r.rejected));
  return r.state;
};
const world = (): GameState =>
  apply(fresh(), [
    { type: 'locationIntroduced', key: 'tmp:1', name: 'Coruscant', kind: 'planet', region: 'Coruscant', description: '', moveHere: false },
    { type: 'locationIntroduced', key: 'tmp:2', name: 'Jedi Temple', kind: 'building', region: 'Coruscant', parentRef: 'tmp:1', description: 'Spires.', moveHere: true },
    { type: 'npcIntroduced', key: 'tmp:3', name: 'Grand Master Zym', species: 'human', faction: 'jediOrder', role: 'jediMaster', description: 'Leader of the Order.' },
    { type: 'npcIntroduced', key: 'tmp:4', name: 'Master Orren Vash', species: 'human', faction: 'jediOrder', role: 'jediMaster', description: 'Patient.' },
    { type: 'factLearned', aboutRef: 'tmp:4', fact: 'Orren lost his first apprentice at Alderaan.', importance: 'major' },
    { type: 'threadOpened', key: 'tmp:5', title: 'The missing holocron', stakes: 'Trust', entityRefs: ['tmp:4'] },
    { type: 'npcCanonLinked', npcRef: 'tmp:3', canonId: 'lore:zym' },
  ].filter((e) => e.type !== 'npcCanonLinked')) as GameState;
const opts = { model: 'm', ratio: 4 };
const est = makeEstimator(4);
const rec = (turn: number, size: number): TurnRecord =>
  ({ turn, input: { kind: 'typed', text: `action ${turn}` }, narrative: 'x'.repeat(size), draft: { applied: [] }, applied: [], clockAfter: { day: START, second: 0 } }) as unknown as TurnRecord;

describe('request builder (architecture §5)', () => {
  it('every capped section stays within its cap and the report adds up', () => {
    const s = world();
    const { draft } = resolveTurn(REGISTRY, s, null);
    const history = Array.from({ length: 40 }, (_, i) => rec(i + 1, 3000));
    const req = buildNarrativeRequest(s, draft, { kind: 'typed', text: 'I ask Master Orren about Satele Shan' }, history, opts);
    for (const sec of req.report.sections) if (sec.cap !== null) expect(sec.tokens, sec.name).toBeLessThanOrEqual(sec.cap);
    expect(req.report.estimatedTokens).toBe(req.report.sections.reduce((a, x) => a + x.tokens, 0));
    expect(req.report.chars).toBe(req.system.length + req.messages.reduce((a, m) => a + m.text.length, 0));
    const recent = req.report.sections.find((x) => x.name === 'recentTurns')!;
    expect(recent.included.length).toBeLessThanOrEqual(15);
    expect(recent.included.at(-1)!.id).toBe('turn 40');
  });

  it('a mention of an earlier NPC puts their card and fact in MEMORY; lore for the era and the player text in LORE', () => {
    const s = world();
    const { draft } = resolveTurn(REGISTRY, s, null);
    const req = buildNarrativeRequest(s, draft, { kind: 'typed', text: 'I ask Master Orren about Satele Shan' }, [], opts);
    // MEMORY stays in the turn's own message; LORE opens the request before the history (opt-1 C1).
    const text = req.messages.map((m) => m.text).join('\n');
    expect(req.messages.at(-1)!.text).toContain('MEMORY');
    expect(req.messages[0]!.text).toContain('LORE (Star Wars Legends, true at this date)');
    expect(text).toContain('MEMORY');
    expect(text).toContain('Orren lost his first apprentice at Alderaan.');
    expect(text).toContain('LORE (Star Wars Legends, true at this date)');
    expect(text).toContain('Blockade of the Hydian Way begins');
    expect(text).toContain('descended from Revan and Bastila Shan');
    expect(text).not.toContain('Blockade broken');
    const mem = req.report.sections.find((x) => x.name === 'memory')!;
    expect(mem.included.find((i) => i.id === 'fact:1')!.note).toContain('npc:orren-vash');
  });

  it('the state block lists valid IDs, focus first, within the cap', () => {
    const s = world();
    const b = stateBlock(s, est, CONTEXT_CAPS.state, ['npc:orren-vash']);
    expect(b.text).toContain('pc = Kael (the player character)');
    expect(b.text).toContain('Location: Jedi Temple (loc:jedi-temple), in Coruscant (loc:coruscant)');
    expect(b.report.included[0]!.id).toBe('npc:orren-vash');
    const tight = stateBlock(s, est, 140);
    expect(tight.report.dropped.length).toBeGreaterThan(0);
    expect(tight.text).toMatch(/more known entities not listed/);
  });

  it('the intent request carries the valid IDs', () => {
    const req = buildIntentRequest(world(), 'I talk to Orren', [], opts);
    expect(req.messages[0]!.text).toContain('npc:orren-vash = Master Orren Vash');
  });

  it('the summary request holds the previous arc, the chapter entities and its turns', () => {
    let s = world();
    s = applyEvents(REGISTRY, s, [{ type: 'chapterClosed', reason: 't', turnRange: [0, 2], dayRange: [START, START], locationIds: ['loc:jedi-temple'], entityIds: ['npc:orren-vash'], threadIds: [] }], { source: 'engine' }).state;
    const req = buildSummaryRequest(s, s.memory.chapters[0]!, [rec(1, 50), rec(2, 50), rec(3, 50)], opts);
    const text = req.messages[0]!.text;
    expect(text).toContain('none (this is the first chapter)');
    expect(text).toContain('npc:orren-vash: Master Orren Vash');
    expect(text).toContain('Turn 2');
    expect(text).not.toContain('Turn 3');
  });
});

describe('response schema size with every M2 event legal', () => {
  it('stays under the cap with only supported keywords', () => {
    const s = world();
    const types = narrativeEventTypes(REGISTRY, s, { timeAdvancedByDraft: false });
    for (const t of ['npcIntroduced', 'locationIntroduced', 'locationChanged', 'relationshipChanged', 'factLearned', 'threadOpened', 'threadProgressed', 'threadResolved', 'npcStatusChanged', 'sceneEnded']) {
      expect(types).toContain(t);
    }
    const json = toGeminiSchema(composeNarrativeSchema(REGISTRY, s, { timeAdvancedByDraft: false }).wire);
    for (const k of keywordsUsed(json)) expect(SUPPORTED_KEYWORDS.has(k), k).toBe(true);
    expect(JSON.stringify(json).length).toBeLessThan(SCHEMA_SIZE_CAP_CHARS);
    // D-90: maxItems on the event-union array made Gemini refuse the schema as too complex.
    expect((json['properties'] as Record<string, Record<string, unknown>>)['events']!['maxItems']).toBeUndefined();
  });
});

describe('token ratio calibration (D-86)', () => {
  it('moves toward the observed ratio and stays in range', () => {
    expect(ratioFor({}, 'm')).toBe(4);
    const r = calibrate({}, 'm', 3000, 1000);
    expect(r['m']).toBeCloseTo(4 * 0.7 + 3 * 0.3);
    expect(calibrate({}, 'm', 100_000, 10)['m']).toBe(8);
    expect(calibrate({ m: 4 }, 'm', 0, 0)).toEqual({ m: 4 });
  });
});
