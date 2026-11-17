import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { keywordsUsed, SUPPORTED_KEYWORDS, toGeminiSchema } from '../../src/ai/jsonSchema';
import { SCHEMA_SIZE_CAP_CHARS } from '../../src/ai/models.config';
import { composeNarrativeSchema, narrativeEventTypes } from '../../src/ai/schemas/compose';
import { intentSchema, normalizeIntent, spanToSeconds } from '../../src/ai/schemas/intent';
import { absDayFromDate } from '../../src/engine/calendar';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const state = createInitialState<GameState>(REGISTRY, {
  campaignId: 'c',
  branchId: 'b',
  seed: 's',
  start: { day: absDayFromDate({ year: -3661, month: 1, day: 1 }), second: 25_200 },
  character: { name: 'Kael', birthDay: absDayFromDate({ year: -3675, month: 1, day: 1 }) },
});

const variants = [
  { name: 'intent', schema: intentSchema },
  { name: 'narrative (AI time)', schema: composeNarrativeSchema(REGISTRY, state, { timeAdvancedByDraft: false }).wire },
  { name: 'narrative (draft time)', schema: composeNarrativeSchema(REGISTRY, state, { timeAdvancedByDraft: true }).wire },
];

describe('response schemas (architecture §3, D-15, D-68)', () => {
  it.each(variants)('$name uses only the Gemini keyword subset and stays under the size cap', ({ schema }) => {
    const json = toGeminiSchema(schema);
    const used = keywordsUsed(json);
    for (const k of used) expect(SUPPORTED_KEYWORDS.has(k), `unsupported keyword ${k}`).toBe(true);
    expect(JSON.stringify(json).length).toBeLessThan(SCHEMA_SIZE_CAP_CHARS);
  });

  it('the sanitizer converts const and oneOf and drops stripped constraints', () => {
    const s = toGeminiSchema(z.discriminatedUnion('type', [z.object({ type: z.literal('a'), s: z.string().max(5) }), z.object({ type: z.literal('b') })]));
    const text = JSON.stringify(s);
    expect(text).not.toMatch(/"const"|"oneOf"|"maxLength"|"\$schema"|9007199254740991/);
    expect(text).toContain('"enum":["a"]');
    expect(s['anyOf']).toBeDefined();
  });

  it('leaves timeElapsed out when the TurnDraft advanced time (D-30)', () => {
    const withTime = narrativeEventTypes(REGISTRY, state, { timeAdvancedByDraft: false });
    expect(withTime).toContain('timeElapsed');
    expect(withTime).toContain('pacingSuggested');
    expect(narrativeEventTypes(REGISTRY, state, { timeAdvancedByDraft: true })).not.toContain('timeElapsed');
    const withDraft = composeNarrativeSchema(REGISTRY, state, { timeAdvancedByDraft: true }).wire;
    const reply = {
      narrative: 'x',
      choices: [
        { label: 'a', intent: { actionType: 'move' } },
        { label: 'b', intent: { actionType: 'rest' } },
      ],
      scene: { moodTags: [] },
      events: [{ type: 'timeElapsed', seconds: 60, reason: 'r' }],
    };
    expect(withDraft.safeParse(reply).success).toBe(false);
    expect(composeNarrativeSchema(REGISTRY, state, { timeAdvancedByDraft: false }).wire.safeParse(reply).success).toBe(true);
    // The parse schema keeps the reply and leaves per-event validation to applyEvents.
    expect(composeNarrativeSchema(REGISTRY, state, { timeAdvancedByDraft: true }).parse.safeParse(reply).success).toBe(true);
  });

  it('engine- and pipeline-only events never reach the AI schema', () => {
    const types = narrativeEventTypes(REGISTRY, state, { timeAdvancedByDraft: false });
    expect(types).not.toContain('pacingSet');
    expect(types).not.toContain('sceneUpdated');
  });

  it('Zod still enforces limits Gemini strips (2-5 choices, string lengths)', () => {
    const s = composeNarrativeSchema(REGISTRY, state, { timeAdvancedByDraft: false }).parse;
    const one = { narrative: 'x', choices: [{ label: 'a', intent: { actionType: 'move' } }], scene: { moodTags: [] }, events: [] };
    expect(s.safeParse(one).success).toBe(false);
  });

  it('normalizes empty optional strings from the model (live finding: skillId "")', () => {
    const i = normalizeIntent(intentSchema.parse({ actionType: 'investigate', targets: [' '], references: [], unknownNames: ['', 'Orsen'], skillId: '' }));
    expect(i).toEqual({ actionType: 'investigate', targets: [], references: [], unknownNames: ['Orsen'] });
    expect('skillId' in i).toBe(false);
  });

  it('converts requested spans to seconds', () => {
    expect(spanToSeconds({ amount: 2, unit: 'hours' })).toBe(7200);
    expect(spanToSeconds({ amount: 1.5, unit: 'minutes' })).toBe(90);
  });
});
